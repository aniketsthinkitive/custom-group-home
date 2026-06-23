import {
  Grid,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
  Checkbox,
  ListItemText,
  Box,
} from "@mui/material";
import { useMemo, useRef, useState, useEffect } from "react";
import { errorStyle } from "../custom-input/custom-input-styles";
import {
  customSelectStyles,
  selectInputStyle,
} from "./widgets/custom-select-widgets";
// import theme from "../../constant/styles/theme";

interface CustomSelectProps {
  placeholder: string;
  name: string;
  value: string | string[] | undefined;
  items: {
    value: string;
    label: string;
    disabled?: boolean;
    hidden?: boolean;
    child?: React.ReactElement;
  }[];
  onChange: (e: SelectChangeEvent<any>) => void;
  onOpen?: () => void;
  hasError?: boolean;
  loading?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  bgWhite?: boolean;
  enableDeselect?: boolean;
  statusPillMode?: boolean;
  height?: string | number; // Added height prop for flexibility
  menuProps?: {
    PaperProps?: {
      style?: {
        maxHeight: number;
        width: number | string;
        zIndex?: number;
      };
    };
  };
  multiple?: boolean;
}

function CustomSelect(props: CustomSelectProps) {
  const { items, bgWhite, enableDeselect, height, multiple } = props;

  const handleValue = (e: SelectChangeEvent<any>) => {
    // e.target.value is now the unique option.value (ID), not the label
    props.onChange(e);
  };

  const getLabel = (value: string) => {
    const item = items?.find((item) => item.value === value);
    return item ? item.label : "";
  };

  // Detect if this select is inside a drawer by walking up the DOM tree from the actual element
  const selectRef = useRef<HTMLDivElement>(null);
  const [isInsideDrawer, setIsInsideDrawer] = useState(false);

  useEffect(() => {
    if (selectRef.current) {
      setIsInsideDrawer(selectRef.current.closest('.MuiDrawer-root') !== null);
    }
  }, []);

  // Default MenuProps with proper z-index and positioning
  // Always use portal (disablePortal: false) so dropdown isn't clipped by overflow containers.
  // Set z-index above drawer (1400) when inside one.
  const defaultMenuProps = useMemo(() => ({
    PaperProps: {
      style: {
        maxHeight: 300,
        maxWidth: 250,
        backgroundColor: 'white',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
      },
      sx: {
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "&::-webkit-scrollbar": { display: "none" },
        "& .MuiList-root": {
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      },
    },
    BackdropProps: {
      style: {
        backgroundColor: 'transparent',
      },
    },
    ...(isInsideDrawer && { sx: { zIndex: 1500 } }),
    ...props.menuProps,
  }), [isInsideDrawer, props.menuProps]);

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    UNDER_REVIEW: { bg: "#E8F0FE", color: "#2563EB" },
    COMPLETED: { bg: "#EAF7EE", color: "#16A34A" },
    REJECTED: { bg: "#FDECEC", color: "#DC2626" },
    DRAFT: { bg: "#F1F5F9", color: "#64748B" },
    DOCS_PENDING: { bg: "#FFF4E5", color: "#D97706" },
    ONBOARDING_IN_PROGRESS: { bg: "#F3EDFF", color: "#7C3AED" },
    REQUESTED: { bg: "#E3F2FD", color: "#1976D2" },
  };

  return (
    <>
      <Select
        ref={selectRef}
        disabled={props.isDisabled && props.isDisabled}
        MenuProps={defaultMenuProps}
        onOpen={props.onOpen}
        sx={{
          ...selectInputStyle,
          backgroundColor: bgWhite ? "white" : "inherit",
          ...(height && { height }), // Apply custom height when provided
        }}
        displayEmpty
        multiple={multiple}
        name={props?.name}
        value={props.value ?? (multiple ? [] : "")}
        onChange={handleValue}
        error={props.hasError}
        renderValue={(selected: any) => {
          let displayLabel = "";
          if (multiple && Array.isArray(selected)) {
            displayLabel = selected.map(val => getLabel(val)).filter(Boolean).join(", ");
          } else {
            displayLabel = selected ? getLabel(selected) : "";
          }
          return (
            <Typography
              className={`${customSelectStyles.headerLabel}`}
              sx={{
                color: displayLabel
                  ? "#2C2D2C" // Neutral/80 from Figma - same as CustomInput
                  : "#A9ACA9", // Neutral/40 from Figma - same as CustomInput placeholder
                fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
                fontWeight: 400,
                fontSize: "16px", // Match CustomInput font size
                lineHeight: "1.5", // Match CustomInput line height
                letterSpacing: "normal",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                width: '100%',
              }}
            >
              {displayLabel || props?.placeholder}
            </Typography>
          );
        }}
      >
        {enableDeselect && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {props?.items?.length > 0 &&
          props.items.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              sx={{ display: option.hidden ? 'none' : 'block' }}
            >
              {option.child && <Grid width={"100%"}>{option.child}</Grid>}
              {!option.child && (
                multiple ? (
                  <Box display="flex" alignItems="center" width="100%">
                    <Checkbox
                      checked={Array.isArray(props.value) ? props.value.indexOf(option.value) > -1 : false}
                      style={{ padding: "0 8px 0 0" }}
                      tabIndex={-1}
                      disableRipple
                    />
                    <Typography
                      sx={{
                        fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
                        fontSize: "16px",
                        color: "#2C2D2C",
                      }}
                    >
                      {option.label}
                    </Typography>
                  </Box>
                ) : (
                props.statusPillMode && STATUS_STYLES[option.value] ? (
                  <Typography
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: 500,
                      width: "fit-content",
                      backgroundColor: STATUS_STYLES[option.value].bg,
                      color: STATUS_STYLES[option.value].color,
                      fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
                    }}
                  >
                    {option.label}
                  </Typography>
                ) : (
                  <Typography
                    className={`${customSelectStyles.headerLabel}`}
                    sx={{
                      fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "1.5",
                      letterSpacing: "normal",
                      color: "#2C2D2C",
                      cursor: "pointer",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                      maxWidth: "100%",
                    }}
                  >
                    {option.label}
                  </Typography>
                )
              ))}

            </MenuItem>
          ))}
      </Select>
      {props.hasError && (
        <Typography
          sx={{
            ...errorStyle,
            fontSize: "12px", // Match CustomInput error font size
            lineHeight: "1.2", // Match CustomInput error line height
            letterSpacing: "normal",
            fontFamily: '"Inter", "Geist", "Helvetica Neue", "Roboto", "Arial", sans-serif',
            fontWeight: 400,
          }}
        >
          {props.hasError ? props.errorMessage : ""}
        </Typography>
      )}
    </>
  );
}

export default CustomSelect;
