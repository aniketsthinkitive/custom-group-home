import React, { useState } from "react";
import {
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";
import Paginator from "../../../components/pagination/pagination";
import ConfirmationPopUp from "../../../components/confirmation-pop-up/confirmation-pop-up";
import type { CarePlanReport } from "../../../sdk/types.gen";
import { MONTHS } from "../utils/carePlanConstants";

export interface CarePlanReportsTableProps {
  data: CarePlanReport[];
  onView?: (report: CarePlanReport) => void;
  onPrint?: (report: CarePlanReport) => void;
  onDelete?: (report: CarePlanReport) => void;
  isLoading?: boolean;
}

const CarePlanReportsTable: React.FC<CarePlanReportsTableProps> = ({
  data,
  onView,
  onPrint,
  onDelete,
  isLoading,
}) => {
  const theme = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReport, setSelectedReport] = useState<CarePlanReport | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, report: CarePlanReport) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedReport(report);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReport(null);
  };

  const handleDeleteClick = () => {
    setAnchorEl(null);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedReport) {
      onDelete?.(selectedReport);
    }
    setDeleteConfirmOpen(false);
    setSelectedReport(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setSelectedReport(null);
  };

  const totalRecords = data.length;
  const totalPages = Math.ceil(totalRecords / currentPageSize);
  const startIndex = currentPage * currentPageSize;
  const currentData = data.slice(startIndex, startIndex + currentPageSize);

  const headerBase = {
    fontWeight: 500,
    backgroundColor: theme.palette.grey[50],
    color: "text.primary",
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontSize: "13px",
    py: 1.2,
    height: 44,
  };

  const headerCenter = (width: number) => ({
    ...headerBase,
    textAlign: "center" as const,
    width,
  });

  const headerLeft = (width: number) => ({
    ...headerBase,
    textAlign: "left" as const,
    width,
  });

  const cellCenter = (width: number) => ({
    textAlign: "center" as const,
    fontSize: "13px",
    py: 1.5,
    width,
    borderBottom: `1px solid ${theme.palette.divider}`,
  });

  const cellLeft = (width: number) => ({
    textAlign: "left" as const,
    fontSize: "13px",
    py: 1.5,
    width,
    borderBottom: `1px solid ${theme.palette.divider}`,
  });

  return (
    <Grid
      container
      flexDirection="column"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "6px",
          overflow: "auto",
          backgroundColor: "background.paper",
        }}
      >
        <Table
          stickyHeader
          sx={{
            tableLayout: "fixed",
            width: "100%",
            "& th, & td": { padding: "12px 16px" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={headerCenter(80)}>Sr. No</TableCell>
              <TableCell sx={headerLeft(200)}>Report Month</TableCell>
              <TableCell sx={headerLeft(150)}>Report Year</TableCell>
              <TableCell sx={headerLeft(200)}>Created At</TableCell>
              <TableCell sx={headerCenter(100)}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {currentData.map((report, index) => (
              <TableRow key={report.uuid}>
                <TableCell sx={cellCenter(80)}>{startIndex + index + 1}</TableCell>
                <TableCell sx={cellLeft(200)}>
                  {MONTHS[report.report_month - 1] || report.report_month}
                </TableCell>
                <TableCell sx={cellLeft(150)}>{report.report_year}</TableCell>
                <TableCell sx={cellLeft(200)}>
                  {dayjs(report.created_at).format("MM/DD/YYYY HH:mm A")}
                </TableCell>
                <TableCell sx={cellCenter(100)}>
                  <IconButton
                    onClick={(event) => handleMenuClick(event, report)}
                    sx={{
                      padding: "4px",
                      borderRadius: "6px",
                      "&:hover": {
                        backgroundColor: "rgba(67, 147, 34, 0.04)",
                      },
                    }}
                  >
                    <MoreVertIcon sx={{ width: 18, height: 18, color: "#2C2D2C" }} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "text.secondary", borderBottom: "none" }}>
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#FFFFFF",
              border: "1px solid #DFE5E2",
              borderRadius: "6px",
              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.08)",
              padding: "4px 0",
              minWidth: 120,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedReport) onView?.(selectedReport);
            handleMenuClose();
          }}
          sx={{
            padding: "10px 14px",
            gap: "8px",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: "18px" }}>
            <VisibilityIcon sx={{ width: 18, height: 18, color: "#2C2D2C" }} />
          </ListItemIcon>
          <ListItemText
            primary="View"
            slotProps={{
              primary: {
                sx: { fontSize: "14px", fontWeight: 400, lineHeight: "1.15", color: "#2C2D2C" },
              },
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedReport) onPrint?.(selectedReport);
            handleMenuClose();
          }}
          sx={{
            padding: "10px 14px",
            gap: "8px",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: "18px" }}>
            <PrintIcon sx={{ width: 18, height: 18, color: "#2C2D2C" }} />
          </ListItemIcon>
          <ListItemText
            primary="Print"
            slotProps={{
              primary: {
                sx: { fontSize: "14px", fontWeight: 400, lineHeight: "1.15", color: "#2C2D2C" },
              },
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            padding: "10px 14px",
            gap: "8px",
            "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.08)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: "18px" }}>
            <DeleteIcon sx={{ width: 18, height: 18, color: "#D32F2F" }} />
          </ListItemIcon>
          <ListItemText
            primary="Delete"
            slotProps={{
              primary: {
                sx: { fontSize: "14px", fontWeight: 400, lineHeight: "1.15", color: "#D32F2F" },
              },
            }}
          />
        </MenuItem>
      </Menu>

      <ConfirmationPopUp
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this report? This action cannot be undone."
      />

      {totalRecords > 0 && (
        <Grid
          sx={{
            flexShrink: 0,
            marginTop: "auto",
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Paginator
            page={currentPage}
            totalPages={totalPages}
            totalRecord={totalRecords}
            onPageChange={(_, p) => setCurrentPage(p)}
            onRecordsPerPageChange={(s) => {
              setCurrentPageSize(s);
              setCurrentPage(0);
            }}
            defaultSize={currentPageSize}
          />
        </Grid>
      )}
    </Grid>
  );
};

export default CarePlanReportsTable;
