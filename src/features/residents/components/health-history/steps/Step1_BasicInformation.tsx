import React from 'react';
import { Grid, Typography } from '@mui/material';
import { Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomSelect from '../../../../../components/custom-select/custom-select';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import DatePickerField from '../../../../../components/date-picker-field/date-picker-field';
import dayjs from 'dayjs';

interface Step1Props {
  control: Control<any>;
  errors?: any;
  individualName?: string;
  mode?: "new" | "draft" | "view";
}

const Step1_BasicInformation: React.FC<Step1Props> = ({ control, errors, individualName, mode }) => {
  const isViewMode = mode === "view";
  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Basic Information
        </Typography>
      </Grid>

      {/* Basic Information Card */}
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
            <Grid>
              <CustomLabel label="Basic Information" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="completedBy"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Completed By" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="completedBy"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="relationshipToIndividual"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Relationship to Individual" />
                      </Grid>
                      <Grid>
                       
                          <CustomSelect
                            placeholder="Select"
                            name="relationshipToIndividual"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            items={[
                              { value: 'guardian', label: 'Guardian' },
                              { value: 'family', label: 'Family Member' },
                              { value: 'caregiver', label: 'Caregiver' },
                              { value: 'other', label: 'Other' },
                              
                            ]}
                            enableDeselect={true}
                            isDisabled = {isViewMode}
                            
                          />
                        
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Date" />
                      </Grid>
                      <Grid>
                        
                          <DatePickerField
                            name="date"
                            value={field.value}
                            onChange={field.onChange}
                            useCustomStyle={false}
                            disableFuture
                            disabled = {isViewMode}
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

      {/* Individual Details Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Grid container spacing={2} direction="column">
            <Grid>
              <CustomLabel label="Individual Details" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Name" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="name"
                          value={field.value || individualName || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          disableField
                          bgWhite
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="likesToBeCalled"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Likes to be called" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="likesToBeCalled"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Date of Birth" />
                      </Grid>
                      <Grid>
                        <DatePickerField
                          name="dateOfBirth"
                          value={field.value}
                          onChange={field.onChange}
                          useCustomStyle={false}
                          disableFuture
                          disabled = {isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="socSec"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Soc. Sec." />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="socSec"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="religion"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Religion" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="religion"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="contactNumber"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Phone Number" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="contactNumber"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          phone
                          bgWhite
                          disableField={isViewMode}
                          hasError={!!errors?.contactNumber}
                          errorMessage={errors?.contactNumber?.message}
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

      {/* Address & Insurance Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Grid container spacing={2} direction="column">
            <Grid>
              <CustomLabel label="Address & Insurance" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Address" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="address"
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="healthInsuranceType"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Health Insurance Type" />
                      </Grid>
                      <Grid>
                        <CustomSelect
                          placeholder="Select"
                          name="healthInsuranceType"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          items={[
                            { value: 'medicaid', label: 'Medicaid' },
                            { value: 'medicare', label: 'Medicare' },
                            { value: 'private', label: 'Private Insurance' },
                          ]}
                          enableDeselect={true}
                          bgWhite
                          isDisabled = {isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="healthInsuranceNumber"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Health Insurance Number" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="healthInsuranceNumber"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
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

      {/* Contact Details Card */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Grid container spacing={2} direction="column">
            <Grid>
              <CustomLabel label="Contact Details" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="agencyResponsible"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Agency Responsible for Providing Care" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="agencyResponsible"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />

                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="agencyContactNumber"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Phone Number" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="agencyContactNumber"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          phone
                          bgWhite
                          disableField={isViewMode}
                          hasError={!!errors?.agencyContactNumber}
                          errorMessage={errors?.agencyContactNumber?.message}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="agencyPrimaryContact"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Agency primary contact person" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="agencyPrimaryContact"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          bgWhite
                          disableField={isViewMode}
                        />
                      </Grid>
                    </Grid>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="agencyPrimaryContactNumber"
                  control={control}
                  render={({ field }) => (
                    <Grid container direction="column" spacing={0.5}>
                      <Grid>
                        <CustomLabel label="Phone Number" />
                      </Grid>
                      <Grid>
                        <CustomInput
                          placeholder="Enter"
                          name="agencyPrimaryContactNumber"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          phone
                          bgWhite
                          disableField={isViewMode}
                          hasError={!!errors?.agencyPrimaryContactNumber}
                          errorMessage={errors?.agencyPrimaryContactNumber?.message}
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

export default Step1_BasicInformation;
