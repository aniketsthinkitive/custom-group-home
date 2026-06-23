import React from "react";
import { Box, Typography } from "@mui/material";
import { customLabelStyles } from "./custom-label-styles";

interface CustomFormLabelProps {
  label: string | React.ReactNode;
  isRequired?: boolean;
  style?: React.CSSProperties;
}

const CustomLabel = React.memo<CustomFormLabelProps>(
  ({ label, isRequired, style }) => {
    return (
      <Box sx={{ mb: 1, ...style }}>
        <Typography
          sx={{
            letterSpacing: "inherit",
            fontSize: "14px",
            fontFamily: "Helvetica Neue, Arial, sans-serif",
            fontWeight: 500,
            color: customLabelStyles.headerLabel.color,
            lineHeight: 1.75,
          }}
        >
          {label} 
          {isRequired && <span style={customLabelStyles.required}>*</span>}
        </Typography>
      </Box>
    );
  },
);

CustomLabel.displayName = "CustomLabel";

export default CustomLabel;
