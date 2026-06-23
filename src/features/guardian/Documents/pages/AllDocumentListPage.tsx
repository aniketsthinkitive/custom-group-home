import React from "react";
import { Box } from "@mui/material";
import AllDocumentDetails from "../components/AllDocumentDetails";

const AllDocumentListPage: React.FC = () => {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AllDocumentDetails />
    </Box>
  );
};

export default AllDocumentListPage;
