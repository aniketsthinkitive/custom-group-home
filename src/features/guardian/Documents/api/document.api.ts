import type { Incident } from "../types/document.types";
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

  const status: "Open" | "Closed" =
    backendIncident.status === "CLOSED" ? "CLOSED" : "OPEN";

  const date =
    backendIncident.incident_datetime || backendIncident.created_at;

  return {
    /** Incident */
    id: backendIncident.uuid!,
    referral_number: (backendIncident as any).referral_number || '',

    /** Resident */
    residentId: backendIncident.resident,
    residentName,

    /** 🔑 THIS WAS MISSING — REQUIRED */
    lead_uuid: backendIncident.lead_uuid ?? undefined,
    residentUuid: backendIncident.resident_uuid ?? undefined,

    groupHome:
      backendIncident.group_home ??
      backendIncident.group_home_id ??
      backendIncident.resident_details?.group_home ??
      "-",

    /** UI */

    date,
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
