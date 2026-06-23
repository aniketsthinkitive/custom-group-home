import React, { useMemo, useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { Avatar, Button, Typography, GlobalStyles, Box } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from "dayjs";
import AddNewAppointmentDrawer from "../../appointments/components/AddNewAppointmentDrawer";
import { useParams } from "react-router-dom";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type DefaultError,
} from "@tanstack/react-query";
import { useMediaUpload } from "../../../hooks/useMediaUpload";
import type { AxiosError } from "axios";
import AppointmentsTable, {
  type AppointmentData,
} from "../../appointments/components/AppointmentsTable";
import ViewAppointmentDrawer from "../../appointments/components/ViewAppointmentDrawer";
import EditAppointmentDrawer from "../../appointments/components/EditAppointmentDrawer";
import ConfirmationPopUp from "../../../components/confirmation-pop-up/confirmation-pop-up";
import Paginator from "../../../components/pagination/pagination";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import CustomInput from "../../../components/custom-input/custom-input";
import {
  CustomFileUpload,
  type FileItem,
} from "../../../components/custom-fileupload";
import {
  listAppointmentsOptions,
  listAppointmentsQueryKey,
  updateAppointmentStatusMutation,
  deleteAppointmentMutation,
  getLeadDetailOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import type { Dayjs } from "dayjs";

interface PaginationInfo {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface ResidentAppointmentsTableProps {
  residentId?: string;
  residentName?: string;
  residentNumericId?: number;
  /** When set, edit/delete/complete/add actions are disabled */
  disabledReason?: string;
}

const ResidentAppointmentsTable: React.FC<ResidentAppointmentsTableProps> = ({
  residentId,
  residentName: residentNameProp,
  residentNumericId: residentNumericIdProp,
  disabledReason,
}) => {
  const isReadOnly = !!disabledReason;
  const params = useParams<{ residentId: string }>();
  const effectiveResidentId = residentId || params.residentId || "";

  const [currentPage, setCurrentPage] = useState(0);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
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
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ERROR_MESSAGE_FILE_TOO_LARGE =
    "The selected file is too large. Please choose a file smaller than 10 MB";

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

  // Use props from parent (ResidentProfilePage) to avoid duplicate API call.
  // Falls back to querying if props not provided (e.g. portal usage).
  const { data: residentResponse } = useQuery({
    ...(getLeadDetailOptions({
      path: { uuid: effectiveResidentId },
    }) as any),
    enabled: !residentNameProp && !!effectiveResidentId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const residentName: string | undefined = useMemo(() => {
    if (residentNameProp) return residentNameProp;
    const data = (residentResponse as any)?.data;
    const preferred = String(
      data?.resident_name ?? data?.full_name ?? "",
    ).trim();
    if (preferred) return preferred;
    const user = data?.user;
    const first = String(user?.first_name ?? "").trim();
    const last = String(user?.last_name ?? "").trim();
    const name = `${first} ${last}`.trim();
    return name || undefined;
  }, [residentNameProp, residentResponse]);

  const residentNumericId: number | undefined = useMemo(() => {
    if (residentNumericIdProp != null) return residentNumericIdProp;
    const id = (residentResponse as any)?.data?.id;
    return typeof id === "number" ? id : undefined;
  }, [residentNumericIdProp, residentResponse]);

  useEffect(() => {
    setCurrentPage(0);
  }, [residentName]);

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter]);

  useEffect(() => {
    document.body.setAttribute("data-resident-appointments", "true");
    return () => {
      document.body.removeAttribute("data-resident-appointments");
    };
  }, []);

  // Fetch appointments using same query/options as appointments module
  const { data: appointmentsResponse, isLoading } = useQuery(
    listAppointmentsOptions({
      query: {
        page: currentPage + 1,
        size: recordsPerPage,
        lead_uuid: effectiveResidentId || residentId,
        status: statusFilter || undefined,
      } as any,
    }) as any,
  );

  // Mark as Completed mutation (all outcome handling is in performCompletion)
  const markCompletedMutation = useMutation<any, AxiosError<DefaultError>, any>(
    {
      ...(updateAppointmentStatusMutation() as any),
    },
  );

  // Delete appointment mutation
  const deleteAppointmentMutationHook = useMutation<
    any,
    AxiosError<DefaultError>,
    any
  >({
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
  const uploadOneAppointmentDocument = async (file: File, appointmentUuid: string) => {
    const result = await uploadMedia(file, {
      objectUuid: appointmentUuid,
      description: "appointment_document",
    });
    return result.id || null;
  };

  const appointments = useMemo(() => {
    if (!appointmentsResponse) return [];
    const responseData = appointmentsResponse as any;
    let data: any[] = [];
    if (
      responseData?.data?.results &&
      Array.isArray(responseData.data.results)
    ) {
      data = responseData.data.results;
    } else if (Array.isArray(responseData?.data)) {
      data = responseData.data;
    } else if (responseData?.data?.content) {
      data = responseData.data.content;
    }
    return data;
  }, [appointmentsResponse]);

  // Pagination info from backend response (fallback to local calculation)
  const paginationInfo: PaginationInfo = useMemo(() => {
    const responseData = appointmentsResponse as any;
    const pagination = responseData?.data?.pagination;
    if (pagination) {
      return {
        totalElements: pagination.total_records || pagination.totalRecords || 0,
        totalPages: pagination.total_pages || pagination.totalPages || 0,
        currentPage,
        pageSize: pagination.size || recordsPerPage,
      };
    }
    const totalElements = appointments.length;
    const totalPages = Math.ceil(totalElements / recordsPerPage) || 0;
    return {
      totalElements,
      totalPages,
      currentPage,
      pageSize: recordsPerPage,
    };
  }, [appointmentsResponse, appointments.length, recordsPerPage, currentPage]);

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

  const handleEdit = (appointment: AppointmentData) => {
    const appointmentWithLead = {
      ...appointment,

      // ✅ MUST be LEAD ID (from Lead Detail API → data.id)
      resident_id: residentNumericId != null ? String(residentNumericId) : "",
      lead: residentNumericId,
      resident_name: appointment.resident_name || residentName || "",
    } as any;

    setSelectedAppointment(appointmentWithLead);
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

  const handleMarkCompleted = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    // Do NOT set confirmAction here — complete dialog is separate from confirmDialogOpen
    setCompleteDialogOpen(true);
    setUploadedFiles([]);
    setCompleteNoteValues(null);
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
      });
    } else if (confirmAction === "earlyCompleted") {
      if (completeNoteValues) {
        performCompletion(completeNoteValues);
      }
    }
  };

  const performCompletion = async (values: { complete_note: string }) => {
    if (!selectedAppointment) return;
    const appointmentUuid = selectedAppointment.uuid;
    setIsUploading(true);
    try {
      await markCompletedMutation.mutateAsync({
        path: { uuid: appointmentUuid },
        body: {
          status: "COMPLETED" as const,
          action_note: values.complete_note.trim(),
        },
      } as any);
      const filesToUpload = uploadedFiles.filter((it) => it.file);
      if (filesToUpload.length > 0) {
        const results = await Promise.allSettled(
          filesToUpload.map((it) => uploadOneAppointmentDocument(it.file!, appointmentUuid))
        );
        const failed = results.filter((r) => r.status === "rejected");
        setSnackbar({
          isOpen: true,
          message:
            failed.length > 0
              ? `Appointment completed, but ${failed.length} document(s) failed to upload.`
              : "Appointment marked as completed successfully!",
          status: failed.length > 0 ? "error" : "success",
        });
      } else {
        setSnackbar({
          isOpen: true,
          message: "Appointment marked as completed successfully!",
          status: "success",
        });
      }
      queryClient.invalidateQueries({ queryKey: listAppointmentsQueryKey() });
      setCompleteDialogOpen(false);
      setConfirmDialogOpen(false);
      setUploadedFiles([]);
      setSelectedAppointment(null);
      setConfirmAction(null);
      setCompleteNoteValues(null);
      reset({ complete_note: "" });
    } catch (err: any) {
      setSnackbar({
        isOpen: true,
        message:
          err?.response?.data?.message ||
          (err instanceof Error ? err.message : "Failed to complete appointment."),
        status: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmitCompleted = async (values: { complete_note: string }) => {
    if (!selectedAppointment) return;
    // guard oversize
    const oversize = uploadedFiles.find((f) => f.file && f.file.size > MAX_FILE_SIZE);
    if (oversize) {
      setAlertDialog({ open: true, message: ERROR_MESSAGE_FILE_TOO_LARGE });
      return;
    }

    // Check if it's an early completion (appointment is in the future)
    const appointmentDate = dayjs(selectedAppointment.appointment_date);
    const appointmentTime = (selectedAppointment as any).appointment_time;
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

  useEffect(() => {
    if (isEditDrawerOpen) {
      document.body.setAttribute("data-resident-edit-lock", "true");
    } else {
      document.body.removeAttribute("data-resident-edit-lock");
    }
  }, [isEditDrawerOpen]);

  // Listen for header button click to open Add New Appointment drawer
  useEffect(() => {
    const handler = () => {
      if (!isReadOnly) setIsAddDrawerOpen(true);
    };
    document.addEventListener(
      "resident:new-appointment",
      handler as EventListener,
    );
    return () => {
      document.removeEventListener(
        "resident:new-appointment",
        handler as EventListener,
      );
    };
  }, [isReadOnly]);

  // Listen for header status filter change
  useEffect(() => {
    const statusHandler = (e: Event) => {
      const anyEvent = e as CustomEvent<string>;
      setStatusFilter(anyEvent.detail || "");
    };
    document.addEventListener(
      "resident:status-filter-change",
      statusHandler as EventListener,
    );
    return () => {
      document.removeEventListener(
        "resident:status-filter-change",
        statusHandler as EventListener,
      );
    };
  }, []);

  return (
    <Grid
      container
      flexDirection="column"
      size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
      sx={{
        backgroundColor: "#FFFFFF",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <GlobalStyles
        styles={{
          /* ================= Existing lock styles (UNCHANGED) ================= */
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

          /* Requested */
          'body[data-resident-appointments="true"] .MuiMenu-paper ul[role="listbox"] li:nth-of-type(2) .MuiTypography-root':
            {
              backgroundColor: "#E3F2FD",
              color: "#1976D2",
              borderRadius: "6px",
              display: "inline-block",
              fontSize: "12px",
              fontWeight: 500,
              padding: "4px 8px",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              textTransform: "uppercase",
            },

          /* Completed */
          'body[data-resident-appointments="true"] .MuiMenu-paper ul[role="listbox"] li:nth-of-type(3) .MuiTypography-root':
            {
              backgroundColor: "#E6F4EA",
              color: "#137333",
              borderRadius: "6px",
              display: "inline-block",
              fontSize: "12px",
              fontWeight: 500,
              padding: "4px 8px",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              textTransform: "uppercase",
            },
        }}
      />

      <Grid
        size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        sx={{
          flex: 1,
          overflow: "auto",
          minHeight: 0,
          "& table thead tr th": { padding: "12px 16px" },
          "& table tbody tr td": { padding: "12px 16px" },
        }}
      >
        {!isLoading && appointments.length === 0 ? (
          <Grid
            container
            alignItems="center"
            justifyContent="center"
            sx={{ height: "100%" }}
          >
            <Typography sx={{ color: "#667085", fontSize: "14px" }}>
              No appointments found
            </Typography>
          </Grid>
        ) : (
          <AppointmentsTable
            data={appointments}
            loading={isLoading}
            onEdit={handleEdit}
            onView={handleView}
            onMarkCompleted={handleMarkCompleted}
            onDelete={handleDelete}
            disabledReason={disabledReason}
            hiddenColumns={["referralId", "groupHome"]}
          />
        )}
      </Grid>

      {!isLoading && appointments.length > 0 && (
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
          sx={{
            mt: "auto",
            flexShrink: 0,
            backgroundColor: "#FFFFFF",
            borderTop: "1px solid #E7E9EB",
            borderRadius: "0px 0px 10px 10px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            px: 2,
            py: 1.5,
          }}
        >
          <Paginator
            page={paginationInfo.currentPage}
            totalPages={paginationInfo.totalPages}
            totalRecord={paginationInfo.totalElements}
            onPageChange={handlePageChange}
            onRecordsPerPageChange={handleRecordsPerPageChange}
            defaultSize={paginationInfo.pageSize}
          />
        </Grid>
      )}

      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />

      <ViewAppointmentDrawer
        open={isViewDrawerOpen}
        appointment={selectedAppointment}
        onClose={handleViewDrawerClose}
        onEdit={handleEdit}
      />

      <EditAppointmentDrawer
        open={isEditDrawerOpen}
        appointment={selectedAppointment}
        onClose={handleEditDrawerClose}
        onSuccess={(message) =>
          setSnackbar({ isOpen: true, message, status: "success" })
        }
        onError={(message) =>
          setSnackbar({ isOpen: true, message, status: "error" })
        }
        disableResidentField={true}
      />

      <ConfirmationPopUp
        open={confirmDialogOpen}
        onClose={handleCancelConfirm}
        onConfirm={handleConfirmAction}
        message={
          confirmAction === "earlyCompleted"
            ? "This appointment is scheduled for a future date. Are you sure you want to mark it as completed early?"
            : confirmAction === "markCompleted"
            ? "Are you sure you want to mark this appointment as completed?"
            : "Are you sure you want to delete this appointment?"
        }
        confirmDisabled={
          confirmAction === "earlyCompleted"
            ? markCompletedMutation.isPending || isUploading
            : confirmAction === "markCompleted"
            ? markCompletedMutation.isPending || isUploading
            : deleteAppointmentMutationHook.isPending
        }
      />
      <CustomDialog
        title={"Complete Appointment"}
        open={completeDialogOpen}
        onClose={() => {
          // Reset all completion state when dialog is closed without submitting
          setCompleteDialogOpen(false);
          setSelectedAppointment(null);
          setConfirmAction(null);
          setCompleteNoteValues(null);
          setUploadedFiles([]);
          reset({ complete_note: "" });
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
          {/* Scrollable content area (prevents button from moving downward) */}
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
              <Avatar sx={{ width: 30, height: 30 }}>
                {(selectedAppointment?.resident_name || "U")
                  .split(" ")
                  .map((w) => w?.[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Avatar>
              <Typography
                variant="buttonLinkAndField3"
                sx={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                {selectedAppointment?.resident_name || "-"}

                <span style={{ color: "#667085", marginLeft: 8 }}>
                  {(selectedAppointment as any)?.referral_number || ""}
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
              onFilesChange={(files) => {
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
              }}
              type="drag-drop"
              multiple
              maxFiles={10}
              accept="application/pdf,image/png,image/jpeg,image/jpg"
              helperText="PDF, PNG, JPG, JPEG (max 10MB). Files upload when you click Mark as Completed."
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
              disabled={markCompletedMutation.isPending || isUploading}
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
              <Typography variant="buttonLinkAndField3" sx={{ color: "#FFFFFF" }}>
                Mark as Completed
              </Typography>
            </Button>
          </Grid>
        </Grid>
      </CustomDialog>
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
      <AddNewAppointmentDrawer
        open={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSuccess={(message) =>
          setSnackbar({ isOpen: true, message, status: "success" })
        }
        onError={(message) =>
          setSnackbar({ isOpen: true, message, status: "error" })
        }
        defaultResidentId={effectiveResidentId}
        defaultResidentName={residentName || ""}
        lockResident={true}
      />
    </Grid>
  );
};

export default ResidentAppointmentsTable;
