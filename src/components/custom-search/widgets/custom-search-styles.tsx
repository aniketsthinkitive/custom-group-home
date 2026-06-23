import theme from "../../../constant/styles/theme";

export const btnContainer = {
  height: "40px",
  marginBottom: "20px",
  justifyContent: "space-between",
};

export const filterSearchBox = {
  gap: "10px",
  display: "flex",
};

export const searchBar = {
  border: `0.8px solid ${theme.palette.grey[300]}`,
  borderRadius: "10px",
  backgroundColor: theme.palette.common.white,
  "& fieldset": {
    border: "none",
  },
  ".MuiInputLabel-root": {
    top: "-6px",
    fontSize: "14px",
    color: "#8F8F8F",
  },
  ".MuiOutlinedInput-root": {
    padding: "0px 0px 0px 8px  !important",
    height: "auto !important",
  },
  ".MuiChip-root": {
    height: "28px !important",
  },
};

export const searchIcon = {
  color: theme.palette.grey[500],
};

export const btnStyle = {
  border: `0.8px solid ${theme.palette.grey[300]}`,
  borderRadius: "10px",
  height: "40px",
};
