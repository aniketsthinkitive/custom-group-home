/**
 * Audit Log type matching the API response structure
 */
export type DailyLog = {
  id: number | string;
  created_at: string;
  action: string;
  message: string;
  staff_member: string;
  role: string;
  entity_type: string;
  group_home: string;
  ip_address: string;
  target_user_name: string | null;
};
