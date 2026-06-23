import React, { useState, useRef } from 'react';
import {
  RadioContainer,
  RadioDot,
  CustomFormControlLabel,
  SupportingTextContainer,
  RadioWithTextContainer,
} from './custom-radio-styles';

export interface CustomRadioProps {
  /**
   * Whether the radio button is checked
   */
  checked?: boolean;
  /**
   * Whether the radio button is disabled
   */
  disabled?: boolean;
  /**
   * Size variant of the radio button
   */
  size?: 'sm' | 'md';
  /**
   * Label text for the radio button
   */
  label?: string;
  /**
   * Supporting text below the label
   */
  supportingText?: string;
  /**
   * Whether to show only the radio button without text
   */
  showText?: boolean;
  /**
   * Value of the radio button
   */
  value?: string;
  /**
   * Name of the radio group
   */
  name?: string;
  /**
   * Callback fired when the radio button state changes
   */
  onChange?: (checked: boolean, value?: string) => void;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

export const CustomRadio: React.FC<CustomRadioProps> = ({
  checked = false,
  disabled = false,
  size = 'sm',
  label,
  supportingText,
  showText = true,
  value,
  name: _name,
  onChange,
  className,
  'data-testid': testId,
}) => {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const radioRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(true, value);
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

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const radioElement = (
    <RadioContainer
      ref={radioRef}
      size={size}
      checked={checked}
      disabled={disabled}
      focused={focused}
      hovered={hovered}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      data-testid={testId}
      tabIndex={disabled ? -1 : 0}
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-labelledby={label ? `${testId}-label` : undefined}
    >
      <RadioDot
        size={size}
        checked={checked}
        disabled={disabled}
      />
    </RadioContainer>
  );

  // If showText is false, return only the radio button
  if (!showText) {
    return radioElement;
  }

  // If no label is provided, return only the radio button
  if (!label) {
    return radioElement;
  }

  // Return radio button with text
  return (
    <CustomFormControlLabel
      size={size}
      disabled={disabled}
      control={radioElement}
      label={
        <RadioWithTextContainer size={size}>
          <span id={label ? `${testId}-label` : undefined}>{label}</span>
          {supportingText && (
            <SupportingTextContainer size={size} disabled={disabled}>
              {supportingText}
            </SupportingTextContainer>
          )}
        </RadioWithTextContainer>
      }
    />
  );
};

export default CustomRadio;
