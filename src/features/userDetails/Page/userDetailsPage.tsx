import React, { useState, useMemo } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import {
  Grid,
  IconButton,
  Avatar,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Box,
  Typography,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useQuery } from "@tanstack/react-query";
import { getUserDetailOptions } from "../../../sdk/@tanstack/react-query.gen";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import EditUserDrawer from "../Components/EditUserDrawer";
import ResetPasswordDrawer from "../Components/ResetPasswordDrawer";
import type { UserFormData } from "../../settings/components/AddNewUserForm";
import { formatPhone } from "../../../utils";
import { usePermission } from "../../../hooks/usePermission";

// User interface matching the expected structure
interface User {
  uuid?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | number;
  ssn?: string;
  npi?: string;
  role?: {
    type?: string;
    name?: string;
    uuid?: string;
    id?: string | number;
  };
  role_type?: string;
  group_home?: string | {
    uuid?: string;
    id?: string | number;
    name?: string;
  };
  group_homes?: Array<{
    uuid?: string;
    id?: string | number;
    name?: string;
  }>;
  profile_picture?: string;
  avatar_url?: string;
  /** Signature image URL from API (S3) when user has a stored signature */
  signature_url?: string | null;
  active?: boolean;
}

interface UserDetailsPageProps {
  showResetButton?: boolean;
  showSignature?: boolean;
  /** When set (e.g. from profile route), use this instead of route param id */
  userId?: string;
  /** True when the user is viewing their own profile (bypasses users.edit permission) */
  isOwnProfile?: boolean;
}

