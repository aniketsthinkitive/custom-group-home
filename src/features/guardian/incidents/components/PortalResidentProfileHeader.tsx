import {
  Grid,
  Typography,
  IconButton,
  Box,
  Chip,
  Avatar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useNavigate, useLocation } from "react-router-dom";
import dayjs from "dayjs";

/* ===================== TYPES ===================== */

type Resident = {
  uuid: string;
  referral_number?: string | null;
  status: string | null;
  date_of_birth: string | null;
  gender: string | null;

  user: {
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
  };

  guardian: {
    first_name: string;
    last_name: string;
    phone?: string | number;
    email?: string;
  } | null;

  guardian_relation: string | null;
};


/* ===================== PROPS ===================== */

type PortalResidentProfileHeaderProps = {
  resident?: Resident;
  roomNumber?: string;
};

/* ===================== COMPONENT ===================== */

const PortalResidentProfileHeader = ({
  resident,
  roomNumber,
}: PortalResidentProfileHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!resident) return null;

  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E6E8EB",
      }}
    >
      <Grid container alignItems="center" spacing={2}>
        {/* BACK */}
        <Grid>
          <IconButton
            size="small"
            onClick={() => navigate("/portal/incidents")}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Grid>

        {/* AVATAR */}
        <Grid>
          <Avatar
            src={resident.user.avatar_url || undefined}
            sx={{ width: 44, height: 44 }}
          >
            {!resident.user.avatar_url &&
              `${resident.user.first_name?.[0] || ""}${resident.user.last_name?.[0] || ""}`.toUpperCase()}
          </Avatar>
        </Grid>

        {/* CONTENT */}
        <Grid size="grow" sx={{ minWidth: 0 }}>
          <Box
            display="flex"
            alignItems={{ xs: "flex-start", md: "center" }}
            flexDirection={{ xs: "column", md: "row" }}
            gap={{ xs: 2, md: 3 }}
            sx={{ minWidth: 0 }}
          >
            {/* ================= RESIDENT INFO ================= */}
            <Box sx={{ minWidth: 0 }}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography fontSize={{ xs: 15, sm: 16 }} fontWeight={600} sx={{ wordBreak: "break-word" }}>
                  {resident.user.first_name} {resident.user.last_name}
                </Typography>

                <Typography fontSize={12} color="#6B7280">
                  ({resident.referral_number ?? `REF-${resident.uuid.slice(0, 6)}`})
                </Typography>
              </Box>

              <Box display="flex" gap={1.5} mt={0.5} flexWrap="wrap">
                <Typography fontSize={13} color="#6B7280">
                  {(() => {
                    const dob = resident?.date_of_birth;
                    if (!dob) return "Unknown";
                    const d = dayjs(dob);
                    if (!d.isValid()) return "Unknown";
                    const age = dayjs().diff(d, "year");
                    return `${d.format("MMMM D, YYYY")} (${age})`;
                  })()}
                </Typography>
                <Typography fontSize={13} color="#6B7280">
                  | {resident.gender}
                </Typography>
                <Typography fontSize={13} color="#6B7280">
                  | Room {roomNumber || "—"}
                </Typography>
              </Box>
            </Box>

            {/* ================= DIVIDER ================= */}
            {resident.guardian && (
              <Box
                sx={{
                  height: { xs: "1px", md: 48 },
                  width: { xs: "100%", md: "1px" }, // horizontal bar on xs, vertical on md
                  backgroundColor: "#D1D5DB",
                }}
              />
            )}

            {/* ================= GUARDIAN INFO ================= */}
            {resident.guardian && (
              <Box sx={{ minWidth: 0 }}>
                <Typography fontSize={13} color="#282b2f" fontWeight={500}>
                  Guardian :{" "}
                  {resident.guardian.first_name && (
                    <span style={{ color: "#233558", fontWeight: 400 }}>
                      {" "}
                      {resident.guardian.first_name}
                    </span>
                  )}{" "}
                  {resident.guardian.last_name && (
                    <span style={{ color: "#233558", fontWeight: 400 }}>
                      {" "}
                      {resident.guardian.last_name}
                    </span>
                  )}
                  {resident.guardian_relation && (
                    <span style={{ color: "#1a3468", fontWeight: 400 }}>
                      {" "}
                      ({resident.guardian_relation})
                    </span>
                  )}
                </Typography>

                <Box display="flex" gap={2} mt={0.5} flexWrap="wrap">
                  {resident.guardian.phone && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PhoneOutlinedIcon
                        sx={{ fontSize: 16, color: "#6B7280" }}
                      />
                      <Typography fontSize={13} color="#6B7280">
                        {resident.guardian.phone}
                      </Typography>
                    </Box>
                  )}

                  {resident.guardian.email && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <EmailOutlinedIcon
                        sx={{ fontSize: 16, color: "#6B7280" }}
                      />
                      <Typography fontSize={13} color="#6B7280" sx={{ wordBreak: "break-all" }}>
                        {resident.guardian.email}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PortalResidentProfileHeader;
