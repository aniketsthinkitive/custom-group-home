import { Button, Grid, Typography } from "@mui/material";
import CustomDialog from "../custom-dialog/custom-dialog";
import React from "react";

type ConfirmationPopUpProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string | React.ReactNode;
  sx?: object;
  /** Disable the confirm button when true */
  confirmDisabled?: boolean;
  /** Optional error/helper message shown under the main message */
  errorMessage?: string | null;
};

const ConfirmationPopUp = (props: ConfirmationPopUpProps) => {
  const { open, onClose, onConfirm, message, sx } = props;
  const { confirmDisabled, errorMessage } = props;
  return (
    <CustomDialog
      width={"400px"}
      title={"Confirm"}
      buttonName={[]}
      open={open}
      onClose={() => onClose()}
      sx={sx}
    >
      <Grid container flexDirection={"column"} rowGap={2}>
        <Typography variant="inputTitle">
          {message || "Do you really want to go ahead with this operation?"}
        </Typography>
        {errorMessage ? (
          <Typography variant="body2" sx={{ color: "error.main" }}>
            {errorMessage}
          </Typography>
        ) : null}
        <Grid
          container
          width={"100%"}
          justifyContent={"flex-end"}
          columnGap={1}
        >
          <Button
            variant="contained"
            onClick={() => onConfirm()}
            disabled={!!confirmDisabled}
            sx={{
              backgroundColor: "#173B5B",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "14px",
              "&:hover": {
                backgroundColor: "#0F2A42",
              },
              "&:disabled": {
                backgroundColor: "#C1C7D0",
                color: "#FFFFFF",
              },
              "& .MuiTypography-root": {
                color: "inherit",
              },
            }}
          >
            <Typography variant="buttonLinkAndField3" sx={{ color: "#FFFFFF" }}>
              {"Confirm"}
            </Typography>
          </Button>
          <Button
            variant="outlined"
            onClick={() => onClose()}
            sx={{
              backgroundColor: "#FFFFFF",
              color: "#42526E",
              border: "1px solid #C1C7D0",
              borderRadius: "6px",
              padding: "8px 16px",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "14px",
              "&:hover": {
                backgroundColor: "#F9FAF9",
                borderColor: "#A9ACA9",
              },
            }}
          >
            <Typography variant="buttonLinkAndField3">{"Cancel"}</Typography>
          </Button>
        </Grid>
      </Grid>
    </CustomDialog>
  );
};

export default ConfirmationPopUp;
