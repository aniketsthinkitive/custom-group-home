import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { type FieldValues, Control } from 'react-hook-form';

interface Step4Props {
  control: Control<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Step4Responsibilities: React.FC<Step4Props> = ({ control, mode }) => {
  const isViewMode = mode === "view";
  
  const residentResponsibilities = [
    "I. Maintain cleanliness of your sleeping or living unit and shared living spaces.",
    "II. Review and sign a complete inventory of personal property (valued at $25 or more, as well as any item of sentimental value to you) on the day of move-in, quarterly to ensure accuracy, and on the day of departure of the residence.",
  ];
  
  const providerResponsibilities = [
    "I. Maintain a safe residential environment.",
    "II. Always treat the resident with dignity and respect.",
    "III. Implement the resident's approved Individual Service Agreement and approved behavior support plan.",
    "IV. Provide services in accordance with all applicable State regulations, and the contract with the provider agency.",
    "V. Assist, as necessary, the resident to develop and maintain an inventory of personal property (valued at $25 or more, as well as any item of sentimental value to the resident) and ensure that upon termination of this agreement, the resident receives all personal property on the most recent inventory.",
  ];
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Responsibilities
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
          {/* Resident Responsibilities Card */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Box
              sx={{
                backgroundColor: '#F5F7FA',
                border: '1px solid #E3ECEF',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1F2A37',
                  mb: 2,
                }}
              >
                Your Responsibilities as a Resident:
              </Typography>
              <Box component="ul" sx={{ margin: 0, paddingLeft: '20px' }}>
                {residentResponsibilities.map((responsibility, index) => (
                  <Box
                    component="li"
                    key={index}
                    sx={{
                      fontSize: '14px',
                      color: '#424342',
                      lineHeight: '1.8',
                      mb: 1,
                    }}
                  >
                    {responsibility}
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Resident Responsibilities Acknowledgement */}
          {/* <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Controller
              name="residentResponsibilitiesAcknowledged"
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
                      I acknowledge and understand my responsibilities as a resident
                    </Typography>
                  }
                />
              )}
            />
          </Grid> */}

          {/* Provider Responsibilities Card */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Box
              sx={{
                backgroundColor: '#F5F7FA',
                border: '1px solid #E3ECEF',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1F2A37',
                  mb: 2,
                }}
              >
                Your Responsibilities as a Provider:
              </Typography>
              <Box component="ul" sx={{ margin: 0, paddingLeft: '20px' }}>
                {providerResponsibilities.map((responsibility, index) => (
                  <Box
                    component="li"
                    key={index}
                    sx={{
                      fontSize: '14px',
                      color: '#424342',
                      lineHeight: '1.8',
                      mb: 1,
                    }}
                  >
                    {responsibility}
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Provider Responsibilities Acknowledgement */}
          {/* <Grid size={{ xs: 12 }}>
            <Controller
              name="providerResponsibilitiesAcknowledged"
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
                      I acknowledge and understand my responsibilities as a provider
                    </Typography>
                  }
                />
              )}
            />
          </Grid> */}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step4Responsibilities;

