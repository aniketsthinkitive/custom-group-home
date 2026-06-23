// API helpers for Group Home staff assignments and delete-guards.
//
// Uses the shared SDK `client` (configured axios instance from `src/sdk/client.gen.ts`),
// so requests automatically pick up auth headers, refresh handling, and the base URL.

import { client } from "../../sdk/client.gen";

export type StaffAssignmentRole =
  | "DSP"
  | "PROGRAM_MANAGER"
  | "PROGRAM_COORDINATOR"
  | "BCBA"
  | "NURSE"
  | "LEAD";

export type StaffAssignment = {
  uuid: string;
  role_type: StaffAssignmentRole;
  status: "ACTIVE" | "INACTIVE";
  user_uuid: string;
  user_email: string;
  user_name: string;
  created_at: string;
  updated_at: string;
};

export type Blocker = { type: string; id: string; label: string; last_dsp?: boolean };

export type CanDeleteResponse = { can_delete: boolean; blockers: Blocker[] };

type SuccessEnvelope<T> = { status?: string; data?: T };

/**
 * List active staff assignments for a group home, optionally filtered by role.
 */
export async function listAssignments(
  homeUuid: string,
  role?: string,
): Promise<StaffAssignment[]> {
  const q = role ? `?role=${encodeURIComponent(role)}` : "";
  const { data } = await client.get({
    url: `/api/group-homes/${homeUuid}/assignments/${q}`,
  });
  const env = data as SuccessEnvelope<StaffAssignment[]> | undefined;
  return env?.data ?? [];
}

/**
 * Create (or reactivate) a staff assignment for a user on a group home.
 */
export async function createAssignment(
  homeUuid: string,
  userUuid: string,
  roleType: string,
): Promise<StaffAssignment | undefined> {
  const { data } = await client.post({
    url: `/api/group-homes/${homeUuid}/assignments/`,
    body: { user_uuid: userUuid, role_type: roleType },
  });
  const env = data as SuccessEnvelope<StaffAssignment> | undefined;
  return env?.data;
}

/**
 * Soft-remove a staff assignment from a group home.
 */
export async function deleteAssignment(
  homeUuid: string,
  assignmentUuid: string,
): Promise<void> {
  await client.delete({
    url: `/api/group-homes/${homeUuid}/assignments/${assignmentUuid}/`,
  });
}

/**
 * Preflight check for deleting a group home. Returns `{can_delete, blockers}`.
 */
export async function canDeleteGroupHome(
  homeUuid: string,
): Promise<CanDeleteResponse> {
  const { data } = await client.get({
    url: `/api/group-homes/${homeUuid}/can-delete/`,
  });
  return data as CanDeleteResponse;
}

/**
 * Preflight check for deleting/deactivating a user. Returns `{can_delete, blockers}`.
 */
export async function canDeleteUser(
  userUuid: string,
): Promise<CanDeleteResponse> {
  const { data } = await client.get({
    url: `/api/accounts/users/${userUuid}/can-delete/`,
  });
  return data as CanDeleteResponse;
}
