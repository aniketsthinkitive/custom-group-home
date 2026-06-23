import React from "react";
import { Grid, Box, Radio, Typography } from "@mui/material";
import { Control, Controller, useWatch } from "react-hook-form";
import CustomInput from "../../../../../components/custom-input/custom-input";
import CustomLabel from "../../../../../components/custom-label/custom-label";
import CustomRadio from "../../../../../components/custom-radio/custom-radio";

interface Step5Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const pageTitleSx = { fontSize: "16px", fontWeight: 600, color: "#1F2A37" };

const cardSx = {
  border: "1px solid #E3ECEF",
  borderRadius: "8px",
  px: 2,
  py: 1.5,
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

const greenRadioSx = {
  "& .MuiRadio-root": {
    color: "#16A34A",
    "&.Mui-checked": {
      color: "#16A34A",
    },
    "&.Mui-disabled": {
      color: "#9CA3AF",
    },
  },
};

type Option = { value: string; label: string };

const InlineRadioGroup = ({
  name,
  control,
  label,
  options,
  mode,
  disabled,
}: {
  name: string;
  control: Control<any>;
  label: string;
  options: Option[];
  mode?: "new" | "draft" | "view";
  disabled?: boolean;
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
            <Grid
              container
              direction="row"
              sx={{ ...radioGroupSx, ...greenRadioSx, flexWrap: "wrap" }}
            >
              {options.map((opt) => (
                <CustomRadio
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  checked={(field.value || "") === opt.value}
                  onChange={(checked, value) => {
                    if (checked && value) {
                      field.onChange(value);
                    }
                  }}
                  disabled={mode === "view"}
                />
              ))}
            </Grid>
          )}
        />
      </Grid>
    </Grid>
  );
};

