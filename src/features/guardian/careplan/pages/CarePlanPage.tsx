import React from "react";
import { Grid } from "@mui/material";
import AllCarePlansDetails from "../components/AllCarePlansDetails";

const CarePlanPage: React.FC = () => {
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
      <AllCarePlansDetails />
    </Grid>
  );
};

export default CarePlanPage;
