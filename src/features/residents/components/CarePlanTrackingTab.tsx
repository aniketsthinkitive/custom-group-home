import { Box, Typography, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { FC } from "react";
import { CustomRadio } from "../../../components/custom-radio/custom-radio";
import CustomInput from "../../../components/custom-input/custom-input";
import type { UiStatus } from "../utils/carePlanConstants";

export interface CarePlanItem {
  id: number;
  uuid: string;
  title: string;
  description: string;
  assigned_shifts?: string[];
  status?: string;
  note?: string;
  dailyStatus?: Record<string, { status: string; note: string }>;
  is_archived?: boolean;
  monthly_progress?: any;
}

interface CarePlanTrackingTabProps {
  items: CarePlanItem[];
  onMenuOpen: (event: React.MouseEvent<HTMLElement>, item: CarePlanItem) => void;
  onStatusChange?: (uuid: string, status: string) => void;
  onNoteChange?: (uuid: string, note: string) => void;
  selectedLogs: Record<string, { status?: UiStatus; note?: string }>;
}

const CarePlanTrackingTab: FC<CarePlanTrackingTabProps> = ({
  items,
  onMenuOpen,
  onStatusChange,
  onNoteChange,
  selectedLogs,
}) => {
  const theme = useTheme();

  return (
    <Box>
      {items.map((item) => (
        <Box
          key={item.uuid}
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            mb: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 2, flex: 1 }}>
              <Typography fontWeight={700} color="primary.dark" sx={{ minWidth: "fit-content" }}>
                {item.title}
              </Typography>
              <Box
                sx={{
                  width: "1px",
                  minHeight: "20px",
                  backgroundColor: theme.palette.divider,
                  alignSelf: "stretch",
                  mx: 1,
                }}
              />
              <Typography fontSize={13} color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {item.description}
              </Typography>
            </Box>
            <IconButton size="small" onClick={(e) => onMenuOpen(e, item)} sx={{ mt: -0.5 }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 3,
              mb: 2.5,
              "& [role='radio']": {
                backgroundColor: "background.paper",
                border: `1px solid ${theme.palette.divider}`,
              },
              "& [role='radio'][aria-checked='true']": {
                backgroundColor: `${alpha(theme.palette.info.main, 0.12)} !important`,
                border: `1px solid ${theme.palette.primary.main} !important`,
              },
              "& [role='radio'][aria-checked='true'] > div": {
                backgroundColor: `${theme.palette.primary.main} !important`,
              },
              "& [role='radio']:hover": {
                backgroundColor: theme.palette.grey[50],
              },
            }}
          >
            <CustomRadio
              label="Worked"
              checked={selectedLogs[item.uuid]?.status === "worked"}
              onChange={() => onStatusChange?.(item.uuid, "worked")}
            />
            <CustomRadio
              label="Did Not Work"
              checked={selectedLogs[item.uuid]?.status === "not_worked"}
              onChange={() => onStatusChange?.(item.uuid, "not_worked")}
            />
            <CustomRadio
              label="Could Not Work"
              checked={selectedLogs[item.uuid]?.status === "could_not"}
              onChange={() => onStatusChange?.(item.uuid, "could_not")}
            />
          </Box>

          <Typography fontSize={13} mt={1} color="text.primary" mb={1} fontWeight={500}>
            Add Note
          </Typography>
          <CustomInput
            name={`note-${item.uuid}`}
            placeholder="Enter"
            value={selectedLogs[item.uuid]?.note ?? ""}
            onChange={(e) => onNoteChange?.(item.uuid, e.target.value)}
            multiline
            rows={3}
          />
        </Box>
      ))}
    </Box>
  );
};

export default CarePlanTrackingTab;
