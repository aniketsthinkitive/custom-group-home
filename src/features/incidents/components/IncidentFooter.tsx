import { useState } from "react";
import { Button, Stack, Tooltip } from "@mui/material";

import {
  pmSignoffIncident,
  startIncident,
  submitForReview,
  type IncidentStatus,
} from "../api/transitions.api";
// SendBackModal + sendBackIncident kept on disk for when send-back is
// re-enabled — imports omitted while the UI hides the flow.

export type IncidentRole =
  | "DSP"
  | "PM"
  | "ADMIN"
  | "GUARDIAN"
  | "AGENT"
  | "OTHER";

interface IncidentFooterProps {
  /** Incident UUID. Undefined in create mode. */
  uuid?: string;
  status: IncidentStatus;
  role: IncidentRole;
  /** True once the reporter has captured a signature (drawn/uploaded/reused). */
  hasReporterSignature: boolean;
  /**
   * Just-in-time provider for the PM signature. Called immediately before
   * `pmSignoffIncident`. Resolves to the uploaded media id, or null when the
   * PM hasn't drawn anything yet.
   */
  pmSignatureProvider?: () => Promise<string | null>;
  /** True once a PM signature already exists on the incident. */
  hasPmSignature?: boolean;
  /** Saves the form fields (POST/PUT). Must throw on failure. */
  onSave: () => Promise<void>;
  /** Called after any successful transition to re-fetch / refresh. */
  onChanged: () => void;
  /** Receives a flat list of validation errors from the backend. */
  setErrors: (errs: string[]) => void;
  /** Optional Cancel handler. */
  onCancel?: () => void;
  /** External busy flag (e.g. while incident data is loading). */
  disabled?: boolean;
}

function extractErrors(err: unknown): string[] {
  const e = err as any;
  const data = e?.response?.data ?? e?.data ?? e;
  if (!data) return [e?.message ?? "Something went wrong"];
  if (Array.isArray(data?.errors)) return (data.errors as unknown[]).map(String);
  if (data?.errors && typeof data.errors === "object") {
    const out: string[] = [];
    for (const v of Object.values(data.errors as Record<string, unknown>)) {
      if (Array.isArray(v)) out.push(...v.map(String));
      else if (v != null) out.push(String(v));
    }
    if (out.length) return out;
  }
  if (typeof data?.error === "string") return [data.error];
  if (typeof data?.message === "string") return [data.message];
  if (typeof data?.detail === "string") return [data.detail];
  return [e?.message ?? "Something went wrong"];
}

/**
 * Renders the action buttons at the bottom of the incident create/edit form.
 * The set of buttons varies by `(role, status)` and orchestrates the
 * compound "save + transition" flows defined in the redesign spec.
 */
export default function IncidentFooter({
  uuid,
  status,
  role,
  hasReporterSignature,
  pmSignatureProvider,
  hasPmSignature,
  onSave,
  onChanged,
  setErrors,
  onCancel,
  disabled,
}: IncidentFooterProps) {
  const [busy, setBusy] = useState(false);

  const compound = async (action?: () => Promise<unknown>) => {
    if (busy || disabled) return;
    setBusy(true);
    setErrors([]);
    try {
      await onSave();
      if (action) await action();
      onChanged();
    } catch (err) {
      setErrors(extractErrors(err));
    } finally {
      setBusy(false);
    }
  };

  const cancelBtn = onCancel ? (
    <Button variant="text" onClick={onCancel} disabled={busy || disabled}>
      Cancel
    </Button>
  ) : null;

  // Create flow / DRAFT status — only the reporter (DSP) acts.
  // Backend auto-transitions DRAFT → PM_REVIEW_PENDING on save when the
  // reporter signature is present, so create-mode DSP signing submits
  // directly for review.
  if (!uuid || status === "DRAFT") {
    const canTransition = role === "DSP";
    const startTooltip = !hasReporterSignature
      ? "Add your signature first before starting the incident."
      : "";
    const handleSignAndSave = async () => {
      if (!hasReporterSignature) {
        setErrors(["Please add your signature before signing and starting the incident."]);
        return;
      }
      // Create mode relies on backend auto-start after reporter signature is
      // saved. Existing drafts still call /start/ explicitly after save.
      await compound(uuid ? () => startIncident(uuid) : undefined);
    };
    return (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {cancelBtn}
        <Button
          variant="outlined"
          onClick={() => compound()}
          disabled={busy || disabled}
        >
          {uuid ? "Save Draft" : "Save Incident"}
        </Button>
        {canTransition && (
          <Tooltip title={startTooltip} placement="top" arrow disableHoverListener={!startTooltip}>
            <span>
              <Button
                variant="contained"
                disabled={busy || disabled}
                onClick={handleSignAndSave}
              >
                {busy ? "Working..." : uuid ? "Sign & Start" : "Sign & Start"}
              </Button>
            </span>
          </Tooltip>
        )}
      </Stack>
    );
  }

  if (
    status === "IN_PROGRESS" &&
    (role === "DSP" || role === "PM" || role === "ADMIN")
  ) {
    return (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {cancelBtn}
        <Button
          variant="outlined"
          onClick={() => compound()}
          disabled={busy || disabled}
        >
          Save
        </Button>
        <Button
          variant="contained"
          disabled={busy || disabled}
          onClick={() => compound(() => submitForReview(uuid))}
        >
          {busy ? "Working..." : "Submit for Review"}
        </Button>
      </Stack>
    );
  }

  if (
    status === "PM_REVIEW_PENDING" &&
    (role === "DSP" || role === "PM" || role === "ADMIN" || role === "OTHER")
  ) {
    // Sign & Complete is restricted to the PM bucket only
    // (Program Manager + Program Coordinator).
    const canSignComplete = role === "PM";
    return (
      <>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {cancelBtn}
          <Button
            variant="outlined"
            onClick={() => compound()}
            disabled={busy || disabled}
          >
            Save
          </Button>
          {canSignComplete && (
            <Button
              variant="contained"
              disabled={busy || disabled}
              onClick={async () => {
                if (busy || disabled) return;
                setErrors([]);
                try {
                  const mediaId = pmSignatureProvider
                    ? await pmSignatureProvider()
                    : null;
                  if (!mediaId) {
                    if (hasPmSignature) {
                      await compound(() => pmSignoffIncident(uuid));
                      return;
                    }
                    setErrors([
                      "Please draw the Program Manager signature first.",
                    ]);
                    return;
                  }
                  await compound(() => pmSignoffIncident(uuid, mediaId));
                } catch (err) {
                  setErrors(extractErrors(err));
                }
              }}
            >
              {busy ? "Working..." : "Sign & Complete"}
            </Button>
          )}
        </Stack>
      </>
    );
  }

  // Terminal states (COMPLETED, ACKNOWLEDGED) or roles without write rights:
  // expose Cancel only — read-only mode.
  return (
    <Stack direction="row" spacing={1} justifyContent="flex-end">
      {cancelBtn}
    </Stack>
  );
}
