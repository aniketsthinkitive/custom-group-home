import React, { useMemo } from "react";
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
  Typography,
  IconButton,
  Chip,
  Grid,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import dayjs from "dayjs";
import Paginator from "../../../../components/pagination/pagination";
import { formatDate } from "../../../../utils";
import type { CarePlan } from "../types/carePlan.types";
import { useNavigate } from "react-router-dom";
import { OverflowTooltip } from "../../../../components/overflow-tooltip";
import { heading, primaryTextCss } from "../../../../components/common-table/widgets/common-table-widgets";

const headers = [
  { id: "referralId", label: "Referral ID", width: 150 },
  { id: "residentName", label: "Residents Name", width: 200 },
  { id: "groupHome", label: "Group Home", width: 180 },
  { id: "status", label: "Status", width: 120 },
  { id: "date", label: "Date", width: 180 },
  { id: "action", label: "Action", width: 72 },
];


type CarePlansTableProps = {
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  data?: CarePlan[];
  totalRecords?: number;
  totalPages?: number;
  onViewClick?: (uuid: string) => void;
};

const CarePlansTable = ({
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  data = [],
  totalRecords: totalRecordsProp,
  totalPages: totalPagesProp,
  onViewClick,
}: CarePlansTableProps) => {
  const navigate = useNavigate();

  // Server-side pagination: data is already the current page; use totalRecords/totalPages when provided
  const totalRecords = totalRecordsProp ?? data.length;
  const totalPages = totalPagesProp ?? Math.max(1, Math.ceil(data.length / pageSize));
  const rows = data;

  const handleResidentClick = (row: CarePlan) => {
    navigate(`/portal/care-plan/${row.leadUuid}`, { state: { resident: row } });
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
              flex: 1,
              minHeight: 0,
              backgroundColor: "#FFFFFF",
              overflowX: "auto",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
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
                padding: "12px 16px",
              },


              "& .MuiTableBody-root .MuiTableRow-root": {
                "&:hover": { backgroundColor: "rgba(0,0,0,0.01)" },
              },
              "& .MuiTableBody-root .MuiTableCell-root": {
                borderBottom: "1px solid #EEF1F4",
                padding: "12px 16px",
                fontSize: "13px",
                color: "#101828",
              },
            }}
          >
            {/* ✅ Put width on Table to force overflow */}
            <Table stickyHeader sx={{ width: "100%" }}>
              <colgroup>
                {headers.map((h) => (
                  <col key={h.id} style={{ width: h.width }} />
                ))}
              </colgroup>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableCell
                      key={h.id}
                      sx={{
                        width: h.width,
                        minWidth: h.width,
                        whiteSpace: "nowrap",
                        textAlign: h.id === "status" ? "center" : "left",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "13.5px",
                          fontWeight: 600,
                          lineHeight: "1.2",
                          color: "#30353A",
                          fontFamily: '"Helvetica Neue", Arial, sans-serif',
                          textAlign: h.id === "status" ? "center" : "left",
                        }}
                      >
                        {h.label}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length} sx={{ p: 0 }}>
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
                ) : rows.map((row: CarePlan) => {
                  const avatarSrc =
                    (row as any).avatar_url || (row as any).avatarUrl || undefined;

                  const initials =
                    row.residentName
                      ?.split(" ")
                      ?.map((w: string) => w?.[0])
                      ?.join("")
                      ?.slice(0, 2)
                      ?.toUpperCase() || "";

                  return (
                    <TableRow key={row.uuid}>
                      {/* Referral ID */}
                      <TableCell align="left" sx={{ padding: "12px 16px" }}>
                        <Typography
                          sx={{
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "1.15",
                            color: "#30353A",
                          }}
                          noWrap
                        >
                          {row.referral_number || "-"}
                        </Typography>
                      </TableCell>

                      {/* Resident */}
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            cursor: "pointer",
                            minWidth: 0,
                            "&:hover .residentName": {
                              textDecoration: "underline",
                              color: "#1570EF",
                            },
                          }}
                          onClick={() => handleResidentClick(row)}
                        >
                          <Avatar
                            src={avatarSrc}
                            alt={row.residentName || "Resident"}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "999px",
                              fontSize: "14px",
                              fontWeight: 500,
                              flexShrink: 0,
                            }}
                          >
                            {!avatarSrc ? initials : null}
                          </Avatar>

                          <Typography
                            className="residentName"
                            sx={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: "#1976D2",
                              minWidth: 0,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              transition: "all 0.2s",
                              maxWidth: 200,
                            }}
                          >
                            {row.residentName || "—"}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Group Home */}
                      <TableCell>
                        <Box sx={{ minWidth: 0 }}>
                          <OverflowTooltip
                            text={row.groupHome || "—"}
                            sx={{
                              fontSize: 14,
                              color: "#374151",
                              textAlign: "left",
                            }}
                          />
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        {(row.status === "MOVED_OUT" || row.status === "moved_out") ? (
                          <Chip
                            label="Moved Out"
                            size="small"
                            sx={{
                              backgroundColor: "#FEE2E2",
                              color: "#DC2626",
                              fontWeight: 500,
                              fontSize: "12px",
                              height: "24px",
                              "& .MuiChip-label": {
                                padding: "0 8px",
                              },
                            }}
                          />
                        ) : (
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              backgroundColor: "#D1FAE5",
                              color: "#059669",
                              fontWeight: 500,
                              fontSize: "12px",
                              height: "24px",
                              "& .MuiChip-label": {
                                padding: "0 8px",
                              },
                            }}
                          />
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography
                          sx={{ fontSize: 14, color: "#374151" }}
                          noWrap
                        >
                          {row.createdAt
                            ? dayjs(row.createdAt).format("MM/DD/YYYY hh:mm A")
                            : row.date
                              ? formatDate(row.date)
                              : "—"}
                        </Typography>
                      </TableCell>

                      {/* Action */}
                      <TableCell align="left">
                        <IconButton
                          onClick={() => handleResidentClick(row)}
                          sx={{
                            p: 0.5,
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
                      </TableCell>
                    </TableRow>
                  );
                })}
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
      </Grid>
    </Grid>
  );
};

export default CarePlansTable;
