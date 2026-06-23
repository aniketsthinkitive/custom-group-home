import React, { useMemo, useState, useEffect } from "react";
import { Typography, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CustomSelect from "../../../../components/custom-select/custom-select";
import CustomInput from "../../../../components/custom-input/custom-input";
import DocumentsTable from "./DocumentsTable";
import TableSkeleton from "../../../../components/common-table/TableSkeleton";
import { useResidentsQuery } from "../hooks/useDocument";
import DatePickerField from "../../../../components/date-picker-field/date-picker-field";
import type { Dayjs } from "dayjs";
import { listGroupHomesOptions } from "../../../../sdk/@tanstack/react-query.gen";
import { useAuth } from "../../../../hooks/useAuth";

const AllDocumentDetails: React.FC = () => {
  const { user } = useAuth();

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);
  const [groupHome, setGroupHome] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // Debounce search term with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get user role and UUID for role-based filtering
  const userRole = user?.role?.type;
  const userUuid = user?.uuid;

  const {
    data: residentsResponse,
    isLoading: residentsLoading,
    error: residentsError,
  } = useResidentsQuery(
    {
      page: page + 1,
      size: pageSize,
      group_home: groupHome || undefined,
      search: debouncedSearchTerm || undefined,
      date: filterDate ? filterDate.format("YYYY-MM-DD") : undefined,
      role: userRole,
      user_uuid: userUuid,
      leads: true,
    },
    true
  );

  const pagination = residentsResponse?.pagination;

  const normalizedResidents = useMemo(() => {
    const results = residentsResponse?.results ?? [];
    return results.map((r: any) => ({
      ...r,
      referral_number: r.referral_number || '',
      resident_name: r.resident_name || "—",
      group_home: r.group_home ?? "-",
      date: r.created_at,
      avatarUrl: r.avatar_url ?? null,
    }));
  }, [residentsResponse]);

  /* ---- Group Homes ---- */
  const {
    data: groupHomesData,
    isLoading: groupHomesLoading,
    error: groupHomesError,
  } = useQuery(listGroupHomesOptions({ query: { size: 100 } }));

  const groupHomeItems = [
    { value: "", label: "All Group Home" },
    ...((groupHomesData as any)?.data?.results ?? []).map((gh: any) => ({
      value: gh.uuid,
      label: gh.name,
    })),
  ];

  const handleGroupHomeChange = (value: string) => {
    setGroupHome(value);
    setPage(0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
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
        {/* Header - match Appointments table */}
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
              All Documents
            </Typography>
          </Grid>

          {/* Filters - match Appointments table */}
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
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "200px", lg: "200px" }, flexShrink: 1 }}
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

            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "180px", lg: "180px" }, flexShrink: 1 }}
            >
              <DatePickerField
                label="Filter by Date"
                value={filterDate}
                onChange={(date) => {
                  setFilterDate(date);
                  setPage(0);
                }}
                bgWhite
                format="MM/DD/YYYY"
                showClearIcon={true}
              />
            </Grid>

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

        {/* Table Section - match Appointments table */}
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
          {groupHomesLoading || residentsLoading ? (
            <TableSkeleton
              headers={[
                { id: "referralId", label: "Referral ID", width: "150px" },
                {
                  id: "residentName",
                  label: "Residents Name",
                  width: "250px",
                },
                { id: "groupHome", label: "Group Home", width: "250px" },
                { id: "date", label: "Date", width: "220px" },
                { id: "action", label: "Action", width: "72px" },
              ]}
              rowCount={10}
              hasCheckbox={false}
              hasAvatar={true}
              hasActions={true}
            />
          ) : residentsError || groupHomesError ? (
            <Typography sx={{ color: "#C62828", p: 2 }}>
              Error loading documents. Please try again.
            </Typography>
          ) : (
            <DocumentsTable
              page={page}
              pageSize={pageSize}
              totalRecords={pagination?.total_records ?? 0}
              totalPages={pagination?.total_pages ?? 1}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
              data={normalizedResidents}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default AllDocumentDetails;
