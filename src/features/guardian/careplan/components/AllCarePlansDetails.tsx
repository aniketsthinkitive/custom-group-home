// AllCarePlansDetails.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography, Grid } from "@mui/material";

import CustomInput from "../../../../components/custom-input/custom-input";
import TableSkeleton from "../../../../components/common-table/TableSkeleton";
import CarePlansTable from "./CarePlansTable";
import CustomSelect from "../../../../components/custom-select/custom-select";
import { useCarePlansQuery } from "../hooks/useCarePlans";
import { listGroupHomesOptions } from "../../../../sdk/@tanstack/react-query.gen";
import type { CarePlan } from "../types/carePlan.types";
import { useAuth } from "../../../../hooks/useAuth";

const AllCarePlansDetails: React.FC = () => {
  const { user } = useAuth();
  const userRole = user?.role?.type;
  const userUuid = user?.uuid;

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [groupHomeFilter, setGroupHomeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [viewCarePlanUuid, setViewCarePlanUuid] = useState<string>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch Group Homes for Filter
  const { data: groupHomesData } = useQuery({
    ...listGroupHomesOptions({
      query: { size: 100 },
    }),
  });

  const groupHomeOptions = useMemo(() => {
    let homes: any[] = [];
    const responseData = groupHomesData as any;

    if (
      responseData?.data?.results &&
      Array.isArray(responseData.data.results)
    ) {
      homes = responseData.data.results;
    } else if (
      responseData?.data?.content &&
      Array.isArray(responseData.data.content)
    ) {
      homes = responseData.data.content;
    } else if (Array.isArray(responseData?.data)) {
      homes = responseData.data;
    } else if (Array.isArray(responseData)) {
      homes = responseData;
    }

    const mapped = homes
      .filter((h) => h.uuid && h.name)
      .map((h) => ({ key: String(h.uuid), value: h.name }));

    return [{ key: "", value: "All Group Home" }, ...mapped];
  }, [groupHomesData]);

  const { data, isLoading, error } = useCarePlansQuery(
    debouncedSearch,
    groupHomeFilter || undefined,
    page,
    pageSize,
    userRole,
    userUuid,
    statusFilter === "ALL" ? undefined : statusFilter, // Don't pass status filter when "ALL" is selected
  );

  const carePlans: CarePlan[] = useMemo(
    () =>
      data?.carePlans && Array.isArray(data.carePlans) ? data.carePlans : [],
    [data],
  );

  const pagination = data?.pagination as
    | { total_records?: number; total_pages?: number }
    | null
    | undefined;
  const totalRecords = pagination?.total_records ?? 0;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [groupHomeFilter, debouncedSearch, statusFilter]);

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
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2, flexWrap: "wrap", gap: { xs: 1, sm: 0 }, paddingX: { xs: "16px", sm: "24px", md: "20px" }, paddingTop: "16px" }}
        >
          {/* Title */}
          <Typography sx={{ fontSize: { xs: 18, sm: 20 }, fontWeight: 600 }}>
            Care Plan
          </Typography>

          {/* Filters */}
          <Grid
            container
            alignItems="center"
            gap={1}
            sx={{ width: { xs: "100%", sm: "auto" }, flexWrap: "wrap" }}
          >
            <Grid sx={{ width: { xs: "100%", sm: 220 } }}>
              <CustomSelect
                name="group-home-filter"
                placeholder="All Group Home"
                bgWhite
                // enableDeselect
                value={groupHomeFilter} // ✅ keeps same state
                items={groupHomeOptions.map((opt) => ({
                  value: opt.key, // ✅ your options are { key, value }
                  label: opt.value,
                }))}
                onChange={(e) => setGroupHomeFilter(e.target.value)}
              />
            </Grid>

            <Grid sx={{ width: { xs: "100%", sm: 260 } }}>
              <CustomInput
                name="search-resident"
                placeholder="Search Resident Name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                width: "100%",
              }}
            >
              <Grid
                size={{ xs: 12 }}
                sx={{ flex: 1, minHeight: 0, overflow: "auto" }}
              >
                <TableSkeleton
                  headers={[
                    { id: "referralId", label: "Referral ID", width: "150px" },
                    { id: "residentName", label: "Residents Name", width: "150px" },
                    { id: "groupHome", label: "Group Home", width: "150px" },
                    { id: "status", label: "Status", width: "120px" },
                    { id: "date", label: "Date", width: "150px" },
                    { id: "action", label: "Action", width: "150px" },
                  ]}
                  rowCount={10}
                  hasAvatar
                  hasActions
                />
              </Grid>
            </Grid>
          ) : error ? (
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ padding: "16px", color: "#C62828" }}>
                Failed to load care plans. Please try again.
              </Typography>
            </Grid>
          ) : (
            <Grid size={{ xs: 12 }} sx={{ flex: 1, minHeight: 0, height: "100%" }}>
              <CarePlansTable
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(0);
                }}
                data={carePlans}
                totalRecords={totalRecords}
                totalPages={totalPages}
                onViewClick={setViewCarePlanUuid}
              />
            </Grid>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AllCarePlansDetails;
