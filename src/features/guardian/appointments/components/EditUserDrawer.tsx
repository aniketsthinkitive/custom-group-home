import React, { useRef, useEffect } from "react";
import { Grid, Typography, Avatar, Chip, Box, IconButton } from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CustomDrawer from "../../../../components/custom-drawer/custom-drawer";
import CustomInput from "../../../../components/custom-input/custom-input";
import CustomSelect from "../../../../components/custom-select/custom-select";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import CustomAutocompleteMultiselect from "../../../../components/custom-autocomplete-multiselect/custom-autocomplete-multiselect";
import CustomFileUpload, { type FileItem } from "../../../../components/custom-fileupload/custom-fileupload";
import {
  getUserDetailOptions,
  listResidentsOptions,
  updateUserMutation,
  getUserDetailQueryKey,
} from "../../../../sdk/@tanstack/react-query.gen";
import { useMediaUpload } from "../../../../hooks/useMediaUpload";
import type { UserWritable } from "../../../../sdk/types.gen";
import { getImageUrl } from "../../../../utils";
import CommonSnackbar from "../../../../components/common-snackbar/common-snackbar";

type Props = {
  open: boolean;
  onClose: () => void;
  guardianUuid: string;
};

const relationshipItems = [
  { value: "MOTHER", label: "Mother" },
  { value: "FATHER", label: "Father" },
  { value: "DAUGHTER", label: "Daughter" },
  { value: "SON", label: "Son" },
  { value: "SIBLING", label: "Sibling" },
  { value: "OTHER", label: "Other" },
];

