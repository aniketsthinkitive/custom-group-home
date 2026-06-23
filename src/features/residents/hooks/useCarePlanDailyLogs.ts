import { useState, useEffect, useCallback, useMemo } from "react";
import { residentsDailyLogsCreate } from "../../../sdk/sdk.gen";
import type { CarePlanItem } from "../components/CarePlanTrackingTab";
import {
  API_SHIFT_MAP,
  API_TO_UI_STATUS_MAP,
  STATUS_MAP,
  type UiStatus,
} from "../utils/carePlanConstants";

export const CARE_PLAN_MESSAGES = {
  ADL: {
    SUCCESS: 'ADL data saved successfully',
    ERROR: 'Select a Work Status (Worked / Did Not Work / Could Not Work) for each ADL before saving',
  },
  DAILY_TRACKING: {
    SUCCESS: 'Daily tracking data saved successfully',
    ERROR: 'Please select a Work Status before saving Daily Tracking',
  },
};

const getSuccessMessage = (tab: number) => {
  switch (tab) {
    case 0:
      return CARE_PLAN_MESSAGES.ADL.SUCCESS;
    case 1:
      return CARE_PLAN_MESSAGES.DAILY_TRACKING.SUCCESS;
    default:
      return 'Data saved successfully';
  }
};

const getErrorMessage = (tab: number) => {
  switch (tab) {
    case 0:
      return CARE_PLAN_MESSAGES.ADL.ERROR;
    case 1:
      return CARE_PLAN_MESSAGES.DAILY_TRACKING.ERROR;
    default:
      return 'Please fill required fields';
  }
};

interface UseCarePlanDailyLogsParams {
  activeTab: number;
  shifts: string[];
  selectedDate: string;
  residentId?: string;
  adls: CarePlanItem[];
  goals: CarePlanItem[];
  carePlanItems: any[];
  invalidateCarePlanQueries: () => void;
  setSnackbar: (snackbar: { isOpen: boolean; message: string; status: "success" | "error" }) => void;
}

