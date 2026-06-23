import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { type Control, Controller, type FieldValues } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import CustomTextArea from '../../../../../../components/custom-text-area/custom-textarea';

interface Section3Props {
  control: Control<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Section3Reason: React.FC<Section3Props> = ({ control, mode }) => {
  const isViewMode = mode === "view";
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Section III – Reason for Disclosure
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
            Please detail the reasons why information is being shared. If you are initiating the request for sharing information and do not wish to list the reasons for sharing, write 'at my request'.
          </Typography>
        </Box>
      </Grid>

      {/* Reason Card */}
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
          <Box sx={{ width: '100%' }}>
            <Typography
              component="div"
              sx={{
                fontSize: '14px',
                color: '#1F2A37',
                lineHeight: '2',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  minWidth: '300px',
                  verticalAlign: 'bottom',
                  mx: 0.5,
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    borderBottom: '1px dashed #1F2A37',
                    borderRadius: 0,
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    fontSize: '14px',
                    color: '#1F2A37',
                    padding: 0,
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover fieldset': {
                      border: 'none',
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none',
                      borderBottom: '2px dashed #0A2E45',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'transparent',
                      borderBottom: '1px dashed #1F2A37',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '0 4px',
                    fontSize: '14px',
                    color: '#1F2A37',
                  },
                }}
              >
                <Controller
                  name="reasonForDisclosure1"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter"
                      name="reasonForDisclosure1"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={isViewMode}
                    />
                  )}
                />
              </Box>
              {' '}For{' '}treatment and ongoing care
            </Typography>

            {/* CustomTextArea for description */}
            <Box sx={{ mt: 2 }}>
              <Controller
                name="reasonForDisclosureDescription"
                control={control}
                render={({ field }) => (
                  <CustomTextArea
                    placeholder="Enter"
                    name="reasonForDisclosureDescription"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    minRow={4}
                    isDisabled={isViewMode}
                  />
                )}
              />
            </Box>

          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Section3Reason;

