// API helper for fetching a resident's incident context (group home, assigned
// PM, default email snapshots, DSP roster). Used by the incident create/edit
// form to render a read-only summary card and prefill snapshot emails once a
// resident is selected.
//
// Uses the shared SDK `client` (configured axios instance from
// `src/sdk/client.gen.ts`) so requests automatically pick up auth headers,
// refresh handling, and the base URL.

import { client } from "../../../sdk/client.gen";

export type ResidentIncidentContext = {
  resident: { uuid: string; first_name: string; last_name: string };
  group_home: { uuid: string; name: string } | null;
  assigned_program_manager: {
    user_uuid: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  program_manager_email: string;
  coordinator_email: string;
  dsps: Array<{
    user_uuid: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
};

/**
 * Fetch the onboarding-derived context for a resident: their active group
 * home, that home's assigned program manager, default snapshot emails, and
 * the DSPs assigned to the home. Used by the incident form once the user
 * selects a resident.
 */
export async function fetchResidentIncidentContext(
  residentUuid: string,
): Promise<ResidentIncidentContext> {
  const { data } = await client.get({
    url: `/api/incidents/resident-context/${residentUuid}/`,
  });
  const payload: any = data;
  return (payload?.data ?? payload) as ResidentIncidentContext;
}
