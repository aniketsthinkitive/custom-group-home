import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import { Tabs, Tab, Button, InputAdornment, type SelectChangeEvent, Box, Typography, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DatePickerField from "../../../components/date-picker-field/date-picker-field";
import CustomInput from "../../../components/custom-input/custom-input";
import CustomSelect from "../../../components/custom-select/custom-select";
import { Dayjs } from "dayjs";
import { useNavigate } from "react-router-dom";
import AddNewIncidentDrawer from "../../incidents/components/AddNewIncidentDrawer";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { useAppSelector } from "../../../store/hooks";
import { usePermission } from "../../../hooks/usePermission";


type SectionKey = "documents" | "consent" | "carePlan" | "incidents" | "appointments" | "provider";

type Props = {
    activeSection: SectionKey;
    onSectionChange: (section: SectionKey) => void;
    filterDate?: Dayjs;
    onFilterDateChange?: (value: Dayjs | null) => void;
    onAddIncident?: () => void;
    residentId?: string | number;
    residentName?: string;
    carePlanInternalTab?: number;
    onCarePlanSearchChange?: (value: string) => void;
    carePlanSearch?: string;
    onToggleCarePlanArchived?: () => void;
    carePlanShowArchived?: boolean;
    onSearchChange?: (value: string) => void;
    disabledReason?: string;
};

const ResidentProfileSectionHeader: React.FC<Props> = ({
    activeSection,
    onSectionChange,
    filterDate,
    onFilterDateChange,
    onAddIncident,
    residentId,
    residentName,
    carePlanInternalTab,
    onCarePlanSearchChange,
    carePlanSearch = "",
    onToggleCarePlanArchived,
    carePlanShowArchived,
    onSearchChange,
    disabledReason,
}) => {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const isNurse = user?.role?.name === "Nurse";
    const [isAddIncidentOpen, setIsAddIncidentOpen] = useState(false);
    const [searchGoals, setSearchGoals] = useState<string>(carePlanSearch);

    useEffect(() => {
        const handle = setTimeout(() => {
            onCarePlanSearchChange?.(searchGoals);
        }, 500);
        return () => clearTimeout(handle);
    }, [searchGoals, onCarePlanSearchChange]);

    const handleTabsChange = (_: React.SyntheticEvent, value: SectionKey) => {
        onSectionChange(value);
    };
    const [searchQuery, setSearchQuery] = useState("");

    // Show search for documents and consent sections
    const showSearch = activeSection === "documents" || activeSection === "consent";
    // Show Add Incident and Date Picker only for incidents section
    const showIncidentControls = activeSection === "incidents";
    // Show New Appointment button only for appointments section
    const showAppointmentControls = activeSection === "appointments";
    // Show Add Provider button only for provider section
    const showProviderControls = activeSection === "provider";

    // Debounce search query for documents and consent sections
    useEffect(() => {
        if (activeSection === "documents" || activeSection === "consent") {
            const handle = setTimeout(() => {
                onSearchChange?.(searchQuery);
            }, 300);
            return () => clearTimeout(handle);
        }
    }, [searchQuery, activeSection, onSearchChange]);

    // Reset search when switching sections
    useEffect(() => {
        if (activeSection !== "documents" && activeSection !== "consent") {
            setSearchQuery("");
        }
    }, [activeSection]);

    const [statusFilter, setStatusFilter] = useState<string>("");
    const statusOptions = [
        { value: "", label: "All Status" },
        { value: "REQUESTED", label: "Requested" },
        { value: "COMPLETED", label: "Completed" },
    ];
    const handleStatusChange = (e: SelectChangeEvent<string>) => {
        const value = e.target.value;
        setStatusFilter(value);
        document.dispatchEvent(new CustomEvent("resident:status-filter-change", { detail: value }));
    };
    const handleCloseAddIncident = () => setIsAddIncidentOpen(false);
    const { hasPermission } = usePermission();

    const canCreateAppointment = hasPermission("appointments.create");
    const isDisabled = !!disabledReason || !canCreateAppointment;

   const tooltipMessage =
   disabledReason ||
   (!canCreateAppointment
    ? "You don't have permission to add appointments"
    : "");

    // Get search placeholder based on active section
    const searchPlaceholder = activeSection === "documents" ? "Search Document" : "Search Forms";

    return (
        <Grid
            container
            sx={{
                px: { xs: "16px", sm: "24px", md: "20px" },
                py: { xs: "12px", sm: "16px", md: "16px" },
                borderTop: 1,
                borderBottom: 1,
                borderColor: "divider",
                alignItems: "center",
                justifyContent: "space-between",
                gap: { xs: "12px", sm: "12px", md: "12px", lg: "12px" },
                flexWrap: "wrap",
                position: "sticky",
                top: 0,
                backgroundColor: "background.paper",
                zIndex: 1001,
                flexShrink: 0,
            }}
        >
            {/* LEFT – TABS */}
            <Grid size={{ xs: 12, sm: "auto" }}>
                <Tabs
                    value={activeSection}
                    onChange={handleTabsChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        minHeight: 40,
                        "& .MuiTab-root": {
                            textTransform: "none",
                            fontSize: { xs: 12, sm: 14 },
                            minHeight: 40,
                            paddingX: { xs: 1.5, sm: 2.5 },
                        },
                    }}

                >
                    {!isNurse && <Tab value="documents" label="Documents" />}
                    <Tab value="consent" label="Consent & Forms" />
                    <Tab value="carePlan" label="Care Plan" />
                    <Tab value="incidents" label="Incidents" />
                    <Tab value="appointments" label="Appointment" />
                    <Tab value="provider" label="Provider" />
                </Tabs>
            </Grid>

            {/* ------------------------------------------------------------------- */}

            {/* RIGHT – SEARCH OR FILTER BY DATE + ADD INCIDENT + NEW APPOINTMENT */}
            <Grid size={{ xs: 12, sm: "auto" }}>
                {activeSection === "carePlan" ? (
                    /* ================= CARE PLAN SECTION ================= */
                    <Grid 
                        container 
                        alignItems="center" 
                        spacing={{ xs: 1, sm: 1.5 }}
                        sx={{
                            flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
                        }}
                    >
                        {carePlanInternalTab === 1 && (
                            <Grid size={{ xs: 12, sm: "auto", md: "auto", lg: "auto" }} sx={{ minWidth: 0, flexShrink: 0 }}>
                                <Box
                                    onClick={onToggleCarePlanArchived}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        cursor: "pointer",
                                        color: "primary.main",
                                        transition: "opacity 0.2s",
                                        "&:hover": {
                                            opacity: 0.8,
                                        },
                                    }}
                                >
                                    <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                                    <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                                        Show Archived Goals
                                    </Typography>
                                </Box>
                            </Grid>
                        )}

                        {carePlanInternalTab === 1 && (
                            <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "250px", lg: "250px" }, flexShrink: 1 }}>
                                <CustomInput
                                    name="searchGoals"
                                    placeholder="Search Goals"
                                    value={searchGoals}
                                    onChange={(e) => {
                                        setSearchGoals(e.target.value);
                                    }}
                                    bgWhite
                                    hasStartSearchIcon
                                />
                            </Grid>
                        )}
                    </Grid>
                ) : showSearch ? (
                    /* ================= SEARCH SECTION ================= */
                    <Grid 
                        size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} 
                        sx={{ minWidth: { md: "250px", lg: "250px" }, flexShrink: 1 }}
                    >
                        <CustomInput
                            placeholder={searchPlaceholder}
                            name="search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            bgWhite
                            hasStartSearchIcon
                        />
                    </Grid>
                ) : showIncidentControls ? (
                    /* ================= INCIDENT CONTROLS ================= */
                    <Grid 
                        container 
                        alignItems="center" 
                        spacing={{ xs: 1, sm: 1.5 }}
                        sx={{
                            flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
                        }}
                    >
                        <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "200px", lg: "200px" }, flexShrink: 1 }}>
                            <DatePickerField
                                value={filterDate || null}
                                onChange={(date: Dayjs | null) =>
                                    onFilterDateChange?.(date)
                                }
                                label="Filter by Date"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: 0, flexShrink: 0 }}>
                            <Tooltip title={disabledReason || ""} disableHoverListener={!disabledReason}>
                                <span>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsAddIncidentOpen(true)}
                                        disabled={!!disabledReason}
                                        sx={{
                                            textTransform: "none",
                                            borderRadius: "8px",
                                            boxShadow: "none",
                                            width: { xs: "100%", sm: "auto" },
                                            minWidth: { xs: "100%", sm: "140px" },
                                            height: "44px",
                                            paddingX: { xs: 2, sm: 3 },
                                        }}
                                    >
                                        Add Incident
                                    </Button>
                                </span>
                            </Tooltip>
                        </Grid>

                        <AddNewIncidentDrawer
                            open={isAddIncidentOpen}
                            onClose={handleCloseAddIncident}
                            mode="add"
                            fixedResidentId={residentId}
                            fixedResidentName={residentName}
                        />
                    </Grid>
                ) : showAppointmentControls ? (
                    <Grid 
                        container 
                        alignItems="center" 
                        spacing={{ xs: 1, sm: 1.5 }}
                        sx={{
                            flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
                        }}
                    >
                        <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: { md: "150px", lg: "150px" }, flexShrink: 1 }}>
                            <CustomSelect
                                placeholder="All Status"
                                name="status"
                                value={statusFilter}
                                items={statusOptions}
                                onChange={handleStatusChange}
                                bgWhite
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: 0, flexShrink: 0 }}>
                           <Tooltip title={tooltipMessage} disableHoverListener={!tooltipMessage} arrow>
  <span>
    <Button
      variant="contained"
      onClick={() => {
        document.dispatchEvent(new CustomEvent("resident:new-appointment"));
      }}
      disabled={isDisabled}
      sx={{
        backgroundColor: "primary.dark",
        color: "primary.contrastText",
        borderRadius: "6px",
        padding: "9px 16px",
        textTransform: "none",
        fontWeight: 500,
        fontSize: "14px",
        boxShadow: "none",
        width: { xs: "100%", sm: "auto" },
        "&:hover": { backgroundColor: "primary.main" },
        "&:disabled": {
          backgroundColor: "#C1C7D0",
          color: "#FFFFFF",
        },
      }}
    >
      + New Appointment
    </Button>
  </span>
