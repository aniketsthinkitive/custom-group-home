import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useImperativeHandle,
} from "react";
import { Grid, Box, Typography, Avatar, IconButton } from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery } from "@tanstack/react-query";
import AddIcon from "@mui/icons-material/Add";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomSelect from "../../../components/custom-select/custom-select";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomLabel from "../../../components/custom-label/custom-label";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import { Dayjs } from "dayjs";
import InsuranceForm from "./InsuranceForm";
import DocumentChecklistForm from "./DocumentChecklistForm";
import { listUsersOptions } from "../../../sdk/@tanstack/react-query.gen";
import { stateOptions } from "../../../constant/stateOptions";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";

export type SelectChangeEvent<Value = string> = Value extends
  | (string & {})
  | number
  ?
  | React.ChangeEvent<
    Omit<HTMLInputElement, "value"> & {
      value: Value;
    }
  >
  | (Event & {
    target: {
      value: Value;
      name: string;
    };
  })
  :
  | React.ChangeEvent<HTMLInputElement>
  | (Event & {
    target: {
      value: Value;
      name: string;
    };
  });

// Validation schema
export const leadSchema = yup.object({
  firstName: yup
    .string()
    .trim()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First Name must not exceed 50 characters."),
  lastName: yup
    .string()
    .trim()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last Name must not exceed 50 characters."),
  dateOfBirth: yup
    .mixed()
    .required("Date of birth is required")
    .typeError("Invalid date format"),

  // ❌ removed required
  gender: yup.string(),
  contactNumber: yup
    .string()
    .nullable()
    .test("phone-length", "Phone number must be 10 digits", function (value) {
      if (!value || value.trim() === "") return true; // Allow null/empty
      // Remove all non-digit characters and check length
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length === 10;
    }),
  email: yup
  .string()
  .nullable()
  .test("email-format", "Invalid email format", function (value) {
    if (!value || value.trim() === "") return true; 
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }),
referralSource: yup.string().default("").nullable(),

  // ✅ newly required
  streetAddress: yup.string().required("Street address is required"),
  state: yup.string().required("State is required"),

  city: yup.string().required("City is required"),
  zipCode: yup
    .string()
    .required("ZIP code is required")
    .test("zip-length", "ZIP code must be in 5 to 9 digits", function (value) {
      if (!value || value.trim() === "") return true;
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length >= 5 && digitsOnly.length <= 9;
    }),
  guardianId: yup
    .string()
    .nullable()
    .test(
      "guardian-or-Area Agency-required",
      "Please select or create at least one guardian or Area Agency",
      function (value) {
        const { guardianFirstName, serviceManagerId, serviceManagerFirstName } =
          this.parent;
        const hasGuardian = !!(
          value ||
          (guardianFirstName && guardianFirstName.trim())
        );
        const hasAgent = !!(
          serviceManagerId ||
          (serviceManagerFirstName && serviceManagerFirstName.trim())
        );
        return hasGuardian || hasAgent;
      },
    ),
  guardianFirstName: yup
    .string()
    .trim()
    .nullable()
    .test(
      "min-length",
      "First name must be at least 2 characters",
      function (value) {
        if (!value) return true;
        return value.length >= 2;
      }
    )
    .test(
      "max-length",
      "First name must not exceed 50 characters",
      function (value) {
        if (!value) return true;
        return value.length <= 50;
      }
    ),
guardianLastName: yup
  .string()
  .trim()
    .nullable()
    .when("guardianFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Guardian last name is required")
    .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must not exceed 50 characters"),
      otherwise: (schema) => schema.nullable(),
    }),
  guardianRelation: yup
    .string()
    .nullable()
    .when("guardianId", {
      is: (val: string | null) => !val || val === "",
      then: (schema) => schema.nullable(),
      otherwise: (schema) => schema,
    }),
  guardianContactNumber: yup
    .string()
    .nullable()
    .when("guardianFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Guardian phone number is required")
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return false;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
      otherwise: (schema) =>
        schema
          .nullable()
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return true;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
    }),
  guardianEmail: yup
    .string()
    .nullable()
    .when("guardianFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Guardian email is required")
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return false; // Required when guardian first name is filled
            // Check for both @ and . characters
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
      otherwise: (schema) =>
        schema
          .nullable()
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return true; // Allow null/empty
            // Check for both @ and . characters
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
    }),
  serviceManagerId: yup
    .string()
    .nullable()
    .test(
      "guardian-or-Area Agency-required",
      "Please select or create at least one guardian or Area Agency",
      function (value) {
        const { serviceManagerFirstName, guardianId, guardianFirstName } =
          this.parent;
        const hasGuardian = !!(
          guardianId ||
          (guardianFirstName && guardianFirstName.trim())
        );
        const hasAgent = !!(
          value ||
          (serviceManagerFirstName && serviceManagerFirstName.trim())
        );
        return hasGuardian || hasAgent;
      },
    ),
  serviceManagerFirstName: yup
    .string()
    .trim()
    .nullable()
    .test(
      "min-length",
      "First name must be at least 2 characters",
      function (value) {
        if (!value) return true;
        return value.length >= 2;
      }
    )
    .test(
      "max-length",
      "First name must not exceed 50 characters",
      function (value) {
        if (!value) return true;
        return value.length <= 50;
      }
    ),
  serviceManagerLastName: yup
    .string()
    .trim()
    .nullable()
    .when("serviceManagerFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Area Agency last name is required")
    .min(2, "Last name must be at least 2 characters")
        .max(50, "Last name must not exceed 50 characters"),
      otherwise: (schema) => schema.nullable(),
    }),
  serviceManagerContactNumber: yup
    .string()
    .nullable()
    .when("serviceManagerFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Area Agency phone number is required")
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return false;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
      otherwise: (schema) =>
        schema
          .nullable()
          .test(
            "phone-length",
            "Phone number must be 10 digits",
            function (value) {
              if (!value || value.trim() === "") return true;
              const digitsOnly = value.replace(/\D/g, "");
              return digitsOnly.length === 10;
            },
          ),
    }),
  serviceManagerEmail: yup
    .string()
    .nullable()
    .when("serviceManagerFirstName", {
      is: (val: string | null) => val && val.trim() !== "",
      then: (schema) =>
        schema
          .required("Area Agency email is required")
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return false; // Required when service manager first name is filled
            // Check for both @ and . characters
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
      otherwise: (schema) =>
        schema
          .nullable()
          .test("email-format", "Invalid email format", function (value) {
            if (!value || value.trim() === "") return true; // Allow null/empty
            // Check for both @ and . characters
            return value.includes("@") && value.includes(".");
          })
          .email("Invalid email"),
    }),
  insuranceProvider: yup.string().nullable(),
  policyNumber: yup.string().nullable(),
  insuranceStatus: yup.string().nullable(),
  documents: yup.array(),
});

