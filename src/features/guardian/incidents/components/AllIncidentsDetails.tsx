import React, { useMemo, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  type SelectChangeEvent,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CustomSelect from "../../../../components/custom-select/custom-select";
import CustomInput from "../../../../components/custom-input/custom-input";
import CustomAutoComplete from "../../../../components/custom-auto-complete/custom-auto-complete";
import IncidentsTable from "./IncidentsTable";
import ViewResidentIncidentDrawer from "../components/ViewResidentIncidentDrawer";
import { useIncidentsQuery } from "../hooks/useIncidents";
import type { Incident } from "../types/incidents.types";
import TableSkeleton from "../../../../components/common-table/TableSkeleton";
import DatePickerField from "../../../../components/date-picker-field/date-picker-field";
import { Dayjs } from "dayjs";

import { listGroupHomesOptions } from "../../../../sdk/@tanstack/react-query.gen";


const AllIncidentsDetails: React.FC = () => {
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [groupHome, setGroupHome] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // ✅ Drawer open state
  const [viewIncidentUuid, setViewIncidentUuid] = useState<string | undefined>(undefined);

  // Debounce search term with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  /* ---------------- Reset Page on Filters ---------------- */
  useEffect(() => {
    setPage(0);
  }, [groupHome, statusFilter, debouncedSearchTerm, filterDate, pageSize]);

  // NOTE: status filter is applied client-side (after distinctLatest fetch)
  // so ACKNOWLEDGED works the same as OPEN/CLOSED — filtering the latest
  // row per resident that is already visible in the table.

  // Format date to YYYY-MM-DD for API
  const formattedDate = useMemo(() => {
    if (!filterDate) return undefined;
    return filterDate.format("YYYY-MM-DD");
  }, [filterDate]);

  // Fetch incidents from API with pagination and filters (no status — filtered client-side)
  const { data: incidentsResponse, isLoading, error } = useIncidentsQuery(
    debouncedSearchTerm || undefined,
    undefined, // status filtered client-side so distinctLatest + ACKNOWLEDGED works
    groupHome || undefined,
    formattedDate,
    page,
    pageSize
  );

  const incidents: Incident[] = useMemo(() => {
    if (!incidentsResponse?.incidents) return [];
    const all = Array.isArray(incidentsResponse.incidents) ? incidentsResponse.incidents : [];
    // Client-side status filter: filter the latest-per-resident rows by selected status
    if (!statusFilter) return all;
    return all.filter((inc) => inc.status === statusFilter);
  }, [incidentsResponse, statusFilter]);

  const pagination = incidentsResponse?.pagination ?? null;
  // When status is filtered client-side, derive counts from the filtered list
  // so the paginator matches what's actually shown in the table.
  const totalRecords = statusFilter ? incidents.length : (pagination?.total_records ?? 0);
  const totalPages = statusFilter
    ? Math.max(1, Math.ceil(incidents.length / pageSize))
    : Math.max(1, pagination?.total_pages ?? 1);


  /* ---------------- Fetch Group Homes (API-only; backend enforces guardian/agent → resident → group home) ---------------- */
  const {
    data: groupHomesData,
    isLoading: groupHomesLoading,
  } = useQuery(
    listGroupHomesOptions({
      query: { size: 100 },
    })
  );

  // Use only API response for options; do not merge with any other source (backend returns only authorized group homes for guardian/agent)
  const groupHomesList = useMemo(() => {
    if (!groupHomesData) return [];
    const responseData = groupHomesData as any;
    if (responseData?.data?.results && Array.isArray(responseData.data.results)) {
      return responseData.data.results;
    }
    if (Array.isArray(responseData)) {
      return responseData;
    }
    return [];
  }, [groupHomesData]);

  const groupHomeItems = [
    { value: "", label: "All Group Home" },
    ...groupHomesList.map((gh: any) => ({
      value: gh.uuid ?? String(gh.id ?? ""), // incidents API expects group_home_uuid
      label: gh.name,
    })),
  ];


  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PM_REVIEW_PENDING", label: "Review Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ACKNOWLEDGED", label: "Acknowledged" },
  ];


  const handleGroupHomeChange = (value: string) => {
    setGroupHome(value);
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    // keep raw value, normalize later in filter
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const handleViewIncident = (uuid: string) => {
    setViewIncidentUuid(uuid);
  };

  const handleCloseViewIncident = () => {
    setViewIncidentUuid(undefined);
  };

  return (
    <Grid
      container
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        maxWidth: "100%",
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px" },
        overflow: "hidden",
      }}
    >
      <Grid
        container
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          maxWidth: "100%",
          overflow: "hidden",
          borderRadius: "8px",
          border: "1px solid #E7E9EB",
          backgroundColor: "#FFFFFF",
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
            gap: { xs: "8px", sm: "12px" },
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
            paddingTop: "16px",
          }}
        >
          {/* All Incidents Title - Left Side */}
          <Grid size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}>
            <Typography
              sx={{
                fontSize: { xs: "18px", sm: "20px" },
                fontWeight: 600,
                color: "#30353A",
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                whiteSpace: "nowrap",
              }}
            >
              All Incidents
            </Typography>
          </Grid>

          {/* Filters Container - Right Side */}
          <Grid
            container
            size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: "8px", sm: "12px" },
              flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
              justifyContent: {
                xs: "flex-start",
                sm: "flex-start",
                md: "flex-end",
                lg: "flex-end",
              },
            }}
          >
            {/* Group Home dropdown with Search */}
            <Grid
              size={{ xs: 6, sm: "auto" }}
              sx={{ width: { xs: "calc(50% - 4px)", sm: 220 }, minWidth: 0 }}
            >
              <CustomSelect
                name="group_home"
                placeholder="All Group Home"
                items={groupHomeItems.map((item) => ({
                  value: item.value,
                  label: item.label,
                  child: <Typography fontSize={14}>{item.label}</Typography>,
                }))}
                value={groupHome}
                onChange={(e) => handleGroupHomeChange(e.target.value)}
              />
            </Grid>

            {/* Date Picker */}
            <Grid
              size={{ xs: 6, sm: "auto" }}
              sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" }, minWidth: 0 }}
            >
              <DatePickerField
                value={filterDate}
                onChange={(date: Dayjs | null) => {
                  setFilterDate(date);
                  setPage(0);
                }}
                label="Filter by Date"
              />
            </Grid>

            {/* Status Dropdown */}
            <Grid
              size={{ xs: 6, sm: 6, md: "auto", lg: "auto" }}
              sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" }, minWidth: { xs: 0, md: "150px" }, flexShrink: 1 }}
            >
              <CustomSelect
                placeholder="All Status"
                name="status"
                value={statusFilter}
                items={statusOptions}
                onChange={handleStatusChange}
                bgWhite
              />
            </Grid>

            {/* Search Input */}
            <Grid
              size={{ xs: 6, sm: 6, md: "auto", lg: "auto" }}
              sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" }, minWidth: { xs: 0, md: "200px" }, flexShrink: 1 }}
            >
              <CustomInput
                name="search"
                placeholder="Search Resident Name"
                value={searchTerm}
                onChange={handleSearchChange}
                bgWhite
                hasStartSearchIcon
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Table Section */}
        <Grid container sx={{ flex: 1, minHeight: 0, overflow: "hidden", maxWidth: "100%", paddingX: { xs: "16px", sm: "24px", md: "20px" } }}>
          {isLoading ? (
            <Grid
              container
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
                overflow: "hidden",
                borderRadius: "10px",
                width: "100%"
              }}
            >
              <Grid
                size={{ xs: 12 }}
                sx={{ flex: 1, minHeight: 0, overflow: "auto" }}
              >
                <TableSkeleton
                  headers={[
                    {
                      id: "referralId",
                      label: "Referral ID",
                      width: "120px",
                    },
                    {
                      id: "residentName",
                      label: "Residents Name",
                      width: "240px",
                    },
                    {
                      id: "groupHome",
                      label: "Group Home",
                      width: "120px",
                    },
                    {
                      id: "date",
                      label: "Date",
                      width: "240px",
                    },
                    {
                      id: "status",
                      label: "Status",
                      width: "140px",
                    },
                    {
                      id: "action",
                      label: "Action",
                      width: "120px",
                    },
                  ]}
                  rowCount={10}
                  hasCheckbox={false}
                  hasAvatar={true}
                  hasActions={true}
                />
              </Grid>
            </Grid>
          ) : error ? (
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ padding: "16px", color: "#C62828" }}>
                Error loading incidents. Please try again.
              </Typography>
            </Grid>
          ) : (
            <Grid size={{ xs: 12 }} sx={{ flex: 1, minHeight: 0, height: "100%" }}>
              <IncidentsTable
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                data={incidents}
                totalRecords={totalRecords}
                totalPages={totalPages}
                onViewClick={handleViewIncident}
              />
            </Grid>
          )}
        </Grid>

        {/* Drawers */}
        <ViewResidentIncidentDrawer
          open={Boolean(viewIncidentUuid)}
          incidentUuid={viewIncidentUuid}
          onClose={handleCloseViewIncident}
        />
      </Grid>
    </Grid>
  );
};

export default AllIncidentsDetails;
