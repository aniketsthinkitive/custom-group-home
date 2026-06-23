import React from 'react';
import { Grid, Typography, Box, Checkbox, FormControlLabel } from '@mui/material';
import { type FieldValues, Control, Controller } from 'react-hook-form';
import CustomLabel from '../../../../../../components/custom-label/custom-label';

interface Step3Props {
  control: Control<FieldValues>;
  errors?: Record<string, unknown>;
  mode?: "new" | "draft" | "view";
}

const Step3RightsAcknowledgement: React.FC<Step3Props> = ({ control, errors, mode }) => {
  const isViewMode = mode === "view";
  
  const rightsText = [
    "I. To enter into this enforceable residency agreement.",
    "II. Privacy in your sleeping or living unit.",
    "III. Lockable doors to your sleeping or living unit with only appropriate staff having keys to doors.",
    "IV. Ability to have visitors of your choosing at any time.",
    "V. Choice of furnishings and decorations in your sleeping or living unit.",
    "VI. Choice of a roommate, if bedrooms are shared.",
    "VII. Access to food at any time.",
    "VIII. Modifications to the above-noted rights in accordance with He-M 310.09(h) and (i).",
    "IX. An inventory of personal property (valued at $25 or more, as well as any item of sentimental value to you) will occur on the day of move-in and will be updated quarterly to ensure accuracy.",
    "X. A setting that is physically accessible.",
    "XI. All rights under He-M 310, including those noted above.",
  ];
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Your Rights as a Resident
        </Typography>
      </Grid>

      {/* Section Content */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container 
        >
          {/* Rights Card */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                backgroundColor: '#F5F7FA',
                border: '1px solid #E3ECEF',
                borderRadius: '8px',
                padding: '16px',
                mb: 3,
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
                Your Rights as a Resident:
              </Typography>
              <Box component="ul" sx={{ margin: 0, paddingLeft: '20px' }}>
                {rightsText.map((right, index) => (
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
                    {right}
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step3RightsAcknowledgement;

