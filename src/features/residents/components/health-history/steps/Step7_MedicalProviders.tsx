import React, { useState } from 'react';
import { Grid, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Control, Controller } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomButton from '../../../../../components/custom-buttons/custom-buttons';

interface Step7Props {
  control: Control<any>;
  errors?: any;
  mode?: "new" | "draft" | "view";
}

interface Subspecialist {
  id: string;
  name: string;
  contactNumber: string;
  address: string;
}

const Step7_MedicalProviders: React.FC<Step7Props> = ({ control, errors, mode = "new" }) => {
  const [subspecialists, setSubspecialists] = useState<Subspecialist[]>([
    { id: '1', name: '', contactNumber: '', address: '' }
  ]);

  const addSubspecialist = () => {
    setSubspecialists([...subspecialists, { id: Date.now().toString(), name: '', contactNumber: '', address: '' }]);
  };

  const removeSubspecialist = (id: string) => {
    if (subspecialists.length > 1) {
      setSubspecialists(subspecialists.filter(s => s.id !== id));
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Medical Providers
        </Typography>
      </Grid>

      {/* Primary Care Card */}
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
              <CustomLabel label="Primary Care" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="primaryCareName"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Name" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="primaryCareName"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            bgWhite
                            disableField={mode === "view"}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="primaryCareContactNumber"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Phone Number" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="primaryCareContactNumber"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            phone
                            bgWhite
                            disableField={mode === "view"}
                            hasError={!!errors?.primaryCareContactNumber}
                            errorMessage={errors?.primaryCareContactNumber?.message}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="primaryCareAddress"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Address" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="primaryCareAddress"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            bgWhite
                            disableField={mode === "view"}
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

      {/* Dental Care Card */}
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
              <CustomLabel label="Dental Care" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="dentalCareName"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Name" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="dentalCareName"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            bgWhite
                            disableField={mode === "view"}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="dentalCareContactNumber"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Phone Number" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="dentalCareContactNumber"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            phone
                            bgWhite
                            disableField={mode === "view"}
                            hasError={!!errors?.dentalCareContactNumber}
                            errorMessage={errors?.dentalCareContactNumber?.message}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="dentalCareAddress"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Address" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="dentalCareAddress"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            bgWhite
                            disableField={mode === "view"}
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

      {/* Eye Care Card */}
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
              <CustomLabel label="Eye Care" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="eyeCareName"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Name" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="eyeCareName"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            bgWhite
                            disableField={mode === "view"}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="eyeCareContactNumber"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Phone Number" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="eyeCareContactNumber"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            phone
                            bgWhite
                            disableField={mode === "view"}
                            hasError={!!errors?.eyeCareContactNumber}
                            errorMessage={errors?.eyeCareContactNumber?.message}
                          />
                        </Grid>
                      </Grid>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="eyeCareAddress"
                    control={control}
                    render={({ field }) => (
                      <Grid container direction="column" spacing={0.5}>
                        <Grid>
                          <CustomLabel label="Address" />
                        </Grid>
                        <Grid>
                          <CustomInput
                            placeholder="Enter"
                            name="eyeCareAddress"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            bgWhite
                            disableField={mode === "view"}
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

      {/* Subspecialists Card */}
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
              <Grid container justifyContent="space-between" alignItems="center">
                <Grid>
                  <CustomLabel label="Subspecialists / Type" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
                </Grid>
                <Grid>
                <CustomButton
                  variant="secondary"
                  onClick={addSubspecialist}
                  sx={{ minWidth: 'auto', paddingLeft: 2, paddingRight: 2, border: 'none' }}
                  disabled={mode === "view"}
                >
                  + Add More
                </CustomButton>
                </Grid>
              </Grid>
            </Grid>
            <Grid>
              <Grid container spacing={2}>
                {subspecialists.map((subspecialist, index) => (
                  <Grid size={{ xs: 12 }} key={subspecialist.id}>
                    <Grid
                      container
                      sx={{
                        border: '1px solid #E3ECEF',
                        borderRadius: '4px',
                        p: 2,
                        position: 'relative',
                      }}
                    >
                      {subspecialists.length > 1 && (
                        <Grid
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          cursor: mode === "view" ? 'not-allowed' : 'pointer',
                          pointerEvents: mode === "view" ? 'none' : 'auto', // ✅ disables click
                        }}
                        onClick={() => {
                          if (mode !== "view") {
                            removeSubspecialist(subspecialist.id);
                          }
                        }}
                      >
                        <Delete
                          sx={{
                            color: mode === "view" ? '#9CA3AF' : '#DC2626', // ✅ grey when disabled
                            fontSize: '20px',
                          }}
                        />
                      </Grid>
                      
                      )}
                      <Grid container spacing={2} sx={{ width: '100%' }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name={`subspecialists.${index}.name`}
                            control={control}
                            render={({ field }) => (
                              <Grid container direction="column" spacing={0.5}>
                                <Grid>
                                  <CustomLabel label="Name" />
                                </Grid>
                                <Grid>
                                  <CustomInput
                                    placeholder="Enter"
                                    name={`subspecialists.${index}.name`}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    bgWhite
                                    disableField={mode === "view"}
                                  />
                                </Grid>
                              </Grid>
                            )}
                            disabled={mode === "view"}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name={`subspecialists.${index}.contactNumber`}
                            control={control}
                            render={({ field }) => (
                              <Grid container direction="column" spacing={0.5}>
                                <Grid>
                                  <CustomLabel label="Phone Number" />
                                </Grid>
                                <Grid>
                                  <CustomInput
                                    placeholder="Enter"
                                    name={`subspecialists.${index}.contactNumber`}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    phone
                                    bgWhite
                                    disableField={mode === "view"}
                                    hasError={!!errors?.subspecialists?.[index]?.contactNumber}
                                    errorMessage={errors?.subspecialists?.[index]?.contactNumber?.message}
                                  />
                                </Grid>
                              </Grid>
                            )}
                            disabled={mode === "view"}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Controller
                            name={`subspecialists.${index}.address`}
                            control={control}
                            render={({ field }) => (
                              <Grid container direction="column" spacing={0.5}>
                                <Grid>
                                  <CustomLabel label="Address" />
                                </Grid>
                                <Grid>
                                  <CustomInput
                                    placeholder="Enter"
                                    name={`subspecialists.${index}.address`}
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    bgWhite
                                    disableField={mode === "view"}
                                  />
                                </Grid>
                              </Grid>
                            )}
                            disabled={mode === "view"}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step7_MedicalProviders;

