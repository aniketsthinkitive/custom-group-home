import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import {
    Box,
    Card,
    Chip,
    Divider,
    IconButton,
    Stack,
    Typography,
    Button,
    Grid,
    Menu,
    MenuItem,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import MessageOutlinedIcon from "@mui/icons-material/MessageOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PrintIcon from "@mui/icons-material/Print";
import AddNewIncidentDrawer from "../../incidents/components/AddNewIncidentDrawer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIncidentMutation, patchIncidentMutation } from "../../../sdk/@tanstack/react-query.gen";
import { updateIncidentStatusMutation } from "../../../sdk/@tanstack/react-query.gen";
import { useAuth } from "../../../hooks/useAuth";
import { usePermission } from "../../../hooks/usePermission";
import { generateIncidentPDF } from "../../incidents/utils/generateIncidentPDF";
import { getIncident } from "../../../sdk/sdk.gen";
import Paginator from "../../../components/pagination/pagination";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";


/* =========================
   Types
========================= */

export type IncidentRow = {
    uuid: string;
    category: string;
    status: string; // API status: "OPEN", "CLOSED", "ACKNOWLEDGED", etc.
    created_by_name: string;
    created_at: string;
    updated_at?: string;
    updated_by_name?: string;
    location?: string;
    injuries?: string;
    notes?: string | null; // Incident description/notes
    date?: string | null; // Incident date/time
    comment?: string | null; // Incident comment
    comments?: Array<{
        uuid: string;
        comment: string;
        role_name: string;
        created_by_name: string;
        created_at: string;
    }> | null;
    documents?: Array<{
        id: string;
        name: string;
        size?: string;
        url?: string;
    }> | null;
    notifications?: Array<{
        id: number;
        type: string;
        user_name: string | null;
        notify: boolean;
        notify_date: string | null;
        notify_time: string | null;
    }>;

};

type Props = {
    rows: IncidentRow[];
    loading?: boolean;
    residentId?: string | number;
    /** When set, edit/comment/close actions are disabled and this text shows as a tooltip */
    disabledReason?: string;
    // --- Pagination props ---
    /** Current 0-based page index */
    page?: number;
    pageSize?: number;
    totalRecords?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
};

/* =========================
   Styles
========================= */
const renderStaffRow = (label: string, name: string | null | undefined) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <Typography variant="body2">
      {label} : {name ?? "null"}
    </Typography>
  </Box>
);


// Helper function to get status styles based on API status value
const getStatusStyles = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === "DRAFT" || upperStatus === "IN_PROGRESS") {
        return { bg: "#F2F4F7", color: "#475467" };
    }
    if (upperStatus === "PM_REVIEW_PENDING" || upperStatus === "REVIEW_PENDING") {
        return { bg: "#FEF3C7", color: "#92400E" };
    }
    if (upperStatus === "COMPLETED" || upperStatus === "CLOSED") {
        return { bg: "#E8F5E9", color: "#2E7D32" };
    }
    if (upperStatus === "ACKNOWLEDGED") {
        return { bg: "#ECFDF3", color: "#027A48" };
    }
    // Default style for unknown statuses
    return { bg: "#F2F7FA", color: "#6B7280" };
};

// Helper function to format status label
const formatStatusLabel = (status: string): string => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === "DRAFT") return "Draft";
    if (upperStatus === "IN_PROGRESS") return "In Progress";
    if (upperStatus === "PM_REVIEW_PENDING" || upperStatus === "REVIEW_PENDING") return "Review Pending";
    if (upperStatus === "COMPLETED" || upperStatus === "CLOSED") return "Completed";
    if (upperStatus === "ACKNOWLEDGED") return "Acknowledged";
    if (upperStatus === "ACTION_REQUIRED") return "Action Required";
    // Return title case for other statuses
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};



/* =========================
   Component
========================= */

