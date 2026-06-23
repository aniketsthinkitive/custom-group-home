import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  listLeadsOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import { normalizeLeadResponse } from "../api/leads.api";

/**
 * Extract backend message only (for your custom snackbar)
 * Returns ONLY backend-provided message, no frontend-invented text
 */
export function getBackendMessage(error: unknown): string | undefined {
  const err = error as AxiosError<any> | any;

  return (
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.response?.data?.detail ??
    err?.data?.message ??
    err?.data?.error ??
    err?.data?.detail ??
    undefined
  );
}

/**
 * Hook to fetch leads list
 * @param search - Search query parameter for user name or referral source
 * @param status - Status filter
 * @param referralSource - Referral source filter
 */
export function useLeadsQuery(search?: string, status?: string, referralSource?: string) {
  return useQuery({
    ...listLeadsOptions({
      query: {
        ...(search && search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(referralSource ? { referral_source: referralSource } : {}),
      },
    }),
    select: normalizeLeadResponse,
  });
}
