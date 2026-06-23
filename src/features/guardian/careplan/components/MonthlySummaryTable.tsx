import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Typography,
  Tooltip,
} from "@mui/material";

import CheckIcon from "@mui/icons-material/Check";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import {
  residentsListOptions,
} from "../../../../sdk/@tanstack/react-query.gen";
import CustomSelect from "../../../../components/custom-select/custom-select";

const monthItems = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const generateYearItems = () => {
  const currentYear = dayjs().year();
  const startYear = currentYear - 5;
  const endYear = currentYear + 1;
  const arr: { value: string; label: string }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    arr.push({ value: String(y), label: String(y) });
  }
  return arr;
};

type Status = "YES" | "NO" | "NA";

type GoalRow = {
  title: string;
  description?: string;
  days: Record<number, Status>;
};

interface MonthlySummaryTableProps {
  residentUuid?: string;
  month: string;
  year: string;
  onMonthChange?: (month: string) => void;
  onYearChange?: (year: string) => void;
}

const normalize = (v?: string | null) =>
  (v ?? "").toString().trim().toLowerCase().replace(/_/g, " ");

const mapBackendValueToStatus = (v?: string | null): Status => {
  const t = normalize(v);

  if (t === "worked") return "YES";
  if (t === "did not work" || t === "did not worked") return "NO";
  if (t === "could not work" || t === "could not worked") return "NA";
  return "NA";
};

