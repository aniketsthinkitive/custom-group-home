import React, { useState, useEffect, useMemo } from "react";
import { Typography, Grid, Chip, type SelectChangeEvent } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CustomInput from "../../../../components/custom-input/custom-input";
import DatePickerField from "../../../../components/date-picker-field/date-picker-field";
import AppointmentsTableWithPagination from "../../../appointments/components/AppointmentsTableWithPagination";
import { useQuery } from "@tanstack/react-query";
import {
  listGroupHomesOptions,
  listAppointmentsOptions,
} from "../../../../sdk/@tanstack/react-query.gen";
import type { Dayjs } from "dayjs";
import type { AppointmentData } from "../../../appointments/components/AppointmentsTable";
import CustomSelect from "../../../../components/custom-select/custom-select";

const PortalAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [groupHomeFilter, setGroupHomeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const userData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "{}");
    } catch {
      return {};
    }
  }, []);

  const userUuid = userData?.uuid;

  // Debounce search term with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const cleaned = searchTerm.replace(/\s+/g, " ").trim();
      setDebouncedSearchTerm(cleaned);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, statusFilter, groupHomeFilter, dateFilter]);

  // Fetch appointments
  const { data: appointmentsResponse, isLoading } = useQuery(
    listAppointmentsOptions({
      query: {
        page: currentPage + 1, // API uses 1-based pagination
        size: recordsPerPage,
        search: debouncedSearchTerm?.trim() || undefined,
        status: statusFilter || undefined,
        group_home: groupHomeFilter || undefined,
        date: dateFilter ? dateFilter.format("YYYY-MM-DD") : undefined,
        user_uuid: userUuid || undefined,
      } as any,
    } as any),
  );

  // Fetch group homes
  const { data: groupHomesResponse } = useQuery(
    listGroupHomesOptions({
      query: {
        page: 1,
        size: 1000,
      },
    }),
  );

  // Transform group homes to select items
  const groupHomeSelectItems = useMemo(() => {
    if (!groupHomesResponse) return [{ value: "", label: "All Group Home" }];

    const responseData = groupHomesResponse;
    interface GroupHomeItem {
      name?: string;
      id?: number | string;
      uuid?: string;
    }
    let homesList: GroupHomeItem[] = [];

    if (responseData) {
      if ("data" in responseData && responseData.data) {
        const data = responseData.data as unknown;
        if (Array.isArray(data)) {
          homesList = data as GroupHomeItem[];
        } else if (typeof data === "object" && data !== null) {
          const dataObj = data as Record<string, unknown>;
          if (Array.isArray(dataObj.results)) homesList = dataObj.results as GroupHomeItem[];
          else if (Array.isArray(dataObj.content)) homesList = dataObj.content as GroupHomeItem[];
        }
      } else if (Array.isArray(responseData)) {
        homesList = responseData as GroupHomeItem[];
      }
    }

    return [
      { value: "", label: "All Group Home" },
      ...homesList
        .filter((home) => home.name && home.uuid)
        .map((home) => ({ value: home.uuid, label: home.name || "Unknown" })),
    ];
  }, [groupHomesResponse]);

  const handleDateChange = (date: Dayjs | null) => setDateFilter(date);

  const statusOptions = useMemo(() => {
    return [
      { value: "", label: "All Status" },
      { value: "REQUESTED", label: "Requested" },
      { value: "COMPLETED", label: "Completed" },
    ];
  }, []);

  const handleStatusChange = (e: SelectChangeEvent<string>) => setStatusFilter(e.target.value);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  const handlePageChange = (_event: React.ChangeEvent<unknown> | null, page: number) => setCurrentPage(page);

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(0);
  };

  // Match status pill UI to AppointmentsPage.tsx
  const getStatusColors = (status: string | undefined): { bg: string; color: string } => {
    const s = status?.toUpperCase() || "";
    switch (s) {
      case "REQUESTED":
        return { bg: "#E3F2FD", color: "#1976D2" };
      case "COMPLETED":
        return { bg: "#E6F4EA", color: "#137333" };
      case "CANCELLED":
        return { bg: "#FCE8E6", color: "#C5221F" };
      default:
        return { bg: "#F2F2F2", color: "#757775" };
    }
  };

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

  // Extract appointments data from response
  const extractAppointmentsData = (): AppointmentData[] => {
    if (!appointmentsResponse) return [];

    const responseData = appointmentsResponse as any;
    let appointments: any[] = [];

    if (responseData?.data) {
      if (responseData.data.results && Array.isArray(responseData.data.results)) {
        appointments = responseData.data.results;
      } else if (Array.isArray(responseData.data)) {
        appointments = responseData.data;
      } else if (responseData.data.content && Array.isArray(responseData.data.content)) {
        appointments = responseData.data.content;
      }
    } else if (Array.isArray(responseData)) {
      appointments = responseData;
    }

    // ✅ Ensure every row gets a usable resident/lead uuid (so no fallback residents API needed)
    return appointments.map((apt: any) => {
      const leadUuid =
        apt.lead_uuid ??
        apt.resident_uuid ??
        apt.lead?.uuid ??
        apt.resident?.uuid ??
        apt.uuid;

      return {
        ...apt,
        resident_name: apt.resident_name || "-",
        resident_uuid: leadUuid, // used by click handler
        lead_uuid: leadUuid,     // keep it too if table uses it
        referral_id: apt.referral_id ?? apt.referralId ?? apt.id,
      };
    }) as AppointmentData[];
  };

  const appointmentsData = extractAppointmentsData();

  // Extract pagination info from appointments API response
  const paginationInfo = useMemo(() => {
    if (!appointmentsResponse) {
      return {
        totalElements: 0,
        totalPages: 0,
        currentPage: currentPage,
        pageSize: recordsPerPage,
      };
    }

    const responseData = appointmentsResponse as any;
    const pagination = responseData?.data?.pagination;

    if (pagination) {
      return {
        totalElements: pagination.total_records || pagination.totalRecords || 0,
        totalPages: pagination.total_pages || pagination.totalPages || 0,
        currentPage: currentPage,
        pageSize: pagination.size || recordsPerPage,
      };
    }

    return {
      totalElements: appointmentsData.length,
      totalPages: Math.ceil(appointmentsData.length / recordsPerPage),
      currentPage: currentPage,
      pageSize: recordsPerPage,
    };
  }, [appointmentsResponse, currentPage, recordsPerPage, appointmentsData.length]);

  // ✅ Click: navigate using uuid already present in row (no residents lookup API)
  const handleResidentClick = (row: AppointmentData) => {
    const anyRow = row as any;
    const leadUuid =
      anyRow.lead_uuid ||
      anyRow.resident_uuid ||
      anyRow.lead?.uuid ||
      anyRow.resident?.uuid ||
      anyRow.uuid;

    if (!leadUuid) {
      console.warn("handleResidentClick: Missing lead_uuid/resident_uuid on row.", row);
      return;
    }

    navigate(`/portal/appointments/resident/${leadUuid}/upcoming`, {
      state: { residentData: row },
    });
  };

  return (
    <Grid
      container
      flexDirection="column"
      size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
      sx={{
        '&&': { height: "calc(100vh - 64px)" },
        minHeight: { xs: 420, md: 520 },
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px" },
        overflow: { xs: "auto", md: "hidden" },
      }}
    >
      <Grid
        container
        flexDirection="column"
        size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        sx={{
          '&&': { flex: 1 },
          minHeight: 0,
          borderRadius: "8px",
          border: "1px solid #E7E9EB",
          backgroundColor: "#FFFFFF",
          padding: "16px",
          paddingBottom: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Grid
          container
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          {/* All Appointments Title */}
          <Grid size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}>
            <Typography
              sx={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#30353A",
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                whiteSpace: "nowrap",
              }}
            >
              All Appointments
            </Typography>
          </Grid>

          {/* Filters */}
          <Grid
            container
            size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: "12px", sm: "12px", md: "12px", lg: "12px" },
              flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
              justifyContent: {
                xs: "flex-start",
                sm: "flex-start",
                md: "flex-end",
                lg: "flex-end",
              },
            }}
          >
            {/* Group Home */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "200px", lg: "200px" }, flexShrink: 1 }}
            >
              <CustomSelect
                name="groupHome"
                placeholder="All Group Home"
                items={groupHomeSelectItems}
                value={groupHomeFilter}
                onChange={(e) => setGroupHomeFilter(e.target.value)}
                bgWhite
              />
            </Grid>

            {/* Status */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "150px", lg: "150px" }, flexShrink: 1 }}
            >
              <CustomSelect
                name="status"
                placeholder="All Status"
                items={statusSelectOptions}
                value={statusFilter}
                onChange={handleStatusChange}
                bgWhite
              />
            </Grid>

            {/* Date */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "180px", lg: "180px" }, flexShrink: 1 }}
            >
              <DatePickerField
                value={dateFilter}
                onChange={handleDateChange}
                label="Filter by Date"
                bgWhite
                format="MM/DD/YYYY"
                showClearIcon={true}
              />
            </Grid>

            {/* Search */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "250px", lg: "250px" }, flexShrink: 1 }}
            >
              <CustomInput
                name="search"
                placeholder="Search by Resident Name"
                value={searchTerm}
                onChange={handleSearchChange}
                bgWhite
                hasStartSearchIcon
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Table Section */}
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
          sx={{
            '&&': { flex: 1 },
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: { xs: "auto", md: "hidden" },
            marginBottom: 0,
            paddingBottom: 0,
          }}
        >
          <AppointmentsTableWithPagination
            data={appointmentsData}
            loading={isLoading}
            paginationInfo={paginationInfo}
            onPageChange={handlePageChange}
            onRecordsPerPageChange={handleRecordsPerPageChange}
            onResidentClick={handleResidentClick}
            onView={handleResidentClick}
            actionType="view"
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default PortalAppointmentsPage;
