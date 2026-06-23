import React, { useCallback, useMemo } from "react";
import { useState, useRef } from "react";

import {
  Avatar,
  Box,
  CircularProgress,
  Button,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Chip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import {
  heading,
  primaryTextCss,
  tableCellCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import BlockIcon from "@mui/icons-material/Block";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { DefaultError } from "@tanstack/react-query";
import {
  listGroupHomesQueryKey,
  updateGroupHomeStatusMutation,
  deleteGroupHomeMutation,
} from "../../../sdk/@tanstack/react-query.gen";
import ConfirmationPopUp from "../../../components/confirmation-pop-up/confirmation-pop-up";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { TableSkeleton } from "../../../components/common-table";
import { formatPhone } from "../../../utils";
import DeleteBlockerModal, {
  type Blocker,
} from "../../../components/DeleteBlockerModal";
import { canDeleteGroupHome } from "../../group_home/api";

export type GroupHome = {
  id: string;
  uuid: string;
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  avatarUrl?: string;
  align?: "left" | "center" | "right";
  status?: string;
  active?: boolean;
};

// Memoize table headers with responsive widths for different screen sizes
// Breakpoints:
// - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
// - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
// - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
// - Desktop (lg): >= 1280px - Full widths, fits within container
const tableHeaders = [
  { 
    id: "name", 
    label: "Name", 
    width: { xs: "200px", sm: "230px", md: "260px", lg: "260px" },
    minWidth: { xs: "180px", sm: "210px", md: "240px", lg: "260px" },
    align: "left" 
  },
  { 
    id: "email", 
    label: "Email", 
    width: { xs: "200px", sm: "230px", md: "260px", lg: "260px" },
    minWidth: { xs: "180px", sm: "210px", md: "240px", lg: "260px" },
    align: "left" 
  },
  {
    id: "contactNumber",
    label: "Phone Number",
    width: { xs: "140px", sm: "160px", md: "180px", lg: "180px" },
    minWidth: { xs: "130px", sm: "150px", md: "170px", lg: "180px" },
    align: "center",
  },
  { 
    id: "address", 
    label: "Address", 
    width: { xs: "180px", sm: "210px", md: "240px", lg: "240px" },
    minWidth: { xs: "160px", sm: "190px", md: "220px", lg: "240px" },
    align: "left" 
  },
  { 
    id: "status", 
    label: "Status", 
    width: { xs: "100px", sm: "110px", md: "120px", lg: "120px" },
    minWidth: { xs: "90px", sm: "100px", md: "110px", lg: "120px" },
    align: "center" 
  },
  { 
    id: "action", 
    label: "Action", 
    width: { xs: "60px", sm: "66px", md: "72px", lg: "72px" },
    minWidth: { xs: "50px", sm: "60px", md: "72px", lg: "72px" },
    align: "center" 
  },
];

export type GroupHomesTableProps = {
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  data: GroupHome[];
  onEdit?: (row: GroupHome) => void;
  onDelete?: (row: GroupHome) => void;
  onDeactivate?: (row: GroupHome) => void;
  loading?: boolean;
};

const AVATAR_SIZE = 32;

const GroupHomesTable: React.FC<GroupHomesTableProps> = ({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  data,
  onEdit,
  onDelete,
  onDeactivate,
  loading = false,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();

  const canEdit = hasPermission("group_homes.edit");
  const canDelete = hasPermission("group_homes.delete");
  const canDeactivate = hasPermission("group_homes.deactivate");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<GroupHome | null>(null);
  const [localData, setLocalData] = useState<GroupHome[]>(data);
  const [avatarLoadedIds, setAvatarLoadedIds] = useState<Set<string>>(
    new Set(),
  );
  const isMenuOpen = Boolean(anchorEl);

  const handleAvatarLoad = useCallback((rowId: string) => {
    setAvatarLoadedIds((prev) => new Set(prev).add(rowId));
  }, []);

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToChange, setItemToChange] = useState<GroupHome | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GroupHome | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pre-flight blocker modal state (assignments / open incidents must clear
  // before a group home can be deactivated or deleted).
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [blockerOpen, setBlockerOpen] = useState(false);
  const [blockerTargetUuid, setBlockerTargetUuid] = useState<string | null>(
    null,
  );
  // Reserved for disabling menu items while a pre-flight is in flight; not
  // currently surfaced in the menu UI but kept to avoid double-clicks.
  const [, setIsPreflighting] = useState(false);

  // Residents-blocking alert dialog
  const previousDataLengthRef = useRef<number>(data.length);

  React.useEffect(() => {
    const currentDataLength = Array.isArray(data) ? data.length : 0;
    const previousDataLength = previousDataLengthRef.current;

    // Sync localData with data when data changes
    // During status toggle, we preserve optimistic updates but still sync if data structure changes (e.g., pagination)
    if (!isTogglingStatus) {
      setLocalData(data);
      previousDataLengthRef.current = currentDataLength;
      
      // Clear avatar loaded state when data changes to ensure avatars reload if URLs changed
      // This fixes the issue where avatar URLs update but images don't refresh
      setAvatarLoadedIds(new Set());
    } else {
      // Even during status toggle, if data length changed (pagination), we need to update
      // This ensures pagination works even if a status toggle is in progress
      if (currentDataLength !== previousDataLength) {
        setLocalData(data);
        previousDataLengthRef.current = currentDataLength;
        // Clear avatar loaded state when pagination changes
        setAvatarLoadedIds(new Set());
      }
    }
  }, [data, isTogglingStatus]);

  const changeStatusMutation = useMutation({
    ...updateGroupHomeStatusMutation(),
    onSuccess: (_data, variables) => {
      const successMessage = "Status updated successfully";
      const updatedActive = variables?.body?.active;
      const targetUuid = variables?.path?.uuid;

      queryClient.invalidateQueries({ queryKey: listGroupHomesQueryKey() });

      // Update active field in local data to reflect API response
      if (typeof updatedActive === "boolean" && targetUuid) {
        setLocalData((prev) =>
          prev.map((r) =>
            r.uuid === targetUuid ? { ...r, active: updatedActive } : r,
          ),
        );
      }

      setIsTogglingStatus(false);
      setSnackbar({
        isOpen: true,
        message: successMessage,
        status: "success",
      });
      setConfirmDialogOpen(false);
      setItemToChange(null);
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as
        | { message?: string }
        | undefined;
      const errorMessage =
        errorData?.message ||
        error.message ||
        "Failed to change status. Please try again.";

      // Revert optimistic update on error
      setIsTogglingStatus(false);
      // Refresh data from server to get correct state
      queryClient.invalidateQueries({ queryKey: listGroupHomesQueryKey() });

      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: "error",
      });
      setConfirmDialogOpen(false);
      setItemToChange(null);
    },
  });

  const deleteGroupHomeMutationHook = useMutation({
    ...deleteGroupHomeMutation(),
    onSuccess: () => {
      // Invalidate queries - React Query will automatically refetch active queries
      // Note: We can't be specific here since we don't have page/size context
      // But this is okay since it's only called when deleting from the table
      queryClient.invalidateQueries({ queryKey: listGroupHomesQueryKey() });

      setSnackbar({
        isOpen: true,
        message: "Group home deleted successfully",
        status: "success",
      });
      setDeleteConfirmDialogOpen(false);
      setItemToDelete(null);
      setIsDeleting(false);
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as
        | { message?: string }
        | undefined;
      const errorMessage =
        errorData?.message ||
        error.message ||
        "Failed to delete group home. Please try again.";

      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: "error",
      });
      setDeleteConfirmDialogOpen(false);
      setItemToDelete(null);
      setIsDeleting(false);
    },
  });

  const handleMenuClick = useCallback((
    event: React.MouseEvent<HTMLElement>,
    row: GroupHome,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedRow(null);
  }, []);

  const handleEdit = useCallback(() => {
    if (selectedRow && onEdit) onEdit(selectedRow);
    handleMenuClose();
  }, [selectedRow, onEdit, handleMenuClose]);

  const handleDeactivate = useCallback(async () => {
    if (!selectedRow) { handleMenuClose(); return; }
    const row = selectedRow;
    handleMenuClose();

    // Only pre-flight when transitioning from active -> inactive. Activation
    // never has blockers.
    const isCurrentlyActive = row.active ?? true;
    if (isCurrentlyActive && row.uuid) {
      try {
        setIsPreflighting(true);
        const result = await canDeleteGroupHome(row.uuid);
        if (!result.can_delete) {
          setBlockers(result.blockers ?? []);
          setBlockerTargetUuid(row.uuid);
          setBlockerOpen(true);
          return;
        }
      } catch {
        // Network or unexpected error — let the destructive call surface it.
      } finally {
        setIsPreflighting(false);
      }
    }

    setItemToChange(row);
    setConfirmDialogOpen(true);
  }, [selectedRow, handleMenuClose]);

  const handleConfirmStatusChange = useCallback(() => {
    if (!itemToChange) return;

    // Use active field from API response (boolean)
    const currentActive = itemToChange.active ?? true;
    const newActiveStatus = !currentActive;

    // ✅ Optimistic UI update - update active field immediately
    setIsTogglingStatus(true);
    setLocalData((prev) =>
      prev.map((r) =>
        r.uuid === itemToChange.uuid ? { ...r, active: newActiveStatus } : r,
      ),
    );

    changeStatusMutation.mutate({
      path: { uuid: itemToChange.uuid },
      body: { active: newActiveStatus },
    });
  }, [itemToChange, changeStatusMutation]);

  const handleCancelStatusChange = useCallback(() => {
    setConfirmDialogOpen(false);
    setItemToChange(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedRow || isDeleting) { handleMenuClose(); return; }
    const row = selectedRow;
    handleMenuClose();

    if (row.uuid) {
      try {
        setIsPreflighting(true);
        const result = await canDeleteGroupHome(row.uuid);
        if (!result.can_delete) {
          setBlockers(result.blockers ?? []);
          setBlockerTargetUuid(row.uuid);
          setBlockerOpen(true);
          return;
        }
      } catch {
        // Pre-flight failed (e.g. network) — proceed and let the destructive
        // call surface the error (backend still returns 409 with blockers).
      } finally {
        setIsPreflighting(false);
      }
    }

    setItemToDelete(row);
    setDeleteConfirmDialogOpen(true);
  }, [selectedRow, handleMenuClose, isDeleting]);

  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete?.uuid) return;

    // Optimistically close dialog to prevent double-open flicker
    setIsDeleting(true);
    setDeleteConfirmDialogOpen(false);

    deleteGroupHomeMutationHook.mutate({
      path: { uuid: itemToDelete.uuid },
    });
  }, [itemToDelete, deleteGroupHomeMutationHook]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmDialogOpen(false);
    setItemToDelete(null);
  }, []);

  const handleGroupHomeNameClick = useCallback((uuid: string) => {
    if (!uuid) return;
    navigate(`/admin/settings/group-homes/${uuid}`);
  }, [navigate]);

  // Helper function to get header width and minWidth by id
  const getHeaderStyles = useCallback((id: string) => {
    const header = tableHeaders.find((h) => h.id === id);
    if (!header) return {};
    return {
      width: typeof header.width === 'object' ? header.width : header.width,
      minWidth: typeof header.minWidth === 'object' ? header.minWidth : header.minWidth || header.width,
    };
  }, []);

  const getStatusColors = useCallback((
    status: string | undefined,
  ): { bg: string; color: string } => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "active":
        return { bg: "#E6F4EA", color: "#137333" };
      case "deactive":
        return { bg: "#FCE8E6", color: "#C5221F" };
      case "inactive":
        return { bg: "#FCE8E6", color: "#C5221F" };
      case "pending":
        return { bg: "#FEF7E6", color: "#EA8600" };
      default:
        return { bg: "#F2F2F2", color: "#757775" };
    }
  }, []);

  const DeleteDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    name?: string;
  }> = ({ open, onClose, onConfirm, name }) => (
    <CustomDialog
      width={"400px"}
      title={"Delete Group Home"}
      buttonName={[]}
      open={open}
      onClose={onClose}
    >
      <Grid container flexDirection={"column"} rowGap={2}>
        <Typography variant="inputTitle">
          {name
            ? `Are you sure you want to delete ${name}? This action cannot be undone.`
            : "Are you sure you want to delete this group home? This action cannot be undone."}
        </Typography>
        <Grid container width={"100%"} justifyContent={"flex-end"} columnGap={1}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onConfirm}
            sx={{ backgroundColor: "error.main", color: "#FFFFFF", "&:hover": { backgroundColor: "error.dark" } }}
          >
            <Typography variant="buttonLinkAndField3" sx={{ color: "#FFFFFF" }}>
              Delete
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </CustomDialog>
  );

  if (loading) {
    return (
      <Paper sx={{ overflow: "hidden" }}>
        <TableSkeleton
          headers={tableHeaders.map((h) => ({
            id: h.id,
            label: h.label,
            width: h.width.lg,
          }))}
          rowCount={5}
          hasCheckbox={false}
          hasAvatar={false}
          hasActions={false}
        />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        overflow: "hidden",
        height: "100%",
        border: "1px solid #E3ECEF",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
      }}
    >
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
            // Mobile: 180 + 180 + 130 + 160 + 90 + 50 = 790px
            // Tablet: 210 + 210 + 150 + 190 + 100 + 60 = 920px
            // Laptop: 240 + 240 + 170 + 220 + 110 + 72 = 1052px
            // Desktop: 260 + 260 + 180 + 240 + 120 + 72 = 1132px
            minWidth: {
              xs: "790px",   // Mobile: < 600px - forces horizontal scroll on screens < 790px
              sm: "920px",   // Tablet: 600px - 959px
              md: "1052px",  // Laptop: 960px - 1279px
              lg: "1132px",  // Desktop: >= 1280px
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
        <Table aria-label="group homes table" stickyHeader sx={{ ...tableCellCss, tableLayout: "auto", width: "100%" }}>
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
            {localData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableHeaders.length} align="center">
                  <Typography
                    sx={{
                      padding: "40px 0",
                      color: "#989998",
                      fontSize: "14px",
                    }}
                  >
                    No group homes available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              localData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell
                    sx={{
                      ...getHeaderStyles("name"),
                      textAlign: "left",
                    }}
                  >
                    <Box display="flex" alignItems="center" gap="12px">
                      <Box
                        sx={{
                          position: "relative",
                          width: AVATAR_SIZE,
                          height: AVATAR_SIZE,
                          flexShrink: 0,
                        }}
                      >
                        {row.avatarUrl && !avatarLoadedIds.has(row.id) && (
                          <Skeleton
                            variant="circular"
                            width={AVATAR_SIZE}
                            height={AVATAR_SIZE}
                            sx={{
                              position: "absolute",
                              inset: 0,
                            }}
                          />
                        )}
                        <Avatar
                          key={`${row.id}-${row.avatarUrl || 'no-avatar'}`}
                          src={row.avatarUrl}
                          {...(row.avatarUrl && {
                            slotProps: {
                              img: { 
                                onLoad: () => handleAvatarLoad(row.id),
                                onError: () => {
                                  // If image fails to load, mark as loaded to show fallback
                                  handleAvatarLoad(row.id);
                                },
                                loading: "lazy" as const,
                              },
                            },
                          })}
                          sx={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            borderRadius: "999px",
                            ...(row.avatarUrl &&
                              !avatarLoadedIds.has(row.id) && { opacity: 0 }),
                          }}
                        >
                          {!row.avatarUrl &&
                            row.name
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                        </Avatar>
                        {row.avatarUrl && !avatarLoadedIds.has(row.id) && (
                          <CircularProgress
                            size={AVATAR_SIZE * 0.5}
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              marginTop: -AVATAR_SIZE * 0.25,
                              marginLeft: -AVATAR_SIZE * 0.25,
                              color: "primary.main",
                            }}
                          />
                        )}
                      </Box>
                      <Tooltip title={row.name} arrow placement="top">
                        <Grid
                          component="a"
                          href={`/admin/settings/group-homes/${row.uuid}`}
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            handleGroupHomeNameClick(row.uuid);
                          }}
                          aria-label={`Open group home profile for ${row.name}`}
                          sx={{
                            fontSize: "14px",
                            fontWeight: 500,
                            lineHeight: "120%",
                            fontFamily: "Inter, sans-serif",
                            color: "#11466D",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "200px",
                            cursor: "pointer",
                            textDecoration: "none",
                            display: "block",
                            "&:hover": {
                              textDecoration: "underline",
                              color: "#0A2E45",
                            },
                            "&:focus-visible": {
                              outline: "2px solid #11466D",
                              outlineOffset: "2px",
                              borderRadius: "2px",
                            },
                          }}
                        >
                          {row.name || "-"}
                        </Grid>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...getHeaderStyles("email"),
                      textAlign: "left",
                    }}
                  >
                    <Typography
                      sx={{
                        ...primaryTextCss,
                        color: "#27313F",
                        textAlign: "left", // Neutral/80 from Figma - black color
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: { xs: "160px", sm: "220px", md: "260px" },
                      }}
                    >
                      {row.email || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      ...getHeaderStyles("contactNumber"), 
                      textAlign: "center" 
                    }} 
                    align="center"
                  >
                    <Typography sx={primaryTextCss}>
                      {row.contactNumber ? formatPhone(row.contactNumber) : "-"}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      ...getHeaderStyles("address"),
                      textAlign: "left",
                    }}
                  >
                    <Tooltip title={row.address} arrow placement="top">
                      <Typography
                        sx={{
                          ...primaryTextCss,
                          color: "#27313F",
                          textAlign: "left", // Neutral/80 from Figma - black color
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: { xs: "200px", sm: "280px", md: "420px" },
                        }}
                      >
                        {row.address}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      ...getHeaderStyles("status"),
                      borderBottom: "1px solid #E7E9EB",
                    }}
                  >
                    {(() => {
                      // Use active field directly from API response (boolean: true or false)
                      const active = row.active ?? true; // Default to true if undefined
                      const status: string = active ? "active" : "inactive";
                      const statusColors = getStatusColors(status);
                      return (
                        <Chip
                          label={active ? "Active" : "Inactive"}
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

                  <TableCell 
                    align="center" 
                    sx={{ 
                      ...getHeaderStyles("action"), 
                      textAlign: "center" 
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, row)}
                      sx={{
                        width: 24,
                        height: 24,
                        padding: 0,
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                    >
                      <MoreVertIcon
                        sx={{
                          fontSize: "18px",
                          color: "#989998",
                        }}
                      />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              border: "1px solid #E7E9EB",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
              mt: 1,
              minWidth: "160px",
            },
          },
        }}
      >
        {/* Edit */}
        <Tooltip title={canEdit ? "" : "You don't have permission"} placement="left" arrow>
          <span>
            <MenuItem
              onClick={handleEdit}
              disabled={!canEdit}
              sx={{
                padding: "10px 14px",
                gap: "8px",
                "&:hover": { backgroundColor: "rgba(67, 147, 34, 0.04)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "18px" }}>
                <EditOutlinedIcon
                  sx={{ width: 18, height: 18, color: canEdit ? "#2C2D2C" : "#B0B0B0" }}
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
                      color: canEdit ? "#2C2D2C" : "#B0B0B0",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    },
                  },
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>

        {/* Deactivate */}
        <Tooltip title={canDeactivate ? "" : "You don't have permission"} placement="left" arrow>
          <span>
            <MenuItem
              onClick={handleDeactivate}
              disabled={!canDeactivate}
              sx={{
                padding: "10px 14px",
                gap: "8px",
                "&:hover": { backgroundColor: "rgba(67, 147, 34, 0.04)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "18px" }}>
                <BlockIcon sx={{ width: 18, height: 18, color: canDeactivate ? "#2C2D2C" : "#B0B0B0" }} />
              </ListItemIcon>
              <ListItemText
                primary={(selectedRow?.active ?? true) ? "Deactivate" : "Activate"}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "1.15",
                      color: canDeactivate ? "#2C2D2C" : "#B0B0B0",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    },
                  },
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>

        {/* Delete */}
        <Tooltip title={canDelete ? "" : "You don't have permission"} placement="left" arrow>
          <span>
            <MenuItem
              onClick={handleDelete}
              disabled={!canDelete}
              sx={{
                padding: "10px 14px",
                gap: "8px",
                "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.06)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: "18px" }}>
                <DeleteOutlineIcon
                  sx={{ width: 18, height: 18, color: canDelete ? "#D32F2F" : "#B0B0B0" }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Delete"
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: "1.15",
                      color: canDelete ? "#D32F2F" : "#B0B0B0",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    },
                  },
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>
      <ConfirmationPopUp
        open={confirmDialogOpen}
        onClose={handleCancelStatusChange}
        onConfirm={handleConfirmStatusChange}
        message={
          itemToChange
            ? `Are you sure you want to ${
                (itemToChange.active ?? true) ? "deactivate" : "activate"
              } ${itemToChange.name}?`
            : "Are you sure you want to change the status?"
        }
      />
      <DeleteDialog
        open={deleteConfirmDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        name={itemToDelete?.name}
      />

      <DeleteBlockerModal
        open={blockerOpen}
        onClose={() => {
          setBlockerOpen(false);
          setBlockers([]);
          setBlockerTargetUuid(null);
        }}
        blockers={blockers}
        onManage={
          blockerTargetUuid
            ? () => {
                const targetUuid = blockerTargetUuid;
                setBlockerOpen(false);
                setBlockers([]);
                setBlockerTargetUuid(null);
                // Deep-link into the Group Home's Assigned Staff tab so the
                // admin can clear blocking assignments.
                navigate(
                  `/admin/settings/group-homes/${targetUuid}?tab=assigned_staff`,
                );
              }
            : undefined
        }
      />

      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </Paper>
  );
};

export default React.memo(GroupHomesTable);