// ✅ Figma row: Label : Value (single line)
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <Grid
      container
      alignItems="center"
      sx={{
        flexWrap: "nowrap",
        columnGap: { xs: "8px", sm: "10px" },
      }}
    >
      <Grid
        size="auto"
        sx={{ minWidth: { xs: "120px", sm: "140px", md: "160px", lg: "170px" } }}
      >
        <Typography
          sx={{
            fontSize: { xs: "12px", sm: "13px", md: "14px" },
            fontWeight: 500,
            color: "#757775",
            fontFamily: "Inter, sans-serif",
            marginBottom: 0,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
      </Grid>

      <Grid size="auto">
        <Typography
          sx={{
            fontSize: { xs: "12px", sm: "13px", md: "14px" },
            fontWeight: 500,
            color: "#757775",
            fontFamily: "Inter, sans-serif",
            marginBottom: 0,
          }}
        >
          :
        </Typography>
      </Grid>

      <Grid
        size="auto"
        sx={{ minWidth: 0, flexGrow: 1 }}
      >
        <Typography
          sx={{
            fontSize: { xs: "12px", sm: "13px", md: "14px" },
            fontWeight: 400,
            color: "#2C2D2C",
            fontFamily: "Inter, sans-serif",
            marginBottom: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value ?? "-"}
        </Typography>
      </Grid>
    </Grid>
  );
};

const UserDetailsPage: React.FC<UserDetailsPageProps> = ({
  showResetButton = false,
  showSignature = false,
  userId: userIdProp,
  isOwnProfile = false,
}) => {
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { id: idFromRoute } = useParams<{ id: string }>();
  const userUuid = userIdProp ?? idFromRoute ?? "";
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  const { hasPermission } = usePermission();
  const canEditUser = hasPermission("users.edit") || isOwnProfile;

  // Fetch user data from API - refetch when Edit drawer opens so avatar/signature are up to date
  const { data: userResponse, isLoading, isError, error, refetch: refetchUser } = useQuery({
    ...getUserDetailOptions({
      path: {
        uuid: userUuid || "",
      },
    }),
    enabled: !!userUuid,
  });

  // Extract user data from API response
  const user: User | null = useMemo(() => {
    if (!userResponse) return null;
    const responseData = userResponse as { data?: User; uuid?: string } & User;
    if (responseData?.data) return responseData.data;
    if (responseData?.uuid) return responseData as User;
    return null;
  }, [userResponse]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEditClick = () => {
    refetchUser();
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  const handleSaveEdit = () => {
    setIsEditOpen(false);
  };

  const handleResetPassword = () => {
    setIsResetPasswordOpen(true);
  };

  const handleCloseResetPassword = () => {
    setIsResetPasswordOpen(false);
  };

  const getUserFullName = () => {
    if (!user) return "User";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    return `${firstName} ${lastName}`.trim() || "User";
  };

  const formatPhoneNumber = (phone?: string | number) => {
    if (!phone) return "-";
    return formatPhone(phone);
  };

  const formatSSN = (ssn?: string) => {
    if (!ssn) return "-";
    return ssn;
  };

  const formatNPI = (npi?: string) => {
    if (!npi) return "-";
    return npi;
  };

  const getGroupHomeName = () => {
    if (user?.group_homes && Array.isArray(user.group_homes) && user.group_homes.length > 0) {
      return user.group_homes.map(gh => gh.name).join(', ');
    }
    if (!user?.group_home) return "-";
    if (typeof user.group_home === "string") return user.group_home;
    return user.group_home.name ?? "-";
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();
    return firstInitial && lastInitial
      ? `${firstInitial}${lastInitial}`
      : firstInitial || lastInitial || "U";
  };

  // Convert User to UserFormData for EditUserDrawer
  const userFormData: Partial<UserFormData> | undefined = user
    ? {
      uuid: user.uuid,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      phone: user.phone ? formatPhone(user.phone) : "",
      ssn: user.ssn || "",
      npi: user.npi || "",
      role:
        user.role?.name ||
        "",
      groupHome: user.group_homes && Array.isArray(user.group_homes) && user.group_homes.length > 0
        ? user.group_homes.map(gh => gh.uuid || String(gh.id || ""))
        : typeof user.group_home === "object" && user.group_home !== null
          ? (user.group_home.uuid ?? "")
          : "",
      profilePicture: user.avatar_url || user.profile_picture || null,
      signature: user.signature_url ?? null,
      active: user.active,
    }
    : undefined;

  // Show loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "100vh",
          width: "100vw",
          backgroundColor: "#F6F6F6",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Show error state
  if (isError || !user) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: "100vh",
          width: "100vw",
          backgroundColor: "#F6F6F6",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          padding: { xs: "12px", sm: "20px", md: "24px" },
        }}
      >
        <Typography
          sx={{
            color: "#C62828",
            fontSize: { xs: "14px", sm: "16px", md: "18px" },
            textAlign: "center",
          }}
        >
          {error
            ? "Error loading user details. Please try again."
            : "User not found."}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid
      container
      sx={{
        height: "90vh",
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px", md: "18px" },
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid
        size={{ xs: 12 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
          }}
        >
          {/* Header - same spacing as Leads/Residents/Daily Logs */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: { xs: "wrap", sm: "nowrap" },
              gap: "12px",
              paddingX: { xs: "16px", sm: "24px", md: "20px" },
              paddingTop: "16px",
              marginBottom: "16px",
            }}
          >
            {/* Left: Back Arrow + User Name */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: "8px", sm: "12px" },
                minWidth: 0,
                flex: { xs: "1 1 100%", sm: "1 1 auto" },
              }}
            >
              <IconButton
                onClick={handleBack}
                sx={{
                  padding: { xs: "6px", sm: "8px" },
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {getUserFullName()}
              </Typography>
            </Box>

            {/* Right: Action Buttons */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
                width: { xs: "100%", sm: "auto" },
                justifyContent: { xs: "flex-end", sm: "flex-start" },
              }}
            >
              {showResetButton && (
                <CustomButton variant="secondary" size="md" onClick={handleResetPassword}>
                  Reset Password
                </CustomButton>
              )}

              {canEditUser && (
                <Tooltip
                  title=""
                  arrow
                >
                  <span>
                    <CustomButton
                      variant="primary"
                      size="md"
                      onClick={handleEditClick}
                      icon={<EditIcon sx={{ fontSize: { xs: "16px", sm: "18px" } }} />}
                      iconPosition="left"
                      fullWidth={isMobile}
                    >
                      Edit Profile Details
                    </CustomButton>
                  </span>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Details Section - same horizontal padding as header */}
          <Box
            sx={{
              paddingX: { xs: "16px", sm: "24px", md: "20px" },
              paddingBottom: "16px",
              flex: 1,
              minHeight: 0,
            }}
          >
            <Grid
              container
              sx={{
                gap: { xs: "16px", sm: "20px", md: "24px" },
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E7E9EB",
              }}
            >
          <Grid
            container
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: { xs: "20px", sm: "24px", md: "28px", lg: "32px" },
              alignItems: { xs: "flex-start", sm: "center" },
              flexWrap: "nowrap",
            }}
          >
            {/* Avatar */}
            <Grid
              sx={{
                display: "flex",
                justifyContent: { xs: "center", sm: "flex-start" },
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 80, sm: 90, md: 100, lg: 120 },
                  height: { xs: 80, sm: 90, md: 100, lg: 120 },
                  border: "2px solid #E0E0E0",
                  borderRadius: "50%",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {avatarLoading && !avatarError && user?.avatar_url && (
                  <CircularProgress
                    size="100%"
                    sx={{
                      position: 'absolute',
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: { xs: 80, sm: 90, md: 100, lg: 120 },
                      height: { xs: 80, sm: 90, md: 100, lg: 120 },
                    }}
                  />
                )}
                <Avatar
                  src={user?.avatar_url && !avatarError ? user.avatar_url : undefined}
                  onLoad={() => setAvatarLoading(false)}
                  onError={() => {
                    setAvatarLoading(false);
                    setAvatarError(true);
                  }}
                  onLoadStart={() => {
                    if (user?.avatar_url) {
                      setAvatarLoading(true);
                      setAvatarError(false);
                    }
                  }}
                  sx={{
                    width: { xs: 76, sm: 86, md: 96, lg: 116 },
                    height: { xs: 76, sm: 86, md: 96, lg: 116 },
                    borderRadius: "50%",
                    fontSize: { xs: "28px", sm: "32px", md: "40px", lg: "48px" },
                    fontWeight: 500,
                    bgcolor: theme.palette.grey[500],
                    color: theme.palette.common.white,
                    display: avatarLoading ? 'none' : 'flex',
                    border: "1px solid #E0E0E0",
                  }}
                >
                  {getUserInitials()}
                </Avatar>
              </Box>
            </Grid>

            {/* Details Grid */}
            <Grid
              sx={{
                flex: "1 1 auto",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: { xs: "16px", sm: "18px", md: "20px" },
                width: { xs: "100%", sm: "auto" },
              }}
            >

              {/* Two columns (like Figma) */}
              <Grid
                container
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr",
                    md: "1fr 1fr",
                    lg: "1fr 1fr"
                  },
                  columnGap: { xs: "16px", sm: "20px", md: "32px", lg: "40px", xl: "60px" },
                  rowGap: { xs: "16px", sm: "16px", md: "18px", lg: "18px" },
                }}
              >
                <InfoRow label="Role" value={(() => { const name = user?.role?.name ?? user?.role_type ?? "-"; return name === "Agent" ? "Area Agency" : name; })()} />
                {!["agent", "guardian"].includes((user?.role?.name ?? "").toLowerCase()) && (
                  <InfoRow label="Group Home" value={getGroupHomeName()} />
                )}

                <InfoRow label="Phone Number" value={formatPhoneNumber(user?.phone)} />
                <InfoRow label="Email" value={user?.email ?? "-"} />

                {!["agent", "guardian"].includes((user?.role?.name ?? "").toLowerCase()) && (
                  <>
                    <InfoRow label="Social Security No." value={formatSSN(user?.ssn)} />
                    <InfoRow label="NPI" value={formatNPI(user?.npi)} />
                  </>
                )}

                {showSignature && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Typography
                      sx={{
                        fontSize: { xs: "12px", sm: "13px", md: "14px" },
                        fontWeight: 500,
                        color: "#6B7280",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Signature
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: "12px", sm: "13px", md: "14px" },
                        color: "#6B7280",
                        mx: "4px",
                      }}
                    >
                      :
                    </Typography>
                    {user?.signature_url ? (
                      <CheckCircleIcon sx={{ color: "#22C55E", fontSize: "18px" }} />
                    ) : (
                      <Typography
                        sx={{
                          fontSize: { xs: "12px", sm: "13px", md: "14px" },
                          fontWeight: 500,
                          color: "#1F2A37",
                        }}
                      >
                        -
                      </Typography>
                    )}
                  </Box>
                )}
              </Grid>
            </Grid>
          </Grid>
          </Grid>
          </Box>
        </Box>
      </Grid>

      {/* Edit User Drawer */}
      <EditUserDrawer
        open={isEditOpen}
        onClose={handleCloseEdit}
        initialData={userFormData}
        user={user}
        userUuid={userUuid || undefined}
        onSave={handleSaveEdit}
        showSignature={showSignature}
      />

      {/* Reset Password Drawer */}
      <ResetPasswordDrawer
        open={isResetPasswordOpen}
        onClose={handleCloseResetPassword}
        userUuid={userUuid || undefined}
      />
    </Grid>
  );
};

