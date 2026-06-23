import React, { useMemo, useState, useCallback } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { Typography, Box } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "../../../../sdk/client.gen";
import { useMediaUpload } from "../../../../hooks/useMediaUpload";
import { useAuth } from "../../../../hooks/useAuth";
import { htmlToPdfFile } from "../../../../utils/htmlToPdf";
import { generateBlankROIPrintHTML } from "../../../leads/components/forms/hipaa-release/generateBlankROIPrintHTML";
import { generateNHResidencyPrintHTML } from "../../../leads/components/forms/nh-residency-agreement/generateNHResidencyPrintHTML";
import { generateHouseRulesPrintHTML } from "../../../leads/components/forms/house-rules/generateHouseRulesPrintHTML";
import { generateServiceAgreementPrintHTML } from "../../../leads/components/forms/service-agreement/generateServiceAgreementPrintHTML";
import { invalidateLeadConsentForms } from "../../../leads/utils/queryInvalidation";

import DocumentsTable from "./DocumentTableResident";
import CommonSnackbar from "../../../../components/common-snackbar/common-snackbar";
import ViewDocumentsDialog from "../../../appointments/components/ViewDocumentsDialog";
import UploadProgressPanel from "../../../../components/upload-progress-panel/upload-progress-panel";

interface DocumentsSectionProps {
  objectId: string;
  contentTypeApp: string;
  contentTypeModel: string;
  searchQuery?: string;
  signed?: boolean;
  filterDate?: Dayjs | null;
}

