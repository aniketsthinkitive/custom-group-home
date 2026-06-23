import React from 'react';
import { Grid, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { type FieldValues, Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../../components/custom-text-area/custom-textarea';

interface Step3Props {
  control: Control<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Step3Guardianship: React.FC<Step3Props> = ({ control, mode }) => {
  const isViewMode = mode === "view";
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          3. Guardianship
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
          {/* Checkboxes */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="isMinor"
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
                          Is Minor
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="noGuardian"
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
                          No Guardian
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="isGuardianNeeded"
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
                          Is a Guardian needed?
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="guardianInProcess"
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
                          Guardian In Process
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="inProcessOfApplyingFor"
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
                          In Process of Applying For
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="hasGuardian"
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
                          Has Guardian
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="coGuardian"
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
                          Co-Guardian
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="thirdGuardian"
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
                          3rd Guardian
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Type of Guardianship Fields */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="typeOfGuardianship"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Type of Guardianship" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter type of guardianship"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="coGuardianTypeOfGuardianship"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Co-Guardian Type of Guardianship" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter co-guardian type"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="thirdGuardianTypeOfGuardianship"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="3rd Guardian Type of Guardianship" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter 3rd guardian type"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Comments */}
          <Grid size={{ xs: 12 }}>
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <Grid container direction="column" spacing={0.5}>
                  <Grid size={{ xs: 12 }}>
                    <CustomLabel label="Comments" />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <CustomTextArea
                      placeholder="Enter comments"
                      name="comments"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      isDisabled={isViewMode}
                      minRow={4}
                    />
                  </Grid>
                </Grid>
              )}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step3Guardianship;

