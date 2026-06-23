import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Grid,
  Box,
  type SelectChangeEvent,
  Avatar,
  Button,
  GlobalStyles,
  Chip,
  Tooltip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import AddIcon from "@mui/icons-material/Add";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomSelect from "../../../components/custom-select/custom-select";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import AppointmentsTableWithPagination from "../components/AppointmentsTableWithPagination";
import AddNewAppointmentDrawer from "../components/AddNewAppointmentDrawer";
import EditAppointmentDrawer from "../components/EditAppointmentDrawer";
import ViewAppointmentDrawer from "../components/ViewAppointmentDrawer";
import ConfirmationPopUp from "../../../components/confirmation-pop-up/confirmation-pop-up";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAppointmentsOptions,
  listAppointmentsQueryKey,
  listGroupHomesOptions,
  updateAppointmentStatusMutation,
  deleteAppointmentMutation,
} from "../../../sdk/@tanstack/react-query.gen";
import { useMediaUpload } from "../../../hooks/useMediaUpload";
import dayjs, { type Dayjs } from "dayjs";
import type { AppointmentData } from "../components/AppointmentsTable";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import type { AxiosError } from "axios";
import { DefaultError } from "@tanstack/react-query";
import {
  CustomFileUpload,
  type FileItem,
} from "../../../components/custom-fileupload";
import CustomInput from "../../../components/custom-input/custom-input";
import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store/hooks";

