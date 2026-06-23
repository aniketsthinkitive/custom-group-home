import {
  Grid,
  Typography,
  IconButton,
  Box,
  Chip,
  Avatar,
  Button,
  Tooltip,
} from "@mui/material";
import React, { useState, Suspense } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useNavigate, useLocation } from "react-router-dom";
import { usePermission } from "../../../hooks/usePermission";

const EditResidentProfileDrawer = React.lazy(() =>
  import("../components/EditResidentProfileDrawer").then((module) => ({
    default: module.default,
  })),
);
const MoveOutDrawer = React.lazy(() =>
  import("../components/MoveOutDrawer").then((module) => ({
    default: module.default,
  })),
);
const TransferResidentDrawer = React.lazy(() =>
  import("../components/TransferResidentDrawer").then((module) => ({
    default: module.default,
  })),
);

/* ===================== TYPES ===================== */

type Resident = {
  id: number;
  uuid: string;
  status: string;
  assignment_status?: string; // ACTIVE or MOVED_OUT from assignment
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

type ResidentProfileHeaderProps = {
  resident?: Resident;
  roomNumber?: string;
  roomId?: number;
};

/* ===================== COMPONENT ===================== */

const ResidentProfileHeader = ({
  resident,
  roomNumber,
  roomId,
}: ResidentProfileHeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const residentData = location.state?.residentData;
  const { hasPermission } = usePermission();

  const canTransferResident = hasPermission("onboarding.transfer_home");
  const canMoveOut = hasPermission("onboarding.move_out");
  const canEditResident = hasPermission("leads.edit");

  if (!resident) return null;
  const isMovedOut =
    (resident as any)?.resident_status === "MOVED_OUT" ||
    (resident as any)?.assignment_status === "MOVED_OUT" ||
    (resident as any)?.status === "MOVED_OUT" ||
    residentData?.status === "MOVED_OUT" ||
    residentData?.assignment_status === "MOVED_OUT";

  const [openEdit, setOpenEdit] = useState(false);
  const [openMoveOut, setOpenMoveOut] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 1.5, sm: 2 },
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E6E8EB",
        position: "sticky",
        top: 0,
        zIndex: 1002,
        flexShrink: 0,
      }}
    >
      <Grid container alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
        {/* BACK */}
        <Grid>
          <IconButton size="small" onClick={() => navigate("/admin/residents")}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Grid>

        {/* AVATAR */}
        <Grid>
          <Avatar
            src={(resident?.user as any)?.avatar_url ?? undefined}
            sx={{ width: 44, height: 44 }}
          >
            {resident.user.first_name[0]}
          </Avatar>
        </Grid>

        {/* CONTENT */}
        <Grid size="grow">
          <Grid
            container
            spacing={{ xs: 1.5, sm: 3 }}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            {/* ================= RESIDENT INFO ================= */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid container alignItems="center" spacing={1} flexWrap="wrap">
                  <Grid>
                    <Typography fontSize={{ xs: 14, sm: 16 }} fontWeight={600}>
                      {resident.user.first_name} {resident.user.last_name}
                    </Typography>
                  </Grid>

                  <Grid>
                    <Typography fontSize={{ xs: 11, sm: 12 }} color="#6B7280">
                      ({(resident as any).referral_number || ""})
                    </Typography>
                  </Grid>

                  <Grid>
                    {(() => {
                      const statusValue = resident.assignment_status || resident.status || "ACTIVE";
                      const isMovedOut = statusValue === "MOVED_OUT";
                      const displayText = statusValue === "MOVED_OUT"
                        ? "Moved Out"
                        : statusValue
                            .replace(/_/g, " ")
                            .split(" ")
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(" ");
                      
                      return (
                        <Chip
                          label={displayText}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: { xs: 11, sm: 12 },
                            fontWeight: 500,
                            backgroundColor: isMovedOut ? "#FEE2E2" : "#EAF2FF",
                            color: isMovedOut ? "#DC2626" : "#2563EB",
                          }}
                        />
                      );
                    })()}
                  </Grid>
                </Grid>

                <Grid container spacing={1} flexWrap="wrap">
                  <Grid>
                    <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                      {resident.date_of_birth}
                      {(() => {
                        if (!resident.date_of_birth) return "";
                        const today = new Date();
                        const birthDate = new Date(resident.date_of_birth);
                        if (isNaN(birthDate.getTime())) return "";
                        let age = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                          age--;
                        }
                        return ` (${age})`;
                      })()}
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                      | {resident.gender}
                    </Typography>
                  </Grid>
                  <Grid>
                    <Typography fontSize={{ xs: 12, sm: 13 }} color="#6B7280">
                      | Room {roomNumber || "—"}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* ================= VERTICAL/HORIZONTAL DIVIDER ================= */}
            {resident.guardian && (
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
            {resident.guardian && (
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
                      <Typography
                        fontSize={{ xs: 12, sm: 13 }}
                        color="#282b2f"
                        fontWeight={500}
                      >
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
                    </Grid>

                    <Grid
                      container
                      spacing={{ xs: 1.5, sm: 2 }}
                      flexWrap="wrap"
                    >
                      {resident.guardian.phone && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <PhoneOutlinedIcon
                              sx={{
                                fontSize: { xs: 14, sm: 16 },
                                color: "#6B7280",
                              }}
                            />
                            <Typography
                              fontSize={{ xs: 12, sm: 13 }}
                              color="#6B7280"
                            >
                              {resident.guardian.phone}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}

                      {resident.guardian.email && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <EmailOutlinedIcon
                              sx={{
                                fontSize: { xs: 14, sm: 16 },
                                color: "#6B7280",
                              }}
                            />
                            <Typography
                              fontSize={{ xs: 12, sm: 13 }}
                              color="#6B7280"
                            >
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
            {resident.agent && (
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
            {resident.agent && (
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
                      <Typography
                        fontSize={{ xs: 12, sm: 13 }}
                        color="#282b2f"
                        fontWeight={500}
                      >
                        Area Agency :{" "}
                        {resident.agent.first_name && (
                          <span style={{ color: "#233558", fontWeight: 400 }}>
                            {" "}
                            {resident.agent.first_name}
                          </span>
                        )}{" "}
                        {resident.agent.last_name && (
                          <span style={{ color: "#233558", fontWeight: 400 }}>
                            {" "}
                            {resident.agent.last_name}
                          </span>
                        )}
                      </Typography>
                    </Grid>

                    <Grid
                      container
                      spacing={{ xs: 1.5, sm: 2 }}
                      flexWrap="wrap"
                    >
                      {resident.agent.phone && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <PhoneOutlinedIcon
                              sx={{
                                fontSize: { xs: 14, sm: 16 },
                                color: "#6B7280",
                              }}
                            />
                            <Typography
                              fontSize={{ xs: 12, sm: 13 }}
                              color="#6B7280"
                            >
                              {resident.agent.phone}
                            </Typography>
                          </Grid>
                        </Grid>
                      )}

                      {resident.agent.email && (
                        <Grid>
                          <Grid container alignItems="center" spacing={0.5}>
                            <EmailOutlinedIcon
                              sx={{
                                fontSize: { xs: 14, sm: 16 },
                                color: "#6B7280",
                              }}
                            />
                            <Typography
                              fontSize={{ xs: 12, sm: 13 }}
                              color="#6B7280"
                            >
                              {resident.agent.email}
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

        {/* ACTIONS */}
        <Box
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            mt: { xs: 1, sm: 0 },
          }}
        >
          <Tooltip
            title={isMovedOut ? "Resident is Moved Out" : ""}
            arrow
            placement="top"
          >
            <span>
              <Button
                variant="outlined"
                size="small"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleOpen}
                disabled={isMovedOut}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 2,
                  borderColor: "#1b2a4a",
                  backgroundColor: "#e3e5e9",
                  color: "#1a2f5b",
                  "&.Mui-disabled": {
                    opacity: 0.5,
                    borderColor: "#1b2a4a",
                  },
                }}
              >
                Actions
              </Button>
            </span>
          </Tooltip>

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
            <Tooltip
  title={!canEditResident ? "You don't have permission" : ""}
  arrow
  placement="left"
  disableHoverListener={canEditResident}
>
  <span>
    <MenuItem
      onClick={() => {
        handleClose();
        setOpenEdit(true);
      }}
      disabled={!canEditResident}
    >
      Edit Profile
    </MenuItem>
  </span>
</Tooltip>

            {/* <MenuItem onClick={() => { handleClose(); }}>
              Edit Admission Details
            </MenuItem> */}

            <Tooltip
              title={!canTransferResident ? "You don't have permission" : ""}
              arrow
              placement="left"
              disableHoverListener={canTransferResident}
            >
              <span>
                <MenuItem
                  onClick={() => {
                    handleClose();
                    setOpenTransfer(true);
                  }}
                  disabled={!canTransferResident}
                >
                  Transfer Resident
                </MenuItem>
              </span>
            </Tooltip>

            {/* Only show divider and Moved-Out option if assignment_status is not MOVED_OUT */}
            {(residentData?.assignment_status || residentData?.status) !== "MOVED_OUT" && [
              <Divider key="actions-divider" />,
              <Tooltip
                key="actions-movedout-tooltip"
                title={!canMoveOut ? "You don't have permission" : ""}
                arrow
                placement="left"
                disableHoverListener={canMoveOut}
              >
                <span>
                  <MenuItem
                    key="actions-movedout"
                    onClick={() => {
                      handleClose();
                      setOpenMoveOut(true);
                    }}
                    disabled={!canMoveOut}
                    sx={{
                      color: !canMoveOut ? undefined : "#DC2626",
                      fontWeight: 500,
                    }}
                  >
                    Moved Out
                  </MenuItem>
                </span>
              </Tooltip>,
            ]}
          </Menu>
          {openEdit && (
            <Suspense fallback={null}>
              <EditResidentProfileDrawer
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                leadUuid={resident.uuid}
                contextMode="resident"
                onSave={() => {}}
              />
            </Suspense>
          )}
          {openMoveOut && (
            <Suspense fallback={null}>
              <MoveOutDrawer
                open={openMoveOut}
                onClose={() => setOpenMoveOut(false)}
                assignmentUuid={residentData?.assignment_uuid}
                leadUuid={resident.uuid}
              />
            </Suspense>
          )}
          {openTransfer && (
            <Suspense fallback={null}>
              <TransferResidentDrawer
                open={openTransfer}
                onClose={() => setOpenTransfer(false)}
                assignmentUuid={residentData?.assignment_uuid || ""}
                leadUuid={resident.uuid}
                currentGroupHomeId={(resident as any)?.group_home_id || residentData?.group_home_id}
                currentGroupHomeName={(resident as any)?.group_home || residentData?.group_home}
                currentGroupHomeUuid={(resident as any)?.group_home_uuid || residentData?.group_home_uuid}
                currentRoomUuid={(resident as any)?.room_uuid || residentData?.room_uuid}
                currentRoomId={roomId || residentData?.room_id}
                currentCheckInDate={residentData?.check_in_date}
              />
            </Suspense>
          )}
        </Box>
      </Grid>
    </Box>
  );
};

export default ResidentProfileHeader;
