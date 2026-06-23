import React, { useState, useMemo, useCallback } from "react";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Radio,
  Chip,
  Tooltip,
  Checkbox,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import ShareIcon from "@mui/icons-material/Share";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import dayjs from "dayjs";
import CustomButton from "../../../../components/custom-buttons/custom-buttons";
import TableSkeleton from "../../../../components/common-table/TableSkeleton";
import CustomDialog from "../../../../components/custom-dialog/custom-dialog";
import {
  listConsentFormsOptions,
  deleteConsentFormMutation,
  getConsentFormDetailOptions,
  shareConsentFormMutation,
} from "../../../../sdk/@tanstack/react-query.gen";
import type { AxiosError } from "axios";
import CommonSnackbar from "../../../../components/common-snackbar/common-snackbar";
import ConfirmationPopUp from "../../../../components/confirmation-pop-up/confirmation-pop-up";
import { generateBlankROIPrintHTML } from "./hipaa-release/generateBlankROIPrintHTML";
import { generateNHResidencyPrintHTML } from "./nh-residency-agreement/generateNHResidencyPrintHTML";
import { generateHouseRulesPrintHTML } from "./house-rules/generateHouseRulesPrintHTML";
import { printFormInPage } from "./printFormInPage";
import { invalidateLeadConsentForms } from "../../utils/queryInvalidation";

/* ================= TYPES ================= */

export interface ContactDetails {
  name: string;
  email: string;
  phone: string;
}

export interface LeadFormsTableProps {
  leadUuid?: string;
  leadName?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onFillForm?: (
    formId: number,
    formName: string,
    consentUuid?: string,
    consentFormStatus?: string,
  ) => void;
  onView?: (formId: number, formName: string, consentUuid?: string) => void;
  searchQuery?: string;
  isTabActive?: boolean;
  signerType?: "GUARDIAN" | "AGENT";
  guardianDetails?: ContactDetails;
  agentDetails?: ContactDetails;
  isGuardianAssigned?: boolean;
  isAgentAssigned?: boolean;
  /** When set, fill/share actions are disabled and this text shows as a tooltip */
  disabledReason?: string;
}

interface LeadFormRow {
  id: number;
  formName: string;
  consentFormUuid?: string;
  consentFormStatus?: string;
  canView?: boolean;
  canDelete?: boolean;
  lastUpdated?: string | null;
  isShared?: boolean;
}

/* ================= STATIC DATA ================= */

const leadFormsData: Omit<
  LeadFormRow,
  | "consentFormUuid"
  | "consentFormStatus"
  | "canView"
  | "canDelete"
  | "lastUpdated"
>[] = [
  { id: 1, formName: "NH Residency Agreement" },
  { id: 2, formName: "CAFC House rules" },
  { id: 3, formName: "Blank ROI" },
];

/* ================= FORM CODE MAPPING ================= */

const formNameToCodeMap: Record<string, string> = {
  "NH Residency Agreement": "NH_RESIDENCY_AGREEMENT",
  "CAFC House rules": "CAFC_HOUSE_RULES",
  "Blank ROI": "BLANK_ROI",
};

/* ================= DATE FORMATTING ================= */

