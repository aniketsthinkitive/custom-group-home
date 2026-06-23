import { Box, IconButton, LinearProgress, Paper, Typography } from "@mui/material";
import Close from "@mui/icons-material/Close";
import type { UploadProgressEntry } from "../../hooks/useMediaUpload";

export interface UploadProgressPanelProps {
  /** Per-file upload progress entries — pass `uploadProgress` from useMediaUpload */
  progress: Record<string, UploadProgressEntry>;
  /** Cancel handler — pass `cancelUpload` from useMediaUpload. Omit to hide cancel buttons. */
  onCancel?: (uploadId: string) => void;
}

const STATUS_LABEL: Record<UploadProgressEntry["status"], string> = {
  uploading: "",
  done: "Done",
  error: "Failed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<UploadProgressEntry["status"], string> = {
  uploading: "#6B7280",
  done: "#2E7D32",
  error: "#DC2626",
  cancelled: "#6B7280",
};

/**
 * Floating bottom-right panel showing per-file upload progress bars.
 * Files stay listed with their final status (done/failed/cancelled) until
 * the whole batch completes. Renders nothing when there are no entries.
 */
export default function UploadProgressPanel({
  progress,
  onCancel,
}: UploadProgressPanelProps) {
  const entries = Object.entries(progress);
  if (entries.length === 0) return null;

  const uploadingCount = entries.filter(
    ([, e]) => e.status === "uploading",
  ).length;

  return (
    <Paper
      elevation={6}
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 340,
        // Above MUI drawers (1200) and dialogs (1300) — uploads are started from both
        zIndex: 1500,
        p: 2,
        borderRadius: "8px",
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#0F172A", mb: 1 }}>
        {uploadingCount > 0
          ? `Uploading ${uploadingCount} ${uploadingCount === 1 ? "file" : "files"}…`
          : "Upload complete"}
      </Typography>
      {entries.map(([uploadId, entry]) => (
        <Box key={uploadId} sx={{ mb: 1, "&:last-child": { mb: 0 } }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography
              noWrap
              title={entry.fileName}
              sx={{ fontSize: "13px", color: "#233558", flex: 1, mr: 1 }}
            >
              {entry.fileName}
            </Typography>
            <Typography
              sx={{ fontSize: "12px", color: STATUS_COLOR[entry.status] }}
            >
              {entry.status === "uploading"
                ? `${entry.percent}%`
                : STATUS_LABEL[entry.status]}
            </Typography>
            {onCancel && entry.status === "uploading" && (
              <IconButton
                size="small"
                aria-label={`Cancel upload of ${entry.fileName}`}
                onClick={() => onCancel(uploadId)}
                sx={{ p: "2px", ml: 0.5 }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
          <LinearProgress
            variant="determinate"
            value={entry.percent}
            color={
              entry.status === "error"
                ? "error"
                : entry.status === "done"
                  ? "success"
                  : "primary"
            }
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      ))}
    </Paper>
  );
}
