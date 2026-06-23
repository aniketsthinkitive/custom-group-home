import React, { useState } from "react";
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
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { usePermission } from "../../../hooks/usePermission";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  heading,
  tableCellCss,
  primaryTextCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import { OverflowTooltip } from "../../../components/overflow-tooltip";
import TableSkeleton from "../../../components/common-table/TableSkeleton";
import type { Appointment } from "../../../sdk/types.gen";
import { formatDateTimeWith12Hour } from "../../../utils";

export interface AppointmentData extends Appointment {
  resident_name?: string;
  avatar_url?: string | null;
  referral_id?: string;
  resident_id?: string;
  room?: {
    id: number;
    room_number: string;
    is_active: boolean;
    is_occupied: boolean;
  };
  resident_status?: string;
}

interface AppointmentsTableProps {
  data?: AppointmentData[];
  loading?: boolean;
  onEdit?: (appointment: AppointmentData) => void;
  onView?: (appointment: AppointmentData) => void;
  onMarkCompleted?: (appointment: AppointmentData) => void;
  onDelete?: (appointment: AppointmentData) => void;
  onResidentClick?: (appointment: AppointmentData) => void;
  actionType?: "menu" | "view";
  /** When set, edit/delete/complete actions are disabled and this text shows as a tooltip */
  disabledReason?: string;
  /** Column IDs to hide from rendering (e.g. ["referralId", "groupHome"]) */
  hiddenColumns?: string[];
}

