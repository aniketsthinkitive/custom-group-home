import React from 'react';
import { Grid, Typography, Box, type SxProps, type Theme } from '@mui/material';
import { type FieldValues, Control, Controller, type FieldErrors, useWatch } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import DatePickerField from '../../../../../../components/date-picker-field/date-picker-field';
import dayjs from 'dayjs';

interface Step1Props {
  control: Control<FieldValues>;
  leadName?: string;
  mode?: "new" | "draft" | "view";
  errors?: FieldErrors<FieldValues>;
}

/* Shared inline-input wrapper — dashed underline, no border box */
const inlineInputSx = (minWidth: string): SxProps<Theme> => ({
  display: 'inline-block',
  minWidth,
  verticalAlign: 'middle',
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
    '& fieldset': { border: 'none' },
    '&:hover fieldset': { border: 'none' },
    '&.Mui-focused fieldset': { border: 'none', borderBottom: '2px dashed #0A2E45' },
    '&.Mui-disabled': { backgroundColor: 'transparent', borderBottom: '1px dashed #1F2A37' },
  },
  '& .MuiOutlinedInput-input': { padding: '0 4px', fontSize: '14px', color: '#1F2A37' },
});

const dateSx: SxProps<Theme> = { display: 'inline-block', minWidth: '120px', verticalAlign: 'middle', mx: 0.5 };

const sectionSx: SxProps<Theme> = { fontSize: '14px', color: '#1F2A37', lineHeight: '2', mb: 3 };

const Step1BasicInformation: React.FC<Step1Props> = ({ control, leadName, mode, errors = {} }) => {
  const isViewMode = mode === "view";

  const residencyTermFromValue = useWatch({ control, name: 'residencyTermFrom' });
  const residencyTermFromMin = residencyTermFromValue ? dayjs(residencyTermFromValue) : undefined;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Section 1: Residency Terms
        </Typography>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 3, boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)' }}
        >
          <Box sx={{ width: '100%' }}>
            {/* I. Resident & Provider */}
            <Typography component="div" sx={sectionSx}>
              <strong>I.</strong> The residency agreement is between{' '}
              <Box component="span" sx={inlineInputSx('300px')}>
                <Controller
                  name="residentName"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder=""
                      name="residentName"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={isViewMode}
                    />
                  )}
                />
              </Box>
              {' '}and the provider,{' '}
              <Box component="span" sx={inlineInputSx('300px')}>
                <Controller
                  name="providerName"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder=""
                      name="providerName"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={isViewMode}
                    />
                  )}
                />
              </Box>
            </Typography>

            {/* II. Address */}
            <Typography component="div" sx={sectionSx}>
              <strong>II.</strong> The residential address is{' '}
              <Box component="span" sx={inlineInputSx('400px')}>
                <Controller
                  name="residentialAddress"
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      placeholder="Enter Street Address, City, State, Zip Code"
                      name="residentialAddress"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      bgWhite
                      disableField={isViewMode}
                    />
                  )}
                />
              </Box>
              {/* .{' '} */}
              {/* <Box component="span" sx={{ fontSize: '10px', color: '#6B7280', ml: 0.5 }}>
                Street Address &nbsp;&nbsp; City &nbsp;&nbsp; ST &nbsp;&nbsp; Zip
              </Box> */}
            </Typography>

            {/* III. Term dates */}
            <Typography component="div" sx={sectionSx}>
              <strong>III.</strong> The residency agreement is renewed on an annual basis, at the time of the Annual Service Agreement. The duration of this term is from{' '}
              <Box component="span" sx={dateSx}>
                <Controller
                  name="residencyTermFrom"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.toDate() : null)}
                      disabled={isViewMode}
                      hasError={!!errors?.residencyTermFrom}
                      errorMessage={errors?.residencyTermFrom?.message as string | undefined}
                    />
                  )}
                />
              </Box>
              {' '}to{' '}
              <Box component="span" sx={dateSx}>
                <Controller
                  name="residencyTermTo"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date ? date.toDate() : null)}
                      disabled={isViewMode}
                      minDate={residencyTermFromMin}
                      hasError={!!errors?.residencyTermTo}
                      errorMessage={errors?.residencyTermTo?.message as string | undefined}
                    />
                  )}
                />
              </Box>
              .
            </Typography>

            {/* IV */}
            <Typography sx={sectionSx}>
              <strong>IV.</strong> The resident or provider may request a team meeting at any time to discuss the terms of this agreement.
            </Typography>

            {/* V */}
            <Typography sx={{ ...sectionSx, mb: 2 }}>
              <strong>V.</strong> Upon termination of this residency agreement, the resident shall be entitled to all personal property as reflected on the most current inventory of the resident's property.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step1BasicInformation;