const EditUserDrawer: React.FC<Props> = ({ open, onClose, guardianUuid }) => {
  const queryClient = useQueryClient();

  const userQuery = useQuery(getUserDetailOptions({ path: { uuid: guardianUuid } }));
  const guardianResponse: any = userQuery.data;
  const guardian = guardianResponse?.data ?? guardianResponse ?? {};

  const residentsQuery = useQuery(
    listResidentsOptions({
      query: { page: 1, size: 200 },
    })
  );
  const residentsRaw: any[] =
    residentsQuery.data?.data?.results ??
    (Array.isArray(residentsQuery.data?.data) ? residentsQuery.data?.data : undefined) ??
    (residentsQuery.data as any)?.results ??
    (Array.isArray(residentsQuery.data) ? (residentsQuery.data as any) : []) ??
    [];

  const residentOptions = React.useMemo(
    () =>
      residentsRaw.map((r: any) => ({
        key: String(r.id ?? r.uuid ?? r.lead_uuid ?? r.user?.id ?? r.user?.uuid ?? r.resident_id ?? ""),
        value:
          r?.resident_name ||
          (r?.user ? `${r.user.first_name || ""} ${r.user.last_name || ""}`.trim() : r?.full_name || r?.name || "-"),
      })),
    [residentsRaw]
  );

  const prefilledResidentsKeys: string[] = React.useMemo(() => {
    const linked = guardian?.linked_residents || guardian?.residents || [];
    if (!Array.isArray(linked)) return [];
    
    // Check if linked contains objects with UUIDs (from our updated API)
    return linked.map((r: any) => String(r?.uuid || r?.lead_uuid || r?.id || ""));
  }, [guardian]);

  const [firstName, setFirstName] = React.useState<string>(guardian?.first_name || "");
  const [lastName, setLastName] = React.useState<string>(guardian?.last_name || "");
  const [email, setEmail] = React.useState<string>(guardian?.email || "");
  const [phone, setPhone] = React.useState<string>(String(guardian?.phone || guardian?.mobile || "") || "");
  const [relationship, setRelationship] = React.useState<string>(guardian?.relationship || "");
  const [residentKeys, setResidentKeys] = React.useState<string[]>(prefilledResidentsKeys);
  const [signatureFiles, setSignatureFiles] = React.useState<FileItem[]>([]);
  const [profilePicture, setProfilePicture] = React.useState<File | null>(null);
  const [profilePreview, setProfilePreview] = React.useState<string | null>(null);
  const [snackbar, setSnackbar] = React.useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFirstName(guardian?.first_name || "");
    setLastName(guardian?.last_name || "");
    setEmail(guardian?.email || "");
    setPhone(String(guardian?.phone || guardian?.mobile || "") || "");
    setRelationship(guardian?.relationship || "");
    setResidentKeys(prefilledResidentsKeys);
  }, [guardian, prefilledResidentsKeys]);

  useEffect(() => {
    if (!open) {
      setProfilePicture(null);
      setProfilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (guardian) {
      const avatarUrl = guardian?.avatar_url || guardian?.profile_picture;
      if (avatarUrl && typeof avatarUrl === "string") {
        setProfilePreview(getImageUrl(avatarUrl));
        setProfilePicture(null);
      } else {
        setProfilePreview(null);
        setProfilePicture(null);
      }
    }
  }, [open, guardian?.avatar_url, guardian?.profile_picture]);

  const { upload: uploadMedia } = useMediaUpload({
    contentTypeApp: "accounts",
    contentTypeModel: "user",
  });

  const mutation = useMutation({
    ...updateUserMutation(),
    onSuccess: async () => {
      const queryKey = getUserDetailQueryKey({ path: { uuid: guardianUuid } });
      queryClient.invalidateQueries({ queryKey });
      await queryClient.refetchQueries({ queryKey });
      onClose();
    },
  });

  const uploadProfilePicture = async (): Promise<string | null> => {
    if (!profilePicture) return null;
    const result = await uploadMedia(profilePicture);
    return result.id || null;
  };

  const handleRemoveProfilePic = (e: React.MouseEvent) => {
    e.stopPropagation();
    setProfilePicture(null);
    setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    const body: Record<string, unknown> = {
      username: guardian?.username || (guardian?.email ? String(guardian.email).split("@")[0] : `${firstName || ""}${lastName || ""}` || "user"),
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone ? Number(String(phone).replace(/\D/g, "")) : undefined,
    };
    if (profilePicture) {
      try {
        const mediaId = await uploadProfilePicture();
        if (mediaId) body.profile_picture_media_id = mediaId;
      } catch {
        // Still save name/email/phone even if avatar upload fails
      }
    } else if (!profilePreview) {
      // Avatar was removed — signal deletion to backend
      body.avatar_url = null;
      body.profile_picture_media_id = null;
    }

    if (signatureFiles.length > 0) {
      try {
        const result = await uploadMedia(signatureFiles[0].file);
        if (result?.id || result?.uuid) {
          body.signature_media_id = result.id || result.uuid;
        }
      } catch {
        // ignore
      }
    }

    if (relationship) body.relationship = relationship;
    if (residentKeys.length > 0) body.linked_residents = residentKeys;

    mutation.mutate({
      path: { uuid: guardianUuid },
      body: body as UserWritable,
    });
  };

  const handleCancel = () => {
    setFirstName(guardian?.first_name || "");
    setLastName(guardian?.last_name || "");
    setEmail(guardian?.email || "");
    setPhone(String(guardian?.phone || guardian?.mobile || "") || "");
    setRelationship(guardian?.relationship || "");
    setResidentKeys(prefilledResidentsKeys);
    setSignatureFiles([]);
    setProfilePicture(null);
    setProfilePreview(guardian?.avatar_url || guardian?.profile_picture ? getImageUrl(guardian?.avatar_url || guardian?.profile_picture) : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setSnackbar({
        isOpen: true,
        message: "Unsupported file format. Please upload JPG, JPEG, or PNG images.",
        status: "error",
      });
      if (event.target) {
        event.target.value = "";
      }
      return;
    }

    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const initials = React.useMemo(() => {
    const parts = `${guardian?.first_name || ""} ${guardian?.last_name || ""}`.trim().split(" ");
    if (parts.length >= 2) return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    const name = parts[0] || guardian?.email || "-";
    return name.charAt(0).toUpperCase();
  }, [guardian]);

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      title="Edit User"
      drawerWidth="720px"
      onClose={onClose}
      drawerPadding="24px"
    >
      <Grid container direction="column" gap={2} sx={{ height: "100%" }}>
        <Grid
          container
          sx={{ border: "1px solid #E7E9EB", borderRadius: "8px", p: 2, flex: 1, overflow: "auto" }}
          direction="column"
          gap={2}
        >
          <Grid container alignItems="center" gap={2}>
            <Grid>
              <Typography sx={{ fontSize: "12px", color: "#667085" }}>Profile Pic</Typography>
            </Grid>
          </Grid>
          <Box
            sx={{
              position: "relative",
              display: "inline-block",
              cursor: "pointer",
            }}
            onClick={handleAvatarClick}
          >
            {profilePreview ? (
              <Avatar
                src={profilePreview}
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  border: "1px solid #E4E7EC",
                }}
              />
            ) : (
              <Avatar sx={{ width: 96, height: 96, border: "1px solid #E4E7EC" }}>
                {initials}
              </Avatar>
            )}
            {profilePreview && (
              <IconButton
                size="small"
                onClick={handleRemoveProfilePic}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  backgroundColor: "#fff",
                  border: "1px solid #E4E7EC",
                  "&:hover": { backgroundColor: "#FEE2E2" },
                  width: 28,
                  height: 28,
                }}
              >
                <DeleteOutline sx={{ fontSize: 16, color: "#EF4444" }} />
              </IconButton>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </Box>

          <Grid container gap={2}>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "12px", color: "#667085", mb: 0.5 }}>First Name *</Typography>
              <CustomInput
                name="first_name"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(String((e.target as any).value))}
                bgWhite
                required
              />
            </Grid>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "12px", color: "#667085", mb: 0.5 }}>Last Name *</Typography>
              <CustomInput
                name="last_name"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(String((e.target as any).value))}
                bgWhite
                required
              />
            </Grid>
          </Grid>

          <Grid container gap={2}>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "12px", color: "#667085", mb: 0.5 }}>Email *</Typography>
              <CustomInput
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(String((e.target as any).value))}
                isEmail
                bgWhite
                required
              />
            </Grid>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "12px", color: "#667085", mb: 0.5 }}>Phone *</Typography>
              <CustomInput
                name="phone"
                placeholder="(555) 555-5555"
                value={phone}
                onChange={(e) => setPhone(String((e.target as any).value))}
                phone
                bgWhite
                required
              />
            </Grid>
          </Grid>

          <Grid container gap={2}>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "12px", color: "#667085", mb: 0.5 }}>Relationship</Typography>
              <CustomSelect
                name="relationship"
                placeholder="Select Relationship"
                value={relationship || ""}
                items={relationshipItems}
                onChange={(e) => {
                  const val = (e.target as any).value;
                  setRelationship(String(val));
                }}
                bgWhite
                menuProps={{ PaperProps: { style: { maxHeight: 300, width: 260 } } }}
              />
            </Grid>
            <Grid sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "12px", color: "#667085", mb: 0.5 }}>Residents</Typography>
              <CustomAutocompleteMultiselect
                options={residentOptions}
                value={residentKeys}
                onChange={setResidentKeys}
                placeholder="Select residents"
                limitTags={4}
                hasStartSearchIcon
                loading={residentsQuery.isLoading}
                menuProps={{ PaperProps: { style: { maxHeight: 320, width: 360 } } }}
              />
              <Grid container gap={1} sx={{ mt: 1 }}>
                {residentOptions
                  .filter((opt) => residentKeys.includes(opt.key))
                  .map((opt) => (
                    <Chip key={opt.key} label={opt.value} sx={{ height: 28 }} />
                  ))}
              </Grid>
            </Grid>
          </Grid>

          <Grid container direction="column" gap={1}>
            <Typography sx={{ fontSize: "12px", color: "#667085" }}>Add Signature</Typography>
            <CustomFileUpload
              files={signatureFiles}
              onFilesChange={setSignatureFiles}
              size="sm"
              multiple={false}
              accept=".png,.jpg,.jpeg"
              showFileList
              allowDragDrop
              placeholder="Upload Signature"
              helperText="PNG or JPG up to 5MB"
              sx={{
                border: "1px dashed #CDD0CD",
                borderRadius: "8px",
              }}
            />
          </Grid>
        </Grid>

        <Grid
          container
          justifyContent="flex-end"
          gap={1}
          sx={{ borderTop: "1px solid #E7E9EB", pt: 2, mt: 0, flexShrink: 0, backgroundColor: "#FFFFFF" }}
        >
          <CustomButton type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </CustomButton>
          <CustomButton type="button" variant="primary" onClick={() => void handleSave()}>
            Save
          </CustomButton>
        </Grid>
      </Grid>
      {snackbar.isOpen && (
        <CommonSnackbar
          isOpen={snackbar.isOpen}
          message={snackbar.message}
          status={snackbar.status}
          onClose={() => setSnackbar((prev) => ({ ...prev, isOpen: false }))}
          autoClose={true}
          autoCloseDelay={5000}
        />
      )}
    </CustomDrawer>
  );
};

export default EditUserDrawer;
