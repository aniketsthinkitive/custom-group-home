import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Box,
  Avatar,
  Chip,
  IconButton,
  Typography,
  Paper,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate } from "react-router-dom";
import {
  primaryTextCss,
} from "../../../../components/common-table/widgets/common-table-widgets";
import Paginator from "../../../../components/pagination/pagination";
import type { Incident } from "../types/incidents.types";
import { formatDate } from "../../../../utils";
import { useAuth } from "../../../../hooks/useAuth";
import ViewResidentIncidentDrawer from "./ViewResidentIncidentDrawer";
import { Dayjs } from "dayjs";
import { OverflowTooltip } from "../../../../components/overflow-tooltip";

const tableHeaders = [
  { id: "referralId", label: "Referral ID", width: "150px" },
  { id: "residentName", label: "Residents Name", width: "200px" },
  { id: "incidentName", label: "Incident Name", width: "200px" },
  { id: "groupHome", label: "Group Home", width: "180px" },
  { id: "date", label: "Date", width: "180px" },
  { id: "status", label: "Status", width: "120px" },
  { id: "action", label: "Action", width: "72px" },
];

export type IncidentsTableProps = {
  page: number; // 0-based
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  data?: Incident[];
  /** When using server-side pagination, pass total count from API */
  totalRecords?: number;
  /** When using server-side pagination, pass total pages from API */
  totalPages?: number;
  onViewClick?: (uuid: string) => void;
};

