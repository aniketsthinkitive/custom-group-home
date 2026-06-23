import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Tooltip,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import {
  heading,
  tableCellCss,
  primaryTextCss,
} from '../../../components/common-table/widgets/common-table-widgets';
import TableSkeleton from '../../../components/common-table/TableSkeleton';
import { formatPhone } from '../../../utils';
import type { User } from '../../../sdk/types.gen';
import ConfirmationPopUp from '../../../components/confirmation-pop-up/confirmation-pop-up';
import Paginator from '../../../components/pagination/pagination';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import { useQuery, useMutation, useQueryClient, type DefaultError } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { listUsersOptions, changeUserStatusMutation, listUsersQueryKey } from '../../../sdk/@tanstack/react-query.gen';
import AddNewUserDrawer from './AddNewUserDrawer';
import type { UserFormData } from './AddNewUserForm';

export interface UserData extends Omit<User, 'group_home'> {
  group_home?: any;
  groupHome?: string;
  status?: string;
  role_type?: string;
  country_code?: string;
}

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

type GroupHomeUsersTableProps = {
  groupHomeUuid?: string;
  canEditUser: boolean;
  canDeactivateUser: boolean;
};

const GroupHomeUsersTable: React.FC<GroupHomeUsersTableProps> = ({
  groupHomeUuid,
  canEditUser,
  canDeactivateUser,

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
  const [tableData, setTableData] = useState<UserData[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<UserData | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToChange, setUserToChange] = useState<UserData | null>(null);

  // Memoize table headers with responsive widths for different screen sizes
  // Breakpoints:
  // - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
  // - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
  // - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
  // - Desktop (lg): >= 1280px - Full widths, fits within container
  const tableHeaders = [
    { 
      id: 'userName', 
      label: 'User Name', 
      width: { xs: '140px', sm: '160px', md: '180px', lg: '200px' },
      minWidth: { xs: '130px', sm: '150px', md: '170px', lg: '190px' },
      align: 'left' 
    },
    { 
      id: 'role', 
      label: 'Role', 
      width: { xs: '110px', sm: '140px', md: '160px', lg: '180px' },
      minWidth: { xs: '100px', sm: '130px', md: '150px', lg: '170px' },
      align: 'center' 
    },
    { 
      id: 'phoneNumber', 
      label: 'Phone Number', 
      width: { xs: '120px', sm: '135px', md: '145px', lg: '150px' },
      minWidth: { xs: '110px', sm: '125px', md: '135px', lg: '140px' },
      align: 'center' 
    },
    { 
      id: 'email', 
      label: 'Email', 
      width: { xs: '180px', sm: '220px', md: '250px', lg: '280px' },
      minWidth: { xs: '170px', sm: '200px', md: '230px', lg: '260px' },
      align: 'left' 
    },
    { 
      id: 'status', 
      label: 'Status', 
      width: { xs: '90px', sm: '100px', md: '110px', lg: '120px' },
      minWidth: { xs: '80px', sm: '90px', md: '100px', lg: '110px' },
      align: 'center' 
    },
    { 
      id: 'action', 
      label: 'Action', 
      width: { xs: '60px', sm: '65px', md: '70px', lg: '72px' },
      minWidth: { xs: '60px', sm: '65px', md: '70px', lg: '72px' },
      align: 'center' 
    },
  ];

  // Helper function to get header width and minWidth by id
  const getHeaderStyles = (id: string) => {
    const header = tableHeaders.find((h) => h.id === id);
    if (!header) return {};
    return {
      width: typeof header.width === 'object' ? header.width : header.width,
      minWidth: typeof header.minWidth === 'object' ? header.minWidth : header.minWidth || header.width,
    };
  };

  const { data: usersResponse, isLoading } = useQuery({
    ...listUsersOptions({
      query: {
        page: currentPage + 1,
        size: recordsPerPage,
        group_home_uuid: groupHomeUuid,
      } as any,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    enabled: !!groupHomeUuid,
  });

  const changeStatusMutation = useMutation({
    ...changeUserStatusMutation(),
    onSuccess: (data: unknown) => {
      const responseData = data as { message?: string } | undefined;
      const successMessage = responseData?.message || 'User status updated successfully';

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
        'Failed to change user status. Please try again.';

      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
    },
  });

  const getStatusColors = useCallback((status: string | undefined): { bg: string; color: string } => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'active':
        return { bg: '#E6F4EA', color: '#137333' };
      case 'inactive':
        return { bg: '#FCE8E6', color: '#C5221F' };
      case 'pending':
        return { bg: '#FEF7E6', color: '#EA8600' };
      default:
        return { bg: '#F2F2F2', color: '#757775' };
    }
  }, []);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Partial<UserFormData> | null>(null);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, row: UserData) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedRow(null);
  }, []);

  const transformUserDataToFormData = (user: UserData): UserFormData => {
    let groupHomeValue = '';
    if (user.group_home) {
      if (typeof user.group_home === 'object') {
        // Use ID or UUID if available, otherwise name
        groupHomeValue = String(user.group_home.uuid || user.group_home.name);
      } else {
        groupHomeValue = String(user.group_home);
      }
    } else if (user.groupHome) {
      groupHomeValue = user.groupHome;
    }

    // Role handling - try to get the most appropriate value for the dropdown
    // The form expects a value that matches one of the role options
    const roleValue = user.role?.name || user.role_type || '';

    return {
      uuid: user.uuid,
      username: user.username,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      email: user.email || '',
      phone: user.phone ? String(user.phone) : '',
      role: roleValue,
      groupHome: groupHomeValue,
      active: user.active,
      ssn: user.ssn || '',
      npi: user.npi || '',
      countryCode: user.country_code || '+1',
      profilePicture: user.avatar_url || (user as any).profile_picture || null,
      isPasswordSet: !!(user as any).isPasswordSet,
    };
  };

  const handleEdit = useCallback(() => {
    if (selectedRow) {
      const formData = transformUserDataToFormData(selectedRow);
      setUserToEdit(formData);
      setIsEditDrawerOpen(true);
    }
    handleMenuClose();
  }, [selectedRow, handleMenuClose]);

  const handleEditDrawerClose = useCallback(() => {
    setIsEditDrawerOpen(false);
    setUserToEdit(null);
  }, []);

  const handleEditSubmit = useCallback((_data: UserFormData) => {
    // The mutation is handled inside AddNewUserDrawer
    // We just need to close the drawer
    setIsEditDrawerOpen(false);
    setUserToEdit(null);
  }, []);

  const handleStatusChange = useCallback((user: UserData) => {
    const currentStatus = user.status?.toLowerCase() || (user.active ? 'active' : 'inactive');
    const isActive = currentStatus === 'active';
    const newActiveStatus = !isActive;

    changeStatusMutation.mutate({
      path: {
        uuid: user.uuid,
      },
      body: {
        active: newActiveStatus,
      },
    });
  }, [changeStatusMutation]);

  const handleDeactivate = useCallback(() => {
    if (selectedRow) {
      setUserToChange(selectedRow);
      setConfirmDialogOpen(true);
    }
    handleMenuClose();
  }, [selectedRow, handleMenuClose]);

  const handleConfirmStatusChange = useCallback(() => {
    if (userToChange && handleStatusChange) {
      handleStatusChange(userToChange);
    }
    setConfirmDialogOpen(false);
    setUserToChange(null);
  }, [userToChange, handleStatusChange]);

  const handleCancelStatusChange = useCallback(() => {
    setConfirmDialogOpen(false);
    setUserToChange(null);
  }, []);

  const getUserInitials = useCallback((firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || 'U';
  }, []);

  const getFullName = useCallback((firstName: string, lastName: string): string => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
  }, []);

  const extractUsersData = useMemo((): UserData[] => {
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
      let groupHomeName = '-';
      if (user.groupHome && typeof user.groupHome === 'string') {
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
        group_home: user.group_home,
      };
    }) as UserData[];
  }, [usersResponse]);

  useEffect(() => {
    if (!isLoading) {
      setTableData(extractUsersData);
    }
  }, [extractUsersData, isLoading]);

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
      totalElements: tableData.length,
      totalPages: Math.ceil(tableData.length / recordsPerPage),
      currentPage: 0,
      pageSize: recordsPerPage,
    };
  };

  const paginationInfo: PaginationInfo = getPaginationInfo();

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown> | null, page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRecordsPerPageChange = useCallback((newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(0);
  }, []);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          height: "100%",
        }}
      >
        <Paper
          sx={{
            overflow: "hidden",
            flex: 1,
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
          }}
        >
          <TableSkeleton
            headers={tableHeaders}
            rowCount={5}
            hasCheckbox={false}
            hasAvatar={true}
            hasActions={true}
          />
        </Paper>
      </Box>
    );
  }

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
          width: "100%",
          minWidth: 0,
        }}
      >
        <Paper
          sx={{
            overflow: "visible",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            width: "100%",
            minWidth: 0,
          }}
        >
          <TableContainer
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "auto",  // Always allow horizontal scroll when needed
              width: "100%",
              minWidth: 0,
              scrollbarWidth: "thin",
              msOverflowStyle: "auto",
              "&::-webkit-scrollbar": { 
                width: "8px",
                height: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#a8a8a8",
                },
              },
              "& .MuiTable-root": {
                borderCollapse: "separate",
                borderSpacing: 0,
                tableLayout: "auto",
                minWidth: {
                  xs: "700px",   // Mobile: compact layout
                  sm: "750px",   // Tablet: medium layout
                  md: "900px",   // Laptop: standard layout
                  lg: "1000px",  // Desktop: ensure all columns visible
                },
                width: "100%",
              },
              "& .MuiTableHead-root": {
                minWidth: {
                  xs: "700px",
                  sm: "750px",
                  md: "900px",
                  lg: "1000px",
                },
              },
              "& .MuiTableBody-root": {
                minWidth: {
                  xs: "700px",
                  sm: "750px",
                  md: "900px",
                  lg: "1000px",
                },
              },
              "& .MuiTableHead-root .MuiTableCell-root": {
                backgroundColor: "#F2F7FA",
                borderBottom: "1px solid #E3ECEF",
                color: "#30353A",
                boxSizing: "border-box",
                padding: { xs: "10px 12px !important", sm: "12px 16px !important", md: "12px 18px !important", lg: "12px 20px !important" },
                position: "sticky",
                top: 0,
                zIndex: 2,
                boxShadow: "0 1px 0 0 #E3ECEF",
              },
              "& .MuiTableBody-root .MuiTableRow-root": {
                "&:hover": {
                  backgroundColor: "rgba(67, 147, 34, 0.02)",
                },
              },
              "& .MuiTableBody-root .MuiTableCell-root": {
                borderBottom: "1px solid #F2F2F2",
                boxSizing: "border-box",
                padding: { xs: "10px 12px !important", sm: "12px 16px !important", md: "12px 18px !important", lg: "12px 20px !important" },
              },
            }}
          >
            <Table 
              aria-label="group home users table" 
              stickyHeader 
              sx={{ 
                ...tableCellCss, 
                width: "100%",
                minWidth: {
                  xs: "700px",
                  sm: "750px",
                  md: "900px",
                  lg: "1000px",
                },
                tableLayout: "auto",
              }}
            >
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => {
                    const { width, minWidth } = getHeaderStyles(header.id);
                    return (
                      <TableCell
                        key={header.id}
                        sx={{
                          ...heading,
                          width: width,
                          minWidth: minWidth,
                          ...(header.align && { textAlign: header.align }),
                        }}
                        align={header.align as "left" | "center" | "right" | "inherit" | "justify" | undefined}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13.5px" },
                            fontWeight: 600,
                            lineHeight: "1.2",
                            color: "#30353A !important",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            whiteSpace: "nowrap",
                            ...(header.align && { textAlign: header.align }),
                          }}
                        >
                          {header.label}
                        </Typography>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} align="center">
                      <Typography
                        sx={{
                          padding: "40px 0",
                          color: "#989998",
                          fontSize: "14px",
                        }}
                      >
                        No users available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((row) => {
                    const fullName = getFullName(row.first_name || '', row.last_name || '');
                    return (
                      <TableRow key={row.uuid}>
                        <TableCell sx={{ ...heading, ...getHeaderStyles('userName') }} align="left">
                          <Box display="flex" alignItems="center" gap={{ xs: "8px", sm: "10px", md: "12px" }}>
                            <Avatar
                              src={row.avatar_url ?? undefined}
                              slotProps={{
                                img: {
                                  loading: "lazy" as const,
                                },
                              }}
                              sx={{
                                width: { xs: 28, sm: 30, md: 32 },
                                height: { xs: 28, sm: 30, md: 32 },
                                borderRadius: "999px",
                                fontSize: { xs: "12px", sm: "13px", md: "14px" },
                                fontWeight: 500,
                              }}
                            >
                              {getUserInitials(row.first_name || '', row.last_name || '')}
                            </Avatar>
                            <Tooltip
                              title={fullName}
                              arrow
                              placement="top"
                            >
                              <Typography
                                sx={{
                                  ...primaryTextCss,
                                  cursor: fullName.length > 20 ? "pointer" : "default",
                                  textAlign: "left !important",
                                  fontSize: { xs: "12px", sm: "13px", md: "14px" },
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: { xs: "100px", sm: "120px", md: "140px", lg: "none" },
                                }}
                              >
                                {fullName}
                              </Typography>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ ...heading, ...getHeaderStyles('role') }} align="center">
                          <Typography sx={{ ...primaryTextCss, fontSize: { xs: "12px", sm: "13px", md: "14px" } }}>
                            {row.role?.name || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ ...heading, ...getHeaderStyles('phoneNumber') }} align="center">
                          <Typography sx={{ ...primaryTextCss, fontSize: { xs: "12px", sm: "13px", md: "14px" } }}>
                            {row.phone ? formatPhone(row.phone) : "-"}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ ...heading, ...getHeaderStyles('email') }} align="left">
                          <Tooltip
                            title={row.email && row.email.length > 40 ? row.email : ""}
                            arrow
                            placement="top"
                          >
                            <Typography
                              sx={{
                                ...primaryTextCss,
                                cursor: row.email && row.email.length > 40 ? "pointer" : "default",
                                textAlign: "left !important",
                                fontSize: { xs: "12px", sm: "13px", md: "14px" },
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: { xs: "180px", sm: "220px", md: "250px", lg: "280px" },
                              }}
                            >
                              {row.email || "-"}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            ...getHeaderStyles('status'),
                            borderBottom: '1px solid #E7E9EB',
                          }}
                        >
                          {(() => {
                            const status = row.status || (row.active ? 'Active' : 'Inactive');
                            const statusColors = getStatusColors(status);
                            return (
                              <Chip
                                label={status}
                                sx={{
                                  backgroundColor: statusColors.bg,
                                  color: statusColors.color,
                                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                  fontSize: { xs: "11px", sm: "12px" },
                                  fontWeight: 500,
                                  height: { xs: "22px", sm: "24px" },
                                  borderRadius: '6px',
                                  '& .MuiChip-label': {
                                    padding: { xs: '0 6px', sm: '0 8px' },
                                  },
                                }}
                              />
                            );
                          })()}
                        </TableCell>

                        <TableCell sx={{ ...heading, ...getHeaderStyles('action') }} align="center">
                          <IconButton
                            onClick={(event) => handleMenuClick(event, row)}
                            sx={{
                              padding: "4px",
                              borderRadius: "6px",
                              "&:hover": {
                                backgroundColor: "rgba(67, 147, 34, 0.04)",
                              },
                            }}
                          >
                            <MoreVertIcon
                              sx={{
                                width: { xs: 16, sm: 18 },
                                height: { xs: 16, sm: 18 },
                                color: "#2C2D2C",
                              }}
                            />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DFE5E2",
                  borderRadius: "6px",
                  boxShadow: "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
                  padding: "6px 0",
                  minWidth: "120px",
                  width: "max-content",
                },
              },
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <Tooltip
  title={canEditUser ? "" : "You don't have permission"}
  placement="left"
  arrow
