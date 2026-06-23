import { styled } from '@mui/material/styles';
import { Box, FormControlLabel } from '@mui/material';

// Color tokens from Figma design
const colors = {
  primary: {
    main: '#0A2E45', // Primary/70 (Main)
    light: '#E6F0F5', // Primary/10
    dark: '#051A26', // Primary/90
  },
  neutral: {
    1: '#F9FAF9', // Neutral/1
    5: '#F2F2F2', // Neutral/5
    40: '#A9ACA9', // Neutral/40
    60: '#757775', // Neutral/60
    80: '#2C2D2C', // Neutral/80
  },
  white: '#FFFFFF',
};

// Size variants
const sizes = {
  sm: {
    radio: 16,
    borderRadius: 8, // Fully rounded for radio buttons
    dotSize: 6,
  },
  md: {
    radio: 20,
    borderRadius: 10, // Fully rounded for radio buttons
    dotSize: 8,
  },
};

// Base radio button container
export const RadioContainer = styled(Box)<{
  size: 'sm' | 'md';
  checked: boolean;
  disabled: boolean;
  focused: boolean;
  hovered: boolean;
}>(({ size, checked, disabled, focused, hovered }) => {
  const sizeConfig = sizes[size];
  
  let backgroundColor = colors.white;
  let borderColor = colors.neutral[40];
  let boxShadow = 'none';

  if (disabled && checked) {
    // Selected answer must stay readable in view/disabled mode
    backgroundColor = colors.primary.light;
    borderColor = colors.primary.main;
  } else if (disabled) {
    backgroundColor = colors.neutral[1];
    borderColor = colors.neutral[40];
  } else if (checked) {
    backgroundColor = colors.primary.light;
    borderColor = colors.primary.main;
  } else if (hovered) {
    backgroundColor = colors.primary.light;
    borderColor = colors.primary.dark;
  }
  
  if (focused) {
    boxShadow = `0px 0px 0px 4px rgba(251, 255, 247, 1)`;
  }
  
  return {
    width: sizeConfig.radio,
    height: sizeConfig.radio,
    borderRadius: sizeConfig.borderRadius,
    border: `1px solid ${borderColor}`,
    backgroundColor,
    boxShadow,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
  };
});

// Radio button dot (inner circle)
export const RadioDot = styled(Box)<{
  size: 'sm' | 'md';
  checked: boolean;
  disabled: boolean;
}>(({ size, checked }) => {
  const sizeConfig = sizes[size];

  // The dot keeps its primary color when disabled — in view mode the
  // selected response must remain clearly visible
  const backgroundColor = colors.primary.main;
  
  return {
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: '50%',
    backgroundColor,
    opacity: checked ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
  };
});

// Custom FormControlLabel
export const CustomFormControlLabel = styled(FormControlLabel)<{
  size: 'sm' | 'md';
  disabled: boolean;
}>(({ size, disabled }) => {
  const gap = size === 'sm' ? 8 : 12;
  
  return {
    marginTop: 0,
    alignItems: 'flex-start',
    gap: gap,
    '& .MuiFormControlLabel-label': {
      fontSize: size === 'sm' ? '14px' : '16px',
      lineHeight: size === 'sm' ? 1.6 : 1.6,
      // Keep labels readable in view/disabled mode (was Neutral/40 — too faint)
      color: disabled ? colors.neutral[60] : colors.neutral[80],
      margin: 0,
      paddingTop: size === 'sm' ? '2px' : '0px',
    },
  };
});

// Supporting text container
export const SupportingTextContainer = styled(Box)<{
  size: 'sm' | 'md';
  disabled: boolean;
}>(({ size, disabled }) => {
  return {
    fontSize: size === 'sm' ? '14px' : '16px',
    lineHeight: size === 'sm' ? 1.6 : 1.6,
    color: disabled ? colors.neutral[40] : colors.neutral[60],
    marginTop: size === 'sm' ? '2px' : '2px',
  };
});

// Main container for radio with text
export const RadioWithTextContainer = styled(Box)<{
  size: 'sm' | 'md';
}>(({ size }) => {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: size === 'sm' ? '2px' : '2px',
    marginTop: "-5px"
  };
});
