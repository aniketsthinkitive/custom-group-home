// New 5-state lifecycle (legacy OPEN/CLOSED kept in the union ONLY as a
// type-level escape hatch for any frontend code still referencing the old
// values; runtime never sees them after the data migration).
export type IncidentStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "PM_REVIEW_PENDING"
  | "COMPLETED"
  | "ACKNOWLEDGED"
  | "OPEN"
  | "CLOSED"
  | string;

/** Resident details from backend (includes avatar_url, lead_uuid, group_home when returned by API) */
export interface IncidentResidentDetails {
  id?: number;
  uuid?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string | null;
  lead_uuid?: string | null;
  group_home?: { id: number; name: string } | null;
}

export interface Incident {
  id: string;
  referral_number?: string; // e.g. "REF-001"
  incident_name?: string;
  residentName: string;
  residentId?: number; // Resident user ID
  residentUuid?: string; // Resident/Lead UUID for navigation
  resident_details?: IncidentResidentDetails | null;
  avatarUrl?: string; // Deprecated: use resident_details?.avatar_url
  groupHome: string;
  date: string; // ISO or backend string
  status: IncidentStatus;
  acknowledgedAt?: string | null; // Optional acknowledged date/time (created_at initially, updated_at after PUT)
  updatedAt?: string | null; // Track updated_at for when PUT is called
  created_at?: string | null;
  updated_at?: string | null;
  signature_url?: string | null;
  signature?: {
    uploaded_at: string;
    updated_at: string;
    uploaded_by: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

/**
 * Create Incident Payload - matches Swagger POST /api/incidents/ exactly
 */
export interface CreateIncidentPayload {
  resident: number;
  reported_by: number;
  location?: string | null;
  region?: string | null;
  received_date?: string | null; // YYYY-MM-DD format
  incident_datetime?: string | null; // ISO string with time
  agency_name?: string | null;
  pre_incident_notes?: string | null;
  incident_description?: string | null;
  response_action?: string | null;
  pm_review_notes?: string | null;
  pm_program_type?: string | null;
  pm_service_transition?: string | null;
  pm_service_transition_description?: string | null;
  pm_behavior_plan_followed?: string | null;
  send_notification?: boolean;
  status?: string;
  medical_flags?: Array<{
    medical_type: string;
    medical_other_details?: string | null;
  }>;
  legal_flags?: Array<{ legal_type: string }>;
  social_flags?: Array<{
    social_type: string;
    social_other_details?: string | null;
  }>;
  victim_flags?: Array<{ victim_type: string }>;
}

/**
 * Backend response wrapper for POST /api/incidents/
 */
export interface CreateIncidentResponse {
  status: string;
  code: number;
  message: string;
  data?: any;
}
