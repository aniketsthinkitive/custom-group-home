import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  listIncidentsOptions,
  createIncidentMutation as createIncidentMutationOptions,
  getIncidentOptions,
  updateIncidentMutation as updateIncidentMutationOptions,
  updateIncidentStatusMutation as updateIncidentStatusMutationOptions,
  listResidentsOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import { normalizeIncidentResponse } from "../api/incidents.api";

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
 * Hook to fetch incidents list with server-side pagination
 * @param search - Search query parameter for resident name
 * @param status - Status filter (OPEN / CLOSED / undefined for all)
 * @param groupHome - Group home UUID filter
 * @param page - 0-based page index
 * @param pageSize - Number of items per page
 */
export function useIncidentsQuery(
  search?: string,
  status?: string,
  groupHome?: string,
  page: number = 0,
  pageSize: number = 10
) {
  return useQuery({
    ...listIncidentsOptions({
      query: {
        ...(search && search.trim() ? { search: search.trim() } : {}),
        ...(status !== undefined ? { status: status as any } : {}),
        ...(groupHome ? { group_home_uuid: groupHome as any } : {}),
        page: page + 1, // API uses 1-based pagination
        size: pageSize,
      },
    }),
    select: (data: any) => ({
      incidents: normalizeIncidentResponse(data),
      pagination: data?.data?.pagination ?? null,
    }),
  });
}

/**
 * Hook to fetch single incident by UUID
 * @param uuid - Incident UUID
 * @param enabled - Whether the query should be enabled (for lazy loading)
 */
export function useIncidentQuery(uuid: string | undefined, enabled: boolean = true) {
  return useQuery({
    ...getIncidentOptions({
      path: {
        uuid: uuid || "",
      },
    }),
    enabled: !!uuid && enabled,
  });
}

/**
 * Hook to create incident
 * On success: invalidate incidents query
 */
export function useCreateIncidentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...createIncidentMutationOptions(),
    onSuccess: () => {
      const key = listIncidentsOptions().queryKey;
      queryClient.invalidateQueries({ queryKey: key.slice(0, 1) });
    },
  });
}

/**
 * Hook to update incident
 * On success: invalidate incidents list and specific incident query
 */
export function useUpdateIncidentMutation(uuid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateIncidentMutationOptions(),
    onSuccess: () => {
      const listKey = listIncidentsOptions().queryKey;
      queryClient.invalidateQueries({ queryKey: listKey.slice(0, 1) });

      if (uuid) {
        const incidentKey = getIncidentOptions({ path: { uuid } }).queryKey;
        queryClient.invalidateQueries({ queryKey: incidentKey });
      }
    },
  });
}

/**
 * Hook to update incident status
 * On success: invalidate incidents list and specific incident query
 * @param uuid - Incident UUID
 */
export function useUpdateIncidentStatusMutation(uuid: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    ...updateIncidentStatusMutationOptions(),
    onSuccess: () => {
      const listKey = listIncidentsOptions().queryKey;
      queryClient.invalidateQueries({ queryKey: listKey.slice(0, 1) });

      if (uuid) {
        const incidentKey = getIncidentOptions({ path: { uuid } }).queryKey;
        queryClient.invalidateQueries({ queryKey: incidentKey });
      }
    },
  });
}

/**
 * Hook to fetch residents list
 * @param search - Search query parameter for resident name
 * @param status - Status filter (ACTIVE or MOVED_OUT)
 * @param enabled - Whether the query should be enabled (for lazy loading)
 * @param groupHome - Group home UUID to filter residents (for ASSIGNED_HOME scope users like nurses)
 */
export function useResidentsQuery(search?: string, status?: string, enabled: boolean = false, groupHome?: string) {
  return useQuery({
    ...listResidentsOptions({
      query: {
        ...(search && search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(groupHome ? { group_home: groupHome as any } : {}),
        size: 1000, // Get all residents for dropdown
      },
    }),
    enabled, // Only fetch when enabled is true
    select: (data: any) => {
      // Backend returns: { status: "success", code: 200, message: "...", data: { results: [...], pagination: {...} } }
      if (!data) return [];
      
      if (data && typeof data === 'object') {
        // Check if it's the paginated response structure
        if (data.data && data.data.results && Array.isArray(data.data.results)) {
          return data.data.results;
        }
        
        // Check if it's a direct array
        if (Array.isArray(data)) {
          return data;
        }
        
        // Check if it's wrapped in data
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        }
      }
      
      return [];
    },
  });
}
