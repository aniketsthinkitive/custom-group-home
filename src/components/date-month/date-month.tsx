import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

export interface DateCalenderProps {
  name?: string;
  styles?: React.CSSProperties;
  value?: Dayjs | null;
  maxDate?: Dayjs;
  minDate?: Dayjs;
  onChange: (date: Dayjs | null) => void;
  hasError?: boolean;
  errorMessage?: string;
  disableFuture?: boolean;
  disablePast?: boolean;
  label?: string;
}

const DateMonth = (props: DateCalenderProps) => {
  const {
    value,
    onChange,
    maxDate,
    minDate,
    disableFuture = false,
    disablePast = false,
    styles,
  } = props;

  const [inputValue, setInputValue] = useState<Dayjs | null>(
    value ? dayjs(value) : null,
  );

  const handleChange = (newValue: Dayjs | null) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    setInputValue(value ? dayjs(value) : null);
  }, [value]);

  const calendarStyles = {
    // Container styling to match Figma overlay
    backgroundColor: "#ECF2F3",
    borderRadius: "8px",
    padding: "24px",
    width: "100%",
    minHeight: "400px",
    maxHeight: "500px",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",

    // Chrome scrollbar styling - makes it thin and styled
    "&::-webkit-scrollbar": {
      width: "1px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#C5C9C5",
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "#A9ACA9",
    },

    // Firefox scrollbar styling
    scrollbarWidth: "thin",
    scrollbarColor: "#C5C9C5 transparent",

    // Header styling
    "& .MuiPickersCalendarHeader-root": {
      backgroundColor: "transparent",
      borderRadius: 0,
      border: "none",
      color: "#2C2D2C",
      fontWeight: 600,
      fontSize: "32px",
      lineHeight: "1.2em",
      marginTop: 0,
      marginBottom: "16px",
      padding: 0,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },

    // Navigation buttons styling
    "& .MuiPickersCalendarHeader-switchViewButton": {
      color: "#2C2D2C",
      fontWeight: 600,
      fontSize: "32px",
      padding: 0,
      minWidth: "auto",
      "&:hover": {
        backgroundColor: "transparent",
      },
    },

    "& .MuiPickersArrowSwitcher-root": {
      display: "flex",
      gap: "8px",
    },

    "& .MuiPickersArrowSwitcher-button": {
      backgroundColor: "#FFFFFF",
      borderRadius: "50px",
      padding: "12px",
      minWidth: "auto",
      width: "40px",
      height: "40px",
      "&:hover": {
        backgroundColor: "#FFFFFF   ",
      },
      "&:disabled": {
        backgroundColor: "#FFFFFF",
        opacity: 0.5,
      },
      "& .MuiSvgIcon-root": {
        color: "#2C2D2C",
        fontSize: "20px",
      },
    },

    // Calendar grid styling
    "& .MuiDayCalendar-root": {
      backgroundColor: "transparent",
      border: "none",
      borderRadius: 0,
      width: "100%",
      flex: 1,
      margin: 0,
      display: "flex",
      flexDirection: "column",
    },

    // Week header styling
    "& .MuiDayCalendar-weekDayLabel": {
      backgroundColor: "transparent",
      color: "#2C2D2C",
      fontWeight: 500,
      fontSize: "14px",
      lineHeight: "1.15em",
      letterSpacing: "1.2%",
      textAlign: "center",
      flex: 1,
      height: "44px",
      margin: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },

    // Week container styling
    "& .MuiDayCalendar-weekContainer": {
      margin: 0,
      justifyContent: "stretch",
      width: "100%",
      display: "flex",
    },

    // Individual day button styling
    "& .MuiPickersDay-root": {
      backgroundColor: "#FFFFFF",
      border: "1px solid #E7E9EB",
      borderRadius: 0,
      color: "#2C2D2C",
      fontWeight: 400,
      fontSize: "14px",
      lineHeight: "1.15em",
      letterSpacing: "0.8%",
      flex: 1,
      height: "60px",
      minWidth: 0,
      maxWidth: "none",
      margin: 0,
      "&:hover": {
        backgroundColor: "#F5F5F5",
      },
      "&.Mui-selected": {
        backgroundColor: "#439322",
        color: "#FFFFFF",
        "&:hover": {
          backgroundColor: "#3A7D1E",
        },
      },
      "&.MuiPickersDay-today": {
        backgroundColor: "#EFFFE3",
        border: "1px solid #E7E9EB",
        color: "#2C2D2C",
        "&:not(.Mui-selected)": {
          backgroundColor: "#FFFFFF",
        },
        "&.Mui-selected": {
          backgroundColor: "#439322",
          color: "#FFFFFF",
        },
      },
      "&.Mui-disabled": {
        backgroundColor: "#F2F2F2",
        color: "#989998",
        border: "1px solid #E7E9EB",
      },
    },

    // Year picker styling - make it wider
    "& .MuiYearCalendar-root": {
      width: "100%",
      minWidth: "450px",
      maxWidth: "550px",
    },

    "& .MuiPickersYear-root": {
      minWidth: "80px",
      width: "auto",
      fontSize: "16px",
      padding: "8px 16px",
    },

    "& .MuiPickersYear-yearButton": {
      minWidth: "80px",
      width: "auto",
      fontSize: "16px",
      padding: "8px 16px",
    },

    ...styles, // Allow custom styles to override defaults
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        value={inputValue}
        onChange={handleChange}
        maxDate={maxDate}
        minDate={minDate}
        disableFuture={disableFuture}
        disablePast={disablePast}
        sx={calendarStyles}
      />
    </LocalizationProvider>
  );
};

export default DateMonth;
