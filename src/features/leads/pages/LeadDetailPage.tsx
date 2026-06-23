import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import CustomDialog from "../../../components/custom-dialog/custom-dialog";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomLabel from "../../../components/custom-label/custom-label";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";
import {
  getLeadDetailOptions,
  getLeadDetailQueryKey,
  rejectReferralMutation,
  listConsentFormsOptions,
} from "../../../sdk/@tanstack/react-query.gen";
import CompleteOnboardingDrawer from "../components/CompleteOnboardingDrawer";
import {
  invalidateLeadConsentForms,
  invalidateLeadsListWithPredicate,
} from "../utils/queryInvalidation";
import DocumentsSection from "../../residents/components/DocumentsSection";
import { leadDocumentsData } from "../../../constant/documentsTableData";
import EditProfileDetailsDrawer from "../../residents/components/EditResidentProfileDrawer";
import LeadDetailHeader from "./LeadDetailPage/components/LeadDetailHeader";
import DemographicsCard from "./LeadDetailPage/components/DemographicsCard";
import InfoCard from "./LeadDetailPage/components/InfoCard";
import RejectionCard from "./LeadDetailPage/components/RejectionCard";
import { extractLeadData } from "./LeadDetailPage/utils/dataExtraction";
import LeadFormsTable from "../components/forms/LeadFormsTable";
import GuardianChecklistTable from "../components/forms/GuardianChecklistTable";
import HIPAAReleaseFillFormDrawer from "../components/forms/hipaa-release/HIPAAReleaseFillFormDrawer";
import NHResidencyAgreementDrawer from "../components/forms/nh-residency-agreement/NHResidencyAgreementDrawer";
import HouseRulesDrawer from "../components/forms/house-rules/HouseRulesDrawer";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import type { LeadTab } from "./LeadDetailPage/constants";
import { CONTAINER_PADDING, COLORS } from "./LeadDetailPage/constants";
import { usePermission } from "../../../hooks/usePermission";

