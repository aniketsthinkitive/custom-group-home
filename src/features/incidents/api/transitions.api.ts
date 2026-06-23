// API helpers for Incident lifecycle transitions.
//
// Uses the shared SDK `client` (configured axios instance from `src/sdk/client.gen.ts`),
// so requests automatically pick up auth headers, refresh handling, and the base URL.

import { client } from "../../../sdk/client.gen";

export type IncidentStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "PM_REVIEW_PENDING"
  | "COMPLETED"
  | "ACKNOWLEDGED";

export type TransitionError = {
  status?: "error";
  code?: number;
  error?: string;
  errors?: string[] | Record<string, string>;
  current_status?: IncidentStatus;
  allowed_transitions?: IncidentStatus[];
};

type SuccessEnvelope<T> = {
  status?: string;
  idempotent?: boolean;
  data?: T;
};

async function postTransition<T>(
  uuid: string,
  action: string,
  body?: unknown,
): Promise<T> {
  const { data } = await client.post({
    url: `/api/incidents/${uuid}/${action}/`,
    body: body ?? {},
  });
  const env = data as SuccessEnvelope<T> | undefined;
  return (env?.data ?? (data as T)) as T;
}

/**
 * Start an incident: DRAFT -> IN_PROGRESS.
 */
export async function startIncident(uuid: string) {
  return postTransition<{ status: IncidentStatus; started_at: string }>(
    uuid,
    "start",
  );
}

/**
 * Submit an incident for PM review: IN_PROGRESS -> PM_REVIEW_PENDING.
 */
export async function submitForReview(uuid: string) {
  return postTransition<{
    status: IncidentStatus;
    submitted_for_review_at: string;
  }>(uuid, "submit-for-review");
}

/**
 * Send an incident back to the author for edits: PM_REVIEW_PENDING -> IN_PROGRESS.
 */
export async function sendBackIncident(uuid: string, reason: string) {
  return postTransition<{ status: IncidentStatus }>(uuid, "send-back", {
    reason,
  });
}

/**
 * PM sign-off on an incident: PM_REVIEW_PENDING -> COMPLETED.
 */
export async function pmSignoffIncident(
  uuid: string,
  pmSignatureMediaId: string,
) {
  return postTransition<{ status: IncidentStatus; completed_at: string }>(
    uuid,
    "pm-signoff",
    { pm_signature_media_id: pmSignatureMediaId },
  );
}

/**
 * Acknowledge a completed incident: COMPLETED -> ACKNOWLEDGED.
 */
export async function acknowledgeIncident(uuid: string) {
  return postTransition<{ status: IncidentStatus }>(uuid, "acknowledge");
}
