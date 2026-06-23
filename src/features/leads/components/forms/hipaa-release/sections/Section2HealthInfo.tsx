import React from 'react';
import { Grid, Typography, FormControlLabel, Checkbox, Box } from '@mui/material';
import { type Control, Controller, type UseFormSetValue, type FieldValues, useWatch } from 'react-hook-form';
import CustomTextArea from '../../../../../../components/custom-text-area/custom-textarea';

interface Section2Props {
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const SUB_CHECKBOXES = [
  'exceptMentalHealth',
  'exceptCommunicableDiseases',
  'exceptAlcoholDrugAbuse',
  'exceptGeneticInfo',
  'exceptOther',
] as const;

const Section2HealthInfo: React.FC<Section2Props> = ({ control, setValue, mode }) => {
  const isViewMode = mode === "view";
  const exceptOtherChecked = useWatch({ control, name: 'exceptOther' });

  const clearSubCheckboxes = () => {
    SUB_CHECKBOXES.forEach((name) => setValue(name, false));
    setValue('exceptOtherDescription', '');
  };
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Section II - Health Information
        </Typography>
      </Grid>

      {/* Instructions Card */}
      <Grid size={{ xs: 12 }}>
        <Box
          sx={{
            backgroundColor: '#F5F7FA',
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            padding: '16px',
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: '14px', color: '#424342', fontWeight: 500, mb: 1 }}>
            Instructions
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>
            I would like to give the above healthcare organization permission to: Tick as appropriate.
          </Typography>
        </Box>
      </Grid>

      {/* Health Information Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Grid container spacing={2} direction="column">
            {/* Option 1: Complete Health Record */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="discloseCompleteRecord"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value || false}
                        onChange={(e) => {
                          field.onChange(e.target.checked);
                          // If this is checked, uncheck the "except" option and all sub-checkboxes
                          if (e.target.checked) {
                            setValue('discloseCompleteRecordExcept', false);
                            clearSubCheckboxes();
                          }
                        }}
                        disabled={isViewMode}
                        sx={{
                          color: '#0A2E45',
                          '&.Mui-checked': {
                            color: '#0A2E45',
                          },
                        }}
                      />
                    }
                    label="Disclose my complete health record including, but not limited to, diagnoses, lab test results, treatment, and billing records for all conditions."
                    sx={{ alignItems: 'flex-start' }}
                  />
                )}
              />
            </Grid>

            {/* Or Separator */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', my: 1 }}>
                Or
              </Typography>
            </Grid>

            {/* Option 2: Complete Health Record Except */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="discloseCompleteRecordExcept"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value || false}
                        onChange={(e) => {
                          field.onChange(e.target.checked);
                          if (e.target.checked) {
                            // If this is checked, uncheck the "complete" option
                            setValue('discloseCompleteRecord', false);
                          } else {
                            // If unchecked, also uncheck all sub-checkboxes
                            clearSubCheckboxes();
                          }
                        }}
                        disabled={isViewMode}
                        sx={{
                          color: '#0A2E45',
                          '&.Mui-checked': {
                            color: '#0A2E45',
                          },
                        }}
                      />
                    }
                    label="Disclose my complete health record except for the following information."
                    sx={{ alignItems: 'flex-start' }}
                  />
                )}
              />
            </Grid>

            {/* Sub-options for "Except" */}
            <Grid size={{ xs: 12 }} sx={{ pl: 4 }}>
              <Grid container spacing={1.5} direction="column">
                {/* Mental Health Records */}
                <Grid>
                  <Controller
                    name="exceptMentalHealth"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isViewMode}
                            sx={{
                              color: '#0A2E45',
                              '&.Mui-checked': {
                                color: '#0A2E45',
                              },
                            }}
                          />
                        }
                        label="Mental health records"
                      />
                    )}
                  />
                </Grid>

                {/* Communicable Diseases */}
                <Grid>
                  <Controller
                    name="exceptCommunicableDiseases"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isViewMode}
                            sx={{
                              color: '#0A2E45',
                              '&.Mui-checked': {
                                color: '#0A2E45',
                              },
                            }}
                          />
                        }
                        label="Communicable diseases including, but not limited to, HIV and AIDS"
                      />
                    )}
                  />
                </Grid>

                {/* Alcohol/Drug Abuse */}
                <Grid>
                  <Controller
                    name="exceptAlcoholDrugAbuse"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isViewMode}
                            sx={{
                              color: '#0A2E45',
                              '&.Mui-checked': {
                                color: '#0A2E45',
                              },
                            }}
                          />
                        }
                        label="Alcohol/drug abuse treatment records"
                      />
                    )}
                  />
                </Grid>

                {/* Genetic Information */}
                <Grid>
                  <Controller
                    name="exceptGeneticInfo"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isViewMode}
                            sx={{
                              color: '#0A2E45',
                              '&.Mui-checked': {
                                color: '#0A2E45',
                              },
                            }}
                          />
                        }
                        label="Genetic information"
                      />
                    )}
                  />
                </Grid>

                {/* Other (Specify) */}
                <Grid>
                  <Controller
                    name="exceptOther"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value || false}
                            onChange={(e) => {
                              field.onChange(e.target.checked);
                              if (!e.target.checked) {
                                setValue('exceptOtherDescription', '');
                              }
                            }}
                            disabled={isViewMode}
                            sx={{
                              color: '#0A2E45',
                              '&.Mui-checked': {
                                color: '#0A2E45',
                              },
                            }}
                          />
                        }
                        label="Other (Specify)"
                        sx={{ alignItems: 'flex-start' }}
                      />
                    )}
                  />
                </Grid>

                {/* Other Description Text Area — only visible when "Other" is checked */}
                {exceptOtherChecked && (
                  <Grid size={{ xs: 12 }} sx={{ pl: 4, mt: 1 }}>
                    <Controller
                      name="exceptOtherDescription"
                      control={control}
                      render={({ field }) => (
                        <CustomTextArea
                          placeholder=""
                          name="exceptOtherDescription"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          minRow={4}
                          isDisabled={isViewMode}
                        />
                      )}
                    />
                  </Grid>
                )}
              </Grid>
            </Grid>

            {/* Form of Disclosure Section */}
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 1.5 }}>
                Form of Disclosure:
              </Typography>
              <Grid container spacing={1.5} direction="column">
                {/* Electronic Copy */}
                <Grid>
                  <Controller
                    name="formOfDisclosureElectronic"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isViewMode}
                            sx={{
                              color: '#0A2E45',
                              '&.Mui-checked': {
                                color: '#0A2E45',
                              },
                            }}
                          />
                        }
                        label="Electronic copy or access via a web-based portal"
                      />
                    )}
                  />
                </Grid>

                {/* Hard Copy */}
                <Grid>
                  <Controller
                    name="formOfDisclosureHardCopy"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={isViewMode}
                            sx={{
                              color: '#0A2E45',
                              '&.Mui-checked': {
                                color: '#0A2E45',
                              },
                            }}
                          />
                        }
                        label="Hard copy"
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
  );
};

export default Section2HealthInfo;

