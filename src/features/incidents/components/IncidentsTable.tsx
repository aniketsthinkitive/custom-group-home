import React, { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { usePermission } from "../../../hooks/usePermission";
import {
  heading,
  primaryTextCss,
  tableCellCss,
  tableContainerCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import Paginator from "../../../components/pagination/pagination";
import { OverflowTooltip } from "../../../components/overflow-tooltip";
import type { Incident } from "../types/incidents.types";
import { formatDate } from "../../../utils";

export type IncidentsTableProps = {
  page: number; // 0-based
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  data?: Incident[];
  totalPages?: number;
  totalRecords?: number;
  onViewClick?: (uuid: string) => void;
  onEditClick?: (uuid: string) => void;
  onChangeStatusClick?: (uuid: string, currentStatus: string) => void;
  onPrintClick?: (uuid: string) => void;
  /** When true, pagination is rendered by parent (e.g. AllIncidentsSection) to match Leads/Daily Logs layout */
  hidePagination?: boolean;
};

const IncidentsTable: React.FC<IncidentsTableProps> = ({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  data,
  totalPages: totalPagesProp,
  totalRecords: totalRecordsProp,
  onViewClick,
  onEditClick,
  onChangeStatusClick,
  onPrintClick,
  hidePagination = false,
}) => {
  const { hasPermission } = usePermission();
  const canEditIncident = hasPermission("incidents.edit");
  const canCloseIncident = hasPermission("incidents.close");
  const rows = (data ?? []) as Incident[];
  const totalRecords = typeof totalRecordsProp === "number" ? totalRecordsProp : rows.length;
  const totalPages = typeof totalPagesProp === "number" ? totalPagesProp : Math.max(1, Math.ceil(totalRecords / pageSize));

  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>(
    {}
  );

  // Memoize table headers with responsive widths for different screen sizes
  // Breakpoints:
  // - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
  // - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
  // - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
  // - Desktop (lg): >= 1280px - Full widths, fits within container
  // Table width is 100% of container, with minWidth set per breakpoint for horizontal scrolling
  const tableHeaders = useMemo(() => [
    {
      id: "referralId",
      label: "Referral ID",
      width: { xs: "100px", sm: "110px", md: "115px", lg: "120px" },
      minWidth: { xs: "90px", sm: "100px", md: "115px", lg: "120px" },
      align: "left" as const
    },
    {
      id: "residentName",
      label: "Residents Name",
      width: { xs: "150px", sm: "170px", md: "175px", lg: "180px" },
      minWidth: { xs: "140px", sm: "160px", md: "175px", lg: "180px" },
      align: "left" as const
    },
    {
      id: "incidentName",
      label: "Incident Name",
      width: { xs: "150px", sm: "170px", md: "175px", lg: "180px" },
      minWidth: { xs: "140px", sm: "160px", md: "175px", lg: "180px" },
      align: "left" as const
    },
    {
      id: "groupHome",
      label: "Group Home",
      width: { xs: "150px", sm: "170px", md: "175px", lg: "180px" },
      minWidth: { xs: "140px", sm: "160px", md: "175px", lg: "180px" },
      align: "left" as const
    },
    {
      id: "date",
      label: "Date",
      width: { xs: "130px", sm: "150px", md: "155px", lg: "160px" },
      minWidth: { xs: "120px", sm: "140px", md: "155px", lg: "160px" },
      align: "left" as const
    },
    {
      id: "status",
      label: "Status",
      width: { xs: "100px", sm: "110px", md: "115px", lg: "120px" },
      minWidth: { xs: "90px", sm: "100px", md: "115px", lg: "120px" },
      align: "center" as const
    },
    {
      id: "acknowledged",
      label: "Last Updated",
      width: { xs: "130px", sm: "150px", md: "155px", lg: "160px" },
      minWidth: { xs: "120px", sm: "140px", md: "155px", lg: "160px" },
      align: "left" as const
    },
    {
      id: "action",
      label: "Action",
      width: { xs: "56px", sm: "56px", md: "56px", lg: "56px" },
      minWidth: { xs: "56px", sm: "56px", md: "56px", lg: "56px" },
      align: "center" as const
    },
  ], []);

  const handleMenuOpen = useCallback((
    event: React.MouseEvent<HTMLElement>,
    rowId: string
  ) => setAnchorEl({ [rowId]: event.currentTarget }), []);

  const handleMenuClose = useCallback((rowId: string) => setAnchorEl({ [rowId]: null }), []);

  const getColAlign = useCallback((id: string) => tableHeaders.find((h) => h.id === id)?.align ?? "left", [tableHeaders]);

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
          // Ensure container can scroll when content overflows
          position: "relative",
          // ✅ Scrollbar styling - show scrollbars when needed
          scrollbarWidth: "thin",
          scrollbarColor: "#D1D5DB #F3F4F6",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
            display: "block", // Always show scrollbar when content overflows
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
          // Ensure smooth scrolling
          scrollBehavior: "smooth",

          "& .MuiTable-root": {
            borderCollapse: "separate",
            borderBottom: "1px solid #ECEFF4",
            borderSpacing: 0,
            tableLayout: "auto", // Auto layout allows columns to maintain their widths
            width: "100%", // Table takes full width of container
            // Calculate minimum width based on breakpoints for horizontal scroll
            // Mobile: 90 + 140 + 140 + 140 + 120 + 90 + 120 + 56 = 896px
            // Tablet: 100 + 160 + 160 + 160 + 140 + 100 + 140 + 56 = 1016px
            // Laptop: 115 + 175 + 175 + 175 + 155 + 115 + 155 + 56 = 1121px
            // Desktop: 120 + 180 + 180 + 180 + 160 + 120 + 160 + 56 = 1156px
            minWidth: {
              xs: "896px",   // Mobile: < 600px
              sm: "1016px",  // Tablet: 600px - 959px
              md: "1121px",  // Laptop: 960px - 1279px
              lg: "1156px",  // Desktop: >= 1280px
            },
            // Ensure table doesn't shrink below minWidth
            flexShrink: 0,
            // Force table to maintain minimum width for scrolling
            display: "table",
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
            // Ensure header cells maintain their width and don't shrink
            boxSizing: "border-box",
            flexShrink: 0,
          },
          "& .MuiTableHead-root .MuiTableCell-root:last-of-type": {
            overflow: "visible", // Allow content to be visible for scrolling
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
              // Ensure cells maintain their width and don't shrink
              boxSizing: "border-box",
              // Prevent cells from shrinking below their minWidth
              minWidth: "fit-content",
            },
          },
        }}
      >
        <Table stickyHeader aria-label="incidents table" sx={tableCellCss}>
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
                      textAlign: header.align,
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
            {rows.length === 0 ? (
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
                      No Records Found
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const referralIdHeader = tableHeaders[0];
                const residentNameHeader = tableHeaders[1];
                const incidentNameHeader = tableHeaders[2];
                const groupHomeHeader = tableHeaders[3];
                const dateHeader = tableHeaders[4];
                const statusHeader = tableHeaders[5];
                const acknowledgedHeader = tableHeaders[6];
                const actionHeader = tableHeaders[7];

                return (
                  <TableRow
                    key={row.id || `row-${row.date}`}
                    sx={{
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    {/* Referral ID */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("referralId"),
                        minWidth: typeof referralIdHeader.minWidth === 'object'
                          ? referralIdHeader.minWidth
                          : referralIdHeader.minWidth,
                        width: typeof referralIdHeader.width === 'object'
                          ? referralIdHeader.width
                          : referralIdHeader.width,
                      }}
                    >
                      <Typography sx={primaryTextCss}>{row.referral_number}</Typography>
                    </TableCell>

                    {/* Residents Name */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("residentName"),
                        minWidth: typeof residentNameHeader.minWidth === 'object'
                          ? residentNameHeader.minWidth
                          : residentNameHeader.minWidth,
                        width: typeof residentNameHeader.width === 'object'
                          ? residentNameHeader.width
                          : residentNameHeader.width,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          gap: "8px",
                          height: "100%",
                          minWidth: 0,
                        }}
                      >
                        <Avatar
                          src={row?.resident_details?.avatar_url || ""}
                          sx={{ width: 32, height: 32, borderRadius: "999px" }}
                        >
                          {!row?.resident_details?.avatar_url &&
                            row.residentName
                              ?.split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                          <OverflowTooltip
                            text={row.residentName || "-"}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              height: "32px",
                              lineHeight: "32px",
                              textAlign: "left !important",
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

                    {/* Incident Name */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("incidentName"),
                        minWidth: typeof incidentNameHeader.minWidth === 'object'
                          ? incidentNameHeader.minWidth
                          : incidentNameHeader.minWidth,
                        width: typeof incidentNameHeader.width === 'object'
                          ? incidentNameHeader.width
                          : incidentNameHeader.width,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <OverflowTooltip
                          text={row?.incident_name && String(row.incident_name).trim() ? String(row.incident_name) : "-"}
                          sx={{ textAlign: "left !important" }}
                        />
                      </Box>
                    </TableCell>

                    {/* Group Home */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("groupHome"),
                        minWidth: typeof groupHomeHeader.minWidth === 'object'
                          ? groupHomeHeader.minWidth
                          : groupHomeHeader.minWidth,
                        width: typeof groupHomeHeader.width === 'object'
                          ? groupHomeHeader.width
                          : groupHomeHeader.width,
                      }}
                    >
                      <Box sx={{ minWidth: 0, width: "100%" }}>
                        <OverflowTooltip
                          text={(row.resident_details?.group_home?.name ?? row.groupHome) || "-"}
                          sx={{
                            textAlign: "left !important",
                            maxWidth: typeof groupHomeHeader.width === 'object'
                              ? groupHomeHeader.width
                              : groupHomeHeader.width,
                          }}
                        />
                      </Box>
                    </TableCell>

                    {/* Date */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("date"),
                        minWidth: typeof dateHeader.minWidth === 'object'
                          ? dateHeader.minWidth
                          : dateHeader.minWidth,
                        width: typeof dateHeader.width === 'object'
                          ? dateHeader.width
                          : dateHeader.width,
                      }}
                    >
                      <Typography sx={primaryTextCss}>{formatDate(row.date)}</Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("status"),
                        minWidth: typeof statusHeader.minWidth === 'object'
                          ? statusHeader.minWidth
                          : statusHeader.minWidth,
                        width: typeof statusHeader.width === 'object'
                          ? statusHeader.width
                          : statusHeader.width,
                      }}
                    >
                      {(() => {
                        // 5-state status → label + colour palette
                        const STATUS_META: Record<
                          string,
                          { label: string; bg: string; fg: string }
                        > = {
                          DRAFT: { label: "Draft", bg: "#F2F4F7", fg: "#475467" },
                          PM_REVIEW_PENDING: { label: "Review Pending", bg: "#FEF3C7", fg: "#92400E" },
                          COMPLETED: { label: "Completed", bg: "#E8F5E9", fg: "#2E7D32" },
                          ACKNOWLEDGED: { label: "Acknowledged", bg: "#ECFDF3", fg: "#027A48" },
                        };
                        const meta = STATUS_META[row.status as string] ?? {
                          label: row.status ?? "—",
                          bg: "#F2F4F7",
                          fg: "#475467",
                        };
                        return (
                          <Chip
                            label={meta.label}
                            size="small"
                            sx={{
                              backgroundColor: meta.bg,
                              color: meta.fg,
                              fontWeight: 500,
                              fontSize: "12px",
                              height: "24px",
                              "& .MuiChip-label": {
                                overflow: "visible",
                                whiteSpace: "nowrap",
                                display: "block",
                              },
                            }}
                          />
                        );
                      })()}
                    </TableCell>

                    {/* Acknowledged */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("acknowledged"),
                        minWidth: typeof acknowledgedHeader.minWidth === 'object'
                          ? acknowledgedHeader.minWidth
                          : acknowledgedHeader.minWidth,
                        width: typeof acknowledgedHeader.width === 'object'
                          ? acknowledgedHeader.width
                          : acknowledgedHeader.width,
                      }}
                    >
                      <Typography sx={primaryTextCss}>
                        {formatDate(row.updatedAt || row.acknowledgedAt)}
                      </Typography>
                    </TableCell>

                    {/* Action */}
                    <TableCell
                      sx={{
                        ...heading,
                        textAlign: getColAlign("action"),
                        minWidth: typeof actionHeader.minWidth === 'object'
                          ? actionHeader.minWidth
                          : actionHeader.minWidth,
                        width: typeof actionHeader.width === 'object'
                          ? actionHeader.width
                          : actionHeader.width,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, row.id)}
                          sx={{
                            width: 24,
                            height: 24,
                            padding: 0,
                            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: "18px", color: "#989998" }} />
                        </IconButton>
                      </Box>
                      <Menu
                        anchorEl={anchorEl[row.id] || null}
                        open={Boolean(anchorEl[row.id])}
                        onClose={() => handleMenuClose(row.id)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                      >
                        <MenuItem
                          onClick={() => {
                            handleMenuClose(row.id);
                            onViewClick?.(row.id);
                          }}
                        >
                          View
                        </MenuItem>
                        <Tooltip title={!canEditIncident ? "You don't have permission" : ""} placement="left" arrow>
                          <span>
                            <MenuItem
                              disabled={row.status === "COMPLETED" || row.status === "ACKNOWLEDGED" || !canEditIncident || row.resident_status === "MOVED_OUT"}
                              onClick={() => {
                                handleMenuClose(row.id);
                                onEditClick?.(row.id);
                              }}
                            >
                              Edit
                            </MenuItem>
                          </span>
                        </Tooltip>
                        {/*
                          Legacy "Mark As Closed" was a one-step OPEN↔CLOSED
                          toggle. Under the new 5-state workflow, transitions
                          (Start / Submit for Review / Sign & Complete /
                          Send Back / Acknowledge) all live in the edit drawer
                          footer, so the row-level shortcut is gone.
                        */}
                        <MenuItem
                          onClick={() => {
                            handleMenuClose(row.id);
                            onPrintClick?.(row.id);
                          }}
                        >
                          Generate PDF
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination row - only when not lifted to parent */}
      {!hidePagination && (
        <Box
          sx={{
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
          }}
        >
          <Paginator
            page={page}
            totalPages={totalPages}
            totalRecord={totalRecords}
            defaultSize={pageSize}
            onPageChange={(_e, newPage) => onPageChange(newPage)}
            onRecordsPerPageChange={(newSize) => {
              onPageSizeChange(newSize);
              onPageChange(0);
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default IncidentsTable;
