import type { SxProps, Theme } from "@mui/material/styles";
import { theme } from "../../constant/styles/theme";

// Main container for the pagination component
export const paginatorContainerStyles: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  padding: "10px 16px",
  // borderTop: `1px solid #E7E9EB`,
  borderRadius: "0px 0px 10px 10px",
  backgroundColor: theme.palette.common.white,
  gap: "16px",
  // Responsive design for small screens
  [theme.breakpoints.down('sm')]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "12px",
    padding: "8px 12px",
  },
};

// Container for pagination controls (rows per page + pagination)
export const paginationControlsStyles: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexShrink: 0,
  // Responsive design for small screens
  [theme.breakpoints.down('sm')]: {
    width: "100%",
    justifyContent: "space-between",
    gap: "8px",
    flexDirection: "column",
    alignItems: "center",
  },
};

// Rows per page container
export const rowsPerPageContainerStyles: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "0px 4px",
  minWidth: "135px",
  width: "auto",
  backgroundColor: theme.palette.common.white,
  borderRadius: "2px",
  flexShrink: 0,
  // Responsive design for small screens
  [theme.breakpoints.down('sm')]: {
    minWidth: "120px",
    gap: "2px",
  },
};

// Pagination main container
export const paginationMainStyles: SxProps<Theme> = {
  display: "inline-flex",
  border: "1px solid #E7E9EB",
  borderRadius: "4px",
  backgroundColor: theme.palette.common.white,
  overflow: "hidden",
  "& .MuiPagination-ul": {
    gap: 0,
    margin: 0,
    padding: 0,
    display: "flex",
    "& li": {
      margin: 0,
      padding: 0,
      "&:not(:last-child) .MuiPaginationItem-root": {
        borderRight: "1px solid #E7E9EB",
      },
      "&:first-of-type .MuiPaginationItem-root": {
        borderRadius: "4px 0 0 4px !important",
      },
      "&:last-of-type .MuiPaginationItem-root": {
        borderRadius: "0 4px 4px 0 !important",
      },
    },
  },
  // Responsive design for small screens
  [theme.breakpoints.down('sm')]: {
    "& .MuiPagination-ul": {
      gap: 0,
    },
  },
};

// Individual pagination item styles
export const paginationItemStyles: SxProps<Theme> = {
  width: "40px",
  height: "40px",
  minWidth: "40px",
  borderRadius: 0,
  border: "none",
  margin: 0,
  padding: 0,
  "&.Mui-selected": {
    backgroundColor: "#E8F0F5", // Light blue-grey background
    color: "#202120", // Neutral/100 from Figma
    fontFamily: "Figtree",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "19.92px",
    letterSpacing: "0.4px",
    "&:hover": {
      backgroundColor: "#E8F0F5",
    },
  },
  "&:not(.Mui-selected)": {
    backgroundColor: "transparent",
    color: "#202120", // Neutral/100 from Figma
    fontFamily: "Figtree",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "19.92px",
    letterSpacing: "0.4px",
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
  },
  // Responsive design for small screens
  [theme.breakpoints.down('sm')]: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    "&.Mui-selected": {
      fontSize: "12px",
    },
    "&:not(.Mui-selected)": {
      fontSize: "12px",
    },
  },
};

// Navigation button styles (Previous/Next)
export const navigationButtonStyles: SxProps<Theme> = {
  width: "40px",
  height: "40px",
  minWidth: "40px",
  borderRadius: 0,
  border: "none",
  margin: 0,
  padding: 0,
  backgroundColor: "transparent",
  "&.Mui-disabled": {
    opacity: 0.38,
    backgroundColor: "transparent",
    "& svg": {
      fill: "rgba(77, 79, 77, 0.38)", // Neutral/90 with opacity
    },
  },
  "&:not(.Mui-disabled)": {
    "&:hover": {
      backgroundColor: theme.palette.grey[50],
    },
    "& svg": {
      fill: "#4D4F4D", // Neutral/90 from Figma
    },
  },
  // Responsive design for small screens
  [theme.breakpoints.down('sm')]: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    "& svg": {
      width: "16px",
      height: "16px",
    },
  },
};

// Rows per page select styles
export const recordsSelectStyles: SxProps<Theme> = {
  "& .MuiSelect-select": {
    padding: 0,
    border: "none",
    fontSize: "14px",
    fontFamily: "Inter",
    fontWeight: 500,
    lineHeight: "14.4px",
    color: "#2C2D2C", // Neutral/80 from Figma
    marginTop: "8px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiSelect-icon": {
    color: "#2C2D2C", // Neutral/80 from Figma
    marginTop: "1px",
  },
};

// Rows per page label styles
export const rowsPerPageLabelStyles: SxProps<Theme> = {
  fontSize: "14px",
  fontFamily: "Inter",
  fontWeight: 400,
  lineHeight: "14.4px",
  color: "#2C2D2C", // Neutral/80 from Figma
  whiteSpace: "nowrap",
  flexShrink: 0,
};

// Entries text styles (Showing X to Y of Z entries)
export const entriesTextStyles: SxProps<Theme> = {
  fontSize: "14px",
  fontFamily: "Inter",
  fontWeight: 400,
  lineHeight: "14.4px",
  color: "#2C2D2C", // Neutral/80 from Figma
  "& span": {
    fontWeight: 700,
    color: "#202120", // Darker color for bold numbers
  },
};
