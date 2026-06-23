import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Typography,
  Tooltip,
  Paper,
  Box,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Paginator from "../../../../components/pagination/pagination";
import dayjs, { Dayjs } from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { residentsListOptions } from "../../../../sdk/@tanstack/react-query.gen";
import { tooltipClasses } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  heading,
  primaryTextCss,
  tableCellCss,
} from "../../../../components/common-table/widgets/common-table-widgets";
import { OverflowTooltip } from "../../../../components/overflow-tooltip";

interface AdlTableProps {
  onViewClick: (row: any) => void;
  selectedDate: Dayjs | null;
  residentUuid?: string;
  onExportReady?: (exportFn: () => void) => void;
}

const DarkTooltip = styled(({ className, ...props }: any) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#b4b6b8",
    color: "#FFFFFF",
    fontSize: "12px",
    fontWeight: 500,
    padding: "6px 10px",
    borderRadius: "6px",
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#8e9298",
  },
}));

const tableHeaders = [
  { id: "title", label: "Title", width: "200px", align: "left" as const },
  { id: "description", label: "Description", width: "260px", align: "left" as const },
  { id: "notes", label: "Notes", width: "240px", align: "left" as const },
  { id: "datetime", label: "Date & Time", width: "180px", align: "left" as const },
  { id: "status", label: "Status", width: "140px", align: "left" as const },
  { id: "action", label: "Action", width: "80px", align: "center" as const },
];

