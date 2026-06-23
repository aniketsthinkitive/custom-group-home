import React, { useState } from "react";
import { Grid } from "@mui/material";
import AllIncidentsSection from "../components/AllIncidentsSection";
import CommonSnackbar from "../../../components/common-snackbar/common-snackbar";

const IncidentsPage: React.FC = () => {
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: "success" | "error";
  }>({
    isOpen: false,
    message: "",
    status: "success",
  });

  return (
    <>
      <Grid
        container
        sx={{
          height: "90vh",
          backgroundColor: "#F6F6F6",
          padding: { xs: "12px", sm: "20px", md: "18px" },
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            minHeight: 0,
          }}
        >
          <AllIncidentsSection
          onSuccess={(message: string) =>
            setSnackbar({ isOpen: true, message, status: "success" })
          }
          onError={(message: string) =>
            setSnackbar({ isOpen: true, message, status: "error" })
          }
        />
        </Grid>
      </Grid>
      <CommonSnackbar
        isOpen={snackbar.isOpen}
        message={snackbar.message}
        status={snackbar.status}
        onClose={() => setSnackbar((s) => ({ ...s, isOpen: false }))}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </>
  );
};

export default IncidentsPage;
