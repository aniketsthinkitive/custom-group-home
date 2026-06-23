import React, { useCallback, useRef, useState, useMemo } from "react";
import dayjs, { Dayjs } from "dayjs";
import { useParams, useLocation } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import { CircularProgress, Typography } from "@mui/material";

import { getLeadDetailOptions } from "../../../../sdk/@tanstack/react-query.gen";
import CarePlanResidentProfileHeader from "../components/CarePlanResidentProfileHeader";
import { useQuery } from "@tanstack/react-query";
import CarePlanTabs from "../components/CarePlanTabs";
import MonthlySummaryTable from "../components/MonthlySummaryTable";
import AdlTable from "../components/AdlTable";

import ViewAdlDrawer from "../components/ViewAdlDrawer";

// Monthly summary → matrix table
const monthlySummaryData: any[] = [];

const CarePlanResidentProfilePage: React.FC = () => {
    const { residentId } = useParams<{ residentId: string }>();
    const location = useLocation();
    const stateResident = location.state?.resident;

    const [tab, setTab] = useState(0);
    const [dateFilter, setDateFilter] = useState<Dayjs | null>(dayjs());
    const [summaryMonth, setSummaryMonth] = useState<string>(String(dayjs().month() + 1));
    const [summaryYear, setSummaryYear] = useState<string>(String(dayjs().year()));
    const [viewAdlDrawerOpen, setViewAdlDrawerOpen] = useState(false);
    const [selectedAdl, setSelectedAdl] = useState<any | null>(null);
    const exportFnRef = useRef<(() => void) | null>(null);

    const handleExportReady = useCallback((fn: () => void) => {
        exportFnRef.current = fn;
    }, []);

    const handleExport = useCallback(() => {
        exportFnRef.current?.();
    }, []);

    // Construct initial data from navigation state if available
    const initialResidentData = useMemo(() => {
        if (!stateResident) return undefined;
        return {
            data: {
                uuid: stateResident.leadUuid,
                status: stateResident.status,
                date_of_birth: stateResident.dateOfBirth,
                gender: stateResident.gender,
                user: {
                    first_name: stateResident.firstName,
                    last_name: stateResident.lastName,
                    avatar_url: stateResident.avatarUrl
                },
                guardian: stateResident.guardian,
                guardian_relation: stateResident.guardian?.relation,
                // Pass room number if needed via a separate way or attach to object if safe
                room_number: stateResident.roomNumber
            }
        };
    }, [stateResident]);

    const { data: leadData, isLoading, isError } = useQuery({
        ...getLeadDetailOptions({
            path: { uuid: residentId! },
        }),
        enabled: !!residentId,
        initialData: initialResidentData as any
    });

    const lead = (leadData as any)?.data ?? (leadData as any) ?? {};
    const residentUuid = lead?.user?.uuid; // User UUID needed for care plan API
    const roomNumber = stateResident?.roomNumber || lead?.room_number || lead?.room?.number;

    const handleViewAdl = (row: any) => {
        setSelectedAdl(row);
        setViewAdlDrawerOpen(true);
    };

    if (isLoading)
        return (
            <Grid
                container
                direction="column"
                sx={{
                    height: "100vh",
                    backgroundColor: "#F5F7FA",
                    display: "flex",
                    alignItems: "center",

                    justifyContent: "center",
                }}
            >
                <CircularProgress size={40} sx={{ color: "#0B3A5A" }} />
            </Grid>
        );
    if (isError || !leadData)
        return (
            <Grid
                container
                direction="column"
                sx={{
                    height: "100vh",
                    backgroundColor: "#F5F7FA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography color="error">Failed to load resident</Typography>
            </Grid>
        );


    return (
        <Grid container direction="column" sx={{ height: "91vh", maxWidth: "100vw", overflow: "hidden" }}>
            <Grid
                sx={{
                    flex: 1,
                    backgroundColor: "#F5F7FA",
                    px: { xs: 1.5, sm: 3 },
                    py: { xs: 1, sm: 2 },
                    overflow: "hidden",
                    maxWidth: "100%",
                }}
            >
                <Grid
                    sx={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E7E9EB",
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        overflow: "hidden",
                        maxWidth: "100%",
                    }}
                >
                    {/* Header */}
                    <CarePlanResidentProfileHeader
                        resident={lead}
                        roomNumber={roomNumber}
                    />

                    {/* Tabs & Filter */}
                    <CarePlanTabs
                        value={tab}
                        onChange={(_, v) => {
                            if (v === null) return;
                            setTab(v);
                            setDateFilter(dayjs());
                        }}
                        selectedDate={dateFilter}
                        onDateChange={setDateFilter}
                        onExport={handleExport}
                        selectedMonth={summaryMonth}
                        selectedYear={summaryYear}
                        onMonthChange={setSummaryMonth}
                        onYearChange={setSummaryYear}
                    />

                    {/* Content */}
                    <Box
                        sx={{
                            flex: 1,
                            p: { xs: 2, sm: 3 },
                            overflow: "hidden",
                            maxWidth: "100%",
                            backgroundColor: "#FFFFFF",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {tab === 0 && (
                            <AdlTable
                                onViewClick={handleViewAdl}
                                selectedDate={dateFilter}
                                residentUuid={residentUuid}
                                onExportReady={handleExportReady}
                            />
                        )}
                        {tab === 1 && <MonthlySummaryTable residentUuid={residentUuid} month={summaryMonth} year={summaryYear} onMonthChange={setSummaryMonth} onYearChange={setSummaryYear} />}
                    </Box>
                </Grid>
            </Grid>

            {/* ADL Drawer */}
            <ViewAdlDrawer
                open={viewAdlDrawerOpen}
                onClose={() => setViewAdlDrawerOpen(false)}
                data={selectedAdl}
            />
        </Grid>
    );
};

export default CarePlanResidentProfilePage;
