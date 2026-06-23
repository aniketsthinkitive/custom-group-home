import React from "react";
import { Grid, Typography, Avatar, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import EditUserDrawer from "../../appointments/components/EditUserDrawer";
import ChangePasswordDrawer from "../../appointments/components/ChangePasswordDrawer";
import { getUserDetailOptions, listResidentsOptions } from "../../../../sdk/@tanstack/react-query.gen";
import { getUserData } from "../../../../utils/auth";
import { getImageUrl } from "../../../../utils";

const GuardianProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const user = getUserData();
  const guardianUuid =
    (user as any)?.uuid ||
    (user as any)?.id ||
    (user as any)?.user?.uuid ||
    (user as any)?.user?.id ||
    "";

  const { data: guardianResponse } = useQuery(
    getUserDetailOptions({
      path: { uuid: guardianUuid },
    })
  );

  const guardian = (guardianResponse as any)?.data ?? (guardianResponse as any) ?? {};
  const fullName =
    guardian?.first_name && guardian?.last_name
      ? `${guardian.first_name} ${guardian.last_name}`
      : guardian?.name || guardian?.full_name || (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || "-");

  const relationship = guardian?.relationship || "-";
  const phone = guardian?.phone || guardian?.mobile || guardian?.contact_number || "-";
  const email = guardian?.email || "-";

  const { data: residentsData } = useQuery(
    listResidentsOptions({
      query: {
        page: 1,
        size: 100,
      },
    })
  );

  const linkedResidentsRaw =
    guardian?.linked_residents ||
    guardian?.residents ||
    [];

  const allResidentsArray: any[] =
    (residentsData as any)?.data?.results ??
    (Array.isArray((residentsData as any)?.data) ? (residentsData as any)?.data : undefined) ??
    (residentsData as any)?.results ??
    (Array.isArray(residentsData) ? (residentsData as any) : []) ??
    [];

  const linkedResidents =
    Array.isArray(linkedResidentsRaw) && linkedResidentsRaw.length > 0
      ? linkedResidentsRaw
      : allResidentsArray.filter((r: any) => {
          const g1 = r.guardian_uuid;
          const g2 = r.guardian?.uuid;
          const g3 = r.agent_uuid;
          const g4 = r.caregiver_uuid;
          return [g1, g2, g3, g4].some((g) => g && String(g) === String(guardianUuid));
        });

  const handleBack = () => navigate(-1);

  const handleResetPassword = () => {
    setResetOpen(true);
  };

  const handleEditProfile = () => {
    setEditOpen(true);
  };

  const initials = (() => {
    const name = fullName as string;
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    }
    return name.charAt(0).toUpperCase();
  })();

  const [editOpen, setEditOpen] = React.useState(false);
  const [resetOpen, setResetOpen] = React.useState(false);

  return (
    <Grid container direction="column" sx={{ minHeight: "100vh", backgroundColor: "#F6F6F6", p: 2 }}>
      <Grid container direction="column" sx={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E7E9EB", p: "24px", width: "100%" }}>
        <Grid container alignItems="center" sx={{ borderBottom: "1px solid #E7E9EB", pb: 2, mb: 2 }}>
          <Grid>
            <IconButton onClick={handleBack} sx={{ p: 0 }}>
              <ArrowBackIcon sx={{ color: "#30353A" }} />
            </IconButton>
          </Grid>
          <Grid sx={{ ml: 1, flex: 1 }}>
            <Typography sx={{ fontSize: "18px" ,fontWeight: 600, color: "#101828", fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
              {fullName}
            </Typography>
          </Grid>
          <Grid sx={{ display: "flex", gap: 1 }}>
            <CustomButton variant="outline" onClick={handleResetPassword}>
              Reset Password
            </CustomButton>
            <CustomButton variant="primary" onClick={handleEditProfile}>
              Edit Profile Details
            </CustomButton>
          </Grid>
        </Grid>

        <Grid container sx={{ border: "1px solid #E7E9EB", borderRadius: "8px", p: 2, alignItems: "flex-start", gap: 6, width: "100%" }}>
          <Grid>
            <Avatar
              src={guardian?.avatar_url || guardian?.profile_picture ? getImageUrl(guardian?.avatar_url || guardian?.profile_picture) : undefined}
              sx={{
                width: 120,
                height: 120,
                borderRadius: "999px",
                fontSize: "28px",
                fontWeight: 600,
                border: "1px solid #E4E7EC",
              }}
            >
              {initials}
            </Avatar>
          </Grid>

          <Grid sx={{ flex: 1}}>
            <Grid container direction="column" gap={"36px"}>
              <Grid container>
                <Grid sx={{ minWidth: 180 }}>
                  <Typography sx={{ fontSize: "14px", color: "#667085" }}>Guardian Name</Typography>
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "14px", color: "#2C2D2C" }}>: {fullName}</Typography>
                </Grid>
              </Grid>

              <Grid container>
                <Grid sx={{ minWidth: 180 }}>
                  <Typography sx={{ fontSize: "14px", color: "#667085" }}>Relationship</Typography>
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: "14px", color: "#2C2D2C" }}>: {relationship}</Typography>
                </Grid>
              </Grid>

              <Grid container alignItems="flex-start">
                <Grid sx={{ minWidth: 180 }}>
                  <Typography sx={{ fontSize: "14px", color: "#667085" }}>Linked Residents</Typography>
                </Grid>
                <Grid sx={{ flex: 1 }}>
                  <Grid container direction="column" gap={0.5}>
                    {linkedResidents && linkedResidents.length > 0 ? (
                      linkedResidents.map((r: any, idx: number) => (
                        <Grid key={idx}>
                          <Typography sx={{ fontSize: "14px", color: "#2C2D2C" }}>
                            {r?.resident_name ||
                              (r?.user ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim() : r?.full_name || r?.name || "-")}
                          </Typography>
                        </Grid>
                      ))
                    ) : (
                      <Grid>
                        <Typography sx={{ fontSize: "14px", color: "#2C2D2C" }}>-</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Right section */}
            <Grid sx={{ minWidth: 260, ml: "auto" }}>

            <Grid container direction="column" gap={"24px"} alignItems="flex-center">
              <Grid container justifyContent="flex-center">
                <Grid>
                  <Typography sx={{ fontSize: "14px", color: "#667085", textAlign: "right" }}>Phone Number</Typography>
                </Grid>
                <Grid sx={{ ml: 1 }}>
                  <Typography sx={{ fontSize: "14px", color: "#2C2D2C", textAlign: "right" }}>: {phone}</Typography>
                </Grid>
              </Grid>
              <Grid container justifyContent="flex-center">
                <Grid>
                  <Typography sx={{ fontSize: "14px", color: "#667085", textAlign: "right" }}>Email</Typography>
                </Grid>
                <Grid sx={{ ml: 1 }}>
                  <Typography sx={{ fontSize: "14px", color: "#2C2D2C", textAlign: "right" }}>: {email}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <EditUserDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        guardianUuid={guardianUuid}
      />
      <ChangePasswordDrawer
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        userUuid={guardianUuid}
      />
    </Grid>
  );
};

export default GuardianProfilePage;
