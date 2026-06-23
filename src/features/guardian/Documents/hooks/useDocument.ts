import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  listResidentsOptions,
} from "../../../../sdk/@tanstack/react-query.gen";

/**
 * Extract backend message only
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
 * Fetch residents list with server-side pagination, role-based filtering
 */
export function useResidentsQuery(
  params?: {
    page?: number;
    size?: number;
    search?: string;
    group_home?: number;
    date?: string;
    role?: string;
    user_id?: number;
    user_uuid?: string;
    leads?: boolean;
  },
  enabled: boolean = false
) {
  return useQuery({
    ...listResidentsOptions({
      query: {
        page: params?.page,
        size: params?.size ?? 10,

        ...(params?.search?.trim() && {
          search: params.search.trim(),
        }),

        ...(params?.group_home && {
          group_home: params.group_home,
        }),

        ...(params?.date && {
          date: params.date,
        }),

        ...(params?.role && {
          role: params.role,
        }),

        ...(params?.user_id && {
          user_id: params.user_id,
        }),

        ...(params?.user_uuid && {
          user_uuid: params.user_uuid,
        }),

        ...(params?.leads && {
          leads: params.leads,
        }),
      },
    }),
    enabled,
    select: (data: any) => ({
      results: data?.data?.results ?? [],
      pagination: data?.data?.pagination ?? {
        page: 1,
        size: 10,
        total_pages: 1,
        total_records: 0,
      },
    }),
  });
}
