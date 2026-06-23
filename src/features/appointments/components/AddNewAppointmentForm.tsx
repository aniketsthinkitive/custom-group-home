import { useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { Typography, Grid, Box } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import CustomInput from "../../../components/custom-input/custom-input";
import type { AppointmentData } from "./AppointmentsTable";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import CustomAutoComplete from "../../../components/custom-auto-complete/custom-auto-complete";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import TimePickerField from "../../../components/time-picker-field/time-picker-field";
import CustomRadio from "../../../components/custom-radio/custom-radio";

// Form validation schema
const appointmentFormSchema = yup.object({
  appointment_title: yup
    .string()
    .trim()
    .required("Appointment title is required")
    // .test(
    //   "no-leading-trailing-spaces",
    //   "Appointment title cannot start or end with whitespace",
    //   function (value) {
    //     if (!value) return true;
    //     return value === value.trim();
    //   },
    // )
    .min(2, "Appointment title must be at least 2 characters")
    .max(255, "Appointment title must not exceed 255 characters"),

  appointment_date: yup
    .mixed()
    .required("Appointment date is required")
    .test("is-valid-date", "Appointment date is required", (value) => {
      return value !== null && value !== undefined;
    })
    .nullable(),

  appointment_time: yup.string().required("Appointment time is required"),

  resident_id: yup.string().required("Resident name is required"),

  contact_type: yup
    .string()
    .required("Contact type is required")
    .oneOf(["PROVIDER", "GUARDIAN", "OTHER"], "Invalid contact type"),

  contact_name: yup.string().when("contact_type", {
    is: (val: string) =>
      val === "PROVIDER" || val === "GUARDIAN" || val === "OTHER",
    then: (schema) =>
      schema
        .required("Contact name is required")
        // .test(
        //   "no-leading-trailing-spaces",
        //   "Contact name cannot start or end with whitespace",
        //   function (value) {
        //     if (!value) return true;
        //     return value === value.trim();
        //   },
        // )
        .trim()
        .min(2, "Contact name must be at least 2 characters")
        .max(255, "Contact name must not exceed 255 characters"),
    otherwise: (schema) => schema.nullable(),
  }),

  contact_email: yup.string().when("contact_type", {
    is: (val: string) =>
      val === "PROVIDER" || val === "GUARDIAN" || val === "OTHER",
    then: (schema) =>
      schema
        // .required("Contact email is required")
        .test(
          "email-format",
          "Please enter a valid email address",
          function (value) {
            if (!value || value.trim() === "") return true; // Required when contact_type is filled
            // Check for both @ and . characters
            return value.includes("@") && value.includes(".");
          },
        )
        // .test(
        //   "no-leading-trailing-spaces",
        //   "Email cannot start or end with whitespace",
        //   function (value) {
        //     if (!value) return true;
        //     return value === value.trim();
        //   },
        // ),
        .trim(),
    otherwise: (schema) => schema.nullable(),
  }),

  description: yup
    .string()
    .nullable()
    .max(1000, "Description must not exceed 1000 characters"),
});

export interface AppointmentFormData {
  appointment_title: string;
  appointment_date: Dayjs | null;
  appointment_time: string;
  resident_id: string;
  contact_type: "PROVIDER" | "GUARDIAN" | "OTHER";
  contact_name: string;
  contact_email: string;
  description: string;
}

interface AddNewAppointmentFormProps {
  isEdit?: boolean;
  initialData?: Partial<AppointmentData>;
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  residents?: Array<{ key: string; value: string; leadId?: number; leadUuid?: string }>;
  onResidentsDropdownOpen?: () => void;
  disableResidentField?: boolean;
  defaultResidentId?: string;
  isResidentsLoading?: boolean;
  defaultLeadId?: string;
  drawerOpen?: boolean;
  onGuardianPrefillRequest?: (leadUuid: string) => Promise<{ name?: string; email?: string } | undefined>;
}

export interface AddNewAppointmentFormRef {
  resetForm: () => void;
}

const AddNewAppointmentForm = forwardRef<
  AddNewAppointmentFormRef,
  AddNewAppointmentFormProps
>(
  (
    {
      isEdit = false,
      initialData,
      onSubmit,
      onCancel,
      isLoading = false,
      residents = [],
      onResidentsDropdownOpen,
      disableResidentField = false,
      defaultResidentId,
      defaultLeadId,
      isResidentsLoading = false,
      drawerOpen = true,
      onGuardianPrefillRequest,
    },
    ref,
  ) => {
    const [contactType, setContactType] = useState<
      "PROVIDER" | "GUARDIAN" | "OTHER"
    >("PROVIDER");

    const initialValues: AppointmentFormData = {
      appointment_title: "",
      appointment_date: null,
      appointment_time: "",
      resident_id: "",
      contact_type: "PROVIDER",
      contact_name: "",
      contact_email: "",
      description: "",
    };

    const {
      control,
      handleSubmit,
      setValue,
      watch,
      reset,
      formState: { errors },
    } = useForm<AppointmentFormData>({
      resolver: yupResolver(appointmentFormSchema) as any,
      defaultValues: initialValues,
      mode: "onSubmit",
    });

    const watchedAppointmentDate = watch("appointment_date");
    const isAppointmentToday = (() => {
      if (!watchedAppointmentDate) return false;
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const todayStr = new Date().toLocaleDateString("en-CA", { timeZone });
      const selectedStr = dayjs(watchedAppointmentDate).format("YYYY-MM-DD");
      return selectedStr === todayStr;
    })();

    const watchedContactType = watch("contact_type");
    const watchedResidentKey = watch("resident_id");
    const watchedContactName = watch("contact_name");
    const watchedContactEmail = watch("contact_email");
    const [cachedGuardian, setCachedGuardian] = useState<{ name?: string; email?: string } | null>(null);
    const [initialContacts, setInitialContacts] = useState<{
      PROVIDER?: { name?: string; email?: string };
      GUARDIAN?: { name?: string; email?: string };
      OTHER?: { name?: string; email?: string };
    }>({});

    useEffect(() => {
      if (watchedContactType) {
        setContactType(watchedContactType as "PROVIDER" | "GUARDIAN" | "OTHER");
      }
    }, [watchedContactType]);

    useImperativeHandle(ref, () => ({
      resetForm: () => {
        reset(initialValues);
        setContactType("PROVIDER");
      },
    }));

    const mapLeadUuidToKey = (leadUuid?: string): string => {
      if (!leadUuid) return "";
      const match = residents.find((r) => r.key === leadUuid || r.leadUuid === leadUuid);
      return match?.key || "";
    };

    // Load initial data when editing or when default resident is provided
    useEffect(() => {
      if (initialData && (isEdit || initialData.resident_id)) {
        const appointmentDate = initialData.appointment_date
          ? dayjs(initialData.appointment_date)
          : null;

        const appointmentTime = initialData.appointment_time || "";

        // Find resident ID from initial data
        // We need to find the resident by lead ID or resident name
        // let residentId = "";
        // if (initialData.lead && typeof initialData.lead === 'number') {
        //   // Find resident by lead ID
        //   const resident = residents.find(r => r.leadId === initialData.lead);
        //   if (resident) {
        //     residentId = resident.key;
        //   }
        // }

        setValue("appointment_title", initialData.appointment_title || "");
        setValue("appointment_date", appointmentDate);
        setValue("appointment_time", appointmentTime);

        // Prefill Resident for EDIT using lead UUID, fallback to initialData.resident_id
        if (isEdit && residents.length > 0) {
          const leadUuid =
            (initialData as any)?.lead_uuid ??
            (initialData as any)?.lead_detail?.uuid;
          const key = mapLeadUuidToKey(leadUuid);
          if (key) {
            setValue("resident_id", key, {
              shouldValidate: true,
              shouldDirty: false,
            });
          } else if (initialData.resident_id) {
            // Direct fallback: use the pre-resolved key from the drawer
            setValue("resident_id", initialData.resident_id, {
              shouldValidate: true,
              shouldDirty: false,
            });
          }
        }

        setValue(
          "contact_type",
          (initialData.contact_type as "PROVIDER" | "GUARDIAN" | "OTHER") ||
            "PROVIDER",
        );
        setValue("contact_name", initialData.contact_name || "");
        setValue("contact_email", initialData.contact_email || "");
        setValue("description", initialData.description || "");
        // setValue("resident_name", initialData.resident_name || "");

        // Set contact type state
        const contactTypeValue =
          (initialData.contact_type as "PROVIDER" | "GUARDIAN" | "OTHER") ||
          "PROVIDER";
        setContactType(contactTypeValue);
      } else if (!isEdit) {
        // Only reset if we don't have a default resident to prefill
        if (!defaultLeadId) {
          reset(initialValues);
          setContactType("PROVIDER");
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, initialData, setValue, reset, defaultLeadId]);

    // Prefill Resident for ADD (Resident module) using defaultLeadId (UUID) when residents are available
    useEffect(() => {
      if (isEdit) return;
      if (!defaultLeadId) return;
      // Only run when drawer is open
      if (!drawerOpen) return;
      // Wait for residents to finish loading
      if (isResidentsLoading) return;
      if (residents.length === 0) return;

      const key = mapLeadUuidToKey(defaultLeadId);
      if (key) {
        setValue("resident_id", key, {
          shouldValidate: true,
          shouldDirty: false,
        });
      }
    }, [isEdit, defaultLeadId, residents, setValue, isResidentsLoading, drawerOpen]);

    // Fetch guardian only when association is Guardian and resident changes or becomes valid
    useEffect(() => {
      const selected = residents.find((r) => String(r.key) === String(watchedResidentKey));
      const leadUuid = selected?.leadUuid;
      if (watchedContactType !== "GUARDIAN") {
        setCachedGuardian(null);
        return;
      }
      if (!leadUuid || !onGuardianPrefillRequest) return;
      let cancelled = false;
      (async () => {
        try {
          const g = await onGuardianPrefillRequest(leadUuid);
          if (!cancelled) {
            setCachedGuardian(g ?? null);
            // Auto-update guardian fields when resident changes and association is Guardian
            setValue("contact_name", (g?.name || ""), { shouldValidate: false });
            setValue("contact_email", (g?.email || ""), { shouldValidate: false });
          }
        } catch {
          if (!cancelled) {
            setCachedGuardian(null);
            setValue("contact_name", "", { shouldValidate: false });
            setValue("contact_email", "", { shouldValidate: false });
          }
        }
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedResidentKey, watchedContactType]);

    // When association changes: clear fields; if Guardian, apply cachedGuardian
    useEffect(() => {
      if (isEdit) return; // In edit mode we manage via initialContacts map
      // Clear on any radio change
      setValue("contact_name", "", { shouldValidate: false });
      setValue("contact_email", "", { shouldValidate: false });
      if (watchedContactType === "GUARDIAN" && cachedGuardian) {
        setValue("contact_name", cachedGuardian.name || "", { shouldValidate: false });
        setValue("contact_email", cachedGuardian.email || "", { shouldValidate: false });
      }
      if (watchedContactType === "PROVIDER") {
        // Focus Provider Name field without showing error until submit
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('input[name="contact_name"]');
          input?.focus();
        }, 0);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedContactType]);

    // If cached guardian updates while Guardian selected, reflect in fields
    useEffect(() => {
      if (watchedContactType !== "GUARDIAN") return;
      setValue("contact_name", cachedGuardian?.name || "", { shouldValidate: false });
      setValue("contact_email", cachedGuardian?.email || "", { shouldValidate: false });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cachedGuardian]);

    // Store initial contacts from appointment when editing (do not lose loaded data)
    useEffect(() => {
      if (!isEdit || !initialData) return;
      const type = (initialData.contact_type as "PROVIDER" | "GUARDIAN" | "OTHER") || "PROVIDER";
      const name = initialData.contact_name || "";
      const email = initialData.contact_email || "";
      setInitialContacts((prev) => ({
        ...prev,
        [type]: { name, email },
      }));
    }, [isEdit, initialData]);

    const scrollToFirstError = useCallback((errors: Record<string, unknown>) => {
      const firstField = Object.keys(errors)[0];
      if (!firstField) return;
      setTimeout(() => {
        const el = document.querySelector(`[name="${firstField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if (el instanceof HTMLElement) el.focus();
        }
      }, 100);
    }, []);

    const handleFormSubmit = (data: AppointmentFormData) => {
      onSubmit(data);
    };

    const handleCancel = () => {
      reset(initialValues);
      setContactType("PROVIDER");
      onCancel();
    };

    const handleContactTypeChange = (value: string) => {
      setValue("contact_type", value as "PROVIDER" | "GUARDIAN" | "OTHER", {
        shouldValidate: true,
      });
      setContactType(value as "PROVIDER" | "GUARDIAN" | "OTHER");
      // Clear the currently visible fields
      setValue("contact_name", "", { shouldValidate: false });
      setValue("contact_email", "", { shouldValidate: false });
      // Restore initial values in edit mode if available for selected type
      if (isEdit) {
        const preset = initialContacts[value as "PROVIDER" | "GUARDIAN" | "OTHER"];
        if (preset) {
          setValue("contact_name", preset.name || "", { shouldValidate: false });
          setValue("contact_email", preset.email || "", { shouldValidate: false });
        }
      }
    };

    // Transform residents to CustomAutoComplete format
    const residentOptions = [
      {
        key: "",
        value:
          residents.length === 0
            ? "No residents available"
            : "Select Resident Name",
      },
      ...residents.map((resident) => ({
        key: resident.key,
        value: resident.value,
      })),
    ];

    return (
      <Grid
        container
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
          gap: "4px",
        }}
      >
        {/* Header */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid #E3ECEF",
            flexShrink: 0,
            marginTop: "-10px",
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#424342",
              fontFamily: "Geist",
            }}
          >
            {isEdit ? "Edit Appointment" : "Add New Appointment"}
          </Typography>
          <Grid
            size={{ xs: 12 }}
            sx={{
              width: "38px",
              height: "38px",
              borderRadius: "18px",
              backgroundColor: "#F6F6F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={handleCancel}
          >
            <Typography sx={{ fontSize: "25px", color: "#2C2D2C" }}>
              ×
            </Typography>
          </Grid>
        </Grid>

        {/* Form Content */}
        <Grid
          component="form"
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Grid
            size={{ xs: 12 }}
            sx={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Appointment Title */}
            <Controller
              name="appointment_title"
              control={control}
              render={({ field }) => (
                <Grid
                  size={{ xs: 12 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    // gap: "2px",
                  }}
                >
                  <CustomLabel label="Appointment Title" isRequired />
                  <CustomInput
                    placeholder="Enter"
                    name="appointment_title"
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.appointment_title}
                    errorMessage={errors.appointment_title?.message}
                  />
                </Grid>
              )}
            />

            {/* Appointment Date & Time Row */}
            <Grid
              size={{ xs: 12 }}
              sx={{ display: "flex", gap: "10px" }}
              flexDirection={{
                xs: "column",
                sm: "column",
                md: "row",
                lg: "row",
              }}
            >
              <Controller
                name="appointment_date"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      // gap: "2px",
                    }}
                  >
                    <CustomLabel label="Appointment Date" isRequired />
                    <DatePickerField
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      label="Select date"
                      bgWhite
                      format="MM/DD/YYYY"
                      hasError={!!errors.appointment_date}
                      errorMessage={errors.appointment_date?.message}
                      disablePast
                    />
                  </Grid>
                )}
              />
              <Controller
                name="appointment_time"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      // gap: "2px",
                    }}
                  >
                    <CustomLabel label="Appointment Time" isRequired />
                    <TimePickerField
                      value={field.value || ""}
                      onChange={(time) => field.onChange(time)}
                      hasError={!!errors.appointment_time}
                      errorMessage={errors.appointment_time?.message}
                      disablePast={isAppointmentToday}
                    />
                  </Grid>
                )}
              />
            </Grid>

            {/* Resident Name */}
            <Controller
              name="resident_id"
              control={control}
              render={({ field }) => (
                <Grid
                  size={{ xs: 12 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    // gap: "2px",
                  }}
                >
                  <CustomLabel label="Resident Name" isRequired />
                  <CustomAutoComplete
                    value={field.value || ""}
                    placeholder="Select Resident Name"
                    options={residentOptions}
                    onChange={(value) => {
                      field.onChange(value);
                    }}
                    onClick={onResidentsDropdownOpen}
                    bgWhite
                    hasStartSearchIcon
                    maxHeightForOptionsList={320}
                    isDisabled={Boolean(
                      disableResidentField || isEdit || defaultLeadId != null,
                    )}
                  />
                  {errors.resident_id && (
                    <Typography
                      sx={{
                        fontSize: "12px",
                        color: "#C5221F",
                        marginTop: "2px",
                      }}
                    >
                      {errors.resident_id.message}
                    </Typography>
                  )}
                </Grid>
              )}
            />

            {/* Contact Type (Radio Buttons) */}
            <Grid
              size={{ xs: 12 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                // gap: "2px",
              }}
            >
              <Box sx={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Controller
                  name="contact_type"
                  control={control}
                  render={({ field }) => (
                    <>
                      <CustomRadio
                        name="contact_type"
                        value="PROVIDER"
                        label="Provider"
                        checked={field.value === "PROVIDER"}
                        onChange={(checked) => {
                          if (checked) {
                            handleContactTypeChange("PROVIDER");
                          }
                        }}
                      />
                      <CustomRadio
                        name="contact_type"
                        value="GUARDIAN"
                        label="Guardian"
                        checked={field.value === "GUARDIAN"}
                        onChange={(checked) => {
                          if (checked) {
                            handleContactTypeChange("GUARDIAN");
                          }
                        }}
                      />
                      <CustomRadio
                        name="contact_type"
                        value="OTHER"
                        label="Other"
                        checked={field.value === "OTHER"}
                        onChange={(checked) => {
                          if (checked) {
                            handleContactTypeChange("OTHER");
                          }
                        }}
                      />
                    </>
                  )}
                />
              </Box>
              {errors.contact_type && (
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#C5221F",
                    marginTop: "4px",
                  }}
                >
                  {errors.contact_type.message}
                </Typography>
              )}
            </Grid>

            {/* Contact Name */}
            {(contactType === "PROVIDER" ||
              contactType === "GUARDIAN" ||
              contactType === "OTHER") && (
              <Controller
                name="contact_name"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      // gap: "2px",
                    }}
                  >
                    <CustomLabel
                      label={
                        contactType === "PROVIDER"
                          ? "Provider Name"
                          : contactType === "GUARDIAN"
                            ? "Guardian Name"
                            : "Name"
                      }
                      isRequired
                    />
                    <CustomInput
                      placeholder="Enter"
                      name="contact_name"
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.contact_name}
                      errorMessage={errors.contact_name?.message}
                    />
                  </Grid>
                )}
              />
            )}

            {/* Contact Email */}
            {(contactType === "PROVIDER" ||
              contactType === "GUARDIAN" ||
              contactType === "OTHER") && (
              <Controller
                name="contact_email"
                control={control}
                render={({ field }) => (
                  <Grid
                    size={{ xs: 12 }}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      // gap: "2px",
                    }}
                  >
                    <CustomLabel
                      label={
                        contactType === "PROVIDER"
                          ? "Provider Email"
                          : contactType === "GUARDIAN"
                            ? "Guardian Email"
                            : "Email"
                      }
                      // isRequired
                    />

                    <CustomInput
                      placeholder="Enter"
                      name="contact_email"
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.contact_email}
                      errorMessage={errors.contact_email?.message}
                      isEmail
                    />
                  </Grid>
                )}
              />
            )}

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Grid
                  size={{ xs: 12 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    // gap: "2px",
                  }}
                >
                  <CustomLabel label="Description" />
                  <CustomInput
                    placeholder="Enter here..."
                    name="description"
                    value={field.value || ""}
                    onChange={field.onChange}
                    hasError={!!errors.description}
                    errorMessage={errors.description?.message}
                    multiline
                    rows={2}
                  />
                </Grid>
              )}
            />
          </Grid>
        </Grid>

        {/* Fixed Footer with Buttons */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderTop: "1px solid #E3ECEF",
            backgroundColor: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <CustomButton
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="primary"
            size="md"
            onClick={handleSubmit(handleFormSubmit, scrollToFirstError)}
            disabled={isLoading}
            loading={isLoading}
          >
            {isEdit ? "Save" : "Request Appointment"}
          </CustomButton>
        </Grid>
      </Grid>
    );
  },
);

AddNewAppointmentForm.displayName = "AddNewAppointmentForm";

export default AddNewAppointmentForm;
