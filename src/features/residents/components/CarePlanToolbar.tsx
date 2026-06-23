import { Grid, Typography, Tabs, Tab, Tooltip, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { type FC, useMemo } from "react";
import dayjs from "dayjs";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomSelect from "../../../components/custom-select/custom-select";
import { SHIFT_OPTIONS, MONTHS, YEARS, type ShiftOption } from "../utils/carePlanConstants";

import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store/hooks";

interface CarePlanToolbarProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  shifts: string[];
  onShiftChange: (shifts: string[]) => void;
  selectedDate: string;
  onDateChange: (value: string) => void;
  month: string;
  year: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onNewClick: () => void;
  onFilterClick: (e: React.MouseEvent<HTMLElement>) => void;
  onGenerateReportClick: () => void;
  isLoading?: boolean;
  isMovedOut?: boolean;
  shiftOptions?: ShiftOption[];
}

const TAB_LABELS = ["ADL's", "Daily Tracking", "Monthly Summary", "View Report"];

const CarePlanToolbar: FC<CarePlanToolbarProps> = ({
  activeTab,
  onTabChange,
  shifts,
  onShiftChange,
  selectedDate,
  onDateChange,
  month,
  year,
  onMonthChange,
  onYearChange,
  onNewClick,
  onFilterClick,
  onGenerateReportClick,
  isMovedOut = false,
  shiftOptions,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const user = useAppSelector((state) => state.auth.user);
  const isDSP = user?.role?.name === "DSP";
  const isNurse = user?.role?.name === "Nurse";
  const { hasPermission } = usePermission();
  const showTrackingControls = activeTab === 0 || activeTab === 1;
  const displayShifts = shiftOptions && shiftOptions.length > 0 ? shiftOptions : SHIFT_OPTIONS;

  const handleShiftToggle = (key: string) => {
    if (!shifts.includes(key)) {
      onShiftChange([key]);
    }
  };

  const monthItems = useMemo(
    () => MONTHS.map((m) => ({ value: m, label: m })),
    [],
  );
  const yearItems = useMemo(
    () => YEARS.map((y) => ({ value: y, label: y })),
    [],
  );

  return (
    <Grid
      container
      alignItems="center"
      flexWrap="nowrap"
      sx={{
        mb: 2,
        pb: 0.5,
        backgroundColor: "background.paper",
        pt: 1,
        px: { xs: 1, sm: 0 },
        width: "100%",
        boxSizing: "border-box",
        gap: 1,
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* ROW 1: TABS */}
      <Grid sx={{ flexShrink: 0, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => onTabChange(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            minHeight: 36,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTabs-scrollButtons": {
              color: "primary.main",
              "&.Mui-disabled": { opacity: 0.3 },
            },
            "& .MuiTab-root": {
              minHeight: 36,
              padding: { xs: "6px 8px", sm: "6px 10px" },
              fontSize: { xs: 12, sm: 13 },
              fontWeight: 500,
              textTransform: "none",
              color: "text.primary",
              backgroundColor: "background.paper",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 0,
              mx: 0,
              whiteSpace: "nowrap",
              "&:not(:first-of-type)": {
                marginLeft: "-1px",
                borderLeft: "none",
              },
              "&:first-of-type": {
                borderTopLeftRadius: 8,
                borderBottomLeftRadius: 8,
              },
              "&:last-of-type": {
                borderTopRightRadius: 8,
                borderBottomRightRadius: 8,
              },
              "&.Mui-selected": {
                backgroundColor: `${theme.palette.info.main}1F`,
                color: "primary.main",
                fontWeight: 700,
                zIndex: 1,
                position: "relative",
              },
              "&:hover": {
                backgroundColor: theme.palette.grey[50],
              },
            },
          }}
        >
          {TAB_LABELS.map((label, index) => (
            <Tab
              key={index}
              label={label}
              sx={
                (isDSP && (label === "Monthly Summary" || label === "View Report")) ||
                (isNurse && label === "View Report")
                  ? { display: "none" }
                  : undefined
              }
            />
          ))}
        </Tabs>
      </Grid>

      {/* SPACER — pushes controls to the right */}
      <Grid sx={{ flex: 1 }} />

      {/* CONTROLS */}
      {showTrackingControls && (
        <Grid
          container
          alignItems="center"
          flexWrap="nowrap"
          sx={{ gap: 1, flexShrink: 0 }}
        >
          {/* DATE PICKER */}
          <Grid sx={{ width: 170, flexShrink: 0 }}>
            <DatePickerField
              value={selectedDate ? dayjs(selectedDate) : null}
              onChange={(date) =>
                onDateChange(date ? date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"))
              }
              format="MM-DD-YYYY"
              bgWhite
              showClearIcon={false}
            />
          </Grid>

          {/* SHIFTS ROW */}
          <Grid
            container
            sx={{
              alignItems: "center",
              gap: 0.5,
              flexWrap: "nowrap",
              flexShrink: 0,
            }}
          >
            {/* SHIFTS LABEL */}
            <Grid
              container
              sx={{ alignItems: "center", gap: 0.5, whiteSpace: "nowrap", flexWrap: "nowrap" }}
            >
              <AccessTimeIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography fontSize={13} color="text.secondary" fontWeight={500}>
                Shifts :
              </Typography>
            </Grid>

            {/* SHIFT BUTTONS */}
            <Grid container sx={{ gap: 0.75, alignItems: "center", flexWrap: "nowrap" }}>
              {displayShifts.map((s) => {
                const isSelected = shifts.includes(s.key);
                return (
                  <Grid
                    key={s.key}
                    component="button"
                    onClick={() => handleShiftToggle(s.key)}
                    sx={{
                      cursor: "pointer",
                      minWidth: { xs: 90, sm: 110, md: 120 },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      px: { xs: 1, sm: 1.25 },
                      py: 0.5,
                      height: { xs: 34, sm: 36 },
                      borderRadius: 2,
                      border: `1px solid ${isSelected ? theme.palette.primary.dark : theme.palette.divider}`,
                      backgroundColor: isSelected ? "primary.dark" : "background.paper",
                      boxShadow: isSelected
                        ? "0px 1px 3px rgba(16, 24, 40, 0.15)"
                        : "0px 1px 2px rgba(16, 24, 40, 0.06)",
                      transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.15s",
                      "&:hover": {
                        backgroundColor: isSelected ? "primary.main" : theme.palette.grey[50],
                      },
                    }}
                  >
                    <Typography
                      fontSize={{ xs: 11, sm: 12 }}
                      fontWeight={700}
                      sx={{
                        lineHeight: 1.2,
                        color: isSelected ? "primary.contrastText" : "text.primary",
                      }}
                    >
                      {s.label}
                    </Typography>
                    <Typography
                      fontSize={{ xs: 9, sm: 10 }}
                      sx={{
                        lineHeight: 1.2,
                        fontWeight: 400,
                        mt: 0.2,
                        color: isSelected ? "rgba(255,255,255,0.9)" : "text.secondary",
                      }}
                    >
                      {s.time}
                    </Typography>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>

          {/* NEW ADL / GOAL BUTTON */}
          <Grid sx={{ flexShrink: 0 }}>
            <Tooltip
              title={
                isMovedOut
                  ? "Resident is Moved Out. We cannot change Moved Out resident details."
                  : (activeTab === 0 ? !hasPermission("adls.record") : !hasPermission("goals.create"))
                  ? "You don't have permission"
                  : ""
              }
              arrow
              disableHoverListener={
                !isMovedOut && (activeTab === 0 ? hasPermission("adls.record") : hasPermission("goals.create"))
              }
            >
              <span>
                <CustomButton
                  variant="outline"
                  size="sm"
                  icon={<AddIcon />}
                  onClick={onNewClick}
                  disabled={isMovedOut || (activeTab === 0 ? !hasPermission("adls.record") : !hasPermission("goals.create"))}
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    backgroundColor: `${theme.palette.info.main}1F`,
                    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.06)",
                    transform: "none",
                    height: 36,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeTab === 0 ? "New ADL" : "New Goal"}
                </CustomButton>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      )}

      {/* MONTHLY SUMMARY CONTROLS */}
      {activeTab === 2 && (
        <Grid
          container
          alignItems="center"
          flexWrap="nowrap"
          sx={{ gap: 1, flexShrink: 0 }}
        >
          <Grid sx={{ width: 150, flexShrink: 0 }}>
            <CustomSelect
              name="month"
              placeholder="Select Month"
              value={month}
              items={monthItems}
              onChange={(e) => onMonthChange(e.target.value)}
              bgWhite
            />
          </Grid>
          <Grid sx={{ width: 110, flexShrink: 0 }}>
            <CustomSelect
              name="year"
              placeholder="Year"
              value={year}
              items={yearItems}
              onChange={(e) => onYearChange(e.target.value)}
              bgWhite
            />
          </Grid>
          <Grid sx={{ flexShrink: 0 }}>
            <Tooltip
              title={!hasPermission("monthly_summary.generate_report") ? "You don't have permission" : ""}
              arrow
              disableHoverListener={hasPermission("monthly_summary.generate_report")}
            >
              <span>
                <CustomButton
                  variant="primary"
                  icon={<FileUploadOutlinedIcon />}
                  onClick={onGenerateReportClick}
                  disabled={!hasPermission("monthly_summary.generate_report")}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    whiteSpace: "nowrap",
                  }}
                >
                  Generate Monthly Report
                </CustomButton>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default CarePlanToolbar;
