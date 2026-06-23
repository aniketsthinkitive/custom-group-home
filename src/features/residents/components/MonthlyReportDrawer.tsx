import React, { useMemo, useState } from "react";
import { Box, Grid, Typography, IconButton, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomSelect from "../../../components/custom-select/custom-select";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import CustomInput from "../../../components/custom-input/custom-input";
import {
  getLeadDetailOptions,
  residentsCarePlanReportsCreateMutation,
} from "../../../sdk/@tanstack/react-query.gen";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { MONTHS, YEARS, MONTH_INDEX_MAP } from "../utils/carePlanConstants";
import type { CarePlanItem } from "./CarePlanTrackingTab";

interface MonthlyReportDrawerProps {
  open: boolean;
  onClose: () => void;
  month: string;
  year: string;
  goals: CarePlanItem[];
  viewOnly?: boolean;
  reportData?: any;
  mode?: "drawer" | "inline";
  onReportCreated?: () => void;
  residentUuid?: string;
}

// Monthly reports cover completed months only — the latest selectable
// month is the previous calendar month.
const lastAllowedMonth = () => dayjs().subtract(1, "month");

const isMonthYearAllowed = (monthIdx: number, year: number) => {
  const last = lastAllowedMonth();
  return (
    year < last.year() || (year === last.year() && monthIdx <= last.month())
  );
};

export default function MonthlyReportDrawer({
  open,
  onClose,
  month,
  year,
  goals,
  viewOnly = false,
  reportData = null,
  mode = "drawer",
  onReportCreated,
  residentUuid,
}: MonthlyReportDrawerProps) {
  const theme = useTheme();
  const { residentId: routeResidentId } = useParams<{ residentId: string }>();
  const residentId = residentUuid || routeResidentId;

  // Clamp an incoming month/year to the latest allowed (previous) month so
  // the drawer never opens on the current or a future month in generate mode
  const clampSelection = React.useCallback(
    (m: string, y: string): { month: string; year: string } => {
      const mIdx = MONTH_INDEX_MAP[m] ?? 0;
      const yNum = Number(y) || dayjs().year();
      if (isMonthYearAllowed(mIdx, yNum)) return { month: m, year: y };
      const last = lastAllowedMonth();
      return { month: MONTHS[last.month()], year: String(last.year()) };
    },
    [],
  );

  const initialSelection = clampSelection(month, year);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialSelection.month);
  const [selectedYear, setSelectedYear] = useState<string>(initialSelection.year);
  const [reports, setReports] = useState<Record<string, string>>({});

  // Month options: disable current + future months for the selected year
  // (view mode shows whatever the report was created for)
  const monthSelectItems = useMemo(() => {
    const yNum = Number(selectedYear) || dayjs().year();
    return MONTHS.map((m, idx) => ({
      label: m,
      value: m,
      disabled: !viewOnly && !isMonthYearAllowed(idx, yNum),
    }));
  }, [selectedYear, viewOnly]);

  // Year options: disable years with no completed months
  const yearSelectItems = useMemo(() => {
    const lastYear = lastAllowedMonth().year();
    return YEARS.map((y) => ({
      label: y,
      value: y,
      disabled: !viewOnly && Number(y) > lastYear,
    }));
  }, [viewOnly]);

  // Changing the year can make the selected month invalid (e.g. December →
  // current year while only Jan–May are completed) — clamp it
  const handleYearChange = React.useCallback(
    (y: string) => {
      setSelectedYear(y);
      setSelectedMonth((prevMonth) => clampSelection(prevMonth, y).month);
    },
    [clampSelection],
  );

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  // Reset form state when drawer opens or closes
  React.useEffect(() => {
    if (!open) {
      const clamped = clampSelection(month, year);
      setSelectedMonth(clamped.month);
      setSelectedYear(clamped.year);
      setReports({});
      return;
    }
    if (open && !viewOnly) {
      const clamped = clampSelection(month, year);
      setSelectedMonth(clamped.month);
      setSelectedYear(clamped.year);
      setReports({});
    }
  }, [open, viewOnly, month, year, clampSelection]);

  React.useEffect(() => {
    if (viewOnly && reportData) {
      if (reportData.report_month) {
        setSelectedMonth(MONTHS[reportData.report_month - 1]);
      }
      if (reportData.report_year) {
        setSelectedYear(String(reportData.report_year));
      }
      if (reportData.report_data?.goals) {
        const newReports: Record<string, string> = {};
        reportData.report_data.goals.forEach((g: any, idx: number) => {
          // Use a stable key: try matching by title to existing goal uuid, else use index
          const matchingGoal = goals.find((goal) => goal.title === g.title);
          const key = matchingGoal?.uuid || `report-goal-${idx}`;
          newReports[key] = g.report_text || "";
        });
        setReports(newReports);
      }
    }
  }, [viewOnly, reportData, goals]);

  // NOTE: report fields intentionally start blank in generate mode — they are
  // no longer prefilled from each goal's monthly_progress summary.

  const monthIndex = useMemo(() => Math.max(0, MONTH_INDEX_MAP[selectedMonth] ?? 0), [selectedMonth]);

  const fromDate = useMemo(() => {
    const y = Number(selectedYear) || dayjs().year();
    return dayjs(new Date(y, monthIndex, 1)).format("MM-DD-YYYY");
  }, [selectedYear, monthIndex]);

  const toDate = useMemo(() => {
    const y = Number(selectedYear) || dayjs().year();
    const lastDay = new Date(y, monthIndex + 1, 0).getDate();
    return dayjs(new Date(y, monthIndex, lastDay)).format("MM-DD-YYYY");
  }, [selectedYear, monthIndex]);

  const { data: leadDetail } = useQuery({
    ...getLeadDetailOptions({
      path: { uuid: routeResidentId || "" },
    }),
    enabled: open && Boolean(routeResidentId),
  });

  const lead = (leadDetail as any)?.data?.data ?? (leadDetail as any)?.data ?? (leadDetail as any) ?? {};
  const user = lead?.user;
  const individualName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "";
  const dob = lead?.date_of_birth || user?.date_of_birth || user?.dob || "";
  const age = useMemo(() => {
    if (!dob) return "";
    const d = dayjs(dob);
    if (!d.isValid()) return "";
    return String(dayjs().diff(d, "year"));
  }, [dob]);

  const generateMutation = useMutation({
    ...residentsCarePlanReportsCreateMutation(),
    onSuccess: (data: any) => {
      try {
        const pdfUrl = data?.data?.pdf_url;

        if (pdfUrl) {
          const link = document.createElement("a");
          link.href = pdfUrl;
          const safeName = individualName.replace(/\s+/g, "_");
          link.setAttribute("download", `Monthly_Report_${safeName}_${selectedMonth}_${selectedYear}.pdf`);
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }

        setSnackbar({
          isOpen: true,
          message: "Monthly report generated and exported successfully!",
          status: "success",
        });

        onReportCreated?.();

        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (err) {
        console.error("Error processing report response:", err);
        setSnackbar({
          isOpen: true,
          message: "Report saved but failed to download the PDF.",
          status: "error",
        });
      }
    },
    onError: (error: any) => {
      console.error("Error generating report:", error);
      setSnackbar({
        isOpen: true,
        message: "Failed to generate monthly report. Please check the console for details.",
        status: "error",
      });
    },
  });

  const handleReportChange = (uuid: string, value: string) => {
    setReports((prev) => ({ ...prev, [uuid]: value }));
  };

  const isFormValid = useMemo(() => {
    return goals.length > 0 && goals.every((g) => reports[g.uuid]?.trim());
  }, [goals, reports]);

  const handleGenerateAndExport = () => {
    if (!isFormValid || !residentId) return;

    const payload = {
      resident_uuid: residentId,
      report_month: monthIndex + 1,
      report_year: Number(selectedYear),
      report_data: {
        goals: goals.map((g) => ({
          care_plan_item_id: Number(g.id),
          title: g.title || "",
          description: g.description || "",
          report_text: reports[g.uuid] || "",
        })),
      },
    };

    generateMutation.mutate({
      body: payload as any,
    });
  };

  const isInline = mode === "inline";

  const content = (
    <Grid container direction="column" sx={{ height: "100%", backgroundColor: "background.paper" }}>
      {/* Header */}
      {!isInline && (
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
            height: "64px",
            minHeight: "64px",
            px: 3,
            boxSizing: "border-box",
            marginTop: "-10px"
          }}
        >
          <Typography sx={{ fontWeight: 400, fontSize: "20px", color: "text.primary" }}>
            {viewOnly ? "View Monthly Report" : "Generate Monthly Report"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Box sx={{ width: 150 }}>
              <CustomSelect
                name="month"
                value={selectedMonth}
                placeholder="Select Month"
                items={monthSelectItems}
                onChange={(e) => setSelectedMonth(e.target.value)}
                isDisabled={viewOnly}
              />
            </Box>
            <Box sx={{ width: 110 }}>
              <CustomSelect
                name="year"
                value={selectedYear}
                placeholder="Select Year"
                items={yearSelectItems}
                onChange={(e) => handleYearChange(e.target.value)}
                isDisabled={viewOnly}
              />
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseOutlinedIcon />
            </IconButton>
          </Box>
        </Grid>
      )}

      {/* Body */}
      <Grid
        size={{ xs: 12 }}
        sx={{
          flex: 1,
          overflowY: "auto",
          padding: isInline ? "0 0 16px 0" : "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {isInline && (
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
            <Box sx={{ width: 150 }}>
              <CustomSelect
                name="month"
                value={selectedMonth}
                placeholder="Select Month"
                items={monthSelectItems}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </Box>
            <Box sx={{ width: 110 }}>
              <CustomSelect
                name="year"
                value={selectedYear}
                placeholder="Select Year"
                items={yearSelectItems}
                onChange={(e) => handleYearChange(e.target.value)}
              />
            </Box>
          </Box>
        )}

        {/* Resident info bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 1.5,
            borderRadius: 2,
            backgroundColor: theme.palette.grey[50],
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Individual&apos;s Name :</Typography>
            <Typography sx={{ fontSize: 14, color: "text.primary", fontWeight: 600 }}>{individualName || "\u2014"}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Date of Birth :</Typography>
            <Typography sx={{ fontSize: 14, color: "text.primary", fontWeight: 600 }}>
              {dob ? dayjs(dob).format("MM/DD/YYYY") : "\u2014"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Age :</Typography>
            <Typography sx={{ fontSize: 14, color: "text.primary", fontWeight: 600 }}>{age || "\u2014"}</Typography>
          </Box>
        </Box>

        {/* Date range */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>From</Typography>
          <Box sx={{ width: 240 }}>
            <DatePickerField value={fromDate} onChange={() => {}} disableFuture isWithIcon disabled={true} />
          </Box>
          <Typography sx={{ color: "text.secondary" }}>-</Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>To</Typography>
          <Box sx={{ width: 240 }}>
            <DatePickerField value={toDate} onChange={() => {}} disableFuture isWithIcon disabled={true} />
          </Box>
        </Box>

        {/* Goals */}
        {viewOnly && reportData?.report_data?.goals
          ? reportData.report_data.goals.map((g: any, idx: number) => (
              <Box key={`view-goal-${idx}`} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
                  {g.title || `Goal ${idx + 1}`}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.75 }}>{g.description || "\u2014"}</Typography>
                <Box sx={{ mt: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>Report</Typography>
                  <CustomInput
                    placeholder="Enter"
                    name={`view-report-${idx}`}
                    value={g.report_text || ""}
                    onChange={() => {}}
                    multiline
                    rows={3}
                    bgWhite
                    disableField
                  />
                </Box>
              </Box>
            ))
          : goals.map((g, idx) => (
              <Box key={g.uuid} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 2 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "text.primary" }}>
                  {g.title || `Goal ${idx + 1}`}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.75 }}>{g.description || "\u2014"}</Typography>
                <Box sx={{ mt: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>Report</Typography>
                  <CustomInput
                    placeholder="Enter"
                    name={`report-${g.uuid}`}
                    value={reports[g.uuid] || ""}
                    onChange={(e) => handleReportChange(g.uuid, e.target.value)}
                    multiline
                    rows={3}
                    bgWhite
                    disableField={viewOnly}
                  />
                </Box>
              </Box>
            ))}
      </Grid>

      {/* Footer */}
      <Grid
        size={{ xs: 12 }}
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "flex-end",
          borderTop: !isInline ? `1px solid ${theme.palette.divider}` : "none",
          padding: isInline ? "16px 0 0 0" : "12px 24px",
        }}
      >
        {!isInline && (
          <CustomButton variant="outline" onClick={onClose}>
            {viewOnly ? "Close" : "Cancel"}
          </CustomButton>
        )}
        {!viewOnly && (
          <CustomButton
            variant="primary"
            disabled={!isFormValid || generateMutation.isPending}
            loading={generateMutation.isPending}
            onClick={handleGenerateAndExport}
            sx={{ minWidth: "160px" }}
          >
            Generate & Export
          </CustomButton>
        )}
      </Grid>
    </Grid>
  );

  if (isInline) return content;

  return (
    <CustomDrawer anchor="right" open={open} onClose={onClose} drawerWidth="750px" drawermargin="0" drawerPadding="0">
      {content}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
      />
    </CustomDrawer>
  );
}
