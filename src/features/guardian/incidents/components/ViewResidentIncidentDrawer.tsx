import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

import CustomDrawer from "../../../../components/custom-drawer/custom-drawer";
import { useIncidentQuery } from "../hooks/useIncidents";
import type { Incident as SDKIncident } from "../../../../sdk/types.gen";
import { useAcknowledgeIncident } from "../hooks/useAcknowledgeIncident";
import { patchIncidentMutation } from "../../../../sdk/@tanstack/react-query.gen";
import CustomTextArea from "../../../../components/custom-text-area/custom-textarea";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";

interface ViewResidentIncidentDrawerProps {
  open: boolean;
  onClose: () => void;
  incidentUuid?: string;
  incidentData?: any; // Optional: if provided, use this instead of fetching
}


// Helper to get status label from API status (4-state user-visible enum).
// IN_PROGRESS is no longer surfaced — the normal flow skips it entirely.
const getStatusLabelFromApi = (status: string | undefined | null): string => {
  if (typeof status !== "string") return "Unknown";
  const s = status.toUpperCase();
  switch (s) {
    case "DRAFT":             return "Draft";
    case "PM_REVIEW_PENDING": return "Review Pending";
    case "COMPLETED":         return "Completed";
    case "ACKNOWLEDGED":      return "Acknowledged";
    default:                  return status;
  }
};

// Helper to get status color based on API status.
const getStatusColorFromApi = (status: string | undefined | null) => {
  if (typeof status !== "string") return { bg: "#F2F4F7", text: "#475467" };
  const s = status.toUpperCase();
  if (s === "DRAFT")             return { bg: "#F2F4F7", text: "#475467" };
  if (s === "PM_REVIEW_PENDING") return { bg: "#FEF3C7", text: "#92400E" };
  if (s === "COMPLETED")         return { bg: "#E8F5E9", text: "#2E7D32" };
  if (s === "ACKNOWLEDGED")      return { bg: "#ECFDF3", text: "#027A48" };
  return { bg: "#F2F4F7", text: "#475467" };
};

// Guardian can acknowledge only when the incident has been COMPLETED by the
// PM (signed off). Anything else is either not ready or already acknowledged.
const isStatusOpen = (status: string | undefined | null): boolean => {
  if (typeof status !== "string") return false;
  return status.toUpperCase() === "COMPLETED";
};

const ViewResidentIncidentDrawer: React.FC<
  ViewResidentIncidentDrawerProps
