import React, { useMemo } from "react";
import { Grid, Typography, Avatar, Chip } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import CustomDrawer from "../../../../components/custom-drawer/custom-drawer";
import { getAppointmentOptions } from "../../../../sdk/@tanstack/react-query.gen";

interface AppointmentDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  residentId: string;
  residentData?: any;
  residentProfile?: any;
  user_uuid: string;
  appointmentUuid: string | null;
}

const AppointmentDetailsDrawer: React.FC<AppointmentDetailsDrawerProps> = ({
  open,
  onClose,
  residentId,
  residentData,
  residentProfile,
  appointmentUuid,
  user_uuid, // (kept to avoid changing parent)
}) => {
  const { data: appointmentResponse } = useQuery({
    ...(appointmentUuid
      ? getAppointmentOptions({ path: { uuid: appointmentUuid } })
      : ({} as any)),
    enabled: !!appointmentUuid,
  });

  const appointment = useMemo(() => {
    const resp: any = appointmentResponse;
    return resp?.data ?? resp ?? {};
  }, [appointmentResponse]);

  const statusColors = (status: string | undefined): { bg: string; color: string } => {
    const s = status?.toUpperCase() || "";
    switch (s) {
      case "REQUESTED":
      case "SCHEDULED":
        return { bg: "#E3F2FD", color: "#1976D2" };
      case "COMPLETED":
        return { bg: "#E6F4EA", color: "#137333" };
      case "CANCELLED":
        return { bg: "#FCE8E6", color: "#C5221F" };
      default:
        return { bg: "#F2F2F2", color: "#757775" };
    }
  };

  const formatDateLong = (dateStr?: string) => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("D MMMM YYYY");
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "-";
    return dayjs(`2000-01-01 ${timeStr}`).format("h:mm A");
  };

  const calcAge = (dob?: string) => {
    if (!dob) return "-";
    return dayjs().diff(dayjs(dob), "year").toString();
  };

  // ✅ Use residentProfile passed from parent (no residents list API calls)
  const residentName =
    (residentProfile?.user
      ? `${residentProfile?.user?.first_name ?? ""} ${residentProfile?.user?.last_name ?? ""}`.trim()
      : residentProfile?.resident_name) ?? "-";

  const referralId = residentProfile?.referral_number ?? "-";

  const dob = residentProfile?.date_of_birth ?? "";

  const gender = residentProfile?.gender ?? "-";

  const room =
    appointment?.room?.room_number ??
    residentProfile?.room_number ??
    residentProfile?.room?.number ??
    "-";

  const status = appointment?.status || "REQUESTED";
  const colors = statusColors(status);

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Appointment Details"
      drawerWidth="min(100vw, 560px)"
      drawerPadding="24px"
    >
      <Grid container direction="column" gap={{ xs: 1.5, sm: 2 }}>
        <Grid>
          <Typography sx={{ fontSize: { xs: "14px", sm: "16px" }, fontWeight: 600, color: "#344054" }}>
            {appointment?.appointment_title || "-"}
          </Typography>
        </Grid>

        <Grid
          container
          alignItems="center"
          sx={{
            borderRadius: "8px",
            border: "1px solid #E4E7EC",
            backgroundColor: "#F2F4F7",
            padding: { xs: "10px", sm: "12px" },
            flexWrap: "wrap",
            rowGap: { xs: 1, sm: 0 },
          }}
        >
          <Grid sx={{ mr: 2 }}>
            <Avatar
              src={residentProfile?.user?.avatar_url || undefined}
              sx={{ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}
            >
              {(residentName || "-").split(" ")[0]?.[0] || "U"}
              {(residentName || "-").split(" ")[1]?.[0] || ""}
            </Avatar>
          </Grid>

          <Grid sx={{ flex: 1 }}>
            <Grid container direction="column" gap={0.5}>
              <Grid>
                <Typography sx={{ fontSize: { xs: "13px", sm: "14px" }, fontWeight: 600, color: "#101828" }}>
                  {residentName}{" "}
                  <span style={{ color: "#667085", fontWeight: 400 }}>
                    {" "}
                    ({referralId})
                  </span>
                </Typography>
              </Grid>

              <Grid>
                <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, color: "#667085" }}>
                  {formatDateLong(dob)} ({calcAge(dob)}) | {gender} | Room {room}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid>
            <Chip
              label={status.charAt(0) + status.slice(1).toLowerCase()}
              size="small"
              sx={{
                backgroundColor: colors.bg,
                color: colors.color,
                borderRadius: "16px",
                fontWeight: 500,
                fontSize: { xs: "11px", sm: "12px" },
                height: { xs: "20px", sm: "22px" },
              }}
            />
          </Grid>
        </Grid>

        <Grid
          container
          direction="column"
          gap={1.5}
          sx={{
            borderRadius: "8px",
            border: "1px solid #E4E7EC",
            backgroundColor: "#FFFFFF",
            padding: { xs: "10px", sm: "12px" },
          }}
        >
          <Grid container alignItems="center" gap={1}>
            <CalendarTodayOutlinedIcon sx={{ fontSize: { xs: "16px", sm: "18px" }, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: { xs: "13px", sm: "14px" }, color: "#475467" }}>
              {formatDateLong(appointment?.appointment_date)}
            </Typography>
          </Grid>

          <Grid container alignItems="center" gap={1}>
            <AccessTimeOutlinedIcon sx={{ fontSize: { xs: "16px", sm: "18px" }, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: { xs: "13px", sm: "14px" }, color: "#475467" }}>
              {formatTime(appointment?.appointment_time)}
            </Typography>
          </Grid>

          <Grid container alignItems="center" gap={1}>
            <PersonOutlineOutlinedIcon sx={{ fontSize: { xs: "16px", sm: "18px" }, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: { xs: "13px", sm: "14px" }, color: "#475467" }}>
              {appointment?.provider_name || appointment?.contact_name || "-"}
            </Typography>
          </Grid>

          <Grid container alignItems="center" gap={1}>
            <EmailOutlinedIcon sx={{ fontSize: { xs: "16px", sm: "18px" }, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: { xs: "13px", sm: "14px" }, color: "#475467" }}>
              {appointment?.contact_email || "-"}
            </Typography>
          </Grid>

          <Grid container alignItems="center" gap={1}>
            <DescriptionOutlinedIcon sx={{ fontSize: { xs: "16px", sm: "18px" }, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, fontWeight: 600, color: "#344054" }}>
              Description
            </Typography>
          </Grid>

          

          <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, color: "#475467" }}>
            {appointment?.description || "-"}
          </Typography>

          <Grid container alignItems="center" gap={1}>
            <DescriptionOutlinedIcon sx={{ fontSize: { xs: "16px", sm: "18px" }, color: "#98A2B3" }} />
            <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, fontWeight: 600, color: "#344054" }}>
              Notes
            </Typography>
          </Grid>

          <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, color: "#475467" }}>
            {appointment?.action_note || "-"}
          </Typography>
        </Grid>

        <Grid container direction="column" gap={{ xs: 0.75, sm: 1 }}>
          <Grid container>
            <Grid sx={{ minWidth: "120px" }}>
              <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, color: "#667085" }}>
                Created By
              </Typography>
            </Grid>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, color: "#475467" }}>
                {appointment?.created_by_name || "-"}
              </Typography>
            </Grid>
          </Grid>

          <Grid container>
            <Grid sx={{ minWidth: "120px" }}>
              <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, color: "#667085" }}>
                Created On
              </Typography>
            </Grid>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: { xs: "12px", sm: "13px" }, color: "#475467" }}>
                {appointment?.created_at
                  ? dayjs(appointment.created_at).format("MMMM D, YYYY [at] h:mm A")
                  : "-"}
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </CustomDrawer>
  );
};

export default AppointmentDetailsDrawer;
