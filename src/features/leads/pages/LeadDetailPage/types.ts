/**
 * TypeScript types for LeadDetailPage data structures
 */

export interface LeadUser {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  gender?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  contact_number?: string;
}

export interface LeadAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  zip_code?: string;
}

export interface LeadInsurance {
  provider?: string;
  insurance_provider?: string;
  policy_number?: string;
  status?: boolean | string;
  insurance_status?: string;
}

export interface LeadGuardian {
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  contact_number?: string;
  email?: string;
}

export interface LeadAgent {
  first_name?: string;
  last_name?: string;
  phone?: string;
  phone_number?: string;
  contact_number?: string;
  email?: string;
}

export interface LeadData {
  id?: number;
  uuid?: string;
  referral_number?: string;
  referral_id?: string;
  referral_source?: string;
  status?: string;
  gender?: string;
  date_of_birth?: string;
  rejection_reason?: string;
  reason?: string;
  rejected_at?: string;
  updated_at?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  contact_number?: string;
  user?: LeadUser;
  address?: LeadAddress;
  insurance?: LeadInsurance;
  guardian?: LeadGuardian;
  agent?: LeadAgent;
  guardian_relation?: string;
}

export interface LeadDetailResponse {
  data?: LeadData;
}

export interface ExtractedLeadData {
  lead: LeadData;
  user: LeadUser;
  address: LeadAddress;
  insurance: LeadInsurance;
  guardian: LeadGuardian;
  agent: LeadAgent;
  fullName: string;
  referralId: string;
  referralSource: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  contactNumber: string;
  email: string;
  status: string;
  isFinalStatus: boolean;
  rejectionReason: string;
  rejectedAt: string | null;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianAddress: string;
  serviceManagerName: string;
  serviceManagerPhone: string;
  serviceManagerEmail: string;
  insuranceProvider: string;
  policyNumber: string;
  insuranceStatus: string;
  hasGuardian: boolean;
  hasAgent: boolean;
}
