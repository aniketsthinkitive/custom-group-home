import React, { useState, useEffect } from "react";
import { Grid, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, type DefaultError } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { changeUserPasswordMutation } from "../../../../sdk/@tanstack/react-query.gen";
import CustomDrawer from "../../../../components/custom-drawer/custom-drawer";
import CustomInput from "../../../../components/custom-input/custom-input";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../../components/custom-label/custom-label";
import CommonSnackbar from "../../../../components/common-snackbar/common-snackbar";

function getBackendMessage(error: unknown): string | undefined {
  const err = error as AxiosError<any> | any;
  return (
    err?.response?.data?.message ??
    err?.response?.data?.error ??
    err?.response?.data?.detail ??
    err?.data?.message ??
    err?.data?.error ??
    err?.data?.detail
  );
}

const resetPasswordFormSchema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required"),
  confirmNewPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

type ResetPasswordFormData = yup.InferType<typeof resetPasswordFormSchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  userUuid?: string;
};

const ChangePasswordDrawer: React.FC<Props> = ({ open, onClose, userUuid }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordFormSchema) as any,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onChange",
  });

  // Reset form when drawer closes to ensure clean state on next open
  useEffect(() => {
    if (!open) {
      reset({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    }
  }, [open, reset]);

  const watchedFields = watch(["currentPassword", "newPassword", "confirmNewPassword"]);
  const isFormValid =
    isValid && watchedFields[0]?.trim() && watchedFields[1]?.trim() && watchedFields[2]?.trim();

  const changePassword = useMutation({
    ...changeUserPasswordMutation(),
    onSuccess: (data: unknown) => {
      const responseData = data as any;
      const backendMessage =
        responseData?.message ?? responseData?.data?.message ?? responseData?.detail ?? undefined;
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "success",
        });
      }
      setTimeout(() => {
        reset({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        onClose();
      }, 1000);
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = (error as any)?.response?.data;
      const fieldErrors = errorData?.errors ?? errorData;

      // Extract field-specific error messages from DRF serializer
      const currentPasswordError = fieldErrors?.current_password;
      const newPasswordError = fieldErrors?.new_password;

      let message: string | undefined;
      if (currentPasswordError) {
        message = String(Array.isArray(currentPasswordError) ? currentPasswordError[0] : currentPasswordError);
      } else if (newPasswordError) {
        message = String(Array.isArray(newPasswordError) ? newPasswordError[0] : newPasswordError);
      } else {
        message = errorData?.message ?? getBackendMessage(error);
      }

      if (message) {
        setSnackbar({ isOpen: true, message, status: "error" });
      }
    },
  });

  const handleFormSubmit = (data: ResetPasswordFormData) => {
    if (!userUuid) {
      setSnackbar({
        isOpen: true,
        message: "User UUID is required",
        status: "error",
      });
      return;
    }
    changePassword.mutate({
      body: {
        uuid: userUuid,
        current_password: data.currentPassword,
        new_password: data.newPassword,
      },
    });
  };

  const handleCancel = () => {
    reset({
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth={isMobile ? "100%" : "640px"}
      drawermargin="0"
      drawerPadding="0"
    >
      <Grid container sx={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #E3ECEF",
            flexShrink: 0,
          }}
        >
          <CustomLabel
            label="Reset Password"
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#424342",
              fontFamily: "Geist",
              marginBottom: 0,
            }}
          />
          <IconButton
            onClick={onClose}
            sx={{
              padding: "4px",
              color: "#757775",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <Close />
          </IconButton>
        </Grid>

        <Grid
          component="form"
          size={{ xs: 12 }}
          sx={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column" }}
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <Grid size={{ xs: 12 }} sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Grid size={{ xs: 12 }} sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <CustomLabel label="Current Password" isRequired />
              <Controller
                name="currentPassword"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter"
                    name="currentPassword"
                    isPassword
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.currentPassword}
                    errorMessage={errors.currentPassword?.message}
                    bgWhite
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <CustomLabel label="New Password" isRequired />
              <Controller
                name="newPassword"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter"
                    name="newPassword"
                    isPassword
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.newPassword}
                    errorMessage={errors.newPassword?.message}
                    bgWhite
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <CustomLabel label="Confirm New Password" isRequired />
              <Controller
                name="confirmNewPassword"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter"
                    name="confirmNewPassword"
                    isPassword
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.confirmNewPassword}
                    errorMessage={errors.confirmNewPassword?.message}
                    bgWhite
                  />
                )}
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderTop: "1px solid #E3ECEF",
            backgroundColor: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <Grid>
            <CustomButton variant="secondary" size="md" onClick={handleCancel}>
              Cancel
            </CustomButton>
          </Grid>
          <Grid>
            <CustomButton
              variant="primary"
              size="md"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={!isFormValid || changePassword.isPending}
            >
              {changePassword.isPending ? "Saving..." : "Save Changes"}
            </CustomButton>
          </Grid>
        </Grid>
      </Grid>

      {snackbar.isOpen && (
        <CommonSnackbar
          isOpen={snackbar.isOpen}
          message={snackbar.message}
          status={snackbar.status}
          onClose={handleSnackbarClose}
          autoClose={true}
          autoCloseDelay={5000}
        />
      )}
    </CustomDrawer>
  );
};

export default ChangePasswordDrawer;
