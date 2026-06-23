import React from "react";
import {
  Alert,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CustomDialog from "./custom-dialog/custom-dialog";
import CustomButton from "./custom-buttons/custom-buttons";

export type Blocker = { type: string; id: string; label: string; last_dsp?: boolean };

export type DeleteBlockerModalProps = {
  open: boolean;
  onClose(): void;
  blockers: Blocker[];
  onManage?: () => void;
  title?: string;
  manageLabel?: string;
};

/**
 * Pre-flight modal shown when a destructive action (delete / deactivate)
 * cannot proceed because of active blockers (assignments, open incidents).
 *
 * The list is informational only — there is no "force" path per the spec.
 */
const DeleteBlockerModal: React.FC<DeleteBlockerModalProps> = ({
  open,
  onClose,
  blockers,
  onManage,
  title = "Cannot proceed",
  manageLabel = "Manage assignments",
}) => {
  const assignments = blockers.filter((b) => b.type === "assignment");
  const incidentCount = blockers.filter((b) => b.type === "open_incident").length;

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={title}
      buttonName={[]}
      width="440px"
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pt: 1, textAlign: "center" }}>
        {/* Amber warning icon */}
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <WarningAmberIcon sx={{ color: "#D97706", fontSize: 24 }} />
        </Box>

        {/* Description */}
        <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
          Items must be removed before this action can proceed. Resolve the following and try again.
        </Typography>

        {/* Blocker content */}
        {blockers.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No blockers found.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", textAlign: "left" }}>
            {assignments.length > 0 && (
              <List dense disablePadding sx={{ mb: incidentCount > 0 ? 1 : 0 }}>
                {assignments.map((b, i) => (
                  <ListItem
                    key={`${b.type}-${b.id}-${i}`}
                    disableGutters
                    sx={{ alignItems: "flex-start" }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>
                      {b.last_dsp ? (
                        <WarningAmberIcon fontSize="small" color="warning" />
                      ) : null}
                    </ListItemIcon>
                    <ListItemText
                      primary={b.label}
                      secondary={
                        b.last_dsp
                          ? "Last active DSP on this home — reassign before deactivating."
                          : "Active assignment"
                      }
                      primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {incidentCount > 0 && (
              <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
                <Typography variant="body2">
                  {incidentCount} open incident{incidentCount !== 1 ? "s" : ""} must be resolved
                  before deactivating.
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", pt: 0.5 }}>
          <CustomButton variant="text" size="md" onClick={onClose}>
            Cancel
          </CustomButton>
        </Box>
      </Box>
    </CustomDialog>
  );
};

export default DeleteBlockerModal;
