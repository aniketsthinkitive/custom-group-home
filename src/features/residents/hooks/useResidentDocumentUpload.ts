import { useMediaUpload } from "../../../hooks/useMediaUpload";

export const useResidentDocumentUpload = (residentId: string) => {
  const { upload, isUploading, uploadProgress, cancelUpload } = useMediaUpload({
    contentTypeApp: "residents",
    contentTypeModel: "resident",
    objectUuid: residentId,
  });

  const uploadDocument = async (file: File, documentName: string) => {
    await upload(file, { description: documentName });
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    cancelUpload,
  };
};
