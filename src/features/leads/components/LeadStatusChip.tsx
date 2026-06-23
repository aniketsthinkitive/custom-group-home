import { Chip } from "@mui/material";
import { LeadStatus } from "../leads.types";

const statusStyles: Record<
  LeadStatus,
  { backgroundColor: string; color: string }
> = {
  Completed: { backgroundColor: "#E8F5E8", color: "#2E7D32" },
  Rejected: { backgroundColor: "#FFEBEE", color: "#C62828" },
  "Docs Pending": { backgroundColor: "#FFF3E0", color: "#E65100" },
  Draft: { backgroundColor: "#F5F5F5", color: "#616161" },
  "Under Review": { backgroundColor: "#E3F2FD", color: "#1565C0" },
  "Onboarding In Progress": { backgroundColor: "#F3EDFF", color: "#6A1B9A" },
};

type LeadStatusChipProps = {
  status: LeadStatus;
  size?: "small" | "medium";
};

const LeadStatusChip = ({
  status,
  size = "medium",
}: LeadStatusChipProps) => {
  return (
    <Chip
      label={status}
      size={size}
      sx={{
        height: size === "small" ? 22 : 28,
        fontSize: size === "small" ? 12 : 14,
        fontWeight: 500,
        backgroundColor: statusStyles[status].backgroundColor,
        color: statusStyles[status].color,
      }}
    />
  );
};

export default LeadStatusChip;
