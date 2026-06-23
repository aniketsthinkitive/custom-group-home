import React, { useState, useMemo, useEffect } from 'react';
import { Box } from '@mui/material';
import LeadsTable, { type LeadData } from './LeadsTable';
import Paginator from '../../../components/pagination/pagination';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import { useQuery, useMutation, useQueryClient, type DefaultError } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { listLeadsOptions, rejectReferralMutation } from '../../../sdk/@tanstack/react-query.gen';
import { normalizeLeadResponse } from '../api/leads.api';
import { invalidateLeadsList } from '../utils/queryInvalidation';

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface LeadsTableWithPaginationProps {
  searchTerm?: string;
  status?: string;
  onViewProfile?: (lead: LeadData) => void;
  onReject?: (lead: LeadData) => void;
}


const LeadsTableWithPagination: React.FC<LeadsTableWithPaginationProps> = ({
  searchTerm = '',
  status,
  onViewProfile,
  onReject,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    status: 'success',
  });
  const queryClient = useQueryClient();

  // Reset page when search term OR status changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, status]);

  const {
  data: leadsResponse,
  isLoading,
} = useQuery({
  ...listLeadsOptions({
    query: {
      page: currentPage + 1,
      size: recordsPerPage,
      search: searchTerm || undefined,
      status: status || undefined,
    },
  }),
  staleTime: 30000, // Consider data fresh for 30 seconds
  gcTime: 300000, // Keep in cache for 5 minutes
  refetchOnWindowFocus: false, // Don't refetch on window focus
});


  // Memoize expensive data extraction to prevent unnecessary recalculations
  const leadsData = useMemo(() => {
    if (!leadsResponse) return [];

    const responseData = leadsResponse as { data?: { results?: unknown[]; data?: unknown[]; content?: unknown[] } };
    let leads: unknown[] = [];

    if (responseData?.data) {
      if (responseData.data.results && Array.isArray(responseData.data.results)) {
        leads = responseData.data.results;
      } else if (Array.isArray(responseData.data)) {
        leads = responseData.data;
      } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
        leads = responseData.data.data;
      } else if (responseData.data.content && Array.isArray(responseData.data.content)) {
        leads = responseData.data.content;
      }
    }

    return normalizeLeadResponse({ data: { results: leads } });
  }, [leadsResponse]);

  // Memoize pagination info calculation to prevent unnecessary recalculations
  const paginationInfo: PaginationInfo = useMemo(() => {
    if (!leadsResponse) {
      return {
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 10,
      };
    }

    const responseData = leadsResponse as {
      data?: {
        pagination?: {
          total_records?: number;
          totalRecords?: number;
          total_pages?: number;
          totalPages?: number;
          page?: number;
          size?: number;
        };
        totalElements?: number;
        totalPages?: number;
        number?: number;
        size?: number;
      };
    };

    if (responseData?.data?.pagination) {
      const pag = responseData.data.pagination;
      return {
        totalElements: Number(pag.total_records || pag.totalRecords || 0),
        totalPages: Number(pag.total_pages || pag.totalPages || 0),
        currentPage: Number(pag.page || 1) - 1,
        pageSize: Number(pag.size || recordsPerPage),
      };
    }

    if (responseData?.data) {
      return {
        totalElements: Number(responseData.data.totalElements || 0),
        totalPages: Number(responseData.data.totalPages || 0),
        currentPage: Number(responseData.data.number || 0),
        pageSize: Number(responseData.data.size || recordsPerPage),
      };
    }

    return {
      totalElements: leadsData.length,
      totalPages: Math.ceil(leadsData.length / recordsPerPage),
      currentPage: 0,
      pageSize: recordsPerPage,
    };
  }, [leadsResponse, leadsData, recordsPerPage]);

  const handlePageChange = (_event: React.ChangeEvent<unknown> | null, page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(0);
  };

  const rejectMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(rejectReferralMutation() as any),
    onSuccess: async (data: unknown) => {
      const responseData = data as { message?: string } | undefined;

      // Invalidate queries using centralized utility
      await invalidateLeadsList(queryClient);

      setSnackbar({
        isOpen: true,
        message: responseData?.message || 'Lead rejected successfully',
        status: 'success',
      });
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<DefaultError>;
      const errorData = axiosError.response?.data as { message?: string } | undefined;
      const errorMessage =
        errorData?.message ||
        axiosError.message ||
        'Failed to reject lead. Please try again.';

      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
    },
  });

  const handleReject = (lead: LeadData) => {
    rejectMutation.mutate({
      path: { uuid: lead.referralId },
      body: { reason: 'Rejected from leads table' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          paddingX: { xs: "8px", sm: "16px", md: "20px" },
          width: "100%",
        }}
      >
        <LeadsTable
          data={leadsData}
          loading={isLoading}
          onViewProfile={onViewProfile}
          onReject={handleReject}
        />
      </Box>

      {!isLoading && (
        <Box
          sx={{
            backgroundColor: "#FFFFFF",
            flexShrink: 0,
            paddingX: { xs: "8px", sm: "16px", md: "20px" },
            width: "100%",
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

      {/* Snackbar for success/error messages */}
      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </Box>
  );
};

export default LeadsTableWithPagination;