>
  <span>
    <MenuItem
      onClick={handleEdit}
      disabled={!canEditUser}
      sx={{
        padding: "10px 14px",
        gap: "8px",
        "&:hover": {
          backgroundColor: "rgba(67, 147, 34, 0.04)",
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: "18px" }}>
        <EditOutlinedIcon
          sx={{
            width: 18,
            height: 18,
            color: canEditUser ? "#2C2D2C" : "#B0B0B0",
          }}
        />
      </ListItemIcon>
      <ListItemText
        primary="Edit"
        slotProps={{
          primary: {
            sx: {
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "1.15",
              color: canEditUser ? "#2C2D2C" : "#B0B0B0",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            },
          },
        }}
      />
    </MenuItem>
  </span>
</Tooltip>
            {(() => {
              const currentStatus = selectedRow?.status?.toLowerCase() || (selectedRow?.active ? 'active' : 'inactive');
              const isActive = currentStatus === 'active';
              const menuLabel = isActive ? 'Deactivate' : 'Activate';

              return (
             <Tooltip
  title={canDeactivateUser ? "" : "You don't have permission"}
  placement="left"
  arrow
>
  <span>
    <MenuItem
      onClick={handleDeactivate}
      disabled={!canDeactivateUser}
      sx={{
        padding: "10px 14px",
        gap: "8px",
        "&:hover": {
          backgroundColor: "rgba(67, 147, 34, 0.04)",
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: "18px" }}>
        <BlockIcon
          sx={{
            width: 18,
            height: 18,
            color: canDeactivateUser ? "#2C2D2C" : "#B0B0B0",
          }}
        />
      </ListItemIcon>
      <ListItemText
        primary={menuLabel}
        slotProps={{
          primary: {
            sx: {
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: "1.15",
              color: canDeactivateUser ? "#2C2D2C" : "#B0B0B0",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            },
          },
        }}
      />
    </MenuItem>
  </span>
</Tooltip>
              );
            })()}
          </Menu>

          <ConfirmationPopUp
            open={confirmDialogOpen}
            onClose={handleCancelStatusChange}
            onConfirm={handleConfirmStatusChange}
            message={
              userToChange
                ? `Are you sure you want to ${(userToChange.status?.toLowerCase() || (userToChange.active ? 'active' : 'inactive')) === 'active'
                  ? 'deactivate'
                  : 'activate'
                } ${userToChange.first_name || ''} ${userToChange.last_name || ''}?`
                : 'Are you sure you want to change the user status?'
            }
          />
        </Paper>
      </Box>

      {!isLoading && (
        <Box
          sx={{
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
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

      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />

      {isEditDrawerOpen && (
        <AddNewUserDrawer
          open={isEditDrawerOpen}
          isEdit={true}
          initialData={userToEdit || undefined}
          onClose={handleEditDrawerClose}
          onSubmit={handleEditSubmit}
          disableGroupHome={!!groupHomeUuid || !!userToEdit?.groupHome}
          isPasswordSet={!!userToEdit?.isPasswordSet}
        />
      )}
    </Box>
  );
};

export default React.memo(GroupHomeUsersTable);













