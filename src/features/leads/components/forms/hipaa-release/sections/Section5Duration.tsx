import React from 'react';
import { Grid, Typography, FormControlLabel, Checkbox, Box } from '@mui/material';
import { type Control, Controller, type UseFormSetValue, type FieldValues, type UseFormWatch } from 'react-hook-form';
import CustomLabel from '../../../../../../components/custom-label/custom-label';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import DatePickerField from '../../../../../../components/date-picker-field/date-picker-field';
import dayjs from 'dayjs';

interface Section5Props {
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Section5Duration: React.FC<Section5Props> = ({ control, setValue, mode }) => {
  const isViewMode = mode === "view";
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Section V - Duration of Authorization
        </Typography>
      </Grid>

      {/* Duration Card */}
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
            {/* Introduction Text */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: '14px', color: '#1F2A37', mb: 1 }}>
                This authorization to share my health information is valid:
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 2 }}>
                Tick as appropriate.
              </Typography>
            </Grid>
            
            {/* Option a) From [date] to [date] */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="durationOptionA"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value || false}
                        onChange={(e) => {
                          field.onChange(e.target.checked);
                          if (e.target.checked) {
                            setValue('durationOptionB', false);
                            setValue('durationOptionC', false);
                          }
                        }}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography component="span" sx={{ fontSize: '14px', color: '#1F2A37' }}>
                          a) From
                        </Typography>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            minWidth: '150px',
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
                            },
                            '& .MuiOutlinedInput-input': {
                              padding: '0 4px',
                              fontSize: '14px',
                            },
                          }}
                        >
                          <Controller
                            name="durationFromDate"
                            control={control}
                            render={({ field: dateField }) => (
                              <DatePickerField
                                value={dateField.value ? dayjs(dateField.value) : null}
                                onChange={(date) => dateField.onChange(date ? date.toDate() : null)}
                                disabled={isViewMode || !field.value}
                              />
                            )}
                          />
                        </Box>
                        <Typography component="span" sx={{ fontSize: '14px', color: '#1F2A37' }}>
                          to
                        </Typography>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            minWidth: '150px',
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
                            },
                            '& .MuiOutlinedInput-input': {
                              padding: '0 4px',
                              fontSize: '14px',
                            },
                          }}
                        >
                          <Controller
                            name="durationToDate"
                            control={control}
                            render={({ field: dateField }) => (
                              <DatePickerField
                                value={dateField.value ? dayjs(dateField.value) : null}
                                onChange={(date) => dateField.onChange(date ? date.toDate() : null)}
                                disabled={isViewMode || !field.value}
                              />
                            )}
                          />
                        </Box>
                      </Box>
                    }
                    sx={{ alignItems: 'center' }}
                  />
                )}
              />
            </Grid>

            {/* Or Separator */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', my: 1 }}>
                Or
              </Typography>
            </Grid>

            {/* Option b) All past, present, and future periods */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="durationOptionB"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value || false}
                        onChange={(e) => {
                          field.onChange(e.target.checked);
                          if (e.target.checked) {
                            setValue('durationOptionA', false);
                            setValue('durationOptionC', false);
                          }
                        }}
                        disabled={isViewMode}
                        sx={{
                          color: '#0A2E45',
                          '&.Mui-checked': {
                            color: '#0A2E45',
                          },
                        }}
                      />
                    }
                    label="b) All past, present, and future periods"
                  />
                )}
              />
            </Grid>

            {/* Or Separator */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', my: 1 }}>
                Or
              </Typography>
            </Grid>

            {/* Option c) The date of the signature in section VI until the following event */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="durationOptionC"
                control={control}
                render={({ field }) => (
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value || false}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            if (e.target.checked) {
                              setValue('durationOptionA', false);
                              setValue('durationOptionB', false);
                            }
                          }}
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
                          c) The date of the signature in section VI until the following event:
                        </Typography>
                      }
                      sx={{ alignItems: 'flex-start' }}
                    />
                    {field.value && (
                      <Box sx={{ ml: 4, mt: 1 }}>
                        <Controller
                          name="durationEventDescription"
                          control={control}
                          render={({ field: eventField }) => (
                            <Box
                              sx={{
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
                                },
                                '& .MuiOutlinedInput-input': {
                                  padding: '0 4px',
                                  fontSize: '14px',
                                },
                              }}
                            >
                              <CustomInput
                                placeholder=""
                                name="durationEventDescription"
                                value={eventField.value || ''}
                                onChange={(e) => eventField.onChange(e.target.value)}
                                bgWhite
                                disableField={isViewMode}
                              />
                            </Box>
                          )}
                        />
                      </Box>
                    )}
                  </Box>
                )}
              />
            </Grid>

            {/* Horizontal Line */}
            <Grid size={{ xs: 12 }} sx={{ my: 2 }}>
              <Box sx={{ borderTop: '1px solid #E3ECEF', width: '100%' }} />
            </Grid>

            {/* Revocation Clause */}
            <Grid size={{ xs: 12 }}>
              <Typography sx={{ fontSize: '14px', color: '#1F2A37', mb: 2 }}>
                I understand that I am permitted to revoke this authorization to share my health data at any time and can do so by submitting a request in writing to:
              </Typography>
            </Grid>

            {/* Revocation Name - Label and Input on same line */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="revocation_name"
                control={control}
                render={({ field }) => (
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomLabel label="Name:" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <CustomInput
                        placeholder=""
                        name="revocation_name"
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

            {/* Revocation Organization - Label and Input on same line */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="revocation_organization"
                control={control}
                render={({ field }) => (
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomLabel label="Organization:" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <CustomInput
                        placeholder=""
                        name="revocation_organization"
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

            {/* Contact Information */}
            

            {/* Address - Label and Input on same line */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name="revocation_address"
                control={control}
                render={({ field }) => (
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <CustomLabel label="Address:" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 9 }}>
                      <CustomInput
                        placeholder=""
                        name="revocation_address"
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

            {/* I Understand That Declaration */}
            <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 1.5 }}>
                I understand that:
              </Typography>
              <Box component="ul" sx={{ pl: 3, m: 0 }}>
                <Box component="li" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: '14px', color: '#1F2A37', lineHeight: '1.6' }}>
                    In the event that my information has already been shared by the time my authorization is revoked, it may be too late to cancel permission to share my health data.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: '14px', color: '#1F2A37', lineHeight: '1.6' }}>
                    I understand that I do not need to give any further permission for the information detailed in Section II to be shared with the person(s) or organization(s) listed in section IV.
                  </Typography>
                </Box>
                <Box component="li" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: '14px', color: '#1F2A37', lineHeight: '1.6' }}>
                    I understand that the failure to sign/submit this authorization or the cancellation of this authorization will not prevent me from receiving any treatment or benefits I am entitled to receive, provided this information is not required to determine if I am eligible to receive those treatments or benefits or to pay for the services I receive.
                  </Typography>
                </Box>
              </Box>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Section5Duration;

