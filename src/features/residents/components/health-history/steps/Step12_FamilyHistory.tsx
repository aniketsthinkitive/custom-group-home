import React, { useState } from "react";
import {
  Grid,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Divider,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Control, Controller, useWatch } from "react-hook-form";
import CustomInput from "../../../../../components/custom-input/custom-input";
import CustomLabel from "../../../../../components/custom-label/custom-label";
import CustomCheckbox from "../../../../../components/custom-checkbox/custom-checkbox";

interface Step12Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

interface BrotherSister {
  id: string;
  age: string;
  health: string;
}

const pageTitleSx = { fontSize: "16px", fontWeight: 600, color: "#1F2A37" };

const cardSx = {
  border: "1px solid #E3ECEF",
  borderRadius: "8px",
  p: 2,
  boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.08)",
  bgcolor: "#fff",
};

const sectionTitleSx = { fontSize: "13px", fontWeight: 600, color: "#1F2A37" };
const sectionLabelSx = { fontSize: "12px", fontWeight: 500, color: "#334155" };

const radioGroupSx = {
  mt: 0.25,
  "& .MuiFormControlLabel-root": { mr: 2, mb: 0.5 },
  "& .MuiFormControlLabel-label": { fontSize: "13px", color: "#334155" },
  "& .MuiRadio-root": { p: "4px 8px 4px 0px" },
};

const addMoreSx = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  color: "#0F3D5E",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  userSelect: "none",
};

