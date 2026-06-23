import React, { useMemo, useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Box,
  Tooltip,
  type SelectChangeEvent,
} from "@mui/material";
import Paginator from "../../../components/pagination/pagination";
import { Add } from "@mui/icons-material";

import CustomSelect from "../../../components/custom-select/custom-select";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import IncidentsTable from "./IncidentsTable";
import AddNewIncidentDrawer from "./AddNewIncidentDrawer";
import ViewIncidentDrawer from "./ViewIncidentDrawer";
import { useIncidentsQuery, useUpdateIncidentStatusMutation, getBackendMessage } from "../hooks/useIncidents";
import type { Incident } from "../types/incidents.types";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import TableSkeleton from "../../../components/common-table/TableSkeleton";
import ConfirmationPopUp from "../../../components/confirmation-pop-up/confirmation-pop-up";
import { useQuery } from "@tanstack/react-query";
import { listGroupHomesOptions } from "../../../sdk/@tanstack/react-query.gen";
import { generateIncidentPDF } from "../utils/generateIncidentPDF";
import { getIncident } from "../../../sdk/sdk.gen";
import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store/hooks";

interface AllIncidentsSectionProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const AllIncidentsSection: React.FC<AllIncidentsSectionProps> = ({ onSuccess, onError }) => {
  const { hasPermission, getScope } = usePermission();
  const user = useAppSelector((state) => state.auth.user);
  const canCreateIncident = hasPermission("incidents.create");
  const canEditIncident = hasPermission("incidents.edit");
  const scope = getScope("incidents.view");
  const isAssignedHome = scope === "ASSIGNED_HOME";

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const [groupHomeFilter, setGroupHomeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // ✅ Drawer open state
  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState<boolean>(false);
  const [viewIncidentUuid, setViewIncidentUuid] = useState<string | undefined>(undefined);
  const [editIncidentUuid, setEditIncidentUuid] = useState<string | undefined>(undefined);
  const [focusSignatureOnOpen, setFocusSignatureOnOpen] = useState<boolean>(false);
  const [statusChangeUuid, setStatusChangeUuid] = useState<string | undefined>(undefined);
  const [statusChangePending, setStatusChangePending] = useState<{
    uuid: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  // Mutation for updating incident status
  const updateStatusMutation = useUpdateIncidentStatusMutation(statusChangeUuid);

  // Debounce search term with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Convert status filter to API value (new 5-state enum).
  const statusValue = useMemo(() => {
    const allowed = new Set([
      "DRAFT",
      "PM_REVIEW_PENDING",
      "COMPLETED",
      "ACKNOWLEDGED",
    ]);
    return allowed.has(statusFilter) ? statusFilter : undefined;
  }, [statusFilter]);

  const { data: incidentsResponse, isLoading, error } = useIncidentsQuery(
    debouncedSearchTerm || undefined,
    statusValue,
    groupHomeFilter || undefined,
    page,
    pageSize
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

  const residentToGroupHomeMap = useMemo(() => {
  const map = new Map<string, string>();

  const responseData: any = groupHomesResponse?.data;

  const homes = responseData?.results ?? [];

  homes.forEach((home: any) => {
    home.residents?.forEach((resident: any) => {
      if (resident?.uuid) {
        map.set(resident.uuid, home.name);
      }
    });
  });

  return map;
}, [groupHomesResponse]);


  const incidents: Incident[] = useMemo(() => {
    if (!incidentsResponse?.incidents) return [];
    return incidentsResponse.incidents.map((incident) => ({
      ...incident,
      groupHome:
        residentToGroupHomeMap.get(incident.residentUuid!) ||
        incident.groupHome ||
        "Unknown Group Home",
    }));
  }, [incidentsResponse, residentToGroupHomeMap]);

  const pagination = incidentsResponse?.pagination ?? null;
  const totalRecords = pagination?.total_records ?? incidents.length;
  const totalPages = Math.max(1, pagination?.total_pages ?? Math.ceil(totalRecords / pageSize));

// console.log("INCIDENTS FROM API:", incidentsData?.length);

  // Transform groupHomeOptions to CustomSelect format: { value: string; label: string }[]
  const groupHomeSelectOptions = useMemo(() => {
    if (!groupHomesResponse) {
      return isAssignedHome ? [] : [{ value: "", label: "All Group Home" }];
    }

    interface GroupHomeItem {
      name?: string;
      id?: number;
      uuid?: string;
    }
    let homesList: GroupHomeItem[] = [];

    // Handle different response structures
    const responseData = groupHomesResponse as any;
    if (responseData) {
      if (Array.isArray(responseData)) {
        homesList = responseData as GroupHomeItem[];
      } else if (typeof responseData === 'object' && responseData !== null) {
        if (responseData.data) {
          const data = responseData.data;
          if (Array.isArray(data)) {
            homesList = data as GroupHomeItem[];
          } else if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data.results)) {
              homesList = data.results as GroupHomeItem[];
            } else if (Array.isArray(data.content)) {
              homesList = data.content as GroupHomeItem[];
            }
          }
        }
      }
    }

    return [
      ...(isAssignedHome ? [] : [{ value: "", label: "All Group Home" }]),
      ...homesList
        .filter((home) => home.name && home.uuid)
        .map((home) => ({
          value: home.uuid,
          label: home.name || "Unknown"
        })),
    ];
  }, [groupHomesResponse]);

