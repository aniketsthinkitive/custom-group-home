/**
 * Typed data extraction utilities for LeadDetailPage
 * Removes need for 'as any' type assertions
 */

import dayjs from 'dayjs';
import type { LeadData, ExtractedLeadData, LeadDetailResponse } from '../types';
import { stateOptions } from '../../../../../constant/stateOptions';

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Get initials from full name
 */
export const getInitials = (name: string): string => {
  const names = name?.split(' ') || [];
  const first = names[0]?.charAt(0)?.toUpperCase() || '';
  const last = names[1]?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || 'L';
};

/**
 * Extract and normalize lead data from API response
 */
export const extractLeadData = (leadData: unknown): ExtractedLeadData | null => {
  if (!leadData) return null;

  // Handle different response structures
  const response = leadData as LeadDetailResponse;
  const lead: LeadData = response?.data || (leadData as LeadData);

  if (!lead) return null;

  const user = lead.user || {};
  const address = lead.address || {};
  const insurance = lead.insurance || {};
  const guardian = lead.guardian || {};
  const agent = lead.agent || {};

  // Extract full name
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A';

  // Extract referral ID
  const referralId = lead.referral_number || lead.referral_id || lead.uuid || 'N/A';

  // Extract referral source
  const referralSource = lead.referral_source || 'N/A';

  // Extract gender
  const gender = lead.gender || user.gender || 'N/A';

  // Extract date of birth
  const dateOfBirth = lead.date_of_birth || user.date_of_birth || '';
  const age = dateOfBirth ? calculateAge(dateOfBirth) : 0;

  // Extract status
  const status = lead.status || 'N/A';
  const isFinalStatus =
    status.toUpperCase() === 'REJECTED' ||
    status.toUpperCase() === 'COMPLETED';

  // Extract rejection info
  const rejectionReason = lead.rejection_reason || lead.reason || 'Not Provided';
  const rejectedAt = lead.rejected_at || lead.updated_at || null;

  // Extract guardian info
  const guardianName = `${guardian.first_name || ''} ${guardian.last_name || ''}`.trim() || 'N/A';
  const guardianRelation = lead.guardian_relation || 'N/A';
  const guardianPhone = guardian.phone || guardian.phone_number || guardian.contact_number || 'N/A';
  const guardianEmail = guardian.email || 'N/A';
  const stateName = address.state
    ? stateOptions.find((s) => s.key === address.state)?.value || address.state
    : '';
  const guardianAddress = [
    address.line1,
    address.line2,
    address.city,
    stateName,
    address.zipcode || address.zip_code,
  ]
    .filter(Boolean)
    .join(' ')
    .trim() || 'N/A';

  // Extract service manager info
  const serviceManagerName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || 'N/A';
  const serviceManagerPhone = agent.phone || agent.phone_number || agent.contact_number || 'N/A';
  const serviceManagerEmail = agent.email || 'N/A';

  // Extract insurance info — backend may return status as boolean; always show a string
  const insuranceProvider = insurance.provider || insurance.insurance_provider || 'N/A';
  const policyNumber = insurance.policy_number || 'N/A';
  const rawStatus = insurance.status ?? insurance.insurance_status;
  const insuranceStatus =
    typeof rawStatus === 'boolean'
      ? rawStatus
        ? 'Available'
        : 'Not Available'
      : (rawStatus != null && String(rawStatus).trim() !== ''
          ? String(rawStatus).trim()
          : 'N/A');

  // Determine if guardian/agent are assigned (not null)
  const hasGuardian = !!(lead.guardian && (lead.guardian.first_name || lead.guardian.last_name || lead.guardian.email));
  const hasAgent = !!(lead.agent && (lead.agent.first_name || lead.agent.last_name || lead.agent.email));

  // Extract phone number and email
  const contactNumber = String(user.phone || user.phone_number || user.contact_number || lead.phone || lead.phone_number || lead.contact_number || 'N/A');
  const email = String(user.email || lead.email || 'N/A');

  return {
    lead,
    user,
    address,
    insurance,
    guardian,
    agent,
    fullName,
    referralId,
    referralSource,
    gender,
    dateOfBirth,
    age,
    status,
    isFinalStatus,
    rejectionReason,
    rejectedAt,
    guardianName,
    guardianRelation,
    guardianPhone,
    guardianEmail,
    guardianAddress,
    serviceManagerName,
    serviceManagerPhone,
    serviceManagerEmail,
    insuranceProvider,
    policyNumber,
    insuranceStatus,
    contactNumber,
    email,
    hasGuardian,
    hasAgent,
  };
};
