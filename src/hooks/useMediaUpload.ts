import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  mediaGenerateUploadUrlCreateMutation,
  mediaConfirmUploadCreateMutation,
  mediaListQueryKey,
} from "../sdk/@tanstack/react-query.gen";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface UploadOptions {
  /** Django app label (e.g. "residents", "incidents", "accounts") */
  contentTypeApp: string;
  /** Django model name (e.g. "resident", "incident", "user") */
  contentTypeModel: string;
  /** UUID of the related object (optional — can be set per-upload) */
  objectUuid?: string | number;
  /** Description / document name stored alongside the media record */
  description?: string;
  /** Alt text for images */
  altText?: string;
}

export interface SingleUploadOptions {
  /** Override or set the object UUID for this specific upload */
  objectUuid?: string | number;
  /** Override description for this specific upload */
  description?: string;
  /** Override alt text for this specific upload */
  altText?: string;
}

export interface UploadResult {
  /** Media record ID returned by confirm-upload */
  id: string;
  /** Signed file URL (when returned by backend) */
  fileUrl?: string;
  /** S3 key */
  s3Key: string;
}

interface PresignedResponse {
  upload_url: string;
  s3_key: string;
  fields?: Record<string, string>;
}

export type UploadStatus = "uploading" | "done" | "error" | "cancelled";

export interface UploadProgressEntry {
  fileName: string;
  /** 0–100 */
  percent: number;
  status: UploadStatus;
}

/* ------------------------------------------------------------------ */
/*  Core upload-to-S3 helper (supports both POST-with-fields and PUT) */
/* ------------------------------------------------------------------ */

export const UPLOAD_CANCELLED_MESSAGE = "Upload cancelled";

// XHR instead of fetch — fetch cannot report upload progress
function uploadToS3(
  presigned: PresignedResponse,
  file: File,
  onProgress: (percent: number) => void,
  registerXhr: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    registerXhr(xhr);

    let body: FormData | File;
    if (presigned.fields) {
      // POST with form fields (S3 presigned POST)
      xhr.open("POST", presigned.upload_url);
      const formData = new FormData();
      Object.entries(presigned.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);
      body = formData;
    } else {
      // PUT with Content-Type header (S3 presigned PUT)
      xhr.open("PUT", presigned.upload_url);
      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );
      body = file;
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(`S3 upload failed: ${xhr.status} - ${xhr.responseText}`),
        );
      }
    };
    xhr.onerror = () => reject(new Error("S3 upload failed: network error"));
    xhr.onabort = () => reject(new Error(UPLOAD_CANCELLED_MESSAGE));
    xhr.send(body);
  });
}

/* ------------------------------------------------------------------ */
/*  dataUrl → File helper (for signature canvas blobs)                */
/* ------------------------------------------------------------------ */

