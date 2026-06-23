import { Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CheckIcon from "@mui/icons-material/Check";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import type { FC } from "react";

export interface MonthlyRow {
  label: string;
  description?: string;
  info?: boolean;
  values: ("check" | "x" | "dash")[];
}

interface CarePlanMonthlySummaryProps {
  days: number[];
  rows: MonthlyRow[];
}

const CarePlanMonthlySummary: FC<CarePlanMonthlySummaryProps> = ({ days, rows }) => {
  const theme = useTheme();

  return (
    <Grid
      container
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflowX: "auto",
        overflowY: "hidden",
        width: "100%",
        maxWidth: "100%",
        backgroundColor: "background.paper",
      }}
    >
      <Grid size={{ xs: 12 }}>
        <TableContainer
          sx={{
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
          }}
        >
          <Table
            size="small"
            sx={{
              minWidth: { xs: 600, sm: 800 },
              tableLayout: "fixed",
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    color: "text.primary",
                    width: { xs: 150, sm: 200 },
                    minWidth: { xs: 150, sm: 200 },
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    backgroundColor: theme.palette.grey[50],
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    py: { xs: 1, sm: 1.25 },
                    px: { xs: 1, sm: 2 },
                  }}
                >
                  Goals
                </TableCell>
                {days.map((d) => (
                  <TableCell
                    key={d}
                    align="center"
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      width: { xs: 60, sm: 80 },
                      minWidth: { xs: 60, sm: 80 },
                      py: { xs: 1, sm: 1.25 },
                      px: 1,
                    }}
                  >
                    {d}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} hover sx={{ height: { xs: 40, sm: 46 } }}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "primary.dark",
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      backgroundColor: "background.paper",
                      width: { xs: 150, sm: 200 },
                      minWidth: { xs: 150, sm: 200 },
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      py: { xs: 1, sm: 1.25 },
                      px: { xs: 1, sm: 2 },
                    }}
                  >
                    <Grid container alignItems="center" spacing={1} sx={{ whiteSpace: "nowrap" }}>
                      <Grid size="grow" sx={{ minWidth: 0 }}>
                        <Typography
                          fontWeight={700}
                          color="primary.dark"
                          sx={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: { xs: 12, sm: 14 },
                          }}
                        >
                          {row.label}
                        </Typography>
                      </Grid>
                      {row.info && (
                        <Grid>
                          <Tooltip
                            title={
                              <Grid container direction="column" spacing={0.5}>
                                <Grid>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      fontWeight: 700,
                                      mb: 1,
                                      color: "text.primary",
                                      fontSize: "14px",
                                      lineHeight: "17px",
                                    }}
                                  >
                                    {row.label}
                                  </Typography>
                                </Grid>
                                <Grid>
                                  <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", fontSize: "12px", lineHeight: "15px" }}
                                  >
                                    {row.description || "No description available."}
                                  </Typography>
                                </Grid>
                              </Grid>
                            }
                            arrow
                            placement="right"
                            slotProps={{
                              tooltip: {
                                sx: {
                                  bgcolor: "background.paper",
                                  color: "text.primary",
                                  boxShadow: "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                  border: `1px solid ${theme.palette.divider}`,
                                  width: "194px",
                                  borderRadius: "4px",
                                  padding: "8px 12px",
                                  "& .MuiTooltip-arrow": {
                                    color: "background.paper",
                                    "&:before": {
                                      border: `1px solid ${theme.palette.divider}`,
                                    },
                                  },
                                },
                              },
                            }}
                          >
                            <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "pointer" }} />
                          </Tooltip>
                        </Grid>
                      )}
                    </Grid>
                  </TableCell>
                  {row.values.map((v, idx) => (
                    <TableCell
                      key={`${row.label}-${idx}`}
                      align="center"
                      sx={{
                        color: "text.primary",
                        py: { xs: 1, sm: 1.25 },
                        px: 1,
                      }}
                    >
                      {v === "check" && <CheckIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "success.main" }} />}
                      {v === "x" && <CloseOutlinedIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: "error.main" }} />}
                      {v === "dash" && <Typography color="text.secondary">-</Typography>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default CarePlanMonthlySummary;
