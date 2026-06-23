import React from 'react';
import { Grid } from '@mui/material';
import AppointmentsTable, { type AppointmentData } from './AppointmentsTable';
import Paginator from '../../../components/pagination/pagination';

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface AppointmentsTableWithPaginationProps {
  data: AppointmentData[];
  loading: boolean;
  paginationInfo: PaginationInfo;
  onPageChange: (event: React.ChangeEvent<unknown> | null, page: number) => void;
  onRecordsPerPageChange: (recordsPerPage: number) => void;
  onEdit?: (appointment: AppointmentData) => void;
  onView?: (appointment: AppointmentData) => void;
  onMarkCompleted?: (appointment: AppointmentData) => void;
  onDelete?: (appointment: AppointmentData) => void;
  onResidentClick?: (appointment: AppointmentData) => void;
  actionType?: 'menu' | 'view';
}

const AppointmentsTableWithPagination: React.FC<AppointmentsTableWithPaginationProps> = ({
  data,
  loading,
  paginationInfo,
  onPageChange,
  onRecordsPerPageChange,
  onEdit,
  onView,
  onMarkCompleted,
  onDelete,
  onResidentClick,
  actionType,
}) => {
  return (
    <Grid
      container
      flexDirection="column"
      size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
      sx={{
        backgroundColor: "#FFFFFF",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid
        size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        sx={{
          '&&': { flex: 1 },
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppointmentsTable
          data={data}
          loading={loading}
          onEdit={onEdit}
          onView={onView}
          onMarkCompleted={onMarkCompleted}
          onDelete={onDelete}
          onResidentClick={onResidentClick}
          actionType={actionType}
        />
      </Grid>

      {!loading && (
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
          sx={{
            "&&": { flexShrink: 0, marginTop: "auto" },
            backgroundColor: "#FFFFFF",
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
          }}
        >
          <Paginator
            page={paginationInfo.currentPage}
            totalPages={Math.max(1, paginationInfo.totalPages)}
            totalRecord={paginationInfo.totalElements}
            onPageChange={onPageChange}
            onRecordsPerPageChange={onRecordsPerPageChange}
            defaultSize={paginationInfo.pageSize}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default AppointmentsTableWithPagination;
