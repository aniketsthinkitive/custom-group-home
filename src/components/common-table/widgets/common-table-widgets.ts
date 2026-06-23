import { tableCellClasses } from "@mui/material/TableCell";
import theme from "../../../constant/styles/theme";

// Table header styling - aligned with Leads table column names (color, font)
export const heading = {
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#F2F7FA",
    color: "#30353A",
    cursor: "pointer",
    padding: "10px 18px",
    height: "auto",
    fontWeight: 600,
    fontSize: "13.5px",
    lineHeight: "1.2",
    borderBottom: "1px solid #E2E5E8",
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  },
  // Regular table cell styling
  [`&.${tableCellClasses.body}`]: {
    padding: "8px 16px", // Reduced padding for smaller row height
    borderBottom: "1px solid #F2F7FA", // Neutral/5 from Figma
    fontSize: "14px",
    lineHeight: "1.2",
    letterSpacing: "0.8%",
    color: "#30353A", // Neutral/80 from Figma
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    // textAlign: "center", // Center align all table cell content
    verticalAlign: "middle", // Center align vertically
  },
};

export const tableCellCss = {
  "& .MuiTableCell-head": {
    backgroundColor: "#F2F7FA",
    borderBottom: "1px solid #E2E5E8",
    color: "#30353A",
    padding: "12px 16px !important",
  },
  "& .MuiTableCell-body": {
    borderBottom: "1px solid #F2F7FA", // Neutral/5
    padding: "8px 16px !important", // Reduced padding for smaller row height
    verticalAlign: "middle", // Center align vertically
  },
};

export const linkCss = {
  textDecoration: "none",
  textOverflow: "ellipsis",
  width: "100%",
  overflow: "hidden",
  cursor: "pointer",
  color: "inherit",
};

export const typographyCss = {
  color: "#30353A", // Neutral/80 from Figma
};

// Typography for client names (primary text)
export const primaryTextCss = {
  color: "#30353A", // Neutral/90 from Figma
  fontWeight: 400,
  fontSize: "14px",
  lineHeight: "1.15",
  letterSpacing: "0.8%",
};

// Typography for secondary text (like organization names)
export const secondaryTextCss = {
  color: "#439322", // Primary/70 Main from Figma
  fontWeight: 500,
  fontSize: "12px",
  lineHeight: "1.2",
  letterSpacing: "1.2%",
};

// Typography for tertiary text (like emails)
export const tertiaryTextCss = {
  color: "#989998", // Neutral/50 from Figma
  fontWeight: 400,
  fontSize: "12px",
  lineHeight: "1.2",
  letterSpacing: "1.2%",
};

export const linkCssWithDecoration = {
  textDecoration: "underline",
};

export const typographyCssForLink = {
  color: theme.palette.primary.dark,
};

export const linkForLink = {
  color: theme.palette.primary.main,
};

// Checkbox styling to match Figma design
export const checkboxCss = {
  padding: 0,
  width: 16,
  height: 16,
  borderRadius: "4px",
  border: "1px solid #A9ACA9", // Neutral/40
  backgroundColor: "#FFFFFF",
  "&.Mui-checked": {
    backgroundColor: "#439322", // Primary color
    borderColor: "#439322",
    color: "#FFFFFF",
  },
};

// Action button styling to match Figma design
export const actionButtonCss = {
  padding: "6px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 500,
  lineHeight: "1.15",
  textTransform: "none",
  minWidth: "auto",
  gap: "8px",
};

// Deny button styling
export const denyButtonCss = {
  ...actionButtonCss,
  color: "#B51C1C", // Error/60
  backgroundColor: "#FFFFFF",
  border: "1px solid transparent",
  "&:hover": {
    backgroundColor: "rgba(181, 28, 28, 0.04)",
  },
};

// Approve button styling
export const approveButtonCss = {
  ...actionButtonCss,
  color: "#10842B", // Success/70
  backgroundColor: "#FFFFFF",
  border: "1px solid transparent",
  "&:hover": {
    backgroundColor: "rgba(16, 132, 43, 0.04)",
  },
};

// Avatar styling
export const avatarCss = {
  width: 32,
  height: 32,
  marginRight: "12px",
};

// Table container styling
export const tableContainerCss = {
  "& .MuiTable-root": {
    borderCollapse: "separate",
    borderSpacing: 0,
  },
  "& .MuiTableHead-root": {
    "& .MuiTableCell-root": {
      backgroundColor: "#F2F2F2", // Neutral/5
      borderBottom: "1px solid #E2E5E8", // Neutral/10
      position: "sticky",
      top: 0,
      zIndex: 1,
    },
  },
  "& .MuiTableBody-root": {
    "& .MuiTableRow-root": {
      "&:hover": {
        backgroundColor: "rgba(67, 147, 34, 0.02)", // Subtle hover effect
      },
    },
    "& .MuiTableCell-root": {
      borderBottom: "1px solid #F2F2F2", // Neutral/5
    },
  },
};

// Skeleton loading styles
export const skeletonRowCss = {
  "&:hover": {
    backgroundColor: "transparent !important", // Disable hover effect during loading
  },
};

export const skeletonCellCss = {
  ...heading,
  [`&.${tableCellClasses.body}`]: {
    padding: "12px 24px",
    borderBottom: "1px solid #F2F2F2",
  },
};
