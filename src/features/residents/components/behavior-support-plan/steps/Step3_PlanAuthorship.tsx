import React from 'react';
import { Grid, Paper } from '@mui/material';
import { Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import DatePickerField from '../../../../../components/date-picker-field/date-picker-field';

interface Step3Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const Step3_PlanAuthorship: React.FC<Step3Props> = ({ control, mode = "new" }) => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container spacing={2}>
            {/* Left Column - Author Names */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={2} direction="column">
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="initialPlanAuthor"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Initial Plan Author" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="initialPlanAuthor"
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
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="lastRenewalAuthor"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Last Renewal Author" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="lastRenewalAuthor"
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
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="currentPlanAuthor"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" >
                        <Grid>
                          <CustomLabel label="Current Plan Author" />
                        </Grid>
                        <Grid>  
                          <CustomInput
                            placeholder="Enter"
                            name="currentPlanAuthor"
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
            </Grid>

            {/* Right Column - Dates */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={2} direction="column">
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="dateOfInitialPlan"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Date of Initial Plan" />
                        </Grid>
                        <Grid>
                          <DatePickerField
                            name="dateOfInitialPlan"
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
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="dateOfLastRenewal"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Date of Last Renewal" />
                        </Grid>
                        <Grid>
                          <DatePickerField
                            name="dateOfLastRenewal"
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
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="dateOfCurrentPlan"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Date of Current Plan" />
                        </Grid>
                        <Grid>
                          <DatePickerField
                            name="dateOfCurrentPlan"
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
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Step3_PlanAuthorship;

