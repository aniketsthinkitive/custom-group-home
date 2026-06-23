import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Grid,
  Box,
  type SelectChangeEvent,
} from "@mui/material";
import CustomSelect from "../../../components/custom-select/custom-select";
import CustomInput from "../../../components/custom-input/custom-input";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import DailyLogsTableWithPagination from "../components/DailyLogsTableWithPagination";
import ViewLogDrawer from "../components/ViewLogDrawer";
import Paginator from "../../../components/pagination/pagination";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogsOptions, listGroupHomesOptions } from "../../../sdk/@tanstack/react-query.gen";
import type { Dayjs } from "dayjs";
import type { DailyLogData } from "../components/DailyLogsTable";

const DailyLogsPage: React.FC = () => {
  const [groupHomeFilter, setGroupHomeFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState<DailyLogData | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);

  // Debounce search term with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, entityFilter, groupHomeFilter, dateFilter]);

  // Format date filter for API (YYYY-MM-DD)
  const dateFilterString = dateFilter ? dateFilter.format("YYYY-MM-DD") : "";
  
  // Fetch audit logs directly using the API
  const { data: auditLogsResponse, isLoading: isLoadingAuditLogs } = useQuery(
    listAuditLogsOptions({
      query: {
        page: currentPage + 1, // API uses 1-based pagination
        size: recordsPerPage,
        search: debouncedSearchTerm || undefined,
        entity_type: entityFilter || undefined,
        group_home: groupHomeFilter || undefined,
        date: dateFilterString || undefined,
      } as any, // Type doesn't include query, but API accepts it
    } as any)
  );

  // Fetch group homes
  const { data: groupHomesResponse } = useQuery(
    listGroupHomesOptions({
      query: {
        page: 1,
        size: 1000, // Get all group homes
      },
    })
  );

  // Extract unique entity types from audit logs
  // Note: entity_type comes from audit logs API
  const entityTypes = useMemo(() => {
    return [
      { value: "", label: "All Entity" },
      { value: "User", label: "User" },
      { value: "Appointment", label: "Appointment" },
      { value: "GroupHome", label: "GroupHome" },   
      { value: "Incident", label: "Incident" },
      { value: "Lead", label: "Lead" },
      { value: "Resident", label: "Resident" },
      { value: "Document", label: "All Documents" },
      { value: "Lead/Document", label: "Lead/Document" },
      { value: "Resident/Document", label: "Resident/Document" },
      { value: "GroupHome/Document", label: "GroupHome/Document" },
      { value: "Appointment/Document", label: "Appointment/Document" },
      // { value: "Incident/Document", label: "Incident/Document" },
    ];
  }, []);

  // Transform group homes to CustomSelect format
  const groupHomeSelectOptions = useMemo(() => {
    // If no group homes from API, return default option
    if (!groupHomesResponse) {
      return [{ value: "", label: "All Group Home" }];
    }

    const responseData = groupHomesResponse;
    interface GroupHomeItem {
      id?: number;
      name?: string;
      uuid?: string;
    }
    let homesList: GroupHomeItem[] = [];

    // Handle different response structures
    if (responseData) {
      // Check if it's wrapped in data
      if ('data' in responseData && responseData.data) {
        const data = responseData.data as unknown;
        if (Array.isArray(data)) {
          homesList = data as GroupHomeItem[];
        } else if (typeof data === 'object' && data !== null) {
          const dataObj = data as Record<string, unknown>;
          if (Array.isArray(dataObj.results)) {
            homesList = dataObj.results as GroupHomeItem[];
          } else if (Array.isArray(dataObj.content)) {
            homesList = dataObj.content as GroupHomeItem[];
          }
        }
      } else if (Array.isArray(responseData)) {
        homesList = responseData as GroupHomeItem[];
      }
    }

    // Filter out homes without uuid or name, then sort by name
    const validHomes = homesList
      .filter((home) => home.uuid && home.name)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return [
      { value: "", label: "All Group Home" },
      ...validHomes.map((home) => ({ value: home.uuid, label: home.name || '' })),
    ];
  }, [groupHomesResponse]);

  const handleGroupHomeChange = (e: SelectChangeEvent<string>) => {
    setGroupHomeFilter(e.target.value);
  };

  const handleEntityChange = (e: SelectChangeEvent<string>) => {
    setEntityFilter(e.target.value);
  };

  const handleDateChange = (date: Dayjs | null) => {
    setDateFilter(date);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewLog = (log: DailyLogData) => {
    setSelectedLog(log);
    setIsViewDrawerOpen(true);
  };

  const handleCloseViewDrawer = () => {
    setIsViewDrawerOpen(false);
    setSelectedLog(null);
  };

  const handleEditLog = (log: DailyLogData) => {
    // TODO: Implement edit log functionality
    // console.log("Edit log:", log);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown> | null, page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(0);
  };

  // Extract audit logs data from response
  const extractLogsData = (): DailyLogData[] => {
    if (!auditLogsResponse) return [];
    
    // Audit logs API returns: { status, code, message, data: { results: [], pagination: {} } }
    const responseData = auditLogsResponse as any;
    let logs: any[] = [];
    
    if (responseData?.data) {
      if (responseData.data.results && Array.isArray(responseData.data.results)) {
        logs = responseData.data.results;
      } else if (Array.isArray(responseData.data)) {
        logs = responseData.data;
        
      }
    } else if (Array.isArray(responseData)) {
      logs = responseData;
    }
    
    // Map audit logs payload directly to DailyLogData format
    const transformedLogs: DailyLogData[] = logs.map((log: any) => ({
      id: log.id || '',
      created_at: log.created_at || '',
      staff_member: log.staff_member || 'Not Assigned',
      role: log.role || '-',
      entity_type:log.entity_type === "Grouphome" ? "GroupHome" : (log.entity_type || "-"),

      group_home: log.group_home || '-',
      ip_address: log.ip_address || '-',
      action: log.action || '-',
      message: log.message || '-',
      target_user_name: log.target_user_name || null,
    }));
    
    // Client-side filtering removed - now handled by API
    return transformedLogs;
  };

  const logsData = extractLogsData();

  // Extract pagination info from audit logs API response
  const paginationInfo = (() => {
    if (!auditLogsResponse) {
      return {
        totalElements: 0,
        totalPages: 0,
        currentPage: currentPage,
        pageSize: recordsPerPage,
      };
    }

    const responseData = auditLogsResponse as any;
    const pagination = responseData?.data?.pagination;
    
    if (pagination) {
      return {
        totalElements: pagination.total_records || pagination.totalRecords || 0,
        totalPages: pagination.total_pages || pagination.totalPages || 0,
        currentPage: currentPage, // Use local state
        pageSize: pagination.size || recordsPerPage,
      };
    }
    
    // Fallback: calculate from data if pagination not available
    return {
      totalElements: logsData.length,
      totalPages: Math.ceil(logsData.length / recordsPerPage),
      currentPage: currentPage,
      pageSize: recordsPerPage,
    };
  })();

  return (
    <Grid
      container
      sx={{
        height: "90vh",
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px", md: "18px" },
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid
        size={{ xs: 12 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
            height: "100%",
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Header - same pattern as Leads */}
          <Grid
            container
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "12px",
              paddingX: { xs: "16px", sm: "24px", md: "20px" },
              paddingTop: "16px",
            }}
          >
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
                Daily Logs
              </Typography>
            </Grid>

            <Grid
              container
              size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: "12px", sm: "12px", md: "12px", lg: "12px" },
                flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
                justifyContent: { xs: "flex-start", sm: "flex-start", md: "flex-end", lg: "flex-end" },
              }}
            >
              <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "200px", lg: "200px" }, flexShrink: 1 }}>
                <CustomSelect
                  placeholder="All Group Home"
                  name="groupHome"
                  value={groupHomeFilter}
                  items={groupHomeSelectOptions}
                  onChange={handleGroupHomeChange}
                  bgWhite
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "150px", lg: "150px" }, flexShrink: 1 }}>
                <CustomSelect
                  placeholder="All Entity"
                  name="entity"
                  value={entityFilter}
                  items={entityTypes}
                  onChange={handleEntityChange}
                  bgWhite
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "180px", lg: "180px" }, flexShrink: 1 }}>
                <DatePickerField
                  value={dateFilter}
                  onChange={handleDateChange}
                  label="Filter by Date"
                  bgWhite
                  format="MM/DD/YYYY"
                  showClearIcon={true}
                  disableFuture={true}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "250px", lg: "250px" }, flexShrink: 1 }}>
                <CustomInput
                  name="search"
                  placeholder="Search by Staff Member"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  bgWhite
                  hasStartSearchIcon
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Table area - same as Leads: flex 1, overflow hidden, same paddingX */}
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              paddingX: { xs: "16px", sm: "24px", md: "20px" },
            }}
          >
            <DailyLogsTableWithPagination
              data={logsData}
              loading={isLoadingAuditLogs}
              paginationInfo={paginationInfo}
              onPageChange={handlePageChange}
              onRecordsPerPageChange={handleRecordsPerPageChange}
              onView={handleViewLog}
              hidePagination
            />
          </Box>

          {/* Pagination row - same as Leads: flexShrink 0, paddingX only (height from Paginator) */}
          {!isLoadingAuditLogs && (
            <Box
              sx={{
                backgroundColor: "#FFFFFF",
                flexShrink: 0,
                paddingX: { xs: "16px", sm: "24px", md: "20px" },
              }}
            >
              <Paginator
                page={paginationInfo.currentPage}
                totalPages={Math.max(1, paginationInfo.totalPages)}
                totalRecord={paginationInfo.totalElements}
                onPageChange={handlePageChange}
                onRecordsPerPageChange={handleRecordsPerPageChange}
                defaultSize={paginationInfo.pageSize}
              />
            </Box>
          )}
        </Box>
      </Grid>

      <ViewLogDrawer
        open={isViewDrawerOpen}
        onClose={handleCloseViewDrawer}
        log={selectedLog}
        onEdit={handleEditLog}
      />
    </Grid>
  );
};

export default DailyLogsPage;
