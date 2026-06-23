import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomSelect from '../../../../../components/custom-select/custom-select';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import DatePickerField from '../../../../../components/date-picker-field/date-picker-field';

interface Step1Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const Step1_DemographicInfo: React.FC<Step1Props> = ({ control, mode }) => {
  const serviceOptions = [
    { value: 'residential', label: 'Residential' },
    { value: 'day_program', label: 'Day Program' },
    { value: 'supported_living', label: 'Supported Living' },
  ];

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37', mb: 2 }}>
          Demographic Information
        </Typography>
      </Grid>

      {/* Demographic Information Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="admissionDate"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Admission Date" />
                    </Grid>
                    <Grid>
                      <DatePickerField
                        name="admissionDate"
                        value={field.value}
                        onChange={field.onChange}
                        useCustomStyle={false}
                        disabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="currentServices"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Current Services" />
                    </Grid>
                    <Grid>
                      <CustomSelect
                        placeholder="Select"
                        name="currentServices"
                        value={field.value}
                        items={serviceOptions}
                        onChange={field.onChange}
                        bgWhite
                        isDisabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="serviceCoordinator"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Service Coordinator" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="serviceCoordinator"
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
                name="guardianship"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Guardianship" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="guardianship"
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
          </Grid>
        </Paper>
      </Grid>

      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37', mb: 2 }}>
          Medical Information
        </Typography>
      </Grid>

      {/* Medical Information Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name="primaryDiagnosis"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Primary Diagnosis" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="primaryDiagnosis"
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
                name="otherDiagnoses"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Other Diagnoses" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="otherDiagnoses"
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
                name="allergies"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Allergies" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name="allergies"
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
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Step1_DemographicInfo;

