export type Document = {
  /** Incident UUID (used as row id) */
  id: string;

  /** Numeric DB id (used for REF-001 etc.) — deprecated, use referral_number */
  numericId?: number;

  /** Referral number from backend (e.g. "REF-001") */
  referral_number?: string;

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

  /** Open | Closed */
  status: string;

  /** Optional avatar */
  avatarUrl?: string;
};
