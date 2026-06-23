import React from "react";
import {
  Grid,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Control, Controller, useWatch } from "react-hook-form";
import CustomInput from "../../../../../components/custom-input/custom-input";
import CustomLabel from "../../../../../components/custom-label/custom-label";
import DatePickerField from "../../../../../components/date-picker-field/date-picker-field";

interface Step9Props {
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
  mt: 0.5,
  "& .MuiFormControlLabel-root": { mr: 2, mb: 0.5 },
  "& .MuiFormControlLabel-label": { fontSize: "13px", color: "#334155" },
  "& .MuiRadio-root": { p: "4px 8px 4px 0px" },
};

type Option = { value: string; label: string };

const InlineRadioGroup = ({
  name,
  control,
  options,
  disabled,
  mode,
}: {
  name: string;
  control: Control<any>;
  options: Option[];
  disabled?: boolean;
  mode?: "new" | "draft" | "view";
}) => {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue=""
      render={({ field }) => (
        <RadioGroup
          row
          value={field.value || ""}
          onChange={(e) => field.onChange(e.target.value)}
          sx={{ ...radioGroupSx, mt: 0, flexWrap: "wrap" }}
          
          
        >
          {options.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio size="small" />}
              label={opt.label}
              disabled={disabled}
              
            />
          ))}
        </RadioGroup>
      )}
    />
  );
};

const VaccineRow = ({
  label,
  dateName,
  statusName,
  control,
  disabled,
  mode,
  statusOptions = [
    { value: "unknown", label: "Unknown" },
    { value: "allergic", label: "Allergic" },
    { value: "never", label: "Never" },
  ],
}: {
  label: string;
  dateName: string;
  statusName: string;
  control: Control<any>;
  statusOptions?: Option[];
  disabled?: boolean;
  mode?: "new" | "draft" | "view";
}) => {
  return (
    <Grid container spacing={2}>
      {/* Label row */}
      <Grid size={{ xs: 12 }}>
        <CustomLabel label={label} style={{ fontSize: "13px", fontWeight: 500, color: "#334155" }} />
      </Grid>
      
      {/* Date and Radio buttons aligned */}
      <Grid container spacing={20} sx={{ alignItems: "flex-end" }}>
        <Grid size={{ xs: 12, md: 4 }}>
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

        <Grid size={{ xs: 12, md: 8 }} sx={{ pl: { md: 1 } }}>
          <InlineRadioGroup name={statusName} control={control} options={statusOptions} disabled={disabled || mode === "view"} mode={mode} />
        </Grid>
      </Grid>
    </Grid>
  );
};

