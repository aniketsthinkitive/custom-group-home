import React from 'react';
import { Grid } from '@mui/material';
import ResidentsTable from './ResidentsTable';
import Paginator from '../../../components/pagination/pagination';

interface ResidentsTableWithPaginationProps {
  page: number;
  pageSize: number;
  totalRecords: number;
  data: any[];
  loading?: boolean;
  error?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const ResidentsTableWithPagination: React.FC<ResidentsTableWithPaginationProps> = ({
  page,
  pageSize,
  totalRecords,
  data,
  loading = false,
  error = false,
  onPageChange,
  onPageSizeChange,
}) => {
  // Parent (Residentdetailspage) already passes current page from API – do not slice
  const pageRows = Array.isArray(data) ? data : [];
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const handlePageChange = (_event: React.ChangeEvent<unknown> | null, newPage: number) => {
    onPageChange(newPage);
  };

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    onPageSizeChange(newRecordsPerPage);
  };

  return (
    <Grid
      container
      direction="column"
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <Grid
        size={{ xs: 12 }}
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <ResidentsTable
          data={pageRows}
          loading={loading}
          error={error}
        />
      </Grid>

      {!loading && (
        <Grid
          size={{ xs: 12 }}
          sx={{
            backgroundColor: "#FFFFFF",
            flexShrink: 0,
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
            width: "100%",
          }}
        >
          <Paginator
            page={page}
            totalPages={totalPages}
            totalRecord={totalRecords}
            onPageChange={handlePageChange}
            onRecordsPerPageChange={handleRecordsPerPageChange}
            defaultSize={pageSize}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default ResidentsTableWithPagination;

