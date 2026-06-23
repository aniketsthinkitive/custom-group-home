import {
  Box,
  Grid,
  Typography,
  Menu,
  MenuItem,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import { useCallback, useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import type { CarePlanReport } from "../../../sdk/types.gen";
import { retrieveGroupHomeOptions } from "../../../sdk/@tanstack/react-query.gen";

import CarePlanToolbar from "./CarePlanToolbar";
import CarePlanTrackingTab, { type CarePlanItem } from "./CarePlanTrackingTab";
import CarePlanMonthlySummary from "./CarePlanMonthlySummary";
import CarePlanHistoryDrawer from "./CarePlanHistoryDrawer";
import MonthlyReportDrawer from "./MonthlyReportDrawer";
import CarePlanReportsTable from "./CarePlanReportsTable";
import CarePlanItemDialog from "./CarePlanItemDialog";

import { useCarePlanData } from "../hooks/useCarePlanData";
import { useCarePlanDailyLogs } from "../hooks/useCarePlanDailyLogs";
import { API_SHIFT_MAP, UI_SHIFT_MAP, SHIFT_OPTIONS, type ShiftOption } from "../utils/carePlanConstants";
import { convert24To12Hour } from "../../settings/utils/groupHomeFormUtils";

import { usePermission } from "../../../hooks/usePermission";

interface CarePlanProps {
  residentId?: string;
  search?: string;
  showArchived?: boolean;
  onInternalTabChange?: (tab: number) => void;
  isMovedOut?: boolean;
  groupHomeUuid?: string;
}

const EmptyState = ({ message }: { message: string }) => (
  <Grid
    container
    sx={{
      flex: 1,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "50px",
      minHeight: 0,
    }}
  >
    <Grid size={{ xs: 12 }} sx={{ display: "flex", justifyContent: "center" }}>
      <Typography fontSize={14} color="text.secondary" sx={{ textAlign: "center" }}>
        {message}
      </Typography>
    </Grid>
  </Grid>
);

const CarePlan = ({
  residentId,
  search,
  showArchived,
  onInternalTabChange,
  isMovedOut = false,
  groupHomeUuid = "",
}: CarePlanProps) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [shifts, setShifts] = useState<string[]>(["morning"]);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("MMMM"));
  const [selectedYear, setSelectedYear] = useState(dayjs().format("YYYY"));

  const { hasPermission } = usePermission();

  // Fetch group home details to get configured shifts
  const { data: groupHomeData } = useQuery({
    ...retrieveGroupHomeOptions({
      path: { uuid: groupHomeUuid },
    }),
    enabled: !!groupHomeUuid,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Build dynamic shift options from group home data, fallback to static SHIFT_OPTIONS
  const shiftOptions: ShiftOption[] = useMemo(() => {
    const ghShifts = (groupHomeData as any)?.data?.shifts ?? (groupHomeData as any)?.shifts;
    if (!ghShifts || !Array.isArray(ghShifts) || ghShifts.length === 0) {
      return SHIFT_OPTIONS;
    }
    const activeShifts = ghShifts.filter((s: any) => s.is_active !== false);
    if (activeShifts.length === 0) return SHIFT_OPTIONS;

    const shiftLabelMap: Record<string, { key: "morning" | "evening" | "night"; label: string }> = {
      MORNING: { key: "morning", label: "Morning" },
      EVENING: { key: "evening", label: "Evening" },
      NIGHT: { key: "night", label: "Night" },
    };

    return activeShifts
      .map((s: any) => {
        const mapped = shiftLabelMap[s.shift];
        if (!mapped) return null;
        const from12 = convert24To12Hour(s.start_time);
        const to12 = convert24To12Hour(s.end_time);
        const fromStr = `${parseInt(from12.time.split(":")[0], 10)}:${from12.time.split(":")[1]} ${from12.amPm}`;
        const toStr = `${parseInt(to12.time.split(":")[0], 10)}:${to12.time.split(":")[1]} ${to12.amPm}`;
        return {
          key: mapped.key,
          label: mapped.label,
          time: `${fromStr} - ${toStr}`,
        } as ShiftOption;
      })
      .filter(Boolean) as ShiftOption[];
  }, [groupHomeData]);

  // Dialog states
  const [adlDialogOpen, setAdlDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editAdlDialogOpen, setEditAdlDialogOpen] = useState(false);
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false);
  const [editInitialData, setEditInitialData] = useState<{
    title: string;
    description: string;
    shifts: string[];
  }>({ title: "", description: "", shifts: [] });
  const [reportDrawerOpen, setReportDrawerOpen] = useState(false);
  const [viewReportDrawerOpen, setViewReportDrawerOpen] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState<CarePlanReport | null>(null);

  // Menu states - unified
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuItemUuid, setMenuItemUuid] = useState<string | null>(null);
  const [menuItemType, setMenuItemType] = useState<"ADL" | "GOAL">("ADL");

  // History drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyItemUuid, setHistoryItemUuid] = useState<string | null>(null);
  const [historyItemType, setHistoryItemType] = useState<"ADL" | "GOAL">("ADL");

  // Data hook
  const {
    isLoading,
    isError,
    isReportsLoading,
    adls,
    goals,
    allGoals,
    carePlanItems,
    reports,
    monthlyDays,
    monthlyRows,
    createItem,
    updateItem,
    archiveItem,
    handleDeleteReport,
    invalidateCarePlanQueries,
    extractApiError,
    snackbar,
    setSnackbar,
  } = useCarePlanData({
    residentId,
    activeTab,
    shifts,
    selectedDate,
    selectedMonth,
    selectedYear,
    search,
    showArchived,
  });

  // Daily logs hook
  const {
    selectedLogs,
    isSaving,
    canSave,
    needsStatusSelection,
    onStatusChange,
    onNoteChange,
    handleSave,
  } = useCarePlanDailyLogs({
    activeTab,
    shifts,
    selectedDate,
    residentId,
    adls,
    goals,
    carePlanItems,
    invalidateCarePlanQueries,
    setSnackbar,
  });

  // Notify parent about tab change
  useEffect(() => {
    onInternalTabChange?.(activeTab);
  }, [activeTab, onInternalTabChange]);

  // Handlers
  const handleCreateItem = useCallback(
    async (title: string, description: string, itemShifts: string[]) => {
      const type = activeTab === 0 ? "ADL" : "GOAL";
      const body = {
        resident: residentId,
        type,
        title: title || null,
        description: description || null,
        shifts: itemShifts.map((s) => ({ shift: API_SHIFT_MAP[s] })),
      } as any;
      try {
        await createItem.mutateAsync({ body });
        setAdlDialogOpen(false);
        setGoalDialogOpen(false);
        invalidateCarePlanQueries();
        setSnackbar({ isOpen: true, message: `${type} created successfully`, status: "success" });
      } catch (error: any) {
        setSnackbar({ isOpen: true, message: extractApiError(error), status: "error" });
      }
    },
    [activeTab, residentId, createItem, invalidateCarePlanQueries, setSnackbar, extractApiError],
  );

  const handleEditItem = useCallback(
    async (type: "ADL" | "GOAL", uuid: string | null, title: string, description: string, itemShifts: string[]) => {
      if (!uuid) return;
      if (!title.trim()) {
        setSnackbar({ isOpen: true, message: "Title is required", status: "error" });
        return;
      }
      try {
        const body = {
          resident: residentId,
          type,
          title: title || null,
          description: description || null,
          shifts: itemShifts.map((s) => ({ shift: API_SHIFT_MAP[s] })),
        } as any;
        await updateItem.mutateAsync({ path: { uuid }, body });
        if (type === "ADL") setEditAdlDialogOpen(false);
        else setEditGoalDialogOpen(false);
        invalidateCarePlanQueries();
        setSnackbar({ isOpen: true, message: `${type} updated successfully`, status: "success" });
      } catch {
        setSnackbar({ isOpen: true, message: `Failed to update ${type}`, status: "error" });
      }
    },
    [residentId, updateItem, invalidateCarePlanQueries, setSnackbar],
  );

  const handleMenuOpen = useCallback(
    (type: "ADL" | "GOAL") => (e: React.MouseEvent<HTMLElement>, item: CarePlanItem) => {
      setMenuAnchor(e.currentTarget);
      setMenuItemUuid(item.uuid);
      setMenuItemType(type);
    },
    [],
  );

  const handleMenuClose = useCallback(() => setMenuAnchor(null), []);

  const handleMenuEdit = useCallback(() => {
    if (!menuItemUuid) return;
    const items = menuItemType === "ADL" ? adls : goals;
    const item = items.find((i) => i.uuid === menuItemUuid);
    const assigned = (item?.assigned_shifts ?? []) as any[];
    const mapped = Array.isArray(assigned)
      ? (assigned
          .map((s: any) => {
            if (typeof s === "string") {
              const upper = s.toUpperCase() as "MORNING" | "EVENING" | "NIGHT";
              return UI_SHIFT_MAP[upper];
            }
            if (typeof s?.shift === "string") {
              const upper = s.shift.toUpperCase() as "MORNING" | "EVENING" | "NIGHT";
              return UI_SHIFT_MAP[upper];
            }
            return undefined;
          })
          .filter(Boolean) as string[])
      : [];
    setEditInitialData({
      title: item?.title ?? "",
      description: item?.description ?? "",
      shifts: mapped,
    });
    if (menuItemType === "ADL") setEditAdlDialogOpen(true);
    else setEditGoalDialogOpen(true);
    handleMenuClose();
  }, [menuItemUuid, menuItemType, adls, goals, handleMenuClose]);

  const handleMenuHistory = useCallback(() => {
    if (menuItemUuid) {
      setHistoryItemUuid(menuItemUuid);
      setHistoryItemType(menuItemType);
      setHistoryDrawerOpen(true);
    }
    handleMenuClose();
  }, [menuItemUuid, menuItemType, handleMenuClose]);

  const handleMenuArchive = useCallback(async () => {
    if (menuItemUuid) {
      try {
        await archiveItem.mutateAsync({ path: { uuid: menuItemUuid } });
        invalidateCarePlanQueries();
        setSnackbar({ isOpen: true, message: "Item archived successfully", status: "success" });
      } catch {
        setSnackbar({ isOpen: true, message: "Failed to archive item", status: "error" });
      }
    }
    handleMenuClose();
  }, [menuItemUuid, archiveItem, invalidateCarePlanQueries, setSnackbar, handleMenuClose]);

  const handleViewReport = useCallback((report: CarePlanReport) => {
    setSelectedReportForView(report);
    setViewReportDrawerOpen(true);
  }, []);

  const handlePrintReport = useCallback((report: CarePlanReport) => {
    const pdfUrl = (report as any).pdf_url;
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  }, []);

  const handleNewClick = useCallback(() => {
    activeTab === 0 ? setAdlDialogOpen(true) : setGoalDialogOpen(true);
  }, [activeTab]);

  const handleGenerateReportClick = useCallback(() => setReportDrawerOpen(true), []);

  const handleReportDrawerClose = useCallback(() => {
    setReportDrawerOpen(false);
    setViewReportDrawerOpen(false);
    setSelectedReportForView(null);
  }, []);

  const handleSnackbarClose = useCallback(() => {
    setSnackbar({ ...snackbar, isOpen: false });
  }, [snackbar, setSnackbar]);

  // Check if menu item is archived
  const menuItems = menuItemType === "ADL" ? adls : goals;
  const isMenuItemArchived = menuItems.find((i) => i.uuid === menuItemUuid)?.is_archived;

  if (isError) {
    return (
      <Grid container sx={{ p: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Typography color="error">Failed to load care plan.</Typography>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid
      container
      sx={{
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        height: "100%",
        minHeight: 0,
        maxHeight: "100%",
        overflow: "hidden",
      }}
    >
      {/* TOOLBAR */}
      <Grid
        size={{ xs: 12 }}
        sx={{
          backgroundColor: "background.paper",
          position: "sticky",
          top: 0,
          zIndex: 999,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <CarePlanToolbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          shifts={shifts}
          onShiftChange={setShifts}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onNewClick={handleNewClick}
          onFilterClick={() => {}}
          onGenerateReportClick={handleGenerateReportClick}
          isLoading={isLoading}
          isMovedOut={isMovedOut}
          shiftOptions={shiftOptions}
        />
      </Grid>

      {/* CONTENT */}
      <Grid
        size={{ xs: 12 }}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          pr: { xs: 0, sm: 0.5 },
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isLoading && (
          <Grid
            container
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 10,
            }}
          >
            <Grid>
              <CircularProgress />
            </Grid>
          </Grid>
        )}

        {/* ADL TAB */}
        {activeTab === 0 && !isLoading && (
          <Grid container sx={{ flex: 1, p: { xs: 1, sm: 2 }, minHeight: 0 }}>
            <Grid size={{ xs: 12 }} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              {adls.length > 0 ? (
                <CarePlanTrackingTab
                  items={adls}
                  onMenuOpen={handleMenuOpen("ADL")}
                  onStatusChange={onStatusChange}
                  onNoteChange={onNoteChange}
                  selectedLogs={selectedLogs}
                />
              ) : (
                <EmptyState message="No ADL items found for this resident." />
              )}
            </Grid>
          </Grid>
        )}

        {/* GOALS TAB */}
        {activeTab === 1 && !isLoading && (
          <Grid container sx={{ flex: 1, p: { xs: 1, sm: 2 }, minHeight: 0 }}>
            <Grid size={{ xs: 12 }} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              {goals.length > 0 ? (
                <CarePlanTrackingTab
                  items={goals}
                  onMenuOpen={handleMenuOpen("GOAL")}
                  onStatusChange={onStatusChange}
                  onNoteChange={onNoteChange}
                  selectedLogs={selectedLogs}
                />
              ) : (
                <EmptyState message="No daily tracking items found for this resident." />
              )}
            </Grid>
          </Grid>
        )}

        {/* MONTHLY SUMMARY TAB */}
        {activeTab === 2 && !isLoading && (
          <Grid container sx={{ flex: 1, p: { xs: 1, sm: 2 }, minHeight: 0 }}>
            <Grid size={{ xs: 12 }} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              {monthlyRows.length > 0 ? (
                <CarePlanMonthlySummary days={monthlyDays} rows={monthlyRows} />
              ) : (
                <EmptyState message="Monthly summary not available." />
              )}
            </Grid>
          </Grid>
        )}

        {/* VIEW REPORT TAB */}
        {activeTab === 3 && (
          <Grid container sx={{ '&&': { flex: 1 }, p: { xs: 1, sm: 2 }, position: "relative", minHeight: 0 }}>
            <Grid size={{ xs: 12 }} sx={{ '&&': { height: "100%", display: "flex", flexDirection: "column" }, position: "relative" }}>
              {isReportsLoading && (
                <Grid
                  container
                  sx={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    zIndex: 10,
                  }}
                >
                  <Grid>
                    <CircularProgress />
                  </Grid>
                </Grid>
              )}
              {reports.length === 0 && !isReportsLoading ? (
                <EmptyState message="No reports found." />
              ) : (
                <CarePlanReportsTable
                  data={reports}
                  isLoading={isReportsLoading}
                  onView={handleViewReport}
                  onPrint={handlePrintReport}
                  onDelete={handleDeleteReport}
                />
              )}
            </Grid>
          </Grid>
        )}
      </Grid>

      {/* SAVE BUTTON */}
      {(activeTab === 0 || activeTab === 1) && (
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            backgroundColor: "background.paper",
            borderTop: `1px solid ${theme.palette.divider}`,
            px: { xs: 1, sm: 2 },
            py: 1.5,
            boxShadow: "0 -2px 4px rgba(16, 24, 40, 0.06)",
            position: "sticky",
            bottom: 0,
            zIndex: 998,
          }}
        >
          <Tooltip
            title={
              (activeTab === 0 && !hasPermission("adls.record")) ||
              (activeTab === 1 && !hasPermission("goals.edit"))
                ? "You don't have permission"
                : isMovedOut
                ? "Resident is Moved Out. We cannot change Moved Out resident details."
                : needsStatusSelection
                ? "Select a Work Status (Worked / Did Not Work / Could Not Work) for each item you added a note to"
                : ""
            }
            arrow
          >
            <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
              <CustomButton
                variant="primary"
                loading={isSaving}
                disabled={
                  !canSave ||
                  isMovedOut ||
                  (activeTab === 0 && !hasPermission("adls.record")) ||
                  (activeTab === 1 && !hasPermission("goals.edit"))
                }
                onClick={handleSave}
              >
                Save Changes
              </CustomButton>
            </Box>
          </Tooltip>
        </Grid>
      )}

      {/* MONTHLY REPORT DRAWER */}
      <MonthlyReportDrawer
        open={reportDrawerOpen || viewReportDrawerOpen}
        onClose={handleReportDrawerClose}
        month={selectedMonth}
        year={selectedYear}
        goals={allGoals}
        viewOnly={viewReportDrawerOpen}
        reportData={selectedReportForView}
        onReportCreated={() => invalidateCarePlanQueries()}
        residentUuid={residentId}
      />

      {/* UNIFIED MENU */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ dense: true }}
        PaperProps={{ sx: { mt: 0.5, minWidth: 120 } }}
      >
        <Tooltip
          title={
            isMenuItemArchived
              ? "This item is archived"
              : isMovedOut
              ? "Resident is Moved Out"
              : (menuItemType === "ADL" ? !hasPermission("adls.edit") : !hasPermission("goals.edit"))
              ? "You don't have permission"
              : ""
          }
          arrow
          placement="left"
          disableHoverListener={
            !isMenuItemArchived && !isMovedOut && (menuItemType === "ADL" ? hasPermission("adls.edit") : hasPermission("goals.edit"))
          }
        >
          <span>
            <MenuItem disabled={isMenuItemArchived || isMovedOut || (menuItemType === "ADL" ? !hasPermission("adls.edit") : !hasPermission("goals.edit"))} onClick={handleMenuEdit} sx={{ fontSize: 12, color: "text.primary" }}>
              Edit
            </MenuItem>
          </span>
        </Tooltip>
        <MenuItem onClick={handleMenuHistory} sx={{ fontSize: 12, color: "text.primary" }}>
          History
        </MenuItem>
        <Tooltip
          title={
            isMovedOut
              ? "Resident is Moved Out"
              : (menuItemType === "GOAL" ? !hasPermission("goals.delete") : false)
              ? "You don't have permission"
              : ""
          }
          arrow
          placement="left"
          disableHoverListener={
            !isMovedOut && !(menuItemType === "GOAL" ? !hasPermission("goals.delete") : false)
          }
        >
          <span>
            <MenuItem disabled={isMovedOut || (menuItemType === "GOAL" ? !hasPermission("goals.delete") : false)} onClick={handleMenuArchive} sx={{ fontSize: 12, color: "text.primary" }}>
              Archive
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>

      {/* ADD / EDIT DIALOGS */}
      <CarePlanItemDialog
        open={adlDialogOpen}
        onClose={() => setAdlDialogOpen(false)}
        onSubmit={handleCreateItem}
        dialogTitle="Add New ADL"
        buttonLabel="Add"
        isSubmitting={createItem.isPending}
        itemType="ADL"
        shiftOptions={shiftOptions}
      />
      <CarePlanItemDialog
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
        onSubmit={handleCreateItem}
        dialogTitle="Add New Goal"
        buttonLabel="Add"
        isSubmitting={createItem.isPending}
        itemType="GOAL"
        shiftOptions={shiftOptions}
      />
      <CarePlanItemDialog
        open={editAdlDialogOpen}
        onClose={() => setEditAdlDialogOpen(false)}
        onSubmit={(title, desc, itemShifts) =>
          handleEditItem("ADL", menuItemUuid, title, desc, itemShifts)
        }
        dialogTitle="Edit ADL"
        buttonLabel="Save"
        initialTitle={editInitialData.title}
        initialDescription={editInitialData.description}
        initialShifts={editInitialData.shifts}
        isSubmitting={updateItem.isPending}
        itemType="ADL"
        shiftOptions={shiftOptions}
      />
      <CarePlanItemDialog
        open={editGoalDialogOpen}
        onClose={() => setEditGoalDialogOpen(false)}
        onSubmit={(title, desc, itemShifts) =>
          handleEditItem("GOAL", menuItemUuid, title, desc, itemShifts)
        }
        dialogTitle="Edit Goal"
        buttonLabel="Save"
        initialTitle={editInitialData.title}
        initialDescription={editInitialData.description}
        initialShifts={editInitialData.shifts}
        isSubmitting={updateItem.isPending}
        itemType="GOAL"
        shiftOptions={shiftOptions}
      />

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={handleSnackbarClose}
        autoClose={true}
        autoCloseDelay={3000}
      />

      <CarePlanHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        uuid={historyItemUuid}
        type={historyItemType}
      />
    </Grid>
  );
};

export default CarePlan;
