// MonthlyDataTrackerHRSTDrawer.tsx
import React, { useRef } from "react";
import { Grid, IconButton, Typography } from "@mui/material";
import { Print, Close } from "@mui/icons-material";
import CustomDrawer from "../../../components/custom-drawer/custom-drawer";
import CustomButton from "../../../components/custom-buttons/custom-buttons";
import MonthlyDataTrackerHRSTForm from "./MonthlyDataTrackerHRSTForm";

export interface MonthlyDataTrackerHRSTDrawerProps {
  open: boolean;
  onClose: () => void;
  residentName?: string;
  residentId?: string | number;
  formName?: string;
  residentData?: any;
  consentUuid?: string | null;
  mode?: "new" | "draft" | "view" | "edit";
  historyEntry?: any;
  onAfterSave?: () => void;
  onAfterSubmit?: () => void;
}

const MonthlyDataTrackerHRSTDrawer: React.FC<MonthlyDataTrackerHRSTDrawerProps> = ({
  open,
  onClose,
  residentName = "",
  residentId = "",
  formName = "Monthly Data Tracker (HRST)",
  residentData,
  consentUuid,
  mode,
  historyEntry,
  onAfterSave,
  onAfterSubmit,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;

    // Grab drawer content HTML
    const html = content.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>${formName}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
            /* Make tables print nicely */
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; vertical-align: middle; }
            th { background: #f2f7fa; font-weight: 600; }
            /* Disable sticky for print */
            [style*="position: sticky"] { position: static !important; }
            /* Remove scroll wrappers effect */
            .print-no-scroll { overflow: visible !important; height: auto !important; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-no-scroll">
            ${html}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <CustomDrawer open={open} onClose={onClose} anchor="right" drawerWidth="1200px" drawerPadding="0">
      <Grid
        container
        direction="column"
        sx={{
          height: "100%",
          overflow: "hidden", // drawer should not scroll
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Sticky Header */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            backgroundColor: "#FFFFFF",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", sm: "nowrap" },
            padding: { xs: "12px 16px", sm: "16px 24px" },
            borderBottom: "1px solid #E3ECEF",
            gap: { xs: 1, sm: 0 },
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#424342",
              fontFamily: "Geist",
              lineHeight: "24px",
              m: 0,
            }}
          >
            {formName}
          </Typography>

          <Grid container alignItems="center" spacing={2}>
            <Grid>
              {/* <CustomButton variant="text" size="sm" icon={<Print />} onClick={handlePrint}>
                Print
              </CustomButton> */}
            </Grid>
            <Grid>
              <IconButton
                onClick={onClose}
                sx={{
                  padding: "4px",
                  color: "#757775",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                }}
              >
                <Close />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>

        {/* Body - scrollable */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            scrollbarWidth: "thin",
            scrollbarColor: "#888 #f1f1f1",
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#f1f1f1",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#888",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#555",
            },
          }}
        >
          <div ref={printRef}>
            <MonthlyDataTrackerHRSTForm
              open={open}
              residentName={residentName}
              residentId={residentId}
              formName={formName}
              residentData={residentData}
              consentUuid={consentUuid}
              mode={mode}
              historyEntry={historyEntry}
              onAfterSave={onAfterSave}
              onAfterSubmit={onAfterSubmit}
              onClose={onClose}
            />
          </div>
        </Grid>
      </Grid>
    </CustomDrawer>
  );
};

export default MonthlyDataTrackerHRSTDrawer;