const Step12_FamilyHistory: React.FC<Step12Props> = ({ control, mode = "new" }) => {
  const [brothersSisters, setBrothersSisters] = useState<BrotherSister[]>([
    { id: "1", age: "", health: "" },
  ]);

  const familyHistoryCancer = useWatch({ control, name: "familyHistoryCancer" });

  const addBrotherSister = () => {
    if (mode !== "view") {
      setBrothersSisters((prev) => [
        ...prev,
        { id: Date.now().toString(), age: "", health: "" },
      ]);
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Family History
        </Typography>
      </Grid>

      {/* Family History Card (everything inside 1 card like figma) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
            {/* Brothers & Sisters header */}
            <Grid>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid>
                  <CustomLabel
                    label="List all brother and sisters with information"
                    style={sectionLabelSx}
                  />
                </Grid>

                <Grid>
                  <Box 
                    sx={{ 
                      ...addMoreSx, 
                      cursor: mode === "view" ? 'not-allowed' : 'pointer',
                      opacity: mode === "view" ? 0.6 : 1,
                    }} 
                    onClick={addBrotherSister}
                  >
                    <IconButton
                      size="small"
                      disabled={mode === "view"}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "6px",
                      
                        bgcolor: "#fff",
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    Add More
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Brother/Sister rows (figma shows Age + Health only) */}
            <Grid>
              <Grid container spacing={2}>
                {brothersSisters.map((_, index) => (
                  <Grid size={{ xs: 12 }} key={index}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Grid container direction="column" spacing={0.5}>
                          <Grid>
                            <CustomLabel label="Age" style={sectionLabelSx} />
                          </Grid>
                          <Grid>
                            <Controller
                              name={`brothersSisters.${index}.age`}
                              control={control}
                              defaultValue=""
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter"
                                  name={`brothersSisters.${index}.age`}
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
                            <CustomLabel label="Health" style={sectionLabelSx} />
                          </Grid>
                          <Grid>
                            <Controller
                              name={`brothersSisters.${index}.health`}
                              control={control}
                              defaultValue=""
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Enter"
                                  name={`brothersSisters.${index}.health`}
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
                ))}
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: "#E3ECEF" }} />

            {/* Family diseases */}
            <Grid container direction="column" spacing={1}>
              <Grid>
                <CustomLabel label="Family diseases" style={sectionTitleSx} />
              </Grid>

              <Grid>
                <CustomLabel
                  label='Are there any other diseases that “run in the family?”'
                  style={sectionLabelSx}
                />
                <Controller
                  name="familyDiseasesRunInFamily"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <RadioGroup
                      row
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      sx={radioGroupSx}
                      disabled={mode === "view"}
                    >
                      <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" disabled={mode === "view"} />
                      <FormControlLabel value="no" control={<Radio size="small" />} label="No" disabled={mode === "view"} />
                      <FormControlLabel
                        value="unknown"
                        control={<Radio size="small" />}
                        label="Unknown"
                        disabled={mode === "view"}
                      />
                    </RadioGroup>
                  )}
                />
              </Grid>

              <Grid>
                <CustomLabel label="If Yes, Please Description" style={sectionLabelSx} />
                <Controller
                  name="familyDiseasesDescription"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter"
                      name="familyDiseasesDescription"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={mode === "view"}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Divider sx={{ borderColor: "#E3ECEF" }} />

            {/* Genetic counseling */}
            <Grid container direction="column" spacing={1}>
              <Grid>
                <CustomLabel label="Genetic counseling" style={sectionTitleSx} />
              </Grid>

              <Grid>
                <CustomLabel
                  label="Has there been any genetic counseling in the family?"
                  style={sectionLabelSx}
                />
                <Controller
                  name="geneticCounseling"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <RadioGroup
                      row
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      sx={radioGroupSx}
                      disabled={mode === "view"}
                    >
                      <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" disabled={mode === "view"} />
                      <FormControlLabel value="no" control={<Radio size="small" />} label="No" disabled={mode === "view"} />
                      <FormControlLabel
                        value="unknown"
                        control={<Radio size="small" />}
                        label="Unknown"
                        disabled={mode === "view"}
                      />
                    </RadioGroup>
                  )}
                />
              </Grid>

              <Grid>
                <CustomLabel label="If Yes, Please Description" style={sectionLabelSx} />
                <Controller
                  name="geneticCounselingDescription"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter"
                      name="geneticCounselingDescription"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={mode === "view"}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Parents Card (inside same parent card layout like figma bottom section) */}
            <Grid sx={{ mt: 1 }}>
              <Grid
                container
                sx={{
                  border: "1px solid #E3ECEF",
                  borderRadius: "8px",
                  p: 2,
                  bgcolor: "#fff",
                }}
              >
                <Grid container direction="column" spacing={2} sx={{ width: "100%" }}>
                  <Grid>
                    <CustomLabel label="Parents" style={sectionTitleSx} />
                  </Grid>

                  {/* Father */}
                  <Grid container direction="column" spacing={1}>
                    <Grid>
                      <CustomLabel label="Father, Deceased?" style={sectionLabelSx} />
                    </Grid>

                    {/* Yes block */}
                    <Grid>
                      <Controller
                        name="fatherDeceased"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <RadioGroup
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value)}
                            sx={{
                              "& .MuiFormControlLabel-label": {
                                fontSize: "13px",
                                color: "#334155",
                              },
                            }}
                          >
                            <Grid container direction="column" spacing={1}>
                              <Grid>
                                <FormControlLabel
                                  value="yes"
                                  control={<Radio size="small" />}
                                  label="Yes"
                                  disabled={mode === "view"}
                                />
                              </Grid>

                              {field.value === "yes" && (
                                <Grid container spacing={2} sx={{ pl: 3 }}>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Grid container direction="column" spacing={0.5}>
                                      <Grid>
                                        <CustomLabel label="Age at Death" style={sectionLabelSx} />
                                      </Grid>
                                      <Grid>
                                        <Controller
                                          name="fatherAgeAtDeath"
                                          control={control}
                                          defaultValue=""
                                          render={({ field: f }) => (
                                            <CustomInput
                                              placeholder="Enter"
                                              name="fatherAgeAtDeath"
                                              value={f.value || ""}
                                              onChange={(e) => f.onChange(e.target.value)}
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
                                        <CustomLabel label="Cause of Death" style={sectionLabelSx} />
                                      </Grid>
                                      <Grid>
                                        <Controller
                                          name="fatherCauseOfDeath"
                                          control={control}
                                          defaultValue=""
                                          render={({ field: f }) => (
                                            <CustomInput
                                              placeholder="Enter"
                                              name="fatherCauseOfDeath"
                                              value={f.value || ""}
                                              onChange={(e) => f.onChange(e.target.value)}
                                              bgWhite
                                              disableField={mode === "view"}
                                            />
                                          )}
                                        />
                                      </Grid>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              )}

                              {/* No block */}
                              <Grid>
                                <FormControlLabel
                                  value="no"
                                  control={<Radio size="small" />}
                                  label="No"
                                  disabled={mode === "view"}
                                />
                              </Grid>

                              {field.value === "no" && (
                                <Grid container spacing={2} sx={{ pl: 3 }}>
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Grid container direction="column" spacing={0.5}>
                                      <Grid>
                                        <CustomLabel label="Current Age" style={sectionLabelSx} />
                                      </Grid>
                                      <Grid>
                                        <Controller
                                          name="fatherCurrentAge"
                                          control={control}
                                          defaultValue=""
                                          render={({ field: f }) => (
                                            <CustomInput
                                              placeholder="Enter"
                                              name="fatherCurrentAge"
                                              value={f.value || ""}
                                              onChange={(e) => f.onChange(e.target.value)}
                                              bgWhite
                                              disableField={mode === "view"}
                                            />
                                          )}
                                        />
                                      </Grid>
                                    </Grid>
                                  </Grid>
                                </Grid>
                              )}
                            </Grid>
                          </RadioGroup>
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Family Medical Conditions (separate inner card like figma) */}
            <Grid>
              <Grid
                container
                sx={{
                  border: "1px solid #E3ECEF",
                  borderRadius: "8px",
                  p: 2,
                  bgcolor: "#fff",
                }}
              >
                <Grid container direction="column" spacing={1.5} sx={{ width: "100%" }}>
                  <Grid>
                    <CustomLabel label="Family Medical Conditions" style={sectionTitleSx} />
                  </Grid>

                  <Grid>
                    <CustomLabel label="Is there any family history of" style={sectionLabelSx} />
                  </Grid>

                  <Grid container spacing={1}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name="familyHistoryDiabetes"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!!field.value}
                            onChange={(checked) => field.onChange(checked)}
                            label="Diabetes"
                            disabled={mode === "view"}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name="familyHistoryHighBloodPressure"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!!field.value}
                            onChange={(checked) => field.onChange(checked)}
                            label="High Blood Pressure"
                            disabled={mode === "view"}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name="familyHistoryHighCholesterol"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!!field.value}
                            onChange={(checked) => field.onChange(checked)}
                            label="High Cholesterol"
                            disabled={mode === "view"}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name="familyHistoryHeartDisease"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!!field.value}
                            onChange={(checked) => field.onChange(checked)}
                            label="Heart Disease"
                            disabled={mode === "view"}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name="familyHistoryOsteoporosis"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!!field.value}
                            onChange={(checked) => field.onChange(checked)}
                            label="Osteoporosis"
                            disabled={mode === "view"}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Controller
                        name="familyHistoryColonPolyps"
                        control={control}
                        defaultValue={false}
                        render={({ field }) => (
                          <CustomCheckbox
                            checked={!!field.value}
                            onChange={(checked) => field.onChange(checked)}
                            label="Colon Polyps"
                            disabled={mode === "view"}
                          />
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Grid container spacing={1} sx={{ alignItems: "center" }}>
                        <Grid>
                          <Controller
                            name="familyHistoryCancer"
                            control={control}
                            defaultValue={false}
                            render={({ field }) => (
                              <CustomCheckbox
                                checked={!!field.value}
                                onChange={(checked) => field.onChange(checked)}
                                label="Cancer"
                                disabled={mode === "view"}
                              />
                            )}
                          />
                        </Grid>

                        {familyHistoryCancer && (
                          <Grid sx={{ flex: 1 }}>
                            <Controller
                              name="familyHistoryCancerType"
                              control={control}
                              defaultValue=""
                              render={({ field }) => (
                                <CustomInput
                                  placeholder="Specify type"
                                  name="familyHistoryCancerType"
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
      </Grid>
    </Grid>
  );
};

export default Step12_FamilyHistory;
