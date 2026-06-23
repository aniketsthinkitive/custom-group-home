import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

interface SendBackModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

/**
 * Modal asking a PM to provide a written reason when sending an incident
 * back to the reporting DSP for edits. Validates that the reason has at
 * least 5 trimmed characters (matches the backend's expectation).
 */
export default function SendBackModal({
  open,
  onClose,
  onConfirm,
}: SendBackModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const trimmed = reason.trim();
  const valid = trimmed.length >= 5;

  const handleConfirm = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Send Back to DSP</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label="Reason (at least 5 characters)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!valid || submitting}
          onClick={handleConfirm}
        >
          {submitting ? "Sending..." : "Send Back"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
