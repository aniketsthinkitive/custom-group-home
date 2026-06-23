import React from 'react';
import { Grid, Typography } from '@mui/material';
import { type Control, Controller, type FieldValues } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../../components/custom-label/custom-label';

interface Section4Props {
  control: Control<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Section4Recipient: React.FC<Section4Props> = ({ control, mode }) => {
  const isViewMode = mode === "view";
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Section IV – Who Can Receive My Health Information
        </Typography>
      </Grid>

      {/* Recipient Information Card */}
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
            {/* Name - Label and Input on same line */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="recipient_name"
                control={control}
                render={({ field }) => (
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomLabel label="Name" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <CustomInput
                        placeholder="Enter name"
                        name="recipient_name"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={isViewMode}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>

            {/* Organization - Label and Input on same line */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="recipient_organization"
                control={control}
                render={({ field }) => (
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomLabel label="Organization" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <CustomInput
                        placeholder="Enter organization"
                        name="recipient_organization"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={isViewMode}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>

            {/* Address - Label and Input on same line */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="recipient_address"
                control={control}
                render={({ field }) => (
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomLabel label="Address" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <CustomInput
                        placeholder="Enter address"
                        name="recipient_address"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        bgWhite
                        disableField={isViewMode}
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>

            {/* Privacy Declaration - After Address */}
            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>
                I understand that the person(s)/organization(s) listed above may not be covered by state/federal rules governing privacy and security of data and may be permitted to further share the information that is provided to them.
              </Typography>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Section4Recipient;

