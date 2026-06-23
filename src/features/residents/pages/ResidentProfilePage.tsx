import React, { useState, useMemo, Suspense } from "react";
import dayjs, { Dayjs } from "dayjs";
import { useParams, useLocation } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "../../../store/hooks";

import {
  getLeadDetailOptions,
  listIncidentsOptions,
  listGroupHomesOptions,
} from "../../../sdk/@tanstack/react-query.gen";

import { residentDocumentsData } from "../../../constant/documentsTableData";
import ResidentProfileHeader from "../components/ResidentProfileHeader";
import ResidentProfileSectionHeader from "../components/ResidentProfileSectionHeader";
import type { IncidentRow } from "../components/IncidentTable";

const CarePlan = React.lazy(() =>
  import("../components/CarePlan").then((module) => ({
    default: module.default,
  })),
);
const IncidentTable = React.lazy(() =>
  import("../components/IncidentTable").then((module) => ({
    default: module.default,
  })),
);
const ConsentFormsTable = React.lazy(() =>
  import("../components/Concent&FormsTable").then((module) => ({
    default: module.default,
  })),
);
const ResidentAppointmentsTable = React.lazy(() =>
  import("../components/ResidentAppointmentsTable").then((module) => ({
    default: module.default,
  })),
);
const ProvidersTable = React.lazy(() =>
  import("../components/ProvidersTable").then((module) => ({
    default: module.default,
  })),
);
const DocumentsSection = React.lazy(() =>
  import("../components/DocumentsSection").then((module) => ({
    default: module.default,
  })),
);
const ArchivedGoalsDrawer = React.lazy(() =>
  import("../components/ArchivedGoalsDrawer").then((module) => ({
    default: module.default,
  })),
);

