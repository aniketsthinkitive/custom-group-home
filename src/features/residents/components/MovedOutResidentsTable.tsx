import {
  Avatar,
  Box,
  Tooltip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermission } from "../../../hooks/usePermission";
import { reAdmitLeadMutation, listResidentsQueryKey } from "../../../sdk/@tanstack/react-query.gen";
import Paginator from "../../../components/pagination/pagination";
import {
  heading,
  primaryTextCss,
  tableCellCss,
} from "../../../components/common-table/widgets/common-table-widgets";
import TableSkeleton from "../../../components/common-table/TableSkeleton";




type Props = {
  data: any[];
  loading?: boolean;
  error?: boolean;
  onReAdmit: (row: any) => void;
  // Pagination props
  page?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (event: React.ChangeEvent<unknown> | null, page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

const MovedOutResidentsTable = ({
  data,
  loading,
  error,
  onReAdmit,
  page = 0,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
}: Props) => {
  const { hasPermission } = usePermission();
  const canReAdmit = hasPermission("onboarding.readmit");
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();

  const open = Boolean(anchorEl);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    row: any
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row); // ✅ correct state
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  /* ---------- Loading / Error ---------- */
  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          height: "100%",
          m: 0,
          borderRadius: "10px",
          border: "1px solid #D0D5DD",
          boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <TableSkeleton
          headers={[
            { id: "name", label: "Name", width: "240px" },
            { id: "moveOutDate", label: "Move-out Date", width: "190px" },
            { id: "reason", label: "Reason", width: "360px" },
            { id: "action", label: "Action", width: "72px" },
          ]}
          rowCount={6}
          hasCheckbox={false}
          hasAvatar={false}
          hasActions={false}
        />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 2, borderRadius: "10px" }}>
        <Typography fontSize={14} color="error">
          Failed to load moved-out residents
        </Typography>
      </Paper>
    );
  }

  const NameCell = ({ text }: { text: string }) => {
    const ref = useRef<HTMLSpanElement | null>(null);
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
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
            fontWeight: 500,
            color: "#11466D",
            maxWidth: { xs: 120, sm: 180, md: 220 },
            display: "block",
          }}
        >
          {text}
        </Typography>
      </Tooltip>
    );
  };

  const ReasonCell = ({ text }: { text: string }) => {
    const ref = useRef<HTMLSpanElement | null>(null);
    const [overflow, setOverflow] = useState(false);
    useEffect(() => {
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
            color: "#6B7280",
            maxWidth: { xs: 180, sm: 240, md: "100%" },
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {text}
        </Typography>
      </Tooltip>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        m: 0,
        borderRadius: "10px",

        border: "1px solid #D0D5DD",
        boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",

        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{
            ...tableCellCss,
            width: "100%",
            minWidth: { xs: 800, sm: "100%" },
            tableLayout: "fixed",
          }}
        >
          {/* ================= HEADER ================= */}
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  ...heading,
                  minWidth: { xs: 160, sm: 180, md: 220 },
                  width: { xs: 180, sm: 200, md: 240 },
                }}
              >
                Name
              </TableCell>

              <TableCell
                sx={{
                  ...heading,
                  minWidth: { xs: 140, sm: 160, md: 180 },
                  width: { xs: 150, sm: 170, md: 190 },
                }}
              >
                Move-out Date
              </TableCell>

              <TableCell
                sx={{
                  ...heading,
                  minWidth: { xs: 200, sm: 260, md: 360 },
                  width: { xs: 200, sm: 260, md: "auto" },
                }}
              >
                Reason
              </TableCell>

              <TableCell
                sx={{
                  ...heading,
                  textAlign: "right",
                  width: { xs: 56, sm: 64, md: 72 },
                  minWidth: { xs: 56, sm: 64, md: 72 },
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>


          {/* ================= BODY ================= */}
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  sx={{
                    py: 4,
                    color: "#6B7280",
                    fontSize: 14,
                    height: "100%", // Let it stretch
                  }}
                >
                  No Record Found
                </TableCell>
              </TableRow>
            ) : (
              <>
                {data.map((row) => {
                  const name = row.resident_name;
                  const movedOutDate = row.check_out_date ?? "-";
                  const reason = row.reason ?? "-";

                  return (
                    <TableRow
                      key={row.resident_uuid}
                      
                      sx={{
                        height: "44px",
                        borderBottom: "1px solid #E7E9EB",
                      }}
                    >
                      {/* NAME */}
                      <TableCell
                        sx={{
                          py: 0.75,
                          width: { xs: 180, sm: 200, md: 240 },
                          minWidth: { xs: 160, sm: 180, md: 220 },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap="10px" sx={{ minWidth: 0 }}>
                          <Avatar
                            src={row.avatar_url || undefined}
                            alt={name || "Resident"}
                            sx={{ width: 28, height: 28, fontSize: 12 }}
                          >
                            {!row.avatar_url &&
                              name
                                ?.split(" ")
                                .map((w: string) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                          </Avatar>

                          <NameCell text={name} />
                        </Box>
                      </TableCell>

                      {/* MOVED-OUT DATE */}
                      <TableCell
                        sx={{
                          py: 0.75,
                          whiteSpace: "nowrap",
                          width: { xs: 150, sm: 170, md: 190 },
                          minWidth: { xs: 140, sm: 160, md: 180 },
                        }}
                      >
                        <Typography fontSize={14} noWrap title={movedOutDate}>
                          {movedOutDate}
                        </Typography>
                      </TableCell>

                      {/* REASON */}
                      <TableCell
                        sx={{
                          py: 0.75,
                          width: { xs: 200, sm: 260, md: "auto" },
                          minWidth: { xs: 200, sm: 260, md: 360 },
                        }}
                      >
                        <ReasonCell text={reason} />
                      </TableCell>

                      {/* ACTION */}
                      <TableCell
                        sx={{
                          py: 0.75,
                          width: { xs: 56, sm: 64, md: 72 },
                          minWidth: { xs: 56, sm: 64, md: 72 },
                          textAlign: "right",
                        }}
                      >
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, row)}>
                          <MoreVertIcon sx={{ fontSize: 18, color: "#989998" }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            )}
          </TableBody>

        </Table>
      </TableContainer>

      {/* Pagination at the bottom of the table */}
      {!loading && totalRecords > 0 && onPageChange && (
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
            onPageChange={onPageChange}
            onRecordsPerPageChange={onPageSizeChange}
            defaultSize={pageSize}
          />
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        disablePortal
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            borderRadius: "8px",
            minWidth: 160,
            boxShadow: "0px 4px 12px rgba(0,0,0,0.12)",
            zIndex: 1500,
          },
        }}
      >

        <Tooltip
          title={!canReAdmit ? "You don't have permission" : ""}
          arrow
          placement="left"
          disableHoverListener={canReAdmit}
        >
          <span>
            <MenuItem
              onClick={() => {
                if (selectedRow) {
                  onReAdmit(selectedRow);
                }
                handleMenuClose();
              }}
              disabled={!canReAdmit}
            >
              Re-admit
            </MenuItem>
          </span>
        </Tooltip>



      </Menu>

    </Paper>
  );
};

export default MovedOutResidentsTable;
