import { QueryClient } from '@tanstack/react-query';
import { listLeadsQueryKey } from '../../../sdk/@tanstack/react-query.gen';

/**
 * Utility function to invalidate all listLeads queries
 * This ensures consistent invalidation across all components
 */
export const invalidateLeadsList = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({ 
    queryKey: listLeadsQueryKey() 
  });
};

/**
 * Utility function to invalidate leads list using predicate
 * Use this when you need to match all variations of listLeads queries
 */
export const invalidateLeadsListWithPredicate = (queryClient: QueryClient) => {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      return Array.isArray(queryKey) && 
             (queryKey[0] === 'listLeads' || 
              (typeof queryKey[0] === 'object' && queryKey[0]?._id === 'listLeads'));
    }
  });
};

/**
 * Invalidate every listConsentForms cache variant for one lead/resident.
 * The lead detail header uses the unfiltered query, while the consent table
 * uses signer-filtered queries. Keep both in sync after any form status change.
 */
export const invalidateLeadConsentForms = (
  queryClient: QueryClient,
  leadUuid: string,
) => {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      if (!Array.isArray(queryKey)) return false;

      const firstKey = queryKey[0] as {
        _id?: string;
        query?: { resident_uuid?: string };
      };
      return (
        typeof firstKey === 'object' &&
        firstKey !== null &&
        firstKey._id === 'listConsentForms' &&
        firstKey.query?.resident_uuid === leadUuid
      );
    },
  });
};

/**
 * Optimistically update a lead's status in the cache
 * This prevents UI flicker and provides instant feedback
 */
export const optimisticallyUpdateLeadStatus = (
  queryClient: QueryClient,
  leadId: string,
  status: string
) => {
  queryClient.setQueriesData(
    {
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && 
               (queryKey[0] === 'listLeads' || 
                (typeof queryKey[0] === 'object' && queryKey[0]?._id === 'listLeads'));
      }
    },
    (oldData: any) => {
      if (!oldData?.data) return oldData;

      // Handle different response structures
      const data = oldData.data;
      const leads = Array.isArray(data) ? data : (data?.results || data?.data || []);

      return {
        ...oldData,
        data: Array.isArray(data) 
          ? leads.map((lead: any) => 
              (lead.referralId === leadId || lead.id === leadId || lead.uuid === leadId)
                ? { ...lead, status }
                : lead
            )
          : {
              ...data,
              results: leads.map((lead: any) => 
                (lead.referralId === leadId || lead.id === leadId || lead.uuid === leadId)
                  ? { ...lead, status }
                  : lead
              )
            }
      };
    }
  );
};
