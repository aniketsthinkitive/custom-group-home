import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import {
  listIncidentsOptions,
  createIncidentMutation as createIncidentMutationOptions,
  getIncidentOptions,
  updateIncidentMutation as updateIncidentMutationOptions,
  updateIncidentStatusMutation as updateIncidentStatusMutationOptions,
  listResidentsOptions,
} from "../../../../sdk/@tanstack/react-query.gen";


import { normalizeIncidentResponse } from "../api/incidents.api";
import { useAuth } from "../../../../hooks/useAuth";

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
 * Fetch incidents list with server-side pagination
 */
export function useIncidentsQuery(
  search?: string,
  status?: string,
  groupHomeId?: string,
  date?: string,
  page: number = 0,
  pageSize: number = 10
) {
  const { user } = useAuth();
  const userWithUuid = user as { uuid?: string; role?: { type?: string } | string } | null;
  const userUuid = userWithUuid?.uuid ? String(userWithUuid.uuid) : undefined;
  const roleType =
    typeof userWithUuid?.role === "object" && userWithUuid?.role !== null && "type" in userWithUuid.role
      ? (userWithUuid.role as { type?: string }).type
      : typeof userWithUuid?.role === "string"
        ? userWithUuid.role
        : undefined;

  // When role is GUARDIAN or AGENT, backend requires "uuid" (user UUID). Only send role + uuid when we have both.
  const needsUuid = roleType === "GUARDIAN" || roleType === "AGENT";
  const roleQuery =
    roleType && (!needsUuid || userUuid)
      ? { ...(needsUuid && userUuid ? { uuid: userUuid } : {}), role: roleType }
      : {};

  // Only run when we have required params (uuid when role is GUARDIAN/AGENT)
  const enabled = !needsUuid || !!userUuid;

  return useQuery({
    ...listIncidentsOptions({
      query: {
        distinctLatest: true,
        ...roleQuery,
        ...(search && search.trim() ? { search: search.trim() } : {}),
        ...(status !== undefined ? { status: status as any } : {}),
        ...(groupHomeId ? { group_home_uuid: groupHomeId } : {}),
        ...(date ? { date } : {}),
        page: page + 1, // API uses 1-based pagination
        size: pageSize,
      },
    }),
    enabled,
    select: (data: any) => ({
      incidents: normalizeIncidentResponse(data),
      pagination: data?.data?.pagination ?? null,
    }),
  });
}

/**
 * Fetch single incident by UUID
 * @param uuid - Incident UUID
 * @param enabled - Whether the query should be enabled (for lazy loading)
 */
export const useIncidentQuery = (uuid?: string, enabled: boolean = true) => {
  return useQuery({
    ...getIncidentOptions({
      path: { uuid: uuid! },
    }),
    enabled: Boolean(uuid) && enabled,
  });
};


/**
 * Create incident
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
 * Update incident
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
 * Update incident status
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
 * Fetch residents list (used only for dropdowns if needed)
 */
export function useResidentsQuery(
  search?: string,
  status?: string,
  enabled: boolean = false
) {
  return useQuery({
    ...listResidentsOptions({
      query: {
        ...(search && search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        size: 1000,
      },
    }),
    enabled,
    select: (data: any) => {
      if (data?.data?.results && Array.isArray(data.data.results)) {
        return data.data.results;
      }
      return [];
    },
  });
}
