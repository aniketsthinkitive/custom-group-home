import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import UsersTable, { type UserData } from './UsersTable';
import Paginator from '../../../components/pagination/pagination';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import { useQuery, useMutation, useQueryClient, type DefaultError } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { listUsersOptions, changeUserStatusMutation, listUsersQueryKey, resendUserInviteMutation } from '../../../sdk/@tanstack/react-query.gen';

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface UsersTableWithPaginationProps {
  searchTerm?: string;
  onEdit?: (user: UserData) => void;
}

const UsersTableWithPagination: React.FC<UsersTableWithPaginationProps> = ({
  searchTerm = '',
  onEdit,
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

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const { data: usersResponse, isLoading } = useQuery(
    listUsersOptions({
      query: {
        page: currentPage + 1,
        size: recordsPerPage,
        role: "ADMIN,STAFF", // Filter by staff and admin roles
      },
    }) as any
  );

  const changeStatusMutation = useMutation({
    ...changeUserStatusMutation(),
    onSuccess: (data: unknown) => {
      // Extract message from backend response
      // Backend returns: { status: "success", code: 200, message: "User status updated successfully", data: {...} }
      const responseData = data as { message?: string } | undefined;
      const successMessage = responseData?.message || 'User status updated successfully';
      
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: [{ _id: "listUsers" }] });
      
      // Show success snackbar with backend message
      setSnackbar({
        isOpen: true,
        message: successMessage,
        status: 'success',
      });
    },
    onError: (error: AxiosError<DefaultError>) => {
      // Extract error message from backend response
      // Backend returns: { status: "error", code: number, message: "error message" }
      const errorData = error.response?.data as { message?: string } | undefined;
      const errorMessage = 
        errorData?.message || 
        error.message || 
        'Failed to change user status. Please try again.';
      
      // Show error snackbar with backend message
      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
    },
  });

  const resendInviteMutation = useMutation({
    ...resendUserInviteMutation(),
    onSuccess: (data: unknown) => {
      const responseData = data as { message?: string } | undefined;
      const successMessage = responseData?.message || 'Invite link resent successfully';
      queryClient.invalidateQueries({ queryKey: listUsersQueryKey() });
      setSnackbar({
        isOpen: true,
        message: successMessage,
        status: 'success',
      });
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as { message?: string } | undefined;
      const errorMessage =
        errorData?.message ||
        error.message ||
        'Failed to resend invite. Please try again.';
      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
    },
  });

  const extractUsersData = (): UserData[] => {
    if (!usersResponse) return [];
    
    const responseData = usersResponse as any;
    let users: any[] = [];
    
    if (responseData?.data) {
      if (responseData.data.results && Array.isArray(responseData.data.results)) {
        users = responseData.data.results;
      } else if (Array.isArray(responseData.data)) {
        users = responseData.data;
      } else if (responseData.data.data && Array.isArray(responseData.data.data)) {
        users = responseData.data.data;
      } else if (responseData.data.content && Array.isArray(responseData.data.content)) {
        users = responseData.data.content;
      }
    }
    
    return users.map((user: any) => {
      // Extract group home name from object or use existing string value
      let groupHomeName = '-';
      if (user.group_homes && Array.isArray(user.group_homes) && user.group_homes.length > 0) {
        groupHomeName = user.group_homes.map((gh: any) => gh.name).join(', ');
      } else if (user.groupHome && typeof user.groupHome === 'string') {
        groupHomeName = user.groupHome;
      } else if (user.group_home) {
        if (typeof user.group_home === 'string') {
          groupHomeName = user.group_home;
        } else if (user.group_home && typeof user.group_home === 'object' && user.group_home.name) {
          groupHomeName = user.group_home.name;
        }
      }
      
      return {
        ...user,
        groupHome: groupHomeName,
        // Preserve the original group_home object for editing purposes
        group_home: user.group_home,
        group_homes: user.group_homes,
      };
    }) as UserData[];
  };

  const userData = extractUsersData();

  const getPaginationInfo = (): PaginationInfo => {
    if (!usersResponse) {
      return {
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 10,
      };
    }

    const responseData = usersResponse as any;
    
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
      totalElements: userData.length,
      totalPages: Math.ceil(userData.length / recordsPerPage),
      currentPage: 0,
      pageSize: recordsPerPage,
    };
  };

  const paginationInfo: PaginationInfo = getPaginationInfo();

  const handlePageChange = (_event: React.ChangeEvent<unknown> | null, page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(0);
  };

  const handleStatusChange = (user: UserData) => {
    const currentStatus = user.status?.toLowerCase() || (user.active ? 'active' : 'inactive');
    const isActive = currentStatus === 'active';
    
    // If active, pass false to deactivate; if inactive, pass true to activate
    const newActiveStatus = !isActive;
    
    changeStatusMutation.mutate({
      path: {
        uuid: user.uuid,
      },
      body: {
        active: newActiveStatus,
      },
    });
  };

  const handleResendLink = (user: UserData) => {
    resendInviteMutation.mutate({
      headers: { 'Content-Type': 'application/json' },
      body: { uuid: user.uuid },
    } as unknown as any);
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
          overflow: "auto",
          minHeight: 0,
        }}
      >
        <UsersTable
          data={userData}
          loading={isLoading}
          onEdit={onEdit}
          onDeactivate={handleStatusChange}
          onResendLink={handleResendLink}
        />
      </Box>

      {!isLoading && paginationInfo.totalElements > 0 && (
        <Box
          sx={{
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
          }}
        >
          <Paginator
            page={paginationInfo.currentPage}
            totalPages={paginationInfo.totalPages}
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

export default UsersTableWithPagination;
