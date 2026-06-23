import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { type Control, Controller, type FieldValues } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';

interface Section1Props {
  control: Control<FieldValues>;
  leadName?: string;
  mode?: "new" | "draft" | "view";
}

const Section1BasicInfo: React.FC<Section1Props> = ({ control, mode }) => {
  const isViewMode = mode === "view";
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 0.5 }}>
          Section I
        </Typography>
      </Grid>

      {/* Section I Content */}
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
                
              }}
            >
              I,{' '}
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 'fit-content',
                  ml: 0,
                  mr: 0,
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    borderBottom: '1px solid #1F2A37',
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
                      borderBottom: '2px solid #0A2E45',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'transparent',
                      borderBottom: '1px solid #1F2A37',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    padding: '0',
                    fontSize: '14px',
                    color: '#1F2A37',
                  },
                }}
              >
                <Controller
                  name="patientName"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter"
                      name="patientName"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={isViewMode}
                    />
                  )}
                />
              </Box>
              , give my permission for{' '}
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minWidth: '300px',
                  ml: 0,
                  mr: 0,
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    borderBottom: '1px solid #1F2A37',
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
                      borderBottom: '2px solid #0A2E45',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'transparent',
                      borderBottom: '1px solid #1F2A37',
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
                  name="organizationName"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter"
                      name="organizationName"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={isViewMode}
                    />
                  )}
                />
              </Box>
              {' '}to share the information listed in Section II of this document with the person(s) or organization(s) I have specified in Section IV of this document.
            </Typography>

          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Section1BasicInfo;