export type FormData = {
  // Demographics
  profilePicture?: File | null;
  firstName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  gender: string;
  contactNumber: string;
  email: string;
  referralSource: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  guardianId: string | null;
  guardianFirstName: string | null;
  guardianLastName: string | null;
  guardianRelation: string | null;
  guardianContactNumber: string | null;
  guardianEmail: string | null;
  serviceManagerId: string | null;
  serviceManagerFirstName: string | null;
  serviceManagerLastName: string | null;
  serviceManagerContactNumber: string | null;
  serviceManagerEmail: string | null;
  // Insurance
  insuranceProvider: string;
  policyNumber: string;
  insuranceStatus: string;
  // Documents
  documents: any[];
  /** Set by DocumentChecklistForm when all required docs are uploaded; sent as documents_checklist_complete to backend */
  documentsChecklistComplete?: boolean;
};

export interface Step {
  id: string;
  label: string;
}

interface NewLeadFormProps {
  activeStep: string;
  steps: Step[];
  leadId: string | null;
  onStepChange: (stepId: string) => void;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  onSaveDraft?: (data: FormData) => void;
  open?: boolean;
}

export interface NewLeadFormHandle {
  setFieldError: (name: keyof FormData, message: string) => void;
  focusField: (name: keyof FormData) => void;
  setFieldValue: (name: keyof FormData, value: any) => void;
  scrollToField: (name: keyof FormData) => void;
}

