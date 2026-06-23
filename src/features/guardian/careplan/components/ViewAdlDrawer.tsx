import React from "react";
import Grid from "@mui/material/Grid";
import { Typography, Divider, Tooltip, Box, useTheme, useMediaQuery } from "@mui/material";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CustomDrawer from "../../../../components/custom-drawer/custom-drawer";
import dayjs from "dayjs";
import CustomLabel from "../../../../components/custom-label/custom-label";

interface ViewAdlDrawerProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

const ViewAdlDrawer: React.FC<ViewAdlDrawerProps> = ({ open, onClose, data }) => {
  const theme = useTheme();
  // Using useMediaQuery solely for drawer width as CustomDrawer needs a string value.
  // This keeps "600px" for Laptop/Desktop views cleanly.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!data) return null;

  // Use rawDatetime if available for formatting, otherwise fallback
  const dateToFormat = data.rawDatetime || data.datetime;
  const formattedDate =
    dateToFormat && dayjs(dateToFormat).isValid()
      ? dayjs(dateToFormat).format("MMMM D, YYYY [at] h:mm A")
      : "—";

  const headerTitle = data?.drawerContext === 'daily_tracking' ? 'Daily Tracking' : 'ADL';
  const displayTitle =
    data?.drawerContext === 'daily_tracking'
      ? (data?.displayTitle ?? data?.title ?? 'GOAL')
      : (data?.title ?? 'ADL');

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title={headerTitle}
      drawerWidth={isMobile ? "100vw" : "600px"}
      headerStyle="0px"
    >
      <Grid
        container
        direction="column"
        sx={{
          height: "100%",
          // Retaining -6 mx for sm+ to preserve original Desktop/Laptop UI
          // Using 0 mx for xs to prevent horizontal overflow in Mobile
          mx: { xs: 0, sm: -6 },
          px: { xs: 2.5, sm: 2 },
          pb: 4,
        }}
      >
        {/* Date & Time Header */}
        <Grid sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>
            <span style={{ color: "#111827" }}>Date & Time : </span> {formattedDate}
          </Typography>
        </Grid>

        {/* Card Content */}
        <Box
          sx={{
            border: "1px solid #DEE4ED",
            borderRadius: "8px",
            // Retaining original 16px padding on sm+, using responsive padding on xs
            padding: { xs: "12px", sm: "16px" },
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Title | Divider | Description */}
          <Box
            sx={{
              // Retaining exact grid layout for sm+, converting to flex column for xs
              display: { xs: "flex", sm: "grid" },
              flexDirection: { xs: "column" },
              gridTemplateColumns: { sm: "100px 1px 1fr" },
              gap: { xs: "8px" },
              alignItems: "start",
              marginBottom: "12px",
            }}
          >
            <Tooltip
              title={
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1, color: "#525E6F", fontSize: "14px", lineHeight: "17px" }}
                  >
                    {displayTitle}
                  </Typography>
                </Box>
              }
              arrow
              placement={isMobile ? "bottom" : "right"}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "#FFFFFF",
                    color: "#0F172A",
                    boxShadow:
                      "0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    border: "1px solid #E2E8F0",
                    width: "220px",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    "& .MuiTooltip-arrow": {
                      color: "#FFFFFF",
                      "&:before": { border: "1px solid #E2E8F0" },
                    },
                  },
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#11466D",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  width: { xs: "100%", sm: "auto" },
                  minWidth: 0,
                }}
              >
                {displayTitle}
              </Typography>
            </Tooltip>

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                borderColor: "#DEE4ED",
                // Hide Divider on mobile, Keep visible on sm+
                display: { xs: "none", sm: "block" }
              }}
            />

            <Typography
              sx={{
                fontSize: "14px",
                color: "#4B5563",
                lineHeight: 1.6,
                wordBreak: "break-word",
                overflowWrap: "anywhere",
                minWidth: 0,
              }}
            >
              {data.description}
            </Typography>
          </Box>

          {/* Status */}
          {data.status && (
            <Box sx={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
              {(() => {
                const statusNorm = String(data.status || "").toLowerCase().trim();
                if (statusNorm === "worked") {
                  return <CheckOutlinedIcon sx={{ fontSize: 18, color: "#16A34A", mr: 1 }} />;
                }
                if (statusNorm === "did not work") {
                  return <CloseOutlinedIcon sx={{ fontSize: 18, color: "#DC2626", mr: 1 }} />;
                }
                if (statusNorm === "could not work") {
                  return <Typography sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}>—</Typography>;
                }
                return <Typography sx={{ fontSize: 18, color: "#94A3B8", mr: 1 }}>—</Typography>;
              })()}
              <Typography sx={{ fontSize: "14px", fontWeight: 500, color: "#4B5563" }}>
                {data.status}
              </Typography>
            </Box>
          )}

          {/* Note Section */}
          <Box
            sx={{
              backgroundColor: "#F8F8F8",
              borderRadius: "8px",
              padding: "12px",
              width: "100%",
              overflow: "hidden",
            }}
          >
            <CustomLabel label="Note:" />
            <Typography
              sx={{
                fontSize: "14px",
                color: "#4B5563",
                lineHeight: 1.6,
                whiteSpace: "normal",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {data.notes || "No notes available."}
            </Typography>
          </Box>
        </Box>
      </Grid>
    </CustomDrawer>
  );
};

export default ViewAdlDrawer;
