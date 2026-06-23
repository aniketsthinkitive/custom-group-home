import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import theme from "../../constant/styles/theme";

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

const DateCalender = (props: DateCalenderProps) => {
  const { 
    value, 
    onChange, 
    maxDate, 
    minDate, 
    disableFuture = false, 
    disablePast = false, 
    styles 
  } = props;

  const [inputValue, setInputValue] = useState<Dayjs | null>(
    value ? dayjs(value) : null
  );

  const handleChange = (newValue: Dayjs | null) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    setInputValue(value ? dayjs(value) : null);
  }, [value]);

  const calendarStyles = {
    "& .MuiPickersCalendarHeader-root": {
      borderRadius: 0,
      border: `0.5px solid ${theme.palette.grey[400]}`,
      color: theme.palette.primary.main,
      fontWeight: 700,
      marginBottom: 0,
      borderBottom: 'none',
      width: 307,
    },
    "& .MuiDayCalendar-root": {
      border: `0.5px solid ${theme.palette.grey[400]}`,
      borderRadius: 0,
      width: 307,
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

export default DateCalender;