const AdlTable = ({ onViewClick, selectedDate, residentUuid, onExportReady }: AdlTableProps) => {
  const effectiveDate = selectedDate && dayjs(selectedDate).isValid() ? selectedDate : dayjs();
  const queryDate = dayjs(effectiveDate).format("YYYY-MM-DD");

  const { data: dailyLogs = [] } = useQuery({
    ...residentsListOptions({
      query: {
        resident_uuid: residentUuid,
        type: "ADL",
        archived: false,
        date: queryDate,
      } as any,
    }),
    enabled: !!residentUuid,
    select: (response) => {
      const items =
        (response as any)?.data?.data ??
        (response as any)?.data ??
        (response as any)?.data?.results ??
        (response as any)?.results ??
        [];
      if (!Array.isArray(items)) return [];

      return items.map((item: any) => {
        const shiftsArr = item?.assigned_shifts;
        const shift =
          Array.isArray(shiftsArr) && shiftsArr.length ? String(shiftsArr[0]).toUpperCase() : "MORNING";

        const ds = item?.daily_status?.[shift];

        const dateRaw = ds?.updated_at ?? ds?.created_at ?? item.updated_at ?? item.created_at ?? null;
        const status =
          ds?.status
            ? ds.status
              .replace(/_/g, " ")
              .toLowerCase()
              .replace(/\b\w/g, (c: string) => c.toUpperCase())
            : "—";

        const notes = ds?.note ?? item.note ?? item.notes ?? "";

        return {
          uuid: item.uuid,
          care_plan_item_id: item.id ?? item.care_plan_item_id ?? null,
          title: item.title ?? item.care_plan_item_title ?? "—",
          description: item.description ?? item.care_plan_item_description ?? "—",
          notes: notes?.trim() ? notes : "—",
          rawDatetime: dateRaw,
          datetime:
            dateRaw && dayjs(dateRaw).isValid()
              ? dayjs(dateRaw).format("MM/DD/YYYY h:mm A")
              : "—",
          status,
          drawerContext: "adl",
        };
      });
    },
  });

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const source = dailyLogs;
  const totalRecord = source.length;
  const totalPages = Math.ceil(totalRecord / size);
  const startIndex = page * size;
  const endIndex = Math.min(startIndex + size, totalRecord);
  const tableData = useMemo(() => source.slice(startIndex, endIndex), [source, startIndex, endIndex]);

  const handleExportCsv = useCallback(() => {
    if (!source.length) return;

    const csvHeaders = ["Title", "Description", "Notes", "Date & Time", "Status"];
    const csvRows = source.map((row) => [
      row.title,
      row.description,
      row.notes,
      row.datetime,
      row.status,
    ]);

    const escapeCsvField = (field: string) => {
      const value = String(field ?? "");
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      csvHeaders.map(escapeCsvField).join(","),
      ...csvRows.map((row) => row.map(escapeCsvField).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `adl-records-${queryDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [source, queryDate]);

  useEffect(() => {
    onExportReady?.(handleExportCsv);
  }, [handleExportCsv, onExportReady]);

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: "100%",
        flex: 1,
        minHeight: 0,
        borderRadius: "8px",
        border: "1px solid #DEE4ED",
        backgroundColor: "#FFFFFF",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: 0,
      }}
    >
      <TableContainer
        sx={{
          height: "100%",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.15)",
            borderRadius: 3,
          },
          "& .MuiTable-root": {
            borderCollapse: "separate",
            borderBottom: "1px solid #ECEFF4",
            borderSpacing: 0,
          },
          "& .MuiTableHead-root .MuiTableCell-root": {
            height: "44px",
            padding: "8px 16px",
            backgroundColor: "#F2F7FA !important",
            color: "#30353A",
            position: "sticky",
            borderBottom: "1px solid #E3ECEF",
            top: 0,
            zIndex: 10,
          },
          "& .MuiTableBody-root": {
            "& .MuiTableRow-root": {
              "&:hover": { backgroundColor: "rgba(0,0,0,0.01)" },
            },
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #ECEFF4",
              verticalAlign: "middle",
              padding: "8px 16px",
            },
          },
        }}
      >
        <Table stickyHeader aria-label="adl table" sx={{ ...tableCellCss, minWidth: 900 }}>
          <TableHead>
            <TableRow>
              {tableHeaders.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    ...heading,
                    width: header.width,
                    minWidth: header.width,
                    textAlign: header.align,
                  }}
                  align={header.align}
                >
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      fontWeight: 600,
                      lineHeight: "1.2",
                      color: "#30353A",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                      textAlign: header.align,
                    }}
                  >
                    {header.label}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {tableData.length > 0 ? (
              tableData.map((row, i) => (
                <TableRow key={row.uuid ?? i}>
                  <TableCell sx={{ ...heading, textAlign: "left !important" }} align="left">
                    <OverflowTooltip text={row.title} sx={{ maxWidth: { xs: 160, sm: 200 } }} />
                  </TableCell>

                  <TableCell sx={{ ...heading, textAlign: "left !important" }} align="left">
                    <OverflowTooltip text={row.description || ""} sx={{ maxWidth: 260 }} />
                  </TableCell>

                  <TableCell sx={{ ...heading, textAlign: "left !important" }} align="left">
                    <OverflowTooltip text={row?.notes?.trim() ? row.notes : "—"} sx={{ maxWidth: { xs: 180, sm: 240 } }} />
                  </TableCell>

                  <TableCell sx={{ ...heading, textAlign: "left !important" }} align="left">
                    <Typography noWrap sx={primaryTextCss}>
                      {row.datetime}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ ...heading, textAlign: "left !important" }} align="left">
                    <Typography noWrap sx={primaryTextCss}>
                      {row.status}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ ...heading }} align="center">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconButton
                        size="small"
                        aria-label="view"
                        onClick={() =>
                          onViewClick({
                            ...row,
                            drawerContext: "adl",
                          })
                        }
                        sx={{
                          padding: "4px",
                          borderRadius: "6px",
                          "&:hover": { backgroundColor: "rgba(67, 147, 34, 0.04)" },
                        }}
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: "18px", color: "#2C2D2C" }} />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableHeaders.length}
                  sx={{ textAlign: "center", verticalAlign: "middle", borderBottom: "none" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.5,
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
                      No records found for the selected date
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{
        flexShrink: 0, backgroundColor: "#FFFFFF", paddingX: { xs: "10px", sm: "20px" }, borderTop: "1px solid #E3ECEF",
      }}>
        <Paginator
          page={page}
          totalPages={totalPages}
          totalRecord={totalRecord}
          onPageChange={(_, p) => setPage(p)}
          onRecordsPerPageChange={(n) => {
            setSize(n);
            setPage(0);
          }}
          defaultSize={size}
        />
      </Box>
    </Paper>
  );
};

export default AdlTable;

