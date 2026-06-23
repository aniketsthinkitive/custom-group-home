import type { Incident } from "../types/incidents.types";
import type { Incident as SDKIncident } from "../../../../sdk/types.gen";

/**
 * Normalize backend incident to frontend Incident type
 */
export function normalizeIncident(
  backendIncident: SDKIncident
): Incident {
  const residentName = backendIncident.resident_details
    ? `${backendIncident.resident_details.first_name} ${backendIncident.resident_details.last_name}`.trim()
    : "Unknown Resident";

  // Pass the backend status through verbatim. New 5-state enum is
  // DRAFT / IN_PROGRESS / PM_REVIEW_PENDING / COMPLETED / ACKNOWLEDGED.
  const VALID_STATUSES = [
    "DRAFT",
    "IN_PROGRESS",
    "PM_REVIEW_PENDING",
    "COMPLETED",
    "ACKNOWLEDGED",
  ] as const;
  const raw = (backendIncident as any).status;
  const status: string =
    typeof raw === "string" && (VALID_STATUSES as readonly string[]).includes(raw)
      ? raw
      : "DRAFT";

  // Pick the latest available date: incident_datetime > received_date > created_at
  const incident_datetime = (backendIncident as any).incident_datetime ?? null;
  const received_date = (backendIncident as any).received_date ?? null;
  const created_at = backendIncident.created_at ?? null;

  // Collect all date candidates and pick the latest
  const dateCandidates = [incident_datetime, received_date, created_at]
    .filter(Boolean) as string[];
  const latestDate = dateCandidates.length > 0
    ? dateCandidates.reduce((latest, d) => new Date(d) > new Date(latest) ? d : latest)
    : "";
  const date = latestDate;

  // Extract group home name from resident_details.group_home.name
  const groupHomeName = 
    (backendIncident.resident_details as any)?.group_home?.name ??
    (backendIncident as any).group_home ??
    (backendIncident as any).group_home_id ??
    "-";

  // Extract avatar URL from resident_details.avatar_url
  const avatarUrl = (backendIncident.resident_details as any)?.avatar_url ?? undefined;

  return {
    /** Incident */
    id: backendIncident.uuid!,
    referral_number: (backendIncident as any).referral_number || '',
    incidentName: (backendIncident as any).incident_name || undefined,

    /** Resident */
    residentId: Number(backendIncident.resident),
    residentName,

    /** 🔑 THIS WAS MISSING — REQUIRED */
    lead_uuid: backendIncident.lead_uuid ?? undefined,
    residentUuid: backendIncident.resident_uuid ?? undefined,

    groupHomeId: (backendIncident.resident_details as any)?.group_home?.uuid ??
      (backendIncident as any).group_home_id ??
      "",
    groupHome: groupHomeName,

    /** UI */
    avatarUrl,

    date,
    incident_datetime,
    status,

    acknowledgedAt: backendIncident.created_at ?? null,
    updatedAt: backendIncident.updated_at ?? null,
  };
}


/**
 * Normalize incident response from backend
 */
export function normalizeIncidentResponse(response: any): Incident[] {
  if (!response) return [];

  if (response?.data?.results && Array.isArray(response.data.results)) {
    return response.data.results.map(normalizeIncident);
  }

  if (Array.isArray(response)) {
    return response.map(normalizeIncident);
  }

  if (response?.data && Array.isArray(response.data)) {
    return response.data.map(normalizeIncident);
  }

  return [];
}
