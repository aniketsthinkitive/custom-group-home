import React, { useState, useCallback, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import {
  getButtonStyles,
  customButtonStyles,
  type ButtonVariant,
  type ButtonSize
} from './custom-buttons-styles';

export interface CustomButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  className?: string;
  sx?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

export default function CustomButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  className,
  sx,
  type = 'button',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': dataTestId,
}: CustomButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const styles = getButtonStyles(variant, size, fullWidth);

  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      setIsHovered(true);
      onMouseEnter?.(event);
    }
  }, [disabled, loading, onMouseEnter]);

  const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    onMouseLeave?.(event);
  }, [onMouseLeave]);

  const handleFocus = useCallback((event: React.FocusEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      setIsFocused(true);
      onFocus?.(event);
    }
  }, [disabled, loading, onFocus]);

  const handleBlur = useCallback((event: React.FocusEvent<HTMLButtonElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const handleMouseDown = useCallback(() => {
    if (!disabled && !loading) {
      setIsActive(true);
    }
  }, [disabled, loading]);

  const handleMouseUp = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  }, [disabled, loading, onClick]);

  // Get current button styles based on state
  const getCurrentButtonStyles = (): React.CSSProperties => {
    let currentStyles = { ...styles.button };

    if (disabled || loading) {
      currentStyles = { ...currentStyles, ...styles.buttonDisabled };
    } else if (isActive) {
      currentStyles = { ...currentStyles, ...styles.buttonActive };
    } else if (isFocused) {
      currentStyles = { ...currentStyles, ...styles.buttonFocus };
    } else if (isHovered) {
      currentStyles = { ...currentStyles, ...styles.buttonHover };
    }

    return { ...currentStyles, ...sx };
  };

  // Get current text styles based on state
  const getCurrentTextStyles = (): React.CSSProperties => {
    let textStyles = { ...styles.text };
    
    // Set text color based on variant
    if (variant === 'primary' || variant === 'black-filled') {
      textStyles.color = '#FFFFFF';
    }
    
    if (disabled || loading) {
      return { ...textStyles, ...styles.textDisabled };
    }
    return textStyles;
  };

  // Get current icon styles based on state
  const getCurrentIconStyles = (): React.CSSProperties => {
    if (disabled || loading) {
      return { ...styles.icon, ...styles.iconDisabled };
    }
    return styles.icon;
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    return (
      <Box sx={getCurrentIconStyles()}>
        {icon}
      </Box>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box
            sx={{
              width: '16px',
              height: '16px',
              border: '2px solid transparent',
              borderTop: `2px solid ${disabled ? '#CCCCCC' : 'currentColor'}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          {children && (
            <Typography component="div" sx={getCurrentTextStyles()}>
              {children}
            </Typography>
          )}
        </Box>
      );
    }

    if (variant === 'icon' || variant === 'floating') {
      return icon || children;
    }

    if (icon && children) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {iconPosition === 'left' && renderIcon()}
          <Typography component="div" sx={getCurrentTextStyles()}>
            {children}
          </Typography>
          {iconPosition === 'right' && renderIcon()}
        </Box>
      );
    }

    if (icon) {
      return renderIcon();
    }

    if (children) {
      return (
        <Typography component="div" sx={getCurrentTextStyles()}>
          {children}
        </Typography>
      );
    }

    return null;
  };

  return (
    <Box sx={customButtonStyles}>
      <button
        ref={buttonRef}
        type={type}
        disabled={disabled || loading}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={className}
        style={getCurrentButtonStyles()}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        data-testid={dataTestId}
        aria-disabled={disabled || loading}
      >
        {renderContent()}
      </button>
    </Box>
  );
}
