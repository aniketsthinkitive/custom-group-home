import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { Control, Controller } from 'react-hook-form';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../components/custom-text-area/custom-textarea';

interface Step4Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const Step4_RationalForPlan: React.FC<Step4Props> = ({ control, mode = "new" }) => {
  return (
    <Grid container spacing={3}>
      {/* Rationale for Plan Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container direction="column" spacing={1}>
            <Grid>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
                Rationale for Plan
              </Typography>
            </Grid>
            <Grid>
              <CustomLabel
                label="Explain why this plan is necessary"
                style={{ fontSize: '14px', color: '#757775' }}
              />
            </Grid>
            <Grid>
              <Controller
                name="rationaleForPlan"
                control={control}
                render={({ field }) => (
                  <CustomTextArea
                    name="rationaleForPlan"
                    placeholder="Enter"
                    value={field.value}
                    onChange={field.onChange}
                    minRow={6}
                    isDisabled={mode === "view"}
                  />
                )}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Biographical Information Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container direction="column" spacing={1}>
            <Grid>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
                Biographical Information
              </Typography>
            </Grid>
            <Grid>
              <Controller
                name="biographicalInformation"
                control={control}
                render={({ field }) => (
                  <CustomTextArea
                    name="biographicalInformation"
                    placeholder="Enter"
                    value={field.value}
                    onChange={field.onChange}
                    minRow={6}
                    isDisabled={mode === "view"}
                  />
                )}
              />
            </Grid>
            <Grid>
              <CustomLabel
                label="Client Input: If possible, directly ask client what their goals/dreams are for their time in the program and summarize here."
                style={{ fontSize: '12px', color: '#757775' }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Client Input Card */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container direction="column" spacing={1}>
            <Grid>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
                Client Input
              </Typography>
            </Grid>
            <Grid>
              <Controller
                name="clientInput"
                control={control}
                render={({ field }) => (
                  <CustomTextArea
                    name="clientInput"
                    placeholder="Enter"
                    value={field.value}
                    onChange={field.onChange}
                    minRow={6}
                    isDisabled={mode === "view"}
                  />
                )}
              />
            </Grid>
            <Grid>
              <CustomLabel
                label="Summarize client goals/dreams if possible"
                style={{ fontSize: '12px', color: '#757775' }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Step4_RationalForPlan;

