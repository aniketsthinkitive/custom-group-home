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

interface Step8Props {
  control: Control<any>;
  errors?: any;
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
  label,
  options,
  disabled,
  mode,
}: {
  name: string;
  control: Control<any>;
  label: string;
  options: Option[];
  disabled: boolean;
  mode?: "new" | "draft" | "view";
}) => {
  return (
    <Grid container direction="column" spacing={0.5} sx={{ width: "100%" }}>
      <Grid>
        <CustomLabel label={label} style={sectionLabelSx} />
      </Grid>
      <Grid>
        <Controller
          name={name}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <RadioGroup
              row
              value={field.value || ""}
              onChange={(e) => field.onChange(e.target.value)}
              sx={{ ...radioGroupSx, flexWrap: "wrap" }}
            >
              {options.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                  disabled={disabled || mode === "view"} // ✅ ONLY CHANGE
                />
              ))}
            </RadioGroup>
          )}
        />
      </Grid>
    </Grid>
  );
};

const Step8_LivingSocialInformation: React.FC<Step8Props> = ({ control, errors, mode = "new" }) => {
  const livingStatus = useWatch({ control, name: "livingStatus" });

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Living & Social Information
        </Typography>
      </Grid>

      {/* Living Status Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 2,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
                <Grid container direction="column" spacing={0.5}>
                  <Grid>
                    <CustomLabel label="Living Status" style={sectionLabelSx} />
                  </Grid>
                  <Grid>
                    <Controller
                      name="livingStatus"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <RadioGroup
                          row
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          sx={{ ...radioGroupSx, flexWrap: "wrap", alignItems: "center" }}
                        >
                          <FormControlLabel
                            value="group_home"
                            control={<Radio size="small" />}
                            label="Group Home"
                            disabled={mode === "view"}
                          />
                          <FormControlLabel
                            value="own_family"
                            control={<Radio size="small" />}
                            label="Own Family"
                            disabled={mode === "view"}
                          />
                          <FormControlLabel
                            value="independent"
                            control={<Radio size="small" />}
                            label="Independent"
                            disabled={mode === "view"}
                          />
                          <FormControlLabel
                            value="home_sharing"
                            control={<Radio size="small" />}
                            label="Home Sharing / Shared Home"
                            disabled={mode === "view"}
                          />

                          {/* Other + inline input like figma */}
                          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                            <FormControlLabel
                              value="other"
                              control={<Radio size="small" />}
                              label="Other"
                              sx={{ mr: 1 }}
                              disabled={mode === "view"}
                            />

                            {livingStatus === "other" && (
                              <Box sx={{ width: { xs: "100%", sm: 220 }, mt: { xs: 1, sm: 0 } }}>
                                <Controller
                                  name="livingStatusOther"
                                  control={control}
                                  defaultValue=""
                                  render={({ field: f }) => (
                                    <CustomInput
                                      placeholder="Enter"
                                      name="livingStatusOther"
                                      value={f.value || ""}
                                      onChange={(e) => f.onChange(e.target.value)}
                                      bgWhite
                                      disableField={mode === "view"}
                                    />
                                  )}
                                />
                              </Box>
                            )}
                          </Box>
                        </RadioGroup>
                      )}
                    />
                  </Grid>
                </Grid>
        </Grid>
      </Grid>

      {/* Home Care Contact Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 2,
            mt: 2,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
                <Grid container direction="column" spacing={1}>
                  <Grid>
                    <CustomLabel label="Home Care Contact" style={sectionLabelSx} />
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Name" style={sectionLabelSx} />
                        </Grid>
                        <Grid>
                          <Controller
                            name="homeCareContactName"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                              <CustomInput
                                placeholder="Enter"
                                name="homeCareContactName"
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
                          <CustomLabel label="Phone Number" style={sectionLabelSx} />
                        </Grid>
                        <Grid>
                          <Controller
                            name="homeCareContactNumber"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                              <CustomInput
                                placeholder="Enter"
                                name="homeCareContactNumber"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value)}
                                phone
                                bgWhite
                                disableField={mode === "view"}
                                hasError={!!errors?.homeCareContactNumber}
                                errorMessage={errors?.homeCareContactNumber?.message}
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

      {/* Marital Status Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 2,
            mt: 2,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
          <InlineRadioGroup
            name="maritalStatus"
            disabled={mode === "view"}
            control={control}
            label="Marital Status"
            options={[
              { value: "single", label: "Single" },
              { value: "married", label: "Married" },
              { value: "other", label: "Other" },
            ]}
            mode={mode}
          />
        </Grid>
      </Grid>

      {/* Work / Day Program Status Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 2,
            mt: 2,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
          <InlineRadioGroup
            name="workDayProgramStatus"
            control={control}
            label="Work / Day Program Status"
            options={[
              { value: "community_day_support", label: "Community Day Support" },
              { value: "regular_job", label: "Regular Job" },
              { value: "sheltered_workshop", label: "Sheltered Workshop" },
            ]}
            disabled={mode === "view"}
            mode={mode}
          />
        </Grid>
      </Grid>

      {/* Nursing Supports Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: "1px solid #E3ECEF",
            borderRadius: "8px",
            p: 2,
            mt: 2,
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
          }}
        >
          <InlineRadioGroup
            name="nursingSupports"
            control={control}
            label="Nursing Supports"
            options={[
              { value: "in_home", label: "In-home" },
              { value: "in_home_24hr", label: "In-home 24 hr" },
              { value: "nursing_coordination", label: "Nursing coordination" },
              { value: "access_vna", label: "Access to VNA" },
              { value: "none", label: "No nursing supports" },
            ]}
            disabled={mode === "view"}
            mode={mode}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step8_LivingSocialInformation;