const AppointmentsPage: React.FC = () => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ERROR_MESSAGE_FILE_TOO_LARGE =
    "The selected file is too large. Please choose a file smaller than 10 MB";

  const { hasPermission, getScope } = usePermission();
  const user = useAppSelector((state) => state.auth.user);
  const canCreateAppointment = hasPermission("appointments.create");
  const canEditAppointment = hasPermission("appointments.edit");
  const canDeleteAppointment = hasPermission("appointments.delete");
  const scope = getScope("appointments.view");
  const isAssignedHome = scope === "ASSIGNED_HOME";

  const [groupHomeFilter, setGroupHomeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Dayjs | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentData | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "delete" | "markCompleted" | "earlyCompleted" | null
  >(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [completeNoteValues, setCompleteNoteValues] = useState<{ complete_note: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const queryClient = useQueryClient();

  const completeSchema = yup.object({
    complete_note: yup
      .string()
      .required("Action note is required")
      .test(
        "not-only-spaces",
        "Action note is required",
        (v) => !!v && v.trim().length > 0,
      )
      .max(1000, "Maximum 1000 characters"),
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ complete_note: string }>({
    resolver: yupResolver(completeSchema),
    defaultValues: { complete_note: "" },
  });

  // Backend already scopes appointments to assigned group homes for PM/PC roles.

  // Debounce search term with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm, statusFilter, groupHomeFilter, dateFilter]);

  // Fetch appointments
  const { data: appointmentsResponse, isLoading } = useQuery(
    listAppointmentsOptions({
      query: {
        page: currentPage + 1, // API uses 1-based pagination
        size: recordsPerPage,
        search: debouncedSearchTerm || undefined,
        status: statusFilter || undefined,
        group_home: groupHomeFilter || undefined,
        date: dateFilter ? dateFilter.format("YYYY-MM-DD") : undefined,
      } as any,
    } as any),
  );

  // Fetch group homes
  const { data: groupHomesResponse } = useQuery(
    listGroupHomesOptions({
      query: {
        page: 1,
        size: 1000, // Get all group homes
      },
    }),
  );

  // Status options
  const statusOptions = useMemo(() => {
    return [
      { value: "", label: "All Status" },
      { value: "REQUESTED", label: "Requested" },
      { value: "COMPLETED", label: "Completed" },
    ];
  }, []);

  const getStatusColors = (
    status: string | undefined,
  ): { bg: string; color: string } => {
    const s = status?.toUpperCase() || "";
    switch (s) {
      case "REQUESTED":
        return { bg: "#E3F2FD", color: "#1976D2" };
      case "COMPLETED":
        return { bg: "#E6F4EA", color: "#137333" };

      default:
        return { bg: "#F2F2F2", color: "#757775" };
    }
  };

  const statusSelectOptions = useMemo(() => {
    return statusOptions.map((opt) => {
      if (!opt.value) return opt;
      const colors = getStatusColors(opt.value);
      return {
        ...opt,
        child: (
          <Chip
            label={opt.label}
            sx={{
              backgroundColor: colors.bg,
              color: colors.color,
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              fontSize: "12px",
              fontWeight: 500,
              height: "24px",
              borderRadius: "6px",
              textTransform: "uppercase",
              "& .MuiChip-label": { padding: "0 8px" },
            }}
          />
        ),
      };
    });
  }, [statusOptions]);

  // Transform group homes to CustomSelect format
  const groupHomeSelectOptions = useMemo(() => {
    if (!groupHomesResponse) {
      return isAssignedHome ? [] : [{ value: "", label: "All Group Home" }];
    }

    const responseData = groupHomesResponse;
    interface GroupHomeItem {
      name?: string;
      id?: number | string;
      uuid?: string;
    }
    let homesList: GroupHomeItem[] = [];

    if (responseData) {
      if ("data" in responseData && responseData.data) {
        const data = responseData.data as unknown;
        if (Array.isArray(data)) {
          homesList = data as GroupHomeItem[];
        } else if (typeof data === "object" && data !== null) {
          const dataObj = data as Record<string, unknown>;
          if (Array.isArray(dataObj.results)) {
            homesList = dataObj.results as GroupHomeItem[];
          } else if (Array.isArray(dataObj.content)) {
            homesList = dataObj.content as GroupHomeItem[];
          }
        }
      } else if (Array.isArray(responseData)) {
        homesList = responseData as GroupHomeItem[];
      }
    }

    return [
      ...(isAssignedHome ? [] : [{ value: "", label: "All Group Home" }]),
      ...homesList
        .filter((home) => home.name && home.uuid)
        .map((home) => ({
          value: (home?.uuid as string) || String(home?.id),
          label: home.name || "Unknown",
        })),
    ];
  }, [groupHomesResponse, isAssignedHome]);

  const handleGroupHomeChange = (e: SelectChangeEvent<string>) => {
    setGroupHomeFilter(e.target.value);
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setStatusFilter(e.target.value);
  };

  const handleDateChange = (date: Dayjs | null) => {
    setDateFilter(date);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleNewAppointment = () => {
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleAppointmentSuccess = (message: string) => {
    setSnackbar({
      isOpen: true,
      message: message,
      status: "success",
    });
  };

  const handleAppointmentError = (message: string) => {
    setSnackbar({
      isOpen: true,
      message: message,
      status: "error",
    });
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown> | null,
    page: number,
  ) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(0);
  };

  // Mark as Completed mutation (success/error handled in onSubmitCompleted)
  const markCompletedMutation = useMutation({
    ...(updateAppointmentStatusMutation() as any),
  });

  // Delete appointment mutation
  const deleteAppointmentMutationHook = useMutation({
    ...(deleteAppointmentMutation() as any),
    onSuccess: (data: unknown) => {
      const responseData = data as { message?: string };
      const successMessage =
        responseData?.message || "Appointment deleted successfully!";

      queryClient.invalidateQueries({
        queryKey: listAppointmentsQueryKey(),
      });

      setSnackbar({
        isOpen: true,
        message: successMessage,
        status: "success",
      });
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);
      setConfirmAction(null);
    },
    onError: (error: AxiosError<DefaultError>) => {
      const errorData = error.response?.data as { message?: string };
      const errorMessage =
        errorData?.message || "Failed to delete appointment. Please try again.";

      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: "error",
      });
      setConfirmDialogOpen(false);
    },
  });

  const { upload: uploadMedia } = useMediaUpload({
    contentTypeApp: "appointments",
    contentTypeModel: "appointment",
  });

  /** Upload one file via presigned URL and confirm; returns the created media id (for backend validation on complete). */
  const uploadOneAppointmentDocument = async (
    file: File,
    appointmentUuid: string,
  ): Promise<string | null> => {
    if (!appointmentUuid) throw new Error("No appointment selected");
    const result = await uploadMedia(file, {
      objectUuid: appointmentUuid,
      description: "appointment_document",
    });
    return result.id || null;
  };

  const handleEdit = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setIsEditDrawerOpen(true);
  };

  const handleView = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setIsViewDrawerOpen(true);
  };

  const handleViewDrawerClose = () => {
    setIsViewDrawerOpen(false);
    setSelectedAppointment(null);
  };

  // Validate file type and size on selection
  const handleFilesChange = (files: FileItem[]) => {
    const unsupported = files.find((f) => f.error === "File type not allowed");
    if (unsupported) {
      setSnackbar({
        isOpen: true,
        message: "Unsupported file format. Please upload PDF, PNG, JPG, or JPEG files.",
        status: "error",
      });
      return;
    }
    const oversize = files.find((f) => f.file && f.file.size > MAX_FILE_SIZE);
    if (oversize) {
      setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      return;
    }
    setUploadedFiles(files);
  };

  const handleMarkCompleted = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setConfirmAction("markCompleted");
    setCompleteDialogOpen(true);
    setUploadedFiles([]);
    reset({ complete_note: "" });
  };

  const handleDelete = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setConfirmAction("delete");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedAppointment) return;
    if (confirmAction === "markCompleted") {
      return;
    } else if (confirmAction === "delete") {
      deleteAppointmentMutationHook.mutate({
        path: { uuid: selectedAppointment.uuid },
      } as any);
    } else if (confirmAction === "earlyCompleted") {
      if (completeNoteValues) {
        performCompletion(completeNoteValues);
      }
    }
  };

  const performCompletion = async (values: { complete_note: string }) => {
    if (!selectedAppointment) return;
    // Capture uuid before any async operations to avoid stale closure issues
    const appointmentUuid = selectedAppointment.uuid;
    setIsUploading(true);
    try {
      // 1. Call status API first (fast validation)
      await markCompletedMutation.mutateAsync({
        path: { uuid: appointmentUuid },
        body: {
          status: "COMPLETED",
          action_note: values.complete_note.trim(),
        },
      } as any);

      // 2. Only upload documents after status change succeeds (in parallel)
      const filesToUpload = uploadedFiles.filter((item) => item?.file);
      if (filesToUpload.length > 0) {
        const uploadResults = await Promise.allSettled(
          filesToUpload.map((item) => uploadOneAppointmentDocument(item.file!, appointmentUuid)),
        );
        const failed = uploadResults.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          setSnackbar({
            isOpen: true,
            message: `Appointment completed, but ${failed.length} document(s) failed to upload.`,
            status: "error",
          });
        } else {
          setSnackbar({
            isOpen: true,
            message: "Appointment marked as completed successfully!",
            status: "success",
          });
        }
      } else {
        setSnackbar({
          isOpen: true,
          message: "Appointment marked as completed successfully!",
          status: "success",
        });
      }

      // 3. Cleanup: close dialog, reset state, refresh list
      queryClient.invalidateQueries({
        queryKey: listAppointmentsQueryKey(),
      });
      setCompleteDialogOpen(false);
      setUploadedFiles([]);
      setConfirmDialogOpen(false);
      setSelectedAppointment(null);
      setConfirmAction(null);
      setCompleteNoteValues(null);
    } catch (err) {
      // Status change failed — no documents uploaded, no time wasted
      const axiosErr = err as AxiosError<{ message?: string }>;
      setSnackbar({
        isOpen: true,
        message:
          axiosErr?.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Failed to complete appointment. Please try again."),
        status: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmitCompleted = async (values: { complete_note: string }) => {
    if (!selectedAppointment) return;

    // Check for oversize files (show alert dialog instead of disabling button)
    const oversize = uploadedFiles.find((f) => f.file && f.file.size > MAX_FILE_SIZE);
    if (oversize) {
      setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      return;
    }

    // Check if it's an early completion
    const appointmentDate = dayjs(selectedAppointment.appointment_date);
    const appointmentTime = selectedAppointment.appointment_time;

    let scheduledDateTime = appointmentDate;
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      scheduledDateTime = scheduledDateTime.hour(hours).minute(minutes).second(0);
    }

    const now = dayjs();

    if (scheduledDateTime.isAfter(now)) {
      // Show confirmation popup for early completion
      setCompleteNoteValues(values);
      setConfirmAction('earlyCompleted');
      setConfirmDialogOpen(true);
      return;
    }

    // Normal completion
    await performCompletion(values);
  };

  const handleCancelConfirm = () => {
    setConfirmDialogOpen(false);
    if (confirmAction !== 'earlyCompleted') {
      setSelectedAppointment(null);
    }
    setConfirmAction(null);
    setCompleteNoteValues(null);
  };

  const handleEditDrawerClose = () => {
    setIsEditDrawerOpen(false);
    setSelectedAppointment(null);
  };

  const getLeadId = (apt: any): number | string | null => {
    // common backend shapes — keep all fallbacks
    return (
      apt?.lead_id ??
      apt?.lead ?? // many APIs return `lead` as numeric id
      apt?.lead_detail?.id ??
      apt?.lead_detail?.lead_id ??
      apt?.lead_uuid ?? // if only uuid exists
      null
    );
  };

  const formatReferralId = (leadId: any) => {
    if (!leadId) return "-";

    // If numeric -> show like REF-001 / REF-012 etc
    if (typeof leadId === "number" || /^\d+$/.test(String(leadId))) {
      return `REF-${String(leadId).padStart(3, "0")}`;
    }

    // If uuid/string -> use first chunk (optional style)
    return `REF-${String(leadId).split("-")[0].toUpperCase()}`;
  };

  // Extract appointments data from response
  const extractAppointmentsData = (): AppointmentData[] => {
    if (!appointmentsResponse) return [];

    const responseData = appointmentsResponse as any;
    let appointments: any[] = [];

    if (responseData?.data) {
      if (
        responseData.data.results &&
        Array.isArray(responseData.data.results)
      ) {
        appointments = responseData.data.results;
      } else if (Array.isArray(responseData.data)) {
        appointments = responseData.data;
      } else if (
        responseData.data.content &&
        Array.isArray(responseData.data.content)
      ) {
        appointments = responseData.data.content;
      }
    } else if (Array.isArray(responseData)) {
      appointments = responseData;
    }

    return appointments.map((apt: any) => {
      return {
        ...apt,
        resident_name: apt.resident_name || "-",
        referral_id: apt.referral_number || "-",
      };
    }) as AppointmentData[];
  };

  const appointmentsData = extractAppointmentsData();

  // Extract pagination info from appointments API response
  const paginationInfo = useMemo(() => {
    if (!appointmentsResponse) {
      return {
        totalElements: 0,
        totalPages: 0,
        currentPage: currentPage,
        pageSize: recordsPerPage,
      };
    }

    const responseData = appointmentsResponse as any;
    const pagination = responseData?.data?.pagination;

    if (pagination) {
      return {
        totalElements: pagination.total_records || pagination.totalRecords || 0,
        totalPages: pagination.total_pages || pagination.totalPages || 0,
        currentPage: currentPage,
        pageSize: pagination.size || recordsPerPage,
      };
    }

    // Fallback: calculate from data if pagination not available
    return {
      totalElements: appointmentsData.length,
      totalPages: Math.ceil(appointmentsData.length / recordsPerPage),
      currentPage: currentPage,
      pageSize: recordsPerPage,
    };
  }, [
    appointmentsResponse,
    currentPage,
    recordsPerPage,
    appointmentsData.length,
  ]);

  return (
    <Grid
      container
      sx={{
        height: "calc(100vh - 64px)",
        backgroundColor: "#F6F6F6",
        padding: { xs: "12px", sm: "20px", md: "18px" },
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <GlobalStyles
        styles={{
          /* ================= Existing lock styles (UNCHANGED) ================= */
          'body[data-resident-edit-lock="true"] .MuiDrawer-root .custom-autocomplete-no-border .MuiInputBase-input':
          {
            pointerEvents: "none",
          },
          'body[data-resident-edit-lock="true"] .MuiDrawer-root .custom-autocomplete-no-border .MuiOutlinedInput-root':
          {
            pointerEvents: "none",
          },
          'body[data-resident-edit-lock="true"] .MuiDrawer-root input[placeholder="Select Resident Name"]':
          {
            pointerEvents: "none",
            cursor: "not-allowed",
          },
          'body[data-resident-edit-lock="true"] .MuiDrawer-root .MuiAutocomplete-root':
          {
            pointerEvents: "none",
          },
          'body[data-resident-edit-lock="true"] .MuiDrawer-root .MuiAutocomplete-root .MuiOutlinedInput-root':
          {
            backgroundColor: "#F7F8FA",
          },
          'body[data-resident-edit-lock="true"] .MuiDrawer-root .MuiAutocomplete-root button[aria-label="Open"]':
          {
            display: "none",
          },

          /* ================= Dialog ================= */
          ".MuiDialog-root .MuiDialog-paper": {
            borderRadius: "8px",
            boxShadow: "0px 8px 24px rgba(16, 24, 40, 0.08)",
            backgroundColor: "#FFFFFF",
          },

          ".MuiDialog-root .MuiDialogTitle-root": {
            padding: "16px",
          },

          ".MuiDialog-root .MuiDivider-root": {
            margin: "0",
            borderColor: "#DEE4ED",
            opacity: 1,
          },

          /* ================= Resident info row ================= */
          ".MuiDialog-root .resident-info-row": {
            height: "44px",
            borderRadius: "4px",
            padding: "8px 12px",
            backgroundColor: "#F2F7FA",
            border: "1px solid #E6EFF4",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          },

          /* ================= Add Note textarea ================= */
          '.MuiDialog-root textarea[name="complete-note"]': {
            height: "100px !important",
            minHeight: "100px !important",
            resize: "none",
            fontSize: "14px",
            color: "#101828",
            boxSizing: "border-box",
          },

          /* ================= Upload dropzone ================= */
          /* ================= Upload icon — MATCH FIGMA EXACT ================= */
          ".MuiDialog-root .complete-upload > .MuiBox-root:first-of-type > .MuiBox-root:nth-of-type(1)":
          {
            width: "40px",
            height: "40px",
            borderRadius: "28px",
            backgroundColor: "#F2F4F7",
            border: "6px solid #E7E7E7", // Figma Neutral/5
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          },

          /* Hide default upload SVG */
          ".MuiDialog-root .complete-upload > .MuiBox-root:first-of-type > .MuiBox-root:nth-of-type(1) svg":
          {
            display: "none !important",
          },

          /* Inject SAME Figma upload icon */
          ".MuiDialog-root .complete-upload > .MuiBox-root:first-of-type > .MuiBox-root:nth-of-type(1)::before":
          {
            content: '""',
            width: "24px",
            height: "24px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "24px 24px",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 3v10' stroke='%23344054' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M8 7l4-4 4 4' stroke='%23344054' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M4 14v4a3 3 0 003 3h10a3 3 0 003-3v-4' stroke='%23344054' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
          },

          /* ================= Upload text colors ================= */
          /* Click to upload (blue) */
          ".MuiDialog-root .complete-upload .MuiTypography-root:first-of-type span:first-of-type":
          {
            color: "#11466D !important",
            fontWeight: 500,
          },

          /* or drag and drop (grey) */
          ".MuiDialog-root .complete-upload .MuiTypography-root:first-of-type span:nth-of-type(2)":
          {
            color: "#74797B !important",
          },

          /* File formats line */
          ".MuiDialog-root .complete-upload .MuiTypography-root:nth-of-type(2)":
          {
            color: "#98A2B3",
            fontSize: "12px",
          },

          /* Hide duplicate helper text */
          ".MuiDialog-root .complete-upload > .MuiTypography-root": {
            display: "none",
          },
        }}
      />
      <Grid size={{ xs: 12 }} sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
            height: "100%",
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
          }}
        >
        {/* Header */}
        <Grid
          container
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
            flexShrink: 0,
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
            paddingTop: "16px",
          }}
        >
          {/* All Appointments Title - Left Side */}
          <Grid size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}>
            <Typography
              sx={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#30353A",
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                whiteSpace: "nowrap",
              }}
            >
              All Appointments
            </Typography>
          </Grid>

          {/* Filters Container - Right Side */}
          <Grid
            container
            size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: "12px", sm: "12px", md: "12px", lg: "12px" },
              flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
              justifyContent: {
                xs: "flex-start",
                sm: "flex-start",
                md: "flex-end",
                lg: "flex-end",
              },
            }}
          >
            {/* Group Home dropdown */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "200px", lg: "200px" }, flexShrink: 1 }}
            >
              <CustomSelect
                placeholder="All Group Home"
                name="groupHome"
                value={groupHomeFilter}
                items={groupHomeSelectOptions}
                onChange={handleGroupHomeChange}
                bgWhite
                isDisabled={false}
              />
            </Grid>

            {/* Status Dropdown */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "150px", lg: "150px" }, flexShrink: 1 }}
            >
              <CustomSelect
                placeholder="All Status"
                name="status"
                value={statusFilter}
                items={statusSelectOptions}
                onChange={handleStatusChange}
                bgWhite
              />
            </Grid>

            {/* Date Filter */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "180px", lg: "180px" }, flexShrink: 1 }}
            >
              <DatePickerField
                value={dateFilter}
                onChange={handleDateChange}
                label="Filter by Date"
                bgWhite
                format="MM/DD/YYYY"
                showClearIcon={true}
              />
            </Grid>

            {/* Search Input */}
            <Grid
              size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "250px", lg: "250px" }, flexShrink: 1 }}
            >
              <CustomInput
                name="search"
                placeholder="Search by Resident Name"
                value={searchTerm}
                onChange={handleSearchChange}
                bgWhite
                hasStartSearchIcon
              />
            </Grid>

            {/* New Appointment Button */}
            <Grid
              size={{ xs: 12, sm: 12, md: "auto", lg: "auto" }}
              sx={{ minWidth: { md: "auto", lg: "auto" }, flexShrink: 0 }}
            >
              <Tooltip
                title={canCreateAppointment ? "" : "You don't have permission to add appointments"}
                arrow
              >
                <span>
                  <CustomButton
                    variant="primary"
                    size="lg"
                    icon={<AddIcon />}
                    iconPosition="left"
                    onClick={handleNewAppointment}
                    disabled={!canCreateAppointment}
                  >
                    New Appointment
                  </CustomButton>
                </span>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>

        {/* Table Section - same as Daily Logs */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            paddingX: { xs: "16px", sm: "24px", md: "20px" },
          }}
        >
          <AppointmentsTableWithPagination
            data={appointmentsData}
            loading={isLoading}
            paginationInfo={paginationInfo}
            onPageChange={handlePageChange}
            onRecordsPerPageChange={handleRecordsPerPageChange}
            onEdit={handleEdit}
            onView={handleView}
            onMarkCompleted={handleMarkCompleted}
            onDelete={handleDelete}
          />
        </Box>
        </Box>
      </Grid>

      {/* Add New Appointment Drawer */}
      <AddNewAppointmentDrawer
        open={isDrawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleAppointmentSuccess}
        onError={handleAppointmentError}
      />

      {/* Edit Appointment Drawer */}
      <EditAppointmentDrawer
        open={isEditDrawerOpen}
        appointment={selectedAppointment}
        onClose={handleEditDrawerClose}
        onSuccess={handleAppointmentSuccess}
        onError={handleAppointmentError}
      />

      {/* View Appointment Drawer */}
      <ViewAppointmentDrawer
        open={isViewDrawerOpen}
        appointment={selectedAppointment}
        onClose={handleViewDrawerClose}
        onEdit={handleEdit}
      />

      {/* Confirmation Dialog */}
      <ConfirmationPopUp
        open={confirmDialogOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmAction}
        message={
          confirmAction === "markCompleted"
            ? "Are you sure you want to mark this appointment as completed?"
            : confirmAction === "earlyCompleted"
              ? "This appointment is scheduled for a future date/time. Are you sure you want to mark it as completed?"
              : "Are you sure you want to delete this appointment?"
        }
        confirmDisabled={
          confirmAction === "markCompleted"
            ? markCompletedMutation.isPending
            : confirmAction === "earlyCompleted"
              ? markCompletedMutation.isPending || isUploading
              : deleteAppointmentMutationHook.isPending
        }
      />

      {/* Complete Appointment Modal */}
      <CustomDialog
        title={"Complete Appointment"}
        open={completeDialogOpen}
        onClose={() => {
          setCompleteDialogOpen(false);
          setUploadedFiles([]);
        }}
        width={"700px"}
        padding={"12px"}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "10px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        buttonName={[]}
      >
        <Grid container flexDirection="column" rowGap="16px" sx={{ p: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Scrollable content area */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxHeight: "60vh",
              pr: 0.5,
            }}
          >
            <Grid container className="resident-info-row">
              <Avatar
                src={selectedAppointment?.avatar_url ?? undefined}
                sx={{ width: 30, height: 30 }}
              >
                {(selectedAppointment?.resident_name || "U")
                  .split(" ")
                  .map((w) => w?.[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <Typography
                variant="buttonLinkAndField3"
                sx={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                {selectedAppointment?.resident_name || "-"}

                <span style={{ color: "#667085", marginLeft: 8 }}>
                  {(selectedAppointment as any)?.referral_number || (selectedAppointment as any)?.referral_id || ""}
                </span>
              </Typography>
            </Grid>

            <Typography
              variant="inputTitle"
              sx={{
                mb: "-8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Add Note
              <span style={{ color: "#D32F2F" }}>*</span>
            </Typography>
            <Controller
              name="complete_note"
              control={control}
              render={({ field }) => (
                <CustomInput
                  multiline
                  rows={3}
                  placeholder="Enter here..."
                  name="complete-note"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  hasError={!!errors.complete_note}
                  errorMessage={errors.complete_note?.message}
                />
              )}
            />
            <Typography variant="inputTitle" sx={{ mb: "-8px" }}>
              Upload Document
            </Typography>
            <CustomFileUpload
              className="complete-upload"
              files={uploadedFiles}
              onFilesChange={handleFilesChange}
              type="drag-drop"
              multiple
              maxFiles={10}
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              helperText="PDF, PNG, JPG, JPEG (max 10MB). Files upload when you click Mark as Completed."
              sx={{
                marginTop: "0px",
              }}
              showFileList
              allowDragDrop
            />
          </Box>

          {/* Fixed bottom button area */}
          <Grid
            container
            justifyContent="flex-end"
            columnGap={1}
            sx={{
              pt: 1,
              pb: 0.5,
              borderTop: uploadedFiles.length > 3 ? "1px solid #E7E9EB" : "none",
              flexShrink: 0,
            }}
          >
            <Button
              variant="contained"
              onClick={handleSubmit(onSubmitCompleted)}
              disabled={
                markCompletedMutation.isPending ||
                isUploading
              }
              sx={{
                backgroundColor: "#173B5B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "9px 20px",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                "&:hover": { backgroundColor: "#0F2A42" },
                "&:disabled": { backgroundColor: "#C1C7D0", color: "#FFFFFF" },
              }}
            >
              <Typography
                variant="buttonLinkAndField3"
                sx={{ color: "#FFFFFF" }}
              >
                Mark as Completed
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </CustomDialog>

      {/* File Size Alert Dialog (shown when any upload > 10MB) */}
      <CustomDialog
        open={alertDialog.open}
        onClose={() => setAlertDialog({ open: false, message: "" })}
        title="Alert"
        width="400px"
        buttonName={[]}
      >
        <Grid container direction="column" gap={2} alignItems="center" sx={{ textAlign: "center", py: 1 }}>
          <Typography variant="body1">{alertDialog.message}</Typography>
          <Button
            variant="contained"
            onClick={() => setAlertDialog({ open: false, message: "" })}
            sx={{
              backgroundColor: "#173B5B",
              color: "#FFFFFF",
              borderRadius: "6px",
              px: 4,
              "&:hover": { backgroundColor: "#0F2A42" },
            }}
          >
            OK
          </Button>
        </Grid>
      </CustomDialog>

      {/* Snackbar for notifications */}
      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />
    </Grid>
  );
};

export default AppointmentsPage;
