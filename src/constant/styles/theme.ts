import { createTheme } from "@mui/material/styles";
import { gridBreakpoints } from "./grid";

// Extend MUI Typography variants to include custom Figma styles
declare module "@mui/material/styles" {
  interface TypographyVariants {
    body3Medium: React.CSSProperties;
    body4Medium: React.CSSProperties;
    body5Regular: React.CSSProperties;
    body5Medium: React.CSSProperties;
    inputTitle: React.CSSProperties;
    buttonLinkAndField3: React.CSSProperties;
    body5: React.CSSProperties;
  }

  // Allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    body3Medium?: React.CSSProperties;
    body4Medium?: React.CSSProperties;
    body5Regular?: React.CSSProperties;
    body5Medium?: React.CSSProperties;
    inputTitle?: React.CSSProperties;
    buttonLinkAndField3?: React.CSSProperties;
    body5?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    body3Medium: true;
    body4Medium: true;
    body5Regular: true;
    body5Medium: true;
    inputTitle: true;
    buttonLinkAndField3: true;
    body5: true;
  }
}

// Colors from Figma design 
const colors = {
  primary: {
    main: "#11466D", // Primary from Figma
    light: "#0A2E45", // Primary/60
    dark: "#0A2E45", // Primary/80
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#1A75AD", // Supporting Teal from Figma
    light: "#1F8ACB", // Supporting/40
    dark: "#  124F74", // Supporting/80
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#CA1C1C", // Negative/Error from Figma
    light: "#DB3D3D", // Error/40
    dark: "#880C0C", // Error/80
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#E06615", // Warning from Figma
    light: "#E69946", // Warning/40
    dark: "#7C4407", // Warning/80
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#256ACC", // Informative from Figma
    light: "#4685DE", // Informative/40
    dark: "#0A3674", // Informative/80
    contrastText: "#FFFFFF",
  },
  success: {
    main: "#29BC4C", // Positive/Success from Figma
    light: "#4FD264", // Success/40
    dark: "#096819", // Success/80
    contrastText: "#FFFFFF",
  },
  grey: {
    50: "#F9FAF9", // Neutral/1
    100: "#F2F2F2", // Neutral/5
    200: "#DDE0DD", // Neutral/10
    300: "#CDD0CD", // Neutral/20
    400: "#C5C9C5", // Neutral/30
    500: "#A9ACA9", // Neutral/40
    600: "#989998", // Neutral/50
    700: "#70777D", // Neutral/60
    800: "#424342", // Neutral/70
    900: "#1E242A", // Neutral/90
  },
  text: {
    primary: "#2C2D2C", // Neutral/80 from Figma
    secondary: "#989998", // Neutral/50 from Figma
    disabled: "#A9ACA9", // Neutral/40 from Figma
  },
  background: {
    default: "#F9FAF9", // Neutral/1 from Figma
    paper: "#FFFFFF",
  },
  divider: "#E7E9EB", // Border/02 from Figma
};

// Typography from Figma design 
const typography = {
  fontFamily:
    '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
  h1: {
    fontSize: "48px", // Large display text from Figma
    fontWeight: 600, // Semi Bold
    lineHeight: 1.2,
    color: colors.text.primary,
  },
  h2: {
    fontSize: "40px", // Medium display text
    fontWeight: 600, // Semi Bold
    lineHeight: 1.2,
    color: colors.text.primary,
  },
  h3: {
    fontSize: "32px", // Small display text
    fontWeight: 600, // Semi Bold
    lineHeight: 1.125,
    color: colors.text.primary,
  },
  h4: {
    fontSize: "24px", // Large heading
    fontWeight: 600, // Semi Bold
    lineHeight: 1.2,
    color: colors.text.primary,
  },
  h5: {
    fontSize: "20px", // Medium heading
    fontWeight: 500, // Medium
    lineHeight: 1.2,
    color: colors.text.primary,
  },
  h6: {
    fontSize: "18px", // Small heading
    fontWeight: 500, // Medium
    lineHeight: 1.2,
    color: colors.text.primary,
  },
  body1: {
    fontSize: "16px", // Large body text
    fontWeight: 400, // Regular
    lineHeight: 1.5,
    color: colors.text.primary,
  },
  body2: {
    fontSize: "14px", // Medium body text
    fontWeight: 400, // Regular
    lineHeight: 1.57,
    color: colors.text.secondary,
  },
  button: {
    fontSize: "16px",
    fontWeight: 500, // Medium
    lineHeight: 1.25,
    textTransform: "none" as const,
  },
  caption: {
    fontSize: "12px", // Small text
    fontWeight: 400, // Regular
    lineHeight: 1.2,
    color: colors.text.secondary,
  },
  overline: {
    fontSize: "12px",
    fontWeight: 500, // Medium
    lineHeight: 1.6,
    textTransform: "uppercase" as const,
    color: colors.text.secondary,
  },
  // Additional typography styles from Figma
  subtitle1: {
    fontSize: "16px",
    fontWeight: 500, // Medium
    lineHeight: 1.5,
    color: colors.text.primary,
  },
  subtitle2: {
    fontSize: "14px",
    fontWeight: 500, // Medium
    lineHeight: 1.57,
    color: colors.text.primary,
  },
  // Figma Single Line Body Styles
  body3Medium: {
    fontSize: "16px",
    fontWeight: 500, // Medium
    lineHeight: 1.2, // 19.2px
    letterSpacing: "0.004em", // 0.4%
    color: colors.text.primary,
  },
  body4Medium: {
    fontSize: "14px",
    fontWeight: 500, // Medium
    lineHeight: 1.15, // 16.1px
    letterSpacing: "0.012em", // 1.2%
    color: colors.grey[800], // Neutral/70
  },
  body5Regular: {
    fontSize: "12px",
    fontWeight: 400, // Regular
    lineHeight: 1.2, // 14.4px
    letterSpacing: "0.012em", // 1.2%
    color: colors.grey[700], // Neutral/60
  },
  body5Medium: {
    fontSize: "12px",
    fontWeight: 500, // Medium
    lineHeight: 1.2, // 14.4px
    letterSpacing: "0.012em", // 1.2%
  },
  // Additional custom variants
  inputTitle: {
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.5,
    color: colors.text.primary,
  },
  buttonLinkAndField3: {
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: 1.5,
    color: colors.text.primary,
  },
  body5: {
    fontSize: "12px",
    fontWeight: 400,
    lineHeight: 1.2,
    color: colors.grey[600],
  },
};

