import dayjs from "dayjs";
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

/* ===================== TYPES ===================== */

type Resident = {
  uuid: string;
  id?: number;
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

type CarePlanResidentProfileHeaderProps = {
  resident?: Resident;
  roomNumber?: string;
};

/* ===================== COMPONENT ===================== */

const CarePlanResidentProfileHeader = ({
  resident,
  roomNumber,
}: CarePlanResidentProfileHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!resident) return null;

  const dob = resident.date_of_birth ? dayjs(resident.date_of_birth) : null;
  const age = dob ? dayjs().diff(dob, "year") : null;

  return (
    <Box
      sx={{
        px: { xs: 1.5, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E6E8EB",
      }}
    >
      <Grid container alignItems="center" spacing={{ xs: 1, sm: 2 }}>
        {/* BACK */}
        <Grid>
          <IconButton
            size="small"
            onClick={() => navigate("/portal/residents")}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Grid>

        {/* AVATAR */}
        <Grid>
          <Avatar
            src={resident.user.avatar_url || undefined}
            sx={{ width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 } }}
          >
            {resident.user.first_name[0]}
          </Avatar>
        </Grid>

        {/* CONTENT */}
        <Grid size="grow" sx={{ minWidth: 0 }}>
          <Box
            display="flex"
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexDirection={{ xs: "column", sm: "row" }}
            gap={{ xs: 1, sm: 3 }}
            sx={{ flexWrap: "wrap" }}
          >
            {/* ================= RESIDENT INFO ================= */}
            <Box sx={{ minWidth: 0 }}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography fontSize={{ xs: 14, sm: 16 }} fontWeight={600} sx={{ wordBreak: "break-word" }}>
                  {resident.user.first_name} {resident.user.last_name}
                </Typography>

                <Typography fontSize={{ xs: 12, sm: 16 }} color="#6B7280" fontWeight={500}>
                  ({resident.referral_number || ""})
                </Typography>

              </Box>

              <Box display="flex" gap={1.5} mt={0.5} flexWrap="wrap">
                <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                  {dob ? dob.format("MMMM DD, YYYY") : "—"} {age !== null ? `(${age})` : ""}
                </Typography>
                <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                  | {resident.gender || "—"}
                </Typography>
                <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                  | Room {roomNumber || "—"}
                </Typography>
              </Box>
            </Box>

            {/* ================= FULL VERTICAL DIVIDER ================= */}
            {resident.guardian && (
              <Box
                sx={{
                  height: { xs: "1px", sm: 48 },
                  width: { xs: "100%", sm: "1px" },
                  backgroundColor: "#D1D5DB",
                }}
              />
            )}

            {/* ================= GUARDIAN INFO ================= */}
            {resident.guardian && (
              <Box sx={{ minWidth: 0 }}>
                <Typography fontSize={{ xs: 12, sm: 13 }} color="#282b2f" fontWeight={500}>
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
                        sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}
                      />
                      <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                        {resident.guardian.phone}
                      </Typography>
                    </Box>
                  )}

                  {resident.guardian.email && (
                    <Box display="flex" alignItems="center" gap={0.5} sx={{ minWidth: 0 }}>
                      <EmailOutlinedIcon
                        sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}
                      />
                      <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280" sx={{ wordBreak: "break-all" }}>
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

export default CarePlanResidentProfileHeader;
