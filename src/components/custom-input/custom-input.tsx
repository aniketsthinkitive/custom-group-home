import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import Search from "@mui/icons-material/Search";
import { Box, IconButton, Typography, InputAdornment } from "@mui/material";
import { type ChangeEvent, useEffect, useState, useRef } from "react";
import { customInputStyles, errorStyle } from "./custom-input-styles";


interface CustomInputProps {
  placeholder: string;
  name: string;
  value: string | number | undefined;
  isNumeric?: boolean;
  isDecimal?: boolean;
  hasError?: boolean;
  errorMessage?: string | undefined;
  isPassword?: boolean;
  isEmail?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disableField?: boolean;
  bgWhite?: boolean;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  hasStartSearchIcon?: boolean;
  startSearchIconOnRight?: boolean;
  onClickNotify?: () => void;
  hasOpenListArrow?: boolean;
  required?: boolean;
  maxValue?: number;
  icon?: React.ReactNode;
  format?: string;
  phone?: boolean;
  zipCode?: boolean;
  ssn?: boolean;
  InputProps?: {
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
  };
  autoComplete?: string;
}


export default function CustomInput(props: CustomInputProps) {
  const {
    bgWhite,
    onClickNotify,
    maxLength,
    hasStartSearchIcon,
    startSearchIconOnRight,
    hasOpenListArrow,
    required = false,
    icon,
    InputProps
  } = props;

  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValue] = useState<string | number>(props.value ?? "");
  const [_isFocused, setIsFocused] = useState(false);
  const phoneDisplayValue = useRef<string>("");
  const ssnDisplayValue = useRef<string>("");


  useEffect(() => {
    if (props.phone) {
      // For phone inputs, format the value for display
      const value = props.value ?? "";
      const formattedValue = formatPhoneNumber(String(value));

      // Only update if the formatted value is different from current display
      if (phoneDisplayValue.current !== formattedValue) {
        phoneDisplayValue.current = formattedValue;
        setInputValue(formattedValue);
      }
    } else if (props.ssn) {
      // For SSN inputs, format the value for display
      const value = props.value ?? "";
      const formattedValue = formatSSN(String(value));

      // Only update if the formatted value is different from current display
      if (ssnDisplayValue.current !== formattedValue) {
        ssnDisplayValue.current = formattedValue;
        setInputValue(formattedValue);
      }
    } else {
      setInputValue(props.value ?? "");
    }
  }, [props.value, props.phone, props.ssn]);


  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };


  const handleClickArrow = () => {
    if (onClickNotify) {
      onClickNotify();
    }
  };


  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };


  const formatZipCode = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // Remove non-numeric characters


    // Format as 12345 or 12345-6789
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
  };


  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const maxValue = props.maxValue;


    if (props.phone) {
      // For phone input, handle real-time formatting
      const cleaned = value.replace(/\D/g, "");
      const limitedDigits = cleaned.substring(0, 10);
      const formattedValue = formatPhoneNumber(limitedDigits);

      // Update display value immediately
      phoneDisplayValue.current = formattedValue;
      setInputValue(formattedValue);

      // Send clean numeric value to form
      props.onChange({ ...e, target: { ...e.target, value: limitedDigits } });
      return;
    } else if (props.ssn) {
      // For SSN input, handle real-time formatting
      const cleaned = value.replace(/\D/g, "");
      const limitedDigits = cleaned.substring(0, 9);
      const formattedValue = formatSSN(limitedDigits);

      // Update display value immediately
      ssnDisplayValue.current = formattedValue;
      setInputValue(formattedValue);

      // Send clean numeric value to form (without dashes)
      props.onChange({ ...e, target: { ...e.target, value: limitedDigits } });
      return;
    } else if (props.format === "phone") {
      value = formatPhoneNumber(value);
    }


    if (props.isNumeric && maxValue !== undefined) {
      const numericValue = parseInt(value, 10);
      if (numericValue <= maxValue || value === "") {
        setInputValue(value);
        props.onChange({ ...e, target: { ...e.target, value } });
        return;
      }
    } else if (props.zipCode) {
      // Handle ZIP code formatting
      const cleaned = value.replace(/\D/g, "").slice(0, 9); // Max 9 digits
      const formatted = formatZipCode(cleaned);
      setInputValue(formatted);


      // Send clean value (without formatting) to form state if you prefer,
      // or send formatted value (common for display forms)
      props.onChange({ ...e, target: { ...e.target, value: formatted } });
    } else {
      setInputValue(value);
      props.onChange({ ...e, target: { ...e.target, value } });
    }
  };


  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // Remove non-numeric characters

    // Handle different lengths of input for real-time formatting
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) {
      const areaCode = cleaned.slice(0, 3);
      const firstPart = cleaned.slice(3, 6);
      const secondPart = cleaned.slice(6, 10);
      return `(${areaCode}) ${firstPart}${secondPart ? `-${secondPart}` : ''}`;
    }

    // If more than 10 digits, truncate to 10
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };


  const formatSSN = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // Remove non-numeric characters

    // Format as XXX-XX-XXXX
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    if (cleaned.length <= 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
    }

    // If more than 9 digits, truncate to 9
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  };


  const rootStyles = {
    ...customInputStyles.textFieldRoot,
    // Single-line inputs get a fixed height so adornments (icons, password toggle) can't stretch the field
    ...(!props.multiline && { height: "40px" }),
    ...(props.hasError && customInputStyles.textFieldError),
    ...(props.disableField && customInputStyles.textFieldDisabled),
    background: bgWhite ? "white" : customInputStyles.textFieldRoot.background,
  };

  // Determine if we should show start adornment
  const showStartAdornment = InputProps?.startAdornment || icon || (hasStartSearchIcon && !startSearchIconOnRight);

  // Determine if we should show end adornment
  const showEndAdornment = InputProps?.endAdornment || props.isPassword || hasOpenListArrow || (hasStartSearchIcon && startSearchIconOnRight);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        // Filter search boxes: match the 240px min-width used by dropdown/date-picker
        // wrappers so all filter controls are the same width. 'min(240px, 100%)'
        // prevents overflow inside narrow containers (mobile).
        ...(hasStartSearchIcon && { minWidth: 'min(240px, 100%)' }),
      }}
    >
      <Box sx={rootStyles}>
        {/* Start Adornment - Priority: InputProps > icon > search icon */}
        {/* Start Adornment - Priority: InputProps > icon > search icon */}
        {showStartAdornment && (
          <InputAdornment
            position="start"
            sx={{
              marginRight: InputProps?.startAdornment ? '-4px' : '0px', // Reduce gap only for custom adornments
              color: InputProps?.startAdornment ? '#383a38ff' : 'inherit', // Darker color for custom adornments
              '& .MuiTypography-root': {
                color: InputProps?.startAdornment ? '#404140ff' : 'inherit',
                fontWeight: InputProps?.startAdornment ? 500 : 'normal',
              }
            }}
          >
            {InputProps?.startAdornment || icon || (
              <Search
                sx={{
                  width: 18,
                  height: 18,
                  color: '#757775' // Neutral/60
                }}
              />
            )}
          </InputAdornment>
        )}


        {/* Input Field */}
        {props.multiline ? (
          <Box
            component="textarea"
            name={props.name}
            placeholder={props.placeholder}
            value={inputValue}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e as unknown as ChangeEvent<HTMLInputElement>)}
            disabled={props.disableField}
            required={required}
            maxLength={maxLength}
            rows={props.rows}
            sx={{
              ...customInputStyles.textFieldInput,
              resize: 'vertical',
              minHeight: props.rows ? `${props.rows * 1.5}em` : '60px',
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onInput={
              props.isNumeric
                ? (e: React.FormEvent<HTMLTextAreaElement>) => {
                  (e.target as HTMLTextAreaElement).value = (e.target as HTMLTextAreaElement).value.replace(/[^0-9]/g, "");
                }
                : props.isDecimal
                  ? (e: React.FormEvent<HTMLTextAreaElement>) => {
                    (e.target as HTMLTextAreaElement).value = (e.target as HTMLTextAreaElement).value.replace(/[^0-9.]/g, "");
                  }
                  : undefined
            }
          />
        ) : (
          <Box
            component="input"
            name={props.name}
            type={showPassword ? "text" : props.isPassword ? "password" : props.isEmail ? "email" : "text"}
            placeholder={props.placeholder}
            value={inputValue}
            onChange={handleInputChange}
            disabled={props.disableField}
            required={required}
            maxLength={props.phone ? 14 : props.ssn ? 11 : maxLength} // 14 chars for (XXX) XXX-XXXX format, 11 for XXX-XX-XXXX
            inputMode={
              props.phone ? "tel" : props.ssn ? "numeric" : props.isNumeric ? "numeric" : props.isDecimal ? "decimal" : "text"
            }
            sx={customInputStyles.textFieldInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoComplete={props.autoComplete ?? "new"} // ✅ Prevents Chrome autofill blue expansion
            onInput={
              props.phone
                ? (e: React.FormEvent<HTMLInputElement>) => {
                  // Handle real-time phone formatting without triggering form validation
                  const target = e.target as HTMLInputElement;
                  const value = target.value;
                  const cleaned = value.replace(/\D/g, "");
                  const limitedDigits = cleaned.substring(0, 10);
                  const formattedValue = formatPhoneNumber(limitedDigits);

                  // Update the input value immediately for visual feedback
                  target.value = formattedValue;
                  phoneDisplayValue.current = formattedValue;
                  setInputValue(formattedValue);
                }
                : props.ssn
                  ? (e: React.FormEvent<HTMLInputElement>) => {
                    // Handle real-time SSN formatting without triggering form validation
                    const target = e.target as HTMLInputElement;
                    const value = target.value;
                    const cleaned = value.replace(/\D/g, "");
                    const limitedDigits = cleaned.substring(0, 9);
                    const formattedValue = formatSSN(limitedDigits);

                    // Update the input value immediately for visual feedback
                    target.value = formattedValue;
                    ssnDisplayValue.current = formattedValue;
                    setInputValue(formattedValue);
                  }
                  : props.isNumeric
                    ? (e: React.FormEvent<HTMLInputElement>) => {
                      (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^0-9]/g, "");
                    }
                    : props.isDecimal
                      ? (e: React.FormEvent<HTMLInputElement>) => {
                        (e.target as HTMLInputElement).value = (e.target as HTMLInputElement).value.replace(/[^0-9.]/g, "");
                      }
                      : undefined
            }
          />
        )}

        {/* End Adornment - Priority: Password toggle > Arrow > InputProps > Search icon */}
        {showEndAdornment && (
          <>
            {/* Password Toggle */}
            {props.isPassword && (
              <IconButton
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                sx={customInputStyles.iconStyle}
                size="small"
              >
                {showPassword ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            )}

            {/* Arrow Dropdown */}
            {hasOpenListArrow && (
              <IconButton
                onClick={handleClickArrow}
                sx={customInputStyles.iconStyle}
                size="small"
              >
                {showPassword ? <ArrowDropUp /> : <ArrowDropDown />}
              </IconButton>
            )}

            {/* InputProps End Adornment */}
            {InputProps?.endAdornment && !props.isPassword && !hasOpenListArrow && (
              <InputAdornment position="end">
                {InputProps.endAdornment}
              </InputAdornment>
            )}

            {/* End Search Icon */}
            {hasStartSearchIcon && startSearchIconOnRight && !InputProps?.endAdornment && (
              <InputAdornment position="end">
                <Search
                  sx={{
                    width: 18,
                    height: 18,
                    color: '#757775' // Neutral/60
                  }}
                />
              </InputAdornment>
            )}
          </>
        )}
      </Box>


      {/* Error Message — only rendered when there is an error so the empty
          element's 4px margin doesn't misalign the field in flex rows */}
      {props.hasError && (
        <Typography
          sx={{
            ...errorStyle,
            fontSize: "0.75rem",
            lineHeight: 1.66,
            letterSpacing: "0.03333em",
          }}
        >
          {props.errorMessage}
        </Typography>
      )}
    </Box>
  );
}
