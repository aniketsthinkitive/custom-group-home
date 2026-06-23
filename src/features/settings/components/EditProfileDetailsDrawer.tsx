import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DefaultError } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Avatar, IconButton, Grid } from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutline";
import type { SelectChangeEvent } from "@mui/material";

import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomSelect from "../../../components/custom-select/custom-select";

// Constants
import { stateOptions } from "../../../constant/stateOptions";
import { countryCodes } from "../../../constant/countryCodes";
import { timezoneLabels } from "../../../constant/timezoneOptions";
import { CITY_OPTIONS } from "../../../constant/mockdata/addGroupHomeDrawer";
import {
  groupHomesUpdateMutation,
  retrieveGroupHomeQueryKey,
} from "../../../sdk/@tanstack/react-query.gen";
import { useMediaUpload } from "../../../hooks/useMediaUpload";
import type {
  GroupHome,
  GroupHomeWritable,
  TimezoneEnum,
} from "../../../sdk/types.gen";

const GRID_SIZE = 2;
const gs = (n: number) => `${n * GRID_SIZE}px`;

const FieldWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Grid container sx={{ flexDirection: "column", gap: gs(1) }}>
    {children}
  </Grid>
);

export interface EditProfileDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormState) => void;
  groupHome: GroupHome | null;
  isLoading?: boolean;
}

export type FormState = {
  groupHomeName: string;
  emailId?: string | null;
  contactNumber: string;
  timeZone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  groupHomeImage?: File | null;
};

const STATE_OPTIONS: { value: string; label: string }[] = stateOptions.map(
  (s) => ({
    value: s.key,
    label: s.value,
  }),
);
const COUNTRY_OPTIONS: { value: string; label: string }[] = countryCodes.map(
  (c) => ({
    value: c.name,
    label: c.name,
  }),
);
const TIMEZONE_OPTIONS: { value: string; label: string }[] = timezoneLabels.map(
  (tz) => ({
    value: tz.value,
    label: tz.label,
  }),
);
const CITY_OPTIONS_FORMATTED: { value: string; label: string }[] =
  CITY_OPTIONS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

/** Map IANA timezone (form value) to TimezoneEnum for the API */
function mapTimezoneToEnum(ianaTimezone: string): TimezoneEnum | null {
  const tz = timezoneLabels.find((t) => t.value === ianaTimezone);
  return tz ? (tz.label as TimezoneEnum) : null;
}

/** Map form state + existing groupHome to GroupHomeWritable for PUT /api/group-homes/{uuid}/ */
function formToBody(data: FormState, groupHome: GroupHome): GroupHomeWritable {
  const phone =
    (data.contactNumber || "").replace(/\D/g, "").slice(0, 10) ||
    groupHome.phone ||
    "";
  return {
    name: (data.groupHomeName || "").trim() || groupHome.name,
    timezone: mapTimezoneToEnum(data.timeZone) ?? groupHome.timezone ?? null,
    phone,
    fax: groupHome.fax ?? "",
    email: (data.emailId || "").trim() || groupHome.email || "",
    emergency_contact_number: groupHome.emergency_contact_number ?? "",
    no_of_rooms: groupHome.no_of_rooms ?? 0,
    active: groupHome.active ?? true,
    address: {
      line1: (data.addressLine1 || "").trim(),
      line2: (data.addressLine2 || "").trim() || null,
      city: (data.city || "").trim(),
      state: (data.state || "").trim(),
      zipcode: (data.zipCode || "").trim(),
      country: (data.country || "").trim(),
    },
    license: groupHome.license,
    shifts: groupHome.shifts?.map((s) => ({
      shift: s.shift,
      start_time: s.start_time,
      end_time: s.end_time,
      is_active: s.is_active,
    })),
  };
}

