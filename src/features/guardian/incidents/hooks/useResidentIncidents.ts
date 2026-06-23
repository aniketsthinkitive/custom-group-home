import { useQuery } from "@tanstack/react-query";
import { listIncidentsOptions } from "../../../../sdk/@tanstack/react-query.gen";

/**
 * Fetch incidents for a specific resident (by resident USER uuid)
 * Supports server-side pagination: page is 0-based (converted to 1-based for API)
 */
export function useResidentIncidents(
  residentUuid?: string,
  date?: string,
  page: number = 0,
  pageSize: number = 10
) {
  return useQuery({
    ...listIncidentsOptions({
      query: {
        ...(residentUuid ? { resident_uuid: residentUuid } : {}),
        ...(date ? { date } : {}),
        page: page + 1,   // API is 1-based
        size: pageSize,
      },
    }),
    enabled: !!residentUuid,
    select: (response: any) => {
      const pagination = response?.data?.pagination ?? {};
      return {
        incidents: response?.data?.results ?? [],
        totalRecords:
          pagination.total_records ??
          pagination.totalElements ??
          pagination.total ??
          0,
        totalPages:
          pagination.total_pages ??
          pagination.totalPages ??
          1,
      };
    },
  });
}

