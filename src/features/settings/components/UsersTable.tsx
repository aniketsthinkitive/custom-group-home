import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Grid,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import LinkIcon from '@mui/icons-material/Link';
import {
  heading,
  tableCellCss,
  primaryTextCss,
} from '../../../components/common-table/widgets/common-table-widgets';
import TableSkeleton from '../../../components/common-table/TableSkeleton';
import { formatPhone } from '../../../utils';
import type { User } from '../../../sdk/types.gen';
import ConfirmationPopUp from '../../../components/confirmation-pop-up/confirmation-pop-up';
import { OverflowTooltip } from '../../../components/overflow-tooltip';
import { usePermission } from '../../../hooks/usePermission';
import DeleteBlockerModal, { type Blocker } from '../../../components/DeleteBlockerModal';
import { canDeleteUser } from '../../group_home/api';

export interface UserData extends User {
  groupHome?: string;
  status?: string;
  isPasswordSet?: boolean;
}

interface UsersTableProps {
  data?: UserData[];
  loading?: boolean;
  canUpdate?: boolean;
  onEdit?: (user: UserData) => void;
  onDeactivate?: (user: UserData) => void;
  onResendLink?: (user: UserData) => void;
  hideGroupHomeColumn?: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({
  data = [],
  loading = false,
  canUpdate = true,
  onEdit,
  onDeactivate,
  onResendLink,
  hideGroupHomeColumn = false,
}) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canEditUser = hasPermission('users.edit');
  const canDeactivateUser = hasPermission('users.deactivate');
  const [tableData, setTableData] = useState<UserData[]>(data);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<UserData | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToChange, setUserToChange] = useState<UserData | null>(null);

  // Pre-flight blocker modal state — surfaces active assignments / open
  // incidents that must be resolved before deactivating a user.
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [blockerOpen, setBlockerOpen] = useState(false);

  const TruncatedText: React.FC<{
    text: string;
    sx?: React.ComponentProps<typeof Typography>["sx"];
  }> = ({ text, sx }) => {
    const ref = React.useRef<HTMLSpanElement | null>(null);
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (el) {
        setOverflow(el.scrollWidth > el.clientWidth);
      }
    }, [text]);
    const content = (
      <Typography component="span" ref={ref} sx={sx}>
        {text || "-"}
      </Typography>
    );
    return overflow ? (
      <Tooltip title={text || "-"} arrow placement="top">
        {content}
      </Tooltip>
    ) : (
      content
    );
  };

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
      width: { xs: '160px', sm: '180px', md: '200px', lg: '200px' },
      minWidth: { xs: '150px', sm: '170px', md: '190px', lg: '200px' },
      align: 'left' 
    },
    ...(hideGroupHomeColumn ? [] : [{ 
      id: 'groupHome', 
      label: 'Group Home', 
      width: { xs: '160px', sm: '180px', md: '200px', lg: '200px' },
      minWidth: { xs: '150px', sm: '170px', md: '190px', lg: '200px' },
      align: 'left' 
    }]),
    { 
      id: 'role', 
      label: 'Role', 
      width: { xs: '140px', sm: '160px', md: '180px', lg: '180px' },
      minWidth: { xs: '130px', sm: '150px', md: '170px', lg: '180px' },
      align: 'left' 
    },
    { 
      id: 'phoneNumber', 
      label: 'Phone Number', 
      width: { xs: '120px', sm: '135px', md: '150px', lg: '150px' },
      minWidth: { xs: '110px', sm: '125px', md: '140px', lg: '150px' },
      align: 'center' 
    },
    {
      id: 'email',
      label: 'Email',
      width: { xs: '160px', sm: '180px', md: '200px', lg: '200px' },
      minWidth: { xs: '150px', sm: '170px', md: '190px', lg: '200px' },
      align: 'left'
    },
    {
      id: 'emailVerified',
      label: 'Email Verified',
      width: { xs: '110px', sm: '120px', md: '130px', lg: '130px' },
      minWidth: { xs: '100px', sm: '110px', md: '120px', lg: '130px' },
      align: 'center'
    },
    {
      id: 'status',
      label: 'Status',
      width: { xs: '100px', sm: '110px', md: '120px', lg: '120px' },
      minWidth: { xs: '90px', sm: '100px', md: '110px', lg: '120px' },
      align: 'center'
    },
    { 
      id: 'action', 
      label: 'Action', 
      width: { xs: '60px', sm: '66px', md: '72px', lg: '72px' },
      minWidth: { xs: '50px', sm: '60px', md: '72px', lg: '72px' },
      align: 'center' 
    },
  ];

  const getStatusColors = (status: string | undefined): { bg: string; color: string } => {
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
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, row: UserData) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleEdit = () => {
    if (selectedRow && onEdit) {
      onEdit(selectedRow);
    }
    handleMenuClose();
  };

  const handleDeactivate = async () => {
    if (!selectedRow) {
      handleMenuClose();
      return;
    }
    const row = selectedRow;
    handleMenuClose();

    // Only pre-flight when transitioning from active -> inactive. Activation
    // never has blockers.
    const currentStatus =
      row.status?.toLowerCase() || (row.active ? 'active' : 'inactive');
    const isCurrentlyActive = currentStatus === 'active';
    if (isCurrentlyActive && row.uuid) {
      try {
        const result = await canDeleteUser(row.uuid);
        if (!result.can_delete) {
          setBlockers(result.blockers ?? []);
          setBlockerOpen(true);
          return;
        }
      } catch {
        // Network or unexpected error — let the destructive call surface it.
      }
    }

    setUserToChange(row);
    setConfirmDialogOpen(true);
  };

  const handleResendLink = () => {
    if (selectedRow && onResendLink) {
      onResendLink(selectedRow);
    }
    handleMenuClose();
  };

  const handleConfirmStatusChange = () => {
    if (userToChange && onDeactivate) {
      onDeactivate(userToChange);
    }
    setConfirmDialogOpen(false);
    setUserToChange(null);
  };

  const handleCancelStatusChange = () => {
    setConfirmDialogOpen(false);
    setUserToChange(null);
  };

  useEffect(() => {
    if (!loading) {
      setTableData(data);
    }
  }, [data, loading]);

  const getUserInitials = (firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || 'U';
  };

  const getFullName = (firstName: string, lastName: string): string => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown User';
  };

  // Helper function to get header width and minWidth by id
  const getHeaderStyles = (id: string) => {
    const header = tableHeaders.find((h) => h.id === id);
    if (!header) return {};
    return {
      width: typeof header.width === 'object' ? header.width : header.width,
      minWidth: typeof header.minWidth === 'object' ? header.minWidth : header.minWidth || header.width,
    };
  };

  // Avatar component with loading state
  const AvatarWithLoading: React.FC<{
    src?: string;
    initials: string;
    size?: number;
  }> = ({ src, initials, size = 32 }) => {
    const [imageLoading, setImageLoading] = useState<boolean>(!!src);
    const [imageError, setImageError] = useState<boolean>(false);

    return (
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
        }}
      >
        {imageLoading && !imageError && src && (
          <CircularProgress
            size={size}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )}
        <Avatar
          src={src && !imageError ? src : undefined}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            setImageError(true);
          }}
          onLoadStart={() => {
            if (src) {
              setImageLoading(true);
              setImageError(false);
            }
          }}
          sx={{
            width: size,
            height: size,
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 500,
            display: imageLoading ? 'none' : 'flex',
          }}
        >
          {initials}
        </Avatar>
      </Box>
    );
  };

  if (loading) {
    return (
      <Paper sx={{ overflow: 'hidden' }}>
        <TableSkeleton
          headers={tableHeaders}
          rowCount={5}
          hasCheckbox={false}
          hasAvatar={true}
          hasActions={true}
        />
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: "hidden", height: "100%",border: "1px solid #E3ECEF",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF", }}>
      <TableContainer
        sx={{
          height: "100%",
          overflowY: "auto",
          overflowX: "auto", // Enable horizontal scrolling when needed
          width: "100%",
          maxWidth: "100%",
          position: "relative",
          // Enable touch scrolling on mobile devices
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",

          // ✅ Scrollbar styling - show scrollbars when needed
          scrollbarWidth: "thin",
          scrollbarColor: "#D1D5DB #F3F4F6",
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
            display: "block",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#F3F4F6",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#D1D5DB",
            borderRadius: "3px",
            "&:hover": {
              backgroundColor: "#9CA3AF",
            },
          },
          backgroundColor: "#FFFFFF",
          "& .MuiTable-root": {
            borderCollapse: "separate",
            borderSpacing: 0,
            width: "100%", // Table takes full width of container
            // Calculate minimum width based on breakpoints for horizontal scroll
            // Mobile (with groupHome): 150 + 150 + 130 + 110 + 150 + 90 + 50 = 830px
            // Mobile (without groupHome): 150 + 130 + 110 + 150 + 90 + 50 = 680px
            // Tablet (with groupHome): 170 + 170 + 150 + 125 + 170 + 100 + 60 = 945px
            // Tablet (without groupHome): 170 + 150 + 125 + 170 + 100 + 60 = 775px
            // Laptop (with groupHome): 190 + 190 + 170 + 140 + 190 + 110 + 72 = 1062px
            // Laptop (without groupHome): 190 + 170 + 140 + 190 + 110 + 72 = 872px
            // Desktop (with groupHome): 200 + 200 + 180 + 150 + 200 + 120 + 72 = 1122px
            // Desktop (without groupHome): 200 + 180 + 150 + 200 + 120 + 72 = 922px
            minWidth: hideGroupHomeColumn 
              ? {
                  xs: "680px",
                  sm: "775px",
                  md: "872px",
                  lg: "922px",
                }
              : {
                  xs: "830px",
                  sm: "945px",
                  md: "1062px",
                  lg: "1122px",
                },
            display: "table",
            flexShrink: 0,
          },

          // STICKY HEADER
          "& .MuiTableHead-root .MuiTableCell-root": {
            height: { xs: "40px", sm: "42px", md: "44px" },
            padding: { 
              xs: "8px 8px",      // Mobile: compact padding
              sm: "8px 12px",     // Tablet: medium padding
              md: "8px 14px",     // Laptop: standard padding
              lg: "12px 20px"     // Desktop: full padding
            },
            backgroundColor: "#F2F7FA !important",
            borderBottom: "1px solid #E3ECEF",
            color: "#30353A",
            position: "sticky",
            top: 0,
            zIndex: 10,
            whiteSpace: "nowrap", // Prevent text wrapping in headers
            boxSizing: "border-box",
            flexShrink: 0,
          },
          "& .MuiTableHead-root .MuiTableRow-root .MuiTableCell-root:first-of-type":
            {
              paddingLeft: { xs: "8px", sm: "12px", md: "14px", lg: "20px" },
            },
          "& .MuiTableHead-root .MuiTableRow-root .MuiTableCell-root:last-of-type":
            {
              paddingRight: { xs: "8px", sm: "12px", md: "14px", lg: "20px" },
              overflow: "visible",
            },

          // BODY ROWS
          "& .MuiTableBody-root .MuiTableRow-root": {
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.01)", // very subtle like screenshot
            },
          },
          "& .MuiTableBody-root .MuiTableCell-root": {
            borderBottom: "1px solid #EEF1F4",
            padding: { 
              xs: "8px 8px",      // Mobile: compact padding
              sm: "8px 12px",     // Tablet: medium padding
              md: "8px 14px",     // Laptop: standard padding
              lg: "12px 20px"     // Desktop: full padding
            },
            fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" },
            color: "#101828",
            whiteSpace: "nowrap", // Prevent text wrapping in cells
            boxSizing: "border-box",
            minWidth: "fit-content",
          },
          "& .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:first-of-type":
            {
              paddingLeft: { xs: "8px", sm: "12px", md: "14px", lg: "20px" },
            },
          "& .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:last-of-type":
            {
              paddingRight: { xs: "8px", sm: "12px", md: "14px", lg: "20px" },
            },
        }}
      >
        <Table aria-label="users table" stickyHeader sx={{ ...tableCellCss, tableLayout: "auto", width: "100%" }}>
          <TableHead>
            <TableRow sx={{ height: { xs: 40, sm: 42, md: 44 } }}>
              {tableHeaders.map((header) => {
                // Handle responsive width and minWidth
                const width = typeof header.width === 'object' 
                  ? header.width 
                  : header.width;
                const minWidth = typeof header.minWidth === 'object' 
                  ? header.minWidth 
                  : header.minWidth || header.width;

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
                const fullName = getFullName(row.first_name, row.last_name);

                return (
                  <TableRow key={row.uuid}>
                    <TableCell sx={getHeaderStyles("userName")} align="left">
                      <Box display="flex" alignItems="center" gap="12px">
                        <AvatarWithLoading
                          src={row.avatar_url}
                          initials={getUserInitials(
                            row.first_name,
                            row.last_name,
                          )}
                          size={32}
                        />
                        <Tooltip title={fullName} arrow placement="top">
                          <Grid
                            component="a"
                            href={`/admin/user-details/${row.uuid}`}
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                              e.preventDefault();
                              navigate(`/admin/user-details/${row.uuid}`);
                            }}
                            aria-label={`Open user profile for ${fullName}`}
                            sx={{
                              ...primaryTextCss,
                              cursor: "pointer",
                              textDecoration: "none",
                              textAlign: "left",
                              color: "#11466D",
                              fontSize: "14px",
                              fontWeight: 500,
                              display: "block",
                              "&:hover": {
                                color: "#0A2E45",
                                textDecoration: "underline",
                              },
                              "&:focus-visible": {
                                outline: "2px solid #11466D",
                                outlineOffset: "2px",
                                borderRadius: "2px",
                              },
                            }}
                          >
                            {fullName.length > 20
                              ? `${fullName.substring(0, 20)}...`
                              : fullName}
                          </Grid>
                        </Tooltip>
                      </Box>
                    </TableCell>

                    {!hideGroupHomeColumn && (
                      <TableCell
                        sx={getHeaderStyles("groupHome")}
                        align="left"
                      >
                        <Box sx={{ minWidth: 0, width: "100%" }}>
                          <OverflowTooltip
                            text={row.groupHome || "-"}
                            sx={{
                              ...primaryTextCss,
                              textAlign: "left !important",
                              maxWidth: getHeaderStyles("groupHome").width,
                            }}
                          />
                        </Box>
                      </TableCell>
                    )}

                    <TableCell sx={getHeaderStyles("role")} align="left">
                      <Typography sx={primaryTextCss}>
                        {row.role?.name === "Agent" ? "Area Agency" : (row.role?.name || "-")}
                      </Typography>
                    </TableCell>

                    <TableCell sx={getHeaderStyles("phoneNumber")} align="center">
                      <Typography sx={primaryTextCss}>
                        {row.phone ? formatPhone(row.phone) : "-"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={getHeaderStyles("email")} align="left">
                      <Tooltip
                        title={row.email?.length > 25 ? row.email : ""}
                        arrow
                        placement="top"
                      >
                        <Typography
                          sx={{
                            ...primaryTextCss,
                            cursor:
                              row.email?.length > 25 ? "pointer" : "default",
                            textAlign: "left !important",
                          }}
                        >
                          {row.email?.length > 25
                            ? `${row.email.substring(0, 25)}...`
                            : row.email || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...getHeaderStyles("emailVerified"),
                        borderBottom: "1px solid #E7E9EB",
                      }}
                      align="center"
                    >
                      {(() => {
                        const isVerified = row.isPasswordSet === true;
                        const label = isVerified ? "Verified" : "Not Verified";
                        const colors = isVerified
                          ? { bg: "#E6F4EA", color: "#137333" }
                          : { bg: "#FCE8E6", color: "#C5221F" };
                        return (
                          <Chip
                            label={label}
                            sx={{
                              backgroundColor: colors.bg,
                              color: colors.color,
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                              fontSize: "12px",
                              fontWeight: 500,
                              height: "24px",
                              borderRadius: "6px",
                              "& .MuiChip-label": {
                                padding: "0 8px",
                              },
                            }}
                          />
                        );
                      })()}
                    </TableCell>

                    <TableCell
                      sx={{
                        ...getHeaderStyles("status"),
                        borderBottom: "1px solid #E7E9EB",
                      }}
                      align="center"
                    >
                      {(() => {
                        const status =
                          row.status || (row.active ? "Active" : "Inactive");
                        const statusColors = getStatusColors(status);
                        return (
                          <Chip
                            label={status}
                            sx={{
                              backgroundColor: statusColors.bg,
                              color: statusColors.color,
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                              fontSize: "12px",
                              fontWeight: 500,
                              height: "24px",
                              borderRadius: "6px",
                              "& .MuiChip-label": {
                                padding: "0 8px",
                              },
                            }}
                          />
                        );
                      })()}
                    </TableCell>

                    <TableCell sx={getHeaderStyles("action")} align="center">
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
                            width: 18,
                            height: 18,
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
              padding: "4px 0",
              minWidth: "120px",
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
        {/* Edit Menu Item */}
        <Tooltip title={canEditUser ? '' : "You don't have permission"} placement="left" arrow>
          <span>
            <MenuItem
              onClick={handleEdit}
              disabled={!canEditUser}
              sx={{
                padding: "10px 14px",
                gap: "8px",
                "&:hover": {
                  backgroundColor: canEditUser ? "rgba(67, 147, 34, 0.04)" : undefined,
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

        {/* Resend Link Menu Item - Only show when isPasswordSet is false */}
        {selectedRow && selectedRow.isPasswordSet === false && (
          <Tooltip
            title={canEditUser ? '' : "You don't have permission"}
            placement="left"
            arrow
          >
            <span>
              <MenuItem
                onClick={handleResendLink}
                disabled={!canEditUser}
                sx={{
                  padding: "10px 14px",
                  gap: "8px",
                  "&:hover": {
                    backgroundColor: canEditUser ? "rgba(67, 147, 34, 0.04)" : undefined,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: "18px" }}>
                  <LinkIcon
                    sx={{
                      width: 18,
                      height: 18,
                      color: canEditUser ? "#2C2D2C" : "#B0B0B0",
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Resend Link"
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
        )}

        {/* Activate/Deactivate User Menu Item */}
        {(() => {
          const currentStatus = selectedRow?.status?.toLowerCase() || (selectedRow?.active ? 'active' : 'inactive');
          const isActive = currentStatus === 'active';
          const menuLabel = isActive ? 'Deactivate' : 'Activate';

          return (
            <Tooltip title={canDeactivateUser ? '' : "You don't have permission"} placement="left" arrow>
              <span>
                <MenuItem
                  onClick={handleDeactivate}
                  disabled={!canDeactivateUser}
                  sx={{
                    padding: "10px 14px",
                    gap: "8px",
                    "&:hover": {
                      backgroundColor: canDeactivateUser ? "rgba(67, 147, 34, 0.04)" : undefined,
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

      {/* Confirmation Popup for Status Change */}
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

      {/* Pre-flight blocker modal — shown when the user has active
          assignments or open incidents and cannot be deactivated yet. */}
      <DeleteBlockerModal
        open={blockerOpen}
        onClose={() => {
          setBlockerOpen(false);
          setBlockers([]);
        }}
        blockers={blockers}
      />
    </Paper>
  );
};

export default UsersTable;