/** Wrapper for "own profile" route: uses current user id and shows signature + reset password */
export const UserDetailsProfilePage: React.FC = () => {
  const { user } = useAuth();

  // Robustly extract UUID from multiple possible shapes in the auth state / localStorage
  const rawUser = user as any;
  const currentUserUuid =
    rawUser?.uuid ||
    rawUser?.id ||
    rawUser?.user?.uuid ||
    rawUser?.user?.id ||
    // Fallback: read directly from localStorage in case Redux hasn't been populated yet
    (() => {
      try {
        const stored = localStorage.getItem("userData");
        if (stored) {
          const parsed = JSON.parse(stored) as any;
          return (
            parsed?.uuid ||
            parsed?.id ||
            parsed?.user?.uuid ||
            parsed?.user?.id ||
            ""
          );
        }
      } catch {
        /* ignore */
      }
      return "";
    })();

  // Determine correct fallback path based on role so portal users don't land on /admin/leads
  const isPortalUser =
    rawUser?.role?.type === "GUARDIAN" ||
    rawUser?.role?.type === "AGENT" ||
    rawUser?.role_type === "GUARDIAN" ||
    rawUser?.role_type === "AGENT";

  const fallbackPath = isPortalUser ? "/portal/careplan" : "/admin/dashboard";

  if (!currentUserUuid) {
    return <Navigate to={fallbackPath} replace />;
  }

  return (
    <UserDetailsPage
      userId={String(currentUserUuid)}
      showSignature
      showResetButton
      isOwnProfile
    />
  );
};

export default UserDetailsPage;

