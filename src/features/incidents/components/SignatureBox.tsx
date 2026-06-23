import {
  Box,
  Button,
  Card,
  Stack,
  Typography,
} from "@mui/material";

interface SignatureBoxProps {
  label: string;
  signerName?: string;
  signedAt?: string | null;
  signatureUrl?: string | null;
  canSign: boolean;
  onSign?: () => void;
  signActionLabel?: string;
}

/**
 * Read-only "stack" view of a signature with optional sign-now action.
 *
 * Used by the incident form to render the Reporter and Program Manager
 * signature panels side by side. The actual capture UI (draw / upload) is
 * provided elsewhere — this widget is responsible for the display state
 * and exposing a hook for triggering a signing flow.
 */
export default function SignatureBox({
  label,
  signerName,
  signedAt,
  signatureUrl,
  canSign,
  onSign,
  signActionLabel = "Sign now",
}: SignatureBoxProps) {
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      {signatureUrl ? (
        <Stack spacing={1}>
          <Box
            component="img"
            src={signatureUrl}
            alt={label}
            sx={{
              maxHeight: 80,
              maxWidth: "100%",
              objectFit: "contain",
              alignSelf: "flex-start",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Signed by {signerName || "—"}
            {signedAt ? ` on ${new Date(signedAt).toLocaleString()}` : ""}
          </Typography>
        </Stack>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Not signed yet.
          </Typography>
          {canSign && onSign && (
            <Button variant="outlined" size="small" onClick={onSign}>
              {signActionLabel}
            </Button>
          )}
        </Box>
      )}
    </Card>
  );
}
