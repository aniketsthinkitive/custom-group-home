import React from 'react';
import { Box, Typography } from '@mui/material';
import { theme } from '../../constant/styles/theme';
import CustomLabel from '../custom-label/custom-label';

interface DayOfWeekSelectorProps {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  multiSelect?: boolean;
  requiredCount?: number;
}

const DayOfWeekSelector: React.FC<DayOfWeekSelectorProps> = ({
  value,
  onChange,
  hasError = false,
  errorMessage,
  disabled = false,
  multiSelect = false,
  requiredCount,
}) => {
  const days = [
    { value: 'sunday', label: 'S', fullLabel: 'Sunday' },
    { value: 'monday', label: 'M', fullLabel: 'Monday' },
    { value: 'tuesday', label: 'T', fullLabel: 'Tuesday' },
    { value: 'wednesday', label: 'W', fullLabel: 'Wednesday' },
    { value: 'thursday', label: 'T', fullLabel: 'Thursday' },
    { value: 'friday', label: 'F', fullLabel: 'Friday' },
    { value: 'saturday', label: 'S', fullLabel: 'Saturday' },
  ];

  // Parse current selected days (comma-separated string)
  const selectedDays = value ? value.split(',').map(d => d.trim()) : [];
  const selectedCount = selectedDays.length;

  const handleDayClick = (dayValue: string) => {
    if (disabled) return;

    if (multiSelect) {
      // Multiple selection mode
      const isCurrentlySelected = selectedDays.includes(dayValue);
      let newSelectedDays: string[];

      if (isCurrentlySelected) {
        // Deselect day (always allow deselection)
        newSelectedDays = selectedDays.filter(d => d !== dayValue);
      } else {
        // Check if we've reached the required count limit
        if (requiredCount && selectedDays.length >= requiredCount) {
          // Don't allow more selections than required
          return;
        }
        // Select day
        newSelectedDays = [...selectedDays, dayValue];
      }

      // Update with comma-separated string
      onChange(newSelectedDays.join(','));
    } else {
      // Single selection mode (original behavior)
      onChange(dayValue);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <CustomLabel label="Day of the Week" isRequired />
        {multiSelect && requiredCount && (
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 400,
              color: "#757775",
              fontFamily: theme.typography.fontFamily,
            }}
          >
            ({selectedCount}/{requiredCount} selected)
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: "16px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {days.map((day) => {
          const isSelected = multiSelect 
            ? selectedDays.includes(day.value)
            : value === day.value;
          
          return (
            <Box
              key={day.value}
              onClick={() => handleDayClick(day.value)}
              sx={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                backgroundColor: isSelected ? "#439322" : "#efffe3",
                color: isSelected ? "#FFFFFF !important" : theme.palette.text.primary,
                border: isSelected ? "2px solid #2C6E14" : "1px solid #efffe3",
                boxShadow: isSelected ? "0px 4px 4px 0px rgba(0, 0, 0, 0.12)" : "none",
                transition: "all 0.2s ease-in-out",
                opacity: disabled ? 0.6 : 1,
                "&:hover": !disabled
                  ? {
                      backgroundColor: isSelected ? theme.palette.primary.dark : theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      transform: "translateY(-1px)",
                      boxShadow: isSelected ? "0px 4px 4px 0px rgba(0, 0, 0, 0.12)" : `0px 4px 8px rgba(67, 147, 34, 0.2)`,
                    }
                  : {},
                "&:active": !disabled
                  ? {
                      transform: "translateY(0px)",
                    }
                  : {},
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: isSelected ? 600 : 400,
                  fontFamily: theme.typography.fontFamily,
                  color: isSelected ? "#FFFFFF" : "inherit",
                }}
              >
                {day.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {hasError && errorMessage && (
        <Typography
          sx={{
            fontSize: "12px",
            color: theme.palette.error.main,
            fontFamily: theme.typography.fontFamily,
            marginTop: "4px",
          }}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default DayOfWeekSelector;
