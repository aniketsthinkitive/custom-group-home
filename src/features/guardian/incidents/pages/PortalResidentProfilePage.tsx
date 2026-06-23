import React, { useState, useMemo } from "react";
import { Dayjs } from "dayjs";
import { useParams } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import { useQuery } from "@tanstack/react-query";

import { getLeadDetailOptions } from "../../../../sdk/@tanstack/react-query.gen";
import PortalResidentProfileHeader from "../components/PortalResidentProfileHeader";
import type { Incident } from "../types/incidents.types";
import ResidentIncidentReports from "../components/ResidentIncidentReports";
import { useResidentIncidents } from "../hooks/useResidentIncidents";

const PortalResidentProfilePage: React.FC = () => {
    const { residentId } = useParams<{ residentId: string }>();
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    // Incidents pagination (0-based)
    const [incidentPage, setIncidentPage] = useState(0);
    const [incidentPageSize, setIncidentPageSize] = useState(10);

    const {
        data: leadData,
        isLoading,
        isError,
    } = useQuery(
        getLeadDetailOptions({
            path: {
                uuid: residentId!,   // 👈 THIS calls /api/leads/{uuid}/
            },
        })
    );

    const residentUserUuid = (leadData as any)?.data?.user?.uuid;

    // Format date to YYYY-MM-DD for API
    const formattedDate = useMemo(() => {
        if (!selectedDate) return undefined;
        return selectedDate.format("YYYY-MM-DD");
    }, [selectedDate]);

    const {
        data: incidentsData,
        isLoading: incidentsLoading,
    } = useResidentIncidents(residentUserUuid, formattedDate, incidentPage, incidentPageSize);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError || !leadData) {
        return <div>Failed to load resident</div>;
    }

    // const mapIncidentToCard = (incident: any) => ({
    //     uuid: incident.uuid,
    //     title:
    //         incident.medical_flags?.[0]?.medical_type ||
    //         incident.legal_flags?.[0]?.legal_type ||
    //         "Incident Report",

    //     description: incident.pre_incident_notes || "—",

    //     status: incident.status ? "ACKNOWLEDGED" : "ACTION_REQUIRED",

    //     occurred_at: incident.incident_datetime || incident.created_at,

    //     reported_by: incident.reported_by_details
    //         ? `${incident.reported_by_details.first_name} ${incident.reported_by_details.last_name}`
    //         : "—",
    // });

    return (
       <Box
             sx={{
               height: "91vh",
               overflow: "hidden",
               maxWidth: "100%",
               display: "flex",
               flexDirection: "column",
             }}
           >
            <Box
                sx={{
                    flex: 1,
                    minHeight: 0,
                    backgroundColor: "#F5F7FA",
                    borderRadius: { xs: 0, sm: "10px" },
                    p: { xs: 1, sm: 2, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        backgroundColor: "#FFFFFF",
                        borderRadius: "10px",
                        border: "1px solid #E5E7EB",
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        overflow: "hidden",
                    }}
                >
                    <PortalResidentProfileHeader
                        resident={(leadData as any)?.data}
                        roomNumber={(leadData as any)?.data?.room_number ?? (leadData as any)?.data?.room?.number}
                    />
                    <Box
                        sx={{
                            px: { xs: 1.5, sm: 2, md: 3 },
                            pb: { xs: 1.5, sm: 2, md: 3 },
                            flex: 1,
                            minHeight: 0,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column"
                        }}
                    >
                        <ResidentIncidentReports
                            loading={incidentsLoading}
                            incidents={incidentsData?.incidents || []}
                            selectedDate={selectedDate}
                            onDateChange={(date) => {
                                setSelectedDate(date);
                                setIncidentPage(0); // reset page on filter change
                            }}
                            page={incidentPage}
                            pageSize={incidentPageSize}
                            totalRecords={incidentsData?.totalRecords ?? 0}
                            totalPages={incidentsData?.totalPages ?? 1}
                            onPageChange={setIncidentPage}
                            onPageSizeChange={(size) => {
                                setIncidentPageSize(size);
                                setIncidentPage(0);
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default PortalResidentProfilePage;