const IncidentTable: React.FC<Props> = ({
    rows,
    loading,
    residentId,
    disabledReason,
    page = 0,
    pageSize = 10,
    totalRecords,
    totalPages,
    onPageChange,
    onPageSizeChange,
}) => {
    const isReadOnly = !!disabledReason;
    const { hasPermission } = usePermission();
    const canCloseIncident = hasPermission("incidents.close");
    const [editIncidentUuid, setEditIncidentUuid] = useState<string | undefined>();
    const queryClient = useQueryClient();
    const updateIncident = useMutation(updateIncidentMutation());

    const [openCommentFor, setOpenCommentFor] = useState<string | null>(null);
    const [commentText, setCommentText] = useState<string>("");
    const [snackbar, setSnackbar] = useState<{ isOpen: boolean; message: string; status: "success" | "error" }>({
        isOpen: false,
        message: "",
        status: "success",
    });
    const { user } = useAuth();
    const isDSP = user?.role?.name === "DSP";
    const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; uuid: string } | null>(null);
    const [isPrinting, setIsPrinting] = useState<string | null>(null);

    /** Ref for the scrollable cards container — used to reset scroll on page change */
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const staffName =
        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "null";

    /** Reset scroll to top whenever the page index changes */
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [page]);

    // Local state for notification statuses (simplified - only tracking staffAt for AddNewIncidentDrawer)
    const [notificationStatuses, setNotificationStatuses] = useState<{
        [incidentUuid: string]: {
            staffAt?: string;
        };
    }>({});

    const addCommentMutation = useMutation({
        ...patchIncidentMutation(),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    (query.queryKey?.[0] as any)?._id === "listIncidents",
            });
            setSnackbar({ isOpen: true, message: "Comment added successfully", status: "success" });
        },
        onError: () => {
            setSnackbar({ isOpen: true, message: "Failed to add comment", status: "error" });
        },
    });

    /* -------- Mark as Closed -------- */
    const markClosedMutation = useMutation({
        ...updateIncidentStatusMutation(),
        onSuccess: () => {
            queryClient.invalidateQueries({
                predicate: (query) =>
                    (query.queryKey?.[0] as any)?._id === "listIncidents",
            });
        },
        onError: (error) => {
            console.error("Failed to close incident", error);
        },
    });

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, uuid: string) => {
        setMenuAnchor({ el: event.currentTarget, uuid });
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handlePrintIncident = async (uuid: string) => {
        handleMenuClose();
        setIsPrinting(uuid);
        try {
            // Fetch full incident details using SDK
            const response = await getIncident({
                path: { uuid },
                throwOnError: true,
            });
            
            // Generate PDF
            await generateIncidentPDF(response.data);
        } catch (error) {
            console.error('Error printing incident:', error);
        } finally {
            setIsPrinting(null);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    flex: 1,
                    minHeight: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress sx={{ color: "#0A2E45" }} />
            </Box>
        );
    }

    // ✅ UPDATED EMPTY STATE (centered)
    if (!rows || rows.length === 0) {
        return (
            <Box
                sx={{
                    flex: 1,
                    minHeight: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography
                    sx={{
                        color: "#6B7280",
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    No incidents found
                </Typography>
            </Box>
        );
    }

    return (
        <>
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                height: "100%",
            }}
        >
            {/* ===== Scrollable cards area ===== */}
            <Box
                ref={scrollContainerRef}
                sx={{
                    flex: 1,
                    overflow: "auto",
                    minHeight: 0,
                    // Thin scrollbar consistent with rest of app
                    scrollbarWidth: "thin",
                    scrollbarColor: "#D1D5DB #F3F4F6",
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-track": { backgroundColor: "#F3F4F6" },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#D1D5DB",
                        borderRadius: "3px",
                        "&:hover": { backgroundColor: "#9CA3AF" },
                    },
                }}
            >
            {rows.map((incident) => (
                <Card
                    key={incident.uuid}
                    sx={{
                        p: 2.5,
                        mb: 2,
                        borderRadius: 1.5,
                        border: "1px solid #E5E7EB",
                        boxShadow: "0px 1px 3px rgba(0,0,0,0.08)",
                        backgroundColor: "#FFF",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        height: "auto",
                        minHeight: "auto",
                        overflow: "visible",
                    }}
                >
                    {/* ================= HEADER ================= */}
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {incident.category
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, c => c.toUpperCase())}
                        </Typography>



                        <Chip
                            label={formatStatusLabel(incident.status)}
                            size="small"
                            sx={{
                                height: 24,
                                fontWeight: 600,
                                backgroundColor: getStatusStyles(incident.status).bg,
                                color: getStatusStyles(incident.status).color,
                            }}
                        />

                        <Box sx={{ flex: 1 }} />

                        <Tooltip
                            title={isDSP ? "You don't have permission" : disabledReason || ""}
                            disableHoverListener={isDSP && !isReadOnly}
                        >
                            <span>
                                <Button
                                    variant="text"
                                    startIcon={<EditOutlinedIcon fontSize="small" />}
                                    onClick={() => setEditIncidentUuid(incident.uuid)}
                                    disabled={isReadOnly || incident.status.toUpperCase() === "COMPLETED"}
                                    sx={{ textTransform: "none", fontWeight: 500 }}
                                >
                                    Edit
                                </Button>
                            </span>
                        </Tooltip>

                        <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, incident.uuid)}
                            sx={{ ml: 0.5 }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    {/* ================= META ================= */}
                    <Typography variant="body2" color="text.secondary">
                        Created by {incident.created_by_name} on{" "}
                        {dayjs(incident.created_at).format("DD MMM YYYY, hh:mm A")}
                        {incident.updated_at && (
                            <> | Last Updated By {incident.created_by_name} on{" "}
                                {dayjs(incident.updated_at).format("DD MMM YYYY, hh:mm A")}</>
                        )}
                    </Typography>

                    <Divider />

                    {/* ================= DETAILS ================= */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { sm: "180px 1fr" },
                            rowGap: 1.5,
                            columnGap: 2,
                        }}
                    >
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Description
                        </Typography>
                        <Typography variant="body2">
                            {incident.notes || incident.injuries || "—"}
                        </Typography>

                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Date
                        </Typography>
                        <Typography variant="body2">
                            {incident.date
                                ? dayjs(incident.date).format("DD MMMM YYYY [at] hh:mm A")
                                : incident.created_at
                                    ? dayjs(incident.created_at).format("DD MMMM YYYY [at] hh:mm A")
                                    : "—"}
                        </Typography>

                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Location
                        </Typography>
                        <Typography variant="body2">
                            {incident.location || "—"}
                        </Typography>

                        {/* <Typography variant="body2" fontWeight={600} color="text.secondary">
                            Injuries
                        </Typography>
                        <Typography variant="body2">
                            {incident.injuries || "—"}
                        </Typography> */}
                    </Box>

                    {/* ================= ACTIONS ================= */}
                    <Divider />
                    <Box>
                        <Typography
                            variant="body2"
                            fontWeight={600}
                            sx={{ mb: 1.5 }}
                        >
                            Actions
                        </Typography>
                        <Stack spacing={0.5}>
                            {(() => {
                                const serviceCoordinator = incident.notifications?.find(
                                    (n) => n.type === "SERVICE_COORDINATOR"
                                );
                                const programManager = incident.notifications?.find(
                                    (n) => n.type === "PROGRAM_MANAGER"
                                );
                                const guardian = incident.notifications?.find(
                                    (n) => n.type === "GUARDIAN"
                                );
                                const additionalServiceProvider = incident.notifications?.find(
                                    (n: any) => n.type === "ADDITIONAL_SERVICE_PROVIDER"
                                );
                                const nursing = incident.notifications?.find(
                                    (n: any) => n.type === "NURSING"
                                );
                                const staff = incident.notifications?.find(
                                    (n) => n.type === "STAFF"
                                );

                                return (
                                    <>
                                        {serviceCoordinator && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body2">
                                                    Notify Area Agency : {serviceCoordinator.user_name ?? "-"}
                                                </Typography>
                                            </Box>
                                        )}
                                        {programManager && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body2">
                                                    Notify Program Manager : {programManager.user_name ?? "-"}
                                                </Typography>
                                            </Box>
                                        )}
                                        {guardian && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body2">
                                                    Notify Guardian : {guardian.user_name ?? "-"}
                                                </Typography>
                                            </Box>
                                        )}
                                        {additionalServiceProvider && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body2">
                                                    Notify Program Coordinator : {(additionalServiceProvider as any).user_name ?? "-"}
                                                </Typography>
                                            </Box>
                                        )}
                                        {nursing && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body2">
                                                    Notify Nursing : {(nursing as any).user_name ?? "-"}
                                                </Typography>
                                            </Box>
                                        )}
                                        {staff && (
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <Typography variant="body2">
                                                    Notify Staff : {staff.user_name ?? "-"}
                                                </Typography>
                                            </Box>
                                        )}
                                    </>
                                );
                            })()}
                        </Stack>
                    </Box>

                    {/* ================= LAST COMMENT ================= */}
                    {(() => {
                        const comments = incident.comments;
                        if (!comments || comments.length === 0) return null;
                        const lastComment = comments[comments.length - 1];
                        return (
                            <Box
                                sx={{
                                    backgroundColor: "#F9FAFB",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: 1,
                                    p: 1.5,
                                }}
                            >
                                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                                    Last Comment
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                    {lastComment.comment}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {lastComment.created_by_name}
                                    {lastComment.role_name ? ` (${lastComment.role_name})` : ""}
                                    {" · "}
                                    {dayjs(lastComment.created_at).format("DD MMM YYYY, hh:mm A")}
                                </Typography>
                            </Box>
                        );
                    })()}

                    {/* ================= FOOTER ================= */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title={disabledReason || ""} disableHoverListener={!isReadOnly}>
                            <span>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<MessageOutlinedIcon />}
                                    sx={{ textTransform: "none", borderRadius: 1 }}
                                    disabled={isReadOnly}
                                    onClick={() => {
                                        setOpenCommentFor(incident.uuid);
                                        setCommentText(incident.comment || "");
                                    }}
                                >
                                    Comment
                                </Button>
                            </span>
                        </Tooltip>

                        {/* {incident.status.toUpperCase() !== "CLOSED" && (
                            <Tooltip
                                title={!canCloseIncident ? "You don't have permission" : disabledReason || ""}
                                disableHoverListener={canCloseIncident && !isReadOnly}
                            >
                                <span>
                                    <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                            textTransform: "none",
                                            fontWeight: 600,
                                            color: "#B42318",
                                        }}
                                        disabled={isReadOnly || !canCloseIncident || markClosedMutation.isPending}
                                        onClick={() =>
                                            markClosedMutation.mutate({
                                                path: { uuid: incident.uuid },
                                                body: {
                                                    status: "CLOSED",
                                                },
                                            } as any)
                                        }
                                    >
                                        {markClosedMutation.isPending ? "Closing..." : "Mark as Closed"}
                                    </Button>
                                </span>
                            </Tooltip>
                        )} */}
                    </Stack>

                    {openCommentFor === incident.uuid && (
                        <Box
                            sx={{
                                mt: 2,
                                border: "1px solid #E5E7EB",
                                borderRadius: 1,
                                p: 2,
                                backgroundColor: "#F2F7FA",
                            }}
                        >
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                                {incident.comment ? "Update Comment" : "Add Comment"}
                            </Typography>

                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                placeholder="Write your comment here..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                            borderColor: "#E5E7EB",
                                        },
                                    },
                                }}
                            />

                            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
                                <Button
                                    variant="text"
                                    onClick={() => {
                                        setOpenCommentFor(null);
                                        setCommentText("");
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    variant="contained"
                                    disabled={!commentText.trim() || addCommentMutation.isPending}
                                    onClick={() => {
                                        addCommentMutation.mutate({
                                            path: { uuid: incident.uuid },
                                            body: {
                                                comment: commentText.trim(),
                                            },
                                        });

                                        setOpenCommentFor(null);
                                        setCommentText("");
                                    }}
                                >
                                    Submit
                                </Button>
                            </Stack>
                        </Box>
                    )}

                    {/* ================= EDIT DRAWER ================= */}
                    <AddNewIncidentDrawer
                        open={editIncidentUuid === incident.uuid}
                        onClose={() => setEditIncidentUuid(undefined)}
                        mode="edit"
                        incidentUuid={incident.uuid}
                        fixedResidentId={residentId}
                        notifiedAt={notificationStatuses[incident.uuid]?.staffAt}
                    />
                </Card>
            ))}

            {/* ================= MORE MENU ================= */}
            <Menu
                anchorEl={menuAnchor?.el}
                open={!!menuAnchor}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem
                    onClick={() => menuAnchor && handlePrintIncident(menuAnchor.uuid)}
                    disabled={isPrinting === menuAnchor?.uuid}
                >
                    <PrintIcon sx={{ mr: 1, fontSize: 18 }} />
                    {isPrinting === menuAnchor?.uuid ? 'Generating PDF...' : 'Print'}
                </MenuItem>
            </Menu>
            </Box>{/* end scrollContainerRef Box */}

            {/* ===== Pagination ===== */}
            {(totalRecords !== undefined ? totalRecords : rows.length) > 0 && (
                <Grid
                    size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
                    sx={{
                        "&&": { flexShrink: 0, marginTop: "auto", borderTop: "1px solid #EEF1F4" },
                        backgroundColor: "#FFFFFF",
                        paddingX: { xs: "16px", sm: "24px", md: "20px" },
                    }}
                >
                    <Paginator
                        page={page}
                        totalPages={totalPages ?? Math.max(1, Math.ceil((totalRecords ?? rows.length) / pageSize))}
                        totalRecord={totalRecords ?? rows.length}
                        defaultSize={pageSize}
                        onPageChange={(_e, newPage) => onPageChange?.(newPage)}
                        onRecordsPerPageChange={(newSize) => {
                            onPageSizeChange?.(newSize);
                            onPageChange?.(0);
                        }}
                    />
                </Grid>
            )}
        </Box>
        <CommonSnackbar
            isOpen={snackbar.isOpen}
            message={snackbar.message}
            status={snackbar.status}
            onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
        />
        </>
    );
};

export default IncidentTable;