// Create the theme
export const theme = createTheme({
  palette: colors,
  typography,
  shape: {
    borderRadius: 3, // From Figma design
  },
  spacing: 8, // 8px base spacing unit
  breakpoints: {
    values: {
      xs: 0,
      sm: gridBreakpoints.tablet.xs, // 744px - iPad mini
      md: gridBreakpoints.tablet.md, // 1024px - iPad Pro 12.9"
      lg: gridBreakpoints.desktop.sm, // 1440px - Desktop 2 (Current Design)
      xl: gridBreakpoints.desktop.md, // 1920px - Desktop 1
    },
  },
  components: {
    // Button overrides
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 500,
          // WCAG 2.5.8 / Apple HIG: minimum 44px touch target for tablet use.
          minHeight: 44,
          boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
          "&:hover": {
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.1)",
          },
        },
        contained: {
          backgroundColor: colors.primary.main,
          color: colors.primary.contrastText,
          border: `1px solid ${colors.primary.main}`,
          "&:hover": {
            backgroundColor: colors.primary.dark,
            borderColor: colors.primary.dark,
          },
          "&:disabled": {
            backgroundColor: colors.grey[300],
            color: colors.grey[500],
            borderColor: colors.grey[300],
          },
        },
        outlined: {
          borderColor: colors.primary.main,
          color: colors.primary.main,
          "&:hover": {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrastText,
          },
        },
        text: {
          color: colors.primary.main,
          "&:hover": {
            backgroundColor: "rgba(67, 147, 34, 0.04)",
          },
        },
        sizeLarge: {
          padding: "10px 18px",
          fontSize: "16px",
          lineHeight: 1.25,
        },
        sizeMedium: {
          padding: "8px 16px",
          fontSize: "14px",
          lineHeight: 1.15,
        },
        sizeSmall: {
          padding: "6px 12px",
          fontSize: "12px",
          lineHeight: 1.2,
        },
      },
    },

    // IconButton overrides — enforce a 44x44 touch target (WCAG 2.5.8 / Apple
    // HIG) while leaving the inner icon size untouched. Covers table row action
    // icons, filter triggers, and TablePagination prev/next arrows.
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },

    // Tab overrides — tab navigation items must be reliably tappable.
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          minWidth: 44,
        },
      },
    },

    // Pagination item overrides — page number / chevron controls.
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },

    // TextField overrides
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 6,
            backgroundColor: colors.background.paper,
            border: `1px solid ${colors.divider}`,
            boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
            "&:hover": {
              borderColor: colors.primary.main,
            },
            "&.Mui-focused": {
              borderColor: colors.primary.main,
              boxShadow: `0px 0px 0px 1px ${colors.primary.main}`,
            },
            "&.Mui-error": {
              borderColor: colors.error.main,
            },
          },
          "& .MuiInputLabel-root": {
            fontSize: "12px",
            fontWeight: 500,
            lineHeight: 1.6,
            color: colors.text.secondary,
            "&.Mui-focused": {
              color: colors.primary.main,
            },
            "&.Mui-error": {
              color: colors.error.main,
            },
          },
          "& .MuiInputBase-input": {
            fontSize: "14px",
            lineHeight: 1.6,
            color: colors.text.primary,
            "&::placeholder": {
              color: colors.text.disabled,
              opacity: 1,
            },
          },
          "& .MuiFormHelperText-root": {
            fontSize: "12px",
            lineHeight: 1.2,
            marginTop: 4,
            "&.Mui-error": {
              color: colors.error.main,
            },
          },
        },
      },
    },

    // Checkbox overrides
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 0,
          "&.Mui-checked": {
            color: colors.primary.main,
          },
          "&.Mui-disabled": {
            color: colors.grey[400],
          },
        },
        sizeSmall: {
          width: 16,
          height: 16,
        },
      },
    },

    // FormControlLabel overrides
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          marginRight: 0,
          "& .MuiFormControlLabel-label": {
            fontSize: "14px",
            lineHeight: 1.6,
            color: colors.text.primary,
            marginLeft: 8,
          },
        },
      },
    },

    // Paper overrides
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
        },
        elevation1: {
          boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.04)",
        },
        elevation2: {
          boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.08)",
        },
        elevation3: {
          boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.12)",
        },
      },
    },

    // Link overrides
    MuiLink: {
      styleOverrides: {
        root: {
          color: colors.primary.main,
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        },
      },
    },

    // CircularProgress overrides
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colors.primary.main,
        },
      },
    },
  },
});

export default theme;