const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  data = [],
  loading = false,
  onEdit,
  onView,
  onMarkCompleted,
  onDelete,
  onResidentClick,
  actionType = "menu",
  disabledReason,
  hiddenColumns = [],
}) => {
  const { hasPermission } = usePermission();
  const canEditAppointment = hasPermission("appointments.edit");
  const canMarkCompleted = hasPermission("appointments.mark_completed") || hasPermission("appointments.edit");
  const canDeleteAppointment = hasPermission("appointments.delete");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<AppointmentData | null>(null);

  // Memoize table headers with responsive widths for different screen sizes
  // Breakpoints:
  // - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
  // - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
  // - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
  // - Desktop (lg): >= 1280px - Full widths, fits within container
  const tableHeaders = [
    {
      id: "referralId",
      label: "Referral ID",
      width: { xs: "80px", sm: "100px", md: "110px", lg: "110px" },
      minWidth: { xs: "75px", sm: "95px", md: "105px", lg: "110px" },
      align: "left"
    },
    {
      id: "groupHome",
      label: "Group Home",
      width: { xs: "120px", sm: "140px", md: "155px", lg: "160px" },
      minWidth: { xs: "110px", sm: "130px", md: "145px", lg: "150px" },
      align: "left"
    },
    {
      id: "residentName",
      label: "Residents Name",
      width: { xs: "140px", sm: "155px", md: "165px", lg: "170px" },
      minWidth: { xs: "130px", sm: "145px", md: "155px", lg: "160px" },
      align: "left",
    },
    {
      id: "appointmentTitle",
      label: "Appointment Title",
      width: { xs: "140px", sm: "155px", md: "165px", lg: "170px" },
      minWidth: { xs: "130px", sm: "145px", md: "155px", lg: "160px" },
      align: "left",
    },
    {
      id: "description",
      label: "Description",
      width: { xs: "140px", sm: "150px", md: "160px", lg: "165px" },
      minWidth: { xs: "130px", sm: "140px", md: "150px", lg: "155px" },
      align: "left"
    },
    {
      id: "association",
      label: "Association",
      width: { xs: "80px", sm: "90px", md: "100px", lg: "100px" },
      minWidth: { xs: "75px", sm: "85px", md: "90px", lg: "95px" },
      align: "left"
    },
    {
      id: "date",
      label: "Date",
      width: { xs: "150px", sm: "160px", md: "165px", lg: "170px" },
      minWidth: { xs: "140px", sm: "150px", md: "155px", lg: "160px" },
      align: "left"
    },
    {
      id: "status",
      label: "Status",
      width: { xs: "100px", sm: "105px", md: "115px", lg: "120px" },
      minWidth: { xs: "95px", sm: "100px", md: "110px", lg: "115px" },
      align: "center"
    },
    {
      id: "action",
      label: "Action",
      width: { xs: "56px", sm: "56px", md: "56px", lg: "56px" },
      minWidth: { xs: "56px", sm: "56px", md: "56px", lg: "56px" },
      align: "center"
    },
  ];

  const isHidden = (id: string) => hiddenColumns.includes(id);
  const visibleHeaders = hiddenColumns.length
    ? tableHeaders.filter((h) => !hiddenColumns.includes(h.id))
    : tableHeaders;

  const getHeaderStyles = (id: string) => {
    const header = tableHeaders.find((h) => h.id === id);
    if (!header) return {};
    return {
      width: header.width,
      minWidth: header.minWidth || header.width,
      maxWidth: header.width,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    };
  };

  const getStatusColors = (
    status: string | undefined,
  ): { bg: string; color: string } => {
    const statusUpper = status?.toUpperCase() || "";
    switch (statusUpper) {
      case "REQUESTED":
        return { bg: "#E3F2FD", color: "#1976D2" }; // Blue
      case "COMPLETED":
        return { bg: "#E6F4EA", color: "#137333" }; // Green
      case "CANCELLED":
        return { bg: "#FCE8E6", color: "#C5221F" }; // Red
      default:
        return { bg: "#F2F2F2", color: "#757775" };
    }
  };

  const formatReferralId = (id: string | undefined | number): string => {
    if (!id) return "-";
    // Use the last 8 characters of UUID for display, or use id if available
    // const shortId = uuid.split('-')[0].toUpperCase();
    return `REF-0${id}`;
  };

  const getUserInitials = (name: string | undefined): string => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    }
    return name.charAt(0).toUpperCase();
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    row: AppointmentData,
  ) => {
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

  const handleView = () => {
    if (selectedRow && onView) {
      onView(selectedRow);
    }
    handleMenuClose();
  };

  const handleMarkCompleted = () => {
    if (selectedRow && onMarkCompleted) {
      onMarkCompleted(selectedRow);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedRow && onDelete) {
      onDelete(selectedRow);
    }
    handleMenuClose();
  };

  // Use data directly instead of maintaining separate state
  const tableData = loading ? [] : data;

  if (loading) {
    return (
      <Paper sx={{ overflow: "hidden" }}>
        <TableSkeleton
          headers={visibleHeaders}
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
      sx={{
        overflow: "hidden",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E3ECEF",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
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
            // Mobile: 90 + 120 + 140 + 140 + 150 + 90 + 170 + 100 + 50 = 1050px
            // Tablet: 110 + 140 + 160 + 160 + 175 + 105 + 180 + 110 + 60 = 1200px
            // Laptop: 130 + 160 + 180 + 180 + 200 + 120 + 190 + 120 + 64 = 1344px
            // Desktop: 140 + 170 + 190 + 190 + 210 + 130 + 190 + 130 + 64 = 1414px
            minWidth: {
              xs: "1050px",   // Mobile: < 600px - forces horizontal scroll on screens < 1050px
              sm: "1200px",  // Tablet: 600px - 959px
              md: "1344px",  // Laptop: 960px - 1279px
              lg: "1414px",  // Desktop: >= 1280px
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
              lg: "10px 16px"     // Desktop: full padding
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
            paddingLeft: { xs: "8px", sm: "12px", md: "14px", lg: "16px" },
          },
          "& .MuiTableHead-root .MuiTableRow-root .MuiTableCell-root:last-of-type":
          {
            paddingRight: { xs: "8px", sm: "12px", md: "14px", lg: "16px" },
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
              lg: "10px 16px"     // Desktop: full padding
            },
            fontSize: { xs: "12px", sm: "12.5px", md: "13px", lg: "13px" },
            color: "#101828",
            whiteSpace: "nowrap", // Prevent text wrapping in cells
            boxSizing: "border-box",
            minWidth: "fit-content",
          },
          "& .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:first-of-type":
          {
            paddingLeft: { xs: "8px", sm: "12px", md: "14px", lg: "16px" },
          },
          "& .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:last-of-type":
          {
            paddingRight: { xs: "8px", sm: "12px", md: "14px", lg: "16px" },
          },
        }}
      >
        <Table aria-label="appointments table" stickyHeader sx={{ ...tableCellCss, tableLayout: "fixed", width: "100%" }}>
          <TableHead>
            <TableRow sx={{ height: { xs: 40, sm: 42, md: 44 } }}>
              {visibleHeaders.map((header) => {
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
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleHeaders.length}
                  align="center"
                  sx={{ borderBottom: "none" }}
                >
                  <Typography
                    sx={{
                      padding: "15px 0",
                      color: "#989998",
                      fontSize: "14px",
                    }}
                  >
                    No appointments available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => {
                const residentName = row.resident_name || "-";
                return (
                  <TableRow key={row.id}>
                    {!isHidden("referralId") && (
                      <TableCell
                        sx={getHeaderStyles("referralId")}
                        align="left"
                      >
                        <Typography sx={primaryTextCss}>
                          {(row as any).referral_id ||
                            (row as any).referral_number ||
                            "-"}
                        </Typography>
                      </TableCell>
                    )}

                    {!isHidden("groupHome") && (
                      <TableCell
                        sx={getHeaderStyles("groupHome")}
                        align="left"
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <OverflowTooltip
                            text={
                              (row as any).group_home?.name ??
                              (row as any).group_home_name ??
                              (row as any).group_home ??
                              "-"
                            }
                            sx={{
                              textAlign: "left",
                              margin: 0,
                              padding: 0,
                            }}
                          />
                        </Box>
                      </TableCell>
                    )}

                    {!isHidden("residentName") && (
                      <TableCell
                        sx={getHeaderStyles("residentName")}
                        align="left"
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          gap="12px"
                          onClick={(e) => {
                            if (onResidentClick) {
                              e.preventDefault();
                              e.stopPropagation();
                              onResidentClick(row);
                            }
                          }}
                          sx={{
                            cursor: onResidentClick ? "pointer" : "default",
                            "&:hover": onResidentClick
                              ? {
                                "& .MuiTypography-root": {
                                  textDecoration: "underline",
                                  color: "#1570EF",
                                },
                              }
                              : {},
                          }}
                        >
                          <Avatar
                            src={row.avatar_url ?? undefined}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "999px",
                              fontSize: "14px",
                              fontWeight: 500,
                            }}
                          >
                            {getUserInitials(residentName)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                            <OverflowTooltip
                              text={residentName}
                              sx={{
                                cursor: onResidentClick ? "pointer" : "default",
                                color: onResidentClick ? "#1976D2" : "inherit",
                                textAlign: "left !important",
                                transition: "all 0.2s",
                              }}
                            />
                            {row.resident_status === "MOVED_OUT" && (
                              <Chip
                                label="Moved Out"
                                size="small"
                                sx={{
                                  backgroundColor: "#FCE8E6",
                                  color: "#C5221F",
                                  fontWeight: 500,
                                  fontSize: "10px",
                                  height: "20px",
                                  "& .MuiChip-label": {
                                    padding: "0 6px",
                                  },
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                    )}

                    {!isHidden("appointmentTitle") && (
                      <TableCell
                        sx={getHeaderStyles("appointmentTitle")}
                        align="left"
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <OverflowTooltip
                            text={row.appointment_title || "-"}
                            sx={{
                              textAlign: "left",
                              margin: 0,
                              padding: 0,
                            }}
                          />
                        </Box>
                      </TableCell>
                    )}

                    {!isHidden("description") && (
                      <TableCell
                        sx={getHeaderStyles("description")}
                        align="left"
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <OverflowTooltip
                            text={row.description || "-"}
                            sx={{
                              textAlign: "left",
                              margin: 0,
                              padding: 0,
                            }}
                          />
                        </Box>
                      </TableCell>
                    )}

                    {!isHidden("association") && (
                      <TableCell
                        sx={getHeaderStyles("association")}
                        align="left"
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <OverflowTooltip
                            text={
                              row.contact_type ? String(row.contact_type) : "-"
                            }
                            sx={{
                              textAlign: "left",
                              margin: 0,
                              padding: 0,
                            }}
                          />
                        </Box>
                      </TableCell>
                    )}

                    {!isHidden("date") && (
                      <TableCell
                        sx={{
                          ...getHeaderStyles("date"),
                          overflow: "visible",
                          textOverflow: "clip",
                          whiteSpace: "nowrap",
                        }}
                        align="left"
                      >
                        <Typography sx={{ ...primaryTextCss, textAlign: "left", whiteSpace: "nowrap" }}>
                          {formatDateTimeWith12Hour(
                            row.appointment_date,
                            row.appointment_time,
                          )}
                        </Typography>
                      </TableCell>
                    )}

                    {!isHidden("status") && (
                      <TableCell
                        align="center"
                        sx={{
                          ...getHeaderStyles("status"),
                          borderBottom: "1px solid #E7E9EB",
                        }}
                      >
                        {(() => {
                          const status = row.status || "REQUESTED";
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
                                  overflow: "visible",
                                  display: "block",
                                  whiteSpace: "nowrap",
                                },
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                    )}

                    {!isHidden("action") && (
                      <TableCell
                        sx={getHeaderStyles("action")}
                        align="center"
                      >
                        {actionType === "view" ? (
                          <IconButton
                            onClick={() => onView && onView(row)}
                            sx={{
                              padding: "4px",
                              borderRadius: "6px",
                              "&:hover": {
                                backgroundColor: "rgba(67, 147, 34, 0.04)",
                              },
                            }}
                          >
                            <VisibilityOutlinedIcon
                              sx={{
                                width: 18,
                                height: 18,
                                color: "#2C2D2C",
                              }}
                            />
                          </IconButton>
                        ) : (
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
                        )}
                      </TableCell>
                    )}
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
              boxShadow:
                "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
              padding: "4px 0",
              minWidth: "160px",
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
        {/* View Details - Always shown */}
        {onView && (
          <MenuItem
            onClick={handleView}
            sx={{
              padding: "10px 14px",
              gap: "4px",
              "&:hover": {
                backgroundColor: "rgba(67, 147, 34, 0.04)",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: "18px" }}>
              <VisibilityOutlinedIcon
                sx={{
                  width: 18,
                  height: 18,
                  color: "#2C2D2C",
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="View Details"
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
        )}

        {/* Show Edit, Mark as Completed, Delete only for REQUESTED status */}
        {selectedRow?.status === "REQUESTED" && (
          <>
            {onEdit && (
              <Tooltip title={disabledReason || (!canEditAppointment ? "You don't have permission" : "")} placement="left" arrow>
                <span>
                  <MenuItem
                    onClick={handleEdit}
                    disabled={!!disabledReason || !canEditAppointment || selectedRow?.resident_status === "MOVED_OUT"}
                    sx={{
                      padding: "10px 14px",
                      gap: "4px",
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
                          color: canEditAppointment ? "#2C2D2C" : "#B0B0B0",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary="Edit Appointment"
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "1.15",
                            color: canEditAppointment ? "#2C2D2C" : "#B0B0B0",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                          },
                        },
                      }}
                    />
                  </MenuItem>
                </span>
              </Tooltip>
            )}

            {onMarkCompleted && (
              <Tooltip title={disabledReason || (!canMarkCompleted ? "You don't have permission" : "")} placement="left" arrow>
                <span>
                  <MenuItem
                    onClick={handleMarkCompleted}
                    disabled={!!disabledReason || !canMarkCompleted || selectedRow?.resident_status === "MOVED_OUT"}
                    sx={{
                      padding: "10px 14px",
                      gap: "4px",
                      "&:hover": {
                        backgroundColor: "rgba(67, 147, 34, 0.04)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: "18px" }}>
                      <CheckCircleOutlineIcon
                        sx={{
                          width: 18,
                          height: 18,
                          color: canMarkCompleted ? "#2C2D2C" : "#B0B0B0",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary="Mark as Completed"
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "1.15",
                            color: canMarkCompleted ? "#2C2D2C" : "#B0B0B0",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                          },
                        },
                      }}
                    />
                  </MenuItem>
                </span>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip title={disabledReason || (!canDeleteAppointment ? "You don't have permission" : "")} placement="left" arrow>
                <span>
                  <MenuItem
                    onClick={handleDelete}
                    disabled={!!disabledReason || !canDeleteAppointment || selectedRow?.resident_status === "MOVED_OUT"}
                    sx={{
                      padding: "10px 14px",
                      gap: "4px",
                      "&:hover": {
                        backgroundColor: "rgba(197, 34, 31, 0.04)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: "18px" }}>
                      <DeleteOutlineIcon
                        sx={{
                          width: 18,
                          height: 18,
                          color: canDeleteAppointment ? "#C5221F" : "#B0B0B0",
                        }}
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
                            color: canDeleteAppointment ? "#C5221F" : "#B0B0B0",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                          },
                        },
                      }}
                    />
                  </MenuItem>
                </span>
              </Tooltip>
            )}
          </>
        )}
      </Menu>
    </Paper>
  );
};

export default AppointmentsTable;