const validationSchema = yup.object({
  groupHomeName: yup.string().optional(),
  emailId: yup
    .string()
    .nullable()
    .optional()
    .test(
      "email-format",
      "Please enter a valid email address",
      function (value) {
        if (!value || value.trim() === "") return true; // Allow null/empty
        // Check for both @ and . characters
        return value.includes("@") && value.includes(".");
      },
    ),
  contactNumber: yup
    .string()
    .optional()
    .test("ten-digits", "Enter a valid 10-digit number", (value) => {
      if (!value) return true;
      const cleaned = String(value).replace(/\D/g, "");
      return cleaned.length === 10;
    }),
  timeZone: yup.string().optional(),
  addressLine1: yup.string().optional(),
  addressLine2: yup.string().nullable().optional(),
  city: yup.string().optional(),
  state: yup.string().optional(),
  zipCode: yup
    .string()
    .optional()
    .test(
      "zip-length",
      "ZIP code must be at least 9 digits",
      function (value) {
        if (!value || value.trim() === "") return true; // Allow empty (optional field)
        // Remove all non-digit characters and check length
        const digitsOnly = value.replace(/\D/g, "");
        return digitsOnly.length >= 9;
      },
    ),
  country: yup.string().optional(),
});

const EditProfileDetailsDrawer: React.FC<EditProfileDetailsDrawerProps> = ({
  open,
  onClose,
  onSave,
  groupHome,
  isLoading = false,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const formDataRef = React.useRef<FormState | null>(null);
  const queryClient = useQueryClient();

  const { upload: uploadMedia } = useMediaUpload({
    contentTypeApp: "group_home",
    contentTypeModel: "grouphome",
  });

  const uploadGroupHomeImageWithObjectId = async (
    file: File,
    objectId: number,
  ): Promise<void> => {
    await uploadMedia(file, {
      objectUuid: objectId,
      altText: "group_home_profile",
    });
  };

  const updateGroupHome = useMutation({
    ...groupHomesUpdateMutation(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        predicate: (q) =>
          (q.queryKey[0] as { _id?: string })?._id === "listGroupHomes",
      });
      if (variables.path?.uuid) {
        queryClient.invalidateQueries({
          queryKey: retrieveGroupHomeQueryKey({
            path: { uuid: variables.path.uuid },
          }),
        });
      }
      if (formDataRef.current) {
        onSave(formDataRef.current);
        formDataRef.current = null;
      }
    },
    onError: (err: AxiosError<DefaultError>) => {
      console.error("Error updating group home:", err);
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormState>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      groupHomeName: "",
      emailId: "",
      contactNumber: "",
      timeZone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      groupHomeImage: null,
    },
    mode: "onChange", // Only validate when submit button is clicked
  });

  useEffect(() => {
    if (!groupHome) return;
    const tzLabel = groupHome.timezone?.toString();
    const tzIana = tzLabel
      ? timezoneLabels.find((t) => t.label === tzLabel)?.value
      : null;
    reset({
      groupHomeName: groupHome.name || "",
      emailId: groupHome.email || "",
      contactNumber: groupHome.phone || "",
      timeZone: tzIana ?? tzLabel ?? "",
      addressLine1: groupHome.address?.line1 || "",
      addressLine2: groupHome.address?.line2 || "",
      city: groupHome.address?.city || "",
      state: groupHome.address?.state || "",
      zipCode: groupHome.address?.zipcode || "",
      country: groupHome.address?.country || "",
    });
    const existingImageUrl = groupHome.avatar_url ?? null;
    setImagePreview(existingImageUrl);
  }, [groupHome, reset]);

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file format. Please upload JPG, JPEG, or PNG images.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // ✅ store file in react-hook-form state
    setValue("groupHomeImage", file, { shouldDirty: true });

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // ✅ allow selecting same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setValue("groupHomeImage", null, { shouldDirty: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isSaving = isLoading || updateGroupHome.isPending;

  const onSubmit = async (data: FormState) => {
    if (!groupHome?.uuid) return;

    formDataRef.current = data;

    if (data.groupHomeImage instanceof File && groupHome.id != null) {
      try {
        await uploadGroupHomeImageWithObjectId(
          data.groupHomeImage,
          groupHome.id,
        );
      } catch (err) {
        console.error("Group home image upload failed:", err);
      }
    }

    updateGroupHome.mutate({
      path: { uuid: groupHome.uuid },
      body: formToBody(data, groupHome),
    });
  };

  const groupHomeName = watch("groupHomeName");

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Edit Profile Details"
      drawerWidth="700px" // ✅ Figma
      drawerPadding={gs(4)} // ✅ 16px (Figma scroll content padding)
      headerPadding={gs(4)} // ✅ 16px (Figma header padding)
    >
      <Grid
        container
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: 0,
          width: "100%",
          minWidth: 0,
        }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            width: "100%",
          }}
        >
          {/* ========= SCROLL CONTENT ========= */}
          <Grid
            container
            sx={{
              flexDirection: "column",
              gap: gs(6),
              flex: 1,
              pb: gs(4),
              padding: 0,
              pl: gs(12),
              pr: gs(12),
              width: "100%",
              minWidth: 0,
            }}
          >
            {/* ✅ Figma has a bordered "Resident Info" style card */}
            <Grid
              container
              sx={{
                flexDirection: "column",
                gap: gs(4), // keep spacing
                width: "100%",
                minWidth: 0,
              }}
            >
              {/* Group Home Image Section */}
              <Grid
                container
                sx={{
                  flexDirection: "column",
                  gap: gs(2), // 8px
                  alignItems: "flex-start",
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <CustomLabel label="Group Home Image" />
                <Grid
                  container
                  sx={{
                    position: "relative",
                    display: "inline-flex",
                    width: "auto",
                  }}
                >
                  <Avatar
                    src={imagePreview || undefined}
                    sx={{
                      width: "120px", // 120px
                      height: "120.30px", // 120px
                      borderRadius: "50%",
                      border: `1px solid #E7E9EB`,
                      bgcolor: "#F2F7FA",
                      fontSize: gs(10), // 24px
                      fontWeight: 600,
                      color: "#11466D",
                    }}
                  >
                    {!imagePreview &&
                      (groupHomeName || groupHome?.name || "Group Home")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                  </Avatar>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />

                  <IconButton
                    onClick={handleImageClick}
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: imagePreview ? 24 : 0,
                      width: gs(6), // 24px
                      height: gs(6),
                      backgroundColor: "#6B7280",
                      border: `2px solid #FFFFFF`,
                      borderRadius: "50%",
                      padding: gs(1), // 4px
                      "&:hover": { backgroundColor: "#4B5563" },
                    }}
                  >
                    <EditOutlinedIcon
                      sx={{ color: "white", fontSize: gs(4) }}
                    />
                  </IconButton>
                  {imagePreview && (
                    <IconButton
                      size="small"
                      aria-label="Remove photo"
                      onClick={handleRemoveImage}
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        backgroundColor: "#fff",
                        boxShadow: 1,
                        "&:hover": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  )}
                </Grid>
              </Grid>

              {/* Two Column: Group Home Name & Email */}
              <Grid container spacing={2} sx={{ width: "100%", minWidth: 0 }}>
                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="groupHomeName"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="Group Home Name" isRequired />
                        <CustomInput
                          placeholder="Enter group home name"
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          hasError={!!errors.groupHomeName}
                          errorMessage={errors.groupHomeName?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>

                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="emailId"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="Email" />
                        <CustomInput
                          placeholder="Enter email"
                          name={field.name}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          isEmail
                          hasError={!!errors.emailId}
                          errorMessage={errors.emailId?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>
              </Grid>

              {/* Two Column: Phone Number & Time zone */}
              <Grid container spacing={2} sx={{ width: "100%", minWidth: 0 }}>
                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="contactNumber"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="Phone Number" isRequired />
                        <CustomInput
                          placeholder="Enter phone number"
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          phone
                          hasError={!!errors.contactNumber}
                          errorMessage={errors.contactNumber?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>

                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="timeZone"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="Time zone" isRequired />
                        <CustomSelect
                          placeholder="Select time zone"
                          name={field.name}
                          value={field.value}
                          items={TIMEZONE_OPTIONS}
                          onChange={(e: SelectChangeEvent<string>) =>
                            field.onChange(e.target.value)
                          }
                          hasError={!!errors.timeZone}
                          errorMessage={errors.timeZone?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>
              </Grid>

              {/* Full Width: Address Line 1 */}
              <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                <Controller
                  name="addressLine1"
                  control={control}
                  render={({ field }) => (
                    <FieldWrap>
                      <CustomLabel label="Address Line 1" isRequired />
                      <CustomInput
                        placeholder="Enter address line 1"
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.addressLine1}
                        errorMessage={errors.addressLine1?.message}
                      />
                    </FieldWrap>
                  )}
                />
              </Grid>

              {/* Full Width: Address Line 2 */}
              <Grid size={{ xs: 12 }} sx={{ minWidth: 0 }}>
                <Controller
                  name="addressLine2"
                  control={control}
                  render={({ field }) => (
                    <FieldWrap>
                      <CustomLabel label="Address Line 2" />
                      <CustomInput
                        placeholder="Enter address line 2"
                        name={field.name}
                        value={field.value ?? ""} // ← Add this
                        onChange={field.onChange}
                        hasError={!!errors.addressLine2}
                        errorMessage={errors.addressLine2?.message}
                      />
                    </FieldWrap>
                  )}
                />
              </Grid>

              {/* Two Column: City & State */}
              <Grid container spacing={2} sx={{ width: "100%", minWidth: 0 }}>
                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="City" isRequired />
                        <CustomSelect
                          placeholder="Select city"
                          name={field.name}
                          value={field.value}
                          items={CITY_OPTIONS_FORMATTED}
                          onChange={(e: SelectChangeEvent<string>) =>
                            field.onChange(e.target.value)
                          }
                          hasError={!!errors.city}
                          errorMessage={errors.city?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>

                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="State" isRequired />
                        <CustomSelect
                          placeholder="Select state"
                          name={field.name}
                          value={field.value}
                          items={STATE_OPTIONS}
                          onChange={(e: SelectChangeEvent<string>) =>
                            field.onChange(e.target.value)
                          }
                          hasError={!!errors.state}
                          errorMessage={errors.state?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>
              </Grid>

              {/* Two Column: ZIP Code & Country */}
              <Grid container spacing={2} sx={{ width: "100%", minWidth: 0 }}>
                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="zipCode"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="ZIP Code" isRequired />
                        <CustomInput
                          placeholder="Enter ZIP code"
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          zipCode
                          hasError={!!errors.zipCode}
                          errorMessage={errors.zipCode?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>

                <Grid
                  size={{ xs: 12, sm: 6, md: 6, lg: 6 }}
                  sx={{ minWidth: 0 }}
                >
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <FieldWrap>
                        <CustomLabel label="Country" isRequired />
                        <CustomSelect
                          placeholder="Select country"
                          name={field.name}
                          value={field.value || "United States"}
                          items={COUNTRY_OPTIONS}
                          onChange={(e: SelectChangeEvent<string>) =>
                            field.onChange(e.target.value)
                          }
                          hasError={!!errors.country}
                          errorMessage={errors.country?.message}
                        />
                      </FieldWrap>
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* ========= STICKY FOOTER (MATCH FIGMA) ========= */}
          <Grid
            container
            sx={{
              flexShrink: 0,
              borderTop: "1px solid #DEE4ED",
              backgroundColor: "#FFFFFF",
              width: "100%",
              minHeight: gs(35), // 70px

              // ✅ removes footer left/right gap
              pl: 0,
              pr: 0,

              pt: gs(8),
              pb: gs(8),
              justifyContent: "flex-end",
              gap: gs(2), // 8px
              paddingTop: gs(4), // 16px
              paddingBottom: gs(4), // 16px
              mt: gs(6), // 24px spacing from conten
              minWidth: 0,
            }}
          >
            <CustomButton
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="md"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </CustomButton>
          </Grid>
        </form>
      </Grid>
    </CustomDrawer>
  );
};

export default EditProfileDetailsDrawer;
