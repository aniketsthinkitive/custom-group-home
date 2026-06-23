import { useState, useEffect } from "react";
import { Box, useTheme, useMediaQuery } from "@mui/material"; 
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import MovedOutResidentsHeader from "./MovedOutResidentsHeader";
import MovedOutResidentsTable from "./MovedOutResidentsTable";
import { useQuery } from "@tanstack/react-query";
import { listResidentsOptions } from "../../../sdk/@tanstack/react-query.gen";

type Props = {
  open: boolean;
  onClose: () => void;
  onReAdmit: (row: any) => void;
};

const MovedOutResidentsDrawer = ({ open, onClose, onReAdmit  }: Props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search term with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error, refetch } = useQuery({
    ...listResidentsOptions({
      query: {
        page: page,
        size: pageSize,
        status: "MOVED_OUT",     // 🔑 fixed for drawer
        ...(debouncedSearch && { search: debouncedSearch }),
      },
    }),
    enabled: open, // Only fetch when drawer is open
    refetchOnMount: false, // We'll handle refetch manually when drawer opens
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    staleTime: 0, // Always consider data stale
  });

  // Refetch every time drawer opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    if (open) {
      setPage(1);
    }
  }, [debouncedSearch, open]);

  // Extract pagination info from API response
  const paginationData = (data as any)?.data?.pagination;
  const totalRecords = paginationData?.total_records ?? 0;
  const totalPages = paginationData?.total_pages ?? 1;
  // Convert 1-indexed page (from API) to 0-indexed (for Paginator component)
  const currentPage = (paginationData?.page ?? page) - 1;

  const handlePageChange = (_event: React.ChangeEvent<unknown> | null, newPage: number) => {
    // Paginator uses 0-indexed pages, but API uses 1-indexed, so convert
    setPage(newPage + 1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };




  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth={isMobile ? "100%" : isTablet ? "700px" : "860px"}
      drawermargin={isMobile ? "0" : undefined}
      drawerPadding={isMobile ? "0px" : "10px"}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Box sx={{ flexShrink: 0 }}>
          <MovedOutResidentsHeader
            search={search}
            onSearchChange={setSearch}
            onClose={onClose}
          />
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0, pt: "10px", pb: "10px", display: "flex", flexDirection: "column" }}>
          <MovedOutResidentsTable
            data={(data as any)?.data?.results ?? []}
            loading={isLoading}
            error={!!error}
            onReAdmit={onReAdmit}
            page={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Box>
      </Box>
    </CustomDrawer>
  );
};

export default MovedOutResidentsDrawer;
