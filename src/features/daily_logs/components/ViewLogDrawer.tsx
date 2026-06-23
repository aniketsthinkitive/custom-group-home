import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import type { DailyLogData } from "./DailyLogsTable";
import dayjs from "dayjs";

interface ViewLogDrawerProps {
  open: boolean;
  onClose: () => void;
  log: DailyLogData | null;
  onEdit?: (log: DailyLogData) => void;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: "16px",
      gap: "8px",
    }}
  >
    <Typography
      sx={{
        fontSize: "14px",
        fontWeight: 500,
        color: "#757775",
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.5,
        minWidth: "120px",
        flexShrink: 0,
      }}
    >
      {label}:
    </Typography>
    <Typography
      sx={{
        fontSize: "14px",
        fontWeight: 400,
        color: "#2C2D2C",
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        lineHeight: 1.5,
        flex: 1,
      }}
    >
      {value || "-"}
    </Typography>
  </Box>
);

const ViewLogDrawer: React.FC<ViewLogDrawerProps> = ({
  open,
  onClose,
  log,
  onEdit,
}) => {
  const formatCreatedOn = (dateString: string | null | undefined): string => {
    if (!dateString) return "Unknown";

    try {
      const date = dayjs(dateString);
      if (!date.isValid()) return "Unknown";

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const month = monthNames[date.month()];
      const day = date.date();
      const year = date.year();

      let hours = date.hour();
      const minutes = date.minute();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes.toString().padStart(2, "0");

      return `${month} ${day}, ${year} at ${hours}:${minutesStr} ${ampm}`;
    } catch {
      return "Unknown";
    }
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="View Log"
      drawerWidth="650px"
      drawerPadding="24px"
      headerPadding="24px"
    >
      {log ? (
        <Box
          sx={{
            border: "1px solid #E7E9EB",
            borderRadius: "8px",
            backgroundColor: "#FFFFFF",
            padding: "16px",
            marginTop: "8px",
          }}
        >
          <DetailRow
            label="Staff Member"
            value={log.staff_member || "Not Assigned"}
          />
          <DetailRow label="User" value={log.target_user_name || "-"} />
          <DetailRow label="Role" value={log.role || "-"} />
          <DetailRow label="Entity" value={log.entity_type || "-"} />
          <DetailRow label="Event" value={log.action || "-"} />
          <DetailRow label="Group Home" value={log.group_home || "-"} />
          <DetailRow label="IP Address" value={log.ip_address || "-"} />
          <DetailRow
            label="Created On"
            value={formatCreatedOn(log.created_at)}
          />
        </Box>
      ) : (
        <Box sx={{ padding: "24px" }}>
          <Typography
            sx={{
              color: "#757775",
              fontSize: "14px",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
          >
            No log data available.
          </Typography>
        </Box>
      )}
    </CustomDrawer>
  );
};

export default ViewLogDrawer;
