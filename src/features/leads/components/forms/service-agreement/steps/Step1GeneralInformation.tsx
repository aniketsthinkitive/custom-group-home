import React from 'react';
import { Grid, Typography, Checkbox, FormControlLabel, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { DateRangeIcon } from '@mui/x-date-pickers/icons';

import { type FieldValues, Control, Controller, type FieldErrors, UseFormWatch } from 'react-hook-form';
import CustomInput from '../../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../../components/custom-label/custom-label';
import DatePickerField from '../../../../../../components/date-picker-field/date-picker-field';
import { errorStyle } from '../../../../../../components/custom-input/custom-input-styles';
import dayjs from 'dayjs';

interface Step1Props {
  control: Control<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  mode?: "new" | "draft" | "view";
  errors?: FieldErrors<FieldValues>;
  // Set to true by the drawer after the user clicks Next on an invalid
  // step. Used to force fields like DOB (which otherwise suppress their
  // error until the user interacts with them) to reveal their error so
  // the scroll-to-first-error fallback can find them.
  showAllErrors?: boolean;
}

const Step1GeneralInformation: React.FC<Step1Props> = ({ control, watch, mode, errors = {}, showAllErrors = false }) => {
  const isViewMode = mode === "view";
  const startDateValue = watch('startDate');
  const startDateMin = startDateValue ? dayjs(startDateValue) : undefined;

  const certificationBeginDateValue = watch('certificationBeginDate');
  const certificationBeginDateMin = certificationBeginDateValue ? dayjs(certificationBeginDateValue) : undefined;
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          1. General Information
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
          {/* Main Information - Two Columns */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={2}>

              {/* Row 1: Meeting Date | Start Date */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="meetingDate"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Meeting Date" />
                      </Grid>
                      <Grid size={{ xs: 12 }} data-field="meetingDate">
                        <DatePickerField
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toDate() : null)}
                          disabled={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Start Date" />
                      </Grid>
                      <Grid size={{ xs: 12 }} data-field="startDate">
                        <DatePickerField
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toDate() : null)}
                          disabled={isViewMode}
                          disableFuture={true}
                          hasError={!!errors?.startDate}
                          errorMessage={errors?.startDate?.message as string | undefined}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              {/* Row 2: End Date | Cert Begin */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="End Date" />
                      </Grid>
                      <Grid size={{ xs: 12 }} data-field="endDate">
                        <DatePickerField
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toDate() : null)}
                          disabled={isViewMode}
                          minDate={startDateMin}
                          hasError={!!errors?.endDate}
                          errorMessage={errors?.endDate?.message as string | undefined}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="certificationBeginDate"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Certification Begin Date" />
                      </Grid>
                      <Grid size={{ xs: 12 }} data-field="certificationBeginDate">
                        <DatePickerField
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toDate() : null)}
                          disabled={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              {/* Row 3: Cert End | First Name */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="certificationEndDate"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Certification End Date" />
                      </Grid>
                      <Grid size={{ xs: 12 }} data-field="certificationEndDate">
                        <DatePickerField
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.toDate() : null)}
                          disabled={isViewMode}
                          minDate={certificationBeginDateMin}
                          hasError={!!errors?.certificationEndDate}
                          errorMessage={errors?.certificationEndDate?.message as string | undefined}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="First Name" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter first name"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              {/* Row 4: Middle Name | Last Name */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="middleName"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Middle Name" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter middle name"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Last Name" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter last name"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              {/* Row 5: DOB | Email */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="dob"
                  control={control}
                  render={({ field, fieldState }) => {
                    // Gate error display so a fresh drawer doesn't immediately
                    // show "Date of birth is required". `mode: "onChange"`
                    // runs the whole yup schema on every keystroke, so
                    // typing in *any* field populates errors.dob = "required"
                    // — we only want to surface it once the user has either
                    // interacted with the DOB input itself, or clicked Next.
                    const showError =
                      (fieldState.isTouched || fieldState.isDirty || showAllErrors) &&
                      !!fieldState.error;
                    return (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid size={{ xs: 12 }}>
                          <CustomLabel label="DOB" isRequired />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DesktopDatePicker
                              value={field.value ? dayjs(field.value) : null}
                              onChange={(date) =>
                                field.onChange(date && date.isValid() ? date.toDate() : null)
                              }
                              disabled={isViewMode}
                              disableFuture
                              closeOnSelect
                              format="MM-DD-YYYY"
                              onError={() => {}}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  placeholder: 'Select Date',
                                  error: showError,
                                  name: 'dob',
                                  InputProps: { readOnly: false },
                                },
                                openPickerIcon: { children: <DateRangeIcon /> },
                                inputAdornment: { position: 'start' },
                                popper: { sx: { zIndex: 99999 } },
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  fontSize: '16px',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  color: '#2C2D2C',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  outline: 'none !important',
                                  '&:focus': { outline: 'none !important' },
                                },
                                '& .MuiOutlinedInput-root, & .MuiPickersInputBase-root': {
                                  borderRadius: '6px',
                                  minHeight: '36px',
                                  height: '45px',
                                  backgroundColor: '#FFFFFF',
                                  border: showError
                                    ? `1px solid ${errorStyle.color}`
                                    : '1px solid #DDE0DD',
                                  borderWidth: '1px !important',
                                  boxShadow: 'none',
                                  outline: 'none !important',
                                  '&:hover': {
                                    borderColor: showError ? errorStyle.color : '#CDD0CD',
                                    borderWidth: '1px !important',
                                  },
                                  '&.Mui-focused': {
                                    borderColor: showError ? errorStyle.color : '#DDE0DD',
                                    borderWidth: '1px !important',
                                    boxShadow: 'none',
                                    outline: 'none !important',
                                  },
                                  '& fieldset': {
                                    border: 'none !important',
                                    borderWidth: '0 !important',
                                  },
                                },
                                '& .MuiOutlinedInput-root.Mui-error, & .MuiPickersInputBase-root.Mui-error': {
                                  '& fieldset': {
                                    border: 'none !important',
                                    borderWidth: '0 !important',
                                  },
                                },
                              }}
                            />
                          </LocalizationProvider>
                          {showError && fieldState.error?.message && (
                            <Typography
                              sx={{
                                ...errorStyle,
                                fontSize: '0.75rem',
                                lineHeight: 1.5,
                                letterSpacing: '0.03333em',
                              }}
                            >
                              {fieldState.error.message}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    );
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Email" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                          <CustomInput
                            {...field}
                            placeholder="Enter email"
                            disableField={isViewMode}
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              {/* Row 6: Phone | Mailing City St. ZIP */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Phone Number" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter phone number"
                          disableField={isViewMode}
                          hasError={!!fieldState.error}
                          errorMessage={fieldState.error?.message}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mailingCityStZip"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Mailing City St. ZIP" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter mailing city, state, ZIP"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              {/* Remaining fields (unchanged) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="midNumber"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="MID Number" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter MID number"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="mailingAddress"
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

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="residentialAddress"
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

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="residentialCityStZip"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Residential City St. ZIP" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter residential city, state, ZIP"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="duckNumber"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="DUCK#" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter DUCK number"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="waiver"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Waiver" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter waiver"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Region" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter region"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
                <Controller
                  name="servicesDeliveredByPDMS"
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
                          Are these services delivered by PDMS?
                        </Typography>
                      }
                    />
                  )}
                />
              </Grid>

            </Grid>
          </Grid>

          {/* Guardian Section */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 2 }}>
              Guardian
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="guardianName"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Guardian Name" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter guardian name"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="guardianPhone"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="guardianEmail"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Email" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter email"
                          disableField={isViewMode}
                          hasError={!!fieldState.error}
                          errorMessage={fieldState.error?.message}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="guardianType"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Type" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter type"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="guardianAddress"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Address" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter address"
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
                  name="guardianCityStZip"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="City St. ZIP" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter city, state, ZIP"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Co-Guardian and 3rd Guardian Container */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              {/* Co-Guardian Section */}
              <Grid size={{ xs: 12, md: 5.5 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 2 }}>
                  Co-Guardian
                </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="coGuardianName"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Co-Guardian Name" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter co-guardian name"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="coGuardianPhone"
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
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="coGuardianEmail"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Email" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter email"
                          disableField={isViewMode}
                          hasError={!!fieldState.error}
                          errorMessage={fieldState.error?.message}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="coGuardianType"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Type" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter type"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="coGuardianAddress"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Address" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter address"
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
                  name="coGuardianCityStZip"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="City St. ZIP" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter city, state, ZIP"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
            </Grid>
              </Grid>

              {/* 3rd Guardian Section */}
              <Grid size={{ xs: 12, md: 5.5 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 2 }}>
                  3rd Guardian
                </Typography>
                <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="thirdGuardianName"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="3rd Guardian Name" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter 3rd guardian name"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="thirdGuardianPhone"
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
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="thirdGuardianEmail"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Email" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter email"
                          disableField={isViewMode}
                          hasError={!!fieldState.error}
                          errorMessage={fieldState.error?.message}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="thirdGuardianType"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Type" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter type"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="thirdGuardianAddress"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Address" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter address"
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
                  name="thirdGuardianCityStZip"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="City St. ZIP" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter city, state, ZIP"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Emergency Contact Section - Separate Card */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <Grid
              container
              sx={{
                border: '1px solid #E3ECEF',
                borderRadius: '8px',
                p: 3,
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 2 }}>
                  Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="emergencyContactName"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Emergency Contact" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter emergency contact name"
                                disableField={isViewMode}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="emergencyContactRelationship"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Relationship" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter relationship"
                                disableField={isViewMode}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="emergencyContactPhone"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Phone Number" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter phone"
                                disableField={isViewMode}
                                hasError={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="emergencyContactEmail"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Email" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter email"
                                disableField={isViewMode}
                                hasError={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="emergencyContactAddress"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Address" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <CustomInput
                              {...field}
                              placeholder="Enter address"
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
                      name="emergencyContactCityStZip"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="City St. ZIP" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter city, state, ZIP"
                                disableField={isViewMode}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Family Representative Section - Separate Card */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <Grid
              container
              sx={{
                border: '1px solid #E3ECEF',
                borderRadius: '8px',
                p: 3,
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Grid size={{ xs: 12 }}>
                <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 2 }}>
                  Family Representative
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="familyRepresentativeName"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Family Representative" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter family representative name"
                                disableField={isViewMode}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="familyRepresentativePhone"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Phone Number" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter phone"
                                disableField={isViewMode}
                                hasError={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="familyRepresentativeEmail"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Email" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter email"
                                disableField={isViewMode}
                                hasError={!!fieldState.error}
                                errorMessage={fieldState.error?.message}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="familyRepresentativeAddress"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="Address" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <CustomInput
                              {...field}
                              placeholder="Enter address"
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
                      name="familyRepresentativeCityStZip"
                      control={control}
                      render={({ field }) => (
                        <Grid container direction="column" spacing={0.5}>
                          <Grid size={{ xs: 12 }}>
                            <CustomLabel label="City St. ZIP" />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Box sx={{ width: '100%', overflow: 'hidden', '& input': { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                              <CustomInput
                                {...field}
                                placeholder="Enter city, state, ZIP"
                                disableField={isViewMode}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Backup Provider Section */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2A37', mb: 2 }}>
              Backup Provider
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="backupProviderName"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Backup Provider" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter backup provider name"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="backupProviderPhone"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="backupProviderEmail"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Email" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter email"
                          disableField={isViewMode}
                          hasError={!!fieldState.error}
                          errorMessage={fieldState.error?.message}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="backupProviderAddress"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="Address" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter address"
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
                  name="backupProviderCityStZip"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid size={{ xs: 12 }}>
                        <CustomLabel label="City St. ZIP" />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <CustomInput
                          {...field}
                          placeholder="Enter city, state, ZIP"
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
 
  );
};

export default Step1GeneralInformation;

