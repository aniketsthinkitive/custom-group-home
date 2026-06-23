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
import CustomCheckbox from "../../../../../components/custom-checkbox/custom-checkbox";

interface Step6Props {
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
  "& .MuiFormControlLabel-root": {
    mr: 2,
    mb: 0.5,
  },
  "& .MuiFormControlLabel-label": {
    fontSize: "13px",
    color: "#334155",
  },
  "& .MuiRadio-root": {
    p: "4px 8px 4px 0px",
  },
};

const Step6_SpecialNeeds: React.FC<Step6Props> = ({ control, mode = "new" }) => {
  const specialCommunicationDevice = useWatch({
    control,
    name: "specialCommunicationDevice",
  });
  const painResponse = useWatch({ control, name: "painResponse" });

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Special Needs & Exam Preferences
        </Typography>
      </Grid>

      {/* Single Main Card (like figma) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            {/* Medical Exam Response */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Medical Exam Response" style={sectionLabelSx} />
                </Grid>

                <Grid>
                  <Controller
                    name="medicalExamResponse"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <RadioGroup
                        row
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        sx={{ ...radioGroupSx, flexWrap: "wrap" }}
                        disabled={mode === "view"}
                      >
                        <FormControlLabel
                          value="cooperates"
                          control={<Radio size="small" />}
                          label="Cooperates"
                          disabled={mode === "view"}
                        />
                        <FormControlLabel
                          value="partially_cooperates"
                          control={<Radio size="small" />}
                          label="Partially cooperates"
                          disabled={mode === "view"}
                        />
                        <FormControlLabel
                          value="resistant"
                          control={<Radio size="small" />}
                          label="Resistant"
                          disabled={mode === "view"}
                        />
                        <FormControlLabel
                          value="fearful"
                          control={<Radio size="small" />}
                          label="Fearful"
                          disabled={mode === "view"}
                        />
                      </RadioGroup>
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Divider */}
            <Grid>
              <Box sx={{ borderTop: "1px solid #E3ECEF" }} />
            </Grid>

            {/* Additional Requirements */}
            <Grid>
              <Grid container direction="column" spacing={1}>
                <Grid>
                  <CustomLabel label="Additional Requirements" style={sectionLabelSx} />
                </Grid>

                <Grid>
                  <Controller
                    name="sedationRequired"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={!!field.value}
                        onChange={(checked) => field.onChange(checked)}
                        label="Sedation required"
                        disabled={mode === "view"}
                      />
                    )}
                  />
                </Grid>

                <Grid>
                  <Controller
                    name="specialPositioning"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={!!field.value}
                        onChange={(checked) => field.onChange(checked)}
                        label="Special positioning"
                        disabled={mode === "view"}
                      />
                    )}
                  />
                </Grid>

                <Grid>
                  <Controller
                    name="doubleStaffingRequired"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={!!field.value}
                        onChange={(checked) => field.onChange(checked)}
                        label="Double staffing required"
                        disabled={mode === "view"}
                      />  
                    )}
                  />
                </Grid>

                <Grid>
                  <Controller
                    name="limitedWaitingPeriods"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={!!field.value}
                        onChange={(checked) => field.onChange(checked)}
                        label="Limited waiting periods"
                        disabled={mode === "view"}
                      />
                    )}
                  />
                </Grid>

                <Grid>
                  <Controller
                    name="earlyDayAppointments"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={!!field.value}
                        onChange={(checked) => field.onChange(checked)}
                        label="Early day appointments"
                        disabled={mode === "view"}
                      />
                    )}
                  />
                </Grid>

                <Grid>
                  <Controller
                    name="endOfDayAppointments"
                    control={control}
                    defaultValue={false}
                    render={({ field }) => (
                      <CustomCheckbox
                        checked={!!field.value}
                        onChange={(checked) => field.onChange(checked)}
                        label="End of day appointments"
                        disabled={mode === "view"}
                      />
                    )}
                  />
                </Grid>

                {/* Special communication device + inline input (like figma) */}
                <Grid>
                  <Grid container direction="column" spacing={1}>
                    <Grid>
                      <Controller
                        name="specialCommunicationDevice"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!!field.value}
                            onChange={(checked) => field.onChange(checked)}
                            label="Special communication device"
                            disabled={mode === "view"}
                          />
                        )}
                      />
                    </Grid>

                    {specialCommunicationDevice && (
                      <Grid>
                        <Controller
                          name="specialCommunicationDeviceType"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="specialCommunicationDeviceType"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              bgWhite
                              disableField = {mode === "view"}
                              
                            />
                          )}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Divider */}
            <Grid>
              <Box sx={{ borderTop: "1px solid #E3ECEF" }} />
            </Grid>

            {/* Pain Response (inline radio + input like figma) */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Pain Response" style={sectionLabelSx} />
                </Grid>

                <Grid>
                  <Grid
                    container
                    sx={{ alignItems: "center", gap: 2, flexWrap: "wrap" }}
                  >
                    <Grid>
                      <Controller
                        name="painResponse"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <RadioGroup
                            row
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            sx={{ ...radioGroupSx, mt: 0 }}
                            
                          >
                            <FormControlLabel
                              value="normal"
                              control={<Radio size="small" />}
                              label="Normal"
                              disabled={mode === "view"}
                            />
                            <FormControlLabel
                              value="unique"
                              control={<Radio size="small" />}
                              label="Unique"
                              disabled={mode === "view"}
                            />
                          </RadioGroup>
                        )}
                      />
                    </Grid>

                    {painResponse === "unique" && (
                      <Grid sx={{ width: { xs: "100%", sm: 220 } }}>
                        <Controller
                          name="painResponseUnique"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="painResponseUnique"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              bgWhite
                              disableField={mode === "view"}
                            />
                          )}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step6_SpecialNeeds;