</Tooltip>
                        </Grid>
                    </Grid>
                ) : showProviderControls ? (
                    /* ================= PROVIDER CONTROLS ================= */
                    <Grid
                        container
                        alignItems="center"
                        spacing={{ xs: 1, sm: 1.5 }}
                        sx={{
                            flexWrap: { xs: "wrap", sm: "wrap", md: "nowrap", lg: "nowrap" },
                        }}
                    >
                        <Grid size={{ xs: 12, sm: 6, md: "auto", lg: "auto" }} sx={{ minWidth: 0, flexShrink: 0 }}>
                            <Tooltip title={disabledReason || ""} disableHoverListener={!disabledReason}>
                                <span>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            document.dispatchEvent(new CustomEvent("resident:new-provider"));
                                        }}
                                        disabled={!!disabledReason}
                                        sx={{
                                            textTransform: "none",
                                            borderRadius: "8px",
                                            boxShadow: "none",
                                            width: { xs: "100%", sm: "auto" },
                                            minWidth: { xs: "100%", sm: "150px" },
                                            height: "44px",
                                            paddingX: { xs: 2, sm: 3 },
                                        }}
                                    >
                                        Add Provider
                                    </Button>
                                </span>
                            </Tooltip>
                        </Grid>
                    </Grid>
                ) : (
                    /* ================= DEFAULT (DATE + ADD INCIDENT) ================= */
                    <Grid container alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
                        <Grid size={{ xs: 12, sm: "auto" }}>
                            <DatePickerField
                                value={filterDate || null}
                                onChange={(date: Dayjs | null) =>
                                    onFilterDateChange?.(date)
                                }
                                label="Filter by Date"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: "auto" }}>
                            <Tooltip title={disabledReason || ""} disableHoverListener={!disabledReason}>
                                <span>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => setIsAddIncidentOpen(true)}
                                        disabled={!!disabledReason}
                                        sx={{
                                            textTransform: "none",
                                            borderRadius: "8px",
                                            boxShadow: "none",
                                            width: "240px",
                                            height: "44px",
                                        }}
                                    >
                                        Add Incident
                                    </Button>
                                </span>
                            </Tooltip>
                        </Grid>

                        <AddNewIncidentDrawer
                            open={isAddIncidentOpen}
                            onClose={handleCloseAddIncident}
                            mode="add"
                            fixedResidentId={residentId}
                            fixedResidentName={residentName}
                        />
                    </Grid>
                )}
            </Grid>

        </Grid>
    );


};

export default ResidentProfileSectionHeader;
