import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Typography,
  Grid,
  Avatar,
  Chip,
  IconButton,
  type SelectChangeEvent,
  Box,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import DatePickerField from "../../../../components/date-picker-field/date-picker-field";
import CustomSelect from "../../../../components/custom-select/custom-select";
import CommonSnackbar from "../../../../components/common-snackbar/common-snackbar";
import AppointmentDetailsDrawer from "../components/AppointmentDetailsDrawer";
import Paginator from "../../../../components/pagination/pagination";
import { 
  listAppointmentsOptions,
  getLeadDetailOptions
} from "../../../../sdk/@tanstack/react-query.gen";
import type { AppointmentData } from "../../../appointments/components/AppointmentsTable";

const ResidentUpcomingAppointmentsPage: React.FC = () => {
  const { residentId } = useParams<{ residentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAppointmentUuid, setSelectedAppointmentUuid] = useState<string | null>(null);
  // Pagination (0-based page index, API uses 1-based)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  /** Ref for the scrollable cards area — resets scroll on page change */
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [page]);

  // Snackbar State
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarStatus, setSnackbarStatus] = useState<"success" | "error">("error");

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const residentData = location.state?.residentData as any;
  const userData = useMemo(() => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "{}");
  } catch {
    return {};
  }
}, []);

const userId = userData?.id;      // number (ex: 1)
// console.log("userData", userData);
const user_uuid = userData?.uuid;  // string (ex: "6e3e...")

  // Fetch specific lead/resident details by UUID
  const { data: leadDetailResponse, isLoading: isLeadLoading, isError: isLeadError } = useQuery({
    ...getLeadDetailOptions({
      path: { uuid: residentId! },
    }),
    enabled: !!residentId,
  });
  const leadDetail: any = (leadDetailResponse as any)?.data ?? (leadDetailResponse as any) ?? {};

  // 2. Fetch Appointments for this resident (all appointments for resident, so list matches what user expects)
  const { data: appointmentsResponse, isLoading, error: appointmentsError } = useQuery(
    listAppointmentsOptions({
      query: {
        page: page + 1,   // API is 1-based
        size: pageSize,
        lead_uuid: residentId,
        status: statusFilter || undefined,
        date: dateFilter ? dateFilter.format("YYYY-MM-DD") : undefined,
      } as any,
    })
  );

  // Extract pagination metadata from API response
  const paginationMeta = useMemo(() => {
    const p = (appointmentsResponse as any)?.data?.pagination ?? {};
    return {
      totalRecords: p.total_records ?? p.totalElements ?? p.total ?? 0,
      totalPages:   p.total_pages  ?? p.totalPages  ?? 1,
    };
  }, [appointmentsResponse]);

  // Helper for Status Colors (Reused from AppointmentsTable logic)
  const getStatusColors = (status: string | undefined): { bg: string; color: string } => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'REQUESTED':
      case 'SCHEDULED':
        return { bg: '#E3F2FD', color: '#1976D2' }; // Blue
      case 'COMPLETED':
        return { bg: '#E6F4EA', color: '#137333' }; // Green
      case 'CANCELLED':
        return { bg: '#FCE8E6', color: '#C5221F' }; // Red
      default:
        return { bg: '#F2F2F2', color: '#757775' };
    }
  };

  const appointments = useMemo(() => {
    if (!appointmentsResponse) return [];
    const responseData = appointmentsResponse as any;
    let data: any[] = [];
    if (responseData?.data?.results && Array.isArray(responseData.data.results)) {
      data = responseData.data.results;
    } else if (Array.isArray(responseData?.data)) {
      data = responseData.data;
    } else if (responseData?.data?.content) {
      data = responseData.data.content;
    }
    return data;
  }, [appointmentsResponse]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleDateChange = (date: Dayjs | null) => {
    setDateFilter(date);
    setPage(0); // reset on filter change
  };
  const statusOptions = useMemo(() => {
    return [
      { value: "", label: "All Status" },
      { value: "REQUESTED", label: "Requested" },
      { value: "COMPLETED", label: "Completed" },
    ];
  }, []);
  const statusSelectOptions = useMemo(() => {
    return statusOptions.map((opt) => {
      if (!opt.value) return opt;
      const colors = getStatusColors(opt.value);
      return {
        ...opt,
        child: (
          <Chip
            label={opt.label}
            sx={{
              backgroundColor: colors.bg,
              color: colors.color,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              fontSize: "12px",
              fontWeight: 500,
              height: "24px",
              borderRadius: "6px",
              textTransform: "uppercase",
              "& .MuiChip-label": { padding: "0 8px" },
            }}
          />
        ),
      };
    });
  }, [statusOptions]);
  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setStatusFilter(e.target.value);
    setPage(0); // reset on filter change
  };

  // Format helpers
  const calculateAge = (dob: string) => {
    if (!dob) return "";
    return dayjs().diff(dayjs(dob), 'year');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("MMMM D, YYYY");
  };

  const formatDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr) return "-";
    const date = dayjs(dateStr).format("MMMM D, YYYY");
    // Time is usually HH:mm:ss
    const time = timeStr ? dayjs(`2000-01-01 ${timeStr}`).format("h:mm A") : "";
    return `${date} at ${time}`;
  };

  React.useEffect(() => {
    if (appointmentsError || isLeadError) {
      setSnackbarMessage("Failed to load data. Please try again.");
      setSnackbarStatus("error");
      setSnackbarOpen(true);
    }
  }, [appointmentsError, isLeadError]);
  // console.log("residentData", residentData);
  return (
    <Grid
      container
      direction="column"
      sx={{
        height: "calc(100vh - 64px)",
        minHeight: { xs: 420, md: 520 },
        backgroundColor: "#F6F6F6",
        p: { xs: 2, sm: 3 },
        overflow: { xs: "auto", md: "hidden" },
      }}
    >
      <Grid
        container
        direction="column"
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #E7E9EB",
          p: { xs: 1.5, sm: 2 },
          overflow: "hidden",
        }}
      >
        {/* 1. Header Section - fixed */}
        <Grid
          container
          alignItems="center"
          sx={{
            flexShrink: 0,
            borderBottom: "1px solid #E7E9EB",
            pb: 2,
            mb: 2,
            gap: 2,
          }}
        >
          {/* Back Button */}
          <Grid>
            <IconButton onClick={handleBack} sx={{ p: 0 }}>
              <ArrowBackIcon sx={{ color: "#30353A" }} />
            </IconButton>
          </Grid>

          {/* Avatar */}
          <Grid>
            <Avatar
              src={leadDetail?.user?.avatar_url || undefined}
              sx={{ width: 48, height: 48 }}
            >
              {leadDetail?.user?.first_name?.[0] || 'U'}
              {leadDetail?.user?.last_name?.[0] || ''}
            </Avatar>
          </Grid>

          {/* Resident Details */}
          <Grid sx={{ flex: 1 }}>
            <Grid container direction="column">
              <Grid>
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#101828",
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  {isLeadLoading
                    ? "Loading resident..."
                    : `${leadDetail?.user?.first_name ?? "-"} ${leadDetail?.user?.last_name ?? ""}`}
                  <span style={{ color: "#667085", fontWeight: 400, marginLeft: "8px" }}>
                    {isLeadLoading
                      ? ""
                      : `(${leadDetail?.referral_number ?? ""})`}
                  </span>
                </Typography>
              </Grid>
              <Grid>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#667085",
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  {isLeadLoading
                    ? ""
                    : `${formatDate(leadDetail?.date_of_birth)} (${calculateAge(leadDetail?.date_of_birth)}) | ${leadDetail?.gender ?? "-"} | Room ${leadDetail?.room_number ?? leadDetail?.room?.number ?? "-"}`}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* 2. Sub-header (Title + Filter) - fixed */}
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ flexShrink: 0, mb: 2, gap: 2 }}
        >
          <Grid>
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#101828",
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
              }}
            >
              Scheduled Appointment
            </Typography>
          </Grid>
          <Grid>
             <Grid container alignItems="center" columnGap={1.5} rowGap={1.5}>
               <Grid sx={{ width: { xs: "100%", sm: "160px" } }}>
                 <CustomSelect
                   name="status"
                   placeholder="All Status"
                   items={statusSelectOptions}
                   value={statusFilter}
                   onChange={handleStatusChange}
                   bgWhite
                 />
               </Grid>
               <Grid sx={{ width: { xs: "100%", sm: "200px" } }}>
                 <DatePickerField
                     value={dateFilter}
                     onChange={handleDateChange}
                     label="Filter by Date"
                     bgWhite
                     format="MM/DD/YYYY"
                     showClearIcon={true}
                 />
               </Grid>
             </Grid>
          </Grid>
        </Grid>

        {/* 3. Appointment Cards - scrollable area only */}
        <Grid
          ref={scrollRef as any}
          container
          spacing={2}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            alignContent: "flex-start",
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
            {isLoading ? (
                <Typography sx={{ p: 2 }}>Loading appointments...</Typography>
            ) : appointments.length === 0 ? (
                <Typography sx={{ p: 2, color: "#667085" }}>No scheduled appointments found.</Typography>
            ) : (
                appointments.map((apt: any) => {
                    const statusColors = getStatusColors(apt.status);
                    const single = appointments.length === 1;
                    return (
                        <Grid
                          key={apt.uuid || apt.id}
                          size={{ xs: 12, md: 6 }}
                          sx={{
                            minWidth: 0,
                            // Removed flex: "1 1 0" so Grid sizing works properly without squishing
                          }}
                        >
                            <Grid
                                container
                                direction="column"
                                sx={{
                                    border: "1px solid #DDE3EA",
                                    borderRadius: "10px",
                                    p: { xs: 2, md: 2.5 },
                                    backgroundColor: "#FFFFFF",
                                    boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.06)",
                                    width: "100%",
                                    minWidth: 0,
                                    height: "auto",
                                    alignSelf: "flex-start",
                                }}
                            >
                                {/* Card Header: Icon | Title + Badge | Eye */}
                                <Grid container alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                                    <Grid>
                                        <Grid 
                                            container 
                                            alignItems="center" 
                                            justifyContent="center"
                                            sx={{ 
                                                width: { xs: 32, sm: 36 },
                                                height: { xs: 32, sm: 36 },
                                                borderRadius: { xs: "8px", sm: "8px" },
                                                backgroundColor: "#EEF4FF",
                                                border: "1px solid #D6E3FF"
                                            }}
                                        >
                                            <CalendarMonthOutlinedIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: "#1F4E79" }} />
                                        </Grid>
                                    </Grid>
                                    <Grid sx={{ flex: 1 }}>
                                        <Grid container alignItems="center" gap={1}>
                                            <Typography
                                                sx={{
                                                    fontSize: "16px",
                                                    fontWeight: 600,
                                                    color: "#344054",
                                                }}
                                            >
                                                {apt.appointment_title || "Appointment"}
                                            </Typography>
                                            <Chip
                                                label={apt.status ? apt.status.charAt(0) + apt.status.slice(1).toLowerCase() : "Scheduled"}
                                                size="small"
                                                sx={{
                                                    backgroundColor: statusColors.bg,
                                                    color: statusColors.color,
                                                    borderRadius: "16px",
                                                    fontWeight: 500,
                                                    fontSize: "12px",
                                                    height: "22px",
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Grid>
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setSelectedAppointmentUuid(apt.uuid || null);
                                                setDetailsOpen(true);
                                            }}                                                          
                                        >
                                            <VisibilityOutlinedIcon sx={{ color: "#667085" }} />
                                        </IconButton>
                                    </Grid>
                                </Grid>

                               {/* Card Details: Date | Provider */}
<Grid
  container
  alignItems="center"
  sx={{
    ml: "48px",
      // 🔥 reduce top space (was 0.5)
         // ensure no bottom margin
    minHeight: "20px",
  }}
>
  {/* Date */}
  <Grid container alignItems="center" sx={{ width: "auto" }}>
    <CalendarTodayOutlinedIcon
      sx={{ fontSize: "18px", color: "#98A2B3", mr: 1 }}
    />
    <Typography
      sx={{
        fontSize: "14px",
        color: "#475467",
        lineHeight: 1.2,   // 🔥 reduce text vertical height
        m: 0,
      }}
    >
      {formatDateTime(apt.appointment_date, apt.appointment_time)}
    </Typography>
  </Grid>

  {/* Divider */}
  <Box
    sx={{
      width: "1px",
      height: "14px",   // 🔥 slightly smaller divider
      backgroundColor: "#E4E7EC",
      mx: 2,
    }}
  />

  {/* Provider */}
  <Grid container alignItems="center" sx={{ width: "auto" }}>
    <PersonOutlineOutlinedIcon
      sx={{ fontSize: "18px", color: "#98A2B3", mr: 1 }}
    />
    <Typography
      sx={{
        fontSize: "14px",
        color: "#475467",
        lineHeight: 1.2,   // 🔥 reduce bottom spacing
        m: 0,
      }}
    >
      With {apt.contact_name || "Provider"}
    </Typography>
  </Grid>
</Grid>

                            </Grid>
                        </Grid>
                    );
                })
            )}
        </Grid>

        {/* ===== Pagination — same style as AppointmentsTableWithPagination ===== */}
        {!isLoading && (paginationMeta.totalRecords ?? appointments.length) > 0 && (
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
              totalPages={paginationMeta.totalPages}
              totalRecord={paginationMeta.totalRecords}
              defaultSize={pageSize}
              onPageChange={(_e, newPage) => setPage(newPage)}
              onRecordsPerPageChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
            />
          </Grid>
        )}
      </Grid>
      <CommonSnackbar
        message={snackbarMessage}
        status={snackbarStatus}
        isOpen={snackbarOpen}
        onClose={handleSnackbarClose}
      />
      <AppointmentDetailsDrawer
  open={detailsOpen}
  onClose={() => setDetailsOpen(false)}
  residentId={residentId || ""}
  residentData={residentData}
  residentProfile={leadDetail}
  appointmentUuid={selectedAppointmentUuid}
  user_uuid={user_uuid}
/>

    </Grid>
  );
};

export default ResidentUpcomingAppointmentsPage;