const MonthlySummaryTable = ({ residentUuid, month, year, onMonthChange, onYearChange }: MonthlySummaryTableProps) => {
  const { data: goalsList = [] } = useQuery({
    ...residentsListOptions({
      query: {
        resident_uuid: residentUuid,
        type: "GOAL",
        month: Number(month),
        year: Number(year),
      } as any,
    }),
    enabled: !!residentUuid,
    select: (response) => {
      const items =
        (response as any)?.data?.data ??
        (response as any)?.data ??
        (response as any)?.data?.results ??
        (response as any)?.results ??
        [];
      if (!Array.isArray(items)) return [];
      return items.map((item: any) => ({
        id: item.id,
        uuid: item.uuid,
        title: item.title,
        description: item.description ?? item.care_plan_item_description ?? "",
        assigned_shifts: item.assigned_shifts ?? [],
        monthly_progress: item.monthly_progress ?? {},
      }));
    },
  });

  const daysInSelectedMonth = useMemo(() => {
    const y = Number(year);
    const mIndex = Number(month) - 1;
    const d = dayjs().year(y).month(mIndex).startOf("month");
    const count = d.daysInMonth();
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [month, year]);

  const gridData: GoalRow[] = useMemo(() => {
    const ymPrefix = `${year}-${String(month).padStart(2, "0")}`;

    return goalsList.map((g: any) => {
      const progress = g?.monthly_progress || {};
      const daysRecord: Record<number, Status> = {};

      const allShifts = ["MORNING", "EVENING", "NIGHT"];

      daysInSelectedMonth.forEach((day) => {
        const dateKey = `${ymPrefix}-${String(day).padStart(2, "0")}`;
        const entry = progress?.[dateKey];

        if (!entry || typeof entry !== "object") {
          daysRecord[day] = "NA";
          return;
        }

        // Aggregate across ALL shifts - pick the best status
        let bestStatus: Status = "NA";
        for (const shift of allShifts) {
          const raw = (entry as any)?.[shift];
          if (raw == null) continue;
          const mapped = mapBackendValueToStatus(String(raw));
          if (mapped === "YES") {
            bestStatus = "YES";
            break;
          }
          if (mapped === "NO" && bestStatus === "NA") {
            bestStatus = "NO";
          }
        }
        daysRecord[day] = bestStatus;
      });

      return {
        title: g.title ?? "—",
        description: g.description ?? "",
        days: daysRecord,
      };
    });
  }, [goalsList, month, year, daysInSelectedMonth]);

  const yearItems = generateYearItems();
  const [injectedHost, setInjectedHost] = useState<HTMLDivElement | null>(null);
  const [, setActionsContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const exportBtn = Array.from(document.querySelectorAll("button")).find(
      (b) => (b.textContent || "").trim() === "Export"
    );
    const actionsEl = exportBtn?.parentElement || null;
    if (!actionsEl) return;

    const firstChild = actionsEl.children.item(0) as HTMLElement | null;
    if (firstChild) {
      firstChild.setAttribute("data-monthly-summary-hidden", "true");
      firstChild.style.display = "none";
    }

    const host = document.createElement("div");
    host.style.display = "flex";
    host.style.gap = "12px";
    host.style.alignItems = "center";
    actionsEl.insertBefore(host, exportBtn!);
    setInjectedHost(host);
    setActionsContainer(null);

    return () => {
      if (firstChild) {
        firstChild.style.display = "";
        firstChild.removeAttribute("data-monthly-summary-hidden");
      }
      if (host && host.parentElement) {
        host.parentElement.removeChild(host);
      }
      setInjectedHost(null);
      setActionsContainer(null);
    };
  }, []);

  const controlsPortal =
    injectedHost &&
    createPortal(
      <>
        <div style={{ width: 180 }}>
          <CustomSelect
            placeholder="Month"
            name="month"
            value={month}
            items={monthItems}
            onChange={(e) => onMonthChange?.(String(e.target.value))}
            bgWhite
            height={38}
          />
        </div>
        <div style={{ width: 120 }}>
          <CustomSelect
            placeholder="Year"
            name="year"
            value={year}
            items={yearItems}
            onChange={(e) => onYearChange?.(String(e.target.value))}
            bgWhite
            height={38}
          />
        </div>
      </>,
      injectedHost
    );

  // Column widths — responsive approach
  const GOALS_COL_PERCENT = 8; // Goals column takes 15% of width
  const DAY_COL_PERCENT = daysInSelectedMonth.length > 0
    ? 85 / daysInSelectedMonth.length
    : 0; // Remaining 85% divided by number of days

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", overflowX: "hidden", minWidth: 0 }}>
      {controlsPortal}
      <TableContainer
        component={Paper}
        sx={{
          border: "1px solid #E6E8EB",
          borderRadius: 2,
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto", // ✅ Allow horizontal scroll inside container
          overflowY: "hidden",
          minWidth: 0,
          backgroundColor: "#FFFFFF",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.15)",
            borderRadius: 3,
          },
        }}
      >

        {/* vertical scroll only */}
        <Box sx={{
          maxHeight: 302, overflowY: "auto", scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}>
          <Table
            size="small"
            sx={{
              width: "100%",
              minWidth: 1000, // ✅ Ensure table is wide enough to scroll
              tableLayout: "fixed", // ✅ Fixed layout with percentage widths for responsiveness
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#F2F7FA" }}>
                <TableCell
                  sx={{
                    // fontWeight: 700,
                    color: "#525E6F",
                    width: `${GOALS_COL_PERCENT}%`,
                    position: "sticky",
                    left: 0,
                    top: 0,
                    zIndex: 3,
                    backgroundColor: "#F2F7FA",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    py: 1.25,
                    px: 1.5,
                  }}
                >
                  Goals
                </TableCell>

                {daysInSelectedMonth.map((d) => (
                  <TableCell
                    key={d}
                    align="center"
                    sx={{
                      // fontWeight: 700,
                      color: "#525E6F",
                      width: `${DAY_COL_PERCENT}%`,
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      backgroundColor: "#F2F7FA",
                      py: 1.25,
                      px: 0.75,
                    }}
                  >
                    {d}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {gridData.map((row, idx) => (
                <TableRow key={idx} hover sx={{ height: 48 }}>
                  {/* Sticky first column: Goals/Title */}
                  <TableCell
                    sx={{
                      width: `${GOALS_COL_PERCENT}%`,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      backgroundColor: "#FFFFFF",
                      borderRight: "1px solid #F0F2F5",
                      py: 1.25,
                      px: 1.5,
                    }}
                  >
                    {(() => {
                      const displayTitle = row.title.trim() ? row.title : "—";

                      return (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            // fontWeight={700}
                            color="#525E6F"
                            noWrap
                            sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                          >
                            {displayTitle}
                          </Typography>

                          <Tooltip
                            title={
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    mb: 1,
                                    color: "#525E6F",
                                    fontSize: "14px",
                                    lineHeight: "17px",
                                  }}
                                >
                                  {displayTitle}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#334155",
                                    fontSize: "12px",
                                    lineHeight: "15px",
                                  }}
                                >
                                  {row.description?.trim()
                                    ? row.description
                                    : "No description available."}
                                </Typography>
                              </Box>
                            }
                            arrow
                            placement="right"
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: "#FFFFFF",
                                  color: "#0F172A",
                                  boxShadow:
                                    "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                  border: "1px solid #E2E8F0",
                                  width: "194px",
                                  borderRadius: "4px",
                                  padding: "8px 12px",
                                  "& .MuiTooltip-arrow": {
                                    color: "#FFFFFF",
                                    "&:before": {
                                      border: "1px solid #E2E8F0",
                                    },
                                  },
                                },
                              },
                            }}
                          >
                            <InfoOutlinedIcon
                              sx={{ fontSize: 16, color: "#94A3B8", cursor: "pointer" }}
                            />
                          </Tooltip>
                        </Box>
                      );
                    })()}
                  </TableCell>


                  {daysInSelectedMonth.map((day) => {
                    const v = row.days[day] ?? "NA";
                    return (
                      <TableCell
                        key={day}
                        align="center"
                        sx={{ width: `${DAY_COL_PERCENT}%`, py: 1.25, px: 0.75 }}
                      >
                        {v === "YES" && (
                          <CheckIcon sx={{ fontSize: 18, color: "#16A34A" }} />
                        )}
                        {v === "NO" && (
                          <CloseOutlinedIcon
                            sx={{ fontSize: 18, color: "#DC2626" }}
                          />
                        )}
                        {v === "NA" && (
                          <Typography color="#94A3B8">-</Typography>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </TableContainer>
    </Box>
  );
};

export default MonthlySummaryTable;
