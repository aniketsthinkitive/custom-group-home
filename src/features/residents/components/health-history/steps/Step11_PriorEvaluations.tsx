import React from "react";
import {
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Control, Controller } from "react-hook-form";
import CustomLabel from "../../../../../components/custom-label/custom-label";
import DatePickerField from "../../../../../components/date-picker-field/date-picker-field";

interface Step11Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const pageTitleSx = { fontSize: "16px", fontWeight: 600, color: "#1F2A37" };

const cardSx = {
  border: "1px solid #E3ECEF",
  borderRadius: "8px",
  p: 2,
  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
  bgcolor: "#fff",
};

const sectionLabelSx = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#334155",
};

const radioGroupSx = {
  mt: 0,
  "& .MuiFormControlLabel-root": { mr: 2, mb: 0.5 },
  "& .MuiFormControlLabel-label": { fontSize: "13px", color: "#334155" },
  "& .MuiRadio-root": { p: "4px 8px 4px 0px" },
};

type ExamRowProps = {
  label: string;
  dateName: string;
  statusName: string;
  control: Control<any>;
  mode?: "new" | "draft" | "view";
};

const ExamRow: React.FC<ExamRowProps> = ({ label, dateName, statusName, control, mode = "new" }) => {
  return (
    <Grid container direction="column" spacing={0.5}>
      {/* Exam Label */}
      <Grid>
        <CustomLabel
          label={label}
          style={{ fontSize: "13px", fontWeight: 500, color: "#334155" }}
        />
      </Grid>
      
      {/* Date and Radio buttons aligned horizontally */}
      <Grid container spacing={2} sx={{ alignItems: "flex-end" }}>
        {/* Date Field */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Grid container direction="column" spacing={0.5}>
            <Grid>
              <CustomLabel label="Date" style={sectionLabelSx} />
            </Grid>
            <Grid>
              <Controller
                name={dateName}
                control={control}
                render={({ field }) => (
                  <DatePickerField
                    name={dateName}
                    value={field.value}
                    onChange={field.onChange}
                    useCustomStyle={false}
                    disableFuture
                    disabled={mode === "view"}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Radio buttons: Unknown / Never */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name={statusName}
            control={control}
            defaultValue=""
            render={({ field }) => (
              <RadioGroup
                row
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
                sx={{ ...radioGroupSx, flexWrap: "wrap", mt: 0 }}
              >
                <FormControlLabel
                  value="unknown"
                  control={<Radio size="small" />}
                  label="Unknown"
                  disabled={mode === "view"}
                />
                <FormControlLabel
                  value="never"
                  control={<Radio size="small" />}
                  label="Never"
                  disabled={mode === "view"}
                />
              </RadioGroup>
            )}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

const Step11_PriorEvaluations: React.FC<Step11Props> = ({ control, mode = "new" }) => {
  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Prior Evaluations
        </Typography>
      </Grid>

      {/* Single Card (like figma) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <ExamRow
                label="Audiological Exam"
                dateName="audiologicalExamDate"
                statusName="audiologicalExamStatus"
                control={control}
                mode={mode}
              />
            </Grid>

            <Grid>
              <ExamRow
                label="Eye Exam"
                dateName="eyeExamDate"
                statusName="eyeExamStatus"
                control={control}
                mode={mode}
              />
            </Grid>

            <Grid>
              <ExamRow
                label="Dental Exam"
                dateName="dentalExamDate"
                statusName="dentalExamStatus"
                control={control}
                mode={mode}
              />
            </Grid>

            <Grid>
              <ExamRow
                label="Bone Density"
                dateName="boneDensityDate"
                statusName="boneDensityStatus"
                control={control}
                mode={mode}
              />
            </Grid>

            <Grid>
              <ExamRow
                label="Colonoscopy / Sigmoidoscopy"
                dateName="colonoscopySigmoidoscopyDate"
                statusName="colonoscopySigmoidoscopyStatus"
                control={control}
                mode={mode}
              />
            </Grid>

            <Grid>
              <ExamRow
                label="PSA (Men only)"
                dateName="psaDate"
                statusName="psaStatus"
                control={control}
                mode={mode}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step11_PriorEvaluations;
