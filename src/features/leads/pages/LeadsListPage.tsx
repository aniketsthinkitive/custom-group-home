import { Box, Grid } from "@mui/material";
import { useState, useCallback } from "react";

import LeadsHeader from "../components/LeadsHeader";
import LeadsTableWithPagination from "../components/LeadsTableWithPagination";
import NewLeadDrawer from "../components/NewLeadDrawer";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";


const LeadsListPage = () => {
  const [drawerKey, setDrawerKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [status, setStatus] = useState("");


  /** -------------------------
   * UI handlers - Memoized to prevent infinite loops
   * ------------------------*/
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
  }, []);

  const handleNewLead = useCallback(() => {
    setDrawerKey(prev => prev + 1); // 🔥 force fresh drawer
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const handleAddLead = () => {
    // Query invalidation is handled in NewLeadDrawer
    // This callback can be used for additional actions if needed
  };

  return (
    <Grid
      container
      sx={{
        height: { xs: "100vh", sm: "90vh" },
        backgroundColor: "#F6F6F6",
        padding: { xs: "8px", sm: "12px", md: "18px" },
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Grid
        size={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FFFFFF",
            borderRadius: { xs: "8px", sm: "10px" },
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
            height: "100%",
            overflow: "hidden",
            flex: 1,
            minHeight: 0,
            width: "100%",
          }}
        >
          <LeadsHeader onSearch={handleSearch} onStatusChange={handleStatusChange} onNewLead={handleNewLead} status={status} />

          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              width: "100%",
            }}
          >
            <LeadsTableWithPagination searchTerm={searchTerm} status={status} />
          </Box>
        </Box>
      </Grid>

      <CustomDrawer
        anchor="right"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        drawerWidth="825px"
        drawermargin="0"
        drawerPadding="0"
      >
        {isDrawerOpen && (
          <NewLeadDrawer
            key={drawerKey} 
            onClose={handleCloseDrawer}
            onAddLead={handleAddLead}
          />
        )}
      </CustomDrawer>
    </Grid>
  );
};

export default LeadsListPage;
