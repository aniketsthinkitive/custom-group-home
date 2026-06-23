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
import CustomCheckbox from "../../../../../components/custom-checkbox/custom-checkbox";

interface Step10Props {
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

const helperTextSx = {
  fontSize: "11px",
  color: "#64748B",
  marginTop: "6px",
  lineHeight: 1.4,
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
          disabled={disabled || mode === "view"}
        >
          {options.map((opt) => (
            <FormControlLabel
              key={opt.value}
              value={opt.value}
              control={<Radio size="small" />}
              label={opt.label}
              disabled={disabled || mode === "view"}
            />
          ))}
        </RadioGroup>
      )}
    />
  );
};

const Step10_PastMedicalHistory: React.FC<Step10Props> = ({ control, errors, mode = "new" }) => {
  const medicalHistoryNotReleased = useWatch({
    control,
    name: "medicalHistoryNotReleased",
  });

  const anesthesiaProblems = useWatch({ control, name: "anesthesiaProblems" });
  const abnormalPapSmear = useWatch({ control, name: "abnormalPapSmear" });
  const givenBirth = useWatch({ control, name: "givenBirth" });

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Past Medical History
        </Typography>
      </Grid>

      {/* Medical History Release (single card like figma) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <Controller
                name="medicalHistoryNotReleased"
                control={control}
                defaultValue={false}
                render={({ field }) => (
                  <CustomCheckbox
                    checked={!!field.value}
                    onChange={(checked) => field.onChange(checked)}
                    label="Medical History not released by parent/guardian."
                  />
                )}
              />
            </Grid>

            {medicalHistoryNotReleased && (
              <Grid container direction="column" spacing={1.5}>
                <Grid>
                  <CustomLabel label="For information, contact:" style={sectionLabelSx} />
                </Grid>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Name" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="medicalHistoryContactName"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="medicalHistoryContactName"
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
                        <CustomLabel label="Relation" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="medicalHistoryContactRelation"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="medicalHistoryContactRelation"
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
                          name="medicalHistoryContactNumber"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="medicalHistoryContactNumber"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              phone
                              bgWhite
                              disableField={mode === "view"}
                              hasError={!!errors?.medicalHistoryContactNumber}
                              errorMessage={errors?.medicalHistoryContactNumber?.message}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Address" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="medicalHistoryContactAddress"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="medicalHistoryContactAddress"
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
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Surgical History Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Surgical History" style={sectionLabelSx} />
            </Grid>

            {/* List all previous surgeries + Date (side by side like figma) */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Grid container direction="column" spacing={0.5}>
                  <Grid>
                    <CustomLabel label="List all previous surgeries" style={sectionLabelSx} />
                  </Grid>
                  <Grid>
                    <Controller
                      name="surgicalHistory"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <CustomInput
                          placeholder="Enter"
                          name="surgicalHistory"
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
                    <CustomLabel label="Date" style={sectionLabelSx} />
                  </Grid>
                  <Grid>
                    <Controller
                      name="surgicalHistoryDate"
                      control={control}
                      render={({ field }) => (
                        <DatePickerField
                          name="surgicalHistoryDate"
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

            {/* Trauma/broken bones + Date (side by side like figma) */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Grid container direction="column" spacing={0.5}>
                  <Grid>
                    <CustomLabel
                      label="List any serious trauma or broken bones:"
                      style={sectionLabelSx}
                    />
                  </Grid>
                  <Grid>
                    <Controller
                      name="traumaBrokenBones"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <CustomInput
                          placeholder="Enter"
                          name="traumaBrokenBones"
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
                    <CustomLabel label="Date" style={sectionLabelSx} />
                  </Grid>
                  <Grid>
                    <Controller
                      name="traumaBrokenBonesDate"
                      control={control}
                      render={({ field }) => (
                        <DatePickerField
                          name="traumaBrokenBonesDate"
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

            {/* Anesthesia problems? Yes/No + If yes description (single line input like figma) */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Anesthesia problems?" style={sectionLabelSx} />
                </Grid>
                <Grid>
                  <InlineRadioGroup
                    name="anesthesiaProblems"
                    control={control}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    disabled={mode === "view"}
                    mode={mode}
                  />
                </Grid>

                {anesthesiaProblems === "yes" && (
                  <Grid sx={{ mt: 1 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="If Yes, Please Description" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="anesthesiaProblemsDescription"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="anesthesiaProblemsDescription"
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

      {/* Gynecologic (Women Only) Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Gynecologic (Women Only)" style={sectionLabelSx} />
            </Grid>

            {/* Ages row */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Grid container direction="column" spacing={0.5}>
                  <Grid>
                    <CustomLabel label="Age menstruation started" style={sectionLabelSx} />
                  </Grid>
                  <Grid>
                    <Controller
                      name="ageMenstruationStarted"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <CustomInput
                          placeholder="Enter"
                          name="ageMenstruationStarted"
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
                    <CustomLabel label="Age menstruation stopped" style={sectionLabelSx} />
                  </Grid>
                  <Grid container spacing={2} sx={{ alignItems: "center" }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        name="ageMenstruationStopped"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <CustomInput
                            placeholder="Enter"
                            name="ageMenstruationStopped"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            bgWhite
                            disableField={mode === "view"}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InlineRadioGroup
                        name="stillMenstruating"
                        control={control}
                        options={[
                          { value: "yes", label: "Still menstruating" },
                        ]}
                        disabled={mode === "view"}
                        mode={mode}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Given birth */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Have you ever given birth to a child?" style={sectionLabelSx} />
                </Grid>
                <Grid>
                  <InlineRadioGroup
                    name="givenBirth"
                    control={control}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    disabled={mode === "view"}
                    mode={mode}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Date of last PAP smear + status radios on right (Unknown/Never) */}
            <Grid>
              <Grid container spacing={2} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Date of last PAP smear" style={sectionLabelSx} />
                    </Grid>
                    <Grid>
                      <Controller
                        name="lastPapSmearDate"
                        control={control}
                        render={({ field }) => (
                          <DatePickerField
                            name="lastPapSmearDate"
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
                  <InlineRadioGroup
                    name="lastPapSmearStatus"
                    control={control}
                    options={[
                      { value: "unknown", label: "Unknown" },
                      { value: "never", label: "Never" },
                    ]}
                    disabled={mode === "view"}
                    mode={mode}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Abnormal PAP smear? */}
            <Grid>
              <Grid container direction="column" spacing={0.5}>
                <Grid>
                  <CustomLabel label="Any history of abnormal PAP smear?" style={sectionLabelSx} />
                </Grid>
                <Grid>
                  <InlineRadioGroup
                    name="abnormalPapSmear"
                    control={control}
                    options={[
                      { value: "yes", label: "Yes" },
                      { value: "no", label: "No" },
                    ]}
                    disabled={mode === "view"}
                    mode={mode}
                  />
                </Grid>

                {abnormalPapSmear === "yes" && (
                  <Grid sx={{ mt: 1 }}>
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="If Yes, Please Description" style={sectionLabelSx} />
                      </Grid>
                      <Grid>
                        <Controller
                          name="abnormalPapSmearDescription"
                          control={control}
                          defaultValue=""
                          render={({ field }) => (
                            <CustomInput
                              placeholder="Enter"
                              name="abnormalPapSmearDescription"
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

            {/* Date of last mammogram + status radios on right (Unknown/Never) */}
            <Grid>
              <Grid container spacing={2} sx={{ alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Date of last mammogram" style={sectionLabelSx} />
                    </Grid>
                    <Grid>
                      <Controller
                        name="lastMammogramDate"
                        control={control}
                        render={({ field }) => (
                          <DatePickerField
                            name="lastMammogramDate"
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
                  <InlineRadioGroup
                    name="lastMammogramStatus"
                    control={control}
                    options={[
                      { value: "unknown", label: "Unknown" },
                      { value: "never", label: "Never" },
                    ]}
                    disabled={mode === "view"}
                    mode={mode}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Medical Conditions Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={1.25} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Medical Conditions" style={sectionLabelSx} />
            </Grid>

            <Grid>
              <CustomLabel
                label="List all Serious illnesses & ongoing conditions"
                style={sectionLabelSx}
              />
            </Grid>

            <Grid>
              <Controller
                name="seriousIllnessesConditions"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter"
                    name="seriousIllnessesConditions"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    bgWhite
                    disableField={mode === "view"}
                  />
                )}
              />
            </Grid>

            <Grid>
              <Box sx={helperTextSx}>
                Serious illnesses (e.g., pneumonia, heart attack) and ongoing medical
                problems (e.g., diabetes, high blood pressure, epilepsy)
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Psychiatric History Card */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={1.25} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Psychiatric History" style={sectionLabelSx} />
            </Grid>

            <Grid>
              <CustomLabel
                label="List all Behavioral & psychiatric diagnoses"
                style={sectionLabelSx}
              />
            </Grid>

            <Grid>
              <Controller
                name="behavioralPsychiatricDiagnoses"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <CustomInput
                    placeholder="Enter"
                    name="behavioralPsychiatricDiagnoses"
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    bgWhite
                    disableField={mode === "view"}
                  />
                )}
              />
            </Grid>

            <Grid>
              <Box sx={helperTextSx}>
                (e.g., depression, schizophrenia, self-injurious behavior)
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step10_PastMedicalHistory;