export function useCarePlanDailyLogs({
  activeTab,
  shifts,
  selectedDate,
  residentId,
  adls,
  goals,
  carePlanItems,
  invalidateCarePlanQueries,
  setSnackbar,
}: UseCarePlanDailyLogsParams) {
  const [baselineLogs, setBaselineLogs] = useState<
    Record<string, { status?: UiStatus; note?: string }>
  >({});
  const [selectedLogs, setSelectedLogs] = useState<
    Record<string, { status?: UiStatus; note?: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Prefill from API data
  useEffect(() => {
    if (!(activeTab === 0 || activeTab === 1)) {
      setBaselineLogs({});
      setSelectedLogs({});
      return;
    }
    if (shifts.length !== 1) {
      setBaselineLogs({});
      setSelectedLogs({});
      return;
    }
    const items = activeTab === 0 ? adls : goals;
    const prefill: Record<string, { status?: UiStatus; note?: string }> = {};
    for (const it of items) {
      if (!(it.status || it.note)) continue;
      prefill[it.uuid] = {
        status: it.status as UiStatus | undefined,
        note: typeof it.note === "string" ? it.note : undefined,
      };
    }
    setBaselineLogs(prefill);
    setSelectedLogs(prefill);
  }, [activeTab, shifts, adls, goals]);

  const onStatusChange = useCallback((uuid: string, status: string) => {
    setSelectedLogs((prev) => ({
      ...prev,
      [uuid]: {
        ...prev[uuid],
        status: status as UiStatus,
      },
    }));
  }, []);

  const onNoteChange = useCallback((uuid: string, note: string) => {
    setSelectedLogs((prev) => ({
      ...prev,
      [uuid]: { ...prev[uuid], note },
    }));
  }, []);

  const hasChanges = useMemo(() => {
    return Object.entries(selectedLogs).some(([uuid, val]) => {
      const base = baselineLogs[uuid] || {};
      return (
        (val.status && val.status !== base.status) ||
        (typeof val.note === "string" && val.note !== (base.note || ""))
      );
    });
  }, [selectedLogs, baselineLogs]);

  // Changed entries that still lack a Work Status. The backend requires a
  // status on every log, so a note typed without selecting Worked /
  // Did Not Work / Could Not Work cannot be saved yet.
  const needsStatusSelection = useMemo(() => {
    return Object.entries(selectedLogs).some(([uuid, val]) => {
      const base = baselineLogs[uuid] || {};
      const changed =
        (val.status && val.status !== base.status) ||
        (typeof val.note === "string" && val.note !== (base.note || ""));
      return changed && !val.status;
    });
  }, [selectedLogs, baselineLogs]);

  const canSave = useMemo(() => {
    return (
      Boolean(selectedDate) &&
      shifts.length === 1 &&
      hasChanges &&
      !needsStatusSelection &&
      !isSaving
    );
  }, [selectedDate, shifts, hasChanges, needsStatusSelection, isSaving]);

  const handleSave = useCallback(async () => {
    if (!Boolean(selectedDate)) return;
    if (shifts.length !== 1) return;
    const shiftEnum = API_SHIFT_MAP[shifts[0]];

    const changedEntries = Object.entries(selectedLogs)
      .filter(([uuid, v]) => {
        if (!v.status && typeof v.note !== "string") return false;

        const carePlanItem = carePlanItems.find((item: any) => item?.uuid === uuid);
        if (!carePlanItem) return false;

        let assigned: string[] = [];
        if (Array.isArray(carePlanItem.assigned_shifts)) {
          assigned = carePlanItem.assigned_shifts;
        } else if (typeof carePlanItem.assigned_shifts === "string") {
          try {
            const parsed = JSON.parse(carePlanItem.assigned_shifts);
            assigned = Array.isArray(parsed) ? parsed : [];
          } catch {
            assigned = [];
          }
        }

        if (!Array.isArray(assigned) || assigned.length === 0) return false;

        return assigned.some(
          (shiftStr: string) => String(shiftStr).toUpperCase() === shiftEnum,
        );
      });

    // Validate: all entries with changes must have a Work Status selected
    const missingStatus = changedEntries.filter(([, v]) => !v.status);
    if (missingStatus.length > 0) {
      setSnackbar({
        isOpen: true,
        message: getErrorMessage(activeTab),
        status: "error",
      });
      return;
    }

    const logs = changedEntries
      .map(([uuid, v]) => ({
        care_plan_item_uuid: uuid,
        status: STATUS_MAP[v.status as keyof typeof STATUS_MAP],
        note: typeof v.note === "string" ? v.note : null,
      }));

    if (logs.length === 0) return;
    setIsSaving(true);
    try {
      const body: any = {
        resident_uuid: residentId,
        log_date: selectedDate,
        shift: shiftEnum,
        logs,
      };
      await residentsDailyLogsCreate({ body, throwOnError: true } as any);
      invalidateCarePlanQueries();
      setSnackbar({ isOpen: true, message: getSuccessMessage(activeTab), status: "success" });
      setBaselineLogs((prev) => {
        const next = { ...prev };
        logs.forEach((l) => {
          const ui = API_TO_UI_STATUS_MAP[l.status as keyof typeof API_TO_UI_STATUS_MAP];
          next[l.care_plan_item_uuid] = {
            status: ui,
            note: l.note || undefined,
          };
        });
        return next;
      });
    } catch (err: any) {
      // Try to extract field-specific validation errors from backend response
      const data = err?.response?.data ?? err?.body ?? err?.data;
      let message = "Failed to save data";
      if (data && typeof data === "object") {
        if (data.status) {
          message = getErrorMessage(activeTab);
        } else {
          const firstError = Object.entries(data).find(
            ([, v]) => Array.isArray(v) && v.length > 0,
          );
          if (firstError) {
            message = `${firstError[0]}: ${(firstError[1] as string[])[0]}`;
          }
        }
      }
      setSnackbar({ isOpen: true, message, status: "error" });
    } finally {
      setIsSaving(false);
    }
  }, [activeTab, selectedDate, shifts, selectedLogs, carePlanItems, residentId, invalidateCarePlanQueries, setSnackbar]);

  return {
    selectedLogs,
    baselineLogs,
    isSaving,
    hasChanges,
    needsStatusSelection,
    canSave,
    onStatusChange,
    onNoteChange,
    handleSave,
  };
}
