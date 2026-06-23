import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  residentsListOptions,
  residentsCreateMutation,
  residentsUpdateMutation,
  residentsListQueryKey,
  residentsArchiveCreateMutation,
  residentsCarePlanReportsListOptions,
  residentsCarePlanReportsDestroyMutation,
  residentsCarePlanReportsListQueryKey,
} from "../../../sdk/@tanstack/react-query.gen";
import type { CarePlanReport } from "../../../sdk/types.gen";
import type { CarePlanItem } from "../components/CarePlanTrackingTab";
import type { MonthlyRow } from "../components/CarePlanMonthlySummary";
import {
  API_SHIFT_MAP,
  API_TO_UI_STATUS_MAP,
  MONTH_INDEX_MAP,
} from "../utils/carePlanConstants";

interface UseCarePlanDataParams {
  residentId: string | undefined;
  activeTab: number;
  shifts: string[];
  selectedDate: string;
  selectedMonth: string;
  selectedYear: string;
  search?: string;
  showArchived?: boolean;
}

export function useCarePlanData({
  residentId,
  activeTab,
  shifts,
  selectedDate,
  selectedMonth,
  selectedYear,
  search,
  showArchived,
}: UseCarePlanDataParams) {
  const queryClient = useQueryClient();

  // Mutations
  const createItem = useMutation(residentsCreateMutation());
  const updateItem = useMutation(residentsUpdateMutation());
  const archiveItem = useMutation(residentsArchiveCreateMutation());

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  // Query params
  const queryParams = {
    resident_uuid: residentId,
    type:
      activeTab === 0
        ? "ADL"
        : activeTab === 1 || activeTab === 2
          ? "GOAL"
          : undefined,
    search: search || undefined,
    archived: activeTab === 1 ? showArchived : undefined,
    date: activeTab === 0 || activeTab === 1 ? selectedDate : undefined,
    shifts:
      (activeTab === 0 || activeTab === 1) && shifts.length > 0
        ? shifts.map((s) => API_SHIFT_MAP[s]).join(",")
        : undefined,
    month:
      activeTab === 2 ? (MONTH_INDEX_MAP[selectedMonth] ?? 0) + 1 : undefined,
    year: activeTab === 2 ? Number(selectedYear) : undefined,
  };

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    ...residentsListOptions({ query: queryParams as any }),
    enabled: !!residentId && activeTab !== 3,
  });

  const { data: reportsResponse, isLoading: isReportsLoading } = useQuery({
    ...residentsCarePlanReportsListOptions({
      path: { uuid: residentId as string },
    }),
    enabled: activeTab === 3 && Boolean(residentId),
  });

  // Derived data
  const carePlanItems = useMemo(() => {
    const resBody = response as any;
    if (resBody?.data && Array.isArray(resBody.data)) return resBody.data;
    if (Array.isArray(resBody)) return resBody;
    if (Array.isArray(resBody?.results)) return resBody.results;
    if (Array.isArray(resBody?.data)) return resBody.data;
    return [];
  }, [response]);

  const filteredItems = useMemo(() => {
    let items = Array.isArray(carePlanItems) ? carePlanItems : [];
    if (activeTab === 0) {
      items = items.filter((i: any) => i.type === "ADL");
    } else if (activeTab === 1) {
      items = items.filter((i: any) => i.type === "GOAL");
    }
    if ((activeTab === 0 || activeTab === 1) && shifts.length > 0) {
      const selected = new Set(shifts.map((s) => API_SHIFT_MAP[s]));
      items = items.filter((i: any) => {
        const assigned = i.assigned_shifts ?? [];
        if (!Array.isArray(assigned)) return true;
        return assigned.some((s: any) => {
          const val =
            typeof s === "string"
              ? s
              : typeof s?.shift === "string"
                ? s.shift
                : null;
          return val ? selected.has(String(val).toUpperCase() as any) : false;
        });
      });
    }
    return items;
  }, [carePlanItems, activeTab, shifts]);

  const mapItemToCarePlanItem = (item: any, type: "ADL" | "GOAL"): CarePlanItem => {
    const selectedShiftApi = shifts.length === 1 ? API_SHIFT_MAP[shifts[0]] : undefined;
    const ds = item.daily_status || undefined;
    const prefill = selectedShiftApi && ds ? ds[selectedShiftApi] : undefined;
    const uiStatus = prefill?.status
      ? API_TO_UI_STATUS_MAP[prefill.status as keyof typeof API_TO_UI_STATUS_MAP]
      : undefined;
    const note = prefill?.note || undefined;
    return {
      id: item.id,
      uuid: item.uuid,
      title: item.title ?? "",
      description: item.description ?? "",
      assigned_shifts: item.assigned_shifts ?? [],
      status: uiStatus,
      note,
      is_archived: Boolean(item.deleted_at),
      ...(type === "GOAL" ? { monthly_progress: item.monthly_progress } : {}),
    };
  };

  const adls: CarePlanItem[] = useMemo(() => {
    return filteredItems
      .filter((item: any) => item.type === "ADL")
      .map((item: any) => mapItemToCarePlanItem(item, "ADL"));
  }, [filteredItems, shifts]);

  const goals: CarePlanItem[] = useMemo(() => {
    return filteredItems
      .filter((item: any) => item.type === "GOAL")
      .map((item: any) => mapItemToCarePlanItem(item, "GOAL"));
  }, [filteredItems, shifts]);

  const allGoals: CarePlanItem[] = useMemo(() => {
    return (Array.isArray(carePlanItems) ? carePlanItems : [])
      .filter((item: any) => item.type === "GOAL")
      .map((item: any) => ({
        id: item.id,
        uuid: item.uuid,
        title: item.title ?? "",
        description: item.description ?? "",
        assigned_shifts: item.assigned_shifts ?? [],
        is_archived: Boolean(item.deleted_at),
        monthly_progress: item.monthly_progress,
      }));
  }, [carePlanItems]);

  const reports = useMemo(() => {
    const body = reportsResponse as any;
    if (body?.status === "error" || body?.code === 404) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.results)) return body.results;
    return [];
  }, [reportsResponse]);

  // Monthly Summary
  const monthlyDays = useMemo(() => {
    const mIndex = MONTH_INDEX_MAP[selectedMonth] ?? 0;
    const yearNum = Number(selectedYear) || new Date().getFullYear();
    const daysInMonth = new Date(yearNum, mIndex + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [selectedMonth, selectedYear]);

  const monthlyRows: MonthlyRow[] = useMemo(() => {
    if (activeTab !== 2) return [];

    return filteredItems
      .filter((item: any) => item.type === "GOAL")
      .map((item: any) => {
        const progress = item.monthly_progress || [];
        let values: ("check" | "x" | "dash")[] = [];

        if (Array.isArray(progress)) {
          values = progress.map((p: any) => {
            if (p === "worked" || p === true || p === "check" || p === "\u221A") return "check";
            if (p === "not_worked" || p === false || p === "x" || p === "X") return "x";
            return "dash";
          });
        } else if (typeof progress === "object" && progress !== null) {
          const mIndex = MONTH_INDEX_MAP[selectedMonth] ?? 0;
          const yearNum = Number(selectedYear);
          values = monthlyDays.map((d) => {
            const mStr = String(mIndex + 1).padStart(2, "0");
            const dStr = String(d).padStart(2, "0");
            const dateStr = `${yearNum}-${mStr}-${dStr}`;
            const dateStrSimple = `${yearNum}-${mIndex + 1}-${d}`;

            const dayData = progress[dateStr] || progress[dateStrSimple];
            if (!dayData) return "dash";

            if (typeof dayData === "string") {
              const lower = dayData.toLowerCase();
              if (lower.includes("check") || lower.includes("work") || dayData.includes("\u221A") || dayData.includes("\u2713") || dayData.includes("\u2714")) return "check";
              if (lower.includes("not") || lower.includes("x") || dayData.includes("\u2716")) return "x";
              return "dash";
            }

            let status: any = undefined;

            // Aggregate across ALL shifts for Monthly Summary
            const allShifts = ["MORNING", "EVENING", "NIGHT"];
            const keys = Object.keys(dayData);

            const classifyShiftValue = (val: any): "check" | "x" | "dash" | null => {
              if (val == null) return null;
              if (val === true) return "check";
              if (val === false) return "x";
              if (typeof val === "string") {
                const upper = val.toUpperCase().trim();
                const lower = val.toLowerCase().trim();
                // Check "could not" and "did not" BEFORE generic "work" match
                if (upper === "COULD NOT WORKED" || upper === "COULD_NOT_WORK" || lower.includes("could not")) return "dash";
                if (upper === "DID NOT WORKED" || upper === "DID_NOT_WORK" || lower.includes("not worked") || lower.includes("did not work")) return "x";
                if (upper === "WORKED" || val === "\u221A" || val === "\u2713" || val === "\u2714") return "check";
                if (val === "x" || val === "X" || val === "\u2716") return "x";
              }
              return null;
            };

            let hasCheck = false;
            let hasX = false;

            for (const s of allShifts) {
              const key = keys.find((k) => k.toUpperCase() === s);
              if (key) {
                const result = classifyShiftValue(dayData[key]);
                if (result === "check") { hasCheck = true; break; }
                if (result === "x") hasX = true;
              }
            }

            if (hasCheck) status = "check";
            else if (hasX) status = "x";

            if (status) {
              if (status === "check") return "check";
              if (status === "x") return "x";
              if (status === true) return "check";
              if (status === false) return "x";

              if (typeof status === "string") {
                const upper = status.toUpperCase();
                const lower = status.toLowerCase();

                if (upper === "WORKED") return "check";
                if (upper === "DID NOT WORKED" || upper === "DID_NOT_WORK") return "x";
                if (upper === "COULD NOT WORKED" || upper === "COULD_NOT_WORK") return "dash";

                if (lower.includes("not worked") || lower.includes("did not work")) return "x";
                if (lower.includes("could not work") || lower.includes("could not")) return "dash";
                if (lower.includes("check") || lower.includes("work") || status.includes("\u221A") || status.includes("\u2713") || status.includes("\u2714")) return "check";
                if (lower.includes("x") || status.includes("\u2716")) return "x";
              }
            }
            return "dash";
          });
        } else {
          values = Array(monthlyDays.length).fill("dash");
        }

        if (values.length < monthlyDays.length) {
          const diff = monthlyDays.length - values.length;
          values = [...values, ...Array(diff).fill("dash")];
        }

        return {
          label: item.title ?? "Unknown Goal",
          description: item.description ?? "",
          info: true,
          values,
        };
      });
  }, [filteredItems, activeTab, monthlyDays.length, selectedMonth, selectedYear]);

  const deleteReportMutation = useMutation({
    ...residentsCarePlanReportsDestroyMutation(),
    onSuccess: async () => {
      setSnackbar({ isOpen: true, message: "Report deleted successfully", status: "success" });
      const queryKey = residentsCarePlanReportsListQueryKey({
        path: { uuid: residentId as string },
      });
      await queryClient.resetQueries({ queryKey });
    },
    onError: (error: any) => {
      setSnackbar({
        isOpen: true,
        message: extractApiError(error) || "Failed to delete report",
        status: "error",
      });
      const queryKey = residentsCarePlanReportsListQueryKey({
        path: { uuid: residentId as string },
      });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Helpers
  const invalidateCarePlanQueries = () => {
    queryClient.invalidateQueries({
      queryKey: residentsListQueryKey({
        query: { resident_uuid: residentId } as any,
      }),
    });
    if (residentId) {
      queryClient.invalidateQueries({
        queryKey: residentsCarePlanReportsListQueryKey({
          path: { uuid: residentId },
        }),
      });
    }
  };

  const extractApiError = (error: any): string => {
    let errorMessage = "Failed to create item";
    if (error?.response?.data) {
      const errorData = error.response.data;
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData) && errorData.length > 0) {
        errorMessage = errorData[0];
      } else if (typeof errorData === "object") {
        const firstKey = Object.keys(errorData)[0];
        if (firstKey) {
          const firstValue = errorData[firstKey];
          if (Array.isArray(firstValue) && firstValue.length > 0) {
            errorMessage = firstValue[0];
          } else if (typeof firstValue === "string") {
            errorMessage = firstValue;
          }
        }
      }
    } else if (error?.message) {
      errorMessage = error.message;
    }
    return errorMessage;
  };

  // Report handlers
  const handleDeleteReport = (report: CarePlanReport) => {
    const queryKey = residentsCarePlanReportsListQueryKey({
      path: { uuid: residentId as string },
    });

    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData;
      if (Array.isArray(oldData)) {
        return oldData.filter((r: CarePlanReport) => r.uuid !== report.uuid);
      }
      if (Array.isArray(oldData?.data)) {
        return { ...oldData, data: oldData.data.filter((r: CarePlanReport) => r.uuid !== report.uuid) };
      }
      if (Array.isArray(oldData?.results)) {
        return { ...oldData, results: oldData.results.filter((r: CarePlanReport) => r.uuid !== report.uuid) };
      }
      return oldData;
    });

    deleteReportMutation.mutate({ path: { uuid: report.uuid } });
  };

  return {
    // Query state
    isLoading,
    isError,
    isReportsLoading,
    // Derived data
    adls,
    goals,
    allGoals,
    filteredItems,
    carePlanItems,
    reports,
    monthlyDays,
    monthlyRows,
    // Mutations
    createItem,
    updateItem,
    archiveItem,
    deleteReportMutation,
    // Handlers
    handleDeleteReport,
    invalidateCarePlanQueries,
    extractApiError,
    // Snackbar
    snackbar,
    setSnackbar,
  };
}
