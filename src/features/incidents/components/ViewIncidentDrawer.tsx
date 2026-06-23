import React, { useState } from "react";
import { generateIncidentPDF } from "../utils/generateIncidentPDF";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Button,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import { useIncidentQuery } from "../hooks/useIncidents";
import type { Incident as SDKIncident } from "../../../sdk/types.gen";
import { useAuth } from "../../../hooks/useAuth";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";


interface ViewIncidentDrawerProps {
  open: boolean;
  onClose: () => void;
  incidentUuid: string | undefined;
  onEdit?: (uuid: string) => void;
}

const DetailRow = ({ label, value }: any) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "100px 12px auto",
      columnGap: "8px",
      alignItems: "flex-start",
      padding: "8px 0",
      justifyContent: "flex-start",
    }}
  >
    <Typography
      sx={{
        fontSize: "14px",
        color: "#505052",
        fontWeight: 500,
      }}
    >
      {label}
    </Typography>

    <Typography
      sx={{
        fontSize: "14px",
        color: "#505052",
      }}
    >
      :
    </Typography>

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



const ViewIncidentDrawer: React.FC<ViewIncidentDrawerProps> = ({
  open,
  onClose,
  incidentUuid,
  onEdit,
}) => {
  // const { data: incidentResponse, isLoading, error } =
  //   useIncidentQuery(incidentUuid);
  const { user } = useAuth();

  const staffName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "null";

  const { data: incidentResponse, isLoading, error } = useIncidentQuery(
    incidentUuid,
    open // Only fetch when drawer is open
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const incident: SDKIncident | null = React.useMemo(() => {
    if (!incidentResponse) return null;
    if (typeof incidentResponse === "object" && "data" in incidentResponse) {
      return (incidentResponse as any).data;
    }
    return incidentResponse as SDKIncident;
  }, [incidentResponse]);

  // Project-wide display format: MM-DD-YYYY (e.g. 05-15-2026).
  const formatDate = (d?: string | null): string => {
    if (!d) return "Unknown";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "Unknown";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}-${day}-${year}`;
    } catch {
      return "Unknown";
    }
  };

  // Human-readable labels for incident flag enums.
  // Mirrors the PDF generator (`generateIncidentPDF.ts`) and the form
  // checkbox labels (`AddNewIncidentDrawer.tsx`).
  const medicalTypeMap: Record<string, string> = {
    hospitalization_medical: "Hospitalization – medical (admittance, not ER visit)",
    hospitalization_psychiatric: "Hospitalization – psychiatric (admittance, not ER visit)",
    injury_no_intervention: "Injury of individual not requiring medical intervention",
    injury_with_intervention: "Injury of individual requiring medical intervention",
    illness_no_intervention: "Illness of individual not requiring medical intervention",
    illness_with_intervention: "Illness of individual requiring medical intervention",
    seizure: "Seizure",
    medication_refusal: "Medication refusal",
    fall: "Fall",
    other: "Other",
  };
  const legalTypeMap: Record<string, string> = {
    client_rights_violation:
      "Possible/suspected violation of client rights (abuse, neglect, exploitation, service rights violation)",
    missing_eloped: "Individual missing/eloped (even temporarily)",
    police_involvement: "Police involvement",
  };
  const victimTypeMap: Record<string, string> = {
    theft: "Theft",
    assault: "Assault",
    sexual_assault: "Sexual Assault",
    car_accident: "Car Accident",
    fire_hazard_arson: "Fire hazard / arson",
  };
  const socialTypeMap: Record<string, string> = {
    behavior_no_plan: "Behavior incident – no behavior plan",
    behavior_with_plan: "Behavior incident – with behavior plan",
    mental_health_episode: "Mental health episode",
    physical_restraint: "Physical restraint utilized",
    other: "Other",
  };

  const humanize = (raw?: string | null) =>
    (raw || "")
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");

  const getResidentName = () =>
    `${incident?.resident_details?.first_name || ""} ${incident?.resident_details?.last_name || ""
      }`.trim() || "Unknown";

  const getInitials = () =>
    `${incident?.resident_details?.first_name?.[0] || ""}${incident?.resident_details?.last_name?.[0] || ""
    }`;

  const getIncidentType = () => {
    if (incident?.medical_flags?.length)
      return incident.medical_flags[0].medical_type;
    if (incident?.legal_flags?.length)
      return incident.legal_flags[0].legal_type;
    if (incident?.victim_flags?.length)
      return incident.victim_flags[0].victim_type;
    if (incident?.social_flags?.length)
      return incident.social_flags[0].social_type;
    return "General";
  };

  const actions = (incident as any)?.notifications || [];

  const getActionLabel = (type: string) => {
    switch (type) {
      case "GUARDIAN":
        return "Guardian";
      case "SERVICE_COORDINATOR":
        return "Area Agency";
      case "PROGRAM_MANAGER":
        return "Program Manager";
      case "ADDITIONAL_SERVICE_PROVIDER":
        return "Program Coordinator";
      case "NURSING":
        return "Nursing";
      default:
        return type;
    }
  };

  /** Format a notify_date (YYYY-MM-DD) + notify_time (HH:mm:ss) into "MM-DD-YYYY, h:mm AM/PM" */
  const formatNotifyDateTime = (date?: string | null, time?: string | null): string => {
    if (!date) return "";
    try {
      const dateStr = time ? `${date}T${time}` : date;
      const d = new Date(dateStr);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const year = d.getFullYear();
      if (!time) return `${month}-${day}-${year}`;
      const hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHour = hours % 12 || 12;
      return `${month}-${day}-${year}, ${displayHour}:${minutes} ${ampm}`;
    } catch {
      return [date, time].filter(Boolean).join(" ");
    }
  };

  const getStatusLabel = (status?: string | null): string => {
    if (!status) return "Draft";
    switch (status.toUpperCase()) {
      case "DRAFT":             return "Draft";
      case "PM_REVIEW_PENDING": return "Review Pending";
      case "COMPLETED":         return "Completed";
      case "ACKNOWLEDGED":      return "Acknowledged";
      default:                  return status;
    }
  };

  const getStatusColor = (status?: string | null) => {
    const s = (status || "").toUpperCase();
    if (s === "ACKNOWLEDGED") return { bg: "#ECFDF3", text: "#027A48" };
    if (s === "COMPLETED")    return { bg: "#E8F5E9", text: "#2E7D32" };
    if (s === "PM_REVIEW_PENDING") return { bg: "#FEF3C7", text: "#92400E" };
    // DRAFT / unknown
    return { bg: "#F2F4F7", text: "#475467" };
  };

  const statusLabel = getStatusLabel(incident?.status);
  const statusColor = getStatusColor(incident?.status);


  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="View Incident"
      drawerWidth="800px"
      drawerPadding="24px"
    >
      {isLoading ? (
        <Box height={400} display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
        </Box>
      ) : error || !incident ? (
        <Typography>Error loading incident.</Typography>
      ) : (
        <Box display="flex" flexDirection="column" gap={2}>

          {/* Header */}
          {/* Resident Header Card */}
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "12px 16px",
              background: "#F2F7FA",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Avatar>{getInitials()}</Avatar>

            <Box flex={1} display="flex" alignItems="center" gap={1}>
              <Typography fontWeight={600} fontSize={18}>
                {getResidentName()}
              </Typography>

              <Typography fontSize={16} fontWeight={500} color="#728197">
                ({incident.referral_number || ""})
              </Typography>
            </Box>

          </Box>

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
              <Box display="flex" justifyContent="space-between">
                <Box display="flex" gap={1} alignItems="center">
                  <Typography fontWeight={600}>
                    {incident?.incident_name || getIncidentType()}
                  </Typography>
                  <Chip
                    label={statusLabel}
                    size="small"
                    sx={{
                      backgroundColor: statusColor.bg,
                      color: statusColor.text,
                      fontSize: "12px",
                      height: "22px",
                    }}
                  />

                </Box>

               

              </Box>

              <Divider sx={{ my: 1 }} />

              <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <PersonOutlineIcon sx={{ fontSize: 14, color: "#6B7280" }} />

                  <Typography fontSize={12} color="text.secondary">
                    Created by {staffName} on {formatDate(incident.created_at)}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <AccessTimeIcon sx={{ fontSize: 14, color: "#6B7280" }} />

                  <Typography fontSize={12} color="text.secondary">
                    Last updated on {formatDate(incident.updated_at)}
                  </Typography>
                </Box>
              </Box>

            </Box>
            <Divider />
            {/* Notes */}
            <Box sx={{ mt: 1 }}>
              <DetailRow label="Description" value={incident.incident_description || "-"} />
              <DetailRow label="Notes" value={(incident as any).pre_incident_notes || "-"} />
              <DetailRow label="Action" value={(incident as any).response_action || "-"} />

              <DetailRow
                label="Date"
                value={formatDate(
                  incident.incident_datetime || incident.created_at || "-"
                )}
              />
              <DetailRow label="Location" value={incident.location || "-"} />
            </Box>

            {/* Added Comment - loops through incident.comments[] */}
            <Box>
              <Typography fontWeight={600} mb={1}>Added Comment</Typography>
              {(() => {
                const comments: any[] = (incident as any).comments || [];
                if (comments.length === 0) {
                  return (
                    <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>-</Typography>
                  );
                }
                return comments.map((c: any, idx: number) => {
                  const dt = c.created_at ? formatDate(c.created_at) : "";
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

            {/* Documents
            <Box>
              <Typography fontWeight={600}>Documents</Typography>

              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid #E5E7EB",
                  width: "fit-content",
                }}
              >
                <Typography fontSize={13}>Injury Report.pdf</Typography>
                <Typography fontSize={11} color="text.secondary">
                  200 KB
                </Typography>
              </Box>
            </Box> */}

            <Divider />

            {/* Flags */}
            {incident.medical_flags && incident.medical_flags.length > 0 && (
              <Box>
                <Typography fontWeight={600}>Medical</Typography>
                {incident.medical_flags.map((f: any, i: number) => (
                  <Typography key={i}>
                    •{" "}
                    {f.medical_type === "other"
                      ? `Other: ${f.medical_other_details || ""}`
                      : medicalTypeMap[f.medical_type] || humanize(f.medical_type)}
                  </Typography>
                ))}
              </Box>
            )}

            {incident.legal_flags && incident.legal_flags.length > 0 && (
              <Box>
                <Typography fontWeight={600}>Legal</Typography>
                {incident.legal_flags.map((f, i) => (
                  <Typography key={i}>
                    • {legalTypeMap[f.legal_type as string] || humanize(f.legal_type as string)}
                  </Typography>
                ))}
              </Box>
            )}

            {incident.victim_flags && incident.victim_flags.length > 0 && (
              <Box>
                <Typography fontWeight={600}>Individual Victim Of</Typography>
                {incident.victim_flags.map((f, i) => (
                  <Typography key={i}>
                    • {victimTypeMap[f.victim_type as string] || humanize(f.victim_type as string)}
                  </Typography>
                ))}
              </Box>
            )}

            {incident.social_flags && incident.social_flags.length > 0 && (
              <Box>
                <Typography fontWeight={600}>Social</Typography>
                {incident.social_flags.map((f: any, i: number) => (
                  <Typography key={i}>
                    •{" "}
                    {f.social_type === "other"
                      ? `Other: ${f.social_other_details || ""}`
                      : socialTypeMap[f.social_type] || humanize(f.social_type)}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Actions / Who was Notified */}
            {actions.length > 0 && (
              <Box>
                <Typography fontWeight={600} mb={1}>
                  Who was Notified
                </Typography>

                <Box display="flex" flexDirection="column" gap={1.5}>
                  {actions.map((a: any, i: number) => (
                    <Box
                      key={i}
                      sx={{
                        p: 1.5,
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                        background: "#F9FAFB",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {/* Label + tick */}
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontSize={14} fontWeight={600}>
                          {getActionLabel(a.type)}
                        </Typography>
                        {a.user_name && (
                          <Typography fontSize={13} color="text.secondary">
                            — {a.user_name}
                          </Typography>
                        )}
                        <CheckCircleOutlineIcon color="success" fontSize="small" />
                      </Box>

                      {/* Date / Time */}
                      {(a.notify_date || a.notify_time) && (
                        <Box display="flex" gap={0.5}>
                          <Typography fontSize={13} color="text.secondary" fontWeight={500} minWidth={130}>
                            Date &amp; Time:
                          </Typography>
                          <Typography fontSize={13}>
                            {formatNotifyDateTime(a.notify_date, a.notify_time)}
                          </Typography>
                        </Box>
                      )}

                      {/* Method of Contact */}
                      {a.method_of_contact && (
                        <Box display="flex" gap={0.5}>
                          <Typography fontSize={13} color="text.secondary" fontWeight={500} minWidth={130}>
                            Method of Contact:
                          </Typography>
                          <Typography fontSize={13}>{a.method_of_contact}</Typography>
                        </Box>
                      )}

                      {/* By Whom */}
                      {a.by_whom && (
                        <Box display="flex" gap={0.5}>
                          <Typography fontSize={13} color="text.secondary" fontWeight={500} minWidth={130}>
                            By Whom:
                          </Typography>
                          <Typography fontSize={13}>{a.by_whom}</Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Signature Information */}
            <Box>
              <Typography fontWeight={600}>Signature Information</Typography>

              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                {/* Signer Info */}
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Box display="flex" gap={1}>
                    <Typography fontSize={14} color="text.secondary" fontWeight={500}>
                      Signed By:
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      {(incident as any).signature?.uploaded_by
                        ? `${(incident as any).signature.uploaded_by.first_name} ${(incident as any).signature.uploaded_by.last_name || ""}`.trim()
                        : "-"}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1}>
                    <Typography fontSize={14} color="text.secondary" fontWeight={500}>
                      Signed Date:
                    </Typography>
                    <Typography fontSize={14} fontWeight={500}>
                      {(incident as any).signature?.uploaded_at
                        ? formatDate((incident as any).signature.uploaded_at)
                        : "-"}
                    </Typography>
                  </Box>

                  {(incident as any).signature?.updated_at &&
                    (incident as any).signature?.updated_at !== (incident as any).signature?.uploaded_at && (
                      <Box display="flex" gap={1}>
                        <Typography fontSize={14} color="text.secondary" fontWeight={500}>
                          Last Updated:
                        </Typography>
                        <Typography fontSize={14} fontWeight={500}>
                          {formatDate((incident as any).signature.updated_at)}
                        </Typography>
                      </Box>
                    )}
                </Box>

                <Divider />

                {/* Signature Image or Fallback */}
                <Box>
                  <Typography fontSize={14} color="text.secondary" fontWeight={500} mb={1}>
                    Signature:
                  </Typography>

                  <Box
                    sx={{
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      backgroundColor: "#FFFFFF",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "100px",
                    }}
                  >
                    {(incident as any).signature_url ? (
                      <Box
                        component="img"
                        src={(incident as any).signature_url}
                        alt="Reporter Signature"
                        sx={{
                          maxWidth: "100%",
                          maxHeight: "150px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <Typography fontSize={14} color="text.disabled" fontStyle="italic">
                        Not Signed / No Signature Available
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Sticky bottom footer with action buttons */}
          <Box
            sx={{
              position: "sticky",
              bottom: 0,
              backgroundColor: "#fff",
              borderTop: "1px solid #E5E7EB",
              pt: 2,
              pb: 1,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              disabled={isGeneratingPdf}
              onClick={async () => {
                if (!incident) return;
                setIsGeneratingPdf(true);
                try {
                  await generateIncidentPDF(incident as any);
                } catch (e) {
                  console.error("Failed to generate incident PDF", e);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
            >
              {isGeneratingPdf ? "Generating..." : "Generate PDF"}
            </Button>
            {onEdit && incidentUuid && (incident as any)?.status === "PM_REVIEW_PENDING" && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  onClose();
                  onEdit(incidentUuid);
                }}
              >
                Edit Incident
              </Button>
            )}
          </Box>
        </Box>

      )}
    </CustomDrawer>
  );
};

export default ViewIncidentDrawer;
