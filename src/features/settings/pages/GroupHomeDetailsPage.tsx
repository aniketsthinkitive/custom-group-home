import React, { useRef, useState, useCallback, useMemo, Suspense } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Typography, Avatar, IconButton, Grid, Box } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { CustomButton } from "../../../components/custom-buttons";
import {
  retrieveGroupHomeOptions,
  retrieveGroupHomeQueryKey,
  groupHomesUpdateMutation,
  listGroupHomesQueryKey,
} from "../../../sdk/@tanstack/react-query.gen";
import { useMediaUpload } from "../../../hooks/useMediaUpload";
import type { GroupHome } from "../../../sdk/types.gen";

const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

const expandState = (abbr?: string | null) =>
  abbr ? (US_STATE_NAMES[abbr.toUpperCase()] ?? abbr) : "-";
const AddGroupHomeDrawer = React.lazy(() => import("../components/AddGroupHomeDrawer").then(module => ({ default: module.default })));
import type {
  FormState as AddGroupHomeFormState,
  InitialMediaItem,
} from "../components/AddGroupHomeDrawer";
const GroupHomeUsersTable = React.lazy(() => import("../components/GroupHomeUsersTable").then(module => ({ default: module.default })));
const AssignedStaffTab = React.lazy(() => import("../../group_home/AssignedStaffTab").then(module => ({ default: module.default })));
import ViewDocumentsDialog, {
  type ViewDocumentFile,
} from "../../appointments/components/ViewDocumentsDialog";
import {
  transformApiGroupHomeToFormState,
  transformFormDataToPayload,
  withImageMediaId,
} from "../utils/groupHomeFormUtils";
import type { FileItem } from "../../../components/custom-fileupload/custom-fileupload";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import { usePermission } from "../../../hooks/usePermission";
import Tooltip from "@mui/material/Tooltip";
import { formatPhone } from "../../../utils";

const GRID_SIZE = 4;
const gs = (n: number) => `${n * GRID_SIZE}px`;

type GroupHomeWithAvatar = GroupHome & { avatar_url?: string | null };

const GroupHomeDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const queryClient = useQueryClient();
  const formDataRef = useRef<AddGroupHomeFormState | null>(null);

  const { hasPermission } = usePermission();
  const canEditGroupHome = hasPermission("group_homes.edit");
  const [searchParams] = useSearchParams();
  const initialTabParam = searchParams.get("tab");
  const initialTab: "profile" | "users" | "assigned_staff" =
    initialTabParam === "users" ||
    initialTabParam === "assigned_staff" ||
    initialTabParam === "profile"
      ? initialTabParam
      : "profile";
  const [activeTab, setActiveTab] = useState<
    "profile" | "users" | "assigned_staff"
  >(initialTab);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentDialogIndex, setDocumentDialogIndex] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({ isOpen: false, message: "", status: "success" });

  const {
    data: groupHomeData,
    isLoading,
    isError,
  } = useQuery({
    ...retrieveGroupHomeOptions({ path: { uuid: uuid ?? "" } }),
    enabled: !!uuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const groupHome: GroupHomeWithAvatar | null =
    (groupHomeData as { data?: GroupHomeWithAvatar })?.data ?? null;

  const canEditUser = hasPermission("users.edit");
  const canDeactivateUser = hasPermission("users.deactivate");

  const documentFiles: ViewDocumentFile[] = useMemo(() =>
    groupHome?.media?.map((m) => ({
      id: m.id,
      file_url: m.file_url ?? "",
      original_filename: m.original_filename,
      file_size: m.file_size,
      mime_type: m.mime_type,
      file_type: m.file_type,
    })) ?? [], [groupHome?.media]);

  const { upload: uploadMedia } = useMediaUpload({
    contentTypeApp: "group_home",
    contentTypeModel: "grouphome",
  });

  const uploadGroupHomeImageWithObjectId = async (
    file: File,
    objectId: string | number,
  ): Promise<string | null> => {
    const result = await uploadMedia(file, {
      objectUuid: objectId,
      altText: "group_home_profile",
    });
    return result.id || null;
  };

  const uploadCertificateFilesWithObjectId = async (
    fileItems: FileItem[],
    objectId: number,
  ): Promise<string[]> => {
    const filesToUpload = fileItems.filter((item) => item?.file);
    if (filesToUpload.length === 0) return [];
    const results = await Promise.all(
      filesToUpload.map((item) =>
        uploadMedia(item.file!, { objectUuid: objectId })
      )
    );
    return results.map((r) => r.id).filter(Boolean);
  };

  const updateGroupHome = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(groupHomesUpdateMutation() as any),
    onSuccess: (data: unknown) => {
      formDataRef.current = null;
      setIsEditDrawerOpen(false);
      const msg =
        (data as { message?: string; data?: { message?: string } })?.message ??
        (data as { data?: { message?: string } })?.data?.message;
      
      // Invalidate queries - React Query will automatically refetch active queries
      // Only invalidate, don't explicitly refetch to avoid duplicate calls
      const detailQueryKey = retrieveGroupHomeQueryKey({ path: { uuid: uuid ?? "" } });
      queryClient.invalidateQueries({ queryKey: detailQueryKey });
      queryClient.refetchQueries({ queryKey: detailQueryKey });
      
      // Also invalidate list queries - but this will only refetch active ones
      // Other components using size=1000 won't refetch unless they're active
      queryClient.invalidateQueries({ queryKey: listGroupHomesQueryKey() });
      
      if (msg)
        setSnackbar({ isOpen: true, message: String(msg), status: "success" });
    },
    onError: (error: {
      response?: { 
        data?: { 
          message?: string;
          detail?: string;
          details?: string;
          error?: string;
        } 
      };
      message?: string;
    }) => {
      // Extract error message from backend response - check all possible error fields
      const errorData = error?.response?.data;
      const msg =
        errorData?.message ??
        errorData?.detail ??
        errorData?.details ??
        errorData?.error ??
        error?.message ??
        "Failed to update group home.";
      setSnackbar({ isOpen: true, message: String(msg), status: "error" });
    },
  });

  const handleEditClick = useCallback(() => setIsEditDrawerOpen(true), []);
  const handleCloseEditDrawer = useCallback(() => setIsEditDrawerOpen(false), []);

  const handleSaveGroupHome = async (formData: AddGroupHomeFormState) => {
    if (
      !formData.groupHomeName?.trim() ||
      !formData.timeZone ||
      !formData.contactNumber?.trim() ||
      !formData.faxNumber?.trim() ||
      !formData.addressLine1?.trim()
    ) {
      return;
    }
    if (!uuid || !groupHome) return;

    formDataRef.current = formData;
    const groupHomeId = groupHome.id;

    let imageMediaId: string | null | undefined = formData.imageMediaId ?? null;
    const newImageFile = formData.groupHomeImageFiles?.[0]?.file;
    if (!imageMediaId && newImageFile && groupHomeId != null) {
      try {
        imageMediaId = await uploadGroupHomeImageWithObjectId(
          newImageFile,
          groupHomeId,
        );
      } catch {
        setSnackbar({
          isOpen: true,
          message: "Profile image upload failed. Please try again.",
          status: "error",
        });
        return;
      }
    }

    const newCertFiles =
      formData.certificateFiles?.filter((f) => f?.file) ?? [];
    let allMediaIds = formData.certificateMediaIds ?? [];
    if (newCertFiles.length > 0 && groupHomeId != null) {
      try {
        const newIds = await uploadCertificateFilesWithObjectId(
          newCertFiles,
          groupHomeId,
        );
        allMediaIds = [...allMediaIds, ...newIds];
      } catch {
        setSnackbar({
          isOpen: true,
          message: "Certificate upload failed. Please try again.",
          status: "error",
        });
        return;
      }
    }

    const payload = withImageMediaId(
      transformFormDataToPayload({
        ...formData,
        certificateMediaIds: allMediaIds,
      }),
      imageMediaId ?? null,
    );
    // Cast needed when spreading SDK mutation with custom onSuccess/onError
    (
      updateGroupHome.mutate as unknown as (vars: {
        path: { uuid: string };
        body: typeof payload;
      }) => void
    )({ path: { uuid: uuid ?? "" }, body: payload });
  };

  const initialMedia: InitialMediaItem[] = useMemo(
    () =>
      groupHome?.media?.map((m) => ({
        id: m.id,
        name: m.original_filename,
        original_filename: m.original_filename,
      })) ?? [],
    [groupHome?.media],
  );


  return (
    <Grid
      container
      sx={{
        backgroundColor: "#F6F6F6",
        minHeight: "90vh",
        height: "90vh",
        padding: { xs: gs(3), sm: gs(5) },
        boxSizing: "border-box",
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ================= MAIN OUTER CONTAINER ================= */}
      <Grid
        container
        sx={{
          border: `1px solid #DEE4ED`,
          borderRadius: gs(2),
          backgroundColor: "#FFFFFF",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
          width: "100%",
          minWidth: 0,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ================= HEADER ================= */}
        <Grid
          container
          sx={{
            border: `1px solid #DEE4ED`,
            backgroundColor: "#FFFFFF",
            padding: { xs: `${gs(2)} ${gs(2)}`, sm: `${gs(2.5)} ${gs(3)}`, md: `${gs(2.5)} ${gs(4)}` },
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            gap: { xs: gs(2), sm: 0 },
            width: "100%",
            boxSizing: "border-box",
            marginLeft: "0px !important",
            marginRight: "0px !important",
          }}
        >
          {/* LEFT */}
          <Grid
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: gs(1.5), sm: gs(2) },
              flexWrap: { xs: "wrap", sm: "nowrap" },
              minWidth: 0,
              flex: { xs: "1 1 100%", sm: "0 0 auto" },
              order: { xs: 1, sm: 1 },
            }}
          >
            {/* Arrow + Name */}
            <Grid
              container
              sx={{
                alignItems: "center",
                gap: { xs: gs(1), sm: gs(2) },
                flexWrap: "nowrap",
                minWidth: 0,
                width: "auto",
                flex: { xs: "1 1 auto", sm: "0 0 auto" },
              }}
            >
              <Grid sx={{ flex: "0 0 auto" }}>
                <IconButton
                  onClick={() => navigate("/admin/settings")}
                  sx={{ padding: { xs: gs(0.5), sm: gs(1) } }}
                >
                  <ArrowBackIcon sx={{ fontSize: { xs: gs(4), sm: gs(5) }, color: "#27313F" }} />
                </IconButton>
              </Grid>

              <Grid sx={{ minWidth: 0, flex: { xs: "1 1 auto", sm: "0 0 auto" } }}>
                <Typography
                  sx={{
                    fontSize: { xs: gs(3), sm: gs(3.25), md: gs(3.5) },
                    fontWeight: 500,
                    color: "#27313F",
                    fontFamily: "Inter, sans-serif",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: { xs: "150px", sm: "200px", md: "280px", lg: "none" },
                  }}
                >
                  {isLoading ? "Loading..." : groupHome?.name || "Group Home"}
                </Typography>
              </Grid>
            </Grid>

            {/* Toggle */}
            <Grid
              container
              sx={{
                display: "inline-flex",
                flexWrap: "nowrap",
                whiteSpace: "nowrap",
                backgroundColor: "#F6F7F9",
                border: `1px solid #DEE4ED`,
                borderRadius: gs(2),
                padding: gs(0.5),
                height: { xs: gs(7), sm: gs(8) },
                alignItems: "center",
                gap: gs(0.5),
                width: { xs: gs(60), sm: gs(70) },
                flexShrink: 0,
              }}
            >
              <Typography
                onClick={() => setActiveTab("profile")}
                sx={{
                  cursor: "pointer",
                  height: { xs: gs(6), sm: gs(7) },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: { xs: `0 ${gs(2.5)}`, sm: `0 ${gs(3.5)}` },
                  borderRadius: gs(1.5),
                  fontSize: { xs: gs(2.75), sm: gs(3) },
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                  color: activeTab === "profile" ? "#11466D" : "#6B7280",
                  backgroundColor:
                    activeTab === "profile" ? "#E7F2FF" : "transparent",
                  flex: 1,
                }}
              >
                Profile
              </Typography>

              <Typography
                onClick={() => setActiveTab("users")}
                sx={{
                  cursor: "pointer",
                  height: { xs: gs(6), sm: gs(7) },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: { xs: `0 ${gs(2.5)}`, sm: `0 ${gs(3.5)}` },
                  borderRadius: gs(1.5),
                  fontSize: { xs: gs(2.75), sm: gs(3) },
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                  color: activeTab === "users" ? "#11466D" : "#6B7280",
                  backgroundColor:
                    activeTab === "users" ? "#E7F2FF" : "transparent",
                  flex: 1,
                }}
              >
                Users
              </Typography>

              {/* <Typography
                onClick={() => setActiveTab("assigned_staff")}
                sx={{
                  cursor: "pointer",
                  height: { xs: gs(6), sm: gs(7) },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: { xs: `0 ${gs(2.5)}`, sm: `0 ${gs(3.5)}` },
                  borderRadius: gs(1.5),
                  fontSize: { xs: gs(2.75), sm: gs(3) },
                  fontWeight: 500,
                  fontFamily: "Inter, sans-serif",
                  whiteSpace: "nowrap",
                  color: activeTab === "assigned_staff" ? "#11466D" : "#6B7280",
                  backgroundColor:
                    activeTab === "assigned_staff" ? "#E7F2FF" : "transparent",
                  flex: 1,
                }}
              >
                Assigned Staff
              </Typography> */}
            </Grid>
          </Grid>

          {/* RIGHT */}
          <Grid
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", sm: "flex-end" },
              flexWrap: "nowrap",
              flexShrink: 0,
              flex: { xs: "1 1 100%", sm: "0 0 auto" },
              order: { xs: 2, sm: 2 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {activeTab === "profile" && (
              <Tooltip
                title={!canEditGroupHome ? "You don't have permission" : ""}
                arrow
                placement="top"
                disableHoverListener={canEditGroupHome}
              >
                <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                  <CustomButton
                    variant="primary"
                    size="md"
                    fullWidth={false}
                    icon={<EditIcon sx={{ fontSize: { xs: gs(3.5), sm: gs(4) } }} />}
                    iconPosition="left"
                    onClick={handleEditClick}
                    disabled={!canEditGroupHome}
                  >
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                      Edit Profile Details
                    </Box>
                    <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                      Edit
                    </Box>
                  </CustomButton>
                </Box>
              </Tooltip>
            )}
          </Grid>
        </Grid>

        {/* ================= BODY ================= */}
        <Grid
          container
          sx={{
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            width: "100%",
            minWidth: 0,
            padding: { xs: gs(3), sm: gs(4), md: gs(6) },
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Loading State */}
          {isLoading && (
            <Grid
              container
              sx={{
                justifyContent: "center",
                alignItems: "center",
                padding: gs(10), // 40px
                width: "100%",
                minWidth: 0,
              }}
            >
              <Typography sx={{ fontSize: gs(3.5), color: "#8A8F98" }}>
                Loading group home details...
              </Typography>
            </Grid>
          )}

          {/* Error State */}
          {isError && (
            <Grid
              container
              sx={{
                justifyContent: "center",
                alignItems: "center",
                padding: gs(10), // 40px
                width: "100%",
                minWidth: 0,
              }}
            >
              <Typography sx={{ fontSize: gs(3.5), color: "#D32F2F" }}>
                Error loading group home details. Please try again.
              </Typography>
            </Grid>
          )}

          {/* ================= PROFILE TAB ================= */}
          {!isLoading && !isError && activeTab === "profile" && groupHome && (
            <>
              {/* ===== Group Home Info Card ===== */}
              <Grid
                container
                sx={{
                  border: `1px solid #DEE4ED`,
                  borderRadius: gs(2),
                  backgroundColor: "#FFFFFF",
                  padding: { xs: `${gs(3)} ${gs(3)}`, sm: `${gs(4)} ${gs(4)}`, md: `${gs(4)} ${gs(6)} ${gs(6)} ${gs(6)}` },
                  overflow: "hidden",
                  boxSizing: "border-box",
                  width: "100%",
                  minWidth: 0,
                  flexShrink: 0,
                  marginBottom: { xs: gs(4), sm: gs(5), md: gs(6) },
                }}
              >
                <Grid
                  container
                  sx={{
                    marginLeft: 0,
                    marginRight: 0,
                    width: "100%",
                    alignItems: { xs: "center", sm: "flex-start" },
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: gs(3), sm: gs(4) },
                    minWidth: 0,
                  }}
                >
                  {/* Avatar - separate from documents (API: avatar_url) */}
                  <Grid size={{ xs: 12, sm: "auto" }} sx={{ display: "flex", justifyContent: { xs: "center", sm: "flex-start" } }}>
                    <Avatar
                      src={groupHome.avatar_url ?? undefined}
                      slotProps={{
                        img: {
                          loading: "lazy" as const,
                        },
                      }}
                      sx={{
                        width: { xs: "100px", sm: "110px", md: "130px" },
                        height: { xs: "100px", sm: "110px", md: "130.30px" },
                        borderRadius: "50%",
                        border: `1px solid #E7E9EB`,
                        bgcolor: "#F2F7FA",
                        fontSize: { xs: gs(5), sm: gs(5.5), md: gs(6) },
                        fontWeight: 600,
                        color: "#11466D",
                      }}
                    >
                      {!groupHome.avatar_url &&
                        ((groupHome.name || "Group Home")
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || (
                          <CloudUploadOutlinedIcon
                            sx={{ fontSize: { xs: 36, sm: 42, md: 48 }, color: "#9CA3AF" }}
                          />
                        ))}
                    </Avatar>
                  </Grid>

                  {/* Details */}
                  <Grid size={{ xs: 12, sm: true }} sx={{ minWidth: 0, flex: 1 }}>
                    <Grid
                      container
                      columnSpacing={{ xs: 0, md: 4 }}
                      rowSpacing={{ xs: 2, md: 0 }}
                      sx={{
                        marginLeft: 0,
                        marginRight: 0,
                        width: "100%",
                        minWidth: 0,
                      }}
                    >
                      {/* Left */}
                      <Grid
                        size={{ xs: 12, md: 6 }}
                        sx={{ minWidth: 0 }}
                      >
                        <Grid
                          container
                          sx={{
                            flexDirection: "column",
                            gap: { xs: gs(3), sm: gs(4) },
                            marginLeft: 0,
                            marginRight: 0,
                            minWidth: 0,
                          }}
                        >
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Group Home Name"
                              value={groupHome.name || "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Phone Number"
                              value={groupHome.phone ? formatPhone(groupHome.phone) : "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Fax Number"
                              value={groupHome.fax ? formatPhone(groupHome.fax) : "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Address Line 1"
                              value={groupHome.address?.line1 || "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="City"
                              value={groupHome.address?.city || "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="ZIP Code"
                              value={groupHome.address?.zipcode || "-"}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Right */}
                      <Grid
                        size={{ xs: 12, md: 6 }}
                        sx={{ minWidth: 0 }}
                      >
                        <Grid
                          container
                          sx={{
                            flexDirection: "column",
                            gap: { xs: gs(3), sm: gs(4) },
                            marginLeft: 0,
                            marginRight: 0,
                            minWidth: 0,
                          }}
                        >
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Email"
                              value={groupHome.email || "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Time zone"
                              value={groupHome.timezone?.toString() || "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Address Line 2"
                              value={groupHome.address?.line2 || "-"}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="State"
                              value={expandState(groupHome.address?.state)}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                            <DetailRow
                              label="Country"
                              value={groupHome.address?.country || "-"}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* ===== Uploaded Certificates (media documents) ===== */}
              <Grid
                container
                sx={{
                  border: `1px solid #DEE4ED`,
                  borderRadius: gs(2),
                  backgroundColor: "#FFFFFF",
                  padding: { xs: `${gs(3)} ${gs(3)}`, sm: `${gs(4)} ${gs(4)}`, md: `${gs(4)} ${gs(6)} ${gs(6)} ${gs(6)}` },
                  flexDirection: "column",
                  boxSizing: "border-box",
                  width: "100%",
                  minWidth: 0,
                  overflow: "hidden",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 500,
                    color: "#27313F",
                    fontFamily: "Inter, sans-serif",
                    fontSize: { xs: gs(3.25), sm: gs(3.5) },
                  }}
                >
                  Uploaded Certificates
                </Typography>

                {documentFiles.length > 0 ? (
                  /* Inner scroll: only the document grid scrolls, card is fixed */
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: "auto",
                      overflowX: "hidden",
                      mt: { xs: gs(3), sm: gs(4) },
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: gs(2),
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                    {documentFiles.map((doc, index) => {
                      const isPdf = doc.mime_type
                        ?.toLowerCase()
                        .includes("pdf");
                      const isImage = doc.mime_type
                        ?.toLowerCase()
                        .includes("image");
                      return (
                        <Box
                          key={doc.id}
                          component="button"
                          type="button"
                          onClick={() => {
                            setDocumentDialogIndex(index);
                            setDocumentDialogOpen(true);
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: gs(3),
                            border: `1px solid #DEE4ED`,
                            borderRadius: gs(2),
                            padding: gs(3),
                            minHeight: gs(14),
                            width: "100%",
                            boxSizing: "border-box",
                            backgroundColor: "#FFFFFF",
                            cursor: "pointer",
                            textAlign: "left",
                            minWidth: 0,
                            overflow: "hidden",
                            "&:hover": { backgroundColor: "#F6F7F9" },
                          }}
                        >
                          <Box sx={{ flexShrink: 0 }}>
                            {isPdf ? (
                              <PictureAsPdfIcon
                                sx={{ fontSize: gs(6), color: "#D32F2F" }}
                              />
                            ) : isImage ? (
                              <ImageIcon
                                sx={{ fontSize: gs(6), color: "#1976d2" }}
                              />
                            ) : (
                              <InsertDriveFileIcon
                                sx={{ fontSize: gs(6), color: "#757575" }}
                              />
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: gs(3.5),
                              fontWeight: 500,
                              color: "#27313F",
                              fontFamily: "Inter, sans-serif",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            {doc.original_filename || "Document"}
                          </Typography>
                        </Box>
                      );
                    })}
                    </Box>
                  </Box>
                ) : (
                  <Typography
                    sx={{ fontSize: gs(3.5), color: "#8A8F98", padding: gs(4) }}
                  >
                    No certificates uploaded
                  </Typography>
                )}
              </Grid>

              {/* Document viewer dialog (view certificate on click) */}
              <ViewDocumentsDialog
                open={documentDialogOpen}
                onClose={() => setDocumentDialogOpen(false)}
                files={documentFiles}
                title="View Certificate"
                initialIndex={documentDialogIndex}
                allowDownload
              />
            </>
          )}

          {/* ================= USERS TAB ================= */}
          {activeTab === "users" && (
            <Grid
              container
              sx={{
                border: `1px solid #DEE4ED`,
                borderRadius: { xs: gs(2), sm: "10px" },
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
                backgroundColor: "#FFFFFF",
                flexDirection: "column",
                overflow: "hidden",
                boxSizing: "border-box",
                width: "100%",
                minWidth: 0,
                flex: 1,
                minHeight: { xs: 400, sm: 280 },
                maxHeight: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: gs(3.25), sm: gs(3.5) },
                  fontWeight: 600,
                  color: "#27313F",
                  paddingX: { xs: gs(2), sm: gs(3), md: gs(5) },
                  paddingTop: { xs: gs(2), sm: gs(4) },
                  paddingBottom: { xs: gs(1.5), sm: gs(2) },
                }}
              >
                Users
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "visible",
                  paddingX: { xs: gs(2), sm: gs(3), md: gs(5) },
                  paddingBottom: { xs: gs(2), sm: gs(3), md: gs(5) },
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <Suspense fallback={null}>
                  <GroupHomeUsersTable
                  groupHomeUuid={uuid}
                  canEditUser={canEditUser}
                  canDeactivateUser={canDeactivateUser}
/>
                </Suspense>
              </Box>
            </Grid>
          )}

          {/* ================= ASSIGNED STAFF TAB ================= */}
          {activeTab === "assigned_staff" && (
            <Grid
              container
              sx={{
                border: `1px solid #DEE4ED`,
                borderRadius: { xs: gs(2), sm: "10px" },
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
                backgroundColor: "#FFFFFF",
                flexDirection: "column",
                overflow: "hidden",
                boxSizing: "border-box",
                width: "100%",
                minWidth: 0,
                flex: 1,
                minHeight: { xs: 400, sm: 280 },
                maxHeight: "100%",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: gs(3.25), sm: gs(3.5) },
                  fontWeight: 600,
                  color: "#27313F",
                  paddingX: { xs: gs(2), sm: gs(3), md: gs(5) },
                  paddingTop: { xs: gs(2), sm: gs(4) },
                  paddingBottom: { xs: gs(1.5), sm: gs(2) },
                }}
              >
                Assigned Staff
              </Typography>

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto",
                  paddingX: { xs: gs(2), sm: gs(3), md: gs(5) },
                  paddingBottom: { xs: gs(2), sm: gs(3), md: gs(5) },
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <Suspense fallback={null}>
                  {uuid && <AssignedStaffTab homeUuid={uuid} />}
                </Suspense>
              </Box>
            </Grid>
          )}
        </Grid>
      </Grid>

      {isEditDrawerOpen && (
        <Suspense fallback={null}>
          <AddGroupHomeDrawer
            open={isEditDrawerOpen}
            onClose={handleCloseEditDrawer}
            onSave={handleSaveGroupHome}
            formname="Edit Group Home"
            isLoading={updateGroupHome.isPending}
            initialData={
              groupHome ? transformApiGroupHomeToFormState(groupHome) : undefined
            }
            initialImageUrl={groupHome?.avatar_url ?? null}
            initialMedia={initialMedia}
            onError={(message) =>
              setSnackbar({ isOpen: true, message, status: "error" })
            }
          />
        </Suspense>
      )}

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar((p) => ({ ...p, isOpen: false }))}
      />
    </Grid>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Typography
    sx={{ fontSize: gs(3.5), fontWeight: 400, fontFamily: "Inter, sans-serif" }}
  >
    <Typography
      component="span"
      sx={{ color: "#8A8F98", fontSize: gs(3.5), fontWeight: 400 }}
    >
      {label}
    </Typography>
    <Typography
      component="span"
      sx={{ color: "#27313F", fontSize: gs(3.5), fontWeight: 400 }}
    >
      {" : "}
      {value}
    </Typography>
  </Typography>
);

export default GroupHomeDetailsPage;
