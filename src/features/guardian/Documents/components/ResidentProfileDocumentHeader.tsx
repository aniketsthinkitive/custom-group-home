import {
  Grid,
  Typography,
  IconButton,
  Box,
  Chip,
  Avatar,
  Button,
} from "@mui/material";
import { useState } from "react";
import dayjs from "dayjs";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useNavigate, useLocation } from "react-router-dom";




/* ===================== TYPES ===================== */

type Resident = {
  id: number;
  uuid: string;
  status: string;
  date_of_birth: string;
  gender: string;
  avatar_url?: string;
  user: {
    first_name: string;
    last_name: string;
  };
  guardian: {
    first_name: string;
    last_name: string;
    phone?: string | number;
    email?: string;
  } | null;
  guardian_relation: string | null;
  agent?: {
    id: number;
    uuid: string;
    username: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string | number;
    role?: {
      id: number;
      uuid: string;
      name: string;
      type: string;
    };
  } | null;
};

/* ===================== PROPS ===================== */

type ResidentProfileDocumentHeaderProps = {
  resident?: Resident;
  roomNumber?: string;
};

/* ===================== COMPONENT ===================== */

const ResidentProfileDocumentHeader = ({
  resident,
  roomNumber,
}: ResidentProfileDocumentHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const residentData = location.state?.residentData;
  
  const computeAge = (dob?: string) => {
    if (!dob) return undefined;
    const d = dayjs(dob);
    if (!d.isValid()) return undefined;
    const now = dayjs();
    return now.diff(d, "year");
  };
  const formatDOBWithAge = (dob?: string) => {
    if (!dob) return undefined;
    const d = dayjs(dob);
    if (!d.isValid()) return undefined;
    const age = computeAge(dob);
    return `${d.format("MMMM D, YYYY")}${typeof age === "number" ? ` (${age})` : ""}`;
  };
  const resolvedRoomNumber =
    (resident as any)?.room_number ?? roomNumber ?? "—";

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

//  console.log("resident", resident)
  return (
    <Box
      sx={{
        px: 0,
        pt: 0,
        pb: { xs: 1.5, sm: 2 },
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E7E9EB",
        position: "sticky",
        top: 0,
        zIndex: 1002,
        flexShrink: 0,
      }}
    >
      <Grid container alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
        {/* BACK */}
        <Grid>
          <IconButton size="small" onClick={() => navigate("/portal/documents")}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Grid>

        {/* AVATAR */}
        <Grid>
          <Avatar
            src={resident?.user?.avatar_url ?? undefined}
            sx={{ width: 44, height: 44 }}
          >
            {resident?.user?.first_name[0]}
          </Avatar>
        </Grid>

        {/* CONTENT */}
        <Grid size="grow">
          <Grid container spacing={{ xs: 1.5, sm: 3 }} alignItems={{ xs: "flex-start", sm: "center" }}>
            {/* ================= RESIDENT INFO ================= */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid container alignItems="center" spacing={1} flexWrap="wrap">
                  <Grid>
                    <Typography fontSize={{ xs: 14, sm: 16 }} fontWeight={600}>
                      {resident?.user?.first_name} {resident?.user?.last_name}
                    </Typography>
                  </Grid>

                  <Grid>
                    <Typography fontSize={{ xs: 11, sm: 12 }} color="#6B7280">
                      ({resident?.referral_number || ""})
                    </Typography>
                  </Grid>
                
                </Grid>

                <Grid container spacing={1} flexWrap="wrap">
                  <Grid>
                    <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                      {formatDOBWithAge(resident?.date_of_birth) || "Unknown"}
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                      | {resident?.gender}
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                      | Room {resolvedRoomNumber}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* ================= VERTICAL/HORIZONTAL DIVIDER ================= */}
            {resident?.guardian && (
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                  height: { sm: 48 },
                  width: { sm: "1px" },
                  backgroundColor: "#D1D5DB",
                  minWidth: "1px",
                }}
              />
            )}

            {/* ================= GUARDIAN INFO ================= */}
            {resident?.guardian && (
              <>
                {/* Horizontal divider for mobile */}
                <Box
                  sx={{
                    display: { xs: "block", sm: "none" },
                    height: "1px",
                    width: "100%",
                    backgroundColor: "#D1D5DB",
                    my: 1,
                  }}
                />
                <Grid>
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <Typography fontSize={{ xs: 12, sm: 13 }} color="#282b2f" fontWeight={500}>
                        Guardian :{" "}
                        {resident?.guardian.first_name && (
                          <span style={{ color: "#233558", fontWeight: 400 }}>
                            {" "}
                            {resident?.guardian.first_name}
                          </span>
                        )}{" "}
                        {resident?.guardian.last_name && (
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
                    </Grid>

                    <Grid container spacing={{ xs: 1.5, sm: 2 }} flexWrap="wrap">
                      {resident.guardian.phone && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <PhoneOutlinedIcon
                              sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}
                            />
                            <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                              {resident.guardian.phone}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}

                      {resident.guardian.email && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <EmailOutlinedIcon
                              sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}
                            />
                            <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                              {resident.guardian.email}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </>
            )}

            {/* ================= VERTICAL/HORIZONTAL DIVIDER ================= */}
            {resident?.agent && (
              <Box
                sx={{
                  display: { xs: "none", sm: "block" },
                  height: { sm: 48 },
                  width: { sm: "1px" },
                  backgroundColor: "#D1D5DB",
                  minWidth: "1px",
                }}
              />
            )}

            {/* ================= AGENT/SERVICE MANAGER INFO ================= */}
            {resident?.agent && (
              <>
                {/* Horizontal divider for mobile */}
                <Box
                  sx={{
                    display: { xs: "block", sm: "none" },
                    height: "1px",
                    width: "100%",
                    backgroundColor: "#D1D5DB",
                    my: 1,
                  }}
                />
                <Grid>
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <Typography fontSize={{ xs: 12, sm: 13 }} color="#282b2f" fontWeight={500}>
                        Area Agency :{" "}
                        {resident?.agent.first_name && (
                          <span style={{ color: "#233558", fontWeight: 400 }}>
                            {" "}
                            {resident?.agent.first_name}
                          </span>
                        )}{" "}
                        {resident?.agent.last_name && (
                          <span style={{ color: "#233558", fontWeight: 400 }}>
                            {" "}
                            {resident?.agent.last_name}
                          </span>
                        )}
                      </Typography>
                    </Grid>

                    <Grid container spacing={{ xs: 1.5, sm: 2 }} flexWrap="wrap">
                      {resident?.agent.phone && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <PhoneOutlinedIcon
                              sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}
                            />
                            <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                              {resident?.agent.phone}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}

                      {resident?.agent.email && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <EmailOutlinedIcon
                              sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}
                            />
                            <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                              {resident?.agent.email}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </>
            )}
          </Grid>
        </Grid>

      
        
         

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: 2,
                boxShadow: "0px 4px 12px rgba(0,0,0,0.12)",
              },
            }}
          >           
          </Menu>
          

        

      </Grid>
    </Box>
  );
};

export default ResidentProfileDocumentHeader;
