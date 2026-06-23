import { Grid, Typography, CircularProgress, Checkbox, Box, Avatar, InputAdornment } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";

// Custom debounce hook
const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
import SearchIcon from "@mui/icons-material/Search";
import "./custom-autocomplete-multiselect.css";
import theme from "../../constant/styles/theme";

type OptionType = {
  key: string;
  value: string;
  hide?: boolean;
};

type CustomAutocompleteMultiselectProps = {
  options: OptionType[];
  value: string[];
  onChange: (selectedValue: string[]) => void;
  placeholder: string;
  hasError?: boolean;
  limitTags: number;
  errorMessage?: string;
  onDebounceCall?: (selectedValue: string) => void;
  onInputEmpty?: () => void;
  onClick?: () => void;
  hasStartSearchIcon?: boolean;
  loading?: boolean;
  isDisabled?: boolean;
  hideArrow?: boolean;
  menuProps?: {
    PaperProps?: {
      style?: {
        maxHeight: number;
        width: number | string;
        zIndex?: number;
      };
    };
  };
};

const CustomAutocompleteMultiselect = memo(({
  options,
  value,
  limitTags,
  placeholder,
  onChange,
  onDebounceCall,
  onInputEmpty,
  hideArrow,
  hasStartSearchIcon,
  loading,
  hasError,
  errorMessage,
  isDisabled,
  onClick,
  menuProps,
}: CustomAutocompleteMultiselectProps) => {

  const [selectedOptionState, setSelectedOptionState] = useState("");
  const selectedOptionDebounce = useDebounce(selectedOptionState, 1000);

  const handleChange = useCallback((
    _event: SyntheticEvent<Element, Event>,
    newValue: string[],
  ) => {
    // newValue is an array of selected option values (strings)
    // We need to find the corresponding keys from the options array
    const selectedKeys: string[] = [];
    
    // Ensure we only process valid selections
    if (!Array.isArray(newValue)) {
      onChange([]);
      return;
    }
    
    newValue.forEach((selectedValue: string) => {
      if (selectedValue && typeof selectedValue === 'string' && selectedValue.trim() !== '') {
        const matchingOption = options.find((opt: OptionType) => opt.value === selectedValue && opt.value.trim() !== '');
        if (matchingOption && matchingOption.key) {
          // Avoid duplicate keys
          if (!selectedKeys.includes(matchingOption.key)) {
            selectedKeys.push(matchingOption.key);
          }
        }
      }
    });
    
    // Ensure we don't accidentally return all options
    if (selectedKeys.length > options.length) {
      // console.warn('CustomAutocompleteMultiselect: Selected keys exceed available options');
      onChange([]);
      return;
    }
    
    onChange(selectedKeys);
  }, [options, onChange]);

  const [preSelectedValues, setPreSelectedValues] = useState<string[]>([]);

  useEffect(() => {
    // Map the selected keys (IDs) back to their corresponding values (names)
    const selectedValues = options
      .filter((opt: OptionType) => opt.key && opt.value && value.includes(opt.key))
      .map((opt: OptionType) => opt.value)
      .filter((val: string) => val && val.trim() !== ''); // Remove any empty values
    
    setPreSelectedValues(selectedValues);
  }, [value, options]);

  // Get display placeholder based on selected count
  const displayPlaceholder = useMemo(() => {
    return placeholder;
  }, [placeholder]);

  // Remove unused useEffect

  const handleTextChange = useCallback((
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const newValue = event.target.value || "";
    if (newValue === "") {
      onInputEmpty?.();
    }
    setSelectedOptionState(newValue);
  }, [onInputEmpty]);

  useEffect(() => {
    if (
      selectedOptionDebounce &&
      (selectedOptionDebounce.length > 3 || selectedOptionDebounce === "")
    ) {
      onDebounceCall?.(selectedOptionDebounce);
    }
  }, [selectedOptionDebounce, onDebounceCall]);

  const inputStyles = useMemo(() => ({
    background: "inherit",
    border: "none",
    borderRadius: "4px",
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "none",
      },
      "&:hover fieldset": {
        border: "none",
      },
      "&.Mui-focused fieldset": {
        border: "none",
      },
    },
    "& .MuiAutocomplete-inputRoot": {
      border: "none !important",
      borderRadius: "4px !important",
      "&:hover": {
        border: "none !important",
      },
    },
  }), []);

  const sxStyles = useMemo(() => hasError
    ? {
        ...inputStyles,
        ...errorBorder,
      }
    : {
        ...inputStyles,
      }, [hasError, inputStyles]);

  // Check if we're inside a drawer by looking for drawer classes in the DOM
  const isInsideDrawer = typeof window !== 'undefined' && 
    document.querySelector('.MuiDrawer-root') !== null;

  // Default componentsProps for popper with proper z-index and positioning
  const maxHeight = menuProps?.PaperProps?.style?.maxHeight || 300;
  const defaultComponentsProps = {
    popper: {
      sx: {
        zIndex: isInsideDrawer ? 1500 : 99999, // Lower z-index when inside drawer
        // Target the listbox inside the popper to control scrolling
        '& .MuiAutocomplete-listbox': {
          maxHeight: maxHeight,
          overflowY: 'auto', // Only the listbox should scroll
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#C4C4C4',
            borderRadius: '4px',
            '&:hover': {
              background: '#A0A0A0',
            },
          },
        },
      },
    },
    paper: {
      sx: {
        maxHeight: maxHeight,
        width: menuProps?.PaperProps?.style?.width || 'auto',
        backgroundColor: 'white',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden', // Prevent paper from scrolling - only listbox scrolls
        ...(menuProps?.PaperProps?.style?.zIndex && { zIndex: menuProps.PaperProps.style.zIndex }),
      },
    },
    listbox: {
      sx: {
        maxHeight: maxHeight,
        overflowY: 'auto', // Only the listbox should scroll, not the paper
        padding: 0,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#C4C4C4',
          borderRadius: '4px',
          '&:hover': {
            background: '#A0A0A0',
          },
        },
      },
    },
  };

  return (
    <>
      <Autocomplete
        multiple
        limitTags={limitTags}
        className={hideArrow ? "custom-autocomplete" : ""}
        loading={loading}
        onChange={handleChange}
        value={preSelectedValues}
        id="multiple-limit-tags"
        disablePortal={isInsideDrawer} // Disable portal when inside drawer to render within drawer context
        componentsProps={defaultComponentsProps}
        options={useMemo(() => {
          const filtered = options.filter((option: OptionType) => !option.hide);
          const mapped = filtered.map((option: OptionType) => option.value);
          return mapped;
        }, [options])}
        getOptionLabel={(option) => option}
        isOptionEqualToValue={(option, value) => option === value}
        renderTags={() => null} // Hide chips in the input field
        renderOption={(props, option, { selected }) => {
          const { key, ...otherProps } = props;
          
          // Extract first letter of first name from the option (full name)
          const getInitial = (fullName: string): string => {
            if (!fullName || fullName.trim().length === 0) return '';
            const trimmed = fullName.trim();
            // Get first character and convert to uppercase
            return trimmed.charAt(0).toUpperCase();
          };
          
          const initial = getInitial(option);
          
          // Generate avatar color based on name
          const colors = [
            "#2196F3", // Blue
            "#4CAF50", // Green
            "#F44336", // Red
            "#FF9800", // Orange
            "#9C27B0", // Purple
            "#00BCD4", // Cyan
            "#E91E63", // Pink
            "#795548", // Brown
          ];
          const colorIndex = option.charCodeAt(0) % colors.length;
          const avatarColor = colors[colorIndex];
          
          return (
            <Box
              component="li"
              {...otherProps}
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <Checkbox
                checked={selected}
                sx={{
                  color: "#439322",
                  "&.Mui-checked": {
                    color: "#439322",
                  },
                  padding: "4px",
                  pointerEvents: "none", // Prevent checkbox from intercepting clicks
                }}
              />
              <Avatar
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: avatarColor,
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: 500,
                  marginRight: "4px",
                }}
              >
                {initial}
              </Avatar>
              <Typography sx={{ fontSize: "14px", color: "#2C2D2C" }}>
                {option}
              </Typography>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            InputProps={{
              ...params.InputProps,
              startAdornment: hasStartSearchIcon ? (
                <InputAdornment 
                  position="start"
                  sx={{
                    marginLeft: '12px',
                    marginRight: '8px'
                  }}
                >
                  <SearchIcon
                    sx={{
                      width: 18,
                      height: 18,
                      color: '#757775' // Neutral/60
                    }}
                  />
                </InputAdornment>
              ) : params.InputProps.startAdornment,
              endAdornment: (
                <Grid container width={"fit-content"}>
                  {loading && (
                    <CircularProgress size={"20px"} color="inherit" />
                  )}
                  {params.InputProps.endAdornment}
                </Grid>
              ),
            }}
            disabled={isDisabled}
            onClick={onClick}
            placeholder={displayPlaceholder}
            onChange={handleTextChange}
          />
        )}
        sx={{
          ...sxStyles,
          maxWidth: "900px",
          "& .MuiOutlinedInput-root": {
            height: "42px", // Match other input fields height
            padding: hideArrow ? "6px 10px !important" : "inherit",
            "& fieldset": {
              border: "1px solid #DDE0DD", // Match custom input border
              boxShadow: "none", // Remove shadow
            },
            "&:hover fieldset": {
              border: "1px solid #CDD0CD", // Match custom input hover border
              boxShadow: "none", // Remove shadow
            },
            "&.Mui-focused fieldset": {
              // border: "1px solid #439322", // Match custom input focus border
              boxShadow: "none", // Remove shadow
            },
          },
          "& .MuiInputBase-input": {
            padding: "8px 12px", // Match other input fields padding
            fontSize: "16px", // Match other input fields font size
          },
        }}
      />
      {hasError && errorMessage && (
        <Typography
          sx={{
            color: theme.palette.error.main,
            marginLeft: "5px",
            fontSize: "0.75rem",
            lineHeight: 1.66,
            letterSpacing: "0.03333em",
          }}
        >
          {errorMessage}
        </Typography>
      )}
    </>
  );
});

CustomAutocompleteMultiselect.displayName = 'CustomAutocompleteMultiselect';

const errorBorder = {
  "&.MuiAutocomplete-root": {
    border: "1px solid red",
    borderRadius: "4px",
  },
};

export default CustomAutocompleteMultiselect;
