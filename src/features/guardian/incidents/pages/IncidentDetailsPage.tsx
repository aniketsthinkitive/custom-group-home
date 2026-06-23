import React from "react";
import { Grid } from "@mui/material";
import AllIncidentsDetails from "../components/AllIncidentsDetails";

const IncidentDetailsPage: React.FC = () => {
  return (
    <Grid
      sx={{
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AllIncidentsDetails />
    </Grid>
  );
};

export default IncidentDetailsPage;
