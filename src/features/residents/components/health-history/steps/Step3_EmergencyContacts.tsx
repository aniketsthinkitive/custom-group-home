import React from 'react';
import { Grid, Typography } from '@mui/material';
import { Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';

interface Step3Props {
  control: Control<any>;
  errors?: any;
  mode?: "new" | "draft" | "view";
}

const Step3_EmergencyContacts: React.FC<Step3Props> = ({ control, errors, mode = "new" }) => {
  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Emergency Contacts
        </Typography>
      </Grid>

      {/* Emergency Contact 1 Card */}
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
            <Grid>
              <CustomLabel label="Emergency Contact 1" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="emergencyContact1Name"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Name" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="emergencyContact1Name"
                            value={field.value}
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
                    name="emergencyContact1Number"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Phone Number" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="emergencyContact1Number"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            phone
                            bgWhite
                            disableField={mode === "view"}
                            hasError={!!errors?.emergencyContact1Number}
                            errorMessage={errors?.emergencyContact1Number?.message}
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

      {/* Emergency Contact 2 Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Grid container spacing={2} direction="column">
            <Grid>
              <CustomLabel label="Emergency Contact 2" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="emergencyContact2Name"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Name" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="emergencyContact2Name"
                            value={field.value}
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
                    name="emergencyContact2Number"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Phone Number" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="emergencyContact2Number"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            phone
                            bgWhite
                            disableField={mode === "view"}
                            hasError={!!errors?.emergencyContact2Number}
                            errorMessage={errors?.emergencyContact2Number?.message}
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
  );
};

export default Step3_EmergencyContacts;