> = ({ open, onClose, incidentUuid, incidentData }) => {

  // Only fetch if incidentData is not provided
  const shouldFetch = !incidentData && !!incidentUuid;
  const { data: incidentResponse, isLoading: isFetching, error } =
    useIncidentQuery(incidentUuid, shouldFetch && open); // Only fetch when drawer is open and data not provided
  const acknowledgeMutation = useAcknowledgeIncident();
  const queryClient = useQueryClient();
  const addCommentMutation = useMutation({
    ...patchIncidentMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [{ _id: "listIncidents" }],
      });
    },
  });
  const [comment, setComment] = useState("");
  const [acknowledging, setAcknowledging] = useState(false);
  // ---------------------------------------
  // Extract incident from API response or use provided data
  // ---------------------------------------
  const incident: SDKIncident | null = incidentData 
    ? incidentData 
    : ((incidentResponse as any)?.data ?? null);
  
  const isLoading = shouldFetch ? isFetching : false;
  // ---------------------------------------
  // Status - Use actual status from API
  // ---------------------------------------
  const incidentStatus = incident?.status;
  const showAcknowledgeButton = isStatusOpen(incidentStatus);
  const statusLabel = getStatusLabelFromApi(incidentStatus);
  const statusColors = getStatusColorFromApi(incidentStatus);

  const incidentSummary =
    (incident as any)?.incident_summary ||
    (incident as any)?.summary ||
    "";

  // Correctly separated field bindings
  const description = incident?.incident_description || "";
  const preIncidentNotes = incident?.pre_incident_notes || "";
  const responseAction = incident?.response_action || "";
  const injuries =
    (incident as any)?.injuries ||
    "";

  const location =
    incident?.location ||
    (incident as any)?.incident_location ||
    "Unknown";



  // ---------------------------------------
  // Helpers
  // ---------------------------------------
  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Unknown";

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${month}/${day}/${year} at ${hours}:${minutes} ${ampm}`;
  };

  // Format date for "Last updated by" and "Reported by" sections
  const formatDateForDisplay = (dateString?: string | null): string => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Unknown";

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;

    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
  };

  // Get updated by name (fallback to reported_by if updated_by not available)
  const getUpdatedByName = (): string => {
    const updatedBy = (incident as any)?.updated_by_details;
    if (updatedBy) {
      return `${updatedBy.first_name || ""} ${updatedBy.last_name || ""}`.trim();
    }
    // Fallback to reported_by if updated_by not available
    if (incident?.reported_by_details) {
      return `${incident.reported_by_details.first_name || ""} ${incident.reported_by_details.last_name || ""}`.trim();
    }
    return "Unknown";
  };

  // Get reported by name
  const getReportedByName = (): string => {
    if (incident?.reported_by_details) {
      return `${incident.reported_by_details.first_name || ""} ${incident.reported_by_details.last_name || ""}`.trim();
    }
    return "Unknown";
  };

  const getIncidentName = (): string => {
    const i: any = incident as any;
    return (
      i?.incident_name ||
      i?.incident ||
      ""
    );
  };

  /** Replace underscores with spaces and title-case each word */
  const humanize = (value?: string | null): string => {
    if (!value) return "";
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderFlagSection = (
    title: string,
    flags?: any[],
    fieldKey?: string
  ) => {
    if (!flags?.length) return null;

    return (
      <Box>
        <Typography fontWeight={600} mb={0.5}>
          {title}
        </Typography>
        <List dense sx={{ pt: 0 }}>
          {flags.map((f, i) => (
            <ListItem key={i} sx={{ py: 0.25 }}>
              <ListItemText
                primary={typeof f === "string" ? f : f[fieldKey || "type"]}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };
  const DetailRow = ({
  label,
  value,
  alwaysShow,
}: {
  label: string;
  value?: string;
  alwaysShow?: boolean;
}) => {
  if (!value && !alwaysShow) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "100px 12px auto",
        columnGap: "8px",
        alignItems: "flex-start",
        padding: "8px 0",
      }}
    >
      {/* Label */}
      <Typography
        sx={{
          fontSize: "14px",
          color: "#505052",
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>

      {/* Colon */}
      <Typography
        sx={{
          fontSize: "14px",
          color: "#505052",
        }}
      >
        :
      </Typography>

      {/* Value */}
      <Typography
        sx={{
          fontSize: "14px",
          color: "#111827",
          lineHeight: 1.6,
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
};


  // ---------------------------------------
  // Figma-style tight list section
  // ---------------------------------------
  const FlagSection = ({
    title,
    items,
  }: {
    title: string;
    items?: (string | undefined)[];
  }) => {
    if (!items?.length) return null;

    const filteredItems = items.filter(Boolean);
    if (!filteredItems.length) return null;

    return (
      <Box sx={{ marginTop: "8px" }}>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#2C2D2C",
            marginBottom: "4px",
          }}
        >
          {title}
        </Typography>

        <List dense sx={{ padding: 0 }}>
          {filteredItems.map((item, index) => (
            <ListItem
              key={index}
              sx={{
                padding: "2px 0",
              }}
            >
              <ListItemText
                primary={`• ${item}`}
                primaryTypographyProps={{
                  fontSize: "14px",
                  color: "#2C2D2C",
                  lineHeight: 1.6,
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };



  // ---------------------------------------
  // Acknowledge handler
  // ---------------------------------------

  const handleAcknowledge = async () => {
    const uuid = incident?.uuid;
    if (!uuid) return;

    try {
      setAcknowledging(true);

      // If guardian entered a comment, submit it first
      if (comment.trim()) {
        await addCommentMutation.mutateAsync({
          path: { uuid },
          body: {
            comment: comment.trim(),
          },
        } as any);
      }

      await acknowledgeMutation.mutateAsync({
        path: { uuid },
        body: {
          status: "ACKNOWLEDGED",
        },
      } as any);

      setComment("");
      onClose();
    } catch (err) {
      console.error("Acknowledge failed", err);
    } finally {
      setAcknowledging(false);
    }
  };

  // Render
  // ---------------------------------------
  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Incident Details"
      drawerWidth="800px"
      drawerPadding="24px"
    >
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", height: 400 }}>
          <CircularProgress />
        </Box>
      ) : (shouldFetch && error) || (!incidentData && !incident) ? (
        <Typography sx={{ color: "#C62828" }}>
          Unable to load incident
        </Typography>
      ) : incident ? (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflow: "auto", pb: 2 }}>

          {/* Outer white bordered card (matches admin portal) */}
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "16px",
              background: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Summary Card */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #E5E7EB",
                background: "#F9FAFB",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Typography fontWeight={600}>
                    {getIncidentName() || "Incident"}
                  </Typography>
                  <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                      backgroundColor: statusColors.bg,
                      color: statusColors.text,
                      fontSize: "12px",
                      height: "22px",
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PersonOutlineOutlinedIcon sx={{ fontSize: 14, color: "#6B7280" }} />
                  <Typography fontSize={12} color="text.secondary">
                    Last updated by {getUpdatedByName()} on {formatDateForDisplay(incident.updated_at)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: "#6B7280" }} />
                  <Typography fontSize={12} color="text.secondary">
                    Reported by {getReportedByName()} on {formatDateForDisplay(incident.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Notes */}
            <Box sx={{ mt: 1 }}>
              <DetailRow label="Description" value={description || undefined} alwaysShow />
              <DetailRow label="Notes" value={preIncidentNotes || undefined} alwaysShow />
              <DetailRow label="Action" value={responseAction || undefined} alwaysShow />
              <DetailRow
                label="Date"
                value={formatDate(incident.incident_datetime)}
              />
              <DetailRow label="Location" value={location} />
            </Box>

            {/* Added Comment */}
            <Box>
              <Typography fontWeight={600} mb={1}>Added Comment</Typography>
              {(() => {
                const comments: any[] = (incident as any)?.comments || [];
                if (comments.length === 0) {
                  return (
                    <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>-</Typography>
                  );
                }
                return comments.map((c: any, idx: number) => {
                  const dt = c.created_at
                    ? new Date(c.created_at).toLocaleString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "";
                  return (
                    <Box
                      key={c.uuid || idx}
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                      }}
                    >
                      <Typography sx={{ fontSize: "13px", color: "text.secondary", mb: 0.25 }}>
                        {c.created_by_name || "Unknown"}
                        {c.role_name ? ` (${c.role_name})` : ""}
                      </Typography>
                      <Typography sx={{ fontSize: "14px", color: "#111827", mb: 0.5 }}>
                        {c.comment}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
                        {dt}
                      </Typography>
                    </Box>
                  );
                });
              })()}
            </Box>

            <Divider />

            {/* Flags */}
            <FlagSection
              title="Medical"
              items={incident.medical_flags?.map(
                (f) => humanize(f.medical_type)
              )}
            />

            <FlagSection
              title="Legal"
              items={incident.legal_flags?.map(
                (f) => humanize(f.legal_type)
              )}
            />

            <FlagSection
              title="Individual Victim Of"
              items={incident.victim_flags?.map(
                (f) => humanize(f.victim_type)
              )}
            />

            <FlagSection
              title="Social"
              items={incident.social_flags?.map(
                (f) => humanize(f.social_type)
              )}
            />

            {/* Add Comment Section - Show only if status is OPEN */}
            {showAcknowledgeButton && (
              <Box
                sx={{
                  borderTop: "1px solid #E7E9EB",
                  pt: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Typography fontWeight={600}>
                  Add Comment (Optional)
                </Typography>

                <CustomTextArea
                  name="incident_comment"
                  placeholder="Enter"
                  value={comment}
                  minRow={3}
                  maxRow={5}
                  onChange={(e) => setComment(e.target.value)}
                  isDisabled={acknowledging}
                />
              </Box>
            )}
          </Box>
          </Box>

          {/* Sticky Footer with Acknowledge Button - Show only if status is OPEN */}
          {showAcknowledgeButton && (
            <Box
              sx={{
                borderTop: "1px solid #E7E9EB",
                pt: 2,
                pb: 2,
                backgroundColor: "#FFFFFF",
                position: "sticky",
                bottom: 0,
                zIndex: 10,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <CustomButton
                onClick={handleAcknowledge}
                disabled={acknowledging}
                variant="primary"
              >
                {acknowledging ? "Acknowledging..." : "Acknowledge Incident"}
              </CustomButton>
            </Box>
          )}
        </Box>
      ) : null}
    </CustomDrawer>
  );
};

export default ViewResidentIncidentDrawer;
