import {
  Autocomplete,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { useDebounce } from "use-debounce";

import SearchIcon from "@mui/icons-material/Search";
import "./custom-auto-complete.css";
import theme from "../../constant/styles/theme";

type CustomAutoCompleteProps = {
  options: { key: string; value: string; child?: React.ReactElement }[];
  value?: string;
  loading?: boolean;
  loadingText?: boolean;
  onChange: (selectedValue: string | "") => void;
  onClick?: () => void;
  onDebounceCall?: (selectedValue: string | "") => void;
  onInputEmpty?: () => void;
  width?: string;
  height?: string;
  hasError?: boolean;
  errorMessage?: string;
  placeholder?: string;
  isDisabled?: boolean;
  bgWhite?: boolean;
  hasStartSearchIcon?: boolean;
  hideTextPreview?: boolean;
  menuStyle?: {
    maxHeight: number;
    width: number;
  };
  maxHeightForOptionsList?: number;
  hideArrow?: boolean;
  disablePortal?: boolean;
};

const CustomAutoComplete = (props: CustomAutoCompleteProps) => {
  const {
    options,
    maxHeightForOptionsList,
    value,
    loading,
    loadingText,
    placeholder,
    bgWhite,
    isDisabled,
    onDebounceCall,
    onClick,
    onInputEmpty,
    hasStartSearchIcon,
    hideTextPreview,
    hideArrow,
    height,
    onChange,
    disablePortal = true,
  } = props;

  // Tracks the selected value in the dropdown
  const [inputValue, setInputValue] = useState("");
  const [debouncedInputValue] = useDebounce(inputValue, 1000);

  // Resolve the default selected option
  const defaultOption = options.find((opt) => opt.key === value)?.value || null;

  // Trigger parent `onDebounceCall` when input value changes (debounced)
  useEffect(() => {
    if (debouncedInputValue && (debouncedInputValue.length > 3 || debouncedInputValue === "")) {
      onDebounceCall?.(debouncedInputValue);
    }
  }, [debouncedInputValue, onDebounceCall]);

  // Handle selection change in Autocomplete
  const handleChange = (_: SyntheticEvent<Element, Event>, newValue: string | null) => {
    const selectedOption = options.find((opt) => opt.value === newValue);
    const selectedKey = selectedOption?.key || "";
    onChange(selectedKey); // Notify parent about the selected key
  };

  // Handle text input changes
  const handleInputChange = (_: SyntheticEvent<Element, Event>, newInputValue: string) => {
    setInputValue(newInputValue);
    if (newInputValue === "") {
      onInputEmpty?.(); // Notify parent when input is empty
    }
  };

  // Styling - Match CustomInput exactly with no extra borders
  const inputStyles = {
    background: bgWhite ? "white" : "inherit",
    border: "0.5px solid #DDE0DD", // Single border on the root element
    outline: "none",
    borderRadius: "6px", // Match other input fields
    boxShadow: "none", // Remove shadow
    "&:hover": {
      border: "0.5px solid #CDD0CD", // Match custom input hover border exactly
    },
    "&.Mui-focused": {
      // border: "0.5px solid #439322", // Match custom input focus border exactly
    },
    // Completely override MUI's border system
    "& .MuiOutlinedInput-root": {
      height: height || "44px", // Match CustomInput height exactly
      padding: "8px 12px", // Match CustomInput padding exactly
      border: "none !important", // Remove MUI default border
      outline: "none !important",
      "& .MuiInputAdornment-root": {
        marginLeft: "8px !important",
        marginRight: "8px !important",
      },
      "& .MuiInputAdornment-positionStart": {
        marginLeft: "8px !important",
        marginRight: "8px !important",
      },
      "& fieldset": {
        border: "none !important", // Remove MUI fieldset border completely
        boxShadow: "none !important", // Remove shadow
        outline: "none !important",
      },
      "&:hover fieldset": {
        border: "none !important", // Remove MUI fieldset border on hover
        boxShadow: "none !important", // Remove shadow
        outline: "none !important",
      },
      "&.Mui-focused fieldset": {
        border: "none !important", // Remove MUI fieldset border on focus
        boxShadow: "none !important", // Remove shadow
        outline: "none !important",
      },
      "&.Mui-focused": {
        border: "none !important",
        outline: "none !important",
      },
    },
    "& .MuiAutocomplete-inputRoot": {
      border: "none !important",
      borderRadius: "6px !important", // Match other input fields
      height: height || "44px", // Match CustomInput height exactly
      boxShadow: "none !important", // Remove shadow
      padding: "8px 12px", // Match CustomInput padding exactly
      outline: "none !important",
      "& .MuiInputAdornment-root": {
        marginLeft: "8px !important",
        marginRight: "8px !important",
      },
      "& .MuiInputAdornment-positionStart": {
        marginLeft: "8px !important",
        marginRight: "8px !important",
      },
      "&:hover": {
        border: "none !important",
        boxShadow: "none !important", // Remove shadow
        outline: "none !important",
      },
      "&.Mui-focused": {
        border: "none !important",
        outline: "none !important",
      },
    },
    "& .MuiInputBase-input": {
      padding: "0px", // Remove extra padding since we have it on the root
      paddingLeft: hasStartSearchIcon ? "0px" : "0px", // Consistent padding regardless of icon
      fontSize: "16px", // Match other input fields font size
      fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
      fontWeight: 400,
      lineHeight: "1.5",
      color: "#2C2D2C", // Neutral/80 from Figma
      border: "none !important",
      outline: "none !important",
      "&::placeholder": {
        color: "#A9ACA9", // Neutral/40 from Figma
        fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
        fontWeight: 400,
        fontSize: "16px",
        lineHeight: "1.5",
      },
    },
  };

  const sxStyles = props.hasError
    ? {
        ...inputStyles,
        ...errorBorder,
      }
    : {
        ...inputStyles,
      };

  return (
    <>
      <Autocomplete
        value={defaultOption} // Current selected option
        inputValue={inputValue} // Controlled input value
        onInputChange={handleInputChange} // Handle input changes
        onChange={handleChange} // Handle option selection
        options={loading ? [] : options.map((opt) => opt.value)} // Filtered option values
        loading={loading}
        ListboxProps={{
          style: { maxHeight: maxHeightForOptionsList },
        }}
        sx={{
          ...sxStyles,
          "& .MuiOutlinedInput-root": {
            padding: hideArrow ? "6px 10px !important" : "inherit",
            ...(height && { height: `${height} !important` }),
          },
          "& .MuiAutocomplete-inputRoot": {
            ...(height && { height: `${height} !important` }),
          },
        }}
        className={`custom-autocomplete-no-border ${hideArrow ? "custom-autocomplete" : ""}`}
        size="small"
        disablePortal={disablePortal}
        disabled={isDisabled}
        loadingText={loadingText || "Loading..."}
        clearIcon={false}
        componentsProps={{
          popper: {
            sx: {
              zIndex: disablePortal ? undefined : 1500, // Higher z-index when using portal (Dialog z-index is typically 1300)
            },
          },
        }}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          const selectedOption = options.find((opt) => opt.value === option);
          return (
            <li key={key} {...otherProps}>
              {selectedOption?.child || option}
            </li>
          );
        }}
        PaperComponent={(props) => <Paper {...props} />}
        renderInput={(params) => (
          <TextField
            {...params}
            inputProps={{
              ...params.inputProps,
              value: hideTextPreview ? "" : params.inputProps.value,
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  {hasStartSearchIcon && (
                    <SearchIcon 
                      sx={{ 
                        opacity: 0.5,
                        marginRight: "8px",
                        marginLeft: "8px",
                        flexShrink: 0, // Prevent icon from shrinking
                      }} 
                    />
                  )}
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {loading && <CircularProgress size="20px" color="inherit" />}
                  {params.InputProps.endAdornment}
                </>
              ),
              style: {
                fontFamily: "Roboto, Helvetica, Arial, sans-serif",
                fontSize: "14px",
                letterSpacing: "0.25%",
                lineHeight: "150%",
                height: "44px",
                paddingLeft: hasStartSearchIcon ? "0px" : "0px", // Consistent padding
              },
            }}
            onClick={onClick && !isDisabled ? onClick : undefined}
            placeholder={placeholder}
          />
        )}
      />
      <Typography
        sx={{
          color: theme.palette.error.main,
          marginLeft: props.hasError ? "5px" : "0px",
          fontSize: "0.75rem",
          lineHeight: 1.66,
          letterSpacing: "0.03333em",
        }}
      >
        {props.hasError ? props.errorMessage : ""}
      </Typography>
    </>
  );
};

export default CustomAutoComplete;

const errorBorder = {
  "&.MuiAutocomplete-root": {
    border: `0.5px solid ${theme.palette.error.main}`,
    borderRadius: "4px",
  },
};