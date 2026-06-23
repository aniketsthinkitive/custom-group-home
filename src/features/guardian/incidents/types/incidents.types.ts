export type Incident = {
  /** Incident UUID (used as row id) */
  id: string;

  /** Numeric DB id (used for REF-001 etc.) — deprecated, use referral_number */
  numericId?: number;

  /** Referral number from backend (e.g. "REF-001") */
  referral_number?: string;
  
  /** Incident Name */
  incidentName?: string;

  /** Resident (User) ID */
  residentId: number;

  /** Display name */
  residentName: string;

  /** 🔑 Lead UUID → used for navigation to /api/leads/{uuid}/ */
  lead_uuid?: string;

  /** Resident (User) UUID (optional but useful) */
  residentUuid?: string;

  /** Group home name */
  groupHomeId: string;        // ✅ used for filtering
  groupHome: string; 

  /** Incident date (ISO string) */
  date: string;

  /** Open | Acknowledged | Closed */
  status: string;

  /** Optional avatar */
  avatarUrl?: string;

  /** Timestamp of acknowledgement */
  acknowledgedAt?: string | null;

  /** Timestamp of last update */
  updatedAt?: string | null;

  incident_datetime?: string | null;
};
