/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-compiler/react-compiler */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Grid,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  AlertTitle,
  Stack,
  TextField,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { useForm, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import dayjs from "dayjs";

import CustomSelect from "../../../components/custom-select/custom-select";
import CustomAutoComplete from "../../../components/custom-auto-complete/custom-auto-complete";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomCheckbox from "../../../components/custom-checkbox/custom-checkbox";
import CustomLabel from "../../../components/custom-label/custom-label";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import TimePickerField from "../../../components/time-picker-field/time-picker-field";
import { type SignatureCanvasRef } from "../../../components/signature-canvas";
import { SignatureCanvas } from "../../../components/signature-canvas";
import { useAuth } from "../../../hooks/useAuth";
import { useMediaUpload, dataUrlToFile } from "../../../hooks/useMediaUpload";
import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store/hooks";
import {
  useCreateIncidentMutation,
  useUpdateIncidentMutation,
  useIncidentQuery,
  getBackendMessage,
  useResidentsQuery,
} from "../hooks/useIncidents";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import type { CreateIncidentPayload } from "../types/incidents.types";
import IncidentFooter, {
  type IncidentRole,
} from "./IncidentFooter";
import type { IncidentStatus as IncidentLifecycleStatus } from "../api/transitions.api";
import { useQueryClient } from "@tanstack/react-query";
import {
  listIncidentsOptions,
  getIncidentOptions,
} from "../../../sdk/@tanstack/react-query.gen";

// Extract Dayjs type from DatePickerField's onChange parameter
type Dayjs = Parameters<
  NonNullable<React.ComponentProps<typeof DatePickerField>["onChange"]>
>[0];

// Form data type
export interface AddIncidentFormValues {
  residentName: string; // ✅ now stores resident ID (pk/uuid) not name
  incidentName: string;
  incidentLocation: string;
  dateAAReceivedIR: Dayjs | null;
  region: string;
  incidentDate: Dayjs | null;
  incidentTime: string;
  agencyName: string | null;
  medical: {
    hospitalizationMedical: boolean;
    hospitalizationPsychiatric: boolean;
    injuryNoIntervention: boolean;
    injuryWithIntervention: boolean;
    illnessNoIntervention: boolean;
    illnessWithIntervention: boolean;
    seizure: boolean;
    medicationRefusal: boolean;
    fall: boolean;
    other: boolean;
  };
  legal: {
    clientRightsViolation: boolean;
    missingEloped: boolean;
    policeInvolvement: boolean;
  };
  victimOf: {
    theft: boolean;
    assault: boolean;
    sexualAssault: boolean;
    carAccident: boolean;
    fireHazardArson: boolean;
  };
  social: {
    behaviorNoPlan: boolean;
    behaviorWithPlan: boolean;
    mentalHealthEpisode: boolean;
    physicalRestraint: boolean;
    other: boolean;
  };
  medicalOther: string;
  socialOther: string;
  whatHappenedPrior: string;
  describeIncident: string;
  actionTaken: string;
  whoNotified: {
    serviceCoordinator: boolean;
    serviceCoordinatorAt: Dayjs | null;
    serviceCoordinatorMethod: string;
    serviceCoordinatorByWhom: string;

    programManager: boolean;
    programManagerAt: Dayjs | null;
    programManagerMethod: string;
    programManagerByWhom: string;

    guardian: boolean;
    guardianAt: Dayjs | null;
    guardianMethod: string;
    guardianByWhom: string;

    additionalServiceProvider: boolean;
    additionalServiceProviderAt: Dayjs | null;
    additionalServiceProviderMethod: string;
    additionalServiceProviderByWhom: string;

    nursing: boolean;
    nursingAt: Dayjs | null;
    nursingMethod: string;
    nursingByWhom: string;
  };

  signature: string | null;
}

const getInitialIncidentFormValues = (): AddIncidentFormValues => ({
  residentName: "",
  incidentName: "",
  incidentLocation: "",
  dateAAReceivedIR: null,
  region: "",
  incidentDate: null,
  incidentTime: "",
  agencyName: "",
  medical: {
    hospitalizationMedical: false,
    hospitalizationPsychiatric: false,
    injuryNoIntervention: false,
    injuryWithIntervention: false,
    illnessNoIntervention: false,
    illnessWithIntervention: false,
    seizure: false,
    medicationRefusal: false,
    fall: false,
    other: false,
  },
  legal: {
    clientRightsViolation: false,
    missingEloped: false,
    policeInvolvement: false,
  },
  victimOf: {
    theft: false,
    assault: false,
    sexualAssault: false,
    carAccident: false,
    fireHazardArson: false,
  },
  social: {
    behaviorNoPlan: false,
    behaviorWithPlan: false,
    mentalHealthEpisode: false,
    physicalRestraint: false,
    other: false,
  },
  medicalOther: "",
  socialOther: "",
  whatHappenedPrior: "",
  describeIncident: "",
  actionTaken: "",
  whoNotified: {
    serviceCoordinator: false,
    serviceCoordinatorAt: null,
    serviceCoordinatorMethod: "",
    serviceCoordinatorByWhom: "",

    programManager: false,
    programManagerAt: null,
    programManagerMethod: "",
    programManagerByWhom: "",

    guardian: false,
    guardianAt: null,
    guardianMethod: "",
    guardianByWhom: "",

    additionalServiceProvider: false,
    additionalServiceProviderAt: null,
    additionalServiceProviderMethod: "",
    additionalServiceProviderByWhom: "",

    nursing: false,
    nursingAt: null,
    nursingMethod: "",
    nursingByWhom: "",
  },

  signature: null,
});

function extractSavedIncidentTime(incidentDateTime?: string | null): string {
  if (!incidentDateTime) return "";
  const match = String(incidentDateTime).match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

// Yup validation schema
const incidentFormSchema = yup.object({
  dateAAReceivedIR: yup
    .mixed()
    .required("Date AA Received IR is required")
    .test("not-null", "Date AA Received IR is required", (value) => {
      return value != null;
    }),
  residentName: yup
    .string()
    .required("Individual Name is required")
    .test("not-empty", "Individual Name is required", (value) => {
      return value != null && value.trim() !== "";
    }),
  incidentName: yup
    .string()
    .trim()
    .required("Incident Name is required")
    .max(40, "Incident Name must be 40 characters or less")
    .test("not-empty", "Incident Name is required", (value) => {
      return value != null && value.trim() !== "";
    }),
  incidentLocation: yup.string().optional(),
  region: yup.string().optional(),
  incidentDate: yup
    .mixed()
    .required("Incident Date is required")
    .test("not-null", "Incident Date is required", (value) => {
      return value != null;
    }),
  incidentTime: yup
    .string()
    .required("Incident Time is required")
    .test("not-empty", "Incident Time is required", (value) => {
      return value != null && value.trim() !== "";
    }),
  agencyName: yup.string().max(250, "Agency name must be 250 characters or less").nullable().optional(),
  medical: yup
    .object({
      hospitalizationMedical: yup.boolean().optional(),
      hospitalizationPsychiatric: yup.boolean().optional(),
      injuryNoIntervention: yup.boolean().optional(),
      injuryWithIntervention: yup.boolean().optional(),
      illnessNoIntervention: yup.boolean().optional(),
      illnessWithIntervention: yup.boolean().optional(),
      seizure: yup.boolean().optional(),
      medicationRefusal: yup.boolean().optional(),
      fall: yup.boolean().optional(),
      other: yup.boolean().optional(),
    })
    .optional(),
  legal: yup
    .object({
      clientRightsViolation: yup.boolean().optional(),
      missingEloped: yup.boolean().optional(),
      policeInvolvement: yup.boolean().optional(),
    })
    .optional(),
  victimOf: yup
    .object({
      theft: yup.boolean().optional(),
      assault: yup.boolean().optional(),
      sexualAssault: yup.boolean().optional(),
      carAccident: yup.boolean().optional(),
      fireHazardArson: yup.boolean().optional(),
    })
    .optional(),
  social: yup
    .object({
      behaviorNoPlan: yup.boolean().optional(),
      behaviorWithPlan: yup.boolean().optional(),
      mentalHealthEpisode: yup.boolean().optional(),
      physicalRestraint: yup.boolean().optional(),
      other: yup.boolean().optional(),
    })
    .optional(),
  medicalOther: yup
    .string()
    .nullable()
    .when("medical", (medical, schema) =>
      medical?.other
        ? schema.required("Please specify other medical details").trim()
        : schema.optional().nullable()
    ),
  socialOther: yup
    .string()
    .nullable()
    .when("social", (social, schema) =>
      social?.other
        ? schema.required("Please specify other social details").trim()
        : schema.optional().nullable()
    ),
  whatHappenedPrior: yup.string().optional(),
  describeIncident: yup.string().optional(),
  actionTaken: yup.string().optional(),
  whoNotified: yup
    .object({
      serviceCoordinator: yup.boolean().optional(),
      serviceCoordinatorAt: yup.mixed().nullable().optional(),
      programManager: yup.boolean().optional(),
      programManagerAt: yup.mixed().nullable().optional(),
      guardian: yup.boolean().optional(),
      guardianAt: yup.mixed().nullable().optional(),
      additionalServiceProvider: yup.boolean().optional(),
      additionalServiceProviderAt: yup.mixed().nullable().optional(),
      nursing: yup.boolean().optional(),
      nursingAt: yup.mixed().nullable().optional(),
    })
    .optional(),
  signature: yup.string().nullable().optional(),
});

/** Field names in visual order (top to bottom) for scroll-to-first-error */
const INCIDENT_FIELD_ORDER = [
  "residentName",
  "incidentName",
  "incidentLocation",
  "dateAAReceivedIR",
  "region",
  "incidentDate",
  "incidentTime",
  "agencyName",
  "medical",
  "medicalOther",
  "legal",
  "victimOf",
  "social",
  "socialOther",
  "whatHappenedPrior",
  "describeIncident",
  "actionTaken",
  "whoNotified",
  "signature",
];

function scrollToFirstInvalidField(errors: Record<string, unknown>): void {
  const firstField = INCIDENT_FIELD_ORDER.find((name) => errors[name]);
  if (!firstField) return;
  requestAnimationFrame(() => {
    const el = document.querySelector(`[data-field="${firstField}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = el.querySelector<HTMLElement>(
        "input:not([type=hidden]), select, textarea, [role=combobox]"
      );
      if (focusable?.focus) focusable.focus();
    }
  });
}

interface AddNewIncidentDrawerProps {
  open: boolean;
  onClose: () => void;
  mode?: "add" | "edit";
  incidentUuid?: string;
  focusSignatureOnOpen?: boolean;

  fixedResidentId?: string | number;
  fixedResidentName?: string;
  notifiedAt?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const NotifyRow = ({
  label,
  name,
  atName,
  methodName,
  byWhomName,
  control,
  setValue,
  getValues,
  currentUserName = "",
  disableFuture = false,
}: {
  label: string;
  name: string;
  atName: string;
  methodName: string;
  byWhomName: string;
  control: any;
  setValue: any;
  getValues?: any;
  currentUserName?: string;
  disableFuture?: boolean;
}) => (
  <>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CustomCheckbox
          checked={field.value}
          onChange={() => {
            const newValue = !field.value;
            field.onChange(newValue);
            // Auto-fill with today's date + current time when checking ON.
            // Also default Method of Contact to "Email" and By Whom to the
            // current user's name — only when those fields are still empty
            // (don't clobber anything the user already typed).
            if (newValue) {
              setValue(atName, dayjs(), { shouldValidate: false });
              const existingMethod = getValues ? getValues(methodName) : "";
              if (!existingMethod) {
                setValue(methodName, "Email", { shouldValidate: false });
              }
              const existingByWhom = getValues ? getValues(byWhomName) : "";
              if (!existingByWhom && currentUserName) {
                setValue(byWhomName, currentUserName, { shouldValidate: false });
              }
            } else {
              setValue(atName, null, { shouldValidate: false });
              setValue(methodName, "", { shouldValidate: false });
              setValue(byWhomName, "", { shouldValidate: false });
            }
          }}
          label={label}
        />
      )}
    />

    <Controller
      name={name}
      control={control}
      render={({ field }) =>
        field.value && (
          <Grid container spacing={2} sx={{ pl: 4, mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <Controller
                name={atName}
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    disableFuture={disableFuture}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Controller
                name={atName}
                control={control}
                render={({ field }) => (
                  <TimePickerField
                    value={field.value ? field.value.format("HH:mm") : ""}
                    onChange={(t) => {
                      const existingDate = field.value && field.value.isValid()
                        ? field.value.format("YYYY-MM-DD")
                        : dayjs().format("YYYY-MM-DD");
                      field.onChange(
                        dayjs(`${existingDate} ${t}`),
                      );
                    }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Controller
                name={methodName}
                control={control}
                render={({ field }) => (
                  <CustomInput
                    name={methodName}
                    placeholder="Method of Contact"
                    value={field.value || ""}
                    onChange={field.onChange}
                    bgWhite
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Controller
                name={byWhomName}
                control={control}
                render={({ field }) => (
                  <CustomInput
                    name={byWhomName}
                    placeholder="By Whom"
                    value={field.value || ""}
                    onChange={field.onChange}
                    bgWhite
                  />
                )}
              />
            </Grid>
          </Grid>
        )
      }
    />
  </>
);

const AddNewIncidentDrawer: React.FC<AddNewIncidentDrawerProps> = ({
  open,
  onClose,
  mode = "add",
  incidentUuid,
  focusSignatureOnOpen = false,
  fixedResidentId,
  fixedResidentName: _fixedResidentName,
  notifiedAt: _notifiedAt,
  onSuccess,
  onError,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();
  const { getScope } = usePermission();
  const userFromStore = useAppSelector((state) => state.auth.user);

  // Determine if this user has ASSIGNED_HOME scope for incidents (e.g. nurse, program coordinator)
  const incidentScope = getScope("incidents.view") || getScope("incidents.create");
  const isAssignedHome = incidentScope === "ASSIGNED_HOME";
  const userGroupHomeUuid = isAssignedHome
    ? ((userFromStore as any)?.group_home?.uuid || "")
    : "";

  const isEditMode = mode === "edit" && !!incidentUuid;

  const createIncidentMutation = useCreateIncidentMutation();
  const updateIncidentMutation = useUpdateIncidentMutation(incidentUuid);
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch residents for dropdown - when drawer is open
  // For ASSIGNED_HOME scope (e.g. nurses, program coordinators): only fetch residents from their group home
  const { data: residentsData, isLoading: isLoadingResidents } =
    useResidentsQuery(
      undefined,
      "ACTIVE", // Only show active residents
      open, // Fetch when drawer is open
      userGroupHomeUuid || undefined, // Filter by group home for ASSIGNED_HOME scope users
    );

  // Fetch incident data when in edit mode AND drawer is open
  const { data: incidentResponse, isLoading: isLoadingIncident } =
    useIncidentQuery(
      isEditMode ? incidentUuid : undefined,
      open && isEditMode, // Only fetch when drawer is open and in edit mode
    );

  // Extract incident data from response
  const incidentData = useMemo(() => {
    if (!incidentResponse || !isEditMode) return null;

    // Backend returns: { status: "success", data: {...} }
    if (typeof incidentResponse === "object" && "data" in incidentResponse) {
      return (incidentResponse as any).data;
    }

    // Fallback: assume direct incident object
    return incidentResponse;
  }, [incidentResponse, isEditMode]);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // ✅ Build resident options for CustomAutoComplete as { key: residentId, value: "First Last" }
  const residentOptions = useMemo((): Array<{ key: string; value: string }> => {
    if (!residentsData || !Array.isArray(residentsData)) return [];

    return residentsData
      .map((resident: any) => {
        // Backend returns: resident_uuid, resident_name, group_home, etc.
        const residentUuid = resident?.resident_uuid ?? resident?.uuid ?? null;
        const residentName = resident?.resident_name ?? "Unknown Resident";

        if (!residentUuid) return null;

        return {
          key: String(residentUuid),
          value: residentName,
        };
      })
      .filter((item): item is { key: string; value: string } => item !== null)
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [residentsData]);

  // Region options
  const regionOptions = [
    { value: "northern_human_services", label: "Northern Human Services" },
    { value: "pathways_of_the_river_valley", label: "PathWays of the River Valley" },
    { value: "lakes_region_community_services", label: "Lakes Region Community Services" },
    { value: "community_bridges", label: "Community Bridges" },
    { value: "monadnock_developmental_services", label: "Monadnock Developmental Services" },
    { value: "gateways_community_services", label: "Gateways Community Services" },
    { value: "the_moore_center", label: "The Moore Center" },
    { value: "one_sky_community_services", label: "One Sky Community Services" },
    { value: "community_partners", label: "Community Partners" },
    { value: "community_crossroads", label: "Community Crossroads" },
  ];

  // Recompute when the drawer opens so new incident forms start clean.
  const initialValues = useMemo(() => getInitialIncidentFormValues(), [open]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
  } = useForm<AddIncidentFormValues>({
    resolver: yupResolver(incidentFormSchema) as any,
    mode: "onChange",
  });

  // Full name of the currently signed-in user — used to prefill the
  // "By Whom" field in Who Notified rows when the user toggles a row on.
  const currentUserName = useMemo(() => {
    const u: any = (user as any) || (userFromStore as any) || {};
    const first = u?.first_name || "";
    const last = u?.last_name || "";
    const joined = `${first} ${last}`.trim();
    return joined || u?.email || "";
  }, [user, userFromStore]);

  // Watch toggles at top-level to comply with React hook rules
  const medicalOther = useWatch({
    control,
    name: "medical.other",
    defaultValue: false,
  });
  const socialOther = useWatch({
    control,
    name: "social.other",
    defaultValue: false,
  });

  const signatureCanvasRef = React.useRef<SignatureCanvasRef>(null);
  const pmSignatureCanvasRef = React.useRef<SignatureCanvasRef>(null);
  const signatureFileInputRef = React.useRef<HTMLInputElement>(null);
  const pmSignatureFileInputRef = React.useRef<HTMLInputElement>(null);
  const blobUrlRef = React.useRef<string | null>(null);
  const [hasPmSignatureDrawn, setHasPmSignatureDrawn] = useState(false);
  const [pmSignatureMethod, setPmSignatureMethod] = useState<"DRAW" | "UPLOAD">("DRAW");
  const [pmUploadedFile, setPmUploadedFile] = useState<File | null>(null);
  const [pmSignatureFileError, setPmSignatureFileError] = useState<string | null>(null);
  const [isPmProfileSignatureCleared, setIsPmProfileSignatureCleared] =
    useState(false);
  const [isPmIncidentSignatureCleared, setIsPmIncidentSignatureCleared] =
    useState(false);

  const [signatureMethod, setSignatureMethod] = useState<"DRAW" | "UPLOAD">(
    "DRAW",
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [signatureFileError, setSignatureFileError] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(
    null,
  );
  // existing signature can be either incident signature (edit mode) or logged-in user profile signature (default)
  const [existingSignatureUrl, setExistingSignatureUrl] = useState<
    string | null
  >(null);
  const [existingSignaturePreviewUrl, setExistingSignaturePreviewUrl] =
    useState<string | null>(null);
  const [isCanvasLoaded, setIsCanvasLoaded] = useState(false);
  const [isExistingSignatureCleared, setIsExistingSignatureCleared] =
    useState(false);
  const [shouldClearSignatureOnSave, setShouldClearSignatureOnSave] =
    useState(false);

  // Incident flow redesign: the Group Home + Program Manager dropdowns AND the
  // editable PM/Coordinator email inputs were dropped from the form. The
  // backend auto-derives group_home, assigned_program_manager,
  // program_manager_email, and coordinator_email from the resident's
  // onboarding record on POST/PATCH — the UI no longer surfaces them.

  // ----- New: status-aware footer / banner state -----
  const [transitionErrors, setTransitionErrors] = useState<string[]>([]);

  // PM Review/Follow-up state (fields backed by Incident.pm_* columns).
  const [pmReviewNotes, setPmReviewNotes] = useState<string>("");
  const [pmProgramType, setPmProgramType] = useState<string>("");
  const [pmServiceTransition, setPmServiceTransition] = useState<
    "" | "YES" | "NO"
  >("");
  const [pmServiceTransitionDescription, setPmServiceTransitionDescription] =
    useState<string>("");
  const [pmBehaviorPlanFollowed, setPmBehaviorPlanFollowed] = useState<
    "" | "YES" | "NO" | "N_A"
  >("");

  const { upload: uploadMedia } = useMediaUpload({
    contentTypeApp: "incidents",
    contentTypeModel: "incident",
  });

  // Resolve current user's role into one of the lifecycle role buckets.
  const incidentRole: IncidentRole = useMemo(() => {
    const u = (user as any) || (userFromStore as any) || {};
    const roleName: string = u?.role?.name ?? u?.role_name ?? "";
    const roleType: string = u?.role?.type ?? u?.role_type ?? "";
    if (
      roleType === "ADMIN" ||
      roleName === "Admin" ||
      roleName === "Program Director"
    ) {
      return "ADMIN";
    }
    if (roleName === "Program Manager" || roleName === "Program Coordinator") {
      return "PM";
    }
    if (roleName === "DSP") return "DSP";
    if (roleType === "GUARDIAN") return "GUARDIAN";
    if (roleType === "AGENT") return "AGENT";
    return "OTHER";
  }, [user, userFromStore]);

  // Current incident lifecycle status (read from server in edit mode).
  const incidentStatus: IncidentLifecycleStatus = useMemo(() => {
    const raw = (incidentData as any)?.status;
    if (
      raw === "DRAFT" ||
      raw === "IN_PROGRESS" ||
      raw === "PM_REVIEW_PENDING" ||
      raw === "COMPLETED" ||
      raw === "ACKNOWLEDGED"
    ) {
      return raw;
    }
    return "DRAFT";
  }, [incidentData]);

  const incidentReporterSignatureUrl = useMemo(() => {
    if (!isEditMode || !incidentData) return null;
    return (
      (((incidentData as any)?.signature_url as string | null) ?? null) ||
      (((incidentData as any)?.reporter_signature_url as string | null) ?? null)
    );
  }, [isEditMode, incidentData]);

  const reporterProfileSignatureUrl = useMemo(() => {
    if (incidentRole !== "DSP") return null;
    return (
      (((user as any)?.signature_url as string | null) ?? null) ||
      (((userFromStore as any)?.signature_url as string | null) ?? null)
    );
  }, [incidentRole, user, userFromStore]);

  const pmProfileSignatureUrl = useMemo(() => {
    if (incidentRole !== "PM") return null;
    return (
      (((user as any)?.signature_url as string | null) ?? null) ||
      (((userFromStore as any)?.signature_url as string | null) ?? null)
    );
  }, [incidentRole, user, userFromStore]);

  // Reset form when drawer opens or populate when editing
  useEffect(() => {
    if (!open) return;

    // If in edit mode, wait for data to load before populating
    if (isEditMode) {
      if (!incidentData) {
        // Data is still loading, don't reset form yet
        return;
      }

      // Pre-populate form with incident data
      const populateForm = () => {
        const medicalFlags = incidentData.medical_flags || [];
        const legalFlags = incidentData.legal_flags || [];
        const victimFlags = incidentData.victim_flags || [];
        const socialFlags = incidentData.social_flags || [];

        // Convert medical flags to form structure
        const medical = {
          hospitalizationMedical: medicalFlags.some(
            (f: any) => f.medical_type === "hospitalization_medical",
          ),
          hospitalizationPsychiatric: medicalFlags.some(
            (f: any) => f.medical_type === "hospitalization_psychiatric",
          ),
          injuryNoIntervention: medicalFlags.some(
            (f: any) => f.medical_type === "injury_no_intervention",
          ),
          injuryWithIntervention: medicalFlags.some(
            (f: any) => f.medical_type === "injury_with_intervention",
          ),
          illnessNoIntervention: medicalFlags.some(
            (f: any) => f.medical_type === "illness_no_intervention",
          ),
          illnessWithIntervention: medicalFlags.some(
            (f: any) => f.medical_type === "illness_with_intervention",
          ),
          seizure: medicalFlags.some((f: any) => f.medical_type === "seizure"),
          medicationRefusal: medicalFlags.some(
            (f: any) => f.medical_type === "medication_refusal",
          ),
          fall: medicalFlags.some((f: any) => f.medical_type === "fall"),
          other: medicalFlags.some((f: any) => f.medical_type === "other"),
        };

        // Convert legal flags
        const legal = {
          clientRightsViolation: legalFlags.some(
            (f: any) => f.legal_type === "client_rights_violation",
          ),
          missingEloped: legalFlags.some(
            (f: any) => f.legal_type === "missing_eloped",
          ),
          policeInvolvement: legalFlags.some(
            (f: any) => f.legal_type === "police_involvement",
          ),
        };

        // Convert victim flags
        const victimOf = {
          theft: victimFlags.some((f: any) => f.victim_type === "theft"),
          assault: victimFlags.some((f: any) => f.victim_type === "assault"),
          sexualAssault: victimFlags.some(
            (f: any) => f.victim_type === "sexual_assault",
          ),
          carAccident: victimFlags.some(
            (f: any) => f.victim_type === "car_accident",
          ),
          fireHazardArson: victimFlags.some(
            (f: any) => f.victim_type === "fire_hazard_arson",
          ),
        };

        // Convert social flags
        const social = {
          behaviorNoPlan: socialFlags.some(
            (f: any) => f.social_type === "behavior_no_plan",
          ),
          behaviorWithPlan: socialFlags.some(
            (f: any) => f.social_type === "behavior_with_plan",
          ),
          mentalHealthEpisode: socialFlags.some(
            (f: any) => f.social_type === "mental_health_episode",
          ),
          physicalRestraint: socialFlags.some(
            (f: any) => f.social_type === "physical_restraint",
          ),
          other: socialFlags.some((f: any) => f.social_type === "other"),
        };

        // Parse dates
        const dateAAReceivedIR = incidentData.received_date
          ? dayjs(incidentData.received_date)
          : null;

        const notifications = incidentData.notifications || [];

        const incidentDatetime = incidentData.incident_datetime
          ? dayjs(incidentData.incident_datetime)
          : null;

        const incidentTime = extractSavedIncidentTime(
          incidentData.incident_datetime,
        );

        const notifiedList = incidentData.notifications || [];

        const findNotifyDate = (role: string) => {
          const n = notifiedList.find((x: any) => x.type === role && x.notify);

          if (!n) return null;

          // Use notify_date + notify_time from backend if available
          if (n.notify_date && n.notify_time) {
            return dayjs(`${n.notify_date} ${n.notify_time}`);
          }
          if (n.notify_date) {
            return dayjs(n.notify_date);
          }
          // Fallback to updated_at
          return n.updated_at ? dayjs(n.updated_at) : null;
        };

        const findNotifyField = (role: string, field: 'method_of_contact' | 'by_whom'): string => {
          const n = notifiedList.find((x: any) => x.type === role && x.notify);
          return n?.[field] || "";
        };

        const formValues: AddIncidentFormValues = {
          residentName: String(incidentData.resident || ""),
          incidentName: (incidentData as any).incident_name || "",
          incidentLocation: incidentData.location || "",
          dateAAReceivedIR,
          region: incidentData.region || "",
          incidentDate: incidentDatetime,
          incidentTime: incidentTime,

          agencyName: incidentData.agency_name || "",
          medical,
          legal,
          victimOf,
          social,
          medicalOther:
            (incidentData as any).medical_flags?.find(
              (f: any) => f.medical_type === "other"
            )?.medical_other_details ?? "",
          socialOther:
            (incidentData as any).social_flags?.find(
              (f: any) => f.social_type === "other"
            )?.social_other_details ?? "",
          whatHappenedPrior: incidentData.pre_incident_notes || "",
          describeIncident: incidentData.incident_description || "",
          actionTaken: incidentData.response_action || "",
          whoNotified: {
            serviceCoordinator: !!findNotifyDate("SERVICE_COORDINATOR"),
            serviceCoordinatorAt: findNotifyDate("SERVICE_COORDINATOR"),
            serviceCoordinatorMethod: findNotifyField("SERVICE_COORDINATOR", "method_of_contact"),
            serviceCoordinatorByWhom: findNotifyField("SERVICE_COORDINATOR", "by_whom"),

            programManager: !!findNotifyDate("PROGRAM_MANAGER"),
            programManagerAt: findNotifyDate("PROGRAM_MANAGER"),
            programManagerMethod: findNotifyField("PROGRAM_MANAGER", "method_of_contact"),
            programManagerByWhom: findNotifyField("PROGRAM_MANAGER", "by_whom"),

            guardian: !!findNotifyDate("GUARDIAN"),
            guardianAt: findNotifyDate("GUARDIAN"),
            guardianMethod: findNotifyField("GUARDIAN", "method_of_contact"),
            guardianByWhom: findNotifyField("GUARDIAN", "by_whom"),

            additionalServiceProvider: !!findNotifyDate(
              "ADDITIONAL_SERVICE_PROVIDER",
            ),
            additionalServiceProviderAt: findNotifyDate(
              "ADDITIONAL_SERVICE_PROVIDER",
            ),
            additionalServiceProviderMethod: findNotifyField("ADDITIONAL_SERVICE_PROVIDER", "method_of_contact"),
            additionalServiceProviderByWhom: findNotifyField("ADDITIONAL_SERVICE_PROVIDER", "by_whom"),

            nursing: !!findNotifyDate("NURSING"),
            nursingAt: findNotifyDate("NURSING"),
            nursingMethod: findNotifyField("NURSING", "method_of_contact"),
            nursingByWhom: findNotifyField("NURSING", "by_whom"),
          },

          signature: null,
        };

        reset(formValues);

        setTransitionErrors([]);
        setHasPmSignatureDrawn(false);
        setPmUploadedFile(null);
        setPmSignatureFileError(null);
        setIsPmProfileSignatureCleared(false);
        setIsPmIncidentSignatureCleared(false);
        pmSignatureCanvasRef.current?.clearCanvas?.();

        // Hydrate PM Review/Follow-up state from incident.
        setPmReviewNotes(
          ((incidentData as any)?.pm_review_notes ?? "") as string,
        );
        setPmProgramType(
          ((incidentData as any)?.pm_program_type ?? "") as string,
        );
        setPmServiceTransition(
          (((incidentData as any)?.pm_service_transition ?? "") as any) as
            | ""
            | "YES"
            | "NO",
        );
        setPmServiceTransitionDescription(
          ((incidentData as any)?.pm_service_transition_description ?? "") as string,
        );
        setPmBehaviorPlanFollowed(
          (((incidentData as any)?.pm_behavior_plan_followed ?? "") as any) as
            | ""
            | "YES"
            | "NO"
            | "N_A",
        );
      };

      populateForm();
      // console.log("EDIT INCIDENT DATA:", incidentData);
      // console.log("NOTIFICATIONS FROM BACKEND:", incidentData.notifications);
    } else if (fixedResidentId) {
      // If not in edit mode but fixedResidentId is set, set resident only
      reset({
        ...initialValues,
        residentName: String(fixedResidentId),
      });
      setTransitionErrors([]);
      setHasPmSignatureDrawn(false);
      setPmUploadedFile(null);
      setPmSignatureFileError(null);
      setIsPmProfileSignatureCleared(false);
      setIsPmIncidentSignatureCleared(false);
      pmSignatureCanvasRef.current?.clearCanvas?.();
      setPmReviewNotes("");
      setPmProgramType("");
      setPmServiceTransition("");
      setPmServiceTransitionDescription("");
      setPmBehaviorPlanFollowed("");
    } else {
      // Default: reset to initial values
      reset(initialValues);
      setTransitionErrors([]);
      setHasPmSignatureDrawn(false);
      setPmUploadedFile(null);
      setPmSignatureFileError(null);
      setIsPmProfileSignatureCleared(false);
      setIsPmIncidentSignatureCleared(false);
      pmSignatureCanvasRef.current?.clearCanvas?.();
      setPmReviewNotes("");
      setPmProgramType("");
      setPmServiceTransition("");
      setPmServiceTransitionDescription("");
      setPmBehaviorPlanFollowed("");
    }

    // Default signature source:
    // - edit mode: use incident signature_url from API (when available).
    // - add/edit with no incident signature: DSP profile signature can be
    //   shown as the default and copied server-side on save.
    const incidentSignatureUrl = incidentReporterSignatureUrl;
    // Reporter signature is restricted to DSP users only. Skip profile
    // auto-fill for non-DSP roles so admin/PM/nurse profile signatures
    // don't get attached to incidents they create.
    const profileSignatureUrl =
      incidentRole === "DSP" && !incidentSignatureUrl
        ? reporterProfileSignatureUrl
        : null;

    const defaultExistingUrl = incidentSignatureUrl || profileSignatureUrl;
    setExistingSignatureUrl(defaultExistingUrl);
    setExistingSignaturePreviewUrl(defaultExistingUrl);
    setIsExistingSignatureCleared(false);
    setShouldClearSignatureOnSave(false);

    // Determine signature method from API alt_text (edit mode)
    const signatureAltText =
      isEditMode && incidentData
        ? (((incidentData as any)?.signature?.alt_text as string | null) ?? null)
        : null;
    const savedMethod: "DRAW" | "UPLOAD" =
      signatureAltText === "signature_upload" ? "UPLOAD" : "DRAW";

    setUploadedFile(null);
    setHasDrawnSignature(false);
    setSignatureMethod(defaultExistingUrl ? savedMethod : "DRAW");
    // For UPLOAD: show in upload section via signaturePreviewUrl
    // For DRAW: keep null, let existingSignaturePreviewUrl handle the draw preview
    setSignaturePreviewUrl(defaultExistingUrl && savedMethod === "UPLOAD" ? defaultExistingUrl : null);
    setIsCanvasLoaded(false);
    signatureCanvasRef.current?.clearCanvas?.();
    if (signatureFileInputRef.current) {
      signatureFileInputRef.current.value = "";
    }
    // Cleanup blob URLs
    if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, [
    open,
    fixedResidentId,
    reset,
    isEditMode,
    incidentData,
    incidentReporterSignatureUrl,
    reporterProfileSignatureUrl,
    incidentRole,
    initialValues,
  ]);

  // Signature handlers
  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as "DRAW" | "UPLOAD";
    setSignatureFileError(null);
    setSignatureMethod(value);
    if (value === "DRAW") {
      setUploadedFile(null);
      setSignaturePreviewUrl(null);
      setExistingSignaturePreviewUrl(null);
      setIsExistingSignatureCleared(true);
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = "";
      }
    } else if (value === "UPLOAD") {
      signatureCanvasRef.current?.clearCanvas();
      setHasDrawnSignature(false);
      setSignaturePreviewUrl(null);
    }
  };

  const handleClearExistingSignature = () => {
    setIsExistingSignatureCleared(true);
    setShouldClearSignatureOnSave(true);
    setExistingSignaturePreviewUrl(null);
    setSignaturePreviewUrl(null);
    setHasDrawnSignature(false);
    // Revoke blob URL if exists
    if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const handleClearSignature = () => {
    setSignatureFileError(null);
    if (signatureMethod === "DRAW") {
      signatureCanvasRef.current?.clearCanvas();
      setHasDrawnSignature(false);
      setSignaturePreviewUrl(null);
      setShouldClearSignatureOnSave(true);
    } else if (signatureMethod === "UPLOAD") {
      setUploadedFile(null);
      setSignaturePreviewUrl(null);
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = "";
      }
      setShouldClearSignatureOnSave(true);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setSignatureFileError("Unsupported file format. Please upload a JPG, JPEG, or PNG image.");
        if (event.target) event.target.value = "";
        return;
      }
      setSignatureFileError(null);
      setUploadedFile(file);
      setShouldClearSignatureOnSave(false);
      const objectUrl = URL.createObjectURL(file);
      setSignaturePreviewUrl(objectUrl);
      if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = objectUrl;
    }
  };

  // Handle signature from canvas - update preview when signature changes
  useEffect(() => {
    if (
      hasDrawnSignature &&
      signatureMethod === "DRAW" &&
      signatureCanvasRef.current
    ) {
      const signatureDataValue = signatureCanvasRef.current.getSignatureData();
      if (signatureDataValue) {
        setSignaturePreviewUrl(signatureDataValue);
      }
    } else if (!hasDrawnSignature && signatureMethod === "DRAW") {
      setSignaturePreviewUrl(null);
    }
  }, [hasDrawnSignature, signatureMethod]);

  const uploadSignatureToMedia = async (file: File, method: "DRAW" | "UPLOAD" = "DRAW"): Promise<string> => {
    const altText = method === "UPLOAD" ? "signature_upload" : "signature_draw";
    const result = await uploadMedia(file, { altText });
    return result.id;
  };

  // Just-in-time PM signature provider. Called by the IncidentFooter
  // immediately before invoking pmSignoffIncident. Returns the uploaded
  // media id either from the draw canvas OR the uploaded file, depending
  // on which method the PM picked.
  const uploadPmDrawAndGetMediaId = async (): Promise<string | null> => {
    const existingPmSignatureId =
      (incidentData as any)?.pm_signature?.id ||
      (incidentData as any)?.pm_signature?.uuid ||
      (incidentData as any)?.pm_signature_media_id;
    if (existingPmSignatureId && !isPmIncidentSignatureCleared) {
      return String(existingPmSignatureId);
    }
    if (pmSignatureMethod === "UPLOAD") {
      if (!pmUploadedFile) return null;
      return await uploadSignatureToMedia(pmUploadedFile, "UPLOAD");
    }
    const dataUrl = pmSignatureCanvasRef.current?.getSignatureData?.();
    if (!dataUrl) return null;
    const file = dataUrlToFile(dataUrl, "pm-signature.png");
    return await uploadSignatureToMedia(file, "DRAW");
  };

  const handlePmFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setPmSignatureFileError("Please upload a PNG or JPEG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPmSignatureFileError("File must be 5MB or smaller.");
      return;
    }
    setPmSignatureFileError(null);
    setPmUploadedFile(file);
  };

  // Preview URL for a freshly selected PM signature file
  const pmUploadPreviewUrl = useMemo(
    () => (pmUploadedFile ? URL.createObjectURL(pmUploadedFile) : null),
    [pmUploadedFile]
  );
  useEffect(() => {
    return () => {
      if (pmUploadPreviewUrl) URL.revokeObjectURL(pmUploadPreviewUrl);
    };
  }, [pmUploadPreviewUrl]);

  const handlePmClear = () => {
    if (pmSignatureMethod === "DRAW") {
      pmSignatureCanvasRef.current?.clearCanvas?.();
      setHasPmSignatureDrawn(false);
    } else {
      setPmUploadedFile(null);
      if (pmSignatureFileInputRef.current) {
        pmSignatureFileInputRef.current.value = "";
      }
    }
    setPmSignatureFileError(null);
  };

  const handleClearPmProfileSignature = () => {
    setIsPmProfileSignatureCleared(true);
    setIsPmIncidentSignatureCleared(true);
    setPmSignatureMethod("DRAW");
    setPmUploadedFile(null);
    setHasPmSignatureDrawn(false);
    setPmSignatureFileError(null);
    pmSignatureCanvasRef.current?.clearCanvas?.();
    if (pmSignatureFileInputRef.current) {
      pmSignatureFileInputRef.current.value = "";
    }
  };

  // Helper: Format date to YYYY-MM-DD
  const formatDate = (dayjs: Dayjs | null): string | null => {
    return dayjs ? dayjs.format("YYYY-MM-DD") : null;
  };

  // Helper: Format datetime to ISO string
  const formatDateTime = (date: Dayjs | null, time: string): string | null => {
    if (!date) return null;
    const dateStr = date.format("YYYY-MM-DD");
    return time ? `${dateStr}T${time}:00` : `${dateStr}T00:00:00`;
  };

  // Form submit handler
  const onSubmit = async (data: AddIncidentFormValues) => {
    if (isSaving || createIncidentMutation.isPending || updateIncidentMutation.isPending) return;
    setIsSaving(true);

    try {
      // 🔐 reported_by must be uuid from auth

      // ✅ residentName field now contains resident UUID
      const residentId =
        isEditMode && incidentData
          ? incidentData.resident
          : data.residentName || null;

      if (!residentId) {
        setIsSaving(false);
        setSnackbar({
          isOpen: true,
          message: "Please select a resident",
          status: "error",
        });
        return;
      }

      // Signature -> media (incident-scoped). Priority:
      // 1) User drew/uploaded a new signature -> upload, send signature_media_id
      // 2) User cleared the existing signature -> send signature_media_id: null
      // 3) User kept an existing signature:
      //    - edit mode: omit signature fields entirely (backend leaves the
      //      already-linked incident signature untouched).
      //    - create mode (reusing the logged-in user's profile signature):
      //      send duplicate_signature_from_profile=true so the backend does
      //      an s3.copy_object server-side. This avoids the browser fetching
      //      the presigned URL, which fails with a CORS-masked 403 once the
      //      ~1h URL expires.
      // 4) No signature at all -> send signature_media_id: null
      let signatureMediaId: string | null | undefined = undefined;
      let duplicateSignatureFromProfile = false;
      let omitSignatureField = false;

      const needsUploadNew =
        (signatureMethod === "UPLOAD" && !!uploadedFile) ||
        (signatureMethod === "DRAW" &&
          !!signatureCanvasRef.current?.getSignatureData?.() &&
          hasDrawnSignature);

      if (needsUploadNew) {
        let file: File | null = null;
        if (signatureMethod === "UPLOAD" && uploadedFile) {
          file = uploadedFile;
        } else if (signatureMethod === "DRAW") {
          const dataUrl = signatureCanvasRef.current?.getSignatureData?.();
          if (dataUrl) {
            file = dataUrlToFile(dataUrl, "signature.png");
          }
        }
        if (file) {
          signatureMediaId = await uploadSignatureToMedia(file, signatureMethod);
        }
      } else if (shouldClearSignatureOnSave || isExistingSignatureCleared) {
        signatureMediaId = null;
      } else if (existingSignatureUrl && existingSignaturePreviewUrl) {
        const usingProfileSignatureDefault =
          !!reporterProfileSignatureUrl &&
          existingSignatureUrl === reporterProfileSignatureUrl &&
          !incidentReporterSignatureUrl;
        if (isEditMode && !usingProfileSignatureDefault) {
          // Existing incident signature is already linked server-side. Omit
          // the field so the backend keeps it as-is — no S3 round trip needed.
          omitSignatureField = true;
        } else {
          // Reuse the logged-in DSP's profile signature via server-side copy.
          duplicateSignatureFromProfile = true;
        }
      } else {
        signatureMediaId = null;
      }

      // Diagnostic log: confirms the new signature flow is in effect after deploy.
      // If you still see "branch=fetchUrlAsFile" or no log at all, the bundle
      // running in the browser is the OLD build.
      console.log("[sig-duplicate] incident submit signature decision", {
        isEditMode,
        signatureMethod,
        needsUploadNew,
        hasUploadedFile: !!uploadedFile,
        hasDrawnSignature,
        hasExistingSignatureUrl: !!existingSignatureUrl,
        isExistingSignatureCleared,
        shouldClearSignatureOnSave,
        decision: needsUploadNew
          ? "upload_new"
          : shouldClearSignatureOnSave || isExistingSignatureCleared
            ? "clear"
            : omitSignatureField
              ? "omit_keep_existing_edit"
              : duplicateSignatureFromProfile
                ? "duplicate_from_profile"
                : "no_signature",
        signatureMediaIdToSend: signatureMediaId,
        omitSignatureField,
        duplicateSignatureFromProfile,
      });

      // Build medical flags array (include medical_other_details when type is "other")
      const medicalFlags: Array<{
        medical_type: string;
        medical_other_details?: string;
      }> = [];
      if (data.medical.hospitalizationMedical)
        medicalFlags.push({ medical_type: "hospitalization_medical" });
      if (data.medical.hospitalizationPsychiatric)
        medicalFlags.push({ medical_type: "hospitalization_psychiatric" });
      if (data.medical.injuryNoIntervention)
        medicalFlags.push({ medical_type: "injury_no_intervention" });
      if (data.medical.injuryWithIntervention)
        medicalFlags.push({ medical_type: "injury_with_intervention" });
      if (data.medical.illnessNoIntervention)
        medicalFlags.push({ medical_type: "illness_no_intervention" });
      if (data.medical.illnessWithIntervention)
        medicalFlags.push({ medical_type: "illness_with_intervention" });
      if (data.medical.seizure) medicalFlags.push({ medical_type: "seizure" });
      if (data.medical.medicationRefusal)
        medicalFlags.push({ medical_type: "medication_refusal" });
      if (data.medical.fall) medicalFlags.push({ medical_type: "fall" });
      if (data.medical.other)
        medicalFlags.push({
          medical_type: "other",
          medical_other_details: data.medicalOther
            ? String(data.medicalOther).trim()
            : "",
        });

      // Build legal flags array
      const legalFlags: Array<{ legal_type: string }> = [];
      if (data.legal.clientRightsViolation)
        legalFlags.push({ legal_type: "client_rights_violation" });
      if (data.legal.missingEloped)
        legalFlags.push({ legal_type: "missing_eloped" });
      if (data.legal.policeInvolvement)
        legalFlags.push({ legal_type: "police_involvement" });

      // Build victim flags array
      const victimFlags: Array<{ victim_type: string }> = [];
      if (data.victimOf.theft) victimFlags.push({ victim_type: "theft" });
      if (data.victimOf.assault) victimFlags.push({ victim_type: "assault" });
      if (data.victimOf.sexualAssault)
        victimFlags.push({ victim_type: "sexual_assault" });
      if (data.victimOf.carAccident)
        victimFlags.push({ victim_type: "car_accident" });
      if (data.victimOf.fireHazardArson)
        victimFlags.push({ victim_type: "fire_hazard_arson" });

      // Build social flags array (include social_other_details when type is "other")
      const socialFlags: Array<{
        social_type: string;
        social_other_details?: string;
      }> = [];
      if (data.social.behaviorNoPlan)
        socialFlags.push({ social_type: "behavior_no_plan" });
      if (data.social.behaviorWithPlan)
        socialFlags.push({ social_type: "behavior_with_plan" });
      if (data.social.mentalHealthEpisode)
        socialFlags.push({ social_type: "mental_health_episode" });
      if (data.social.physicalRestraint)
        socialFlags.push({ social_type: "physical_restraint" });
      if (data.social.other)
        socialFlags.push({
          social_type: "other",
          social_other_details: data.socialOther
            ? String(data.socialOther).trim()
            : "",
        });

      // =======================
      // Build notifications array with notify_date & notify_time
      // =======================
      const notifications: Array<{
        type: string;
        notify: boolean;
        notify_date: string | null;
        notify_time: string | null;
        method_of_contact: string | null;
        by_whom: string | null;
      }> = [];

      const addNotification = (
        isChecked: boolean,
        type: string,
        atValue: Dayjs | null,
        methodOfContact?: string,
        byWhom?: string,
      ) => {
        if (!isChecked) return;
        notifications.push({
          type,
          notify: true,
          notify_date: atValue && atValue.isValid() ? atValue.format("YYYY-MM-DD") : null,
          notify_time: atValue && atValue.isValid() ? atValue.format("HH:mm:ss") : null,
          method_of_contact: methodOfContact || null,
          by_whom: byWhom || null,
        });
      };

      addNotification(data.whoNotified.guardian, "GUARDIAN", data.whoNotified.guardianAt, data.whoNotified.guardianMethod, data.whoNotified.guardianByWhom);
      addNotification(data.whoNotified.serviceCoordinator, "SERVICE_COORDINATOR", data.whoNotified.serviceCoordinatorAt, data.whoNotified.serviceCoordinatorMethod, data.whoNotified.serviceCoordinatorByWhom);
      addNotification(data.whoNotified.programManager, "PROGRAM_MANAGER", data.whoNotified.programManagerAt, data.whoNotified.programManagerMethod, data.whoNotified.programManagerByWhom);
      addNotification(data.whoNotified.additionalServiceProvider, "ADDITIONAL_SERVICE_PROVIDER", data.whoNotified.additionalServiceProviderAt, data.whoNotified.additionalServiceProviderMethod, data.whoNotified.additionalServiceProviderByWhom);
      addNotification(data.whoNotified.nursing, "NURSING", data.whoNotified.nursingAt, data.whoNotified.nursingMethod, data.whoNotified.nursingByWhom);

      // Convert dates to required formats
      const receivedDate = formatDate(data.dateAAReceivedIR);
      const incidentDatetime = formatDateTime(
        data.incidentDate,
        data.incidentTime,
      );

      const payload: CreateIncidentPayload & { notifications?: any[] } & {
        signature_media_id?: string | null;
        pm_signature_media_id?: string | null;
        duplicate_signature_from_profile?: boolean;
        status?: boolean;
        pm_review_notes?: string | null;
        pm_program_type?: string | null;
        pm_service_transition?: string | null;
        pm_service_transition_description?: string | null;
        pm_behavior_plan_followed?: string | null;
      } = {
        resident: residentId,
        incident_name: (data.incidentName ?? "").trim() || null,
        // backend sets reported_by from request.user, but SDK type requires it
        reported_by: ((user as any)?.id ?? null) as any,

        location: data.incidentLocation || null,
        region: data.region || null,
        received_date: receivedDate,
        incident_datetime: incidentDatetime,
        agency_name: data.agencyName || null,
        pre_incident_notes: data.whatHappenedPrior || null,
        incident_description: data.describeIncident || null,
        response_action: data.actionTaken || null,
        send_notification: false,
        // status is server-managed — backend always creates with DRAFT.
        medical_flags: medicalFlags.length > 0 ? medicalFlags : undefined,
        legal_flags: legalFlags.length > 0 ? legalFlags : undefined,
        social_flags: socialFlags.length > 0 ? socialFlags : undefined,
        victim_flags: victimFlags.length > 0 ? victimFlags : undefined,
        notifications,
        // group_home, assigned PM, PM email, and coordinator email are now
        // all derived server-side from the resident's onboarding record.
        pm_review_notes: pmReviewNotes || null,
        pm_program_type: pmProgramType || null,
        pm_service_transition: pmServiceTransition || null,
        pm_service_transition_description:
          pmServiceTransition === "YES"
            ? pmServiceTransitionDescription || null
            : null,
        pm_behavior_plan_followed: pmBehaviorPlanFollowed || null,
      };

      // Signature handling — see resolution block above for the priority order.
      if (!omitSignatureField) {
        payload.signature_media_id = signatureMediaId ?? null;
      }
      if (duplicateSignatureFromProfile) {
        payload.duplicate_signature_from_profile = true;
      }

      if (isEditMode && incidentUuid) {
        // Update existing incident
        updateIncidentMutation.mutate(
          {
            path: { uuid: incidentUuid },
            body: payload,
          } as any,
          {
            onSuccess: (response: any) => {
              const backendMessage =
                response?.message ??
                response?.data?.message ??
                response?.detail ??
                response?.data?.detail ??
                "Something went wrong";

              if (onSuccess) {
                onSuccess(backendMessage);
              }

              onClose();
              reset(initialValues);
              setUploadedFile(null);
              setHasDrawnSignature(false);
              setSignatureMethod("DRAW");
              setSignaturePreviewUrl(null);
              setExistingSignatureUrl(null);
              setExistingSignaturePreviewUrl(null);
              setIsCanvasLoaded(false);
              setIsExistingSignatureCleared(false);
              setShouldClearSignatureOnSave(false);
              signatureCanvasRef.current?.clearCanvas?.();
              if (signatureFileInputRef.current) {
                signatureFileInputRef.current.value = "";
              }
              if (
                blobUrlRef.current &&
                blobUrlRef.current.startsWith("blob:")
              ) {
                URL.revokeObjectURL(blobUrlRef.current);
                blobUrlRef.current = null;
              }
            },

            onError: (error: unknown) => {
              const backendMessage = getBackendMessage(error);

              if (onError) {
                onError(backendMessage || "Something went wrong");
              } else {
                setSnackbar({
                  isOpen: true,
                  message: backendMessage || "Something went wrong",
                  status: "error",
                });
              }
            },
            onSettled: () => {
              setIsSaving(false);
            },
          },
        );
      } else {
        // Create new incident
        createIncidentMutation.mutate({ body: payload } as any, {
          onSuccess: (response: any) => {
            const backendMessage =
              response?.message ??
              response?.data?.message ??
              response?.detail ??
              response?.data?.detail ??
              "Something went wrong";

            if (onSuccess) {
              onSuccess(backendMessage);
            }

            onClose();
            reset(initialValues);
            setUploadedFile(null);
            setHasDrawnSignature(false);
            setSignatureMethod("DRAW");
            setSignaturePreviewUrl(null);
            setExistingSignatureUrl(null);
            setExistingSignaturePreviewUrl(null);
            setIsCanvasLoaded(false);
            setIsExistingSignatureCleared(false);
            setShouldClearSignatureOnSave(false);
            signatureCanvasRef.current?.clearCanvas?.();
            if (signatureFileInputRef.current) {
              signatureFileInputRef.current.value = "";
            }
            if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
              URL.revokeObjectURL(blobUrlRef.current);
              blobUrlRef.current = null;
            }
          },

          onError: (error: unknown) => {
            const backendMessage = getBackendMessage(error);

            if (onError) {
              onError(backendMessage || "Something went wrong");
            } else {
              setSnackbar({
                isOpen: true,
                message: backendMessage || "Something went wrong",
                status: "error",
              });
            }
          },
          onSettled: () => {
            setIsSaving(false);
          },
        });
      }
    } catch (err) {
      setIsSaving(false);
      const backendMessage = getBackendMessage(err);
      if (onError) {
        onError(backendMessage || "Something went wrong");
      } else {
        setSnackbar({
          isOpen: true,
          message: backendMessage || "Something went wrong",
          status: "error",
        });
      }
    }
  };

  /**
   * Promise wrapper around the RHF submit pipeline so the status-aware
   * footer can `await onSave()` before triggering a lifecycle transition.
   * Resolves on a successful save and rejects (with the backend error)
   * otherwise, so IncidentFooter's `compound()` can surface 422s in the
   * validation summary banner.
   */
  // NOTE: deliberately NOT useCallback — the closure must capture the latest
  // `onSubmitAsync` (which itself closes over `incidentUuid` from props).
  // Memoising froze the first-render values and made edit-mode saves fall
  // through to create when the user clicked Sign & Start before the form
  // re-rendered with a stable uuid.
  const saveIncidentForFooter = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const wrappedSubmit = handleSubmit(
        async (data) => {
          try {
            await onSubmitAsync(data, { resolve, reject });
          } catch (e) {
            reject(e);
          }
        },
        (errors) => {
          scrollToFirstInvalidField(errors);
          reject(
            new Error("Please fix the highlighted fields before continuing."),
          );
        },
      );
      void wrappedSubmit();
    });
  };

  /**
   * Async variant of the existing `onSubmit` that resolves/rejects via
   * deferred callbacks supplied by `saveIncidentForFooter`. Mirrors the
   * payload-building logic of `onSubmit` exactly — only the resolution path
   * changes.
   */
  type SaveDeferred = {
    resolve: () => void;
    reject: (e: unknown) => void;
  };
  const onSubmitAsync = async (
    data: AddIncidentFormValues,
    deferred?: SaveDeferred,
  ) => {
    if (
      isSaving ||
      createIncidentMutation.isPending ||
      updateIncidentMutation.isPending
    ) {
      deferred?.reject(new Error("A save is already in progress."));
      return;
    }
    setIsSaving(true);
    try {
      const residentId =
        isEditMode && incidentData
          ? incidentData.resident
          : data.residentName || null;

      if (!residentId) {
        setIsSaving(false);
        const msg = "Please select a resident";
        setSnackbar({ isOpen: true, message: msg, status: "error" });
        deferred?.reject(new Error(msg));
        return;
      }

      // Signature decision — copied from onSubmit() to keep both paths in sync.
      let signatureMediaId: string | null | undefined = undefined;
      let duplicateSignatureFromProfile = false;
      let omitSignatureField = false;

      const needsUploadNew =
        (signatureMethod === "UPLOAD" && !!uploadedFile) ||
        (signatureMethod === "DRAW" &&
          !!signatureCanvasRef.current?.getSignatureData?.() &&
          hasDrawnSignature);

      if (needsUploadNew) {
        let file: File | null = null;
        if (signatureMethod === "UPLOAD" && uploadedFile) file = uploadedFile;
        else if (signatureMethod === "DRAW") {
          const dataUrl = signatureCanvasRef.current?.getSignatureData?.();
          if (dataUrl) file = dataUrlToFile(dataUrl, "signature.png");
        }
        if (file)
          signatureMediaId = await uploadSignatureToMedia(file, signatureMethod);
      } else if (shouldClearSignatureOnSave || isExistingSignatureCleared) {
        signatureMediaId = null;
      } else if (existingSignatureUrl && existingSignaturePreviewUrl) {
        const usingProfileSignatureDefault =
          !!reporterProfileSignatureUrl &&
          existingSignatureUrl === reporterProfileSignatureUrl &&
          !incidentReporterSignatureUrl;
        if (isEditMode && !usingProfileSignatureDefault) {
          omitSignatureField = true;
        } else {
          duplicateSignatureFromProfile = true;
        }
      } else {
        signatureMediaId = null;
      }

      // Flag arrays
      const medicalFlags: Array<{
        medical_type: string;
        medical_other_details?: string;
      }> = [];
      if (data.medical.hospitalizationMedical)
        medicalFlags.push({ medical_type: "hospitalization_medical" });
      if (data.medical.hospitalizationPsychiatric)
        medicalFlags.push({ medical_type: "hospitalization_psychiatric" });
      if (data.medical.injuryNoIntervention)
        medicalFlags.push({ medical_type: "injury_no_intervention" });
      if (data.medical.injuryWithIntervention)
        medicalFlags.push({ medical_type: "injury_with_intervention" });
      if (data.medical.illnessNoIntervention)
        medicalFlags.push({ medical_type: "illness_no_intervention" });
      if (data.medical.illnessWithIntervention)
        medicalFlags.push({ medical_type: "illness_with_intervention" });
      if (data.medical.seizure) medicalFlags.push({ medical_type: "seizure" });
      if (data.medical.medicationRefusal)
        medicalFlags.push({ medical_type: "medication_refusal" });
      if (data.medical.fall) medicalFlags.push({ medical_type: "fall" });
      if (data.medical.other)
        medicalFlags.push({
          medical_type: "other",
          medical_other_details: data.medicalOther
            ? String(data.medicalOther).trim()
            : "",
        });

      const legalFlags: Array<{ legal_type: string }> = [];
      if (data.legal.clientRightsViolation)
        legalFlags.push({ legal_type: "client_rights_violation" });
      if (data.legal.missingEloped)
        legalFlags.push({ legal_type: "missing_eloped" });
      if (data.legal.policeInvolvement)
        legalFlags.push({ legal_type: "police_involvement" });

      const victimFlags: Array<{ victim_type: string }> = [];
      if (data.victimOf.theft) victimFlags.push({ victim_type: "theft" });
      if (data.victimOf.assault) victimFlags.push({ victim_type: "assault" });
      if (data.victimOf.sexualAssault)
        victimFlags.push({ victim_type: "sexual_assault" });
      if (data.victimOf.carAccident)
        victimFlags.push({ victim_type: "car_accident" });
      if (data.victimOf.fireHazardArson)
        victimFlags.push({ victim_type: "fire_hazard_arson" });

      const socialFlags: Array<{
        social_type: string;
        social_other_details?: string;
      }> = [];
      if (data.social.behaviorNoPlan)
        socialFlags.push({ social_type: "behavior_no_plan" });
      if (data.social.behaviorWithPlan)
        socialFlags.push({ social_type: "behavior_with_plan" });
      if (data.social.mentalHealthEpisode)
        socialFlags.push({ social_type: "mental_health_episode" });
      if (data.social.physicalRestraint)
        socialFlags.push({ social_type: "physical_restraint" });
      if (data.social.other)
        socialFlags.push({
          social_type: "other",
          social_other_details: data.socialOther
            ? String(data.socialOther).trim()
            : "",
        });

      const notifications: Array<{
        type: string;
        notify: boolean;
        notify_date: string | null;
        notify_time: string | null;
        method_of_contact: string | null;
        by_whom: string | null;
      }> = [];
      const addNotification = (
        isChecked: boolean,
        type: string,
        atValue: Dayjs | null,
        methodOfContact?: string,
        byWhom?: string,
      ) => {
        if (!isChecked) return;
        notifications.push({
          type,
          notify: true,
          notify_date:
            atValue && atValue.isValid() ? atValue.format("YYYY-MM-DD") : null,
          notify_time:
            atValue && atValue.isValid() ? atValue.format("HH:mm:ss") : null,
          method_of_contact: methodOfContact || null,
          by_whom: byWhom || null,
        });
      };
      addNotification(
        data.whoNotified.guardian,
        "GUARDIAN",
        data.whoNotified.guardianAt,
        data.whoNotified.guardianMethod,
        data.whoNotified.guardianByWhom,
      );
      addNotification(
        data.whoNotified.serviceCoordinator,
        "SERVICE_COORDINATOR",
        data.whoNotified.serviceCoordinatorAt,
        data.whoNotified.serviceCoordinatorMethod,
        data.whoNotified.serviceCoordinatorByWhom,
      );
      addNotification(
        data.whoNotified.programManager,
        "PROGRAM_MANAGER",
        data.whoNotified.programManagerAt,
        data.whoNotified.programManagerMethod,
        data.whoNotified.programManagerByWhom,
      );
      addNotification(
        data.whoNotified.additionalServiceProvider,
        "ADDITIONAL_SERVICE_PROVIDER",
        data.whoNotified.additionalServiceProviderAt,
        data.whoNotified.additionalServiceProviderMethod,
        data.whoNotified.additionalServiceProviderByWhom,
      );
      addNotification(
        data.whoNotified.nursing,
        "NURSING",
        data.whoNotified.nursingAt,
        data.whoNotified.nursingMethod,
        data.whoNotified.nursingByWhom,
      );

      const receivedDate = formatDate(data.dateAAReceivedIR);
      const incidentDatetime = formatDateTime(
        data.incidentDate,
        data.incidentTime,
      );

      const payload: CreateIncidentPayload & { notifications?: any[] } & {
        signature_media_id?: string | null;
        duplicate_signature_from_profile?: boolean;
        status?: boolean;
        pm_review_notes?: string | null;
        pm_program_type?: string | null;
        pm_service_transition?: string | null;
        pm_service_transition_description?: string | null;
        pm_behavior_plan_followed?: string | null;
      } = {
        resident: residentId,
        incident_name: (data.incidentName ?? "").trim() || null,
        reported_by: ((user as any)?.id ?? null) as any,
        location: data.incidentLocation || null,
        region: data.region || null,
        received_date: receivedDate,
        incident_datetime: incidentDatetime,
        agency_name: data.agencyName || null,
        pre_incident_notes: data.whatHappenedPrior || null,
        incident_description: data.describeIncident || null,
        response_action: data.actionTaken || null,
        send_notification: false,
        // status is server-managed — backend always creates with DRAFT.
        medical_flags: medicalFlags.length > 0 ? medicalFlags : undefined,
        legal_flags: legalFlags.length > 0 ? legalFlags : undefined,
        social_flags: socialFlags.length > 0 ? socialFlags : undefined,
        victim_flags: victimFlags.length > 0 ? victimFlags : undefined,
        notifications,
        // group_home, assigned PM, and snapshot emails are all derived
        // server-side from the resident's onboarding record.
        pm_review_notes: pmReviewNotes || null,
        pm_program_type: pmProgramType || null,
        pm_service_transition: pmServiceTransition || null,
        pm_service_transition_description:
          pmServiceTransition === "YES"
            ? pmServiceTransitionDescription || null
            : null,
        pm_behavior_plan_followed: pmBehaviorPlanFollowed || null,
      };

      if (!omitSignatureField) {
        payload.signature_media_id = signatureMediaId ?? null;
      }
      if (duplicateSignatureFromProfile) {
        payload.duplicate_signature_from_profile = true;
      }
      if (
        isEditMode &&
        incidentRole === "PM" &&
        (incidentStatus === "COMPLETED" || incidentStatus === "PM_REVIEW_PENDING")
      ) {
        const pmSignatureMediaId = await uploadPmDrawAndGetMediaId();
        if (pmSignatureMediaId) {
          payload.pm_signature_media_id = pmSignatureMediaId;
        }
      }

      await new Promise<void>((resolve, reject) => {
        const opts = {
          onSuccess: () => {
            setIsSaving(false);
            resolve();
          },
          onError: (err: unknown) => {
            setIsSaving(false);
            reject(err);
          },
        };
        if (isEditMode && incidentUuid) {
          updateIncidentMutation.mutate(
            { path: { uuid: incidentUuid }, body: payload } as any,
            opts,
          );
        } else {
          createIncidentMutation.mutate({ body: payload } as any, opts);
        }
      });

      deferred?.resolve();
    } catch (err) {
      setIsSaving(false);
      deferred?.reject(err);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleClose = () => {
    reset();
    setSignatureMethod("DRAW");
    setUploadedFile(null);
    setHasDrawnSignature(false);
    setIsCanvasLoaded(false);
    setShouldClearSignatureOnSave(false);
    // Cleanup signature preview URL
    if (signaturePreviewUrl && signaturePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(signaturePreviewUrl);
    }
    if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setSignaturePreviewUrl(null);
    setExistingSignaturePreviewUrl(null);
    setIsExistingSignatureCleared(false);
    signatureCanvasRef.current?.clearCanvas();
    if (signatureFileInputRef.current) {
      signatureFileInputRef.current.value = "";
    }
    onClose();
  };

  useEffect(() => {
    if (!open || !focusSignatureOnOpen) return;
    if (isEditMode && (isLoadingIncident || !incidentData)) return;

    const timer = window.setTimeout(() => {
      const signatureSection = document.querySelector<HTMLElement>(
        '[data-field="signature"]',
      );
      signatureSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [open, focusSignatureOnOpen, isEditMode, isLoadingIncident, incidentData]);


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      sx={{
        zIndex: theme.zIndex.drawer + 2, // Higher than navbar (drawer + 1)
        "& .MuiDrawer-paper": {
          width: isMobile ? "100%" : "840px",
          height: "100%",
          zIndex: theme.zIndex.drawer + 2,
        },
      }}
    >
      {/* Fixed Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          borderBottom: "1px solid #E7E9EB",
          position: "sticky",
          top: 0,
          backgroundColor: "#FFFFFF",
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#30353A",
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
          }}
        >
          {focusSignatureOnOpen && isEditMode
            ? "Review & Sign Incident"
            : isEditMode
              ? "Edit Incident"
              : "Add New Incident"}
        </Typography>
        <IconButton
          onClick={handleClose}
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
      </Box>

      {/* Scrollable Body */}
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit, scrollToFirstInvalidField)}
        sx={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          // paddingBottom: "100px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {isEditMode && isLoadingIncident && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {isEditMode && !isLoadingIncident && !incidentData && (
          <Box sx={{ padding: "24px" }}>
            <Typography sx={{ color: "#C62828" }}>
              Error loading incident. Please try again.
            </Typography>
          </Box>
        )}

        {(!isEditMode ||
          (isEditMode && !isLoadingIncident && incidentData)) && (
            <Box>
              {/* Validation summary banner — surfaces 422 transition errors. */}
              {transitionErrors.length > 0 && (
                <Alert
                  severity="error"
                  onClose={() => setTransitionErrors([])}
                  sx={{ mb: 2 }}
                >
                  <AlertTitle>Cannot proceed</AlertTitle>
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {transitionErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </Box>
                </Alert>
              )}

              {/* Reminder Banner */}
              <Box
                sx={{
                  backgroundColor: "#F2F7FA",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#30353A",
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  Reminder : All incidents must be reported within 24 hours, and
                  incident report submitted within 48 hours
                </Typography>
              </Box>

              {/* Form Fields */}
              <Grid container spacing={2}>
                {/* Row 1 - Individual Name */}
                <Grid size={{ xs: 12, sm: 6 }} data-field="residentName">
                  <CustomLabel label="Individual Name" isRequired />
                  <Controller
                    name="residentName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomAutoComplete
                        placeholder="Select Resident Name"
                        value={field.value || ""}
                        options={residentOptions}
                        onChange={(selectedKey) => {
                          field.onChange(selectedKey);
                        }}
                        loading={isLoadingResidents}
                        isDisabled={!!fixedResidentId}
                        bgWhite
                        hasStartSearchIcon
                        maxHeightForOptionsList={320}
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Row 1 - Incident Name */}
                <Grid size={{ xs: 12, sm: 6 }} data-field="incidentName">
                  <CustomLabel label="Incident Name" isRequired />
                  <Controller
                    name="incidentName"
                    control={control}
                    render={({ field, fieldState }) => {
                      const inlineError =
                        fieldState.error?.message ||
                        ((field.value?.length ?? 0) >= 40
                          ? "Incident Name must be 40 characters or less"
                          : undefined);
                      return (
                        <CustomInput
                          name="incidentName"
                          placeholder="Enter Incident Name"
                          value={field.value}
                          onChange={field.onChange}
                          maxLength={40}
                          bgWhite
                          hasError={!!inlineError}
                          errorMessage={inlineError}
                        />
                      );
                    }}
                  />
                </Grid>

                {/* Row 2 - Incident Location */}
                <Grid size={{ xs: 12, sm: 6 }} data-field="incidentLocation">
                  <CustomLabel label="Incident Location" />
                  <Controller
                    name="incidentLocation"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        name="incidentLocation"
                        placeholder="Enter Incident Location"
                        value={field.value}
                        onChange={field.onChange}
                        bgWhite
                      />
                    )}
                  />
                </Grid>

                {/* Row 2 - Date AA Received IR */}
                <Grid size={{ xs: 12, sm: 6 }} data-field="dateAAReceivedIR">
                  <CustomLabel label="Date AA Received IR" isRequired />
                  <Controller
                    name="dateAAReceivedIR"
                    control={control}
                    render={({ field, fieldState }) => (
                      <DatePickerField
                        name="dateAAReceivedIR"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disableFuture={true}
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Row 2 - Region */}
                <Grid size={{ xs: 12, sm: 6 }} data-field="region">
                  <CustomLabel label="Region" />
                  <Controller
                    name="region"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        placeholder="Select Region"
                        name="region"
                        value={field.value}
                        items={regionOptions}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        enableDeselect
                      />
                    )}
                  />
                </Grid>

                {/* Row 3 - Incident Date & Time */}
                <Grid size={{ xs: 12, sm: 12 }} data-field="incidentDate">
                  <CustomLabel label="Incident Date & Time" isRequired />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                      <Controller
                        name="incidentDate"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DatePickerField
                            name="incidentDate"
                            value={field.value}
                            onChange={field.onChange}
                            useCustomStyle={false}
                            disableFuture={true}
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }} data-field="incidentTime">
                      <Controller
                        name="incidentTime"
                        control={control}
                        render={({ field, fieldState }) => (
                          <TimePickerField
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Row 4 - Agency Name */}
                <Grid size={{ xs: 12 }} data-field="agencyName">
                  <CustomLabel label="Name of agency providing services at the time of incident" />
                  <Controller
                    name="agencyName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <CustomInput
                        name="agencyName"
                        placeholder="Enter"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        bgWhite
                        maxLength={255}
                        hasError={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Medical Section */}
              <Box sx={{ marginTop: "24px" }} data-field="medical">
                <CustomLabel label="Medical" />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <Controller
                    name="medical.hospitalizationMedical"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Hospitalization – medical (admittance, not ER visit)"
                      />
                    )}
                  />
                  <Controller
                    name="medical.hospitalizationPsychiatric"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Hospitalization – psychiatric (admittance, not ER visit)"
                      />
                    )}
                  />
                  <Controller
                    name="medical.injuryNoIntervention"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Injury of individual not requiring medical intervention"
                      />
                    )}
                  />
                  <Controller
                    name="medical.injuryWithIntervention"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Injury of individual requiring medical intervention"
                      />
                    )}
                  />
                  <Controller
                    name="medical.illnessNoIntervention"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Illness of individual not requiring medical intervention"
                      />
                    )}
                  />
                  <Controller
                    name="medical.illnessWithIntervention"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Illness of individual requiring medical intervention"
                      />
                    )}
                  />
                  <Controller
                    name="medical.seizure"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Seizure"
                      />
                    )}
                  />
                  <Controller
                    name="medical.medicationRefusal"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Medication refusal"
                      />
                    )}
                  />
                  <Controller
                    name="medical.fall"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Fall"
                      />
                    )}
                  />
                  <Controller
                    name="medical.other"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Other"
                      />
                    )}
                  />
                  {medicalOther && (
                    <Box sx={{ pl: 2.5, mt: 0.5 }} data-field="medicalOther">
                      <Controller
                        name="medicalOther"
                        control={control}
                        render={({ field, fieldState }) => (
                          <CustomInput
                            name="medicalOther"
                            placeholder="Please specify other medical details"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                            bgWhite
                            required
                          />
                        )}
                      />
                    </Box>
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#757775",
                    marginTop: "8px",
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  Note : Medical intervention refers to treatment at a medical
                  facility (ER, Urgent Care, PCP, etc.)
                </Typography>
              </Box>

              {/* Legal Section */}
              <Box sx={{ marginTop: "24px" }} data-field="legal">
                <CustomLabel label="Legal" />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <Controller
                    name="legal.clientRightsViolation"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Possible/suspected violation of client rights (abuse, neglect, exploitation, service rights violation)"
                      />
                    )}
                  />
                  <Controller
                    name="legal.missingEloped"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Individual missing/eloped (even temporarily)"
                      />
                    )}
                  />
                  <Controller
                    name="legal.policeInvolvement"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Police involvement"
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Individual Victim Of Section */}
              <Box sx={{ marginTop: "24px" }} data-field="victimOf">
                <CustomLabel label="Individual Victim Of" />
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <Controller
                    name="victimOf.theft"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Theft"
                      />
                    )}
                  />
                  <Controller
                    name="victimOf.assault"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Assault"
                      />
                    )}
                  />
                  <Controller
                    name="victimOf.sexualAssault"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Sexual Assault"
                      />
                    )}
                  />
                  <Controller
                    name="victimOf.carAccident"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Car Accident"
                      />
                    )}
                  />
                  <Controller
                    name="victimOf.fireHazardArson"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Fire hazard / arson"
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Social Section */}
              <Box sx={{ marginTop: "24px" }} data-field="social">
                <CustomLabel label="Social" />
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <Controller
                    name="social.behaviorNoPlan"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Behavior incident – no behavior plan"
                      />
                    )}
                  />
                  <Controller
                    name="social.behaviorWithPlan"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Behavior incident – with behavior plan"
                      />
                    )}
                  />
                  <Controller
                    name="social.mentalHealthEpisode"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Mental health episode"
                      />
                    )}
                  />
                  <Controller
                    name="social.physicalRestraint"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Physical restraint utilized"
                      />
                    )}
                  />
                  <Controller
                    name="social.other"
                    control={control}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={field.value}
                        onChange={() => field.onChange(!field.value)}
                        label="Other"
                      />
                    )}
                  />
                  {socialOther && (
                    <Box sx={{ pl: 2.5, mt: 0.5 }} data-field="socialOther">
                      <Controller
                        name="socialOther"
                        control={control}
                        render={({ field, fieldState }) => (
                          <CustomInput
                            name="socialOther"
                            placeholder="Please specify other social details"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                            bgWhite
                            required
                          />
                        )}
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Textarea Fields */}
              <Box
                sx={{
                  marginTop: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <Box data-field="whatHappenedPrior">
                  <CustomLabel label="What happened prior to the incident" />
                  <Controller
                    name="whatHappenedPrior"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        name="whatHappenedPrior"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        multiline
                        rows={4}
                        bgWhite
                      />
                    )}
                  />
                </Box>

                <Box data-field="describeIncident">
                  <CustomLabel label="Describe what occurred during this incident (include specific information, i.e. behavior, injury etc.)" />
                  <Controller
                    name="describeIncident"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        name="describeIncident"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        multiline
                        rows={4}
                        bgWhite
                      />
                    )}
                  />
                </Box>

                <Box data-field="actionTaken">
                  <CustomLabel label="What action did the reporter or others employ in response to this incident" />
                  <Controller
                    name="actionTaken"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        name="actionTaken"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        multiline
                        rows={4}
                        bgWhite
                      />
                    )}
                  />
                </Box>
              </Box>

              {/* Who was Notified Section */}
              <Box sx={{ mt: "24px" }} data-field="whoNotified">
                <CustomLabel label="Who was Notified" />

                <Box sx={{ mt: 1 }}>
                  <NotifyRow
                    label="Area Agency"
                    name="whoNotified.serviceCoordinator"
                    atName="whoNotified.serviceCoordinatorAt"
                    methodName="whoNotified.serviceCoordinatorMethod"
                    byWhomName="whoNotified.serviceCoordinatorByWhom"
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    currentUserName={currentUserName}
                    disableFuture={true}
                  />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <NotifyRow
                    label="Program Manager"
                    name="whoNotified.programManager"
                    atName="whoNotified.programManagerAt"
                    methodName="whoNotified.programManagerMethod"
                    byWhomName="whoNotified.programManagerByWhom"
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    currentUserName={currentUserName}
                    disableFuture={true}
                  />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <NotifyRow
                    label="Guardian"
                    name="whoNotified.guardian"
                    atName="whoNotified.guardianAt"
                    methodName="whoNotified.guardianMethod"
                    byWhomName="whoNotified.guardianByWhom"
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    currentUserName={currentUserName}
                    disableFuture={true}
                  />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <NotifyRow
                    label="Program Coordinator"
                    name="whoNotified.additionalServiceProvider"
                    atName="whoNotified.additionalServiceProviderAt"
                    methodName="whoNotified.additionalServiceProviderMethod"
                    byWhomName="whoNotified.additionalServiceProviderByWhom"
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    currentUserName={currentUserName}
                    disableFuture={true}
                  />
                </Box>

                <Box sx={{ mt: 1 }}>
                  <NotifyRow
                    label="Nursing"
                    name="whoNotified.nursing"
                    atName="whoNotified.nursingAt"
                    methodName="whoNotified.nursingMethod"
                    byWhomName="whoNotified.nursingByWhom"
                    control={control}
                    setValue={setValue}
                    getValues={getValues}
                    currentUserName={currentUserName}
                    disableFuture={true}
                  />
                </Box>
              </Box>

              {/* Signature Section — Reporter (existing capture UI) */}
              <Box sx={{ marginTop: "24px" }} data-field="signature">
                <CustomLabel label="Signature of Reporter" />
                {/*
                  Always show the standard draw/upload signature pad. The
                  previous "Reporter Signature (on file)" SignatureBox was
                  removed — the existing draw/upload widget already renders
                  the captured signature inline (via `existingSignaturePreviewUrl`).
                  Non-DSP roles see the pad in read-only mode (info hint
                  above explains they can't sign here).
                */}
                {incidentRole !== "DSP" &&
                  !(incidentData as any)?.reporter_signature_url && (
                    <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                      Only a DSP assigned to this group home can sign the
                      Reporter section. Save the incident as a draft — once a
                      DSP signs, it will move to PM Review Pending.
                    </Alert>
                  )}
                {incidentRole === "DSP" ? (
                <Box
                  sx={{
                    marginTop: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
                  >
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#757775",
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                        lineHeight: 1.6,
                      }}
                    >
                      Select Signature Method
                    </Typography>
                    <Box sx={{ display: "flex", gap: "16px" }}>
                      <FormControlLabel
                        control={
                          <Radio
                            checked={signatureMethod === "DRAW"}
                            onChange={handleMethodChange}
                            value="DRAW"
                            sx={{
                              color: "#A9ACA9",
                              "&.Mui-checked": {
                                color: "#0A2E45",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#2C2D2C",
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            Draw
                          </Typography>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Radio
                            checked={signatureMethod === "UPLOAD"}
                            onChange={handleMethodChange}
                            value="UPLOAD"
                            sx={{
                              color: "#A9ACA9",
                              "&.Mui-checked": {
                                color: "#0A2E45",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            sx={{
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "#2C2D2C",
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            Upload
                          </Typography>
                        }
                      />
                    </Box>
                  </Box>

                  {/* Signature Canvas or Upload */}
                  {signatureMethod === "DRAW" ? (
                    <Box
                      sx={{
                        backgroundColor: "#FBFFF7",
                        border: "1px solid #EFFFE3",
                        borderRadius: "4px",
                        padding: "12px 16px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "16px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#757775",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            lineHeight: 1.6,
                          }}
                        >
                          {existingSignatureUrl && !isExistingSignatureCleared
                            ? hasDrawnSignature || existingSignaturePreviewUrl
                              ? "Your existing signature (you can clear and draw a new one):"
                              : "You have an existing signature. You can use it or draw/upload a new one."
                            : "Use your mouse, touchpad, or touchscreen to draw your signature"}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          {existingSignatureUrl &&
                            !isExistingSignatureCleared &&
                            (hasDrawnSignature ||
                              existingSignaturePreviewUrl) && (
                              <IconButton
                                onClick={handleClearExistingSignature}
                                sx={{
                                  padding: "4px",
                                  color: "#757775",
                                  "&:hover": {
                                    backgroundColor: "#F5F5F5",
                                    color: "#424342",
                                  },
                                }}
                                aria-label="Clear existing signature"
                                title="Clear existing signature"
                              >
                                <CloseIcon sx={{ fontSize: "20px" }} />
                              </IconButton>
                            )}
                          <CustomButton
                            variant="secondary"
                            size="sm"
                            onClick={handleClearSignature}
                            disabled={
                              !hasDrawnSignature ||
                              !!(
                                existingSignatureUrl &&
                                !isExistingSignatureCleared &&
                                existingSignaturePreviewUrl &&
                                !isCanvasLoaded
                              )
                            }
                          >
                            Clear
                          </CustomButton>
                        </Box>
                      </Box>
                      {/* Show existing signature preview if available but not loaded into canvas, otherwise show canvas */}
                      {existingSignatureUrl &&
                        !isExistingSignatureCleared &&
                        existingSignaturePreviewUrl &&
                        !isCanvasLoaded ? (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "16px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E7E9EB",
                            borderRadius: "4px",
                            minHeight: "120px",
                          }}
                        >
                          <Box
                            component="img"
                            src={existingSignaturePreviewUrl}
                            alt="Existing Signature Preview"
                            sx={{
                              maxWidth: "100%",
                              maxHeight: "200px",
                              objectFit: "contain",
                            }}
                            onLoad={() => {
                              // Existing signature loaded — do NOT set hasDrawnSignature
                              // as the user has not actively drawn a new signature
                            }}
                            onError={(e) => {
                              const imgElement = e.target as HTMLImageElement;
                              const currentSrc = imgElement.src;
                              console.error(
                                "Signature preview image failed to load:",
                                currentSrc,
                              );
                            }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E7E9EB",
                            borderRadius: "4px",
                            padding: "16px",
                          }}
                        >
                          <SignatureCanvas
                            ref={signatureCanvasRef}
                            width={568}
                            height={120}
                            backgroundColor="#FFFFFF"
                            strokeColor="#000000"
                            strokeWidth={2}
                            onSignatureChange={(hasSignature) => {
                              setHasDrawnSignature(hasSignature);
                              if (hasSignature) {
                                setShouldClearSignatureOnSave(false);
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        padding: "12px 16px",
                        backgroundColor: "#FBFFF7",
                        border: "1px solid #EFFFE3",
                        borderRadius: "4px",
                      }}
                    >
                      <input
                        ref={signatureFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                      />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "#757775",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            lineHeight: 1.6,
                          }}
                        >
                          Upload your signature file
                        </Typography>
                        <CustomButton
                          variant="secondary"
                          size="sm"
                          onClick={handleClearSignature}
                          disabled={!uploadedFile && !signaturePreviewUrl}
                        >
                          Clear
                        </CustomButton>
                      </Box>
                      {/* Show uploaded signature preview (fresh upload or existing) */}
                      {signaturePreviewUrl && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "16px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E7E9EB",
                            borderRadius: "4px",
                            minHeight: "120px",
                          }}
                        >
                          <Box
                            component="img"
                            src={signaturePreviewUrl}
                            alt="Existing Uploaded Signature"
                            sx={{
                              maxWidth: "100%",
                              maxHeight: "200px",
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          padding: "16px",
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #E7E9EB",
                          borderRadius: "4px",
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "#FAFAFA",
                          },
                        }}
                        onClick={() => signatureFileInputRef.current?.click()}
                      >
                        <Typography
                          sx={{
                            fontSize: "14px",
                            color: "#757775",
                            fontFamily: '"Helvetica Neue", Arial, sans-serif',
                            textAlign: "center",
                          }}
                        >
                          {uploadedFile
                            ? `${uploadedFile.name} — click to replace`
                            : signaturePreviewUrl
                              ? "Click to replace signature file"
                              : "Click to upload signature file"}
                        </Typography>
                      </Box>
                      {signatureFileError && (
                        <Typography sx={{ color: "#DC2626", fontSize: "12px", mt: 0.5 }}>
                          {signatureFileError}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
                ) : (incidentData as any)?.reporter_signature_url ? (
                  <Box
                    sx={{
                      mt: 1,
                      p: 2,
                      border: "1px solid #E7E9EB",
                      borderRadius: "4px",
                      backgroundColor: "#FFFFFF",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      component="img"
                      src={(incidentData as any).reporter_signature_url}
                      alt="Reporter signature"
                      sx={{
                        maxWidth: "100%",
                        maxHeight: 160,
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                ) : null}
              </Box>

              {/*
                Program Manager / Coordinator Review/Follow-up.
                Hidden entirely for any role except PM/Coordinator. PM and
                Coordinator share the same "PM" bucket in `incidentRole`.
                Admin, DSP, BCBA, Nurse, Lead, Guardian, Agent do NOT see it.
              */}
              {incidentRole === "PM" && (
                <Box sx={{ marginTop: "24px" }} data-field="pmReview">
                  <CustomLabel label="Program Manager / Coordinator Review/Follow-up" />
                  <Box sx={{ mt: 1 }}>
                    <CustomInput
                      name="pm_review_notes"
                      multiline
                      rows={4}
                      placeholder="Review / follow-up narrative"
                      value={pmReviewNotes}
                      onChange={(e) => setPmReviewNotes(e.target.value)}
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <CustomLabel label="Type of Program individual was in during this incident (e.g. CPS, Res, CSS, SEP, 521, etc.)" />
                    <Box sx={{ mt: 1 }}>
                      <CustomInput
                        name="pm_program_type"
                        placeholder="e.g. CPS"
                        value={pmProgramType}
                        onChange={(e) => setPmProgramType(e.target.value)}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <CustomLabel label="Has the individual had a service transition within the past 6 months (new home, new home care provider, significant change in service delivery)?" />
                    <RadioGroup
                      row
                      value={pmServiceTransition}
                      onChange={(e) => {
                        const value = e.target.value as "" | "YES" | "NO";
                        setPmServiceTransition(value);
                        if (value !== "YES") setPmServiceTransitionDescription("");
                      }}
                    >
                      <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                      <FormControlLabel value="NO" control={<Radio />} label="No" />
                    </RadioGroup>
                    {pmServiceTransition === "YES" && (
                      <Box sx={{ mt: 1 }}>
                        <CustomInput
                          name="pm_service_transition_description"
                          multiline
                          rows={2}
                          placeholder="Describe the transition and its relationship to the incident"
                          value={pmServiceTransitionDescription}
                          onChange={(e) =>
                            setPmServiceTransitionDescription(e.target.value)
                          }
                        />
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <CustomLabel label="If it is a behavioral incident with plan, was the behavior plan followed?" />
                    <RadioGroup
                      row
                      value={pmBehaviorPlanFollowed}
                      onChange={(e) =>
                        setPmBehaviorPlanFollowed(e.target.value as any)
                      }
                    >
                      <FormControlLabel value="YES" control={<Radio />} label="Yes" />
                      <FormControlLabel value="NO" control={<Radio />} label="No" />
                      <FormControlLabel value="N_A" control={<Radio />} label="N/A" />
                    </RadioGroup>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <CustomLabel label="Signature of Program Manager" />
                    {(incidentData as any)?.pm_signature_url &&
                    !isPmIncidentSignatureCleared ? (
                      // Already signed — show the captured signature read-only.
                      <Box sx={{ mt: 1 }}>
                        {incidentStatus === "PM_REVIEW_PENDING" && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              gap: "8px",
                              mb: 1,
                            }}
                          >
                            <IconButton
                              onClick={handleClearPmProfileSignature}
                              sx={{
                                padding: "4px",
                                color: "#757775",
                                "&:hover": {
                                  backgroundColor: "#F5F5F5",
                                  color: "#424342",
                                },
                              }}
                              aria-label="Clear existing PM signature"
                              title="Clear existing PM signature"
                            >
                              <CloseIcon sx={{ fontSize: "20px" }} />
                            </IconButton>
                            <CustomButton
                              variant="secondary"
                              size="sm"
                              onClick={handleClearPmProfileSignature}
                            >
                              Clear
                            </CustomButton>
                          </Box>
                        )}
                        <Box
                          sx={{
                            p: 2,
                            border: "1px solid #E7E9EB",
                            borderRadius: "4px",
                            backgroundColor: "#FFFFFF",
                            minHeight: "120px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                          }}
                        >
                          <Box
                            component="img"
                            src={(incidentData as any).pm_signature_url}
                            alt="Program Manager signature"
                            sx={{
                              maxHeight: 100,
                              maxWidth: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      </Box>
                    ) : pmProfileSignatureUrl &&
                      incidentStatus === "PM_REVIEW_PENDING" &&
                      !isPmProfileSignatureCleared ? (
                      <Box sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: "8px",
                            mb: 1,
                          }}
                        >
                          <IconButton
                            onClick={handleClearPmProfileSignature}
                            sx={{
                              padding: "4px",
                              color: "#757775",
                              "&:hover": {
                                backgroundColor: "#F5F5F5",
                                color: "#424342",
                              },
                            }}
                            aria-label="Clear existing PM signature"
                            title="Clear existing PM signature"
                          >
                            <CloseIcon sx={{ fontSize: "20px" }} />
                          </IconButton>
                          <CustomButton
                            variant="secondary"
                            size="sm"
                            onClick={handleClearPmProfileSignature}
                          >
                            Clear
                          </CustomButton>
                        </Box>
                        <Box
                          sx={{
                            p: 2,
                            border: "1px solid #E7E9EB",
                            borderRadius: "4px",
                            backgroundColor: "#FFFFFF",
                            minHeight: "120px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                          }}
                        >
                          <Box
                            component="img"
                            src={pmProfileSignatureUrl}
                            alt="Program Manager profile signature"
                            sx={{
                              maxHeight: 100,
                              maxWidth: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      </Box>
                    ) : incidentStatus === "PM_REVIEW_PENDING" ? (
                      // Full Draw / Upload pad, mirroring the Reporter pad.
                      <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <Typography
                            sx={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: "#757775",
                              fontFamily: '"Helvetica Neue", Arial, sans-serif',
                              lineHeight: 1.6,
                            }}
                          >
                            Select Signature Method
                          </Typography>
                          <Box sx={{ display: "flex", gap: "16px" }}>
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={pmSignatureMethod === "DRAW"}
                                  onChange={() => {
                                    setPmSignatureMethod("DRAW");
                                    setPmSignatureFileError(null);
                                  }}
                                  value="DRAW"
                                  sx={{ color: "#A9ACA9", "&.Mui-checked": { color: "#0A2E45" } }}
                                />
                              }
                              label={
                                <Typography sx={{ fontSize: "14px", fontWeight: 400, color: "#2C2D2C" }}>
                                  Draw
                                </Typography>
                              }
                            />
                            <FormControlLabel
                              control={
                                <Radio
                                  checked={pmSignatureMethod === "UPLOAD"}
                                  onChange={() => {
                                    setPmSignatureMethod("UPLOAD");
                                    setPmSignatureFileError(null);
                                  }}
                                  value="UPLOAD"
                                  sx={{ color: "#A9ACA9", "&.Mui-checked": { color: "#0A2E45" } }}
                                />
                              }
                              label={
                                <Typography sx={{ fontSize: "14px", fontWeight: 400, color: "#2C2D2C" }}>
                                  Upload
                                </Typography>
                              }
                            />
                          </Box>
                        </Box>

                        {pmSignatureMethod === "DRAW" ? (
                          <Box
                            sx={{
                              backgroundColor: "#FBFFF7",
                              border: "1px solid #EFFFE3",
                              borderRadius: "4px",
                              padding: "12px 16px",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "16px",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "#757775",
                                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                  lineHeight: 1.6,
                                }}
                              >
                                Use your mouse, touchpad, or touchscreen to draw your signature
                              </Typography>
                              <CustomButton
                                variant="secondary"
                                size="sm"
                                onClick={handlePmClear}
                                disabled={!hasPmSignatureDrawn}
                              >
                                Clear
                              </CustomButton>
                            </Box>
                            <Box
                              sx={{
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E7E9EB",
                                borderRadius: "4px",
                                padding: "16px",
                              }}
                            >
                              <SignatureCanvas
                                ref={pmSignatureCanvasRef}
                                width={568}
                                height={120}
                                backgroundColor="#FFFFFF"
                                strokeColor="#000000"
                                strokeWidth={2}
                                onSignatureChange={(hasSignature) => {
                                  setHasPmSignatureDrawn(hasSignature);
                                }}
                              />
                            </Box>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "16px",
                              padding: "12px 16px",
                              backgroundColor: "#FBFFF7",
                              border: "1px solid #EFFFE3",
                              borderRadius: "4px",
                            }}
                          >
                            <input
                              ref={pmSignatureFileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={handlePmFileUpload}
                              style={{ display: "none" }}
                            />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  color: "#757775",
                                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                  lineHeight: 1.6,
                                }}
                              >
                                Upload your signature file
                              </Typography>
                              <CustomButton
                                variant="secondary"
                                size="sm"
                                onClick={handlePmClear}
                                disabled={!pmUploadedFile}
                              >
                                Clear
                              </CustomButton>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                padding: "16px",
                                backgroundColor: "#FFFFFF",
                                border: "1px solid #E7E9EB",
                                borderRadius: "4px",
                                cursor: "pointer",
                                "&:hover": { backgroundColor: "#FAFAFA" },
                              }}
                              onClick={() => pmSignatureFileInputRef.current?.click()}
                            >
                              {pmUploadPreviewUrl && (
                                <Box
                                  component="img"
                                  src={pmUploadPreviewUrl}
                                  alt="Uploaded signature"
                                  sx={{
                                    maxWidth: "100%",
                                    height: 120,
                                    objectFit: "contain",
                                    display: "block",
                                    mx: "auto",
                                  }}
                                />
                              )}
                              <Typography
                                sx={{
                                  fontSize: pmUploadedFile ? "12px" : "14px",
                                  color: "#757775",
                                  textAlign: "center",
                                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                                }}
                              >
                                {pmUploadedFile
                                  ? `${pmUploadedFile.name} — click to replace`
                                  : "Click to upload signature file"}
                              </Typography>
                            </Box>
                            {pmSignatureFileError && (
                              <Typography sx={{ color: "#DC2626", fontSize: "12px", mt: 0.5 }}>
                                {pmSignatureFileError}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {incidentStatus === "COMPLETED" ||
                        incidentStatus === "ACKNOWLEDGED"
                          ? "—"
                          : "Awaiting PM review."}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
      </Box>

      {/* Fixed Footer — status-aware action buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          padding: "16px 24px",
          borderTop: "1px solid #E7E9EB",
          position: "sticky",
          bottom: 0,
          backgroundColor: "#FFFFFF",
          zIndex: 1,
        }}
      >
        <IncidentFooter
          uuid={isEditMode ? incidentUuid : undefined}
          status={incidentStatus}
          role={incidentRole}
          hasReporterSignature={
            hasDrawnSignature ||
            !!uploadedFile ||
            (!!existingSignatureUrl && !isExistingSignatureCleared) ||
            !!(incidentData as any)?.reporter_signature_url
          }
          pmSignatureProvider={uploadPmDrawAndGetMediaId}
          hasPmSignature={
            (!!(incidentData as any)?.pm_signature_url &&
              !isPmIncidentSignatureCleared) ||
            (!!pmProfileSignatureUrl &&
              incidentRole === "PM" &&
              incidentStatus === "PM_REVIEW_PENDING" &&
              !isPmProfileSignatureCleared)
          }
          onSave={saveIncidentForFooter}
          onChanged={() => {
            // Workflow transitions (start / pm-signoff / acknowledge / send-back)
            // don't go through the create/update mutation hooks, so invalidate
            // the list and the single-incident queries manually here. Without
            // this the list keeps showing the old status until manual refresh.
            try {
              const listKey = listIncidentsOptions().queryKey.slice(0, 1);
              queryClient.invalidateQueries({ queryKey: listKey });
              if (incidentUuid) {
                queryClient.invalidateQueries({
                  queryKey: getIncidentOptions({ path: { uuid: incidentUuid } }).queryKey,
                });
              }
            } catch (e) {
              // SDK query keys may differ in shape across regens — fall back
              // to a broad invalidation rather than blocking the close.
              try {
                queryClient.invalidateQueries();
              } catch {
                /* noop */
              }
            }
            if (onSuccess) {
              onSuccess(isEditMode ? "Incident updated" : "Incident submitted for review");
            }
            onClose();
          }}
          setErrors={setTransitionErrors}
          onCancel={handleCancel}
          disabled={
            isSaving ||
            createIncidentMutation.isPending ||
            updateIncidentMutation.isPending ||
            (isEditMode && isLoadingIncident)
          }
        />
      </Box>

      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={handleSnackbarClose}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </Drawer>
  );
};

export default AddNewIncidentDrawer;