const NewLeadForm = React.forwardRef<NewLeadFormHandle, NewLeadFormProps>(
  (
    {
      activeStep,
      open,
      steps,
      leadId,
      onStepChange,
      onSubmit,
      onCancel,
      onSaveDraft,
    },
    ref,
  ) => {
    const [showGuardianAddNew, setShowGuardianAddNew] = useState(false);
    const [showServiceManagerAddNew, setShowServiceManagerAddNew] =
      useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const [snackbar, setSnackbar] = useState<{
      isOpen: boolean;
      message: string;
      status: "success" | "error";
    }>({
      isOpen: false,
      message: "",
      status: "success",
    });
    const [hasValidatedStep, setHasValidatedStep] = useState(false); // Track if step has been validated
    const [documentsChecklistComplete, setDocumentsChecklistComplete] =
      useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const STATE_OPTIONS = stateOptions.map((s) => ({
      value: s.key,
      label: s.value,
    }));

    const {
      control,
      handleSubmit,
      formState: { errors },
      trigger,
      setValue,
      getValues,
      reset,
      watch,
      setError,
      setFocus,
      clearErrors,
    } = useForm<FormData>({
      resolver: yupResolver(leadSchema) as any,
      mode: "onChange", // Validate on blur and when triggered programmatically    
      defaultValues: {
        firstName: "",
        lastName: "",
        dateOfBirth: null,
        gender: "",
        contactNumber: "",
        email: "",
        referralSource: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        guardianId: null,
        guardianFirstName: null,
        guardianLastName: null,
        guardianRelation: null,
        guardianContactNumber: null,
        guardianEmail: null,
        serviceManagerId: null,
        serviceManagerFirstName: null,
        serviceManagerLastName: null,
        serviceManagerContactNumber: null,
        serviceManagerEmail: null,
        insuranceProvider: "",
        policyNumber: "",
        insuranceStatus: "",
        documents: [],
      },
    });

    useImperativeHandle(ref, () => ({
      setFieldError: (name: keyof FormData, message: string) => {
        setError(name, { type: "manual", message });
      },
      focusField: (name: keyof FormData) => {
        setFocus(name);
      },
      setFieldValue: (name: keyof FormData, value: any) => {
        setValue(name, value);
      },
      scrollToField: (name: keyof FormData) => {
        setTimeout(() => {
          const element = document.querySelector(`[name="${name}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      },
    }));

    const handleCancel = () => {
      reset(); // resets to defaultValues
      onCancel?.(); // close drawer / dialog if you have
    };

    // Get fields for each step
    const getStepFields = (stepId: string): (keyof FormData)[] => {
      switch (stepId) {
        case "demographics":
          return [
            "firstName",
            "lastName",
            "dateOfBirth",
            "gender",
            "contactNumber",
            "email",
            "referralSource",
            "streetAddress",
            "city",
            "state",
            "zipCode",
            "guardianId",
            "guardianFirstName",
            "guardianLastName",
            "guardianRelation",
            "guardianContactNumber",
            "guardianEmail",
            "serviceManagerId",
            "serviceManagerFirstName",
            "serviceManagerLastName",
            "serviceManagerContactNumber",
            "serviceManagerEmail",
          ];
        case "insurance":
          return ["insuranceProvider", "policyNumber", "insuranceStatus"];
        case "documents":
          return ["documents"];
        default:
          return [];
      }
    };
    const selectedGuardianId = watch("guardianId");
    const selectedServiceManagerId = watch("serviceManagerId");

    // Get current step fields
    const stepFields = React.useMemo(
      () => getStepFields(activeStep),
      [activeStep],
    );

    // Check if current step has errors
    const hasStepErrors = React.useMemo(() => {
      return stepFields.some((field) => errors[field as keyof typeof errors]);
    }, [stepFields, errors]);

    // Compute button state: enabled by default, disabled only if validated and has errors
    const isCurrentStepValid = React.useMemo(() => {
      // Button is enabled by default (before validation)
      // Only disable if step has been validated and has errors
      if (hasValidatedStep && hasStepErrors) {
        return false;
      }
      return true; // Enabled by default
    }, [hasValidatedStep, hasStepErrors]);

    const handleNext = async () => {
      const stepFieldsToValidate = getStepFields(activeStep);
      const isValid = await trigger(stepFieldsToValidate as any);

      if (!isValid) {
        // Find the first field with an error and focus on it
        const firstErrorField = stepFieldsToValidate.find(
          (field) => errors[field as keyof typeof errors],
        );
        if (firstErrorField) {
          setFocus(firstErrorField);
          // Scroll to the first error field
          setTimeout(() => {
            const element = document.querySelector(
              `[name="${firstErrorField}"]`,
            );
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 100);
        }
        setHasValidatedStep(true); // Mark step as validated to show errors
        return;
      }

      // 🔥 Trigger validation/save on step transition for demographics and insurance
      if (
        (activeStep === "demographics" || activeStep === "insurance") &&
        onSaveDraft
      ) {
        try {
          const data = getValues();
          // console.log(`Saving draft/validating step: ${activeStep}`, data);
          await onSaveDraft(data);
        } catch (error) {
          console.error(`Error validating step ${activeStep}:`, error);
          // Error is handled by mutation's onError or the error redirection logic
          // We stop here to prevent moving to the next step
          return;
        }
      }

      const currentIndex = steps.findIndex((s) => s.id === activeStep);
      if (currentIndex < steps.length - 1) {
        setHasValidatedStep(false); // Reset validation flag for next step
        onStepChange(steps[currentIndex + 1].id);
      }
    };

    const handleBack = () => {
      const currentIndex = steps.findIndex((s) => s.id === activeStep);
      if (currentIndex > 0) {
        // Reset validation flag for previous step (button will be enabled by default)
        setHasValidatedStep(false);
        onStepChange(steps[currentIndex - 1].id);
      }
    };

    useEffect(() => {
      if (open) {
        reset(); // ✅ reset form every time drawer opens
      }
    }, [open, reset]);

    // Reset validation flag when step changes (via step indicator clicks)
    // This is necessary to reset button state when navigating between steps
    useEffect(() => {
      setHasValidatedStep(false);
    }, [activeStep]);

    const isLastStep = activeStep === "documents";
    const isFirstStep = activeStep === "demographics";
    const guardianId = watch("guardianId");
    const serviceManagerId = watch("serviceManagerId");
    const guardianFirstName = watch("guardianFirstName");
    const guardianLastName = watch("guardianLastName");
    const serviceManagerFirstName = watch("serviceManagerFirstName");
    const serviceManagerLastName = watch("serviceManagerLastName");

    // Trigger validation for cross-validated fields when any dependency changes.
    // This ensures error messages appear/clear correctly for guardian/service manager fields.
    useEffect(() => {
      if (hasValidatedStep) {
        trigger([
          "guardianId",
          "serviceManagerId",
          "guardianFirstName",
          "guardianLastName",
          "guardianEmail",
          "serviceManagerFirstName",
          "serviceManagerLastName",
          "serviceManagerEmail",
        ]);
      }
    }, [
      guardianId,
      serviceManagerId,
      guardianFirstName,
      guardianLastName,
      serviceManagerFirstName,
      serviceManagerLastName,
      trigger,
      hasValidatedStep,
    ]);

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
        setProfilePicture(null);
        setProfilePreview(null);
        setValue("profilePicture", null as any);
        if (event.target) {
          event.target.value = "";
        }
        return;
      }
      setSnackbar((prev) => ({ ...prev, isOpen: false }));
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setValue("profilePicture", file);
    };

    const handleAvatarClick = () => {
      fileInputRef.current?.click();
    };

    const handleRemoveProfilePic = (e: React.MouseEvent) => {
      e.stopPropagation();
      setProfilePicture(null);
      setProfilePreview(null);
      setValue("profilePicture", null as any);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Fetch guardians - only when form is mounted (drawer is open)
    const { data: guardiansResponse } = useQuery({
      ...(listUsersOptions({
        query: {
          role: "GUARDIAN",
          status: "active",
          size: 1000, // Get all guardians
        },
      }) as any),
      enabled: true, // Enabled when component is mounted (drawer is open)
    });

    // Fetch service managers (AGENT role) - only active records - only when form is mounted (drawer is open)
    const { data: serviceManagersResponse } = useQuery({
      ...(listUsersOptions({
        query: {
          role: "AGENT",
          status: "active",
          size: 1000, // Get all service managers
        },
      }) as any),
      enabled: true, // Enabled when component is mounted (drawer is open)
    });

    // Transform guardians data to dropdown options - only active records
    const guardianOptions: Array<{ value: string; label: string }> =
      useMemo(() => {
        if (!guardiansResponse) return [];

        const responseData = guardiansResponse as any;
        let users: any[] = [];

        if (responseData?.data) {
          if (
            responseData.data.results &&
            Array.isArray(responseData.data.results)
          ) {
            users = responseData.data.results;
          } else if (Array.isArray(responseData.data)) {
            users = responseData.data;
          } else if (
            responseData.data.data &&
            Array.isArray(responseData.data.data)
          ) {
            users = responseData.data.data;
          }
        }

        // Filter to ensure only active users are included
        return users
          .filter(
            (user: any) => user.active !== false && user.active !== undefined,
          )
          .map((user: any) => ({
            value: user.uuid || "",
            label:
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.email ||
              "",
          }));
      }, [guardiansResponse]);

    // Transform service managers data to dropdown options - only active records
    const serviceManagerOptions: Array<{ value: string; label: string }> =
      useMemo(() => {
        if (!serviceManagersResponse) return [];

        const responseData = serviceManagersResponse as any;
        let users: any[] = [];

        if (responseData?.data) {
          if (
            responseData.data.results &&
            Array.isArray(responseData.data.results)
          ) {
            users = responseData.data.results;
          } else if (Array.isArray(responseData.data)) {
            users = responseData.data;
          } else if (
            responseData.data.data &&
            Array.isArray(responseData.data.data)
          ) {
            users = responseData.data.data;
          }
        }

        // Filter to ensure only active users are included
        return users
          .filter(
            (user: any) => user.active !== false && user.active !== undefined,
          )
          .map((user: any) => ({
            value: user.uuid || "",
            label:
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.email ||
              "",
          }));
      }, [serviceManagersResponse]);

    const renderDemographicsStep = () => {
      const relationOptions = [
        { value: "Parent", label: "Parent" },
        { value: "Guardian", label: "Guardian" },
        { value: "Sibling", label: "Sibling" },
        { value: "Other", label: "Other" },
      ];

      return (
        <Box>
          <Typography
            variant="body1"
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#212121",
              mb: 2,
              textAlign: "left",
            }}
          >
            Demographics
          </Typography>

          <Box
            sx={{
              border: "1px solid #E3ECEF",
              borderRadius: "4px",
              p: 2,
              mb: 3,
            }}
          >
            <Grid container spacing={1.5}>
              {/* Left Column - Profile Pic and Contact Info */}
              <Grid size={{ xs: 12, sm: 4, md: 3, lg: 3 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {/* Profile Picture */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      alignItems: "flex-start",
                    }}
                  >
                    <CustomLabel label="Upload Profile Pic" />
                    <Box
                      sx={{
                        position: "relative",
                        display: "inline-block",
                        cursor: "pointer",
                      }}
                      onClick={handleAvatarClick}
                    >
                      {profilePreview ? (
                        <>
                          <Avatar
                            src={profilePreview}
                            sx={{
                              width: 100,
                              height: 100,
                              borderRadius: "50%",
                              border: "none",
                            }}
                          />
                          <IconButton
                            size="small"
                            aria-label="Remove photo"
                            onClick={handleRemoveProfilePic}
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
                        </>
                      ) : (
                        <Box
                          sx={{
                            width: 100,
                            height: 100,
                            borderRadius: "50%",
                            backgroundColor: "#f6f8fb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "none",
                          }}
                        >
                          <Box
                            component="img"
                            src="data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 15V3M12 3L8 7M12 3L16 7M4 13H20C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V14C3 13.4477 3.44772 13 4 13Z' stroke='%238A8F98' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
                            alt="Upload"
                            sx={{
                              width: "24px",
                              height: "24px",
                              opacity: 0.6,
                            }}
                          />
                        </Box>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Right Column - Personal Information */}
              <Grid size={{ xs: 12, sm: 8, md: 9, lg: 9 }}>
                <Grid container spacing={2}>
                  {/* First Name */}
                  <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="First Name" isRequired />
                      <Controller
                        name="firstName"
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            placeholder="Enter First Name"
                            name="firstName"
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!errors.firstName}
                            errorMessage={errors.firstName?.message}
                            required
                          />
                        )}
                      />
                    </Box>
                  </Grid>

                  {/* Last Name */}
                  <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="Last Name" isRequired />
                      <Controller
                        name="lastName"
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            placeholder="Enter Last Name"
                            name="lastName"
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!errors.lastName}
                            errorMessage={errors.lastName?.message}
                            required
                          />
                        )}
                      />
                    </Box>
                  </Grid>

                  {/* Date of Birth */}
                  <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="Date of Birth" isRequired />
                      <Controller
                        name="dateOfBirth"
                        control={control}
                        render={({ field }) => (
                          <DatePickerField
                            value={field.value}
                            onChange={field.onChange}
                            label=""
                            hasError={!!errors.dateOfBirth}
                            errorMessage={errors.dateOfBirth?.message}
                            disableFuture
                          />
                        )}
                      />
                    </Box>
                  </Grid>

                  {/* Gender */}
                  <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <CustomLabel label="Gender" />
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            placeholder="Select Gender"
                            name="gender"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            items={[
                              { value: "MALE", label: "Male" },
                              { value: "FEMALE", label: "Female" },
                              { value: "OTHER", label: "Other" },
                            ]}
                            hasError={!!errors.gender}
                            errorMessage={errors.gender?.message}
                            isDisabled={false}
                            enableDeselect={true}
                          />
                        )}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                >
                  <CustomLabel label="Phone Number" />
                  <Controller
                    name="contactNumber"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        placeholder="Enter Phone Number"
                        name="contactNumber"
                        value={field.value}
                        onChange={field.onChange}
                        phone
                        hasError={!!errors.contactNumber}
                        errorMessage={errors.contactNumber?.message}
                        required
                      />
                    )}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                >
                  <CustomLabel label="Email"/>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        placeholder="Enter Email"
                        name="email"
                        value={field.value}
                        onChange={field.onChange}
                        isEmail
                        hasError={!!errors.email}
                        errorMessage={errors.email?.message}
                        required
                      />
                    )}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                >
                  <CustomLabel label="Referral Source" />
                  <Controller
                    name="referralSource"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        placeholder="Enter Referral Source"
                        name="referralSource"
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.referralSource}
                        errorMessage={errors.referralSource?.message}
                        required
                      />
                    )}
                  />
                </Box>
              </Grid>

              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                ></Box>
              </Grid>

              {/* Street Address */}
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                >
                  <CustomLabel label="Street Address" isRequired />
                  <Controller
                    name="streetAddress"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        placeholder="Enter Street Address"
                        name="streetAddress"
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.streetAddress}
                        errorMessage={errors.streetAddress?.message}
                        required
                      />
                    )}
                  />
                </Box>
              </Grid>

              {/* City */}
              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                >
                  <CustomLabel label="City" isRequired />
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        placeholder="Enter City"
                        name="city"
                        value={field.value}
                        onChange={field.onChange}
                        hasError={!!errors.city}
                        errorMessage={errors.city?.message}
                        required
                      />
                    )}
                  />
                </Box>
              </Grid>

              {/* State */}
              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                >
                  <CustomLabel label="State" isRequired />
                  <Controller
                    name="state"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomSelect
                        placeholder="Select State"
                        name="state"
                        value={field.value}
                        items={STATE_OPTIONS}
                        onChange={(e: SelectChangeEvent<string>) =>
                          field.onChange(e.target.value)
                        }
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        enableDeselect={true}
                      />
                    )}
                  />
                </Box>
              </Grid>

              {/* ZIP Code */}
              <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
                >
                  <CustomLabel label="ZIP Code" isRequired />
                  <Controller
                    name="zipCode"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        placeholder="Enter ZIP Code"
                        name="zipCode"
                        value={field.value}
                        onChange={field.onChange}
                        zipCode
                        hasError={!!errors.zipCode}
                        errorMessage={errors.zipCode?.message}
                        required
                      />
                    )}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Guardian Information Section Heading */}
          <Typography
            variant="h6"
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#212121",
              mt: 4,
              mb: 3,
            }}
          >
            Guardian Information
          </Typography>

          <Grid container spacing={2}>
            {/* Guardian Section */}
            <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <CustomLabel label="Guardian" />
                <Controller
                  name="guardianId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      placeholder="Select"
                      name="guardianId"
                      value={field.value ?? undefined}
                      onChange={(e) => {
                        field.onChange(e.target.value || null);
                        if (e.target.value) {
                          setShowGuardianAddNew(false);
                          setValue("guardianFirstName", null);
                          setValue("guardianLastName", null);
                          setValue("guardianRelation", null);
                          setValue("guardianContactNumber", null);
                          setValue("guardianEmail", null);
                        }
                      }}
                      items={guardianOptions}
                      hasError={!!errors.guardianId}
                      errorMessage={errors.guardianId?.message}
                      isDisabled={showGuardianAddNew}
                      enableDeselect={true}
                    />
                  )}
                />
              </Box>
            </Grid>

            {/* Not able to find Guardian? Section */}
            <Grid size={{ xs: 12, sm: 12, md: 10, lg: 12 }}>
              <Box
                sx={{
                  border: "2px solid #bed0d6",
                  borderRadius: "8px",
                  backgroundColor: "#F6F8FB",
                  p: 1.2,
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: showGuardianAddNew ? 2 : 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: "#5e605e", fontSize: "16px" }}
                  >
                    Not able to find Guardian?
                  </Typography>
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    icon={<AddIcon />}
                    iconPosition="left"
                    disabled={showGuardianAddNew || !!selectedGuardianId}
                    onClick={() => {
                      setShowGuardianAddNew(true);
                      setValue("guardianId", null);
                    }}
                  >
                    Add New
                  </CustomButton>
                </Box>

                {showGuardianAddNew && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="First Name" isRequired />
                        <Controller
                          name="guardianFirstName"
                          control={control}
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter First Name"
                              name="guardianFirstName"
                              value={field.value || ""}
                              onChange={field.onChange}
                              hasError={!!errors.guardianFirstName}
                              errorMessage={errors.guardianFirstName?.message}
                              required
                            />
                          )}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="Last Name" isRequired />
                        <Controller
                          name="guardianLastName"
                          control={control}
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter Last Name"
                              name="guardianLastName"
                              value={field.value || ""}
                              onChange={field.onChange}
                              hasError={!!errors.guardianLastName}
                              errorMessage={errors.guardianLastName?.message}
                            />
                          )}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="Relation" />
                        <Controller
                          name="guardianRelation"
                          control={control}
                          render={({ field }) => (
                            <CustomSelect
                              placeholder="Select"
                              name="guardianRelation"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              items={relationOptions}
                              hasError={!!errors.guardianRelation}
                              errorMessage={errors.guardianRelation?.message}
                              isDisabled={false}
                              bgWhite={true}
                              enableDeselect={true}
                            />
                          )}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="Phone Number" isRequired />
                        <Controller
                          name="guardianContactNumber"
                          control={control}
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter Phone Number"
                              name="guardianContactNumber"
                              value={field.value || ""}
                              onChange={field.onChange}
                              phone
                              hasError={!!errors.guardianContactNumber}
                              errorMessage={
                                errors.guardianContactNumber?.message
                              }
                              required
                            />
                          )}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <CustomLabel label="Email" isRequired />
                        <Controller
                          name="guardianEmail"
                          control={control}
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter Email"
                              name="guardianEmail"
                              value={field.value || ""}
                              onChange={field.onChange}
                              isEmail
                              hasError={!!errors.guardianEmail}
                              errorMessage={errors.guardianEmail?.message}
                              required
                            />
                          )}
                        />
                      </Box>
                    </Grid>

                    <Grid
                      size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
                      sx={{
                        display: "flex",
                        gap: 2,
                        justifyContent: "flex-end",
                        mt: 1,
                      }}
                    >
                      <CustomButton
                        variant="secondary"
                        size="md"
                        onClick={() => {
                          setShowGuardianAddNew(false);
                          setValue("guardianFirstName", null);
                          setValue("guardianLastName", null);
                          setValue("guardianRelation", null);
                          setValue("guardianContactNumber", null);
                          setValue("guardianEmail", null);
                          clearErrors([
                            "guardianFirstName",
                            "guardianLastName",
                            "guardianRelation",
                            "guardianContactNumber",
                            "guardianEmail",
                          ]);
                        }}
                      >
                        Cancel
                      </CustomButton>
                    </Grid>
                  </Grid>
                )}
              </Box>
            </Grid>

            {/* Service Manager Information Section Heading */}
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
              <Typography
                variant="h6"
                sx={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#212121",
                  mt: 4,
                  mb: 3,
                }}
              >
                Area Agency Information
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <CustomLabel label="Area Agency" />
                    <Controller
                      name="serviceManagerId"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          placeholder="Select"
                          name="serviceManagerId"
                          value={field.value ?? undefined}
                          onChange={(e) => {
                            field.onChange(e.target.value || null);
                            if (e.target.value) {
                              setShowServiceManagerAddNew(false);
                              setValue("serviceManagerFirstName", null);
                              setValue("serviceManagerLastName", null);
                              setValue("serviceManagerContactNumber", null);
                              setValue("serviceManagerEmail", null);
                            }
                          }}
                          items={serviceManagerOptions}
                          hasError={!!errors.serviceManagerId}
                          errorMessage={errors.serviceManagerId?.message}
                          isDisabled={showServiceManagerAddNew}
                          enableDeselect={true}
                        />
                      )}
                    />
                  </Box>
                </Grid>

                {/* Not able to find Service Manager? Section */}
                <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                  <Box
                    sx={{
                      border: "2px solid #bed0d6",
                      borderRadius: "8px",
                      backgroundColor: "#F6F8FB",
                      p: 1.2,
                      mt: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: showServiceManagerAddNew ? 2 : 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#5a5a5a", fontSize: "16px" }}
                      >
                        Not able to find Area Agency?
                      </Typography>
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        icon={<AddIcon />}
                        iconPosition="left"
                        disabled={
                          showServiceManagerAddNew || !!selectedServiceManagerId
                        }
                        onClick={() => {
                          setShowServiceManagerAddNew(true);
                          setValue("serviceManagerId", null);
                        }}
                      >
                        Add New
                      </CustomButton>
                    </Box>

                    {showServiceManagerAddNew && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <CustomLabel label="First Name" isRequired />
                            <Controller
                              name="serviceManagerFirstName"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter First Name"
                                  name="serviceManagerFirstName"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  hasError={!!errors.serviceManagerFirstName}
                                  errorMessage={
                                    errors.serviceManagerFirstName?.message
                                  }
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <CustomLabel label="Last Name" isRequired />
                            <Controller
                              name="serviceManagerLastName"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Last Name"
                                  name="serviceManagerLastName"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  hasError={!!errors.serviceManagerLastName}
                                  errorMessage={
                                    errors.serviceManagerLastName?.message
                                  }
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <CustomLabel label="Email" isRequired />
                            <Controller
                              name="serviceManagerEmail"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Email"
                                  name="serviceManagerEmail"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  isEmail
                                  hasError={!!errors.serviceManagerEmail}
                                  errorMessage={
                                    errors.serviceManagerEmail?.message
                                  }
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            <CustomLabel label="Phone Number" isRequired />
                            <Controller
                              name="serviceManagerContactNumber"
                              control={control}
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter Phone Number"
                                  name="serviceManagerContactNumber"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  phone
                                  hasError={
                                    !!errors.serviceManagerContactNumber
                                  }
                                  errorMessage={
                                    errors.serviceManagerContactNumber?.message
                                  }
                                  required
                                />
                              )}
                            />
                          </Box>
                        </Grid>

                        <Grid
                          size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
                          sx={{
                            display: "flex",
                            gap: 2,
                            justifyContent: "flex-end",
                            mt: 1,
                          }}
                        >
                          <CustomButton
                            variant="secondary"
                            size="md"
                            onClick={() => {
                              setShowServiceManagerAddNew(false);
                              setValue("serviceManagerFirstName", null);
                              setValue("serviceManagerLastName", null);
                              setValue("serviceManagerContactNumber", null);
                              setValue("serviceManagerEmail", null);
                              clearErrors([
                                "serviceManagerFirstName",
                                "serviceManagerLastName",
                                "serviceManagerContactNumber",
                                "serviceManagerEmail",
                              ]);
                            }}
                          >
                            Cancel
                          </CustomButton>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      );
    };

    const renderInsuranceStep = () => (
      <InsuranceForm control={control} errors={errors} />
    );

    const renderDocumentsStep = () => {
      if (!leadId) return null;

      return (
        <DocumentChecklistForm
          objectId={leadId}
          contentTypeApp="leads"
          contentTypeModel="lead"
          onChecklistCompleteChange={setDocumentsChecklistComplete}
        />
      );
    };

    const renderStepContent = () => {
      switch (activeStep) {
        case "demographics":
          return renderDemographicsStep();
        case "insurance":
          return renderInsuranceStep();
        case "documents":
          return renderDocumentsStep();
        default:
          return null;
      }
    };

    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Content Area - Scrollable */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            px: 3,
            py: 2,
            minHeight: 0,
          }}
        >
          {renderStepContent()}
        </Box>

        {/* Fixed Footer */}
        <Box
          sx={{
            borderTop: "1px solid #E3ECEF",
            backgroundColor: "#FFFFFF",
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <CustomButton
            variant="secondary"
            size="md"
            onClick={isFirstStep ? handleCancel : handleBack}
          >
            {isFirstStep ? "Cancel" : "Back"}
          </CustomButton>

          <Box sx={{ display: "flex", gap: 2 }}>
            {onSaveDraft && (
              <CustomButton
                variant="secondary"
                size="md"
                onClick={async () => {
                  try {
                    // 👇 validate ONLY current step fields (same as Next)
                    const stepFieldsToValidate = getStepFields(activeStep);
                    const isValid = await trigger(stepFieldsToValidate as any);

                    if (!isValid) {
                      // Find the first field with an error and focus on it
                      const firstErrorField = stepFieldsToValidate.find(
                        (field) => errors[field as keyof typeof errors],
                      );
                      if (firstErrorField) {
                        setFocus(firstErrorField);
                        // Scroll to the first error field
                        setTimeout(() => {
                          const element = document.querySelector(
                            `[name="${firstErrorField}"]`,
                          );
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }, 100);
                      }
                      setHasValidatedStep(true); // Mark step as validated to show errors
                      return;
                    }

                    // 👇 only called when valid
                    const currentFormData = getValues();
                    await onSaveDraft?.(currentFormData);
                  } catch (error) {
                    console.error("Error saving draft:", error);
                  }
                }}
              >
                Save as Draft
              </CustomButton>
            )}
            <CustomButton
              variant="primary"
              size="md"
              onClick={
                isLastStep
                  ? handleSubmit(
                    (data) => {
                      // ✅ Normalize + map fields for backend (include doc checklist so backend can set UNDER_REVIEW)
                      const payload = {
                        ...data,

                        // force empty string instead of null
                        email: data.email || "",
                        gender: data.gender || "",
                        referral_source: data.referralSource || "",

                        // optional: map names if your API expects snake_case
                        first_name: data.firstName,
                        last_name: data.lastName,

                        documentsChecklistComplete,
                      };

                      onSubmit(payload as any);
                    },

                    (errors) => {
                      console.error("Form validation errors:", errors);
                      // Validation failed - errors are already shown in the form
                    },
                  )
                  : handleNext
              }
            // disabled={!isCurrentStepValid}
            >
              {isLastStep ? "Submit" : "Next"}
            </CustomButton>
          </Box>
        </Box>

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
      </Box>
    );
  },
);

export default NewLeadForm;
