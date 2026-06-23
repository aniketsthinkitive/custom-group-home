import React from 'react';
import { Grid, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { type FieldValues, Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../../components/custom-label/custom-label';

interface Step2Props {
  control: Control<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Step2Diagnoses: React.FC<Step2Props> = ({ control, mode }) => {
  const isViewMode = mode === "view";
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          2. Diagnoses
        </Typography>
      </Grid>

      {/* Section Content */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 3,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* Allergies */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Controller
              name="allergies"
              control={control}
              render={({ field }) => (
                <Grid container direction="column" spacing={0.5}>
                  <Grid size={{ xs: 12 }}>
                    <CustomLabel label="Allergies" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomInput
                      {...field}
                      placeholder="Enter allergies"
                      disableField={isViewMode}
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              )}
            />
          </Grid>

          {/* Health Care Level and Medically Fragile */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="healthCareLevel"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Health Care Level" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter health care level"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="medicallyFragile"
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
                      label={
                        <Typography sx={{ fontSize: '14px', color: '#1F2A37' }}>
                          Medically Fragile
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Diagnosis Fields */}
          <Grid size={{ xs: 12 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 2 }}>
              Diagnosis
            </Typography>
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <Grid size={{ xs: 12 }} key={num}>
                  <Controller
                    name={`diagnosis${num}`}
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid size={{ xs: 12 }}>
                          <CustomLabel label={`Diagnosis ${num}`} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <CustomInput
                            {...field}
                            placeholder={`Enter diagnosis ${num}`}
                            disableField={isViewMode}
                            multiline
                            rows={2}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step2Diagnoses;

