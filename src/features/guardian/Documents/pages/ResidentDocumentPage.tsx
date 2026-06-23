import { useParams, useLocation } from "react-router-dom";
import Grid from "@mui/material/Grid";
import { useQuery } from "@tanstack/react-query";

import { getLeadDetailOptions } from "../../../../sdk/@tanstack/react-query.gen";

import ResidentProfileDocumentHeader from "../components/ResidentProfileDocumentHeader";
import ResidentDocuments from "../components/ResidentDocuments";

const ResidentDocumentPage = () => {
  const { residentId } = useParams<{ residentId: string }>();
  const location = useLocation();
  const residentData = location.state?.residentData;

  const { data: residentResponse } = useQuery({
    ...getLeadDetailOptions({
      path: { uuid: residentId || "" },
    }),
  });

  const leadId = residentResponse?.data?.uuid;

  return (
    <Grid
      container
      direction="column"
      sx={{
        height: "calc(100vh - 64px)",
        minHeight: { xs: 420, md: 520 },
        width: "100%",
        maxWidth: "100%",
        backgroundColor: "#F6F6F6",
        p: { xs: 2, sm: 3 },
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Grid
        container
        direction="column"
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid #E7E9EB",
          p: { xs: 1.5, sm: 2 },
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <ResidentProfileDocumentHeader
          resident={residentResponse?.data}
          roomNumber={residentData?.room_id}
        />
        <ResidentDocuments leadId={leadId} />
      </Grid>
    </Grid>
  );
};

export default ResidentDocumentPage;
