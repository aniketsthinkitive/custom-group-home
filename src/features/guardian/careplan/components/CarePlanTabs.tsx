import { Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import DatePickerField from "../../../../components/date-picker-field/date-picker-field";
import CustomSelect from "../../../../components/custom-select/custom-select";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

const monthItems = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const generateYearItems = () => {
  const currentYear = dayjs().year();
  const startYear = currentYear - 5;
  const endYear = currentYear + 1;
  const arr: { value: string; label: string }[] = [];
  for (let y = startYear; y <= endYear; y++) {
    arr.push({ value: String(y), label: String(y) });
  }
  return arr;
};

const yearItems = generateYearItems();

type Props = {
  value: number;
  onChange: (_: any, newValue: number) => void;
  selectedDate: Dayjs | null;
  onDateChange: (date: Dayjs | null) => void;
  onExport?: () => void;
  selectedMonth: string;
  selectedYear: string;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
};

const CarePlanTabs = ({
  value,
  onChange,
  selectedDate,
  onDateChange,
  onExport,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: Props) => {
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 1, sm: 1.5 },
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #E7E9EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={onChange}
        sx={{
          backgroundColor: "#FAFAFA",
          borderRadius: "6px",
          padding: "2px",
          border: "1px solid #E9E9EE",
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#667085",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: "6px",
            px: 2,
            py: 0.5,
            minHeight: 32,
          },
          "& .Mui-selected": {
            color: "#11466D !important",
            backgroundColor: "#EAF2FF !important",
            boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
          },
        }}
      >
        <ToggleButton value={0}>ADL’s</ToggleButton>
        <ToggleButton value={1}>Monthly Summary</ToggleButton>
      </ToggleButtonGroup>

      <Box
        sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}
      >
        {value !== 1 ? (
          <>
            <Box sx={{ width: { xs: "100%", sm: 200 } }}>
              <DatePickerField
                value={dayjs(selectedDate).isValid() ? selectedDate : dayjs()}
                onChange={onDateChange}
                format="MM-DD-YYYY"
                bgWhite
                showClearIcon={false}
              />
            </Box>

            <Button
              variant="contained"
              onClick={onExport}
              startIcon={<FileUploadOutlinedIcon sx={{ fontSize: 18 }} />}
              sx={{
                backgroundColor: "#0B3A5A",
                color: "#FFFFFF",
                borderRadius: "8px",
                height: 38,
                px: 2,
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: "14px",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#09304A",
                  boxShadow: "none",
                },
                "& .MuiButton-startIcon": {
                  marginRight: "8px",
                },
              }}
            >
              Export
            </Button>
          </>
        ) : (
          <>
            <Box sx={{ width: 180 }}>
              <CustomSelect
                placeholder="Month"
                name="month"
                value={selectedMonth}
                items={monthItems}
                onChange={(e) => onMonthChange(String(e.target.value))}
                bgWhite
                height={38}
              />
            </Box>
            <Box sx={{ width: 120 }}>
              <CustomSelect
                placeholder="Year"
                name="year"
                value={selectedYear}
                items={yearItems}
                onChange={(e) => onYearChange(String(e.target.value))}
                bgWhite
                height={38}
              />
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default CarePlanTabs;
