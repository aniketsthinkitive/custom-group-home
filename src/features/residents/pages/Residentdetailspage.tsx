import React, { useState, useEffect, Suspense } from "react";
import { Grid, Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

import {
  listResidentsOptions,
  listGroupHomesOptions,
} from "../../../sdk/@tanstack/react-query.gen";

import ResidentsHeader from "../components/ResidentsHeader";
import ResidentsTableWithPagination from "../components/ResidentsTableWithPagination";
import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store/hooks";

const MovedOutResidentsDrawer = React.lazy(() =>
  import("../components/MovedOutResidentsDrawer").then((module) => ({
    default: module.default,
  })),
);
const ReAdmitResidentDrawer = React.lazy(() =>
  import("../components/ReadmitResidentsDrawer").then((module) => ({
    default: module.default,
  })),
);

const Residentdetailspage = () => {
  const { getScope } = usePermission();
  const user = useAppSelector((state) => state.auth.user);
  // Check scope from any resident-related permission the user may have
  const scope = getScope("adls.view") || getScope("goals.view") || getScope("documents.view");
  const isAssignedHome = scope === "ASSIGNED_HOME";

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [status, setStatus] = useState("ACTIVE");
  const [groupHome, setGroupHome] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [movedOutDrawerOpen, setMovedOutDrawerOpen] = useState(false);
  const [reAdmitDrawerOpen, setReAdmitDrawerOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  /* Backend already scopes residents to assigned group homes for PM/PC roles. */

  /* ---------------- Debounce Search ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- Reset Page on Filter Change ---------------- */
  useEffect(() => {
    setPage(0);
  }, [status, groupHome, debouncedSearch, pageSize]);

  /* ---------------- Fetch Group Homes (FROM DB) ---------------- */
  const { data: groupHomesData, isLoading: groupHomesLoading } = useQuery({
    ...listGroupHomesOptions({
      query: { size: 100 },
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const groupHomeItems = [
    ...(isAssignedHome ? [] : [{ value: "", label: "All Group Home" }]),
    ...((groupHomesData as any)?.data?.results ?? []).map((gh: any) => ({
      value: gh.uuid, // ✅ backend filter value (UUID)
      label: gh.name, // UI display
    })),
  ];

  const { data, isLoading, error } = useQuery({
    ...listResidentsOptions({
      query: {
        page: page + 1,
        size: pageSize,
        ...(status && { status }),
        ...(groupHome && { group_home: groupHome }),
        ...(debouncedSearch && { search: debouncedSearch }),
      },
    }),
    staleTime: 30_000,
  });

  /* ---------------- Drawer Handlers ---------------- */
  const handleOpenReAdmit = (row: any) => {
    setSelectedAssignment(row);
    setReAdmitDrawerOpen(true);
  };

  const handleCloseReAdmit = () => {
    setReAdmitDrawerOpen(false);
  };
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
          {/* HEADER - no extra padding here; ResidentsHeader has same padding as Daily Logs (16px top, 16px bottom margin) */}
          <Grid size={{ xs: 12 }}>
            <ResidentsHeader
              total={(data as any)?.data?.pagination?.total_records ?? 0}
              status={status}
              groupHome={groupHome}
              search={search}
              groupHomeItems={groupHomeItems}
              groupHomeLoading={groupHomesLoading}
              groupHomeDisabled={false}
              onStatusChange={setStatus}
              onGroupHomeChange={setGroupHome}
              onSearchChange={setSearch}
              onViewMovedOut={() => setMovedOutDrawerOpen(true)}
            />
          </Grid>

          {/* TABLE - same as Daily Logs: flex 1, paddingX */}
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
            <ResidentsTableWithPagination
            page={page}
            pageSize={pageSize}
            totalRecords={(data as any)?.data?.pagination?.total_records ?? 0}
            data={(data as any)?.data?.results ?? []}
            loading={isLoading}
            error={!!error}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
          </Box>
        </Box>
      </Grid>

      {/* DRAWERS */}
      <Suspense fallback={null}>
        <MovedOutResidentsDrawer
          open={movedOutDrawerOpen}
          onClose={() => setMovedOutDrawerOpen(false)}
          onReAdmit={handleOpenReAdmit}
        />
      </Suspense>

      <Suspense fallback={null}>
        <ReAdmitResidentDrawer
          open={reAdmitDrawerOpen}
          onClose={handleCloseReAdmit}
          resident={selectedAssignment}
        />
      </Suspense>
    </Grid>
  );
};

export default Residentdetailspage;
