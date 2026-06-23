import { styled, TextareaAutosize, Typography } from "@mui/material";
import type { ChangeEvent } from "react";
import { errorStyle } from "../custom-input/custom-input-styles";
import { editTextAreaStyle } from "./widgets/custom-textarea-widgets";

interface CustomTextAreaProps {
  placeholder: string;
  name: string;
  value: string | number | undefined;
  minRow: number;
  maxRow?: number;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  isDisabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  defaultValue?: string;
}

const StyledTextarea = styled(TextareaAutosize, {
  shouldForwardProp: (prop) => prop !== 'hasError',
})<{ hasError?: boolean }>(
  ({ hasError }) => ({
    ...editTextAreaStyle.textArea,
    borderColor: hasError ? "red" : "#D3D3D3",
    "&:focus": {
      borderRadius: "8px",
      // border: "0.5px solid black",
      height: "40px",
      padding: "10px 12px",
      outline: "none",
      
      //fontSize: "14px",
      //fontFamily: "sans-serif",
      fontFamily: "Roboto, Helvetica, Arial, sans-serif",
      fontSize: "14px",
      letterSpacing: "0.25%",
      lineHeight: "150%",
    },
  }),
);

const ErrorTypography = styled(Typography)({
  ...errorStyle,
});

function CustomTextArea(props: CustomTextAreaProps) {
  return (
    <>
      <StyledTextarea
        hasError={props.hasError}
        disabled={props.isDisabled && props.isDisabled}
        minRows={props.minRow}
        maxRows={props.maxRow || 10}
        draggable={false}
        name={props.name}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        value={props.value ? props.value : ""}
        onChange={props.onChange}
        // className={`${editTextAreaStyle.textArea} ${props.hasError ? editTextAreaStyle.errorMessage : ""}`}
        className={props.hasError ? `${editTextAreaStyle.errorMessage}` : ""}
        
      />
      <ErrorTypography 
        sx={{ 
          ...errorStyle,
          fontSize: "0.75rem",
          lineHeight: 1.66,
          letterSpacing: "0.03333em",
        }}
      >
        {props.hasError ? props.errorMessage : ""}
      </ErrorTypography>
      {/* varient: caption */}
    </>
  );
}

export default CustomTextArea;
