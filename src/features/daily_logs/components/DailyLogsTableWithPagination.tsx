import React from 'react';
import { Grid, Box } from '@mui/material';
import DailyLogsTable, { type DailyLogData } from './DailyLogsTable';
import Paginator from '../../../components/pagination/pagination';

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface DailyLogsTableWithPaginationProps {
  data: DailyLogData[];
  loading: boolean;
  paginationInfo: PaginationInfo;
  onPageChange: (_event: React.ChangeEvent<unknown> | null, page: number) => void;
  onRecordsPerPageChange: (newRecordsPerPage: number) => void;
  onView?: (log: DailyLogData) => void;
  /** When true, pagination is rendered by the parent (e.g. DailyLogsPage) so it stays visible. */
  hidePagination?: boolean;
}

const DailyLogsTableWithPagination: React.FC<DailyLogsTableWithPaginationProps> = ({
  data,
  loading,
  paginationInfo,
  onRecordsPerPageChange,
  onPageChange,
  onView,
  hidePagination = false,
}) => {

  // No client-side filtering needed — the API already handles entity_type filtering
  // server-side with proper iendswith/iexact logic. Applying a second exact-match
  // filter here caused pagination count mismatches (e.g. "All Documents" showed 370
  // total but only 1 row because subtypes like "Lead/Document" were excluded).
  const filteredData = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data;
  }, [data]);

  return (
    <Grid
      container
      flexDirection="column"
      size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
      sx={{
        backgroundColor: "#FFFFFF",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid
        size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        sx={{
          "&&": { flex: 1, minHeight: 0 },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <DailyLogsTable
            data={filteredData}
            loading={loading}
            onView={onView}
          />
        </Box>
      </Grid>

      {/* Pagination row - only when not lifted to parent */}
      {!hidePagination && (
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
          sx={{
            "&&": { flexShrink: 0, marginTop: "auto" },
            minHeight: 52,
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #E7E9EB",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {!loading && (
            <Paginator
              page={paginationInfo.currentPage}
              totalPages={Math.max(1, paginationInfo.totalPages)}
              totalRecord={paginationInfo.totalElements}
              onPageChange={onPageChange}
              onRecordsPerPageChange={onRecordsPerPageChange}
              defaultSize={paginationInfo.pageSize}
            />
          )}
        </Grid>
      )}
    </Grid>
  );
};

export default DailyLogsTableWithPagination;