interface MediaItem {
  id: string;
  file_url: string;
  original_filename?: string;
  description?: string;
  file_size?: number;
  mime_type?: string;
  updated_at?: string;
  metadata?: {
    signed?: boolean;
    signed_by?: string | null;
    signed_date?: string | null;
    consent_form_uuid?: string | null;
    /** Consent entry version stamped at share time (e.g. "v1", "v2") */
    version?: string | null;
  };
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  objectId,
  contentTypeApp,
  contentTypeModel,
  searchQuery = "",
  signed,
  filterDate,
}) => {
  const queryClient = useQueryClient();
  const [viewDocOpen, setViewDocOpen] = useState(false);
  const [viewDocFiles, setViewDocFiles] = useState<MediaItem[]>([]);
  const [viewDocInitialIndex, setViewDocInitialIndex] = useState(0);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    status: "success" | "error";
  }>({ open: false, message: "", status: "success" });

  const showSnackbar = (message: string, status: "success" | "error") =>
    setSnackbar({ open: true, message, status });

  /* ========================= MEDIA LIST ========================= */
  const { data: mediaResponse, isLoading: mediaLoading } = useQuery({
    queryKey: [
      "mediaList",
      objectId,
      signed,
      filterDate ? dayjs(filterDate).format("YYYY-MM-DD") : null,
    ],
    queryFn: async () => {
      const signedParam =
        typeof signed === "boolean" ? `&signed=${signed}` : "";
      const dateParam = filterDate
        ? `&date=${dayjs(filterDate).format("YYYY-MM-DD")}`
        : "";
      const { data } = await client.get({
        url: `/api/media/?content_type=${contentTypeApp}.${contentTypeModel}&object_uuid=${objectId}${signedParam}${dateParam}`,
      });
      return data;
    },
    enabled: Boolean(objectId),
  });

  /* ========================= MAP TABLE DATA ========================= */
  const mediaItems: MediaItem[] = useMemo(() => {
    const mediaList =
      mediaResponse?.results || mediaResponse?.data?.results || [];
    return mediaList.map((m: any) => ({
      id: String(m.id),
      file_url: m.file || m.file_url,
      original_filename: m.original_filename,
      description: m.description,
      file_size: m.file_size,
      mime_type: m.mime_type || m.file_type,
      updated_at: m.updated_at,
      metadata: m.metadata,
    }));
  }, [mediaResponse]);

  const tableData = useMemo(() => {
    // Group re-shared documents so each one gets a version label.
    // Documents from the same consent form (or same name for uploads)
    // appear as "Version 1", "Version 2", … when shared more than once.
    const groupKeyOf = (m: MediaItem) =>
      m.metadata?.consent_form_uuid
        ? `cf:${m.metadata.consent_form_uuid}`
        : `doc:${(m.description || m.original_filename || "").trim().toLowerCase()}`;
    const groups = new Map<string, MediaItem[]>();
    mediaItems.forEach((m) => {
      const key = groupKeyOf(m);
      groups.set(key, [...(groups.get(key) || []), m]);
    });
    const versionLabelById = new Map<string, string>();
    groups.forEach((items) => {
      if (items.length < 2) return; // single share — no version label needed
      const sorted = [...items].sort((a, b) =>
        (a.updated_at || "").localeCompare(b.updated_at || ""),
      );
      sorted.forEach((m, idx) => {
        // Prefer the consent entry version stamped by the backend ("v2");
        // fall back to share order for uploads / older documents.
        const stamped = m.metadata?.version?.match(/^v(\d+)$/i)?.[1];
        versionLabelById.set(m.id, `Version ${stamped ?? idx + 1}`);
      });
    });

    return mediaItems.map((media, index) => {
      const baseName =
        media.description || media.original_filename || "Untitled";
      const versionLabel = versionLabelById.get(media.id);
      return {
        id: index + 1,
        mediaUuid: media.id,
        documentName: versionLabel
          ? `${baseName} (${versionLabel})`
          : baseName,
        hasFile: true,
        uploadDocument: media.original_filename,
        fileUrl: media.file_url,
        lastUpdated: media.updated_at
          ? dayjs(media.updated_at).format("MM/DD/YYYY, h:mm A")
          : "—",
        isSigned: media.metadata?.signed ?? false,
        signedBy: media.metadata?.signed_by ?? null,
        signedDate: media.metadata?.signed_date ?? null,
        documentType: media.metadata?.consent_form_uuid ? "Consent Form" as const : "Document" as const,
      };
    });
  }, [mediaItems]);

  const { user } = useAuth();

  /* ========================= UPLOAD ========================= */
  const { upload, uploadProgress, cancelUpload } = useMediaUpload({
    contentTypeApp,
    contentTypeModel,
    objectUuid: objectId,
  });

  const handleUpload = async (_documentId: number, file: File) => {
    try {
      await upload(file, { description: "Uploaded Document" });
      await queryClient.invalidateQueries({ queryKey: ["mediaList", objectId] });
      await queryClient.invalidateQueries({ queryKey: ["media-unsigned-count", objectId] });
      showSnackbar("Document uploaded successfully", "success");
    } catch {
      showSnackbar("Failed to upload document. Please try again.", "error");
    }
  };

  const handlePrint = (url: string) => {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    win?.print();
  };

  const handleDownload = (id: number) => {
    const row = tableData.find((d) => d.id === id);
    if (!row?.fileUrl) return;
    const link = document.createElement("a");
    link.href = row.fileUrl;
    link.download = row.uploadDocument || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /** Build print HTML for a consent form using the existing generators */
  const buildFormHTML = useCallback(
    (formName: string, formJson: Record<string, unknown>): string | null => {
      const name = formName.toLowerCase();
      if (name.includes("blank roi") || name.includes("hipaa"))
        return generateBlankROIPrintHTML(formJson);
      if (name.includes("nh residency") || name.includes("residency agreement"))
        return generateNHResidencyPrintHTML(formJson);
      if (name.includes("house rules"))
        return generateHouseRulesPrintHTML(formJson);
      if (name.includes("service agreement"))
        return generateServiceAgreementPrintHTML(formJson);
      return null;
    },
    [],
  );

  const handleSign = async (documentId: number, signatureData?: string) => {
    const row = tableData.find((d) => d.id === documentId);
    if (!row?.mediaUuid) return;

    // Find the matching MediaItem to get metadata
    const mediaItem = mediaItems.find((m) => m.id === row.mediaUuid);
    const userName = user
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : "";

    // Optimistically mark the row as signed in every cached mediaList so the
    // table shows "Signed" the moment the drawer closes, instead of flashing
    // the stale "Unsigned" status until the sign + PDF-regeneration chain
    // finishes and the refetch lands. Rolled back via invalidation on error.
    const optimisticSignedDate = new Date().toISOString();
    queryClient.setQueriesData(
      { queryKey: ["mediaList", objectId] },
      (old: any) => {
        if (!old) return old;
        const updateList = (list: any[]) =>
          list.map((m: any) =>
            String(m.id) === row.mediaUuid
              ? {
                  ...m,
                  metadata: {
                    ...m.metadata,
                    signed: true,
                    signed_by: userName || m.metadata?.signed_by || null,
                    signed_date: optimisticSignedDate,
                  },
                }
              : m,
          );
        if (Array.isArray(old?.results))
          return { ...old, results: updateList(old.results) };
        if (Array.isArray(old?.data?.results))
          return {
            ...old,
            data: { ...old.data, results: updateList(old.data.results) },
          };
        return old;
      },
    );

    try {
      // Step 1: Call sign endpoint WITH signature data
      const { data: signRes, error: signErr } = await client.post({
        url: `/api/media/${row.mediaUuid}/sign/`,
        body: {
          ...(signatureData ? { signature_data: signatureData } : {}),
          ...(userName ? { signer_name: userName } : {}),
        },
      });

      if (signErr) {
        throw new Error((signErr as any)?.error || "Failed to sign document");
      }

      // Step 2: Regenerate PDF with signature embedded (if this is a consent form)
      const consentFormUuid = mediaItem?.metadata?.consent_form_uuid;
      if (consentFormUuid && signatureData) {
        try {
          // Fetch updated consent form data (signal already embedded signature in form_json)
          const { data: formData, error: formErr } = await client.get({
            url: `/api/document/consent-forms/${consentFormUuid}/?history=false`,
          });
          if (!formErr && formData) {
            const rd = (formData as any)?.data ?? formData;
            const entries = rd?.entries || [];
            const latestEntry = entries[0];
            const formJson = (latestEntry?.form_json || {}) as Record<string, unknown>;
            const formInfo = rd?.form ?? {};
            const formName = formInfo.form_name || row.documentName || "";

            const html = buildFormHTML(formName, formJson);
            if (html) {
              const pdfFileName = `${formName || "Consent Form"}.pdf`;
              const pdfFile = await htmlToPdfFile(html, pdfFileName);

              // UPDATE existing media file (not create new) via PUT
              const updateForm = new FormData();
              updateForm.append("file", pdfFile);
              updateForm.append("description", formName);
              await client.put({
                url: `/api/media/${row.mediaUuid}/update/`,
                body: updateForm as any,
                bodySerializer: (body: any) => body,
              });
            }
          }
        } catch (pdfErr) {
          console.error("PDF regeneration after signing failed:", pdfErr);
          // Non-critical — signing still succeeded
        }
      }

      queryClient.invalidateQueries({ queryKey: ["mediaList", objectId] });
      queryClient.invalidateQueries({ queryKey: ["mediaList", objectId, signed] });
      queryClient.invalidateQueries({ queryKey: ["media-unsigned-count", objectId] });
      if (consentFormUuid) {
        invalidateLeadConsentForms(queryClient, objectId);
      }
      showSnackbar("Document signed successfully", "success");
    } catch (err: any) {
      // Roll back the optimistic "signed" state by refetching server truth
      queryClient.invalidateQueries({ queryKey: ["mediaList", objectId] });
      queryClient.invalidateQueries({ queryKey: ["media-unsigned-count", objectId] });
      showSnackbar(
        err?.message || "Failed to sign document. Please try again.",
        "error",
      );
    }
  };

  /* ========================= RENDER ========================= */
  /* Always show the table (with headers); empty state is shown inside the table body */
  return (
    <>
      <DocumentsTable
        data={tableData}
        loading={mediaLoading}
        searchQuery={searchQuery}
        filterDate={filterDate}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onSign={handleSign}
        onView={(id) => {
          const clickedItem = mediaItems[id - 1];
          if (clickedItem) {
            setViewDocFiles([clickedItem]);
            setViewDocInitialIndex(0);
            setViewDocOpen(true);
          }
        }}
        onPrint={(id) => {
          const row = tableData.find((d) => d.id === id);
          if (row?.fileUrl) handlePrint(row.fileUrl);
        }}
      />

      <UploadProgressPanel progress={uploadProgress} onCancel={cancelUpload} />

      <ViewDocumentsDialog
        open={viewDocOpen}
        onClose={() => setViewDocOpen(false)}
        files={viewDocFiles}
        initialIndex={viewDocInitialIndex}
        title="Document Viewer"
        allowDownload
      />

      <CommonSnackbar
        isOpen={snackbar.open}
        message={snackbar.message}
        status={snackbar.status}
        autoClose
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
      />
    </>
  );
};

export default DocumentsSection;