export function dataUrlToFile(
  dataUrl: string,
  filename = "signature.png",
): File {
  if (!dataUrl || !dataUrl.startsWith("data:")) {
    throw new Error("Invalid data URL");
  }
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const byteString = atob(data);
  const uint8Array = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return new File([uint8Array], filename, { type: mime });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Shared hook for uploading files via the presigned URL flow.
 *
 * Usage:
 * ```ts
 * const { upload, isUploading } = useMediaUpload({
 *   contentTypeApp: "residents",
 *   contentTypeModel: "resident",
 *   objectUuid: residentId,
 * });
 *
 * // Upload a single file
 * const result = await upload(file, { description: "Birth Certificate" });
 * console.log(result.id); // media UUID
 *
 * // Upload multiple files
 * const results = await uploadMultiple(files);
 * ```
 */
export function useMediaUpload(options: UploadOptions) {
  const queryClient = useQueryClient();

  /**
   * Per-file upload progress, keyed by a unique upload id (so same-named
   * files don't collide). Finished entries stay (status done/error/cancelled)
   * until the whole batch completes, then the map is cleared shortly after.
   */
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, UploadProgressEntry>
  >({});
  /** Count of uploads currently in any step (generate URL, S3 upload, or confirm) */
  const [activeCount, setActiveCount] = useState(0);
  const activeRef = useRef(0);
  const uploadSeqRef = useRef(0);
  const xhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());

  const generateUploadUrl = useMutation({
    ...mediaGenerateUploadUrlCreateMutation(),
  });

  const confirmUpload = useMutation({
    ...mediaConfirmUploadCreateMutation(),
  });

  /**
   * Upload a single file via the 3-step presigned URL flow:
   * 1. Generate presigned URL from backend
   * 2. Upload file directly to S3
   * 3. Confirm upload to create Media record
   */
  const upload = async (
    file: File,
    perFileOptions?: SingleUploadOptions,
  ): Promise<UploadResult> => {
    const uploadId = `${++uploadSeqRef.current}-${file.name}`;
    const setEntry = (patch: Partial<UploadProgressEntry>) =>
      setUploadProgress((p) => {
        const existing: UploadProgressEntry = p[uploadId] ?? {
          fileName: file.name,
          percent: 0,
          status: "uploading",
        };
        return { ...p, [uploadId]: { ...existing, ...patch } };
      });

    activeRef.current += 1;
    setActiveCount((c) => c + 1);
    setEntry({});
    try {
      const result = await doUpload(
        file,
        perFileOptions,
        (percent) => setEntry({ percent }),
        (xhr) => xhrsRef.current.set(uploadId, xhr),
      );
      setEntry({ percent: 100, status: "done" });
      return result;
    } catch (error: any) {
      setEntry({
        status:
          error?.message === UPLOAD_CANCELLED_MESSAGE ? "cancelled" : "error",
      });
      throw error;
    } finally {
      xhrsRef.current.delete(uploadId);
      activeRef.current -= 1;
      setActiveCount((c) => c - 1);
      if (activeRef.current === 0) {
        // Batch finished — keep the final statuses visible briefly, then clear
        window.setTimeout(() => {
          if (activeRef.current === 0) setUploadProgress({});
        }, 2000);
      }
    }
  };

  const doUpload = async (
    file: File,
    perFileOptions: SingleUploadOptions | undefined,
    onProgress: (percent: number) => void,
    registerXhr: (xhr: XMLHttpRequest) => void,
  ): Promise<UploadResult> => {
    const objectUuid = perFileOptions?.objectUuid ?? options.objectUuid;
    const description = perFileOptions?.description ?? options.description;
    const altText = perFileOptions?.altText ?? options.altText;

    // Step 1: Generate presigned URL
    const genResp = await generateUploadUrl.mutateAsync({
      body: {
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        content_type_app: options.contentTypeApp,
        content_type_model: options.contentTypeModel,
        ...(objectUuid != null ? { object_uuid: objectUuid } : {}),
      },
    } as any);

    // Normalize response — backend may wrap in { data: {...} } or return directly
    const presigned: PresignedResponse =
      (genResp as any)?.data ?? (genResp as any);

    if (!presigned.upload_url) {
      throw new Error("Missing upload_url in presigned response");
    }

    const s3Key = presigned.s3_key ?? presigned.fields?.key;
    if (!s3Key) {
      throw new Error("Missing s3_key in presigned response");
    }

    // Step 2: Upload file directly to S3
    await uploadToS3(presigned, file, onProgress, registerXhr);

    // Step 3: Confirm upload → creates Media record
    const confResp = await confirmUpload.mutateAsync({
      body: {
        s3_key: s3Key,
        original_filename: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        content_type_app: options.contentTypeApp,
        content_type_model: options.contentTypeModel,
        ...(objectUuid != null ? { object_uuid: objectUuid } : {}),
        ...(description ? { description } : {}),
        ...(altText ? { alt_text: altText } : {}),
      },
    } as any);

    const conf = (confResp as any)?.data ?? (confResp as any);
    const id = conf?.id ?? conf?.uuid;
    if (!id) {
      throw new Error("Missing media ID in confirm response");
    }

    // Invalidate media list queries so consumers get fresh data
    queryClient.invalidateQueries({ queryKey: mediaListQueryKey() });

    return {
      id: String(id),
      fileUrl: conf?.file_url ?? conf?.url,
      s3Key,
    };
  };

  /**
   * Upload multiple files in parallel (max 3 at a time).
   * Returns an array of results in the same order as the input files.
   */
  const uploadMultiple = async (
    files: File[],
    perFileOptions?: SingleUploadOptions,
  ): Promise<UploadResult[]> => {
    const results: UploadResult[] = new Array(files.length);
    let next = 0;
    const worker = async () => {
      while (next < files.length) {
        const index = next++;
        results[index] = await upload(files[index], perFileOptions);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(3, files.length) }, worker),
    );
    return results;
  };

  /** Abort an in-flight S3 upload by upload id (key of uploadProgress). The corresponding upload() call rejects with UPLOAD_CANCELLED_MESSAGE. */
  const cancelUpload = (uploadId: string) => {
    xhrsRef.current.get(uploadId)?.abort();
  };

  return {
    /** Upload a single file. Returns { id, fileUrl, s3Key }. */
    upload,
    /** Upload multiple files in parallel (max 3 at a time). */
    uploadMultiple,
    /** Per-file upload progress entries, keyed by upload id. */
    uploadProgress,
    /** Abort an in-flight upload by upload id. */
    cancelUpload,
    /** True while any step (generate URL, S3 upload, or confirm) is in progress. */
    isUploading: activeCount > 0,
    /** Error from the most recent generate-upload-url call */
    generateError: generateUploadUrl.error,
    /** Error from the most recent confirm-upload call */
    confirmError: confirmUpload.error,
  };
}
