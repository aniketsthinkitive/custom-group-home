import React from "react";
import { Box, Typography, Card, CardContent, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import { useQuery } from "@tanstack/react-query";
import { residentsListOptions } from "../../../sdk/@tanstack/react-query.gen";
import dayjs from "dayjs";

interface ArchivedGoalsDrawerProps {
    open: boolean;
    onClose: () => void;
    residentId: string;
}

const ArchivedGoalsDrawer: React.FC<ArchivedGoalsDrawerProps> = ({
    open,
    onClose,
    residentId,
}) => {
    const theme = useTheme();

    const { data: response, isLoading, error } = useQuery({
        ...residentsListOptions({
            query: {
                resident_uuid: residentId,
                type: "GOAL",
                archived: true,
            } as any,
        }),
        enabled: open && !!residentId,
    });

    const archivedGoals = React.useMemo(() => {
        const body = response as any;
        let list: any[] = [];
        if (Array.isArray(body)) {
            list = body;
        } else if (Array.isArray(body?.results)) {
            list = body.results;
        } else if (Array.isArray(body?.data)) {
            list = body.data;
        }

        return list.slice().sort((a: any, b: any) =>
            dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
        );
    }, [response]);

    return (
        <CustomDrawer
            anchor="right"
            open={open}
            onClose={onClose}
            title="Goal History"
            drawerWidth="550px"
            drawerPadding="0px"
            headerPadding="20px"
        >
            <Box sx={{ p: "20px", pt: "0px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {isLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Typography color="error">Failed to load archived goals.</Typography>
                    </Box>
                ) : archivedGoals.length === 0 ? (
                    <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Typography color="text.secondary">No archived goals found.</Typography>
                    </Box>
                ) : (
                    archivedGoals.map((goal: any) => {
                        const createdAt = dayjs(goal.created_at);
                        const updatedAt = dayjs(goal.updated_at);
                        const deletedAt = goal.deleted_at ? dayjs(goal.deleted_at) : null;

                        const isEdited = updatedAt.diff(createdAt, 'second') > 5;
                        const displayDate = deletedAt || updatedAt;
                        const dateStr = displayDate.isValid() ? displayDate.format("DD-MM-YYYY") : "Unknown Date";

                        const userDetails = isEdited
                            ? (goal.updated_by_details || goal.created_by_details)
                            : goal.created_by_details;

                        const userName = userDetails
                            ? `${userDetails.first_name} ${userDetails.last_name}`
                            : "System";

                        const userRole = userDetails?.role?.name || userDetails?.role || "";
                        const roleStr = userRole ? ` (${userRole})` : "";

                        return (
                            <Card
                                key={goal.uuid || goal.id}
                                variant="outlined"
                                sx={{
                                    borderRadius: "8px",
                                    borderColor: theme.palette.divider,
                                    boxShadow: "none",
                                    mb: 0,
                                }}
                            >
                                <CardContent sx={{ p: "20px !important" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                                        <CalendarTodayOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                        <Typography sx={{ color: "text.primary", fontSize: "14px", fontWeight: 600 }}>
                                            {dateStr}
                                        </Typography>
                                    </Box>

                                    {goal.title && (
                                        <Typography sx={{ color: "text.primary", fontSize: "14px", fontWeight: 600, mb: 1 }}>
                                            {goal.title}
                                        </Typography>
                                    )}

                                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5, fontSize: "12px", fontWeight: 500 }}>
                                        {isEdited ? "Updated Statement:" : "Initial Goal Statement:"}
                                    </Typography>

                                    <Box sx={{
                                        borderLeft: `3px solid ${theme.palette.divider}`,
                                        pl: 1.5,
                                        py: 0,
                                        mb: 1.5,
                                    }}>
                                        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "14px", lineHeight: "20px" }}>
                                            {goal.description || "\u2014"}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" sx={{ fontSize: "14px", color: "text.secondary", mt: 2 }}>
                                        {isEdited ? "Updated By : " : "Created By : "}
                                        <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                            {userName}{roleStr}
                                        </Box>
                                    </Typography>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </Box>
        </CustomDrawer>
    );
};

export default ArchivedGoalsDrawer;