const LeadDetailPage: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canEditLead = hasPermission("leads.edit");
  const canDeleteLead = hasPermission("leads.delete");
  const canDeleteDocument = hasPermission("documents.delete");
  const canUploadDocument = hasPermission("documents.upload");
  const [activeTab, setActiveTab] = useState<LeadTab>("overview");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [completeOnboardingDrawerOpen, setCompleteOnboardingDrawerOpen] =
    useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    status: "success" | "error";
  }>({
    open: false,
    message: "",
    status: "success",
  });
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [consentFormsTab, setConsentFormsTab] = useState<
    "guardian" | "agent" | "Intake Checklist"
  >("Intake Checklist");
  const [hipaaDrawerOpen, setHipaaDrawerOpen] = useState(false);
  const [nhResidencyDrawerOpen, setNhResidencyDrawerOpen] = useState(false);
  const [houseRulesDrawerOpen, setHouseRulesDrawerOpen] = useState(false);
  const [selectedFormInfo, setSelectedFormInfo] = useState<{
    formId: number;
    formName: string;
    consentUuid?: string;
    consentFormStatus?: string;
    mode?: "new" | "draft" | "view";
    signerType?: "GUARDIAN" | "AGENT";
  } | null>(null);
  const {
    data: leadData,
    isLoading,
    error,
  } = useQuery(
    getLeadDetailOptions({
      path: {
        uuid: uuid || "",
      },
    }),
  );

  // Helper function to extract backend message from response
  const getBackendMessage = useCallback(
    (response: unknown): string | undefined => {
      const data = response as
        | { message?: string; data?: { message?: string } }
        | undefined;
      return data?.message ?? data?.data?.message ?? undefined;
    },
    [],
  );

  // Extract and memoize lead data using typed utility
  const extractedData = useMemo(() => {
    return extractLeadData(leadData);
  }, [leadData]);

  // Set default consent forms tab based on available signers
  useEffect(() => {
    if (extractedData) {
      if (extractedData.hasGuardian) {
        setConsentFormsTab("guardian");
      } else if (extractedData.hasAgent) {
        setConsentFormsTab("agent");
      } else {
        setConsentFormsTab("Intake Checklist");
      }
    }
  }, [extractedData?.hasGuardian, extractedData?.hasAgent]);

  // Compute disabled reason based on lead status
  const disabledReason = useMemo(() => {
    const status = extractedData?.status?.toUpperCase();
    if (status === "REJECTED") return "Rejected referral, you cannot update details";
    if (status === "COMPLETED") return "You can edit changes in resident tab";
    return undefined;
  }, [extractedData?.status]);



  // Fetch consent forms to track signing status.
  // Data is fetched on mount and refreshed when the browser window regains focus
  // (covers the case where a guardian/agent signs externally).
  const { data: allConsentFormsData } = useQuery({
    ...listConsentFormsOptions({
      query: {
        resident_uuid: uuid,
      },
    }),
    // Fetch on page entry (not only on consent tab) so the Complete Onboarding
    // button reflects the correct enabled/disabled state immediately.
    enabled: !!uuid,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    select: (data: any) => {
      if (data?.data && Array.isArray(data.data)) return data.data;
      if (Array.isArray(data)) return data;
      if (data?.results && Array.isArray(data.results)) return data.results;
      return [];
    },
  });

  // Check if all consent forms are signed for applicable signers
  const allConsentFormsSigned = useMemo(() => {
    if (!allConsentFormsData || !Array.isArray(allConsentFormsData) || allConsentFormsData.length === 0) return false;
    if (!extractedData) return false;

    const { hasGuardian, hasAgent } = extractedData;
    if (!hasGuardian && !hasAgent) return false;

    const requiredFormCodes = [
      "NH_RESIDENCY_AGREEMENT",
      "CAFC_HOUSE_RULES",
      "BLANK_ROI",
    ];

    // Check guardian forms if guardian is assigned
    if (hasGuardian) {
      const guardianForms = allConsentFormsData.filter(
        (f: Record<string, unknown>) => f.signer_type === "GUARDIAN"
      );
      for (const code of requiredFormCodes) {
        const form = guardianForms.find((f: Record<string, unknown>) => f.form_code === code);
if (!form || form.status?.toUpperCase() !== "SIGNED") {
   return false;
}      }
    }

    // Check agent forms if agent is assigned
    if (hasAgent) {
      const agentForms = allConsentFormsData.filter(
        (f: Record<string, unknown>) => f.signer_type === "AGENT"
      );
      for (const code of requiredFormCodes) {
        const form = agentForms.find((f: Record<string, unknown>) => f.form_code === code);
if (!form || form.status?.toUpperCase() !== "SIGNED") {
   return false;
}      }
    }

    return true;
  }, [allConsentFormsData, extractedData]);



  // When all forms are signed, immediately refresh the lead detail so the
  // "Complete Onboarding" button and header status reflect the server state.
  useEffect(() => {
    if (allConsentFormsSigned && uuid) {
      queryClient.invalidateQueries({
        queryKey: getLeadDetailQueryKey({ path: { uuid } }),
      });
    }
  }, [allConsentFormsSigned, uuid, queryClient]);

  // Memoized handlers - must be before any early returns
  const handleRejectClick = useCallback(() => {
    if (!extractedData?.isFinalStatus) {
      setRejectModalOpen(true);
    }
  }, [extractedData?.isFinalStatus]);

  const handleCompleteOnboarding = useCallback(() => {
    setCompleteOnboardingDrawerOpen(true);
  }, []);

  const handleEditClick = useCallback(() => {
    setEditDrawerOpen(true);
  }, []);

  const handleTabChange = useCallback((tab: LeadTab) => {
    setActiveTab(tab);
  }, []);

  const refreshLeadConsentState = useCallback(() => {
    if (!uuid) return;

    invalidateLeadConsentForms(queryClient, uuid);
    queryClient.invalidateQueries({
      queryKey: getLeadDetailQueryKey({ path: { uuid } }),
    });
  }, [queryClient, uuid]);

  const handleRejectCancel = useCallback(() => {
    setRejectModalOpen(false);
    setRejectionReason("");
    setRejectionError(null);
  }, []);

  const handleAvatarError = useCallback(() => {
    setAvatarError(true);
  }, []);

  // Memoize card field data
  const guardianFields = useMemo(
    () =>
      extractedData
        ? [
            { label: "Name", value: extractedData.guardianName },
            { label: "Relation", value: extractedData.guardianRelation },
            { label: "Phone Number", value: extractedData.guardianPhone },
            { label: "Email", value: extractedData.guardianEmail },
          ]
        : [],
    [extractedData],
  );

  const serviceManagerFields = useMemo(
    () =>
      extractedData
        ? [
            { label: "Name", value: extractedData.serviceManagerName },
            {
              label: "Phone Number",
              value: extractedData.serviceManagerPhone,
            },
            { label: "Email", value: extractedData.serviceManagerEmail },
          ]
        : [],
    [extractedData],
  );

  const insuranceFields = useMemo(
    () =>
      extractedData
        ? [
            {
              label: "Insurance Provider",
              value: extractedData.insuranceProvider,
            },
            { label: "Policy Number", value: extractedData.policyNumber },
            { label: "Insurance Status", value: extractedData.insuranceStatus },
          ]
        : [],
    [extractedData],
  );

  const rejectReferral = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(rejectReferralMutation() as any),
    onSuccess: async (data: unknown) => {
      // Extract backend message from response
      const backendMessage = getBackendMessage(data);
      // Only show backend message if available
      if (backendMessage) {
        setSnackbar({
          open: true,
          message: backendMessage,
          status: "success",
        });
      }

      // Close modal and reset state
      setRejectModalOpen(false);
      setRejectionReason("");
      setRejectionError(null);

      // Invalidate lead detail using the SDK-generated query key
      await queryClient.invalidateQueries({
        queryKey: getLeadDetailQueryKey({
          path: { uuid: uuid || "" },
        }),
      });

      // Also invalidate list queries using centralized utility
      await invalidateLeadsListWithPredicate(queryClient);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      // Extract error message from backend response only
      const errorData = error?.response?.data as
        | { message?: string; detail?: string; reason?: string[] }
        | undefined;
      const errorMessage =
        errorData?.message ||
        errorData?.detail ||
        (errorData?.reason ? errorData.reason[0] : undefined);

      if (errorData?.reason) {
        setRejectionError(errorData.reason[0]);
      }

      // Only show snackbar if backend provided a message
      if (errorMessage) {
        setSnackbar({
          open: true,
          message: errorMessage,
          status: "error",
        });
      }
    },
  });

  // Update handleRejectConfirm to use rejectReferral
  const handleRejectConfirmWithMutation = useCallback(() => {
    if (!uuid || rejectReferral.isPending) return;

    if (!rejectionReason.trim()) {
      setRejectionError("Reason for Rejection is required");
      return;
    }

    rejectReferral.mutate({
      path: {
        uuid: uuid,
      },
      body: {
        reason: rejectionReason,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }, [uuid, rejectionReason, rejectReferral]);

  // Reset avatar error when lead or data changes (e.g. after refetch or navigating to different lead)
  useEffect(() => {
    if (extractedData) {
      setAvatarError(false);
    }
  }, [uuid, extractedData]);

  // Early return if loading
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#ecf1f7",
        }}
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  // Early return if error
  if (error || !leadData) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#ecf1f7",
          padding: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <WarningAmberRoundedIcon
          sx={{
            fontSize: { xs: 48, sm: 64 },
            color: "#D32F2F",
            marginBottom: 2,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: "#D32F2F",
            fontSize: { xs: "16px", sm: "18px", md: "20px" },
            fontWeight: 600,
            textAlign: "center",
            marginBottom: 1,
          }}
        >
          Error loading lead details
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#757575",
            fontSize: { xs: "14px", sm: "16px" },
            textAlign: "center",
            maxWidth: "500px",
          }}
        >
          {error instanceof Error
            ? error.message
            : "Unable to load lead information. Please try again."}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/admin/leads")}
          sx={{
            marginTop: 3,
            padding: "8px 24px",
          }}
        >
          Back to Leads
        </Button>
      </Box>
    );
  }

  // Early return if no data extracted
  if (!extractedData) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: COLORS.background,
          padding: CONTAINER_PADDING,
        }}
      >
        <WarningAmberRoundedIcon
          sx={{
            fontSize: { xs: 48, sm: 64 },
            color: "#D32F2F",
            marginBottom: 2,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: "#D32F2F",
            fontSize: { xs: "16px", sm: "18px", md: "20px" },
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Unable to load lead data
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "90vh",
        borderRadius: "18px",
        padding: CONTAINER_PADDING,
        overflow: "hidden",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid
        container
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{
          backgroundColor: COLORS.cardBackground,
          width: "100%",
          padding: { xs: 1.25, sm: 1.5, md: 2 },
          borderRadius: "8px",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header Section */}
        <LeadDetailHeader
          fullName={extractedData?.fullName || "N/A"}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isFinalStatus={extractedData?.isFinalStatus || false}
          status={extractedData?.status}
          onRejectClick={handleRejectClick}
          onCompleteOnboarding={handleCompleteOnboarding}
          allConsentFormsSigned={allConsentFormsSigned}
          canRejectReferral={canDeleteLead}
        />
        {activeTab === "overview" && (
          <Grid
            container
            size={{ xs: 12 }}
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{
              flex: 1,
              minHeight: 0,
              paddingLeft: { xs: 1.5, sm: 2 },
              paddingRight: { xs: 1.5, sm: 2 },
              overflowY: "auto",
              overflowX: "hidden",
              alignContent: "flex-start",
              alignItems: "flex-start",
              paddingBottom: { xs: 1.5, sm: 2 },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {/* Demographics Card - full width */}
            {extractedData && (
              <DemographicsCard
                data={extractedData}
                avatarError={avatarError}
                onAvatarError={handleAvatarError}
                onEditClick={handleEditClick}
                disabled={!canEditLead}
              />
            )}

            {/* Guardian Info Card */}
            {extractedData && (
              <InfoCard
                title="Guardian Information"
                icon={
                  <PersonOutlinedIcon
                    sx={{ color: "#757775", fontSize: "20px" }}
                  />
                }
                data={extractedData}
                fields={guardianFields}
                onEditClick={handleEditClick}
                disabled={!canEditLead}
              />
            )}

            {/* Service Manager Information Card */}
            {extractedData && (
              <InfoCard
                title="Area Agency Information"
                icon={
                  <PersonOutlinedIcon
                    sx={{ color: "#646564", fontSize: "20px" }}
                  />
                }
                data={extractedData}
                fields={serviceManagerFields}
                onEditClick={handleEditClick}
                disabled={!canEditLead}
              />
            )}

            {/* Insurance Details Card */}
            {extractedData && (
              <InfoCard
                title="Insurance Details"
                icon={
                  <DescriptionOutlinedIcon
                    sx={{ color: "#757775", fontSize: "20px" }}
                  />
                }
                data={extractedData}
                fields={insuranceFields}
                onEditClick={handleEditClick}
                disabled={!canEditLead}
              />
            )}

            {/* Rejection Information Card */}
            {extractedData?.status.toUpperCase() === "REJECTED" && (
              <RejectionCard
                rejectionReason={extractedData.rejectionReason}
                rejectedAt={extractedData.rejectedAt}
              />
            )}
          </Grid>
        )}

        {/* DOCUMENTS TAB CONTENT - table scrollable, page not scrollable */}
        {activeTab === "documents" && extractedData?.lead.uuid && (
          <Grid
            size={{ xs: 12 }}
            sx={{
              paddingTop: 1,
              paddingX: 0,
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <DocumentsSection
                objectId={extractedData.lead.uuid}
                contentTypeApp="leads"
                contentTypeModel="lead"
                formList={leadDocumentsData}
                leadUuid={uuid}
                disabledReason={disabledReason}
              />
            </Box>
          </Grid>
        )}

        {/* CONSENT & FORMS TAB CONTENT */}
        {activeTab === "consent" && extractedData?.lead.uuid && (
          <Grid
            size={{ xs: 12 }}
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs
                  value={consentFormsTab}
                  onChange={(_, newValue) => setConsentFormsTab(newValue)}
                  sx={{
                    minHeight: 40,
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontSize: "14px",
                      fontWeight: 500,
                      minHeight: 40,
                      paddingX: 2,
                      color: "#6B7280",
                      "&.Mui-selected": {
                        color: "#0A2E45",
                        fontWeight: 600,
                      },
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: "#0A2E45",
                    },
                  }}
                >
                  {extractedData?.hasGuardian && <Tab label="Guardian" value="guardian" />}
                  {extractedData?.hasAgent && <Tab label="Area Agency" value="agent" />}
                  <Tab label="Intake Checklist" value="Intake Checklist" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {consentFormsTab === "guardian" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0, overflow: "hidden" }}>
                    {/* Guardian Details */}
                    {/* {extractedData?.hasGuardian ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 1.5,
                          backgroundColor: "#F8FBFF",
                          borderRadius: "8px",
                          border: "1px solid #E3ECEF",
                          flexShrink: 0,
                        }}
                      >
                        <PersonOutlinedIcon sx={{ color: "#0A2E45", fontSize: "20px" }} />
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", flex: 1 }}>
                          <Box>
                            <Typography sx={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>Name</Typography>
                            <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>{extractedData.guardianName}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>Phone Number</Typography>
                            <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>{extractedData.guardianPhone}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>Email</Typography>
                            <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>{extractedData.guardianEmail}</Typography>
                          </Box>
                          {extractedData.guardianRelation !== "N/A" && (
                            <Box>
                              <Typography sx={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>Relation</Typography>
                              <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>{extractedData.guardianRelation}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: "#FFF8E1",
                          borderRadius: "8px",
                          border: "1px solid #FFE082",
                          flexShrink: 0,
                        }}
                      >
                        <Typography sx={{ fontSize: "13px", color: "#F57F17", fontWeight: 500 }}>
                          Guardian not assigned
                        </Typography>
                      </Box>
                    )} */}
                  <LeadFormsTable
                    leadUuid={uuid}
                    leadName={extractedData?.fullName || "N/A"}
                    isTabActive={
                      activeTab === "consent" && consentFormsTab === "guardian"
                    }
                    signerType="GUARDIAN"
                    isGuardianAssigned={extractedData?.hasGuardian}
                    isAgentAssigned={extractedData?.hasAgent}
                    disabledReason={disabledReason}
                    guardianDetails={{
                      name: extractedData?.guardianName || "",
                      email: extractedData?.guardianEmail !== "N/A" ? extractedData?.guardianEmail || "" : "",
                      phone: extractedData?.guardianPhone || "",
                    }}
                    agentDetails={{
                      name: extractedData?.serviceManagerName || "",
                      email: extractedData?.serviceManagerEmail !== "N/A" ? extractedData?.serviceManagerEmail || "" : "",
                      phone: extractedData?.serviceManagerPhone || "",
                    }}
                    onFillForm={(
                      formId,
                      formName,
                      consentUuid,
                      consentFormStatus,
                    ) => {
                      const mode =
                        consentFormStatus === "DRAFT" ? "draft" : "new";
                      if (formName === "Blank ROI") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          consentFormStatus,
                          mode,
                          signerType: "GUARDIAN",
                        });
                        setHipaaDrawerOpen(true);
                      } else if (formName === "NH Residency Agreement") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          consentFormStatus,
                          mode,
                          signerType: "GUARDIAN",
                        });
                        setNhResidencyDrawerOpen(true);
                      } else if (formName === "CAFC House rules") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          consentFormStatus,
                          mode,
                          signerType: "GUARDIAN",
                        });
                        setHouseRulesDrawerOpen(true);
                      }
                    }}
                    onView={(formId, formName, consentUuid) => {
                      if (formName === "Blank ROI") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          mode: "view",
                          signerType: "GUARDIAN",
                        });
                        setHipaaDrawerOpen(true);
                      } else if (formName === "NH Residency Agreement") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          mode: "view",
                          signerType: "GUARDIAN",
                        });
                        setNhResidencyDrawerOpen(true);
                      } else if (formName === "CAFC House rules") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          mode: "view",
                          signerType: "GUARDIAN",
                        });
                        setHouseRulesDrawerOpen(true);
                      }
                    }}
                  />
                  </Box>
                )}

                {consentFormsTab === "agent" && (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0, overflow: "hidden" }}>
                    {/* Agent Details */}
                    {/* {extractedData?.hasAgent ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          p: 1.5,
                          backgroundColor: "#F8FBFF",
                          borderRadius: "8px",
                          border: "1px solid #E3ECEF",
                          flexShrink: 0,
                        }}
                      >
                        <PersonOutlinedIcon sx={{ color: "#0A2E45", fontSize: "20px" }} />
                        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", flex: 1 }}>
                          <Box>
                            <Typography sx={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>Name</Typography>
                            <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>{extractedData.serviceManagerName}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>Phone Number</Typography>
                            <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>{extractedData.serviceManagerPhone}</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>Email</Typography>
                            <Typography sx={{ fontSize: "13px", color: "#212121", fontWeight: 500 }}>{extractedData.serviceManagerEmail}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: "#FFF8E1",
                          borderRadius: "8px",
                          border: "1px solid #FFE082",
                          flexShrink: 0,
                        }}
                      >
                        <Typography sx={{ fontSize: "13px", color: "#F57F17", fontWeight: 500 }}>
                          Agent not assigned
                        </Typography>
                      </Box>
                    )} */}
                  <LeadFormsTable
                    leadUuid={uuid}
                    leadName={extractedData?.fullName || "N/A"}
                    isTabActive={
                      activeTab === "consent" && consentFormsTab === "agent"
                    }
                    signerType="AGENT"
                    isGuardianAssigned={extractedData?.hasGuardian}
                    isAgentAssigned={extractedData?.hasAgent}
                    disabledReason={disabledReason}
                    guardianDetails={{
                      name: extractedData?.guardianName || "",
                      email: extractedData?.guardianEmail !== "N/A" ? extractedData?.guardianEmail || "" : "",
                      phone: extractedData?.guardianPhone || "",
                    }}
                    agentDetails={{
                      name: extractedData?.serviceManagerName || "",
                      email: extractedData?.serviceManagerEmail !== "N/A" ? extractedData?.serviceManagerEmail || "" : "",
                      phone: extractedData?.serviceManagerPhone || "",
                    }}
                    onFillForm={(
                      formId,
                      formName,
                      consentUuid,
                      consentFormStatus,
                    ) => {
                      const mode =
                        consentFormStatus === "DRAFT" ? "draft" : "new";
                      if (formName === "Blank ROI") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          consentFormStatus,
                          mode,
                          signerType: "AGENT",
                        });
                        setHipaaDrawerOpen(true);
                      } else if (formName === "NH Residency Agreement") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          consentFormStatus,
                          mode,
                          signerType: "AGENT",
                        });
                        setNhResidencyDrawerOpen(true);
                      } else if (formName === "CAFC House rules") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          consentFormStatus,
                          mode,
                          signerType: "AGENT",
                        });
                        setHouseRulesDrawerOpen(true);
                      }
                    }}
                    onView={(formId, formName, consentUuid) => {
                      if (formName === "Blank ROI") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          mode: "view",
                          signerType: "AGENT",
                        });
                        setHipaaDrawerOpen(true);
                      } else if (formName === "NH Residency Agreement") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          mode: "view",
                          signerType: "AGENT",
                        });
                        setNhResidencyDrawerOpen(true);
                      } else if (formName === "CAFC House rules") {
                        setSelectedFormInfo({
                          formId,
                          formName,
                          consentUuid,
                          mode: "view",
                          signerType: "AGENT",
                        });
                        setHouseRulesDrawerOpen(true);
                      }
                    }}
                  />
                  </Box>
                )}

                {consentFormsTab === "Intake Checklist" && (
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <GuardianChecklistTable
                      objectId={extractedData.lead.uuid}
                      leadUuid={uuid}
                      disabledReason={disabledReason}
                      canDelete={canDeleteDocument}
                      canUpload={canUploadDocument}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Reject Referral Modal */}
      <CustomDialog
        open={rejectModalOpen}
        onClose={handleRejectCancel}
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmberRoundedIcon
              sx={{ color: "#D32F2F", fontSize: "20px" }}
            />
            <Typography variant="h6" sx={{ fontSize: "18px", fontWeight: 600 }}>
              Reject Referral
            </Typography>
          </Box>
        }
        buttonName={[]}
        width="500px"
        padding="24px"
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: "14px",
                color: "#757775",
                marginBottom: "16px",
              }}
            >
              Are you sure you want to reject this referral?
            </Typography>
          </Grid>
          {extractedData && extractedData.lead.id && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  backgroundColor: "#F5F5F5",
                  borderRadius: "4px",
                  padding: { xs: 1.5, sm: 2 },
                  marginBottom: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "14px",
                    color: "#212121",
                    fontWeight: 500,
                  }}
                >
                  {extractedData.fullName} -{" "}
                  {extractedData.referralId}
                </Typography>
              </Box>
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <CustomLabel label="Reason for Rejection" isRequired />
              <CustomInput
                placeholder="Enter rejection reason"
                name="rejectionReason"
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectionError) setRejectionError(null);
                }}
                multiline
                rows={4}
                hasError={!!rejectionError}
                errorMessage={rejectionError || undefined}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                paddingTop: "16px",
                borderTop: "1px solid #E3ECEF",
              }}
            >
              <CustomButton
                variant="secondary"
                size="md"
                onClick={handleRejectCancel}
              >
                Cancel
              </CustomButton>
              <Button
                onClick={handleRejectConfirmWithMutation}
                disabled={
                  extractedData?.isFinalStatus || rejectReferral.isPending
                }
                sx={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  backgroundColor: "#D32F2F",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#B71C1C",
                  },
                  "&:disabled": {
                    backgroundColor: "#D32F2F",
                    opacity: 0.6,
                  },
                }}
              >
                {rejectReferral.isPending ? "Rejecting..." : "Reject"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CustomDialog>

      {/* Complete Onboarding Drawer */}
      {uuid && (
        <CompleteOnboardingDrawer
          open={completeOnboardingDrawerOpen}
          leadUuid={uuid}
          onClose={() => setCompleteOnboardingDrawerOpen(false)}
          onSuccess={(message) => {
            setSnackbar({
              open: true,
              message: message,
              status: "success",
            });
          }}
          onError={(message) => {
            setSnackbar({
              open: true,
              message: message,
              status: "error",
            });
          }}
        />
      )}
      {uuid && (
        <EditProfileDetailsDrawer
          open={editDrawerOpen}
          leadUuid={uuid}
          onClose={() => setEditDrawerOpen(false)}
          onSave={() => {
            // Refresh lead details after successful update
            queryClient.invalidateQueries({
              queryKey: getLeadDetailQueryKey({ path: { uuid: uuid || "" } }),
            });
            // Also invalidate leads list
            invalidateLeadsListWithPredicate(queryClient);

            setEditDrawerOpen(false);
          }}
        />
      )}

      {/* Snackbar */}
      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      {/* HIPAA Release Form Drawer */}
      {selectedFormInfo &&
        uuid &&
        selectedFormInfo.formName === "Blank ROI" && (
          <HIPAAReleaseFillFormDrawer
            open={hipaaDrawerOpen}
            onClose={() => {
              setHipaaDrawerOpen(false);
              setSelectedFormInfo(null);
            }}
            formName={selectedFormInfo.formName}
            leadName={extractedData?.fullName || "N/A"}
            leadUuid={uuid}
            consentUuid={selectedFormInfo.consentUuid || null}
            mode={
              selectedFormInfo.mode ||
              (selectedFormInfo.consentUuid ? "draft" : "new")
            }
            signerType={selectedFormInfo.signerType}
            onAfterSave={() => {
              refreshLeadConsentState();
            }}
            onAfterSubmit={() => {
              refreshLeadConsentState();
              setHipaaDrawerOpen(false);
              setSelectedFormInfo(null);
            }}
          />
        )}

      {/* NH Residency Agreement Drawer */}
      {selectedFormInfo &&
        uuid &&
        selectedFormInfo.formName === "NH Residency Agreement" && (
          <NHResidencyAgreementDrawer
            open={nhResidencyDrawerOpen}
            onClose={() => {
              setNhResidencyDrawerOpen(false);
              setSelectedFormInfo(null);
            }}
            formName={selectedFormInfo.formName}
            leadName={extractedData?.fullName || "N/A"}
            residentialAddress={extractedData?.guardianAddress !== 'N/A' ? extractedData?.guardianAddress : ''}
            leadUuid={uuid}
            consentUuid={selectedFormInfo.consentUuid || null}
            mode={
              selectedFormInfo.mode ||
              (selectedFormInfo.consentUuid ? "draft" : "new")
            }
            signerType={selectedFormInfo.signerType}
            onAfterSave={() => {
              refreshLeadConsentState();
            }}
            onAfterSubmit={() => {
              refreshLeadConsentState();
              setNhResidencyDrawerOpen(false);
              setSelectedFormInfo(null);
            }}
          />
        )}

      {/* House Rules Drawer */}
      {selectedFormInfo &&
        uuid &&
        selectedFormInfo.formName === "CAFC House rules" && (
          <HouseRulesDrawer
            open={houseRulesDrawerOpen}
            onClose={() => {
              setHouseRulesDrawerOpen(false);
              setSelectedFormInfo(null);
            }}
            formName={selectedFormInfo.formName}
            leadName={extractedData?.fullName || "N/A"}
            leadUuid={uuid}
            consentUuid={selectedFormInfo.consentUuid || null}
            mode={
              selectedFormInfo.mode ||
              (selectedFormInfo.consentUuid ? "draft" : "new")
            }
            signerType={selectedFormInfo.signerType}
            onAfterSave={() => {
              refreshLeadConsentState();
            }}
            onAfterSubmit={() => {
              refreshLeadConsentState();
              setHouseRulesDrawerOpen(false);
              setSelectedFormInfo(null);
            }}
          />
        )}
    </Box>
  );
};

export default LeadDetailPage;