const Step9_Immunizations: React.FC<Step9Props> = ({ control, mode = "new" }) => {
  const ppdPositiveTest = useWatch({ control, name: "ppdPositiveTest" });
  const ppdTreatmentGiven = useWatch({ control, name: "ppdTreatmentGiven" });
  const eatingDisorderHistory = useWatch({ control, name: "eatingDisorderHistory" });

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Immunizations
        </Typography>
      </Grid>

      {/* Immunizations Card */}
       <Grid size={{ xs: 12 }}>
        <Grid container direction="row" sx={cardSx}>
          <Grid container direction="column" spacing={3} sx={{ width: "100%" }}>
            <Grid>
              <VaccineRow
                label="Tetanus"
                dateName="tetanusDate"
                statusName="tetanusStatus"
                control={control}
                disabled={mode === "view"}
                mode={mode}
              />
            </Grid>

            <Grid>
              <VaccineRow
                label="Flu Shot"
                dateName="fluShotDate"
                statusName="fluShotStatus"
                control={control}
                disabled={mode === "view"}
                mode={mode}
              />
            </Grid>

            <Grid>
              <VaccineRow
                label="Pneumovax"
                dateName="pneumovaxDate"
                statusName="pneumovaxStatus"
                control={control}
                disabled={mode === "view"}
                mode={mode}
              />
            </Grid>

            <Grid>
              <VaccineRow
                label="Hepatitis B (Primary Series – 3 shots)"
                dateName="hepatitisBDate"
                statusName="hepatitisBStatus"
                control={control}
                disabled={mode === "view"}
                mode={mode}
              />
            </Grid>

            {/* Other Vaccinations row has Date + Specify (like figma) */}
            <Grid>
              <Grid container spacing={2}>
                {/* Label row */}
                <Grid size={{ xs: 12 }}>
                  <CustomLabel
                    label="Other Vaccinations"
                    style={{ fontSize: "13px", fontWeight: 500, color: "#334155" }}
                  />
                </Grid>
                
                {/* Date and Specify aligned */}
                <Grid container spacing={2} sx={{ alignItems: "flex-end" }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Date" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="otherVaccinationsDate"
                          control={control}
                          render={({ field }) => (
                            <DatePickerField
                              name="otherVaccinationsDate"
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

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Specify" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="otherVaccinationsSpecify"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="otherVaccinationsSpecify"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              bgWhite
                              disableField={mode === "view"}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid> 

      {/* Tuberculosis (PPD) Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={{ ...cardSx, mt: 0 }}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Tuberculosis (PPD)" style={sectionLabelSx} />
            </Grid>

            {/* Ever had positive test? */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Ever had positive test?" style={sectionLabelSx} />
                </Grid>
                <Grid>
                  <InlineRadioGroup
                    name="ppdPositiveTest"
                    control={control}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                      { value: "unsure", label: "Unsure" },
                    ]}
                    disabled={mode === "view"}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Was any treatment given? + Explain inline like figma */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Was any treatment given?" style={sectionLabelSx} />
                </Grid>

                <Grid container spacing={2} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 12 }}>
                    <Grid container sx={{ alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                      <Grid>
                        <InlineRadioGroup
                          name="ppdTreatmentGiven"
                          control={control}
                          options={[
                            { value: "yes", label: "Yes" },
                            { value: "no", label: "No" },
                          ]}
                          disabled={mode === "view"}
                        />
                      </Grid>

                      {/* show explain input for both yes/no (as in figma) */}
                      {(ppdTreatmentGiven === "yes" || ppdTreatmentGiven === "no") && (
                        <Box sx={{ width: { xs: "100%", sm: 420 } }}>
                          <Controller
                            name="ppdTreatmentExplain"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                              <CustomInput
                                placeholder="Explain"
                                name="ppdTreatmentExplain"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                bgWhite
                                disableField={mode === "view"}
                              />
                            )}
                          />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Date of last PPD */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Date of last PPD" style={sectionLabelSx} />
                </Grid>
                <Grid sx={{ width: { xs: "100%", md: 320 } }}>
                  <Controller
                    name="ppdLastDate"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        name="ppdLastDate"
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
          </Grid>
        </Grid>
      </Grid>

      {/* Health Updates Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Health Updates" style={sectionLabelSx} />
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Grid container direction="column" spacing={0.5}>
                  <Grid>
                    <CustomLabel label="Weight" style={sectionLabelSx} />
                  </Grid>
                  <Grid>
                    <Controller
                      name="healthUpdatesWeight"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <CustomInput
                          placeholder="Enter"
                          name="healthUpdatesWeight"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={mode === "view"}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Grid container direction="column" spacing={0.5}>
                  <Grid>
                    <CustomLabel
                      label="Major illnesses / surgeries / changes"
                      style={sectionLabelSx}
                    />
                  </Grid>
                  <Grid>
                    <Controller
                      name="healthUpdatesMajorChanges"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <CustomInput
                          placeholder="Enter"
                          name="healthUpdatesMajorChanges"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={mode === "view"}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Lifestyle Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Lifestyle" style={sectionLabelSx} />
            </Grid>

            {/* Smoking */}
            <Grid>
              <InlineRadioGroup
                name="smoking"
                control={control}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                disabled={mode === "view"}
              />
            </Grid>

            {/* Alcohol/Drug use */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Alcohol/Drug use" style={sectionLabelSx} />
                </Grid>
                <Grid>
                  <InlineRadioGroup
                    name="alcoholDrugUse"
                    control={control}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    disabled={mode === "view"}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Eating disorder history + conditional description */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Eating disorder history" style={sectionLabelSx} />
                </Grid>
                <Grid>
                  <InlineRadioGroup
                    name="eatingDisorderHistory"
                    control={control}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    disabled={mode === "view"}
                  />
                </Grid>

                {eatingDisorderHistory === "yes" && (
                  <Grid sx={{ mt: 1 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="If Yes, Please Description" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="eatingDisorderDescription"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="eatingDisorderDescription"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              bgWhite
                              disableField={mode === "view"}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step9_Immunizations;
