import React, { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Tooltip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  heading,
  tableCellCss,
  primaryTextCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import TableSkeleton from "../../../components/common-table/TableSkeleton";
import type { DailyLog } from "../types/daily-logs.types";
import { formatDateTimeWith12Hour } from "../../../utils";

export type DailyLogData = DailyLog;

const GroupHomeCell = ({ text }: { text: string }) => {
  const ref = React.useRef<HTMLSpanElement | null>(null);
  const [overflow, setOverflow] = React.useState(false);
  
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflow(el.scrollWidth > el.clientWidth);
  }, [text]);

  return (
    <Tooltip title={overflow ? text : ""} arrow disableHoverListener={!overflow}>
      <Typography
        ref={ref as any}
        noWrap
        sx={{
          ...primaryTextCss,
          textAlign: "left !important",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "block",
          maxWidth: { xs: "100px", sm: "130px", md: "150px", lg: "160px" },
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
};

interface DailyLogsTableProps {
  data?: DailyLogData[];
  loading?: boolean;
  onView?: (log: DailyLogData) => void;
}

const DailyLogsTable: React.FC<DailyLogsTableProps> = ({
  data = [],
  loading = false,
  onView,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<DailyLogData | null>(null);

  const tableData = data;

  // Memoize table headers with responsive widths for different screen sizes
  // Breakpoints:
  // - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
  // - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
  // - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
  // - Desktop (lg): >= 1280px - Full widths, fits within container
  // Table width is 100% of container, with minWidth set per breakpoint for horizontal scrolling
  const tableHeaders = useMemo(() => [
    { 
      id: "dateTime", 
      label: "Date & Time", 
      width: { xs: "140px", sm: "160px", md: "170px", lg: "180px" },
      minWidth: { xs: "120px", sm: "150px", md: "170px", lg: "180px" },
      align: "left" as const 
    },
    { 
      id: "staffMember", 
      label: "Staff Member", 
      width: { xs: "150px", sm: "180px", md: "190px", lg: "200px" },
      minWidth: { xs: "130px", sm: "170px", md: "190px", lg: "200px" },
      align: "left" as const 
    },
    { 
      id: "role", 
      label: "Role", 
      width: { xs: "100px", sm: "130px", md: "140px", lg: "150px" },
      minWidth: { xs: "90px", sm: "120px", md: "140px", lg: "150px" },
      align: "left" as const 
    },
    { 
      id: "entity", 
      label: "Entity", 
      width: { xs: "100px", sm: "130px", md: "140px", lg: "150px" },
      minWidth: { xs: "90px", sm: "120px", md: "140px", lg: "150px" },
      align: "left" as const 
    },
    { 
      id: "targetUser", 
      label: "User", 
      width: { xs: "120px", sm: "150px", md: "170px", lg: "180px" },
      minWidth: { xs: "110px", sm: "140px", md: "170px", lg: "180px" },
      align: "left" as const 
    },
    { 
      id: "event", 
      label: "Event", 
      width: { xs: "120px", sm: "140px", md: "150px", lg: "160px" },
      minWidth: { xs: "110px", sm: "130px", md: "150px", lg: "160px" },
      align: "left" as const 
    },
    { 
      id: "groupHome", 
      label: "Group Home", 
      width: { xs: "120px", sm: "150px", md: "170px", lg: "180px" },
      minWidth: { xs: "110px", sm: "140px", md: "170px", lg: "180px" },
      align: "left" as const 
    },
    { 
      id: "ipAddress", 
      label: "IP Address", 
      width: { xs: "100px", sm: "130px", md: "140px", lg: "150px" },
      minWidth: { xs: "90px", sm: "120px", md: "140px", lg: "150px" },
      align: "left" as const 
    },
    { 
      id: "action", 
      label: "Action", 
      width: { xs: "64px", sm: "64px", md: "64px", lg: "72px" },
      minWidth: { xs: "64px", sm: "64px", md: "64px", lg: "72px" },
      align: "center" as const 
    },
  ], []);

  const handleMenuClick = useCallback((
    event: React.MouseEvent<HTMLElement>,
    row: DailyLogData,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedRow(null);
  }, []);

  const handleView = useCallback(() => {
    if (selectedRow && onView) {
      onView(selectedRow);
    }
    handleMenuClose();
  }, [selectedRow, onView, handleMenuClose]);

  if (loading) {
    return (
      <Paper sx={{ overflow: "hidden" }}>
        <TableSkeleton
          headers={tableHeaders.map((h) => ({
            id: h.id,
            label: h.label,
            width: typeof h.width === "object" ? h.width.md : h.width,
          }))}
          rowCount={10}
          hasCheckbox={false}
          hasAvatar={false}
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
        overflow: "hidden",
        flex: 1,
        minHeight: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        padding: 0,
        boxShadow: "none",
        border: "1px solid #DEE4ED",
        borderRadius: "8px",
        backgroundColor: "#FFFFFF",
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
            // Mobile: 120 + 130 + 90 + 90 + 110 + 110 + 110 + 90 + 64 = 914px
            // Tablet: 150 + 170 + 120 + 120 + 140 + 130 + 140 + 120 + 64 = 1154px
            // Laptop: 170 + 190 + 140 + 140 + 170 + 150 + 170 + 140 + 64 = 1334px
            // Desktop: 180 + 200 + 150 + 150 + 180 + 160 + 180 + 150 + 72 = 1422px
            minWidth: {
              xs: "914px",   // Mobile: < 600px
              sm: "1154px",  // Tablet: 600px - 959px
              md: "1334px",  // Laptop: 960px - 1279px
              lg: "1422px",  // Desktop: >= 1280px
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
        <Table stickyHeader aria-label="daily logs table" sx={tableCellCss}>
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
            {tableData.length === 0 ? (
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
                      No daily logs available
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => {
                const dateTimeHeader = tableHeaders[0];
                const staffMemberHeader = tableHeaders[1];
                const roleHeader = tableHeaders[2];
                const entityHeader = tableHeaders[3];
                const targetUserHeader = tableHeaders[4];
                const eventHeader = tableHeaders[5];
                const groupHomeHeader = tableHeaders[6];
                const ipAddressHeader = tableHeaders[7];
                const actionHeader = tableHeaders[8];

                return (
                  <TableRow key={row.id || `row-${row.created_at}`}>
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left !important",
                        minWidth: typeof dateTimeHeader.minWidth === 'object' 
                          ? dateTimeHeader.minWidth 
                          : dateTimeHeader.minWidth,
                        width: typeof dateTimeHeader.width === 'object' 
                          ? dateTimeHeader.width 
                          : dateTimeHeader.width,
                      }}
                      align="left"
                    >
                      <Typography sx={{ ...primaryTextCss, textAlign: "left !important" }}>
                        {formatDateTimeWith12Hour(row.created_at)}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left !important",
                        minWidth: typeof staffMemberHeader.minWidth === 'object' 
                          ? staffMemberHeader.minWidth 
                          : staffMemberHeader.minWidth,
                        width: typeof staffMemberHeader.width === 'object' 
                          ? staffMemberHeader.width 
                          : staffMemberHeader.width,
                      }}
                      align="left"
                    >
                      <Typography
                        title={row.staff_member || ""}
                        sx={{
                          ...primaryTextCss,
                          textAlign: "left !important",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                        }}
                      >
                        {row.staff_member || "Not Assigned"}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left !important",
                        minWidth: typeof roleHeader.minWidth === 'object' 
                          ? roleHeader.minWidth 
                          : roleHeader.minWidth,
                        width: typeof roleHeader.width === 'object' 
                          ? roleHeader.width 
                          : roleHeader.width,
                      }}
                      align="left"
                    >
                      <Typography
                        sx={{ ...primaryTextCss, textAlign: "left !important" }}
                      >
                        {row.role === "Agent" ? "Area Agency" : (row.role || "-")}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left !important",
                        minWidth: typeof entityHeader.minWidth === 'object' 
                          ? entityHeader.minWidth 
                          : entityHeader.minWidth,
                        width: typeof entityHeader.width === 'object' 
                          ? entityHeader.width 
                          : entityHeader.width,
                      }}
                      align="left"
                    >
                      <Typography
                        title={row.entity_type || ""}
                        sx={{
                          ...primaryTextCss,
                          textAlign: "left !important",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                          cursor: "pointer",
                        }}
                      >
                        {row.entity_type === "Agent" ? "Area Agency" : (row.entity_type || "-")}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left !important",
                        minWidth: typeof targetUserHeader.minWidth === 'object' 
                          ? targetUserHeader.minWidth 
                          : targetUserHeader.minWidth,
                        width: typeof targetUserHeader.width === 'object' 
                          ? targetUserHeader.width 
                          : targetUserHeader.width,
                      }}
                      align="left"
                    >
                      <Typography
                        title={row.target_user_name || ""}
                        sx={{
                          ...primaryTextCss,
                          textAlign: "left !important",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                        }}
                      >
                        {row.target_user_name || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left !important",
                        minWidth: typeof eventHeader.minWidth === 'object' 
                          ? eventHeader.minWidth 
                          : eventHeader.minWidth,
                        width: typeof eventHeader.width === 'object' 
                          ? eventHeader.width 
                          : eventHeader.width,
                      }}
                      align="left"
                    >
                      <Typography
                        title={row?.action?.replace("_", " ") || ""}
                        sx={{
                          ...primaryTextCss,
                          textAlign: "left !important",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                        }}
                      >
                        {row?.action?.replace("_", " ") || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left !important",
                        minWidth: typeof groupHomeHeader.minWidth === 'object' 
                          ? groupHomeHeader.minWidth 
                          : groupHomeHeader.minWidth,
                        width: typeof groupHomeHeader.width === 'object' 
                          ? groupHomeHeader.width 
                          : groupHomeHeader.width,
                      }}
                      align="left"
                    >
                      <GroupHomeCell text={row.group_home || "-"} />
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "left",
                        minWidth: typeof ipAddressHeader.minWidth === 'object' 
                          ? ipAddressHeader.minWidth 
                          : ipAddressHeader.minWidth,
                        width: typeof ipAddressHeader.width === 'object' 
                          ? ipAddressHeader.width 
                          : ipAddressHeader.width,
                      }}
                      align="center"
                    >
                      <Typography sx={primaryTextCss}>
                        {row.ip_address || "-"}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: "center",
                        minWidth: typeof actionHeader.minWidth === 'object' 
                          ? actionHeader.minWidth 
                          : actionHeader.minWidth,
                        width: typeof actionHeader.width === 'object' 
                          ? actionHeader.width 
                          : actionHeader.width,
                      }}
                      align="center"
                    >
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
          onClick={handleView}
          sx={{
            padding: "10px 14px",
            gap: "8px",
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
            primary="View"
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
      </Menu>
    </Paper>
  );
};

export default DailyLogsTable;
