import React from 'react';
import { Grid, Typography, Checkbox, FormControlLabel } from '@mui/material';
import { type FieldValues, Control, Controller, UseFormWatch } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../../components/custom-label/custom-label';

interface Step4Props {
  control: Control<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Step4RepPayee: React.FC<Step4Props> = ({ control, watch, mode }) => {
  const isViewMode = mode === "view";
  const hasRepPayeeValue = watch('hasRepPayee');
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          4. Rep Payee
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
          {/* Rep Payee Checkbox */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Controller
              name="hasRepPayee"
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
                      Rep Payee
                    </Typography>
                  }
                />
              )}
            />
          </Grid>

              <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="repPayeeName"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Name" isRequired={hasRepPayeeValue} />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <CustomInput
                              {...field}
                              placeholder="Enter rep payee name"
                              disableField={isViewMode}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="repPayeePhone"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Phone Number" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <CustomInput
                              {...field}
                              placeholder="Enter phone"
                              disableField={isViewMode}
                              hasError={!!fieldState.error}
                              errorMessage={fieldState.error?.message}
                            />
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
                <Controller
                  name="repPayeeResidentialAddress"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Residential Address" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter residential address"
                          disableField={isViewMode}
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
                <Controller
                  name="repPayeeMailingAddress"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Mailing Address" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter mailing address"
                          disableField={isViewMode}
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Controller
                  name="amountOfMonthlySpendingMoney"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Amount of monthly spending money" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter amount"
                          disableField={isViewMode}
                          type="number"
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step4RepPayee;

