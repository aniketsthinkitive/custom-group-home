import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
} from "@mui/material";
import { type Dayjs } from "dayjs";
import DatePickerField from "../../../../components/date-picker-field/date-picker-field";
import DocumentsSection from "./DocumentSectionResident";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { client } from "../../../../sdk/client.gen";

/* ===================== ENUM ===================== */

enum DocumentTab {
  ALL = "ALL",
  UNSIGNED = "UNSIGNED",
  SIGNED = "SIGNED",
}

/* ===================== STYLES ===================== */

const tabSx = {
  textTransform: "none",
  minHeight: 40,
  px: 2,
  fontSize: 14,
  fontWeight: 500,
  color: "#6B7280",
  "&.Mui-selected": {
    color: "#2563EB",
  },
} as const;

/* ===================== MAIN ===================== */

const ResidentDocuments = ({ leadId }: { leadId?: string }) => {
  const [activeTab, setActiveTab] = useState<DocumentTab>(DocumentTab.ALL);
  const { residentId } = useParams();
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

  /* UNSIGNED COUNT FOR BADGE */
  const unsignedQuery = useQuery({
    queryKey: [
      "media-unsigned-count",
      leadId ?? "",
      filterDate ? filterDate.format("YYYY-MM-DD") : "",
    ],
    enabled: Boolean(leadId),
    queryFn: async ({ queryKey }) => {
      const [, lid, dateStr] = queryKey as [string, string, string];
      const params = new URLSearchParams({
        content_type: "leads.lead",
        object_uuid: String(lid),
        signed: "false",
        page_size: "1000",
      });
      if (dateStr) params.set("date", dateStr);
      const { data: json } = await client.get({
        url: `/api/media/?${params.toString()}`,
      });
      const jsonData = json as any;
      // Prefer results length to avoid backend count/date inconsistencies
      if (Array.isArray(jsonData?.results)) return jsonData.results.length;
      if (Array.isArray(jsonData?.data?.results)) return jsonData.data.results.length;
      return Number(jsonData?.count) || 0;
    },
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    // Disable polling to prevent continuous API calls; we'll invalidate on sign and tab/date changes
    refetchInterval: false,
    keepPreviousData: false,
    placeholderData: undefined,
    staleTime: 0,
    gcTime: 0,
  });
  const unsignedCount = unsignedQuery.data ?? 0;

  return (
    <Box
      sx={{
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {/* Sub-header: All Documents + Date picker (centered between two lines, same row) */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{
          flexShrink: 0,
          paddingTop: "16px",
          paddingBottom: "16px",
          marginBottom: "16px",
          borderBottom: "1px solid #E5E7EB",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          gap: { xs: 1, sm: 0 },
          rowGap: "12px",
        }}
      >
        <Grid size={{ xs: 12, sm: "auto" }} sx={{ flexShrink: 0 }}>
          <Typography
            component="h2"
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#101828",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              lineHeight: 1.35,
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            All Documents
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: "auto" }} sx={{ flexShrink: 0, display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
          <Box sx={{ width: "200px", minWidth: "200px" }}>
            <DatePickerField
              value={filterDate}
              onChange={(date: Dayjs | null) => setFilterDate(date)}
              label="Filter by Date"
              bgWhite
              format="MM/DD/YYYY"
              showClearIcon={true}
            />
          </Box>
        </Grid>
      </Grid>

      {/* TABS */}
      <Box sx={{ flexShrink: 0, mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 40,
            borderBottom: "1px solid #E5E7EB",
            "& .MuiTabs-indicator": {
              height: 2,
              backgroundColor: "#2563EB",
              borderRadius: "2px 2px 0 0",
            },
            "& .MuiTabs-flexContainer": { gap: "4px" },
          }}
        >
          <Tab
            label="All"
            value={DocumentTab.ALL}
            sx={tabSx}
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Unsigned Documents
                {unsignedQuery.isSuccess && unsignedCount > 0 && (
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 20,
                      height: 20,
                      borderRadius: "10px",
                      backgroundColor: "#F3F4F6",
                      color: "#6B7280",
                      fontSize: 12,
                      fontWeight: 600,
                      px: 0.5,
                      lineHeight: 1,
                    }}
                  >
                    {unsignedCount}
                  </Box>
                )}
              </Box>
            }
            value={DocumentTab.UNSIGNED}
            sx={tabSx}
          />
          <Tab
            label="Signed Documents"
            value={DocumentTab.SIGNED}
            sx={tabSx}
          />
        </Tabs>
      </Box>

      {/* CONTENT — no scroll here; only the table scrolls inside */}
      <Box
        sx={{
          mt: 2,
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {activeTab === DocumentTab.ALL && leadId && (
          <DocumentsSection
            objectId={leadId}
            contentTypeApp="leads"
            contentTypeModel="lead"
            filterDate={filterDate}
          />
        )}
        {activeTab === DocumentTab.UNSIGNED && leadId && (
          <DocumentsSection
            objectId={leadId}
            contentTypeApp="leads"
            contentTypeModel="lead"
            signed={false}
            filterDate={filterDate}
          />
        )}
        {activeTab === DocumentTab.SIGNED && leadId && (
          <DocumentsSection
            objectId={leadId}
            contentTypeApp="leads"
            contentTypeModel="lead"
            signed={true}
            filterDate={filterDate}
          />
        )}
      </Box>
    </Box>
  );
};

export default ResidentDocuments;
