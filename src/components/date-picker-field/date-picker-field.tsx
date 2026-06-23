import { Typography } from "@mui/material";
import {
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { DateRangeIcon } from "@mui/x-date-pickers/icons";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { errorStyle } from "../custom-input/custom-input-styles";

// Enable custom parse format plugin
dayjs.extend(customParseFormat);

export interface DatePickerProps {
  /** Field name for form handling */
  name?: string;
  /** Custom styles for the component */
  styles?: React.CSSProperties;
  /** Whether to use custom styling */
  useCustomStyle?: boolean;
  /** Current selected date value */
  value?: Dayjs | null;
  /** Maximum selectable date */
  maxDate?: Dayjs;
  /** Minimum selectable date */
  minDate?: Dayjs;
  /** Callback fired when date changes */
  onChange: (date: Dayjs | null) => void;
  /** Whether field has validation error */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Disable future dates */
  disableFuture?: boolean;
  /** Field label/placeholder */
  label?: string;
  /** Disable past dates */
  disablePast?: boolean;
  /** Use white background */
  bgWhite?: boolean;
  /** Date format string */
  format?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether to show clear icon */
  showClearIcon?: boolean;
  /** Extra slotProps merged into the underlying DesktopDatePicker (e.g. popper.disablePortal) */
  slotProps?: Record<string, any>;
  /** Notifies the parent of the field's internal validation error (null = valid).
   *  Lets the parent gate submission, since MUI may reject a typed value (e.g. a
   *  future date) without emitting it via onChange. */
  onValidationChange?: (error: string | null) => void;
}
const DatePickerField = (props: DatePickerProps) => {
  const {
    hasError = false,
    onChange,
    value,
    useCustomStyle = false,
    maxDate,
    disableFuture = false,
    disablePast = false,
    label,
    minDate,
    format = "MM-DD-YYYY",
    errorMessage,
    disabled = false,
    showClearIcon = true,
    slotProps: externalSlotProps,
    onValidationChange,
  } = props;

  const [cleared, setCleared] = useState(false);
  const [internalValue, setInternalValue] = useState<Dayjs | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (cleared) {
      const timeout = setTimeout(() => {
        setCleared(false);
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [cleared]);

  // Sync internal value with external value
  useEffect(() => {
    if (value) {
      setInternalValue(dayjs(value));
      // Clear validation error when value is set externally (e.g., form reset)
      setValidationError(null);
    } else {
      setInternalValue(null);
      setValidationError(null);
    }
  }, [value]);

  const inputValue = useMemo(() => {
    return internalValue;
  }, [internalValue]);

  // Surface the field's internal validation state so the parent can gate
  // submission. This is essential because MUI can reject a typed value (e.g.
  // a future date under disableFuture) via onError WITHOUT emitting it through
  // onChange, leaving the form value stale-but-valid and the submit enabled.
  useEffect(() => {
    onValidationChange?.(validationError);
  }, [validationError, onValidationChange]);

  const validateDate = useCallback((
    dateValue: Dayjs | null,
  ): string | null => {
    if (!dateValue) {
      return null; // Allow null/empty values
    }

    if (!dateValue.isValid()) {
      return "Invalid date format";
    }

    // Guard against implausible years produced mid-typing: while typing a
    // 4-digit year (e.g. "2026") into a MM-DD-YYYY field, the year section
    // briefly holds "202", which dayjs reads as year 0202 -> a valid date
    // 0202-01-01 that would otherwise be committed. Every real date has a
    // 4-digit year, so reject 1-3 digit years (all < 1000).
    if (dateValue.year() < 1000) {
      return "Please enter a valid 4-digit year";
    }

    const today = dayjs().startOf('day');
    const dateToCheck = dateValue.startOf('day');

    // Check disablePast
    if (disablePast && dateToCheck.isBefore(today)) {
      return "Past dates are not allowed";
    }

    // Check disableFuture
    if (disableFuture && dateToCheck.isAfter(today)) {
      return "Future dates are not allowed";
    }

    // Check minDate
    if (minDate) {
      const minDateToCheck = dayjs(minDate).startOf('day');
      if (dateToCheck.isBefore(minDateToCheck)) {
        return `Date must be on or after ${minDateToCheck.format(format)}`;
      }
    }

    // Check maxDate
    if (maxDate) {
      const maxDateToCheck = dayjs(maxDate).startOf('day');
      if (dateToCheck.isAfter(maxDateToCheck)) {
        return `Date must be on or before ${maxDateToCheck.format(format)}`;
      }
    }

    return null; // No validation error
  }, [disablePast, disableFuture, minDate, maxDate, format]);

  const handleChange = useCallback((
    newValue: Dayjs | null,
  ) => {
    // Update internal value immediately for UI responsiveness
    setInternalValue(newValue);
    
    // Validate the date
    const error = validateDate(newValue);
    setValidationError(error);

    // Only call onChange if we have a valid date with no validation errors
    if (newValue && newValue.isValid() && !error) {
      onChange(newValue);
    } else if (newValue === null) {
      // Allow clearing the field
      setValidationError(null);
      onChange(null);
    } else if (error) {
      // A non-null but invalid/out-of-range value was entered — e.g. manually
      // editing a date that was previously picked from the calendar. Clear the
      // form value instead of silently keeping the old one, otherwise the stale
      // previously-selected date gets submitted as if it were the user's edit.
      onChange(null);
    }
  }, [onChange, validateDate]);

  // Surface MUI's own validation reasons. When a future date is typed
  // manually, MUI (because of disableFuture) nullifies the value and calls
  // onChange(null) -> the field falls back to the form's "required" error,
  // hiding the real reason. MUI fires onChange before onError, so setting the
  // message here wins and shows the correct "Future dates are not allowed".
  const handleMuiError = useCallback((reason: unknown) => {
    switch (reason) {
      case "disableFuture":
        setValidationError("Future dates are not allowed");
        break;
      case "disablePast":
        setValidationError("Past dates are not allowed");
        break;
      case "minDate":
        setValidationError(
          minDate
            ? `Date must be on or after ${dayjs(minDate).startOf("day").format(format)}`
            : "Date is too early"
        );
        break;
      case "maxDate":
        setValidationError(
          maxDate
            ? `Date must be on or before ${dayjs(maxDate).startOf("day").format(format)}`
            : "Date is too late"
        );
        break;
      case "invalidDate":
        setValidationError("Invalid date format");
        break;
      default:
        // null / no error: let handleChange + validateDate own the state
        break;
    }
  }, [minDate, maxDate, format]);


  const textFieldProps = useMemo(() => {
    const props: Record<string, unknown> = { 
      fullWidth: true,
      InputProps: {
        readOnly: false, // Enable manual date entry
      }
    };
    if (!useCustomStyle) props["placeholder"] = "Select Date";
    if (label) props["placeholder"] = label;
    return props;
  }, [useCustomStyle, label]);


  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DesktopDatePicker
          value={inputValue}
          closeOnSelect={true}
          onChange={handleChange}
          format={format}
          maxDate={maxDate ? dayjs(maxDate) : undefined}
          minDate={minDate ? dayjs(minDate) : undefined}
          disableFuture={disableFuture}
          disablePast={disablePast}
          disabled={disabled}
          // Surface MUI's validation reason (e.g. a manually-typed future date)
          onError={handleMuiError}
          slotProps={{
            textField: {
              ...textFieldProps,
              error: hasError || !!validationError,
              // helperText: hasError ? errorMessage : undefined,
            },
            field: { 
              clearable: showClearIcon, 
              onClear: () => {
                setCleared(true);
                setInternalValue(null);
                onChange(null);
              },
            },
            openPickerIcon: { children: <DateRangeIcon /> },
            inputAdornment: {
              position: "start",
            },
            ...externalSlotProps,
            popper: {
              sx: {
                zIndex: 99999,
              },
              ...(externalSlotProps?.popper ?? {}),
            },
          }}
          sx={useMemo(
            () => {
              const showError = hasError || !!validationError;
              return {
                "& .MuiInputBase-input": {
                  fontSize: "16px", // Match custom input font size
                  padding: "8px 12px", // Match custom input padding
                  borderRadius: "6px", // Match custom input border radius
                  color: "#2C2D2C", // Match custom input text color
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none !important", // Remove any outline
                  "&:focus": {
                    outline: "none !important", // Remove outline on focus
                  },
                },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px", // Match custom input border radius
                  minHeight: "36px", // Match custom input min height
                  height: "45px", // Set exact height to match custom input
                  backgroundColor: "#FFFFFF", // White background
                  border: showError ? `1px solid ${errorStyle.color}` : "1px solid #DDE0DD", // Match custom input border
                  borderWidth: "1px !important", // Keep border width constant
                  boxShadow: "none",
                  outline: "none !important", // Remove any outline
                  "&:hover": {
                    borderColor: showError ? errorStyle.color : "#CDD0CD", // Match custom input hover
                    borderWidth: "1px !important", // Keep border width constant on hover
                  },
                  "&.Mui-focused": {
                    borderColor: showError ? errorStyle.color : "#DDE0DD", // Match custom input focus
                    borderWidth: "1px !important", // Keep border width constant on focus
                    boxShadow: "none",
                    outline: "none !important", // Remove any outline on focus
                  },
                  "& fieldset": {
                    border: "none !important", // Remove default fieldset border
                    borderWidth: "0 !important", // Ensure no border width
                  },
                },
                "& .MuiPickersInputBase-root": {
                  height: "45px",
                  borderRadius: "6px",
                  backgroundColor: "#FFFFFF", // White background
                  border: showError ? `1px solid ${errorStyle.color}` : "1px solid #DDE0DD", // Match custom input border
                  borderWidth: "1px !important", // Keep border width constant
                  boxShadow: "none",
                  outline: "none !important", // Remove any outline
                  "&:hover": {
                    borderColor: showError ? errorStyle.color : "#CDD0CD", // Match custom input hover
                    borderWidth: "1px !important", // Keep border width constant on hover
                  },
                  "&.Mui-focused": {
                    borderColor: showError ? errorStyle.color : "#DDE0DD", // Match custom input focus
                    borderWidth: "1px !important", // Keep border width constant on focus
                    boxShadow: "none",
                    outline: "none !important", // Remove any outline on focus
                  },
                  "& fieldset": {
                    border: "none !important", // Remove default fieldset border
                    borderWidth: "0 !important", // Ensure no border width
                  },
                },
                "& .MuiOutlinedInput-root.Mui-error": {
                  "& fieldset": {
                    border: "none !important", // Remove fieldset border even on error
                    borderWidth: "0 !important",
                  },
                },
                "& .MuiPickersInputBase-root.Mui-error": {
                  "& fieldset": {
                    border: "none !important", // Remove fieldset border even on error
                    borderWidth: "0 !important",
                  },
                },
              };
            },
            [hasError, validationError]
          )}
        />
      </LocalizationProvider>
      {(hasError || validationError) && (errorMessage || validationError) && (
        <Typography
          sx={{
            ...errorStyle,
            fontSize: "0.75rem",
            lineHeight: 1.50,
            letterSpacing: "0.03333em",
          }}
        >
          {validationError || errorMessage}
        </Typography>
      )}
    </>
  );
}

export default memo(DatePickerField);
