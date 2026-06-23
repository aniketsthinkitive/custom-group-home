import React, { useState, useCallback, useMemo } from 'react';
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
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
  Grid,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { rejectReferralMutation } from '../../../sdk/@tanstack/react-query.gen';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import { invalidateLeadsList, optimisticallyUpdateLeadStatus } from '../utils/queryInvalidation';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomDialog from '../../../components/custom-dialog/custom-dialog';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomLabel from '../../../components/custom-label/custom-label';
import {
  heading,
  tableCellCss,
  primaryTextCss,
} from '../../../components/common-table/widgets/common-table-widgets';
import TableSkeleton from '../../../components/common-table/TableSkeleton';
import { Lead } from '../leads.types';
import LeadStatusChip from './LeadStatusChip';
import { formatDateTimeWith12Hour } from '../../../utils';
import { usePermission } from '../../../hooks/usePermission';

export type LeadData = Lead;

interface LeadsTableProps {
  data?: LeadData[];
  loading?: boolean;
  onViewProfile?: (lead: LeadData) => void;
  onReject?: (lead: LeadData) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  data = [],
  loading = false,
  onViewProfile,
  onReject, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const canEditLead = hasPermission("leads.edit");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<LeadData | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; status: 'success' | 'error' }>({
    open: false,
    message: '',
    status: 'success',
  });
  const [avatarErrorIds, setAvatarErrorIds] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  // Helper function to extract backend message from response
  const getBackendMessage = (response: unknown): string | undefined => {
    const data = response as { message?: string; data?: { message?: string } } | undefined;
    return data?.message ?? data?.data?.message ?? undefined;
  };

  const rejectReferral = useMutation({
    ...(rejectReferralMutation() as any),

    onSuccess: (data: unknown, variables: any) => {
      const backendMessage = getBackendMessage(data);

      // Store selectedRow before resetting state
      const rejectedLeadId = selectedRow?.referralId;

      // Close modal & reset state
      setRejectModalOpen(false);
      setRejectionReason('');
      setRejectionError(null);
      setSelectedRow(null);

      // Optimistically update the lead status in cache for instant UI feedback
      if (rejectedLeadId) {
        optimisticallyUpdateLeadStatus(queryClient, rejectedLeadId, 'REJECTED');
      }

      // Invalidate queries to ensure data consistency
      invalidateLeadsList(queryClient);

      if (backendMessage) {
        setSnackbar({
          open: true,
          message: backendMessage,
          status: 'success',
        });
      }
    },

    onError: (error: any) => {
      const errorData = error?.response?.data as { message?: string; detail?: string; reason?: string[] } | undefined;
      const errorMessage = errorData?.message || errorData?.detail || (errorData?.reason ? errorData.reason[0] : undefined);

      if (errorData?.reason) {
        setRejectionError(errorData.reason[0]);
      }

      if (errorMessage) {
        setSnackbar({
          open: true,
          message: errorMessage,
          status: 'error',
        });
      }
    },
  });


  // Memoize table headers with responsive widths for different screen sizes
  // Breakpoints:
  // - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
  // - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
  // - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
  // - Desktop (lg): >= 1280px - Full widths, fits within container
  // Table width is 100% of container, with minWidth set per breakpoint for horizontal scrolling
  const tableHeaders = useMemo(() => [
    { 
      id: 'referralId', 
      label: 'Referral ID', 
      width: { xs: '120px', sm: '130px', md: '140px', lg: '147px' },
      minWidth: { xs: '100px', sm: '120px', md: '130px', lg: '147px' },
      align: 'left' 
    },
    { 
      id: 'fullName', 
      label: 'Full Name', 
      width: { xs: '200px', sm: '250px', md: '280px', lg: '308px' },
      minWidth: { xs: '180px', sm: '220px', md: '250px', lg: '308px' },
      align: 'left' 
    },
    { 
      id: 'referralSource', 
      label: 'Referral Source', 
      width: { xs: '150px', sm: '180px', md: '210px', lg: '240px' },
      minWidth: { xs: '130px', sm: '160px', md: '180px', lg: '240px' },
      align: 'left' 
    },
    { 
      id: 'insurance', 
      label: 'Insurance', 
      width: { xs: '130px', sm: '160px', md: '185px', lg: '210px' },
      minWidth: { xs: '110px', sm: '140px', md: '165px', lg: '210px' },
      align: 'left' 
    },
    { 
      id: 'status', 
      label: 'Status', 
      width: { xs: '120px', sm: '140px', md: '160px', lg: '180px' },
      minWidth: { xs: '100px', sm: '120px', md: '140px', lg: '180px' },
      align: 'left' 
    },
    { 
      id: 'lastUpdated', 
      label: 'Last Updated', 
      width: { xs: '150px', sm: '170px', md: '190px', lg: '210px' },
      minWidth: { xs: '130px', sm: '150px', md: '170px', lg: '210px' },
      align: 'left' 
    },
    { 
      id: 'action', 
      label: 'Action', 
      width: { xs: '64px', sm: '64px', md: '64px', lg: '64px' },
      minWidth: { xs: '64px', sm: '64px', md: '64px', lg: '64px' },
      align: 'center' 
    },
  ], []);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, row: LeadData) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedRow(null);
  }, []);

  const handleViewProfile = useCallback(() => {
    if (selectedRow && onViewProfile) {
      onViewProfile(selectedRow);
    }
    handleMenuClose();
  }, [selectedRow, onViewProfile, handleMenuClose]);

  const handleReject = useCallback(() => {
    // Close the menu but preserve selectedRow for the dialog
    setAnchorEl(null);
    setRejectModalOpen(true);
  }, []);

  const isRejectDisabled = useMemo(() =>
    selectedRow?.status === 'Rejected' ||
    selectedRow?.status === 'Completed',
    [selectedRow?.status]
  );

  const handleRejectConfirm = useCallback(() => {
    // Prevent duplicate calls
    if (!selectedRow || rejectReferral.isPending) return;

    if (!rejectionReason.trim()) {
      setRejectionError('Reason for Rejection is required');
      return;
    }

    rejectReferral.mutate({
      path: {
        uuid: selectedRow.referralId,
      },
      body: {
        reason: rejectionReason,
      },
    } as any);
  }, [selectedRow, rejectionReason, rejectReferral]);

  const handleRejectCancel = useCallback(() => {
    setRejectModalOpen(false);
    setRejectionReason('');
    setRejectionError(null);
    setSelectedRow(null);
  }, []);

  const getLeadInitials = useCallback((fullName: string): string => {
    const names = fullName.split(' ');
    const first = names[0]?.charAt(0)?.toUpperCase() || '';
    const last = names[1]?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}` || 'L';
  }, []);

  // Memoize avatar error handler to prevent new function on every render
  const handleAvatarError = useCallback((rowId: string) => {
    setAvatarErrorIds((prev) => new Set(prev).add(rowId));
  }, []);

  // Memoize snackbar close handler
  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);



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
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        borderRadius: "8px",
        border: "1px solid #DEE4ED",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: 0,
      }}
    >
      <TableContainer
        sx={{
          height: "100%",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "auto", // Enable horizontal scrolling when needed
          width: "100%",
          maxWidth: "100%",

          // ✅ Scrollbar styling - show scrollbars when needed
          scrollbarWidth: "thin",
          scrollbarColor: "#D1D5DB #F3F4F6",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
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

          "& .MuiTable-root": {
            borderCollapse: "separate",
            borderBottom: "1px solid #ECEFF4",
            borderSpacing: 0,
            width: "100%", // Table takes full width of container
            // Calculate minimum width based on breakpoints for horizontal scroll
            // Mobile: 100 + 180 + 130 + 110 + 100 + 130 + 64 = 814px
            // Tablet: 120 + 220 + 160 + 140 + 120 + 150 + 64 = 974px
            // Laptop: 130 + 250 + 180 + 165 + 140 + 170 + 64 = 1099px
            // Desktop: 147 + 308 + 240 + 210 + 180 + 210 + 64 = 1359px
            minWidth: {
              xs: "814px",   // Mobile: < 600px
              sm: "974px",   // Tablet: 600px - 959px
              md: "1099px",  // Laptop: 960px - 1279px
              lg: "1359px",  // Desktop: >= 1280px
            },
          },
          "& .MuiTableHead-root .MuiTableCell-root": {
            height: { xs: "40px", sm: "42px", md: "44px" },
            padding: { 
              xs: "8px 8px",      // Mobile: compact padding
              sm: "8px 12px",     // Tablet: medium padding
              md: "8px 14px",     // Laptop: standard padding
              lg: "8px 16px"      // Desktop: full padding
            },
            backgroundColor: "#F2F7FA !important",
            color: "#30353A",
            position: "sticky",
            borderBottom: "1px solid #E3ECEF",
            top: 0,
            zIndex: 10,
            whiteSpace: "nowrap", // Prevent text wrapping in headers
          },
          "& .MuiTableHead-root .MuiTableCell-root:last-of-type": {
            overflow: "hidden",
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
          },
          "& .MuiTableHead-root .MuiTableCell-root:first-of-type": {
            borderBottomLeftRadius: 0,
          },
          "& .MuiTableBody-root": {
            "& .MuiTableRow-root": {
              "&:hover": {
                backgroundColor: "rgba(0,0,0,0.01)",
              },
            },
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #ECEFF4",
              verticalAlign: "middle",
              padding: { 
                xs: "8px 8px",      // Mobile: compact padding
                sm: "8px 12px",     // Tablet: medium padding
                md: "8px 14px",     // Laptop: standard padding
                lg: "8px 16px"      // Desktop: full padding
              },
              whiteSpace: "nowrap", // Prevent text wrapping in cells
            },
          },
        }}
      >
        <Table stickyHeader aria-label="leads table" sx={tableCellCss}>
          <TableHead>
            <TableRow>
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
                    align={
                      header.align as
                        | "left"
                        | "center"
                        | "right"
                        | "inherit"
                        | "justify"
                        | undefined
                    }
                  >
                  <Typography
                    sx={{
                      fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13.5px" },
                      fontWeight: 600,
                      lineHeight: "1.2",
                      color: "#30353A",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
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
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableHeaders.length}
                  sx={{
                    textAlign: "center",
                    verticalAlign: "middle",
                    borderBottom: "none",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.5,
                      height: "100%",
                      padding: "30px",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#989998",
                        fontSize: "16px",
                        fontWeight: 500,
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                      }}
                    >
                      No leads available
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell
                    sx={{ ...heading, textAlign: "left !important" }}
                    align="left"
                  >
                    <Typography sx={primaryTextCss}>
                      {row.referral_number}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{ ...heading, textAlign: "left !important" }}
                    align="left"
                  >
                    <Box display="flex" alignItems="center" gap={{ xs: "8px", sm: "10px", md: "12px" }}>
                      <Avatar
                        src={
                          row.avatar && !avatarErrorIds.has(row.id)
                            ? row.avatar
                            : undefined
                        }
                        sx={{
                          width: { xs: 28, sm: 30, md: 32 },
                          height: { xs: 28, sm: 30, md: 32 },
                          borderRadius: "999px",
                          textAlign: "left !important",
                          fontSize: { xs: "12px", sm: "13px", md: "14px" },
                          fontWeight: 500,
                        }}
                        imgProps={{
                          referrerPolicy: "no-referrer",
                          onError: () => handleAvatarError(row.id),
                        }}
                      >
                        {!row.avatar || avatarErrorIds.has(row.id)
                          ? getLeadInitials(row.fullName)
                          : null}
                      </Avatar>
                      <Tooltip title={row.fullName} arrow placement="top">
                        <Grid
                          component="a"
                          href={`/admin/leads/${row.referralId}`}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            navigate(`/admin/leads/${row.referralId}`);
                          }}
                          aria-label={`Open lead profile for ${row.fullName}`}
                          sx={{
                            ...primaryTextCss,
                            cursor: "pointer",
                            textDecoration: "none",
                            textAlign: "left",
                            color: "#11466D",
                            fontSize: { xs: "12px", sm: "13px", md: "14px" },
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: { xs: "120px", sm: "180px", md: "220px" },
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
                          {row.fullName}
                        </Grid>
                      </Tooltip>
                    </Box>
                  </TableCell>

                  <TableCell
                    sx={{ ...heading, textAlign: "left !important" }}
                    align="left"
                  >
                    <Typography sx={primaryTextCss}>
                      {row.referralSource || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{ ...heading, textAlign: "left !important" }}
                    align="left"
                  >
                    <Typography sx={primaryTextCss}>
                      {row.insurance || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{ ...heading, textAlign: "left !important" }}
                    align="left"
                  >
                    <LeadStatusChip status={row.status} size="small" />
                  </TableCell>

                  <TableCell
                    sx={{ ...heading, textAlign: "left !important" }}
                    align="left"
                  >
                    <Typography sx={primaryTextCss}>
                      {formatDateTimeWith12Hour(row.lastUpdated)}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ ...heading }} align="center">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
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
                    </Box>
                  </TableCell>
                </TableRow>
              ))
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
              boxShadow:
                "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
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
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            if (selectedRow) {
              navigate(`/admin/leads/${selectedRow.referralId}`);
            }
            handleMenuClose();
          }}
          sx={{
            padding: "10px 14px",
            gap: "8px",
            "&:hover": {
              backgroundColor: "rgba(67, 147, 34, 0.04)",
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: "18px" }}>
            <VisibilityIcon
              sx={{
                width: 18,
                height: 18,
                color: "#2C2D2C",
              }}
            />
          </ListItemIcon>

          <ListItemText
            primary="View Profile"
            slotProps={{
              primary: {
                sx: {
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "1.15",
                  color: "#2C2D2C",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                },
              },
            }}
          />
        </MenuItem>

        <Tooltip title={!canEditLead ? "You don't have permission" : ""} placement="left" arrow>
          <span>
            <MenuItem
              onClick={handleReject}
              disabled={isRejectDisabled || !canEditLead}
              sx={{
                padding: "10px 14px",
                gap: "8px",
                "&:hover": {
                  backgroundColor: (isRejectDisabled || !canEditLead)
                    ? "transparent"
                    : "rgba(211, 47, 47, 0.08)",
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: "18px" }}>
                <CancelIcon
                  sx={{
                    width: 18,
                    height: 18,
                    color: (isRejectDisabled || !canEditLead) ? "#9E9E9E" : "#D32F2F",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Reject Referral"
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "1.15",
                      color: (isRejectDisabled || !canEditLead) ? "#9E9E9E" : "#D32F2F",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    },
                  },
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>

      {/* Reject Referral Modal */}
      <CustomDialog
        open={rejectModalOpen}
        onClose={handleRejectCancel}
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmberRoundedIcon
              sx={{ color: "#D32F2F", fontSize: "20px" }}
            />
            <Typography variant="h6" sx={{ fontSize: "18px", fontWeight: 600 }}>
              Reject Referral
            </Typography>
          </Box>
        }
        buttonName={[]}
        width="500px"
        padding="24px"
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: "16px",
                color: "#434343",
                marginBottom: "16px",
              }}
            >
              Are you sure you want to reject this referral?
            </Typography>
          </Grid>
          {selectedRow && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  backgroundColor: "#F5F5F5",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  marginBottom: "16px",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "14px",
                    color: "#212121",
                    fontWeight: 500,
                  }}
                >
                  {selectedRow.fullName} - {selectedRow.referral_number}
                </Typography>
              </Box>
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <CustomLabel label="Reason for Rejection" isRequired />
              <CustomInput
                placeholder="Enter rejection reason"
                name="rejectionReason"
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError(null);
                }}
                multiline
                rows={4}
                hasError={!!rejectionError}
                errorMessage={rejectionError || undefined}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #E3ECEF",
              }}
            >
              <CustomButton
                variant="secondary"
                size="md"
                onClick={handleRejectCancel}
              >
                Cancel
              </CustomButton>
              <Button
                onClick={handleRejectConfirm}
                disabled={rejectReferral.isPending || isRejectDisabled}
                sx={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  backgroundColor: "#D32F2F",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#B71C1C",
                  },
                  "&:disabled": {
                    backgroundColor: "#D32F2F",
                    opacity: 0.6,
                  },
                }}
              >
                {rejectReferral.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CustomDialog>

      {/* Snackbar */}
      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.open}
        onClose={handleSnackbarClose}
      />
    </Paper>
  );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export default React.memo(LeadsTable, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.loading === nextProps.loading &&
    prevProps.data === nextProps.data &&
    prevProps.onViewProfile === nextProps.onViewProfile &&
    prevProps.onReject === nextProps.onReject
  );
});
