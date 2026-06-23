import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import {
  Box,
  Card,
  Chip,
  Typography,
  Stack,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ViewResidentIncidentDrawer from "./ViewResidentIncidentDrawer";
import type { Dayjs } from "dayjs";
import Popover from "@mui/material/Popover";

import DatePickerField from "../../../../components/date-picker-field/date-picker-field";
import Paginator from "../../../../components/pagination/pagination";


/* =========================
   Types
========================= */

export type ResidentIncident = {
  uuid: string;
  title: string;
  description: string;
  status: "ACTION_REQUIRED" | "ACKNOWLEDGED";
  occurred_at: string;
  reported_by: string;
};

type Props = {
  incidents: any[];
  loading?: boolean;
  selectedDate?: Dayjs | null;
  onDateChange?: (date: Dayjs | null) => void;
  // --- Pagination props ---
  page?: number;          // 0-based
  pageSize?: number;
  totalRecords?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

/* =========================
   Status Styles
========================= */
// Helper to get status config - supports any status string from API
const getStatusConfig = (status: string | undefined | null) => {
  let statusStr = status || "ACTION_REQUIRED";

  // Convert to uppercase for matching
  const upperStatus = String(statusStr).toUpperCase();

  // Check if we have a config for this status
  if (STATUS_CONFIG[upperStatus as keyof typeof STATUS_CONFIG]) {
    return STATUS_CONFIG[upperStatus as keyof typeof STATUS_CONFIG];
  }

  // Default fallback for unknown statuses
  return {
    label: String(statusStr),
    chipBg: "#F2F7FA",
    chipColor: "#6B7280",
    iconBg: "#F2F7FA",
    iconColor: "#6B7280",
    icon: <InfoOutlinedIcon fontSize="small" />,
  };
};


const STATUS_CONFIG: Record<string, {
  label: string;
  chipBg: string;
  chipColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactElement;
}> = {
  DRAFT: {
    label: "Draft",
    chipBg: "#F2F4F7",
    chipColor: "#475467",
    iconBg: "#F2F4F7",
    iconColor: "#667085",
    icon: <InfoOutlinedIcon fontSize="small" />,
  },
  PM_REVIEW_PENDING: {
    label: "Review Pending",
    chipBg: "#FEF3C7",
    chipColor: "#92400E",
    iconBg: "#FEF3C7",
    iconColor: "#D97706",
    icon: <InfoOutlinedIcon fontSize="small" />,
  },
  COMPLETED: {
    label: "Completed",
    chipBg: "#E8F5E9",
    chipColor: "#2E7D32",
    iconBg: "#E8F5E9",
    iconColor: "#43A047",
    icon: <CheckCircleOutlineIcon fontSize="small" />,
  },
  ACKNOWLEDGED: {
    label: "Acknowledged",
    chipBg: "#ECFDF3",
    chipColor: "#027A48",
    iconBg: "#ECFDF3",
    iconColor: "#12B76A",
    icon: <CheckCircleOutlineIcon fontSize="small" />,
  },
};

/* =========================
   Component
========================= */

const ResidentIncidentReports: React.FC<Props> = ({
  incidents,
  loading,
  selectedDate,
  onDateChange,
  page = 0,
  pageSize = 10,
  totalRecords,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
  /** Ref for scrollable area — reset to top on page change */
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [page]);

  // No client-side filtering - API handles it


  const [selectedIncidentUuid, setSelectedIncidentUuid] =
    useState<string | undefined>(undefined);

  return (
    <Box
      sx={{
        mt: 3,
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ===== Header - Always Visible ===== */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={2}
        sx={{ flexShrink: 0, flexWrap: "wrap", width: "100%" }}
      >
        <Typography fontSize={15} fontWeight={600} color="#101828">
          Incident Reports
        </Typography>

        <Box width={{ xs: "100%", sm: 240 }}>
          <DatePickerField
            value={selectedDate || null}
            onChange={(date) => onDateChange?.(date)}
            disableFuture
            label="MM-DD-YYYY"
          />
        </Box>
      </Stack>

      {/* ✅ Only this area will scroll */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          scrollbarColor: "#D1D5DB #F3F4F6",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "#F3F4F6" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#D1D5DB",
            borderRadius: "3px",
            "&:hover": { backgroundColor: "#9CA3AF" },
          },
        }}
      >
        {/* ===== Loading State ===== */}
        {loading && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Loading incident reports…
          </Typography>
        )}

        {/* ===== No Data Message ===== */}
        {!loading && (!incidents || incidents.length === 0) && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No incidents available
          </Typography>
        )}

        {/* ===== Cards ===== */}
        {!loading && incidents && incidents.length > 0 && (
          <Stack spacing={2} sx={{ minWidth: 0, width: "100%" }}>
            {incidents.map((incident: any) => {
              // Use actual status from API
              const incidentStatus = incident.status;
              const statusConfig = getStatusConfig(incidentStatus);

              const normalizedIncident = {
                uuid: incident.uuid,
                title: incident.incident_name || "Incident",
                description: incident.incident_description || "—",
                status: incidentStatus, // Use actual status from API
                occurred_at: incident.incident_datetime || incident.created_at,
                reported_by: incident.reported_by_details
                  ? `${incident.reported_by_details.first_name} ${incident.reported_by_details.last_name}`
                  : "Unknown",
              };

              return (
                <Card
                  key={normalizedIncident.uuid}
                  sx={{
                    p: 2.5,
                    borderRadius: 1.5,
                    border: "1px solid #EAECF0",
                    backgroundColor: "#F9FAFB",
                    boxShadow: "none",
                    width: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  {/* Card Content Container */}
                  <Box sx={{ width: "100%" }}>
                    <Box sx={{ width: "100%" }}>
                      {/* ===== Top Row ===== */}
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        {/* Status Icon */}
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            backgroundColor: statusConfig.iconBg,
                            color: statusConfig.iconColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {statusConfig.icon}
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography fontSize={14} fontWeight={600} color="#101828">
                              {normalizedIncident.title}
                            </Typography>

                            <Chip
                              label={statusConfig.label}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor: statusConfig.chipBg,
                                color: statusConfig.chipColor,
                                mt: { xs: 0.5, sm: 0 },
                              }}
                            />
                          </Stack>

                          <Typography fontSize={13} color="#475467" sx={{ mt: 0.5 }}>
                            Description - {normalizedIncident.description}
                          </Typography>

                          {/* Meta */}
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            mt={1}
                            color="#667085"
                            flexWrap="wrap"
                          >
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />
                              <Typography fontSize={12}>
                                {dayjs(normalizedIncident.occurred_at).format(
                                  "MMMM D, YYYY [at] h:mm A"
                                )}
                              </Typography>
                            </Stack>

                            <Typography fontSize={12} sx={{ color: "#667085" }}>
                              |
                            </Typography>

                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <PersonOutlineOutlinedIcon sx={{ fontSize: 14 }} />
                              <Typography fontSize={12}>
                                Reported By: {normalizedIncident.reported_by}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>

                        {/* View More */}
                        <Button
                          variant="text"
                          size="small"
                          sx={{
                            textTransform: "none",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#175CD3",
                            alignSelf: "flex-start",
                          }}
                          onClick={() => setSelectedIncidentUuid(normalizedIncident.uuid)}
                        >
                          View More
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* ===== Paginator — same style as AppointmentsTableWithPagination ===== */}
      {!loading && (totalRecords ?? incidents.length) > 0 && (
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
          sx={{
            "&&": { flexShrink: 0, marginTop: "auto", borderTop: "1px solid #EEF1F4" },
            backgroundColor: "#FFFFFF",
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
          }}
        >
          <Paginator
            page={page}
            totalPages={totalPages ?? Math.max(1, Math.ceil((totalRecords ?? incidents.length) / pageSize))}
            totalRecord={totalRecords ?? incidents.length}
            defaultSize={pageSize}
            onPageChange={(_e, newPage) => onPageChange?.(newPage)}
            onRecordsPerPageChange={(newSize) => {
              onPageSizeChange?.(newSize);
              onPageChange?.(0);
            }}
          />
        </Grid>
      )}

      <ViewResidentIncidentDrawer
        open={!!selectedIncidentUuid}
        incidentUuid={selectedIncidentUuid}
        incidentData={incidents?.find((inc: any) => inc.uuid === selectedIncidentUuid)}
        onClose={() => setSelectedIncidentUuid(undefined)}
      />
    </Box>
  );
};

export default ResidentIncidentReports;