const IncidentsTable: React.FC<IncidentsTableProps> = ({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  data,
  totalRecords: totalRecordsProp,
  totalPages: totalPagesProp,
  onViewClick,
}) => {
  const [selectedIncidentUuid, setSelectedIncidentUuid] =
    useState<string | undefined>(undefined);

  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const rows = (data ?? []) as Incident[];
  // Server-side: use props; client-side: derive from current data
  const totalRecords = totalRecordsProp ?? rows.length;
  const totalPages = totalPagesProp ?? Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = totalRecordsProp !== undefined ? rows : rows.slice(page * pageSize, page * pageSize + pageSize);

  const getColWidth = (id: string) => tableHeaders.find((h) => h.id === id)?.width;

  const baseCellSx = {
    paddingLeft: "16px !important",
    paddingRight: "16px !important",
    paddingTop: "12px !important",
    paddingBottom: "12px !important",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  };
  const [overflowRowId, setOverflowRowId] = useState<string | number | null>(null);

  const handleResidentClick = (row: any) => {
    // console.log("row:", row);
    const leadUuid = row.lead_uuid;

    if (!leadUuid) {
      console.error("Lead UUID missing", row);
      return;
    }

    // Only GUARDIAN & AGENT (as you wanted)
    navigate(`/portal/incidents/${leadUuid}`);
  };

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
          "&&": { flex: 1 },
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
              height: "100%",
              backgroundColor: "#FFFFFF",
              overflowX: "auto",
              overflowY: "auto",
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
              "& .MuiTable-root": {
                borderCollapse: "separate",
                borderSpacing: 0,
                tableLayout: "fixed",
                width: "100%",
                minWidth: {
                  xs: "1050px",
                  sm: "1200px",
                  md: "1344px",
                  lg: "1414px",
                },
                display: "table",
                flexShrink: 0,
              },
              "& .MuiTableHead-root .MuiTableCell-root": {
                backgroundColor: "#F2F7FA",
                borderBottom: "1px solid #E3ECEF",
                color: "#30353A",
                padding: "12px 16px",
              },
              "& .MuiTableBody-root .MuiTableRow-root": {
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.01)",
                },
              },
              "& .MuiTableBody-root .MuiTableCell-root": {
                borderBottom: "1px solid #EEF1F4",
                padding: "12px 16px",
                fontSize: "13px",
                color: "#101828",
                textAlign: "left",
              },
            }}
          >
            <Table
              stickyHeader
              aria-label="incidents table"
              sx={{
                tableLayout: "fixed",
                width: "100%",
                backgroundColor: "#FFFFFF",
                "& .MuiTableCell-head": {
                  padding: "12px 16px",
                  textAlign: "left !important",
                },
                "& .MuiTableCell-body": {
                  padding: "12px 16px",
                  textAlign: "left !important",
                },
              }}
            >

              <colgroup>
                <col style={{ width: getColWidth("referralId") }} />
                <col style={{ width: getColWidth("residentName") }} />
                <col style={{ width: getColWidth("incidentName") }} />
                <col style={{ width: getColWidth("groupHome") }} />
                <col style={{ width: getColWidth("date") }} />
                <col style={{ width: getColWidth("status") }} />
                <col style={{ width: getColWidth("action") }} />
              </colgroup>

              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableCell
                      key={header.id}
                      sx={{
                        ...baseCellSx,
                        textAlign: "left",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "13.5px",
                          fontWeight: 600,
                          lineHeight: "1.2",
                          color: "#30353A",
                          fontFamily: '"Helvetica Neue", Arial, sans-serif',
                          margin: 0,
                          padding: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {header.label}
                      </Typography>
                    </TableCell>
                  ))}

                </TableRow>
              </TableHead>

              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} sx={{ p: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 220,
                          width: "100%",
                        }}
                      >
                        <Typography sx={{ fontSize: 14, color: "#757775" }}>
                          No records Found
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    {/* Referral ID */}
                    <TableCell sx={{ ...baseCellSx, textAlign: "left" }}>
                      <Typography sx={{ ...primaryTextCss, margin: 0, padding: 0 }}>{row.referral_number}</Typography>
                    </TableCell>


                    {/* Residents Name */}
                    <TableCell sx={{ ...baseCellSx, textAlign: "left" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          cursor: "pointer",
                        }}
                        onClick={() => handleResidentClick(row)}
                      >
                        <Avatar
                          src={row.avatarUrl}
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: 13,
                          }}
                        >
                          {!row.avatarUrl &&
                            row.residentName
                              ?.split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                        </Avatar>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#0B5ED7",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {row.residentName}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Incident Name */}
                    <TableCell sx={{ ...baseCellSx, textAlign: "left" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <OverflowTooltip
                          text={(row as any).incident_name || (row as any).incidentName || "-"}
                          sx={{
                            textAlign: "left",
                            margin: 0,
                            padding: 0,
                          }}
                        />
                      </Box>
                    </TableCell>

                    {/* Group Home */}
                    <TableCell sx={{ ...baseCellSx, textAlign: "left" }}>
                      <Box sx={{ minWidth: 0 }}>
                        <OverflowTooltip
                          text={row.groupHome || "-"}
                          sx={{
                            textAlign: "left",
                            margin: 0,
                            padding: 0,
                          }}
                        />
                      </Box>
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ ...baseCellSx, textAlign: "left" }}>
                      <Typography sx={{ ...primaryTextCss, margin: 0, padding: 0 }}>
                        {formatDate(row.incident_datetime || row.date) || "-"}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ ...baseCellSx, textAlign: "left" }}>
                      {(() => {
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

                    {/* Action */}
                    <TableCell sx={{ ...baseCellSx, textAlign: "left" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          width: "100%",
                          margin: 0,
                          padding: 0,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleResidentClick(row)}
                        >
                          <VisibilityOutlinedIcon
                            sx={{ fontSize: "18px", color: "#313336" }}
                          />
                        </IconButton>

                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid
        size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        sx={{
          "&&": { flexShrink: 0, marginTop: "auto" },
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
        <ViewResidentIncidentDrawer
          open={!!selectedIncidentUuid}
          incidentUuid={selectedIncidentUuid}
          onClose={() => setSelectedIncidentUuid(undefined)}
        />
      </Grid>
    </Grid>
  );
};

export default IncidentsTable;

