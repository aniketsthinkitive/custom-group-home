import { theme } from "../../constant/styles/theme";

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'text'
  | 'icon'
  | 'floating'
  | 'black'
  | 'black-outlined'
  | 'black-filled';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonState = 'default' | 'hover' | 'focus' | 'active' | 'disabled';

export interface ButtonStyles {
  button: React.CSSProperties;
  buttonHover: React.CSSProperties;
  buttonFocus: React.CSSProperties;
  buttonActive: React.CSSProperties;
  buttonDisabled: React.CSSProperties;
  text: React.CSSProperties;
  textDisabled: React.CSSProperties;
  icon: React.CSSProperties;
  iconDisabled: React.CSSProperties;
  ripple: React.CSSProperties;
}

export const getButtonStyles = (
  variant: ButtonVariant,
  size: ButtonSize,
  fullWidth: boolean = false
): ButtonStyles => {
  const baseFontFamily = '"Helvetica Neue", "Inter", "Geist", "Roboto", "Arial", sans-serif';
  
  // Ensure we have valid parameters
  const safeVariant = variant || 'primary';
  const safeSize = size || 'md';
  
  // Size configurations
  const sizeConfig = {
    sm: {
      fontSize: '14px',
      padding: '8px 16px',
      height: '32px',
      borderRadius: '6px',
      iconSize: '16px',
      minWidth: '80px',
    },
    md: {
      fontSize: '14px',
      padding: '10px 16px',
      height: '38px',
      borderRadius: '6px',
      iconSize: '18px',
      minWidth: '100px',
    },
    lg: {
      fontSize: '16px',
      padding: '12px 20px',
      height: '42px',
      borderRadius: '6px',
      iconSize: '20px',
      minWidth: '120px',
    },
  };

  const config = sizeConfig[safeSize] || sizeConfig.md; // Fallback to 'md' if invalid size
  
  // Ensure config has all required properties
  if (!config || !config.fontSize || !config.padding || !config.height) {
    return getButtonStyles(safeVariant, 'md', fullWidth);
  }

  // Base button styles
  const baseButton: React.CSSProperties = {
    fontFamily: baseFontFamily,
    fontSize: config.fontSize,
    fontWeight: 500,
    lineHeight: '1.15',
    letterSpacing: '0%',
    textTransform: 'none',
    borderRadius: config.borderRadius,
    height: config.height,
    width: fullWidth ? '100%' : 'auto',
    minWidth: fullWidth ? '100%' : 'auto',
    maxWidth: fullWidth ? '100%' : 'none',
    padding: config.padding,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    borderWidth: '0',
    borderStyle: 'none',
    borderColor: 'transparent',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
  };

  // Variant-specific styles
  const variantStyles = {
    primary: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      boxShadow: `0 4px 4px ${hexToRgba(theme.palette.primary.main, 0.2)}`,
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: `0 4px 8px ${hexToRgba(theme.palette.primary.main, 0.3)}`,
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.primary.main, 0.3)}`,
      },
      "&:active": {
        backgroundColor: theme.palette.primary.dark,
        transform: "translateY(0)",
      },
    },
    secondary: {
      backgroundColor: theme.palette.background.default,
      color: theme.palette.primary.main,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: theme.palette.primary.main,
      boxShadow: "none",
      "&:hover": {
        backgroundColor: theme.palette.grey[50],
        borderColor: theme.palette.primary.dark,
        color: theme.palette.primary.main,
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: theme.palette.background.default,
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.primary.main, 0.1)}`,
      },
      "&:active": {
        backgroundColor: theme.palette.grey[100],
        color: theme.palette.primary.main,
        transform: "translateY(0)",
      },
    },
    tertiary: {
      backgroundColor: "transparent",
      color: theme.palette.primary.main,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: theme.palette.primary.main,
      "&:hover": {
        backgroundColor: hexToRgba(theme.palette.primary.main, 0.05),
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: "transparent",
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.primary.main, 0.2)}`,
      },
      "&:active": {
        backgroundColor: hexToRgba(theme.palette.primary.main, 0.1),
        transform: "translateY(0)",
      },
    },
    outline: {
      backgroundColor: "transparent",
      color: theme.palette.text.secondary,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: theme.palette.divider,
      "&:hover": {
        backgroundColor: theme.palette.grey[50],
        borderColor: theme.palette.grey[500],
        color: theme.palette.text.primary,
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: "transparent",
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.primary.main, 0.1)}`,
      },
      "&:active": {
        backgroundColor: theme.palette.grey[100],
        transform: "translateY(0)",
      },
    },
    text: {
      backgroundColor: "transparent",
      color: theme.palette.primary.main,
      borderWidth: "0",
      borderStyle: "none",
      borderColor: "transparent",
      padding: "8px 12px",
      minWidth: "auto",
      "&:hover": {
        backgroundColor: hexToRgba(theme.palette.primary.main, 0.05),
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: "transparent",
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.primary.main, 0.2)}`,
      },
      "&:active": {
        backgroundColor: hexToRgba(theme.palette.primary.main, 0.1),
        transform: "translateY(0)",
      },
    },
    icon: {
      backgroundColor: "transparent",
      color: theme.palette.text.secondary,
      borderWidth: "0",
      borderStyle: "none",
      borderColor: "transparent",
      padding: "8px",
      minWidth: "auto",
      width: config.height,
      height: config.height,
      borderRadius: "50%",
      "&:hover": {
        backgroundColor: hexToRgba(theme.palette.text.primary, 0.05),
        color: theme.palette.text.primary,
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: "transparent",
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.text.primary, 0.1)}`,
      },
      "&:active": {
        backgroundColor: hexToRgba(theme.palette.text.primary, 0.1),
        transform: "translateY(0)",
      },
    },
    floating: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderWidth: "0",
      borderStyle: "none",
      borderColor: "transparent",
      padding: "16px",
      minWidth: "auto",
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      boxShadow: `0 4px 12px ${hexToRgba(theme.palette.primary.main, 0.3)}`,
      "&:hover": {
        backgroundColor: theme.palette.primary.dark,
        boxShadow: `0 6px 16px ${hexToRgba(theme.palette.primary.main, 0.4)}`,
        transform: "translateY(-2px)",
      },
      "&:focus": {
        backgroundColor: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.primary.main, 0.3)}`,
      },
      "&:active": {
        backgroundColor: theme.palette.primary.dark,
        transform: "translateY(0)",
      },
    },
    black: {
      backgroundColor: "transparent",
      color: theme.palette.text.primary,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: theme.palette.grey[200],
      boxShadow: "none",
      "&:hover": {
        backgroundColor: theme.palette.grey[100],
        borderColor: theme.palette.grey[200],
        color: theme.palette.text.primary,
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: "transparent",
        borderColor: theme.palette.grey[200],
        color: theme.palette.text.primary,
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.text.primary, 0.1)}`,
      },
      "&:active": {
        backgroundColor: theme.palette.grey[200],
        color: theme.palette.text.primary,
        transform: "translateY(0)",
      },
    },
    "black-outlined": {
      backgroundColor: "transparent",
      color: theme.palette.grey[900],
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: theme.palette.grey[400],
      boxShadow: "none",
    },
    "black-filled": {
      backgroundColor: theme.palette.grey[900],
      color: theme.palette.primary.contrastText,
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: theme.palette.grey[900],
      boxShadow: `0 2px 4px ${hexToRgba(theme.palette.grey[900], 0.2)}`,
      "&:hover": {
        backgroundColor: theme.palette.grey[800],
        borderColor: theme.palette.grey[800],
        color: theme.palette.primary.contrastText,
        boxShadow: `0 4px 8px ${hexToRgba(theme.palette.grey[900], 0.3)}`,
        transform: "translateY(-1px)",
      },
      "&:focus": {
        backgroundColor: theme.palette.grey[900],
        borderColor: theme.palette.grey[900],
        color: theme.palette.primary.contrastText,
        boxShadow: `0 0 0 3px ${hexToRgba(theme.palette.grey[900], 0.3)}`,
      },
      "&:active": {
        backgroundColor: theme.palette.grey[800],
        borderColor: theme.palette.grey[800],
        color: theme.palette.primary.contrastText,
        transform: "translateY(0)",
      },
    },
  };

  const currentVariant = variantStyles[safeVariant] || variantStyles.primary; // Fallback to 'primary' if invalid variant

  return {
    button: {
      ...baseButton,
      ...currentVariant,
    },
    buttonHover: (currentVariant as any)['&:hover'] || {},
    buttonFocus: (currentVariant as any)['&:focus'] || {},
    buttonActive: (currentVariant as any)['&:active'] || {},
    buttonDisabled: {
      backgroundColor: theme.palette.grey[100],
      color: theme.palette.text.disabled,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: theme.palette.grey[200],
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
    text: {
      fontFamily: baseFontFamily,
      fontSize: config.fontSize,
      fontWeight: 500,
      lineHeight: '1.15',
      letterSpacing: '0%',
      color: 'inherit',
    },
    textDisabled: {
      color: theme.palette.text.disabled,
    },
    icon: {
      fontSize: config.iconSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'inherit',
      border: 'none',
      borderRadius: '0',
      outline: 'none',
    },
    iconDisabled: {
      color: theme.palette.text.disabled,
    },
    ripple: {
      position: 'absolute',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      transform: 'scale(0)',
      animation: 'ripple 0.6s linear',
      pointerEvents: 'none',
    },
  };
};

export const customButtonStyles = {
  '@keyframes ripple': {
    to: {
      transform: 'scale(4)',
      opacity: 0,
    },
  },
};
