import theme from "../../constant/styles/theme";

export const errorStyle = {
  color: theme.palette.error.main, // Error Red from Figma
  fontSize: "12px",
  marginTop: "4px",
  fontFamily:
    '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
  fontWeight: 400,
  lineHeight: "1.2",
};

export const customInputStyles = {
  textFieldRoot: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: "8px 12px", // Reduced vertical padding from 16px to 8px
    gap: "8px",
    width: "100%",
    minHeight: "44px", // Reduced from 48px to make it smaller
    background: "#FFFFFF",
    border: `1px solid ${theme.palette.grey[400]}`, // Neutral/10 from Figma
    boxShadow: "none", // Removed shadow to match Figma
    borderRadius: "6px",
    fontFamily:
      '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
    "&:hover": {
      borderColor: "#CDD0CD", // Neutral/20 from Figma
      boxShadow: "none", // Explicitly remove shadow on hover
    },
    "&:focus-within": {
      // borderColor: "#439322", // Primary Green from Figma
      boxShadow: "none",
    },
    "&.disabled": {
      backgroundColor: "#F2F2F2", // Neutral/5 from Figma
      borderColor: "#DDE0DD", // Neutral/10 from Figma
      cursor: "not-allowed",
    },
  },
  textFieldInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily:
      '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
    fontStyle: "normal",
    fontWeight: 400,
    fontSize: "16px", // Increased from 14px to match Figma
    lineHeight: "1.5", // 150% line height
    color: "#2C2D2C", // Neutral/80 from Figma
    width: "100%",
    minWidth: 0, // Prevent overflow
    boxSizing: "border-box",
    "&::placeholder": {
      color: "#A9ACA9", // Neutral/40 from Figma
      fontFamily:
        '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
      fontWeight: 400,
      fontSize: "16px",
      lineHeight: "1.5",
      opacity: 1, // Ensure placeholder is visible
    },
    "&.disabled": {
      color: "#A9ACA9", // Neutral/40 from Figma
      cursor: "not-allowed",
    },
    // For single-line inputs (not textarea), prevent placeholder overflow
    "&:not(textarea)": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      "&::placeholder": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },
  },
  textFieldError: {
    borderColor: "#CA1C1C", // Error Red from Figma
    "&:focus-within": {
      borderColor: "#CA1C1C", // Error Red from Figma
      boxShadow: "none",
    },
    "&:hover": {
      borderColor: "#CA1C1C", // Error Red from Figma
      boxShadow: "none",
    },
  },
  iconStyle: {
    width: "20px", // Increased from 18px to match Figma
    height: "20px",
    padding: 0, // Remove MUI IconButton's built-in padding so it matches plain icons (keeps field height consistent)
    color: "#2C2D2C", // Neutral/80 from Figma
    flexShrink: 0,
    "&:hover": { backgroundColor: "transparent" },
    "& svg": {
      width: "20px", // Clamp SVG to button size (MUI icons default to 24px and overflow the 20px button)
      height: "20px",
    },
  },
  // Additional styles for different states
  // textFieldFocus: {
  //   borderColor: "#439322", // Primary Green from Figma
  //   "& input": {
  //     // color: "#439322", // Primary Green text when focused
  //   },
  // },
  textFieldDisabled: {
    backgroundColor: "#F2F2F2", // Neutral/5 from Figma
    borderColor: "#DDE0DD", // Neutral/10 from Figma
    cursor: "not-allowed",
    "& input": {
      color: "#A9ACA9", // Neutral/40 from Figma
      cursor: "not-allowed",
    },
    "& .iconStyle": {
      color: "#A9ACA9", // Neutral/40 from Figma
    },
  },
};
