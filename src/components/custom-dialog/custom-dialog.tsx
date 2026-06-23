import CloseIcon from "@mui/icons-material/Close";
import { Divider, Grid, Typography } from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import * as React from "react";
import { customDialogStyles } from "./widgets/custom-dialog-styles";

interface CustomDialogProps {
  title: React.ReactNode;
  buttonName: string[];
  open: boolean;
  onClose: (
    event?: React.SyntheticEvent,
    reason?: "backdropClick" | "escapeKeyDown"
  ) => void;
  width?: string | number;
  height?: string | number;
  sx?: object;
  overFlow?: string;
  padding?: string;
}

const CustomDialog = (props: React.PropsWithChildren<CustomDialogProps>) => {
  const {
    onClose,
    open,
    title,
    width,
    height,
    sx = {},
    overFlow,
    padding,
  } = props;
  return (
    <Dialog
      onClose={(event, reason) =>
        onClose(event as React.SyntheticEvent, reason)
      }
      aria-labelledby="customized-dialog-title"
      open={open}
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      sx={{ 
        paper: customDialogStyles.dialog, 
        zIndex: 9999,
        ...sx 
      }}
      PaperProps={{
        sx: {
          width: width || "auto",
          height: height || "auto",
          maxWidth: width || "auto",
        },
      }}
    >
      <DialogTitle
        id="customized-dialog-title"
        sx={customDialogStyles.dialogTitle}
      >
        <Grid
          container
          p={0}
          justifyContent={"space-between"}
          alignContent={"center"}
        >
          <Grid>
            <Typography variant="h6">{title}</Typography>
          </Grid>
          <Grid>
            <IconButton
              aria-label="close"
              onClick={() => onClose()}
              sx={customDialogStyles.closeIcon}
            >
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <Divider orientation="horizontal" sx={{ m: "-10px 0px" }} />
      <DialogContent sx={{ overflow: overFlow, padding: padding }}>
        <Grid flex={1}>{props.children}</Grid>
      </DialogContent>
    </Dialog>
  );
};

export default CustomDialog;
