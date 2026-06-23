import React, { useState, useRef } from 'react';
import {
  CheckboxContainer,
  CheckIcon,
  MinusIcon,
  CustomFormControlLabel,
  SupportingTextContainer,
  CheckboxWithTextContainer,
} from './custom-checkbox-styles';

export interface CustomCheckboxProps {
  /**
   * Whether the checkbox is checked
   */
  checked?: boolean;
  /**
   * Whether the checkbox is in indeterminate state
   */
  indeterminate?: boolean;
  /**
   * Whether the checkbox is disabled
   */
  disabled?: boolean;
  /**
   * Size variant of the checkbox
   */
  size?: 'sm' | 'md';
  /**
   * Label text for the checkbox
   */
  label?: string;
  /**
   * Supporting text below the label
   */
  supportingText?: string;
  /**
   * Whether to show only the checkbox without text
   */
  showText?: boolean;
  /**
   * Callback fired when the checkbox state changes
   */
  onChange?: (checked: boolean) => void;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  size = 'sm',
  label,
  supportingText,
  showText = true,
  onChange,
  className,
  'data-testid': testId,
}) => {
  const [focused, setFocused] = useState(false);
  const checkboxRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  // Use CSS :hover instead of state for better performance
  const hovered = false; // Removed state to reduce re-renders, using CSS :hover instead

  // Determine the actual checked state (indeterminate overrides checked)
  const isChecked = indeterminate ? true : checked;
  const isIndeterminate = indeterminate;

  const checkboxElement = (
    <CheckboxContainer
      ref={checkboxRef}
      size={size}
      checked={isChecked}
      disabled={disabled}
      focused={focused}
      hovered={hovered}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      // Removed onMouseEnter/onMouseLeave to reduce re-renders - using CSS :hover instead
      className={className}
      data-testid={testId}
      tabIndex={disabled ? -1 : 0}
      role="checkbox"
      aria-checked={isIndeterminate ? 'mixed' : isChecked}
      aria-disabled={disabled}
    >
      {isIndeterminate ? (
        <MinusIcon
          size={size}
          checked={isIndeterminate}
          disabled={disabled}
          viewBox="0 0 12 12"
        >
          <path d="M2 6h8" />
        </MinusIcon>
      ) : (
        <CheckIcon
          size={size}
          checked={isChecked}
          disabled={disabled}
          viewBox="0 0 12 12"
        >
          <path d="M2 6l3 3 5-5" />
        </CheckIcon>
      )}
    </CheckboxContainer>
  );

  // If showText is false, return only the checkbox
  if (!showText) {
    return checkboxElement;
  }

  // If no label is provided, return only the checkbox
  if (!label) {
    return checkboxElement;
  }

  // Return checkbox with text
  return (
    <CustomFormControlLabel
      size={size}
      disabled={disabled}
      control={checkboxElement}
      label={
        <CheckboxWithTextContainer size={size}>
          <span>{label}</span>
          {supportingText && (
            <SupportingTextContainer size={size} disabled={disabled}>
              {supportingText}
            </SupportingTextContainer>
          )}
        </CheckboxWithTextContainer>
      }
    />
  );
};

export default CustomCheckbox;
