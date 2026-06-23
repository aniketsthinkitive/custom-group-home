import theme from "../../../constant/styles/theme";

export const customDialogStyles = {
  dialog: {
    "& .MuiDialogContent-root": {
      padding: 10,
      backgroundColor: theme.palette.common.white,
    },
    "& .MuiDialogActions-root": {
      padding: 10,
      backgroundColor: theme.palette.common.white,
    },
    "& .MuiDialog-paper": {
      borderRadius: "12px",
      boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.12)",
      border: "1px solid #E3ECEF",
      zIndex: 9999,
    },
    "& .MuiBackdrop-root": {
      zIndex: 9998,
    },
  },
  dialogTitle: {
    color: "#2C2D2C",
    fontFamily: "Geist",
    fontSize: "20px",
    fontWeight: 700,
    padding: "20px 24px 16px",
    "& .MuiTypography-root": {
      fontWeight: 600,
      fontSize: "20px",
      fontFamily: "Geist",
      color: "#2C2D2C",
      lineHeight: 1.2,
    },
  },

  closeIcon: {
    color: "#2C2D2C",
    marginTop: "-10px",
    marginRight: "-15px",
    "&:hover": {
      backgroundColor: "#F6F6F6",
      borderRadius: "18px",
    },
  },
};
