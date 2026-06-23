import type { Incident } from '../types/incidents.types';
import type { Incident as SDKIncident } from '../../../sdk/types.gen';

/** Backend resident_details can include avatar_url, lead_uuid, group_home (not all in SDK type yet) */
type ResidentDetailsWithGroupHome = SDKIncident['resident_details'] & {
  avatar_url?: string | null;
  lead_uuid?: string | null;
  group_home?: { id: number; name: string; address?: { line1?: string } } | null;
};

/**
 * Normalize backend incident to frontend Incident type
 */
export function normalizeIncident(backendIncident: SDKIncident): Incident {
  const residentDetails = backendIncident.resident_details as ResidentDetailsWithGroupHome | null | undefined;
  // Extract resident name from resident_details
  const residentName = backendIncident.resident_details
    ? `${backendIncident.resident_details.first_name} ${backendIncident.resident_details.last_name}`.trim()
    : 'Unknown Resident';

  // Extract group home from resident_details.group_home (id + name)
  const groupHome =
    residentDetails?.group_home?.name ||
    residentDetails?.group_home?.address?.line1 ||
    "-";

  // Pass through the backend status verbatim. The new 5-state enum is
  // DRAFT / IN_PROGRESS / PM_REVIEW_PENDING / COMPLETED / ACKNOWLEDGED.
  // Anything unrecognised defaults to DRAFT.
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

  // Use incident_datetime or created_at as date
  const date = backendIncident.incident_datetime || backendIncident.created_at;

  const resident_details = residentDetails
    ? {
        id: residentDetails.id,
        uuid: residentDetails.uuid,
        first_name: residentDetails.first_name,
        last_name: residentDetails.last_name,
        email: residentDetails.email,
        avatar_url: residentDetails.avatar_url ?? null,
        lead_uuid: residentDetails.lead_uuid ?? null,
        group_home: residentDetails.group_home ?? null,
      }
    : null;

  return {
    id: backendIncident.uuid || '',
    referral_number: (backendIncident as any).referral_number || '',
    incident_name: (backendIncident as any).incident_name || undefined,
    residentName,
    residentId: backendIncident.resident, // Resident user ID
    residentUuid: resident_details?.lead_uuid ?? backendIncident.lead_uuid ?? undefined,
    resident_details,
    groupHome,
    date: date ?? "",
    status,
    resident_status: (backendIncident as any).resident_status || undefined,
    acknowledgedAt: backendIncident.created_at || null, // Use created_at initially
    updatedAt: backendIncident.updated_at || null, // Track updated_at for when PUT is called
  };
}

/**
 * Normalize incident response from backend
 * Backend returns: { status: "success", code: 200, message: "...", data: { results: [...], pagination: {...} } }
 */
export function normalizeIncidentResponse(response: any): Incident[] {
  if (!response) return [];
  
  // Backend response structure: { status, code, message, data: { results: [...], pagination: {...} } }
  if (response && typeof response === 'object') {
    // Check if it's the paginated response structure
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results.map(normalizeIncident);
    }
    
    // Check if it's a direct array
    if (Array.isArray(response)) {
      return response.map(normalizeIncident);
    }
    
    // Check if it's wrapped in data
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(normalizeIncident);
    }
  }

  return [];
}

export function normalizeIncidentResponseWithPagination(response: any): {
  results: Incident[];
  paginationInfo: {
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
} {
  const results: Incident[] = normalizeIncidentResponse(response);
  const pagination = response?.data?.pagination || {};
  const totalElements =
    pagination.totalElements ??
    pagination.total_records ??
    pagination.total ??
    0;
  const totalPages =
    pagination.totalPages ??
    pagination.total_pages ??
    1;
  const currentPage =
    pagination.page ??
    pagination.currentPage ??
    pagination.current_page ??
    1;
  const pageSize =
    pagination.size ??
    pagination.pageSize ??
    pagination.per_page ??
    results.length;
  return {
    results,
    paginationInfo: {
      totalElements,
      totalPages,
      currentPage,
      pageSize,
    },
  };
}
