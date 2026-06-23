import { Box, CircularProgress, Typography, Card, CardContent } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import { useQuery } from "@tanstack/react-query";
import { residentsRetrieveOptions } from "../../../sdk/@tanstack/react-query.gen";
import dayjs from "dayjs";
import { useMemo } from "react";

interface CarePlanHistoryDrawerProps {
    open: boolean;
    onClose: () => void;
    uuid: string | null;
    type: "ADL" | "GOAL";
}

const CarePlanHistoryDrawer = ({ open, onClose, uuid, type }: CarePlanHistoryDrawerProps) => {
    const theme = useTheme();

    const { data, isLoading, error } = useQuery({
        ...residentsRetrieveOptions({ path: { uuid: uuid || "" }, query: { view: "history" } }),
        enabled: !!uuid && open,
    });

    const history = useMemo(() => {
        const item = data as any;
        return item?.data?.history || item?.history || [];
    }, [data]);

    const title = type === "ADL" ? "ADL Overview" : "Goal Overview";

    return (
        <CustomDrawer
            anchor="right"
            open={open}
            onClose={onClose}
            title={title}
            drawerWidth="550px"
            drawerPadding="0px"
            headerPadding="20px"
        >
            <Box sx={{ p: "20px", pt: "0px" }}>
                {isLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">Failed to load history</Typography>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {history.length === 0 ? (
                            <Typography color="text.secondary">No history available</Typography>
                        ) : (
                            history.map((log: any, index: number) => (
                                <Card
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        borderRadius: "8px",
                                        mb: 0,
                                        borderColor: theme.palette.divider,
                                        boxShadow: "none",
                                    }}
                                >
                                    <CardContent sx={{ p: "20px !important" }}>
                                        <Typography sx={{ mb: 1.5, color: "text.primary", fontSize: "14px", fontWeight: 600 }}>
                                            {dayjs(log.log_date).format("DD MMM YYYY")} -{" "}
                                            {log.shift ? log.shift.charAt(0).toUpperCase() + log.shift.slice(1).toLowerCase() : ""} Shift
                                        </Typography>

                                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5, fontSize: "12px", fontWeight: 500 }}>
                                            Note:
                                        </Typography>

                                        <Box
                                            sx={{
                                                borderLeft: `3px solid ${theme.palette.divider}`,
                                                pl: 1.5,
                                                py: 0,
                                                mb: 1.5,
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "14px", lineHeight: "20px" }}>
                                                {log.note || "No note provided."}
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" sx={{ fontSize: "14px", color: "text.secondary", mt: 2 }}>
                                            Entered By :{" "}
                                            <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
                                                {log.created_by_name || "Unknown"}
                                                {log.created_by_role ? ` (${log.created_by_role})` : ""}
                                            </Box>
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </Box>
                )}
            </Box>
        </CustomDrawer>
    );
};

export default CarePlanHistoryDrawer;
