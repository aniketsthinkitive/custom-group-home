import React from "react";
import {
  Avatar,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";
import {
  heading,
  primaryTextCss,
  tableCellCss,
  tableContainerCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import TableSkeleton from "../../../components/common-table/TableSkeleton";
import { OverflowTooltip } from "../../../components/overflow-tooltip";

// ✅ Import your drawer
import EditResidentProfileDrawer from "./EditResidentProfileDrawer";

/* ================= PROPS ================= */

export type ResidentsTableProps = {
  data: any[];
  loading?: boolean;
  error?: boolean;
};

/* ================= HEADERS ================= */

// Responsive table headers with breakpoint-specific widths
// Breakpoints:
// - Mobile (xs): < 600px - Compact widths, horizontal scroll enabled
// - Tablet (sm): 600px - 959px - Medium widths, horizontal scroll enabled
// - Laptop (md): 960px - 1279px - Standard widths, horizontal scroll enabled
// - Desktop (lg): >= 1280px - Full widths, fits within container
const tableHeaders = [
  { 
    id: "name", 
    label: "Residents Name", 
    width: { xs: "180px", sm: "200px", md: "210px", lg: "220px" },
    minWidth: { xs: "160px", sm: "180px", md: "200px", lg: "220px" },
    align: "left" 
  },
  { 
    id: "groupHome", 
    label: "Group Home", 
    width: { xs: "150px", sm: "180px", md: "200px", lg: "220px" },
    minWidth: { xs: "130px", sm: "160px", md: "180px", lg: "220px" },
    align: "left" 
  },
  { 
    id: "room", 
    label: "Room", 
    width: { xs: "100px", sm: "110px", md: "115px", lg: "120px" },
    minWidth: { xs: "90px", sm: "100px", md: "110px", lg: "120px" },
    align: "center" 
  },
  { 
    id: "status", 
    label: "Status", 
    width: { xs: "100px", sm: "110px", md: "115px", lg: "120px" },
    minWidth: { xs: "90px", sm: "100px", md: "110px", lg: "120px" },
    align: "center" 
  },
  { 
    id: "action", 
    label: "Action", 
    width: { xs: "80px", sm: "90px", md: "100px", lg: "120px" },
    minWidth: { xs: "80px", sm: "80px", md: "90px", lg: "120px" },
    align: "center" 
  },
];

const ResidentsTable: React.FC<ResidentsTableProps> = ({
  data,
  loading,
  error,
}) => {
  const TruncatedText: React.FC<{
    text: string;
    sx?: React.ComponentProps<typeof Typography>["sx"];
    onClick?: () => void;
  }> = ({ text, sx, onClick }) => {
    const ref = React.useRef<HTMLSpanElement | null>(null);
    const [overflow, setOverflow] = React.useState(false);
    React.useEffect(() => {
      const el = ref.current;
      if (el) {
        setOverflow(el.scrollWidth > el.clientWidth);
      }
    }, [text]);
    const content = (
      <Typography
        component="span"
        ref={ref}
        onClick={onClick}
        sx={sx}
      >
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
  const navigate = useNavigate();

  // ✅ action menu state
  const [actionAnchorEl, setActionAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = React.useState<any>(null);
  const openActionMenu = Boolean(actionAnchorEl);
  const { hasPermission } = usePermission();

const canEditLead = hasPermission("leads.edit"); 
  // ✅ edit drawer state
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  const handleOpenActions = (e: React.MouseEvent<HTMLElement>, row: any) => {
    setActionAnchorEl(e.currentTarget);
    setSelectedRow(row); // ✅ store clicked row so we can prefill
  };

  const handleCloseActions = () => {
    setActionAnchorEl(null);
  };

  const handleEdit = () => {
    if (!selectedRow?.lead_uuid) return;
    if (selectedRow?.status === "MOVED_OUT") return;

    // ✅ open drawer
    setIsEditOpen(true);

    // ✅ close menu
    handleCloseActions();
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  // ✅ Print handler (added as requested)
  const handlePrint = () => {
    window.print();
  };

  /* ---------- Error ---------- */
  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">Failed to load residents</Typography>
      </Paper>
    );
  }

  const rows = Array.isArray(data) ? data : [];

  return (
    <>
      <Paper
        sx={{
          overflow: "hidden",
          flex: 1,
          minHeight: 0,
          width: "100%",
          border: "1px solid #E3ECEF",
          borderRadius: { xs: "6px", sm: "8px" },
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <TableSkeleton
            headers={tableHeaders.map((h, idx) => ({
              id: idx === 0 ? "clientName" : h.id,
              label: h.label,
              width: typeof h.width === "object" ? h.width.lg : h.width,
            }))}
            rowCount={5}
            hasCheckbox={false}
            hasAvatar={true}
            hasActions={true}
          />
        ) : (
          <TableContainer
            sx={{
              flex: 1,
              height: "100%",
              width: "100%",
              overflowX: "auto", // Enable horizontal scrolling when needed
              overflowY: "auto",
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
              
              backgroundColor: "#FFFFFF",
              minHeight: 0,
              "& .MuiTable-root": {
                borderCollapse: "separate",
                borderSpacing: 0,
                width: "100%", // Table takes full width of container
                // Calculate minimum width based on breakpoints for horizontal scroll
                // Mobile: 160 + 130 + 90 + 90 + 80 = 550px
                // Tablet: 180 + 160 + 100 + 100 + 80 = 620px
                // Laptop: 200 + 180 + 110 + 110 + 90 = 690px
                // Desktop: 220 + 220 + 120 + 120 + 120 = 800px
                minWidth: {
                  xs: "550px",   // Mobile: < 600px
                  sm: "620px",   // Tablet: 600px - 959px
                  md: "690px",   // Laptop: 960px - 1279px
                  lg: "800px",   // Desktop: >= 1280px
                },
              },
              "& .MuiTableHead-root": {
                position: "sticky",
                top: 0,
                zIndex: 10,
                "& .MuiTableCell-root": {
                  backgroundColor: "#F2F7FA",
                  borderBottom: "1px solid #E3ECEF",
                  height: { xs: "40px", sm: "42px", md: "44px" },
                  padding: { 
                    xs: "8px 8px",      // Mobile: compact padding
                    sm: "8px 12px",     // Tablet: medium padding
                    md: "8px 14px",     // Laptop: standard padding
                    lg: "12px 16px"     // Desktop: full padding
                  },
                  position: "sticky",
                  top: 0,
                  zIndex: 11,
                  boxSizing: "border-box",
                  whiteSpace: "nowrap", // Prevent text wrapping in headers
                },
              },
              "& .MuiTableBody-root": {
                "& .MuiTableRow-root": {
                  "&:hover": {
                    backgroundColor: "rgba(67, 147, 34, 0.02)",
                  },
                },
                "& .MuiTableCell-root": {
                  borderBottom: "1px solid #F2F7FA",
                  padding: { 
                    xs: "8px 8px",      // Mobile: compact padding
                    sm: "8px 12px",     // Tablet: medium padding
                    md: "8px 14px",     // Laptop: standard padding
                    lg: "12px 16px"     // Desktop: full padding
                  },
                  whiteSpace: "nowrap", // Prevent text wrapping in cells
                },
              },
            }}
          >
            <Table aria-label="residents table" stickyHeader sx={{ ...tableCellCss, width: "100%" }}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header, index) => {
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
                          whiteSpace: "nowrap",
                          ...(header.align && { textAlign: header.align }),
                          // Only outer corners rounded so column boundaries stay straight
                          ...(index === 0 && {
                            borderTopLeftRadius: "8px",
                          }),
                          ...(index === tableHeaders.length - 1 && {
                            borderTopRightRadius: "8px",
                          }),
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
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableHeaders.length} align="center">
                      <Typography
                        sx={{
                          padding: "40px 0",
                          color: "#989998",
                          fontSize: "14px",
                          fontFamily: '"Helvetica Neue", Arial, sans-serif',
                        }}
                      >
                        No Record Found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.resident_uuid}>
                      {/* Resident Name */}
                      <TableCell
                        sx={{
                          ...heading,
                          minWidth: tableHeaders[0].minWidth,
                          width: tableHeaders[0].width,
                        }}
                        align="left"
                      >
                        <Grid
                          container
                          alignItems="center"
                          spacing={{ xs: 1, sm: 1.5 }}
                          sx={{ cursor: "pointer" }}
                          onClick={() =>
                            navigate(`/admin/residents/${row.lead_uuid}`, {
                              state: { residentData: row },
                            })
                          }
                        >
                          <Grid>
                            <Avatar
                              src={row.avatar_url || undefined}
                              alt={row.resident_name || "Resident"}
                              sx={{
                                width: { xs: 28, sm: 30, md: 32 },
                                height: { xs: 28, sm: 30, md: 32 },
                                borderRadius: "999px",
                                fontSize: { xs: "12px", sm: "13px", md: "14px" },
                                fontWeight: 500,
                              }}
                            >
                              {!row.avatar_url &&
                                (row.resident_name
                                  ?.split(" ")
                                  ?.map((w: string) => w?.[0])
                                  ?.join("")
                                  ?.slice(0, 2)
                                  ?.toUpperCase() ||
                                  "")}
                            </Avatar>
                          </Grid>
                          <Grid>
                            <Grid
                              component="a"
                              href={`/admin/residents/${row.lead_uuid}`}
                              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/admin/residents/${row.lead_uuid}`, {
                                  state: { residentData: row },
                                });
                              }}
                              aria-label={`Open resident profile for ${row.resident_name}`}
                              sx={{
                                color: "#11466D",
                                fontSize: { xs: "12px", sm: "13px", md: "14px" },
                                fontWeight: 500,
                                lineHeight: "1.15",
                                letterSpacing: "0.8%",
                                cursor: "pointer",
                                textDecoration: "none",
                                textAlign: "left",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: { xs: "100px", sm: "140px", md: "160px", lg: "none" },
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
                              {row.resident_name?.length > 20
                                ? `${row.resident_name.substring(0, 20)}...`
                                : row.resident_name || ""}
                            </Grid>
                          </Grid>
                        </Grid>
                      </TableCell>

                      {/* Group Home */}
                      <TableCell
                        align="left"
                        sx={{
                          ...heading,
                          minWidth: tableHeaders[1].minWidth,
                          width: tableHeaders[1].width,
                        }}
                      >
                        <Grid sx={{ minWidth: 0, width: "100%" }}>
                          <OverflowTooltip
                            text={row.group_home || "-"}
                            sx={{
                              ...primaryTextCss,
                              textAlign: "left !important",
                              fontSize: { xs: "12px", sm: "13px", md: "14px" },
                              maxWidth: tableHeaders[1].width,
                            }}
                          />
                        </Grid>
                      </TableCell>

                      {/* Room */}
                      <TableCell
                        sx={{
                          ...heading,
                          minWidth: tableHeaders[2].minWidth,
                          width: tableHeaders[2].width,
                        }}
                        align="center"
                      >
                        <Typography
                          sx={{
                            ...primaryTextCss,
                            fontSize: { xs: "12px", sm: "13px", md: "14px" },
                          }}
                        >
                          {row.room_number ? `Room ${row.room_number}` : "-"}
                        </Typography>
                      </TableCell>

                      {/* Coordinator */}
                      {/* <TableCell sx={heading} align="left">
                        <Typography sx={primaryTextCss}>
                          {row.program_coordinator || "-"}
                        </Typography>
                      </TableCell> */}

                      {/* Status */}
                      <TableCell
                        align="center"
                        sx={{
                          ...heading,
                          borderBottom: "1px solid #E7E9EB",
                          minWidth: tableHeaders[3].minWidth,
                          width: tableHeaders[3].width,
                        }}
                      >
                        <Grid
                          component="span"
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            px: { xs: 1, sm: 1.5 },
                            py: 0.25,
                            borderRadius: "999px",
                            fontSize: { xs: "11px", sm: "12px", md: "12px" },
                            fontWeight: 500,
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            backgroundColor:
                              row.status === "ACTIVE" ? "#E6F4EA" : "#FDECEC",
                            color:
                              row.status === "ACTIVE" ? "#2E7D32" : "#D32F2F",
                          }}
                        >
                          {row.status === "ACTIVE" ? "Active" : "Moved Out"}
                        </Grid>
                      </TableCell>

                      {/* Action */}
                      <TableCell
                        sx={{
                          ...heading,
                          minWidth: tableHeaders[4].minWidth,
                          width: tableHeaders[4].width,
                        }}
                        align="center"
                      >
                        {row.status === "MOVED_OUT" ? (
                          <Tooltip title="Resident is Moved Out" arrow placement="top">
                            <span>
                              <IconButton
                                disabled
                                sx={{
                                  padding: "4px",
                                  borderRadius: "6px",
                                  opacity: 0.4,
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
                            </span>
                          </Tooltip>
                        ) : (
                          <IconButton
                            onClick={(e) => handleOpenActions(e, row)}
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
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Single menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={openActionMenu}
        onClose={handleCloseActions}
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
       <Tooltip
  title={!canEditLead ? "You don't have permission" : ""}
  arrow
  placement="left"
  disableHoverListener={canEditLead}
>
  <span>
    <MenuItem
      disabled={!canEditLead}
      onClick={() => {
        if (!canEditLead) return;
        handleEdit();
      }}
      sx={{
        padding: "10px 14px",
        gap: "8px",
        "&:hover": {
          backgroundColor: "rgba(67, 147, 34, 0.04)",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: "1.15",
          color: canEditLead ? "#2C2D2C" : "#B0B0B0", // 👈 grey when disabled
          fontFamily: '"Helvetica Neue", Arial, sans-serif',
        }}
      >
        Edit
      </Typography>
    </MenuItem>
  </span>
</Tooltip>
      </Menu>

      {/* ✅ Edit Drawer opens here */}
      <EditResidentProfileDrawer
        open={isEditOpen}
        onClose={handleCloseEdit}
        leadUuid={selectedRow?.lead_uuid}
        contextMode="resident"
        initialData={selectedRow}
        onSave={() => {
          handleCloseEdit();
        }}
      />
    </>
  );
};

export default ResidentsTable;
