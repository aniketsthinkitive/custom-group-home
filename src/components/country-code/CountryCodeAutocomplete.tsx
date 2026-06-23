/* ...imports... */
import React from "react";
import { Autocomplete, TextField, Grid, Box } from "@mui/material";
import { countryCodes } from "../../constant/countryCodes";

interface CountryCodeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

const CountryCodeAutocomplete: React.FC<CountryCodeAutocompleteProps> = ({
  value,
  onChange,
}) => {
  const uniqueCountryCodes = Array.from(
    new Map(countryCodes.map((country) => [country.code, country])).values()
  );
  const selectedValue =
    uniqueCountryCodes.find((country) => country.code === value) || undefined;

  return (
    <Autocomplete
      disablePortal
      disableClearable
      options={uniqueCountryCodes}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : `${option.code}`
      }
      value={selectedValue}
      onChange={(_e, newValue) => {
        onChange(newValue?.code || "");
      }}
      isOptionEqualToValue={(option, value) => option.code === value?.code}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <Box component="li" key={option.code} {...otherProps}>
            <Grid container alignItems="center">
              <img
                src={option.flag}
                alt={`${option.code} flag`}
                style={{ width: "20px", height: "15px", marginRight: "8px" }}
              />
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <span>{option.code}</span>
              </Box>
            </Grid>
          </Box>
        );
      }}
      /* ---------- HIDE SCROLLBAR (still scrollable) ---------- */
      componentsProps={{
        popper: {
          sx: {
            zIndex: 1300,
            // target the listbox inside the popper (works with portal or inline)
            "& .MuiAutocomplete-listbox": {
              maxHeight: 280,
              padding: 0,
              overflow: "auto", // must be auto to allow scrolling
              // hide scrollbar in WebKit (Chrome, Edge, Safari)
              "&::-webkit-scrollbar": {
                display: "none",
                width: 0,
                height: 0,
              },
              // Firefox
              scrollbarWidth: "none",
              // IE 10+
              msOverflowStyle: "none",
              // optionally add a tiny right padding so content doesn't touch edge
              paddingRight: "8px",
            },
            "& .MuiPaper-root": {
              padding: 0,
              borderRadius: "6px",
            },
          },
        },
        paper: {
          sx: {
            padding: 0,
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Select"
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              height: "45px",
              width: "125px",
              overflow: "visible",
              borderRadius: "5px",
              backgroundColor: "#FFFFFF",
            },
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiInputBase-input": {
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: selectedValue ? (
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center" }}
              >
                <img
                  src={selectedValue.flag}
                  alt={`${selectedValue.code} flag`}
                  style={{ width: "20px", height: "15px", marginRight: "8px" }}
                />
              </Box>
            ) : null,
          }}
        />
      )}
    />
  );
};

export default CountryCodeAutocomplete;
