import React from 'react';
import { Grid, Box, Typography } from '@mui/material';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomSelect from '../../../components/custom-select/custom-select';
import CustomLabel from '../../../components/custom-label/custom-label';
import { FormData } from './NewLeadForm';

interface InsuranceFormProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
}

const InsuranceForm: React.FC<InsuranceFormProps> = ({ control, errors }) => {
  return (
    <Box>
      <Typography
        variant="body1"
        sx={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#212121',
          mb: 2,
          textAlign: 'left',
        }}
      >
        Insurance Details
      </Typography>
      <Box
        sx={{
          border: '1px solid #E3ECEF',
          borderRadius: '4px',
          p: 2,
          mb: 3,
        }}
      >
        <Grid container spacing={2}>
        {/* Insurance Provider */}
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <CustomLabel label="Insurance Provider" />
            <Controller
              name="insuranceProvider"
              control={control}
              render={({ field }) => (
                <CustomInput
                  placeholder="Enter Insurance Provider"
                  name="insuranceProvider"
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.insuranceProvider}
                  errorMessage={errors.insuranceProvider?.message}
                  required
                />
              )}
            />
          </Box>
        </Grid>

        {/* Policy Number */}
        <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <CustomLabel label="Policy Number" />
            <Controller
              name="policyNumber"
              control={control}
              render={({ field }) => (
                <CustomInput
                  placeholder="Enter Policy Number"
                  name="policyNumber"
                  value={field.value}
                  onChange={field.onChange}
                  hasError={!!errors.policyNumber}
                  errorMessage={errors.policyNumber?.message}
                  required
                />
              )}
            />
          </Box>
        </Grid>

        {/* Insurance Status */}
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <CustomLabel label="Insurance Status" />
            <Controller
              name="insuranceStatus"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  placeholder="Select Insurance Status"
                  name="insuranceStatus"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  items={[
                    { value: 'Available', label: 'Available' },
                    { value: 'Not Available', label: 'Not Available' },
                  ]}
                  hasError={!!errors.insuranceStatus}
                  errorMessage={errors.insuranceStatus?.message}
                  isDisabled={false}
                  enableDeselect={true}
                />
              )}
            />
          </Box>
        </Grid>

        {/* Helper Text */}
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
          <Typography variant="body2" sx={{ color: '#757775', fontSize: '14px', mt: 1 }}>
            Insurance can be added later during onboarding.
          </Typography>
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
};

export default InsuranceForm;
