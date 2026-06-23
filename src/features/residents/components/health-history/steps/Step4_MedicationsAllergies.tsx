import React from "react";
import {
  Grid,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { Control, Controller } from "react-hook-form";
import CustomInput from "../../../../../components/custom-input/custom-input";
import CustomLabel from "../../../../../components/custom-label/custom-label";
import CustomTextArea from "../../../../../components/custom-text-area/custom-textarea";
import CustomRadio from "../../../../../components/custom-radio/custom-radio";

interface Step4Props {
  control: Control<any>;
  errors?: any;
  mode?: "new" | "draft" | "view";
}

const cardSx = {
  border: "1px solid #E3ECEF",
  borderRadius: "8px",
  p: 2,
  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
  bgcolor: "#fff",
};

const sectionTitleSx = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#1F2A37",
};

const Step4_MedicationsAllergies: React.FC<Step4Props> = ({ control, errors, mode = "new" }) => {
  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Medications & Allergies
        </Typography>
      </Grid>

      {/* Medications + Pharmacy Details Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            {/* Medications */}
            <Grid>
              <Grid container direction="column" spacing={1}>
                <Grid>
                  <CustomLabel label="Medications" style={sectionTitleSx} />
                </Grid>

                <Grid>
  <Controller
    name="medicationsAttachedType"
    control={control}
    defaultValue="sheet"
    render={({ field }) => (
      <Grid
        container
        direction="column"
        sx={{
          gap: "6px",
        }}
      >
        <CustomRadio
          checked={field.value === "sheet"}
          value="sheet"
          label="Medication sheet/record attached"
          onChange={(checked, value) => {
            if (checked) field.onChange(value);
          }}
          disabled={mode === "view"}   // 👈 optional
        />

        <CustomRadio
          checked={field.value === "list"}
          value="list"
          label="List attached (dose, route, frequency, reason)"
          onChange={(checked, value) => {
            if (checked) field.onChange(value);
          }}
          disabled={mode === "view"}   // 👈 optional
        />
      </Grid>
    )}
  />
</Grid>
              </Grid>
            </Grid>

            {/* Divider line between sections (like screenshot) */}
            <Grid>
              <Box sx={{ borderTop: "1px solid #E3ECEF" }} />
            </Grid>

            {/* Pharmacy Details */}
            <Grid>
              <Grid container direction="column" spacing={1.5}>
                <Grid>
                  <CustomLabel label="Pharmacy Details" style={sectionTitleSx} />
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="pharmacyName"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid>
                            <CustomLabel label="Pharmacy Name" />
                          </Grid>
                          <Grid>
                            <CustomInput
                              placeholder="Enter"
                              name="pharmacyName"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              bgWhite
                              disableField={mode === "view"}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="pharmacyContactNumber"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid>
                            <CustomLabel label="Phone Number" />
                          </Grid>
                          <Grid>
                            <CustomInput
                              placeholder="Enter"
                              name="pharmacyContactNumber"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              phone
                              bgWhite
                              disableField={mode === "view"}
                              hasError={!!errors?.pharmacyContactNumber}
                              errorMessage={errors?.pharmacyContactNumber?.message}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="pharmacyAddress"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid>
                            <CustomLabel label="Address" />
                          </Grid>
                          <Grid>
                            <CustomInput
                              placeholder="Enter"
                              name="pharmacyAddress"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              bgWhite
                              disableField={mode === "view"}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Allergies Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Allergies" style={sectionTitleSx} />
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="medicationAllergies"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Medication Allergies" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="medicationAllergies"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={mode === "view"}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="foodEnvironmentalAllergies"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Food / Environmental Allergies" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="foodEnvironmentalAllergies"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={mode === "view"}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="typeOfReaction"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Type of Reaction" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="typeOfReaction"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={mode === "view"}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Current Medical Problems & Diagnoses Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={1.5} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel
                label="Current Medical Problems & Diagnoses"
                style={sectionTitleSx}
              />
            </Grid>
            <Grid>
              <Controller
                name="currentMedicalProblems"
                control={control}
                render={({ field }) => (
                  <CustomTextArea
                    placeholder="Enter here..."
                    name="currentMedicalProblems"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    minRow={4}
                    maxRow={4}
                    
                    isDisabled={mode === "view"}
                  />
                )}
                disabled={mode === "view"}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step4_MedicationsAllergies;
