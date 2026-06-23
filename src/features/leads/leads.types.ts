export type LeadStatus =
  | 'Completed'
  | 'Rejected'
  | 'Docs Pending'
  | 'Draft'
  | 'Under Review'
  | 'Onboarding In Progress';

export interface Lead {
  id: string;
  referralId: string;
  referral_number?: string;
  fullName: string;
  avatar?: string;
  referralSource: string;
  insurance: 'Available' | 'Not Available';
  status: LeadStatus;
  lastUpdated: string;
}
