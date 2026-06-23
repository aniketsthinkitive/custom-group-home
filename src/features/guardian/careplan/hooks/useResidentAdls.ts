import { useQuery } from "@tanstack/react-query";
import { residentsListOptions } from "../../../../sdk/@tanstack/react-query.gen";

/**
 * Fetch ADLs for a resident (UUID-based)
 */
export const useResidentAdls = (residentUuid?: string) => {
  // console.log("🔵 useResidentAdls called with:", residentUuid);

  return useQuery({
    ...residentsListOptions({
      // 🔑 CAST query so we can pass UUID (OpenAPI schema limitation)
      query: {
        resident_uuid: residentUuid,
        type: "ADL",
      } as any, // ✅ intentional escape hatch
    }),
    enabled: !!residentUuid,

    select: (response) => {
      const items = response?.data;

      if (!Array.isArray(items)) return [];

      return items.map((item: any) => ({
        uuid: item.uuid,
        title: item.title,
        description: item.description ?? "—",
        notes: item.notes ?? "",
        status: item.daily_status ?? null,
        datetime: item.performed_at ?? item.created_at,
        shifts: item.assigned_shifts ?? [],
      }));
    },

    staleTime: 60_000,
  });
};
