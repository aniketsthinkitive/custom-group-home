import theme from "../../../constant/styles/theme";

export const customSelectStyles = {
  headerLabel: {
    // fontSize: "0.9rem !important",
    // wordWrap: "break-word",
    // fontStyle: "normal !important",
    // fontWeight: "400 !important",
    // lineHeight: "130% !important",
    // letterSpacing: "0.12px !important",
  },
};

export const selectInputStyle = {
  border: `1px solid ${theme.palette.grey[400]}`, // Default border - show always
  outline: "none",
  "& .MuiSelect-select": {
    paddingRight: "32px !important",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  },
  "& .MuiSelect-icon": {
    right: "8px",
    pointerEvents: "none",
  },
  ".MuiOutlinedInput-notchedOutline": {
    border: "none !important", // Remove MUI default border completely
    boxShadow: "none !important",
    outline: "none !important",
  },
  height: "44px", // Match CustomInput height exactly
  width: "100%",
  borderRadius: "6px", // Match CustomInput border radius
  boxShadow: "none", // Remove shadow to match CustomInput
  fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
  "&:hover": {
    border: `1px solid ${theme.palette.grey[400]}`, // Keep same border on hover
    outline: "none",
  },
  "&.Mui-focused": {
    // border: "0.5px solid #439322", // Match CustomInput focus border color
    outline: "none",
  },

  ".css-11u53oe-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input": {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px", // Match CustomInput padding exactly
    fontSize: "16px", // Match CustomInput font size
    fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
    fontWeight: 400,
    lineHeight: "1.5",
    color: "#2C2D2C", // Neutral/80 from Figma
    border: "none !important",
    outline: "none !important",
  },
  "&.Mui-error": {
    border: "0.5px solid #CA1C1C", // Match CustomInput error border
    padding: "0px!important",
    outline: "none",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none !important", // Remove MUI focus border
    boxShadow: "none !important",
    outline: "none !important",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    border: "none !important", // Remove MUI hover border
    boxShadow: "none !important",
    outline: "none !important",
  },
  // Apply border to the root input element
  "& .MuiOutlinedInput-root": {
    border: `1px solid ${theme.palette.grey[400]} !important`, // Show border always
    outline: "none !important",
    borderRadius: "6px", // Match border radius
    "&:hover": {
      border: `1px solid ${theme.palette.grey[400]} !important`, // Keep same border on hover
      outline: "none !important",
    },
    "&.Mui-focused": {
      border: `1px solid ${theme.palette.grey[400]} !important`, // Keep border on focus
      outline: "none !important",
    },
  },
};

export const someStyle = {
  ".MuiOutlinedInput-notchedOutline": { border: 0 },
  border: `1px solid ${theme.palette.grey[400]}`,
  height: "44px !important", // Matches button medium size height
  width: "100%",
  borderRadius: "8px",
  ".Mui-readOnly": {
    borderRadius: "8px",
    border: `1px solid ${theme.palette.grey[400]}`,
    padding: "10px !important",
  },
  ".css-11u53oe-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input": {
    display: "flex",
    alignItems: "center",
  },
};