const ResidentProfilePage = () => {
  const { residentId } = useParams<{ residentId: string }>();
  const location = useLocation();
  const residentData = location.state?.residentData;
  const user = useAppSelector((state) => state.auth.user);
  const roleName = user?.role?.name?.toLowerCase();

  /* =========================
     UI STATE
  ========================= */
  const [activeSection, setActiveSection] = useState<
    "documents" | "consent" | "carePlan" | "incidents" | "appointments" | "provider"
  >(roleName === "nurse" ? "consent" : "documents");

  const [filterDate, setFilterDate] = useState<Dayjs | undefined>();
  const [carePlanInternalTab, setCarePlanInternalTab] = useState(0);
  const [carePlanSearch, setCarePlanSearch] = useState("");
  const [carePlanShowArchived, setCarePlanShowArchived] = useState(false);
  const [archivedGoalsDrawerOpen, setArchivedGoalsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Incidents pagination (0-based page index, API uses 1-based)
  const [incidentPage, setIncidentPage] = useState(0);
  const [incidentPageSize, setIncidentPageSize] = useState(10);

  /* =========================
    RESIDENT DETAILS
 ========================= */
  const {
    data: residentResponse,
    isLoading,
    error,
  } = useQuery({
    ...getLeadDetailOptions({
      path: { uuid: residentId || "" },
    }),
    staleTime: 0, // Always refetch when invalidated to get updated status
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const residentUserId = (residentResponse as any)?.data?.user?.uuid;
  const leadId = (residentResponse as any)?.data?.uuid;

  /* =========================
     GROUP HOME UUID LOOKUP
  ========================= */
  const { data: groupHomesData } = useQuery({
    ...listGroupHomesOptions({ query: { size: 100 } }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const groupHomeUuid = useMemo(() => {
    // Prefer UUID directly from API response
    const apiUuid = (residentResponse as any)?.data?.group_home_uuid;
    if (apiUuid) return apiUuid;

    // Fallback: lookup from group homes list
    const groupHomeName = (residentResponse as any)?.data?.group_home || residentData?.group_home;
    const groupHomeId = (residentResponse as any)?.data?.group_home_id || residentData?.group_home_id;
    const homes = (groupHomesData as any)?.data?.results ?? (groupHomesData as any)?.results ?? [];
    if (!Array.isArray(homes) || homes.length === 0) return "";
    const match = homes.find(
      (gh: any) => (groupHomeId && gh.id === groupHomeId) || (groupHomeName && gh.name === groupHomeName),
    );
    return match?.uuid || "";
  }, [groupHomesData, residentData, residentResponse]);

  // Derive moved-out status from ALL relevant fields (API response + navigation state)
  const isMovedOut =
    (residentResponse as any)?.data?.resident_status === "MOVED_OUT" ||
    (residentResponse as any)?.data?.assignment_status === "MOVED_OUT" ||
    (residentResponse as any)?.data?.status === "MOVED_OUT" ||
    residentData?.status === "MOVED_OUT" ||
    residentData?.assignment_status === "MOVED_OUT";

  /* =========================
     INCIDENTS
  ========================= */
  const incidentsQuery = listIncidentsOptions({
    query: {
      ...((residentResponse as any)?.data?.user?.uuid
        ? { resident_uuid: (residentResponse as any).data.user.uuid }
        : {}),
      ...(filterDate ? { date: dayjs(filterDate).format("YYYY-MM-DD") } : {}),
      page: incidentPage + 1,   // API is 1-based
      size: incidentPageSize,
    } as any,
  });

  const isIncidentsTab = activeSection === "incidents";

  const { data: incidentsResponse, isLoading: incidentsLoading } = useQuery({
    ...incidentsQuery,
    enabled: !!(residentResponse as any)?.data?.user?.uuid && isIncidentsTab,
  });

  // Pagination metadata from API
  const incidentTotalRecords: number =
    (incidentsResponse as any)?.data?.pagination?.total_records ??
    (incidentsResponse as any)?.data?.pagination?.totalElements ??
    (incidentsResponse as any)?.data?.count ??
    0;
  const incidentTotalPages: number =
    (incidentsResponse as any)?.data?.pagination?.total_pages ??
    (incidentsResponse as any)?.data?.pagination?.totalPages ??
    Math.max(1, Math.ceil(incidentTotalRecords / incidentPageSize));

  const incidents: IncidentRow[] =
    (incidentsResponse as any)?.data?.results?.map((item: any) => ({
      uuid: item.uuid,
      category: item.incident_name || "Incident",
      status: item.status as string,
      created_by_name: `${item.reported_by_details?.first_name ?? ""} ${item.reported_by_details?.last_name ?? ""}`.trim(),
      created_at: item.created_at,
      updated_at: item.updated_at,
      location: item.location,
      injuries: item.incident_description,
      notifications: item.notifications || [],
      comment: item.comment,
      comments: item.comments || [],
    })) ?? [];
  const filteredDocuments = useMemo(() => {
  if (roleName === "nurse") {
    return residentDocumentsData.filter(
      (doc) =>
        doc.formCode ===
        "5_AND_30_DAY_NURSING_TRANSITION_EVALUATION_FORM"
    );
  }

  return residentDocumentsData;
}, [roleName]);
  /* =========================
     LOADING / ERROR
  ========================= */
  if (isLoading) {
    return (
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography color="error">Error loading resident profile</Typography>
      </Grid>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <Grid
      container
      direction="column"
      sx={{ 
        height: "calc(100vh - 64px)", 
        overflow: "hidden",
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px", md: "18px" },
        width: "100%",
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
          <ResidentProfileHeader
            resident={(residentResponse as any)?.data}
            roomNumber={
              (residentResponse as any)?.data?.room_number
                ? ` ${(residentResponse as any).data.room_number}`
                : residentData?.room_number
                  ? ` ${residentData.room_number}`
                  : ""
            }
            roomId={residentData?.room_id}
          />

          <ResidentProfileSectionHeader
            activeSection={activeSection}
            onSectionChange={(section) => {
              setActiveSection(section);
              setSearchQuery("");
              // Reset incidents pagination when switching to the tab
              if (section === "incidents") setIncidentPage(0);
            }}
            filterDate={filterDate}
            onFilterDateChange={(value) => {
              setFilterDate(value ?? undefined);
              // Reset page when date filter changes
              setIncidentPage(0);
            }}
            onSearchChange={setSearchQuery}
            residentId={residentUserId}
            residentName={`${(residentResponse as any)?.data?.user?.first_name} ${(residentResponse as any)?.data?.user?.last_name}`}
            carePlanInternalTab={carePlanInternalTab}
            onCarePlanSearchChange={setCarePlanSearch}
            carePlanSearch={carePlanSearch}
            onToggleCarePlanArchived={() => setArchivedGoalsDrawerOpen(true)}
            carePlanShowArchived={carePlanShowArchived}
            disabledReason={isMovedOut ? "Resident is Moved Out" : undefined}
          />

          {/* TABLE - same as Residents list: flex 1, paddingX */}
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              paddingX: { xs: "16px", sm: "24px", md: "20px" },
              paddingY: { xs: "16px", sm: "20px", md: "24px" },
              width: "100%",
            }}
          >
            <Suspense fallback={null}>
              {activeSection === "documents" && leadId && (
                <DocumentsSection
                  objectId={leadId}
                  contentTypeApp="leads"
                  contentTypeModel="lead"
                  searchQuery={searchQuery}
                  formList={filteredDocuments}
                  residentName={`${(residentResponse as any)?.data?.user?.first_name ?? ""} ${(residentResponse as any)?.data?.user?.last_name ?? ""}`.trim()}
                  disabledReason={isMovedOut ? "Resident is Moved Out" : undefined}
                  residentUserUuid={residentUserId}
                />
              )}

              {activeSection === "carePlan" && (
                <CarePlan
                  residentId={residentUserId}
                  search={carePlanSearch}
                  showArchived={carePlanShowArchived}
                  onInternalTabChange={setCarePlanInternalTab}
                  isMovedOut={isMovedOut}
                  groupHomeUuid={groupHomeUuid}
                />
              )}

              {activeSection === "incidents" && (
                <IncidentTable
                  rows={incidents}
                  loading={incidentsLoading}
                  residentId={residentUserId}
                  disabledReason={isMovedOut ? "Resident is Moved Out" : undefined}
                  page={incidentPage}
                  pageSize={incidentPageSize}
                  totalRecords={incidentTotalRecords}
                  totalPages={incidentTotalPages}
                  onPageChange={(newPage) => setIncidentPage(newPage)}
                  onPageSizeChange={(newSize) => {
                    setIncidentPageSize(newSize);
                    setIncidentPage(0);
                  }}
                />
              )}

              {activeSection === "consent" && (
                <ConsentFormsTable
                  residentName={`${(residentResponse as any)?.data?.user?.first_name} ${(residentResponse as any)?.data?.user?.last_name}`}
                  residentData={(residentResponse as any)?.data}
                  searchQuery={searchQuery}
                  guardianDetails={
                    (residentResponse as any)?.data?.guardian &&
                    typeof (residentResponse as any).data.guardian === "object" &&
                    (residentResponse as any).data.guardian.first_name !== undefined
                      ? {
                          name: `${(residentResponse as any).data.guardian.first_name || ""} ${(residentResponse as any).data.guardian.last_name || ""}`.trim() || "",
                          email: (residentResponse as any).data.guardian.email || "",
                          phone: (residentResponse as any).data.guardian.phone || (residentResponse as any).data.guardian.phone_number || "",
                        }
                      : undefined
                  }
                  agentDetails={
                    (residentResponse as any)?.data?.agent &&
                    typeof (residentResponse as any).data.agent === "object" &&
                    (residentResponse as any).data.agent.first_name !== undefined
                      ? {
                          name: `${(residentResponse as any).data.agent.first_name || ""} ${(residentResponse as any).data.agent.last_name || ""}`.trim() || "",
                          email: (residentResponse as any).data.agent.email || "",
                          phone: (residentResponse as any).data.agent.phone || (residentResponse as any).data.agent.phone_number || "",
                        }
                      : undefined
                  }
                  disabledReason={isMovedOut ? "Resident is Moved Out" : undefined}
                />
              )}

              {activeSection === "appointments" && (
                <ResidentAppointmentsTable
                  residentId={residentId || ""}
                  residentName={`${(residentResponse as any)?.data?.user?.first_name} ${(residentResponse as any)?.data?.user?.last_name}`}
                  residentNumericId={(residentResponse as any)?.data?.id}
                  disabledReason={isMovedOut ? "Resident is Moved Out" : undefined}
                />
              )}

              {activeSection === "provider" && (
                <ProvidersTable
                  leadUuid={residentId}
                  disabledReason={isMovedOut ? "Resident is Moved Out" : undefined}
                />
              )}
            </Suspense>
          </Box>
        </Box>
      </Grid>
      {(residentResponse as any)?.data?.uuid && archivedGoalsDrawerOpen && (
        <Suspense fallback={null}>
          <ArchivedGoalsDrawer
            open={archivedGoalsDrawerOpen}
            onClose={() => setArchivedGoalsDrawerOpen(false)}
            residentId={(residentResponse as any).data.user.uuid}
          />
        </Suspense>
      )}
    </Grid>
  );
};

export default ResidentProfilePage;









