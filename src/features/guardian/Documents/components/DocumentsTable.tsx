import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Grid,
  Avatar,
  IconButton,
  Typography,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useNavigate } from "react-router-dom";
import {
  heading,
  primaryTextCss,
  tableCellCss,
  tableContainerCss,
} from "../../../../components/common-table/widgets/common-table-widgets";
import Paginator from "../../../../components/pagination/pagination";
import { formatDate } from "../../../../utils";
import { OverflowTooltip } from "../../../../components/overflow-tooltip";

const tableHeaders = [
  { id: "referralId", label: "Referral ID", width: "140px", align: "left" as const },
  { id: "residentName", label: "Residents Name", width: "300px", align: "left" as const },
  { id: "groupHome", label: "Group Home", width: "240px", align: "left" as const },
  { id: "date", label: "Date", width: "210px", align: "left" as const },
  { id: "action", label: "Action", width: "80px", align: "center" as const },
];

const getColWidth = (id: string) => tableHeaders.find((h) => h.id === id)?.width;
const getColAlign = (id: string) => tableHeaders.find((h) => h.id === id)?.align ?? "left";

const baseCellSx = {
  paddingLeft: "8px !important",
  paddingRight: "8px !important",
  paddingTop: "10px !important",
  paddingBottom: "10px !important",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  fontSize: "13px",
  color: "#101828",
  borderBottom: "1px solid #EEF1F4",
};

type Props = {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  data?: any[];
  onDeleteClick?: (row: any) => void;
};

const DocumentsTable: React.FC<Props> = ({
  page,
  pageSize,
  totalRecords,
  totalPages,
  onPageChange,
  onPageSizeChange,
  data = [],
  onDeleteClick,
}) => {
  const navigate = useNavigate();

  const handlePreview = (row: any) => {
    if (row.lead_uuid) navigate(`/portal/documents/${row.lead_uuid}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase();
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
              minWidth: 0,
              overflowY: "auto",
              overflowX: "auto",
              scrollbarWidth: "thin",
              msOverflowStyle: "none",
              scrollbarColor: "#D1D5DB #F3F4F6",
              "&::-webkit-scrollbar": {
                height: "6px",
                display: "block",
              },
              "&::-webkit-scrollbar:vertical": {
                display: "none",
                width: 0,
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
                tableLayout: "fixed",
              },
              "& .MuiTableHead-root .MuiTableCell-root": {
                backgroundColor: "#F2F7FA",
                borderBottom: "1px solid #E3ECEF",
                color: "#30353A",
                padding: "10px 8px",
                paddingLeft: "8px",
                position: "sticky",
                top: 0,
                zIndex: 2,
                boxShadow: "0 1px 0 0 #E3ECEF",
              },
              "& .MuiTableHead-root .MuiTableRow-root .MuiTableCell-root:first-of-type": {
                paddingLeft: "8px",
              },
              "& .MuiTableHead-root .MuiTableRow-root .MuiTableCell-root:last-of-type": {
                paddingRight: "8px",
              },
              "& .MuiTableBody-root .MuiTableRow-root": {
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.01)",
                },
              },
              "& .MuiTableBody-root .MuiTableCell-root": {
                borderBottom: "1px solid #EEF1F4",
                padding: "10px 8px",
                paddingLeft: "8px",
                fontSize: "13px",
                color: "#101828",
              },
              "& .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:first-of-type": {
                paddingLeft: "8px",
              },
              "& .MuiTableBody-root .MuiTableRow-root .MuiTableCell-root:last-of-type": {
                paddingRight: "8px",
              },
              // Last row: stronger bottom border to match separator above pagination (as in Appointments)
              "& .MuiTableBody-root .MuiTableRow-root:last-child .MuiTableCell-root": {
                borderBottom: "1px solid #E7E9EB",
              },
            }}
          >
            <Table
              stickyHeader
              aria-label="documents table"
              sx={{ ...tableCellCss, tableLayout: "fixed", width: "100%" }}
            >
              <colgroup>
                <col style={{ width: getColWidth("referralId") }} />
                <col style={{ width: getColWidth("residentName") }} />
                <col style={{ width: getColWidth("groupHome") }} />
                <col style={{ width: getColWidth("date") }} />
                <col style={{ width: getColWidth("action") }} />
              </colgroup>

              <TableHead>
                <TableRow sx={{ height: 42 }}>
                  {tableHeaders.map((header) => (
                    <TableCell
                      key={header.id}
                      sx={{
                        ...heading,
                        width: header.width,
                        minWidth: header.width,
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
                          fontSize: "13.5px",
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
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {(!Array.isArray(data) || data.filter((r: any) => r?.lead_uuid && typeof r?.resident_name === "string").length === 0) ? (
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
                          No residents found.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  data
                    .filter((row: any) => row?.lead_uuid && typeof row?.resident_name === "string")
                    .map((row) => {
                      const rowId = row.lead_uuid || row.id;
                      return (
                        <TableRow key={rowId} hover sx={{ backgroundColor: "#FFFFFF" }}>
                          {/* Referral ID */}
                          <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("referralId") }}>
                            <Typography sx={{ ...primaryTextCss, margin: 0, padding: 0 }}>
                              {row.referral_number}
                            </Typography>
                          </TableCell>

                          {/* Residents Name */}
                          <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("residentName") }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                cursor: "pointer",
                              }}
                              onClick={() => handlePreview(row)}
                            >
                              <Avatar
                                src={row.avatarUrl || undefined}
                                sx={{ width: 32, height: 32, fontSize: 13 }}
                              >
                                {!row.avatarUrl && getInitials(row.resident_name)}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <OverflowTooltip
                                  text={row.resident_name || "-"}
                                  sx={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: "#0B5ED7",
                                    textAlign: "left",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                />
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Group Home */}
                          <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("groupHome") }}>
                            <Box sx={{ minWidth: 0, width: "100%" }}>
                              <OverflowTooltip
                                text={row.group_home || "-"}
                                sx={{
                                  textAlign: "left",
                                  margin: 0,
                                  padding: 0,
                                }}
                              />
                            </Box>
                          </TableCell>

                          {/* Date */}
                          <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("date") }}>
                            <Typography sx={{ ...primaryTextCss, margin: 0, padding: 0 }}>
                              {formatDate(row.date)}
                            </Typography>
                          </TableCell>

                          {/* Action */}
                          <TableCell sx={{ ...baseCellSx, textAlign: getColAlign("action") }}>
                            <IconButton
                              size="small"
                              onClick={() => handlePreview(row)}
                              sx={{
                                padding: "4px",
                                borderRadius: "6px",
                                "&:hover": {
                                  backgroundColor: "rgba(67, 147, 34, 0.04)",
                                },
                              }}
                            >
                              <VisibilityOutlinedIcon sx={{ fontSize: 18, color: "#2C2D2C" }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Pagination row - match Appointments table (no borderTop, same padding as Appointments) */}
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
          onPageChange={(_, p) => onPageChange(p)}
          onRecordsPerPageChange={(s) => {
            onPageSizeChange(s);
            onPageChange(0);
          }}
        />
      </Grid>
    </Grid>
  );
};

export default DocumentsTable;
