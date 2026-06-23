import type { Lead } from '../leads.types';
import type { LeadDetail } from '../../../sdk/types.gen';

/**
 * Normalize backend lead to frontend Lead type
 */
export function normalizeLead(backendLead: any): Lead {
  // Extract full name from user
  const fullName = backendLead.user && typeof backendLead.user === 'object'
    ? `${backendLead.user.first_name || ''} ${backendLead.user.last_name || ''}`.trim()
    : 'Unknown';

  // Extract referral ID - use uuid
  const referralId = backendLead.uuid || '';

  // Referral number from backend (e.g. "REF-001")
  const referral_number = backendLead.referral_number || '';

  // Determine insurance status - strictly map boolean values from nested object
  const insuranceStatus = backendLead.insurance?.status;
  const insurance: 'Available' | 'Not Available' =
    insuranceStatus === true ? 'Available' : 'Not Available';

  // Convert status to frontend type
  const statusMap: Record<string, Lead['status']> = {
    'COMPLETED': 'Completed',
    'REJECTED': 'Rejected',
    'DOCS_PENDING': 'Docs Pending',
    'DRAFT': 'Draft',
    'UNDER_REVIEW': 'Under Review',
    'ONBOARDING_IN_PROGRESS': 'Onboarding In Progress',
  };

  const status = statusMap[String(backendLead.status)] || 'Draft';

  // Use updated_at or created_at as lastUpdated
  const lastUpdated = backendLead.updated_at || backendLead.created_at || '';

  return {
    id: backendLead.uuid || '',
    referralId,
    referral_number,
    fullName,
    avatar: (backendLead.user && typeof backendLead.user === 'object') ? backendLead.user.avatar_url ?? undefined : undefined,
    referralSource: backendLead.referral_source || '',
    insurance,
    status,
    lastUpdated: lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : '',
  };
}

/**
 * Normalize lead response from backend
 * Backend returns: { status: "success", code: 200, message: "...", data: { results: [...], pagination: {...} } }
 */
export function normalizeLeadResponse(response: any): Lead[] {
  if (!response) return [];

  // Backend response structure: { status, code, message, data: { results: [...], pagination: {...} } }
  if (response && typeof response === 'object') {
    // Check if it's the paginated response structure
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data.results.map(normalizeLead);
    }

    // Check if it's a direct array
    if (Array.isArray(response)) {
      return response.map(normalizeLead);
    }

    // Check if it's wrapped in data
    if (response.data && Array.isArray(response.data)) {
      return response.data.map(normalizeLead);
    }
  }

  return [];
}