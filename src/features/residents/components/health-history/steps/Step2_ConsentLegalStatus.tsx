import React from 'react';
import { Grid, Typography } from '@mui/material';
import { Control, Controller, useWatch } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomRadio from '../../../../../components/custom-radio/custom-radio';

interface Step2Props {
  control: Control<any>;
  errors?: any;
  mode?: "new" | "draft" | "view";
}

const Step2_ConsentLegalStatus: React.FC<Step2Props> = ({ control, errors, mode = "new" }) => {
  const consentStatus = useWatch({ control, name: 'consentStatus' });
  const resuscitationStatus = useWatch({ control, name: 'resuscitationStatus' });
  const advancedDirectives = useWatch({ control, name: 'advancedDirectives' });

  return (
    <Grid container spacing={2}>
      {/* Page Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Consent & Legal Status
        </Typography>
      </Grid>

      {/* Consent Status Card */}
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
              <CustomLabel label="Consent Status" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid>
              <Controller
                name="consentStatus"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={1}>
                    <Grid>
                      <Grid container direction="column" spacing={1}>
                        <Grid>
                          <CustomRadio
                            checked={field.value === 'can_give_own'}
                            onChange={() => field.onChange('can_give_own')}
                            label="Can give own consent"
                            value="can_give_own"
                            name="consentStatus"
                            disabled ={mode === "view"}
                          />
                        </Grid>
                        <Grid>
                          <CustomRadio
                            checked={field.value === 'unable_no_guardian'}
                            onChange={() => field.onChange('unable_no_guardian')}
                            label="Unable to give own consent and no guardian"
                            value="unable_no_guardian"
                            name="consentStatus"
                            disabled ={mode === "view"}
                          />
                        </Grid>
                        <Grid>
                          <CustomRadio
                            checked={field.value === 'consent_from_guardian'}
                            onChange={() => field.onChange('consent_from_guardian')}
                            label="Consent from guardian(s)"
                            value="consent_from_guardian"
                            name="consentStatus"
                            disabled ={mode === "view"}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Controller
                          name="guardianName"
                          control={control}
                          render={({ field: guardianField }) => (
                            <Grid container direction="column" spacing={0.5}>
                              <Grid>
                                <CustomLabel label="Guardian Name" />
                              </Grid>
                              <Grid>
                                <CustomInput
                                  placeholder="Enter"
                                  name="guardianName"
                                  value={guardianField.value}
                                  onChange={(e) => guardianField.onChange(e.target.value)}
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
                          name="guardianContactNumber"
                          control={control}
                          render={({ field: guardianField }) => (
                            <Grid container direction="column" spacing={0.5}>
                              <Grid>
                                <CustomLabel label="Phone Number" />
                              </Grid>
                              <Grid>
                                <CustomInput
                                  placeholder="Enter"
                                  name="guardianContactNumber"
                                  value={guardianField.value}
                                  onChange={(e) => guardianField.onChange(e.target.value)}
                                  phone
                                  bgWhite
                                  disableField={mode === "view"}
                                  hasError={!!errors?.guardianContactNumber}
                                  errorMessage={errors?.guardianContactNumber?.message}
                                />
                              </Grid>
                            </Grid>
                          )}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Resuscitation Status Card */}
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
              <CustomLabel label="Resuscitation Status" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }} />
            </Grid>
            <Grid>
              <Controller
                name="resuscitationStatus"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={2}>
                    <Grid>
                      <Grid container spacing={2}>
                        <Grid>
                          <CustomRadio
                            checked={field.value === 'full'}
                            onChange={() => field.onChange('full')}
                            label="Full Resuscitation"
                            value="full"
                            name="resuscitationStatus"
                            disabled ={mode === "view"}
                          />
                        </Grid>
                        <Grid>
                          <CustomRadio
                            checked={field.value === 'dnr'}
                            onChange={() => field.onChange('dnr')}
                            label="DNR"
                            value="dnr"
                            name="resuscitationStatus"
                            disabled ={mode === "view"}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    {resuscitationStatus === 'dnr' && (
                      <Grid container direction="column" sx={{ pl: 2, borderLeft: '2px solid #E3ECEF', mt: 1 }}>
                        <Grid sx={{ mb: 1 }}>
                          <CustomLabel label="If DNR:" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }} />
                          <CustomLabel label="Comfort Care Form Available?" />
                          <Controller
                            name="comfortCareFormAvailable"
                            control={control}
                            render={({ field }) => (
                              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                <Grid>
                                  <CustomRadio
                                    checked={field.value === 'yes'}
                                    onChange={() => field.onChange('yes')}
                                    label="Yes"
                                    value="yes"
                                    name="comfortCareFormAvailable"
                                    disabled ={mode === "view"}
                                  />

                                </Grid>
                                <Grid>
                                  <CustomRadio
                                    checked={field.value === 'no'}
                                    onChange={() => field.onChange('no')}
                                    label="No"
                                    value="no"
                                    name="comfortCareFormAvailable"
                                    disabled ={mode === "view"}
                                  />
                                </Grid>
                                <Grid>
                                  <CustomRadio
                                    checked={field.value === 'unknown'}
                                    onChange={() => field.onChange('unknown')}
                                    label="Unknown"
                                    value="unknown"
                                    name="comfortCareFormAvailable"
                                    disabled ={mode === "view"}
                                  />
                                </Grid>
                              </Grid>
                            )}
                          />
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                              name="dnrContactName"
                              control={control}
                              render={({ field }) => (
                                <Grid container direction="column" spacing={0.5}>
                                  <Grid>
                                    <CustomLabel label="Contact Name" />
                                  </Grid>
                                  <Grid>
                                    <CustomInput
                                      placeholder="Enter"
                                      name="dnrContactName"
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
                              name="dnrContactNumber"
                              control={control}
                              render={({ field }) => (
                                <Grid container direction="column" spacing={0.5}>
                                  <Grid>
                                    <CustomLabel label="Phone Number" />
                                  </Grid>
                                  <Grid>
                                    <CustomInput
                                      placeholder="Enter"
                                      name="dnrContactNumber"
                                      value={field.value}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      phone
                                      bgWhite
                                      disableField={mode === "view"}
                                      hasError={!!errors?.dnrContactNumber}
                                      errorMessage={errors?.dnrContactNumber?.message}
                                    />
                                  </Grid>
                                </Grid>
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Advanced Directives Card */}
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
              <CustomLabel label="Advanced Directives" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px' }} />
            </Grid>
            <Grid>
              <Controller
                name="advancedDirectives"
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={2}>
                    <Grid>
                      <Grid container spacing={2}>
                        <Grid>
                          <CustomRadio
                            checked={field.value === 'yes'}
                            onChange={() => field.onChange('yes')}
                            label="Yes"
                            value="yes"
                            name="advancedDirectives"
                            disabled ={mode === "view"}
                          />
                        </Grid>
                        <Grid>
                          <CustomRadio
                            checked={field.value === 'no'}
                            onChange={() => field.onChange('no')}
                            label="No"
                            value="no"
                            name="advancedDirectives"
                            disabled ={mode === "view"}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    {advancedDirectives === 'yes' && (
                      <Grid container direction="column" sx={{ pl: 2, borderLeft: '2px solid #E3ECEF', mt: 1 }}>
                        <Grid sx={{ mb: 1 }}>
                          <CustomLabel label="If Yes:" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }} />
                        </Grid>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Controller
                              name="advancedDirectivesName"
                              control={control}
                              render={({ field }) => (
                                <Grid container direction="column" spacing={0.5}>
                                  <Grid>
                                    <CustomLabel label="Name" />
                                  </Grid>
                                  <Grid>
                                    <CustomInput
                                      placeholder="Enter"
                                      name="advancedDirectivesName"
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
                              name="advancedDirectivesContact"
                              control={control}
                              render={({ field }) => (
                                <Grid container direction="column" spacing={0.5}>
                                  <Grid>
                                    <CustomLabel label="Phone Number" />
                                  </Grid>
                                  <Grid>
                                    <CustomInput
                                      placeholder="Enter"
                                      name="advancedDirectivesContact"
                                      value={field.value}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      phone
                                      bgWhite
                                      disableField={mode === "view"}
                                      hasError={!!errors?.advancedDirectivesContact}
                                      errorMessage={errors?.advancedDirectivesContact?.message}
                                    />
                                  </Grid>
                                </Grid>
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step2_ConsentLegalStatus;