  // No auto-select for ASSIGNED_HOME users — the backend already restricts
  // PM/PC to their assigned group homes, so starting with no group_home_uuid
  // filter returns all their assigned homes' incidents correctly.

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "PM_REVIEW_PENDING", label: "Review Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "ACKNOWLEDGED", label: "Acknowledged" },
  ];

  // Filter by Group Home only (search and status are handled by API)
  



  const handleGroupHomeChange = (e: SelectChangeEvent<string>) => {
    setGroupHomeFilter(e.target.value);
    setPage(0);
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

  const handleAddNewIncident = () => {
    setIsAddIncidentOpen(true);
  };

  const handleViewIncident = (uuid: string) => {
    setViewIncidentUuid(uuid);
  };

  const handleCloseViewIncident = () => {
    setViewIncidentUuid(undefined);
  };

  const handleEditIncident = (uuid: string) => {
    setFocusSignatureOnOpen(false);
    setEditIncidentUuid(uuid);
  };

  const handleReviewSignIncident = (uuid: string) => {
    setFocusSignatureOnOpen(true);
    setEditIncidentUuid(uuid);
  };

  const handleCloseEditIncident = () => {
    setEditIncidentUuid(undefined);
    setFocusSignatureOnOpen(false);
  };

  const handleChangeStatus = (uuid: string, currentStatus: string) => {
    // Any non-CLOSED status (OPEN or ACKNOWLEDGED) should transition to CLOSED
    const newStatus = currentStatus === "CLOSED" ? "OPEN" : "CLOSED";
    // Show confirmation popup first
    setStatusChangePending({
      uuid,
      currentStatus,
      newStatus,
    });
  };

  const handleConfirmStatusChange = () => {
    if (!statusChangePending) return;

    const { uuid, newStatus } = statusChangePending;
    setStatusChangeUuid(uuid);

    updateStatusMutation.mutate(
      {
        path: { uuid },
        query: { status: newStatus } as any, // Pass status as query parameter per requirement
        body: { status: newStatus } as any, // Also pass in body as backend expects it there
      } as any,
      {
        onSuccess: (response: any) => {
          const backendMessage =
            response?.message ??
            response?.data?.message ??
            response?.detail ??
            response?.data?.detail ??
            `Incident status changed to ${newStatus === "OPEN" ? "Open" : "Closed"}`;

          setSnackbar({
            isOpen: true,
            message: backendMessage,
            status: "success",
          });
          setStatusChangeUuid(undefined);
          setStatusChangePending(null);
        },
        onError: (error: unknown) => {
          const backendMessage = getBackendMessage(error);
          setSnackbar({
            isOpen: true,
            message: backendMessage || "Failed to update incident status",
            status: "error",
          });
          setStatusChangeUuid(undefined);
          setStatusChangePending(null);
        },
      }
    );
  };

  const handleCancelStatusChange = () => {
    setStatusChangePending(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  const handlePrintIncident = async (uuid: string) => {
    try {
      // Fetch full incident details using SDK
      const response = await getIncident({
        path: { uuid },
        throwOnError: true,
      });
      
      // Generate PDF
      await generateIncidentPDF(response.data);
    } catch (error) {
      console.error('Error printing incident:', error);
      setSnackbar({
        isOpen: true,
        message: 'Failed to generate PDF. Please try again.',
        status: 'error',
      });
    }
  };

  return (
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
      {/* HEADER - no extra padding here; header has same padding as Residents (16px top, 16px bottom margin) */}
      <Grid size={{ xs: 12 }}>
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
          {/* All Incidents Title - Left Side */}
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
              gap: { xs: "12px", sm: "12px", md: "12px", lg: "12px" },
              flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
              justifyContent: { xs: "flex-start", sm: "flex-start", md: "flex-end", lg: "flex-end" },
            }}
          >
            {/* Group Home dropdown - same size as Residents */}
            <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "200px", lg: "200px" }, flexShrink: 1 }}>
              <CustomSelect
                placeholder="All Group Home"
                name="groupHome"
                value={groupHomeFilter}
                items={groupHomeSelectOptions}
                onChange={handleGroupHomeChange}
                bgWhite
                isDisabled={false}
              />
            </Grid>

            {/* Status Dropdown */}
            <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "160px", lg: "160px" }, flexShrink: 1 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "250px", lg: "250px" }, flexShrink: 1 }}>
              <CustomInput
                name="search"
                placeholder="Search Resident Name"
                value={searchTerm}
                onChange={handleSearchChange}
                bgWhite
                hasStartSearchIcon
              />
            </Grid>

            {/* Add Button */}
            <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: 0, flexShrink: 0 }}>
              <Tooltip
                title={canCreateIncident ? "" : "You don't have permission to add incidents"}
                arrow
              >
                <span>
                  <CustomButton
                    variant="primary"
                    size="lg"
                    icon={<Add sx={{ fontSize: "18px" }} />}
                    iconPosition="left"
                    onClick={handleAddNewIncident}
                    disabled={!canCreateIncident}
                    fullWidth
                  >
                    Add New Incident
                  </CustomButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* TABLE - same as Residents: flex 1, paddingX */}
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
              }}
            >
              <Grid size={{ xs: 12 }} sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                <TableSkeleton
                  headers={[
                    { id: "referralId", label: "Referral ID", width: "150px" },
                    { id: "residentName", label: "Residents Name", width: "250px" },
                    { id: "groupHome", label: "Group Home", width: "250px" },
                    { id: "date", label: "Date", width: "220px" },
                    { id: "status", label: "Status", width: "140px" },
                    { id: "acknowledged", label: "Acknowledged", width: "220px" },
                    { id: "action", label: "Action", width: "72px" },
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
            <Grid size={{ xs: 12 }} sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <IncidentsTable
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
                data={incidents}
                totalPages={totalPages}
                totalRecords={totalRecords}
                onViewClick={handleViewIncident}
                onEditClick={handleEditIncident}
                onReviewSignClick={handleReviewSignIncident}
                onChangeStatusClick={handleChangeStatus}
                onPrintClick={handlePrintIncident}
                hidePagination
              />
            </Grid>
          )}
      </Box>

      {/* Pagination row - same as Residents (always visible at bottom) */}
      {!isLoading && !error && (
        <Box
          sx={{
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
          }}
        >
          <Paginator
            page={page}
            totalPages={totalPages}
            totalRecord={totalRecords}
            defaultSize={pageSize}
            onPageChange={(_e, newPage) => setPage(newPage)}
            onRecordsPerPageChange={(newSize) => {
              handlePageSizeChange(newSize);
              setPage(0);
            }}
          />
        </Box>
      )}

        {/* Drawers */}
        <AddNewIncidentDrawer
          open={isAddIncidentOpen}
          onClose={() => setIsAddIncidentOpen(false)}
          mode="add"
          onSuccess={(message: string) => {
            setSnackbar({
              isOpen: true,
              message,
              status: "success",
            });
            if (onSuccess) onSuccess(message);
          }}
          onError={(message: string) => {
            setSnackbar({
              isOpen: true,
              message,
              status: "error",
            });
            if (onError) onError(message);
          }}
        />
        <AddNewIncidentDrawer
          open={!!editIncidentUuid}
          onClose={handleCloseEditIncident}
          mode="edit"
          incidentUuid={editIncidentUuid}
          focusSignatureOnOpen={focusSignatureOnOpen}
          onSuccess={(message: string) => {
            setSnackbar({
              isOpen: true,
              message,
              status: "success",
            });
            if (onSuccess) onSuccess(message);
          }}
          onError={(message: string) => {
            setSnackbar({
              isOpen: true,
              message,
              status: "error",
            });
            if (onError) onError(message);
          }}
        />
        <ViewIncidentDrawer
          open={!!viewIncidentUuid}
          onClose={handleCloseViewIncident}
          incidentUuid={viewIncidentUuid}
          onEdit={(uuid) => {
            handleCloseViewIncident();
            handleEditIncident(uuid);
          }}
        />

        {/* Snackbar for status update notifications */}
        <CommonSnackbar
          isOpen={snackbar.isOpen}
          message={snackbar.message}
          status={snackbar.status}
          onClose={handleSnackbarClose}
          autoClose={true}
          autoCloseDelay={5000}
        />

        {/* Confirmation Popup for Status Change */}
        <ConfirmationPopUp
          open={!!statusChangePending}
          onClose={handleCancelStatusChange}
          onConfirm={handleConfirmStatusChange}
          message={
            statusChangePending
              ? `Are you sure you want to change the incident status from ${
                  statusChangePending.currentStatus === "OPEN"
                    ? "Open"
                    : statusChangePending.currentStatus === "ACKNOWLEDGED"
                    ? "Acknowledged"
                    : "Closed"
                } to ${statusChangePending.newStatus === "OPEN" ? "Open" : "Closed"}?`
              : ""
          }
          confirmDisabled={updateStatusMutation.isPending}
        />
    </Box>
  );
};

export default AllIncidentsSection;