const Step5_FunctionalAbilities: React.FC<Step5Props> = ({
  control,
  mode = "new",
}) => {
  const oralHygiene = useWatch({ control, name: "oralHygiene" });
  const supportiveDevices = useWatch({ control, name: "supportiveDevices" });
  const adaptiveEquipment = useWatch({ control, name: "adaptiveEquipment" });

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Functional Abilities
        </Typography>
      </Grid>

      {/* Communication */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="communication"
            control={control}
            label="Communication"
            mode={mode}
            options={[
              { value: "able", label: "Able to communicate" },
              { value: "verbalizations", label: "Uses verbalizations" },
              { value: "gestures", label: "Uses gestures" },
              { value: "not_able", label: "Not able to communicate needs" },
              { value: "call_bell_unable", label: "Unable to use call bell" },
              {
                value: "needs_assistance",
                label: "Needs assistance to communicate",
              },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Medication Administration */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="medicationAdministration"
            control={control}
            label="Medication Administration"
            mode={mode}
            options={[
              { value: "independent", label: "Independent / Self medicated" },
              { value: "staff", label: "Medication administered by staff" },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Dining / Eating */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="diningEating"
            control={control}
            label="Dining / Eating"
            mode={mode}
            options={[
              { value: "independent", label: "Independent" },
              { value: "needs_assistance", label: "Needs assistance" },
              {
                value: "supervised",
                label: "Must be supervised / choking risk",
              },
              { value: "tube", label: "Fed through tube" },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Ambulation */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="ambulation"
            control={control}
            label="Ambulation"
            mode={mode}
            options={[
              { value: "independent", label: "Independent" },
              { value: "steady", label: "Steady" },
              { value: "unsteady", label: "Unsteady" },
              { value: "walker", label: "Walker" },
              { value: "cane", label: "Cane" },
              { value: "wheelchair", label: "Wheelchair" },
              { value: "non_ambulatory", label: "Non-ambulatory" },
              {
                value: "assist_1_2",
                label: "Needs assistance (1 person / 2 person)",
              },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Vision */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="vision"
            control={control}
            label="Vision"
            mode={mode}
            options={[
              { value: "normal", label: "Normal" },
              { value: "low", label: "Low vision" },
              { value: "blind", label: "Blind" },
              { value: "glasses", label: "Wears glasses" },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Hearing */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="hearing"
            control={control}
            label="Hearing"
            mode={mode}
            options={[
              { value: "normal", label: "Normal" },
              { value: "hard", label: "Hard of hearing" },
              { value: "deaf", label: "Deaf" },
              { value: "aid", label: "Hearing aid" },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Oral Hygiene (with inline input like figma) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={0.5} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Oral Hygiene" style={sectionLabelSx} />
            </Grid>

            <Grid>
              <Controller
                name="oralHygiene"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Grid
                    container
                    direction="row"
                    sx={{
                      ...radioGroupSx,
                      ...greenRadioSx,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <CustomRadio
                      checked={(field.value || "") === "independent"}
                      value="independent"
                      label="Independent"
                      onChange={(checked, value) => {
                        if (checked && value) field.onChange(value);
                      }}
                      disabled={mode === "view"}
                    />

                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                      <CustomRadio
                        checked={(field.value || "") === "special_needs"}
                        value="special_needs"
                        label="Special needs"
                        onChange={(checked, value) => {
                          if (checked && value) field.onChange(value);
                        }}
                        disabled={mode === "view"}
                      />

                      {oralHygiene === "special_needs" && (
                        <Box sx={{ width: { xs: "100%", sm: 220 }, mt: { xs: 1, sm: 0 } }}>
                          <Controller
                            name="oralHygieneSpecial"
                            control={control}
                            defaultValue=""
                            render={({ field: f }) => (
                              <CustomInput
                                placeholder="Enter"
                                name="oralHygieneSpecial"
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
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Diet Texture (with Diet Type inline row like figma) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={1} sx={{ width: "100%" }}>
            <Grid>
              <InlineRadioGroup
                name="dietTexture"
                control={control}
                label="Diet Texture"
                mode={mode}
                options={[
                  { value: "regular", label: "Regular" },
                  { value: "chopped", label: "Chopped" },
                  { value: "ground", label: "Ground" },
                  { value: "puree", label: "Puree" },
                  { value: "thickened", label: "Thickened liquids" },
                ]}
                disabled = {mode === "view"}
              />
            </Grid>

            {/* Diet Type row (circle + label + input) */}
            <Grid>
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
    <Radio
      size="small"
      disabled
      sx={{
        p: 0,
        m: 0,
        mr: 0.5,
        display: "flex",
        alignItems: "center",
      }}
    />

    <CustomLabel
      label="Diet Type"
      style={{
        ...sectionLabelSx,
        margin: 0,
        lineHeight: "16px",
        display: "flex",
        alignItems: "center",
      }}
    />

    <Box sx={{ width: { xs: "100%", sm: 260 } }}>
      <Controller
        name="dietType"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <CustomInput
            placeholder="Enter"
            name="dietType"
            value={field.value || ""}
            onChange={(e) => field.onChange(e.target.value)}
            bgWhite
            disableField={mode === "view"}
          />
        )}
      />
    </Box>
  </Box>
</Grid>

          </Grid>
        </Grid>
      </Grid>

      {/* Toileting Ability */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="toiletingAbility"
            control={control}
            label="Toileting Ability"
            mode={mode}
            options={[
              { value: "continent", label: "Continent" },
              { value: "needs_assistance", label: "Needs assistance" },
              { value: "incontinent", label: "Incontinent" },
              { value: "catheterized", label: "Catheterized" },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Supportive Devices (with Other inline input like figma) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={0.5} sx={{ width: "100%" }}>
            <Grid>
              <CustomLabel label="Supportive Devices" style={sectionLabelSx} />
            </Grid>

            <Grid>
              <Controller
                name="supportiveDevices"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Grid
                    container
                    direction="row"
                    sx={{
                      ...radioGroupSx,
                      ...greenRadioSx,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <CustomRadio
                      checked={(field.value || "") === "padded_side_rails"}
                      value="padded_side_rails"
                      label="Padded side rails"
                      onChange={(checked, value) => {
                        if (checked && value) field.onChange(value);
                      }}
                      disabled={mode === "view"}
                    />
                    <CustomRadio
                      checked={(field.value || "") === "splints"}
                      value="splints"
                      label="Splints"
                      onChange={(checked, value) => {
                        if (checked && value) field.onChange(value);
                      }}
                      disabled={mode === "view"}
                    />
                    <CustomRadio
                      checked={(field.value || "") === "braces"}
                      value="braces"
                      label="Braces"
                      onChange={(checked, value) => {
                        if (checked && value) field.onChange(value);
                      }}
                      disabled={mode === "view"}
                    />
                    <CustomRadio
                      checked={(field.value || "") === "helmet"}
                      value="helmet"
                      label="Helmet"
                      onChange={(checked, value) => {
                        if (checked && value) field.onChange(value);
                      }}
                      disabled={mode === "view"}
                    />

                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                      <CustomRadio
                        checked={(field.value || "") === "other"}
                        value="other"
                        label="Other"
                        onChange={(checked, value) => {
                          if (checked && value) field.onChange(value);
                        }}
                        disabled={mode === "view"}
                      />

                      {supportiveDevices === "other" && (
                        <Box sx={{ width: { xs: "100%", sm: 260 }, mt: { xs: 1, sm: 0 } }}>
                          <Controller
                            name="supportiveDevicesOther"
                            control={control}
                            defaultValue=""
                            render={({ field: f }) => (
                              <CustomInput
                                placeholder="Enter"
                                name="supportiveDevicesOther"
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
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Head of Bed Elevated */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <InlineRadioGroup
            name="headOfBedElevated"
            control={control}
            label="Head of Bed Elevated"
            mode={mode}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            disabled={mode === "view"}
          />
        </Grid>
      </Grid>

      {/* Adaptive Equipment (with conditional description) */}
      <Grid size={{ xs: 12 }}>
        <Grid container sx={cardSx}>
          <Grid container direction="column" spacing={1} sx={{ width: "100%" }}>
            <Grid>
              <InlineRadioGroup
                name="adaptiveEquipment"
                control={control}
                label="Adaptive Equipment"
                mode={mode}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                disabled={mode === "view"}
              />
            </Grid>

            {adaptiveEquipment === "yes" && (
              <Grid>
                <Grid container direction="column" spacing={0.5}>
                  <Grid>
                    <CustomLabel label="If Yes, Please Description" style={sectionLabelSx} />
                  </Grid>
                  <Grid>
                    <Controller
                      name="adaptiveEquipmentDescription"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <CustomInput
                          placeholder="Enter"
                          name="adaptiveEquipmentDescription"
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
  );
};

export default Step5_FunctionalAbilities;