const formatLastUpdated = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";

  try {
    const date = dayjs(dateString);
    if (!date.isValid()) return "—";

    const formattedDate = date.format("MM/DD/YYYY");
    const formattedTime = date.format("h:mm A");

    return `${formattedDate}, ${formattedTime}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};

/* ================= TABLE HEADERS ================= */

const headerCellSx = {
  fontWeight: 600,
  backgroundColor: "#F2F7FA",
  color: "#30353A",
  borderBottom: "1px solid #E3ECEF",
  fontSize: "13.5px",
  fontFamily: '"Helvetica Neue", Arial, sans-serif',
  lineHeight: "1.2",
  py: 1.2,
};

const TABLE_HEADERS = [
  { label: "", align: "center" as const, width: 48 }, // selection checkbox
  { label: "Sr. no", align: "center" as const, width: 60 },
  { label: "Document Name", align: "left" as const, width: "35%" },
  { label: "Document", align: "left" as const, width: 160 },
  { label: "Status", align: "center" as const, width: 120 },
  { label: "Last Updated", align: "left" as const, width: 180 },
  { label: "Action", align: "center" as const, width: 70 },
];

/* ================= COMPONENT ================= */

const LeadFormsTable: React.FC<LeadFormsTableProps> = ({
  leadUuid,
  leadName,
  page = 0,
  pageSize = 10,
  onFillForm,
  onView,
  searchQuery = "",
  isTabActive = false,
  signerType,
  guardianDetails,
  agentDetails,
  isGuardianAssigned = true,
  isAgentAssigned = true,
  disabledReason,
}) => {
  const isDisabled = !!disabledReason;
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize] = useState(pageSize);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [formToDelete, setFormToDelete] = useState<
    | (LeadFormRow & { consentFormUuid?: string; consentFormStatus?: string })
    | null
  >(null);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  // 3-dot menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<LeadFormRow | null>(null);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareFormRow, setShareFormRow] = useState<LeadFormRow | null>(null);
  const [shareRecipient, setShareRecipient] = useState<"guardian" | "agent">(
    "guardian",
  );
  // When true, the share dialog shares the checkbox-selected forms at once
  const [shareAllMode, setShareAllMode] = useState(false);
  const [isShareAllProcessing, setIsShareAllProcessing] = useState(false);
  // Checkbox selection of shareable forms (keyed by consent form uuid)
  const [selectedFormUuids, setSelectedFormUuids] = useState<Set<string>>(
    () => new Set(),
  );
  // Forms optimistically marked as shared while the share request (PDF
  // generation + email) runs in the background; removed again on failure
  const [optimisticSharedUuids, setOptimisticSharedUuids] = useState<Set<string>>(
    () => new Set(),
  );

  const queryClient = useQueryClient();

  // Helper function to extract backend message
  const getBackendMessage = (data: unknown): string | undefined => {
    const responseData = data as Record<string, unknown>;
    const nestedData = responseData?.data as Record<string, unknown> | undefined;
    return (
      (responseData?.message as string) ??
      (nestedData?.message as string) ??
      (responseData?.detail as string) ??
      undefined
    );
  };

  // Helper function to extract error message
  const getErrorMessage = (error: unknown): string | undefined => {
    const err = error as AxiosError<Record<string, unknown>>;
    const respData = err?.response?.data as Record<string, unknown> | undefined;
    const errData = err?.data as Record<string, unknown> | undefined;
    return (
      (respData?.message as string) ??
      (respData?.error as string) ??
      (respData?.detail as string) ??
      (errData?.message as string) ??
      (errData?.error as string) ??
      (errData?.detail as string) ??
      undefined
    );
  };

  // Fetch consent forms from API - now filtered by signer_type
  const consentListQuery = useQuery({
    ...listConsentFormsOptions({
      query: {
        resident_uuid: leadUuid,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(signerType ? { signer_type: signerType } : {}),
      },
    }),
    enabled: !!leadUuid && isTabActive,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    select: (data: Record<string, unknown>) => {
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.results && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    },
  });

  const { data: consentFormsResponse, refetch: refetchConsentForms } =
    consentListQuery;

  // Delete consent form mutation
  const deleteConsentFormMutationHook = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(deleteConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      if (backendMessage) {
        setSnackbar({
          isOpen: true,
          message: backendMessage,
          status: "success",
        });
      }

      if (leadUuid) {
        invalidateLeadConsentForms(queryClient, leadUuid);
        refetchConsentForms();
      }
    },
    onError: (error: AxiosError<Record<string, unknown>>) => {
      const errorMessage = getErrorMessage(error);
      if (errorMessage) {
        setSnackbar({
          isOpen: true,
          message: errorMessage,
          status: "error",
        });
      }
    },
  });

  // Share consent form mutation
  const shareConsentFormMutationHook = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(shareConsentFormMutation() as any),
    onSuccess: (data: unknown) => {
      const backendMessage = getBackendMessage(data);
      setSnackbar({
        isOpen: true,
        message: backendMessage || "Form shared successfully",
        status: "success",
      });
      setShareDialogOpen(false);
      setShareFormRow(null);

      // Refetch consent form list so isShared updates immediately
      if (leadUuid) {
        invalidateLeadConsentForms(queryClient, leadUuid);
        refetchConsentForms();
      }
    },
    onError: (error: AxiosError<Record<string, unknown>>) => {
      const errorMessage = getErrorMessage(error);
      setSnackbar({
        isOpen: true,
        message: errorMessage || "Failed to share form",
        status: "error",
      });
    },
  });

  // Create a map of form_code to API data for fast lookup
  const apiFormMap = useMemo(() => {
    if (!consentFormsResponse || !Array.isArray(consentFormsResponse)) {
      return new Map();
    }
    const formMap = new Map();
    consentFormsResponse.forEach((item: Record<string, unknown>) => {
      const existing = formMap.get(item.form_code);
      if (!existing) {
        formMap.set(item.form_code, item);
      } else {
        const existingDate = existing.updated_at || existing.created_at;
        const currentDate = item.updated_at || item.created_at;
        if (
          currentDate &&
          (!existingDate || dayjs(currentDate).isAfter(dayjs(existingDate)))
        ) {
          formMap.set(item.form_code, item);
        }
      }
    });
    return formMap;
  }, [consentFormsResponse]);

  // Enrich static data with API data
  const enrichedData = useMemo(() => {
    return leadFormsData.map((staticForm) => {
      const formCode = formNameToCodeMap[staticForm.formName];
      const apiForm = formCode ? apiFormMap.get(formCode) : null;

      if (!apiForm) {
        const staticFormCopy: LeadFormRow = { ...staticForm };
        staticFormCopy.canView = false;
        staticFormCopy.canDelete = false;
        staticFormCopy.lastUpdated = "—";
        return staticFormCopy;
      }

      const enriched: LeadFormRow = { ...staticForm };
      enriched.consentFormUuid = apiForm.uuid;
      enriched.consentFormStatus = apiForm.status;

      const isFormActive =
        apiForm.status === "COMPLETED" || apiForm.status === "DRAFT" || apiForm.status === "SIGNED";
      enriched.canView = isFormActive;
      enriched.canDelete = isFormActive;

      const dateToUse = apiForm.updated_at ?? apiForm.created_at ?? null;
      if (dateToUse) {
        enriched.lastUpdated = formatLastUpdated(dateToUse);
      } else {
        enriched.lastUpdated = "—";
      }

      enriched.isShared =
        !!apiForm.shared_at || optimisticSharedUuids.has(apiForm.uuid as string);

      return enriched;
    });
  }, [apiFormMap, optimisticSharedUuids]);

  // Forms eligible for bulk sharing: filled (COMPLETED) and not yet shared
  const shareableForms = useMemo(
    () =>
      enrichedData.filter(
        (form) =>
          form.consentFormUuid &&
          form.consentFormStatus === "COMPLETED" &&
          !form.isShared,
      ),
    [enrichedData],
  );

  // Checkbox-selected forms, restricted to ones still shareable (a form that
  // got shared/signed in the meantime silently drops out of the selection)
  const selectedShareForms = useMemo(
    () =>
      shareableForms.filter(
        (form) =>
          form.consentFormUuid && selectedFormUuids.has(form.consentFormUuid),
      ),
    [shareableForms, selectedFormUuids],
  );

  const toggleFormSelection = useCallback((uuid: string) => {
    setSelectedFormUuids((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  }, []);

  const toggleSelectAllShareable = useCallback(() => {
    setSelectedFormUuids((prev) => {
      const allSelected =
        shareableForms.length > 0 &&
        shareableForms.every(
          (f) => f.consentFormUuid && prev.has(f.consentFormUuid),
        );
      if (allSelected) return new Set();
      return new Set(
        shareableForms
          .map((f) => f.consentFormUuid)
          .filter((u): u is string => !!u),
      );
    });
  }, [shareableForms]);

  // ---- Menu handlers ----
  const handleMenuClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, row: LeadFormRow) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setMenuRow(row);
    },
    [],
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setMenuRow(null);
  }, []);

  // Handle view form
  const handleView = useCallback(
    (row: LeadFormRow) => {
      if (!row.consentFormUuid) {
        setSnackbar({
          isOpen: true,
          message: "Form data not available for viewing",
          status: "error",
        });
        return;
      }
      onView?.(row.id, row.formName, row.consentFormUuid);
      handleMenuClose();
    },
    [onView, handleMenuClose],
  );

  // Build print HTML for a given form (returns null if no template available)
  const buildPrintHTML = useCallback(
    (formName: string, formJson: Record<string, unknown>): string | null => {
      switch (formName) {
        case "Blank ROI":
          return generateBlankROIPrintHTML(formJson, leadName);
        case "NH Residency Agreement":
          return generateNHResidencyPrintHTML(formJson, leadName);
        case "CAFC House rules":
          return generateHouseRulesPrintHTML(formJson, leadName);
        default:
          return null;
      }
    },
    [leadName],
  );

  // Forms that have a print template even without saved data
  const hasBlankTemplate = (formName: string): boolean =>
    formName === "Blank ROI" ||
    formName === "NH Residency Agreement" ||
    formName === "CAFC House rules";

  // Handle print form — prints inside a hidden iframe (no new tab)
  const handlePrint = useCallback(
    async (row: LeadFormRow) => {
      handleMenuClose();

      // If no saved data but we have a blank template, print it
      if (!row.consentFormUuid && hasBlankTemplate(row.formName)) {
        const html = buildPrintHTML(row.formName, {});
        if (html) {
          printFormInPage(html);
          return;
        }
      }

      if (!row.consentFormUuid) {
        setSnackbar({
          isOpen: true,
          message: "Form data not available for printing",
          status: "error",
        });
        return;
      }

      try {
        const formData = await queryClient.fetchQuery({
          ...getConsentFormDetailOptions({
            path: { uuid: row.consentFormUuid },
            query: { history: false },
          }),
        });

        const responseData =
          (formData as Record<string, unknown>)?.data ?? formData;
        const rd = responseData as Record<string, unknown>;
        const entries = (rd?.entries as Record<string, unknown>[]) || [];
        const latestEntry = entries[0] || null;
        const formJson = (
          (latestEntry as Record<string, unknown>)?.form_json ||
          rd?.form_json ||
          {}
        ) as Record<string, unknown>;

        // Use formatted template if available
        const html = buildPrintHTML(row.formName, formJson);
        if (html) {
          printFormInPage(html);
          return;
        }

        // Fallback for forms without a dedicated template
        const fallbackHtml = `
        <html>
          <head>
            <title>${row.formName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #0A2E45; }
              .field { margin-bottom: 10px; }
              .label { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${row.formName}</h1>
            <p><strong>Lead Name:</strong> ${leadName || "N/A"}</p>
            <hr>
            <pre>${JSON.stringify(formJson, null, 2)}</pre>
          </body>
        </html>`;
        printFormInPage(fallbackHtml);
      } catch (error) {
        console.error("Error printing form:", error);
        setSnackbar({
          isOpen: true,
          message: "Failed to load form data for printing",
          status: "error",
        });
      }
    },
    [queryClient, leadName, handleMenuClose, buildPrintHTML],
  );

  // Handle share - auto-select recipient based on current tab's signerType
  const handleShareClick = useCallback(
    (row: LeadFormRow) => {
      if (row.isShared) return; // Prevent duplicate sharing
      handleMenuClose();
      setShareAllMode(false);
      setShareFormRow(row);
      setShareRecipient(signerType === "AGENT" ? "agent" : "guardian");
      setShareDialogOpen(true);
    },
    [handleMenuClose, signerType],
  );

  // Handle "Share Selected" - share the checkbox-selected forms in one go
  const handleShareAllClick = useCallback(() => {
    if (selectedShareForms.length === 0) return;
    setShareAllMode(true);
    setShareFormRow(null);
    setShareRecipient(signerType === "AGENT" ? "agent" : "guardian");
    setShareDialogOpen(true);
  }, [selectedShareForms, signerType]);

  const [isShareProcessing, setIsShareProcessing] = useState(false);

  const handleShareConfirm = useCallback(async () => {
    if (!shareFormRow?.consentFormUuid) return;

    const recipient =
      shareRecipient === "guardian" ? guardianDetails : agentDetails;
    if (!recipient?.email) {
      setSnackbar({
        isOpen: true,
        message: `No email found for selected ${shareRecipient}`,
        status: "error",
      });
      return;
    }

    const formUuid = shareFormRow.consentFormUuid;
    const formName = shareFormRow.formName;

    // Close the dialog immediately and mark the form as shared optimistically —
    // the PDF generation + email on the backend can take several seconds, and
    // the user shouldn't be stuck watching a spinner. Rolled back on failure.
    setShareDialogOpen(false);
    setShareFormRow(null);
    setOptimisticSharedUuids((prev) => new Set(prev).add(formUuid));

    try {
      // Fetch form data to build HTML for backend PDF generation
      let htmlContent: string | undefined;
      try {
        const formData = await queryClient.fetchQuery({
          ...getConsentFormDetailOptions({
            path: { uuid: formUuid },
            query: { history: false },
          }),
        });

        const responseData =
          (formData as Record<string, unknown>)?.data ?? formData;
        const rd = responseData as Record<string, unknown>;
        const entries = (rd?.entries as Record<string, unknown>[]) || [];
        const latestEntry = entries[0] || null;
        const formJson = (
          (latestEntry as Record<string, unknown>)?.form_json ||
          rd?.form_json ||
          {}
        ) as Record<string, unknown>;

        htmlContent = buildPrintHTML(formName, formJson) ?? undefined;
      } catch (fetchError) {
        console.error("Failed to fetch form data:", fetchError);
      }

      // Single API call: backend generates PDF + stores in S3 + sends email
      shareConsentFormMutationHook.mutate(
        {
          path: { uuid: formUuid },
          body: {
            recipient_email: recipient.email,
            recipient_name: recipient.name || shareRecipient,
            ...(htmlContent ? { html_content: htmlContent } : {}),
          },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        {
          onError: () => {
            // Roll back the optimistic "shared" state for this form
            setOptimisticSharedUuids((prev) => {
              const next = new Set(prev);
              next.delete(formUuid);
              return next;
            });
          },
        },
      );
    } catch (error) {
      console.error("Share failed:", error);
      setOptimisticSharedUuids((prev) => {
        const next = new Set(prev);
        next.delete(formUuid);
        return next;
      });
      setSnackbar({
        isOpen: true,
        message: "Failed to share form. Please try again.",
        status: "error",
      });
    }
  }, [
    shareFormRow,
    shareRecipient,
    guardianDetails,
    agentDetails,
    shareConsentFormMutationHook,
    queryClient,
    buildPrintHTML,
  ]);

  // Share ALL filled & unshared forms sequentially, then show one summary.
  // Uses the raw mutation function (not the hook) so the per-form
  // success/error side effects don't fire for every form in the batch.
  const handleShareAllConfirm = useCallback(async () => {
    const formsToShare = selectedShareForms;
    if (formsToShare.length === 0) return;

    const recipientKey = signerType === "AGENT" ? "agent" : "guardian";
    const recipient =
      recipientKey === "guardian" ? guardianDetails : agentDetails;
    if (!recipient?.email) {
      setSnackbar({
        isOpen: true,
        message: `No email found for selected ${recipientKey}`,
        status: "error",
      });
      return;
    }

    // Close the dialog immediately and mark the selected forms as shared
    // optimistically — sharing N forms sequentially (PDF + email each) can
    // take a long time. Failed forms are rolled back below.
    setShareDialogOpen(false);
    setShareAllMode(false);
    setOptimisticSharedUuids((prev) => {
      const next = new Set(prev);
      formsToShare.forEach((f) => {
        if (f.consentFormUuid) next.add(f.consentFormUuid);
      });
      return next;
    });
    // Clear the checkbox selection — those rows now show as shared
    setSelectedFormUuids(new Set());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shareFormRequest = (shareConsentFormMutation() as any).mutationFn;
    const failedForms: string[] = [];
    const failedUuids: string[] = [];

    for (const form of formsToShare) {
      if (!form.consentFormUuid) continue;
      try {
        let htmlContent: string | undefined;
        try {
          const formData = await queryClient.fetchQuery({
            ...getConsentFormDetailOptions({
              path: { uuid: form.consentFormUuid },
              query: { history: false },
            }),
          });

          const responseData =
            (formData as Record<string, unknown>)?.data ?? formData;
          const rd = responseData as Record<string, unknown>;
          const entries = (rd?.entries as Record<string, unknown>[]) || [];
          const latestEntry = entries[0] || null;
          const formJson = (
            (latestEntry as Record<string, unknown>)?.form_json ||
            rd?.form_json ||
            {}
          ) as Record<string, unknown>;

          htmlContent = buildPrintHTML(form.formName, formJson) ?? undefined;
        } catch (fetchError) {
          console.error("Failed to fetch form data:", fetchError);
        }

        await shareFormRequest({
          path: { uuid: form.consentFormUuid },
          body: {
            recipient_email: recipient.email,
            recipient_name: recipient.name || recipientKey,
            ...(htmlContent ? { html_content: htmlContent } : {}),
          },
        });
      } catch (error) {
        console.error(`Share failed for ${form.formName}:`, error);
        failedForms.push(form.formName);
        failedUuids.push(form.consentFormUuid);
      }
    }

    // Roll back the optimistic "shared" state for any forms that failed
    if (failedUuids.length > 0) {
      setOptimisticSharedUuids((prev) => {
        const next = new Set(prev);
        failedUuids.forEach((u) => next.delete(u));
        return next;
      });
    }

    const sharedCount = formsToShare.length - failedForms.length;
    if (failedForms.length === 0) {
      setSnackbar({
        isOpen: true,
        message: `${sharedCount} form${sharedCount === 1 ? "" : "s"} shared successfully`,
        status: "success",
      });
    } else if (sharedCount > 0) {
      setSnackbar({
        isOpen: true,
        message: `Shared ${sharedCount} of ${formsToShare.length} forms. Failed: ${failedForms.join(", ")}`,
        status: "error",
      });
    } else {
      setSnackbar({
        isOpen: true,
        message: "Failed to share forms. Please try again.",
        status: "error",
      });
    }

    // Refetch consent form list so isShared updates immediately
    if (leadUuid) {
      invalidateLeadConsentForms(queryClient, leadUuid);
      refetchConsentForms();
    }
  }, [
    selectedShareForms,
    signerType,
    guardianDetails,
    agentDetails,
    queryClient,
    buildPrintHTML,
    leadUuid,
    refetchConsentForms,
  ]);

  const filteredData = enrichedData.filter((form) => {
    if (!searchQuery) return true;
    const searchTerm = searchQuery.toLowerCase();
    return form.formName.toLowerCase().includes(searchTerm);
  });

  // Pagination variables (totalRecords, totalPages, handlePageChange, handlePageSizeChange) removed — pagination is commented out
  const startIndex = currentPage * currentPageSize;
  const currentData = filteredData.slice(
    startIndex,
    startIndex + currentPageSize,
  );

  React.useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery]);

  const handleFillForm = (formId: number, formName: string) => {
    const form = enrichedData.find((f) => f.id === formId);
    onFillForm?.(
      formId,
      formName,
      form?.consentFormUuid,
      form?.consentFormStatus,
    );
  };

  // While the consent-forms API is still loading, show the shared table
  // skeleton instead of the static "Fill Form" rows that would otherwise
  // flash before flipping to their filled/draft state.
  if (consentListQuery.isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <TableSkeleton
          headers={TABLE_HEADERS.map((header, index) => ({
            id: String(index),
            label: header.label,
            width:
              typeof header.width === "number"
                ? `${header.width}px`
                : header.width,
          }))}
          rowCount={6}
          hasCheckbox={false}
          hasAvatar={false}
          hasActions={false}
        />
      </Box>
    );
  }

  const recipientAssigned =
    signerType === "AGENT" ? isAgentAssigned : isGuardianAssigned;
  const recipientEmail =
    signerType === "AGENT" ? agentDetails?.email : guardianDetails?.email;
  const recipientLabel = signerType === "AGENT" ? "Area Agency" : "Guardian";
  // Forms already sent to the recipient (shared, or shared & signed)
  const sharedFormsCount = enrichedData.filter(
    (form) =>
      form.consentFormUuid &&
      (form.isShared || form.consentFormStatus === "SIGNED"),
  ).length;
  const shareAllDisabledReason = isDisabled
    ? disabledReason || ""
    : shareableForms.length === 0
      ? sharedFormsCount === enrichedData.length
        ? "All forms have already been shared"
        : sharedFormsCount > 0
          ? "All filled forms have already been shared"
          : "No filled forms available to share"
      : !recipientAssigned
        ? `${recipientLabel} not assigned`
        : !recipientEmail
          ? `No email available for ${recipientLabel}`
          : selectedShareForms.length === 0
            ? "Select forms to share using the checkboxes"
            : "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFFFFF",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Share Selected - shares the checkbox-selected forms to the tab's recipient */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
        <Tooltip
          title={shareAllDisabledReason}
          disableHoverListener={!shareAllDisabledReason}
        >
          <span>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={handleShareAllClick}
              disabled={!!shareAllDisabledReason}
              sx={{ height: "32px", fontSize: "12px" }}
            >
              <ShareIcon sx={{ fontSize: 16, mr: 0.75 }} />
              Share Selected
              {selectedShareForms.length > 0
                ? ` (${selectedShareForms.length})`
                : ""}
            </CustomButton>
          </span>
        </Tooltip>
      </Box>
      <TableContainer
        sx={{
          flex: 1,
          border: "1px solid #E3ECEF",
          borderRadius: "6px",
          overflowX: "auto",
          overflowY: "auto",
          backgroundColor: "#FFFFFF",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Table stickyHeader sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              {TABLE_HEADERS.map((header, headerIndex) => (
                <TableCell
                  key={header.label || `header-${headerIndex}`}
                  sx={{
                    ...headerCellSx,
                    textAlign: header.align,
                    ...(header.width ? { width: header.width } : {}),
                  }}
                >
                  {headerIndex === 0 ? (
                    // Select-all checkbox for shareable (filled & unshared) forms
                    <Checkbox
                      size="small"
                      sx={{ p: 0.5 }}
                      disabled={shareableForms.length === 0}
                      checked={
                        shareableForms.length > 0 &&
                        selectedShareForms.length === shareableForms.length
                      }
                      indeterminate={
                        selectedShareForms.length > 0 &&
                        selectedShareForms.length < shareableForms.length
                      }
                      onChange={toggleSelectAllShareable}
                    />
                  ) : (
                    header.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {currentData.map((row, index) => {
              const isSigned = row.consentFormStatus === "SIGNED";
              const isFilled = row.consentFormStatus === "COMPLETED" || isSigned;

              const isRowShareable =
                !!row.consentFormUuid &&
                row.consentFormStatus === "COMPLETED" &&
                !row.isShared;

              return (
                <TableRow key={row.id}>
                  {/* Selection checkbox — only for filled & unshared forms */}
                  <TableCell
                    sx={{
                      textAlign: "center",
                      py: 1.5,
                      width: 48,
                      borderBottom: "1px solid #EEF1F4",
                    }}
                  >
                    <Tooltip
                      title={
                        isRowShareable
                          ? ""
                          : row.isShared || isSigned
                            ? "Already shared"
                            : "Fill the form before sharing"
                      }
                      disableHoverListener={isRowShareable}
                    >
                      <span>
                        <Checkbox
                          size="small"
                          sx={{ p: 0.5 }}
                          disabled={!isRowShareable}
                          checked={
                            !!row.consentFormUuid &&
                            selectedFormUuids.has(row.consentFormUuid)
                          }
                          onChange={() =>
                            row.consentFormUuid &&
                            toggleFormSelection(row.consentFormUuid)
                          }
                        />
                      </span>
                    </Tooltip>
                  </TableCell>

                  {/* Sr no */}
                  <TableCell
                    sx={{
                      textAlign: "center",
                      fontSize: "13px",
                      py: 1.5,
                      width: 70,
                      borderBottom: "1px solid #EEF1F4",
                    }}
                  >
                    {startIndex + index + 1}
                  </TableCell>

                  {/* Document Name */}
                  <TableCell
                    sx={{
                      textAlign: "left",
                      fontSize: "13px",
                      py: 1.5,
                      borderBottom: "1px solid #EEF1F4",
                      fontWeight: 500,
                      color: "#25272c",
                    }}
                  >
                    {row.formName}
                  </TableCell>

                  {/* Document - Fill Form Button */}
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      py: 1.5,
                      borderBottom: "1px solid #EEF1F4",
                    }}
                  >
                    {isFilled ? (
                      <Grid container alignItems="center" spacing={1}>
                        <CheckCircleIcon
                          sx={{ fontSize: 18, color: "#2E7D32" }}
                        />
                        <Typography
                          sx={{
                            fontSize: "13px",
                            color: "#2E7D32",
                            fontWeight: 500,
                          }}
                        >
                          Filled
                        </Typography>
                      </Grid>
                    ) : row.consentFormStatus === "DRAFT" ? (
                      <Tooltip title={disabledReason || ""} disableHoverListener={!isDisabled}>
                        <span>
                          <CustomButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleFillForm(row.id, row.formName)}
                            disabled={isDisabled}
                            sx={{
                              minWidth: "100px",
                              height: "32px",
                              fontSize: "12px",
                              borderColor: "#0A2E45",
                              color: "#0A2E45",
                            }}
                          >
                            Draft
                          </CustomButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip title={disabledReason || ""} disableHoverListener={!isDisabled}>
                        <span>
                          <CustomButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleFillForm(row.id, row.formName)}
                            disabled={isDisabled}
                            sx={{
                              minWidth: "100px",
                              height: "32px",
                              fontSize: "12px",
                              borderColor: "#0A2E45",
                              color: "#0A2E45",
                            }}
                          >
                            Fill Form
                          </CustomButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* Status - Signed/Unsigned */}
                  <TableCell
                    sx={{
                      textAlign: "center",
                      fontSize: "13px",
                      py: 1.5,
                      borderBottom: "1px solid #EEF1F4",
                      width: 120,
                    }}
                  >
                    <Chip
                      label={isSigned ? "Signed" : "Unsigned"}
                      size="small"
                      sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        height: "24px",
                        ...(isSigned
                          ? {
                              backgroundColor: "#E8F5E9",
                              color: "#2E7D32",
                            }
                          : {
                              backgroundColor: "#FFF3E0",
                              color: "#E65100",
                            }),
                      }}
                    />
                  </TableCell>

                  {/* Last Updated */}
                  <TableCell
                    sx={{
                      textAlign: "left",
                      fontSize: "13px",
                      py: 1.5,
                      borderBottom: "1px solid #EEF1F4",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Typography sx={{ fontSize: "13px", color: "#25272c", whiteSpace: "nowrap" }}>
                      {row.lastUpdated || "\u2014"}
                    </Typography>
                  </TableCell>

                  {/* Action - 3-dot menu */}
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      py: 1.5,
                      borderBottom: "1px solid #EEF1F4",
                      textAlign: "center",
                    }}
                  >
                    <IconButton
                      onClick={(event) => handleMenuClick(event, row)}
                      sx={{
                        padding: "4px",
                        borderRadius: "6px",
                        "&:hover": {
                          backgroundColor: "rgba(67, 147, 34, 0.04)",
                        },
                      }}
                    >
                      <MoreVertIcon
                        sx={{
                          width: 18,
                          height: 18,
                          color: "#2C2D2C",
                        }}
                      />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
{/* 
      {/* Pagination - fixed at bottom 
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #E7E9EB",
          mt: "auto",
          flexShrink: 0,
        }}
      >
        <Paginator
          page={currentPage}
          totalPages={totalPages}
          totalRecord={totalRecords}
          onPageChange={handlePageChange}
          onRecordsPerPageChange={handlePageSizeChange}
          defaultSize={currentPageSize}
        />
      </Box> */}

      {/* 3-dot Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "#FFFFFF",
              border: "1px solid #DFE5E2",
              borderRadius: "6px",
              boxShadow:
                "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
              padding: "4px 0",
              minWidth: "160px",
            },
          },
        }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => menuRow && handleView(menuRow)}
          disabled={!menuRow?.canView}
          sx={{ padding: "10px 14px", gap: "8px" }}
        >
          <ListItemIcon sx={{ minWidth: "18px !important" }}>
            <VisibilityIcon
              sx={{
                width: 18,
                height: 18,
                color: menuRow?.canView ? "#2C2D2C" : "#B0B0B0",
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary="View"
            slotProps={{
              primary: {
                sx: {
                  fontSize: "13px",
                  fontWeight: 500,
                  color: menuRow?.canView ? "#2C2D2C" : "#B0B0B0",
                },
              },
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => menuRow && handlePrint(menuRow)}
          disabled={
            !menuRow?.canView && !hasBlankTemplate(menuRow?.formName ?? "")
          }
          sx={{ padding: "10px 14px", gap: "8px" }}
        >
          <ListItemIcon sx={{ minWidth: "18px !important" }}>
            <PrintIcon
              sx={{
                width: 18,
                height: 18,
                color:
                  menuRow?.canView || hasBlankTemplate(menuRow?.formName ?? "")
                    ? "#2C2D2C"
                    : "#B0B0B0",
              }}
            />
          </ListItemIcon>
          <ListItemText
            primary="Print"
            slotProps={{
              primary: {
                sx: {
                  fontSize: "13px",
                  fontWeight: 500,
                  color:
                    menuRow?.canView ||
                    hasBlankTemplate(menuRow?.formName ?? "")
                      ? "#2C2D2C"
                      : "#B0B0B0",
                },
              },
            }}
          />
        </MenuItem>
        <Tooltip
          title={
            menuRow?.isShared
              ? "Document already shared"
              : menuRow?.consentFormStatus === "DRAFT"
              ? "Complete the form before sharing"
              : isDisabled
              ? (disabledReason || "")
              : ""
          }
          disableHoverListener={
            !menuRow?.isShared &&
            !isDisabled &&
            menuRow?.consentFormStatus !== "DRAFT"
          }
          placement="left"
        >
          <span>
            <MenuItem
              onClick={() => menuRow && !menuRow.isShared && handleShareClick(menuRow)}
              disabled={
                isDisabled ||
                !menuRow?.canView ||
                menuRow?.consentFormStatus === "SIGNED" ||
                menuRow?.consentFormStatus === "DRAFT" ||
                !menuRow?.consentFormStatus ||
                Boolean(menuRow?.isShared)
              }
              sx={{ padding: "10px 14px", gap: "8px" }}
            >
              <ListItemIcon sx={{ minWidth: "18px !important" }}>
                <ShareIcon
                  sx={{
                    width: 18,
                    height: 18,
                    color:
                      !isDisabled &&
                      menuRow?.canView &&
                      menuRow?.consentFormStatus === "COMPLETED" &&
                      !menuRow?.isShared
                        ? "#2C2D2C"
                        : "#B0B0B0",
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary="Share"
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: "13px",
                      fontWeight: 500,
                      color:
                        !isDisabled &&
                        menuRow?.canView &&
                        menuRow?.consentFormStatus === "COMPLETED" &&
                        !menuRow?.isShared
                          ? "#2C2D2C"
                          : "#B0B0B0",
                    },
                  },
                }}
              />
            </MenuItem>
          </span>
        </Tooltip>
      </Menu>

      {/* Share Dialog */}
      <CustomDialog
        open={shareDialogOpen}
        onClose={() => {
          setShareDialogOpen(false);
          setShareFormRow(null);
          setShareAllMode(false);
        }}
        title={
          <Typography variant="h6" sx={{ fontSize: "18px", fontWeight: 600 }}>
            {shareAllMode ? "Share Forms" : "Share Form"}
          </Typography>
        }
        buttonName={[]}
        width="480px"
        padding="24px"
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 1 }}>
          {shareAllMode ? (
            <>
              <Typography sx={{ fontSize: "14px", color: "#636262" }}>
                Share{" "}
                <strong>
                  {selectedShareForms.length} selected form
                  {selectedShareForms.length === 1 ? "" : "s"}
                </strong>{" "}
                via email to{" "}
                {signerType === "AGENT" ? "Area Agency" : "Guardian"}:
              </Typography>
              <Box
                component="ul"
                sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}
              >
                {selectedShareForms.map((form) => (
                  <Typography
                    key={form.id}
                    component="li"
                    sx={{ fontSize: "13px", color: "#25272c", fontWeight: 500 }}
                  >
                    {form.formName}
                  </Typography>
                ))}
              </Box>
            </>
          ) : (
            <Typography sx={{ fontSize: "14px", color: "#636262" }}>
              Share <strong>{shareFormRow?.formName}</strong> via email to{" "}
              {signerType === "AGENT" ? "Area Agency" : "Guardian"}:
            </Typography>
          )}

          {/* Show only the recipient matching the current tab */}
          {signerType === "GUARDIAN" && (
            <>
              {isGuardianAssigned ? (
                guardianDetails?.email ? (
                  <Box
                    sx={{
                      border: "1.5px solid #0A2E45",
                      borderRadius: "8px",
                      p: 2,
                      backgroundColor: "#F8FBFF",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Radio
                        checked
                        size="small"
                        sx={{
                          color: "#0A2E45",
                          "&.Mui-checked": { color: "#0A2E45" },
                          p: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#212121",
                        }}
                      >
                        Guardian
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3.5 }}>
                      <Typography sx={{ fontSize: "13px", color: "#636262" }}>
                        {guardianDetails.name || "—"}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#757775" }}>
                        {guardianDetails.email}{" "}
                        {guardianDetails.phone
                          ? `| ${guardianDetails.phone}`
                          : ""}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "1px solid #E3ECEF",
                      borderRadius: "8px",
                      p: 2,
                      backgroundColor: "#F9F9F9",
                    }}
                  >
                    <Typography
                      sx={{ fontSize: "14px", fontWeight: 600, color: "#9E9E9E" }}
                    >
                      Guardian
                    </Typography>
                    <Typography sx={{ fontSize: "13px", color: "#9E9E9E" }}>
                      No email available for guardian
                    </Typography>
                  </Box>
                )
              ) : (
                <Box
                  sx={{
                    border: "1px solid #E3ECEF",
                    borderRadius: "8px",
                    p: 2,
                    backgroundColor: "#F9F9F9",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 600, color: "#9E9E9E" }}
                  >
                    Guardian
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#9E9E9E" }}>
                    Guardian not assigned
                  </Typography>
                </Box>
              )}
            </>
          )}

          {signerType === "AGENT" && (
            <>
              {isAgentAssigned ? (
                agentDetails?.email ? (
                  <Box
                    sx={{
                      border: "1.5px solid #0A2E45",
                      borderRadius: "8px",
                      p: 2,
                      backgroundColor: "#F8FBFF",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Radio
                        checked
                        size="small"
                        sx={{
                          color: "#0A2E45",
                          "&.Mui-checked": { color: "#0A2E45" },
                          p: 0,
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#212121",
                        }}
                      >
                        Area Agency
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 3.5 }}>
                      <Typography sx={{ fontSize: "13px", color: "#636262" }}>
                        {agentDetails.name || "—"}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "#757775" }}>
                        {agentDetails.email}{" "}
                        {agentDetails.phone ? `| ${agentDetails.phone}` : ""}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: "1px solid #E3ECEF",
                      borderRadius: "8px",
                      p: 2,
                      backgroundColor: "#F9F9F9",
                    }}
                  >
                    <Typography
                      sx={{ fontSize: "14px", fontWeight: 600, color: "#9E9E9E" }}
                    >
                      Area Agency
                    </Typography>
                    <Typography sx={{ fontSize: "13px", color: "#9E9E9E" }}>
                      No email available for Area Agency
                    </Typography>
                  </Box>
                )
              ) : (
                <Box
                  sx={{
                    border: "1px solid #E3ECEF",
                    borderRadius: "8px",
                    p: 2,
                    backgroundColor: "#F9F9F9",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "14px", fontWeight: 600, color: "#9E9E9E" }}
                  >
                    Area Agency
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "#9E9E9E" }}>
                   Area Agency not assigned
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Action buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              pt: 1,
            }}
          >
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setShareDialogOpen(false);
                setShareFormRow(null);
                setShareAllMode(false);
              }}
              sx={{ minWidth: "80px" }}
            >
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={shareAllMode ? handleShareAllConfirm : handleShareConfirm}
              loading={
                shareConsentFormMutationHook.isPending ||
                isShareProcessing ||
                isShareAllProcessing
              }
              disabled={
                (shareAllMode
                  ? selectedShareForms.length === 0
                  : !shareFormRow?.consentFormUuid) ||
                (signerType === "GUARDIAN" && (!isGuardianAssigned || !guardianDetails?.email)) ||
                (signerType === "AGENT" && (!isAgentAssigned || !agentDetails?.email))
              }
              sx={{ minWidth: "80px" }}
            >
              {shareAllMode ? "Share Selected" : "Share"}
            </CustomButton>
          </Box>
        </Box>
      </CustomDialog>

      {/* Snackbar for success/error messages */}
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
      />

      {/* Delete Confirmation Popup */}
      <ConfirmationPopUp
        open={openDeleteConfirm}
        onClose={() => {
          setOpenDeleteConfirm(false);
          setFormToDelete(null);
        }}
        onConfirm={() => {
          if (formToDelete?.consentFormUuid) {
            deleteConsentFormMutationHook.mutate({
              path: {
                uuid: formToDelete.consentFormUuid,
              },
            } as any);
            setOpenDeleteConfirm(false);
            setFormToDelete(null);
          }
        }}
        message={`Are you sure you want to delete "${formToDelete?.formName}"? This action cannot be undone.`}
        confirmDisabled={deleteConsentFormMutationHook.isPending}
      />
    </Box>
  );
};

export default LeadFormsTable;
