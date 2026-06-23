import React, { useState } from 'react';
import { Grid, Accordion, AccordionSummary, AccordionDetails, Paper, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Control, Controller } from 'react-hook-form';
import * as yup from 'yup';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../components/custom-text-area/custom-textarea';

// Yup validation schema for Step10
export const step10ValidationSchema = yup.object({
  medicalConsiderationsDuringCrisis: yup
    .string()
    .required('Medical Considerations is required')
    .test('not-empty', 'Medical Considerations is required', (value) => {
      return value !== null && value !== undefined && value.trim() !== '';
    }),
  fadingCriteria: yup
    .string()
    .required('Fading Criteria is required')
    .test('not-empty', 'Fading Criteria is required', (value) => {
      return value !== null && value !== undefined && value.trim() !== '';
    }),
  planTerminationCriteria: yup
    .string()
    .required('Plan Termination Criteria is required')
    .test('not-empty', 'Plan Termination Criteria is required', (value) => {
      return value !== null && value !== undefined && value.trim() !== '';
    }),
  monitoringProtocol: yup
    .string()
    .required('Monitoring Protocol is required')
    .test('not-empty', 'Monitoring Protocol is required', (value) => {
      return value !== null && value !== undefined && value.trim() !== '';
    }),
});

interface Step10Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
  errors?: any;
}

const Step10_CrisisIntervention: React.FC<Step10Props> = ({ control, mode = "new", errors }) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const cpiPrinciples = [
    'Early intervention and prevention',
    'Verbal de-escalation techniques',
    'Respect for individual dignity',
    'Use of least restrictive interventions',
    'Physical intervention only as last resort',
    'Therapeutic rapport building',
    'All staff must maintain current CPI certification and follow agency protocols for crisis situations.',
  ];

  return (
    <Grid container spacing={1} >
      {/* CPI Nonviolent Crisis Intervention overview */}
     <Grid size={{ xs: 12 }}>
  {/* OUTER WRAPPER (light grey background like Figma) */}
  <Grid
    container
    sx={{
      border: '1px solid #E3ECEF',
      borderRadius: '8px',
      p: 2,
      backgroundColor: '#F8FAFB', // ✅ section background
    }}
  >
    <Accordion
      expanded={expanded === 'cpi'}
      onChange={handleAccordionChange('cpi')}
      sx={{
        width: '100%',
        backgroundColor: 'transparent', // ✅ don't make accordion white
        boxShadow: 'none',
        border: 'none',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          p: 0,
          minHeight: 'auto',
          '& .MuiAccordionSummary-content': {
            m: 0,
          },
        }}
      >
        <CustomLabel
          label="CPI Nonviolent Crisis Intervention overview"
          style={{ fontSize: '16px', fontWeight: 600 }}
        />
      </AccordionSummary>

      {/* ✅ Divider line under header (Figma) */}
      <Grid
        sx={{
          mt: 1,
          mb: 2,
          height: '1px',
          width: '100%',
          backgroundColor: '#E3ECEF',
        }}
      />

      <AccordionDetails sx={{ p: 0 }}>
        {/* SINGLE WHITE CARD (all content inside, like Figma) */}
        <Paper
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            backgroundColor: '#FFFFFF', // ✅ only inner card white
          }}
        >
          <Grid container direction="column" spacing={1}>
            <Grid >
              <CustomLabel
                label="Crisis Prevention Institute (CPI) training provides evidence-based de-escalation techniques and safe crisis intervention methods."
                style={{
                  fontSize: '14px',
                  color: '#2C2D2C',
                  marginBottom: '12px',
                }}
              />
            </Grid>

            <Grid>
              <CustomLabel
                label="Key Principles:"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              />
            </Grid>

            <Grid>
              <Grid container direction="column" spacing={1}>
                {cpiPrinciples.map((principle, index) => (
                  <Grid key={index}>
                    <CustomLabel
                      label={`• ${principle}`}
                      style={{ fontSize: '14px', color: '#2C2D2C' }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </AccordionDetails>
    </Accordion>
  </Grid>
</Grid>


      {/* Medical Considerations During Crisis */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: '14px', fontWeight: 500 ,marginBottom: '10px'}}>
              Medical Considerations During Crisis
            </Typography>
          </Grid>
          <Grid>
            <CustomLabel
              label="Medical Considerations"
              isRequired={true}
              style={{ fontSize: '14px', marginBottom: '8px' }}
            />
          </Grid>
          <Grid>
            <Controller
              name="medicalConsiderationsDuringCrisis"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <CustomTextArea
                    name="medicalConsiderationsDuringCrisis"
                    placeholder="Enter"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minRow={4}
                    isDisabled={mode === "view"}
                    hasError={!!(fieldState.error || errors?.medicalConsiderationsDuringCrisis)}
                    errorMessage={fieldState.error?.message || errors?.medicalConsiderationsDuringCrisis?.message}
                  />
                </>
              )}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Medical Considerations */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, marginBottom: '10px' }}>
              Medical Considerations
            </Typography>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <CustomLabel
                  label="Fading Criteria"
                  isRequired={true}
                  style={{ fontSize: '14px', marginBottom: '8px' }}
                />
              </Grid>
              <Grid>
                <Controller
                  name="fadingCriteria"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <CustomTextArea
                        name="fadingCriteria"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        minRow={4}
                        isDisabled={mode === "view"}
                        hasError={!!(fieldState.error || errors?.fadingCriteria)}
                        errorMessage={fieldState.error?.message || errors?.fadingCriteria?.message}
                      />
                    </>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <CustomLabel
                  label="Plan Termination Criteria"
                  isRequired={true}
                  style={{ fontSize: '14px', marginBottom: '8px' }}
                />
              </Grid>
              <Grid>
                <Controller
                  name="planTerminationCriteria"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <CustomTextArea
                        name="planTerminationCriteria"
                        placeholder="Enter"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        minRow={4}
                        isDisabled={mode === "view"}
                        hasError={!!(fieldState.error || errors?.planTerminationCriteria)}
                        errorMessage={fieldState.error?.message || errors?.planTerminationCriteria?.message}
                      />
                    </>
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Behavior Support Plan Monitoring */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: '14px', fontWeight: 500 ,marginBottom: '10px'}}>
              Behavior Support Plan Monitoring
            </Typography>
          </Grid>
          <Grid>
            <CustomLabel
              label="Monitoring Protocol"
              isRequired={true}
              style={{ fontSize: '14px', marginBottom: '8px' }}
            />
          </Grid>
          <Grid>
            <Controller
              name="monitoringProtocol"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <CustomTextArea
                    name="monitoringProtocol"
                    placeholder="Enter"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    minRow={4}
                    isDisabled={mode === "view"}
                    hasError={!!(fieldState.error || errors?.monitoringProtocol)}
                    errorMessage={fieldState.error?.message || errors?.monitoringProtocol?.message}
                  />
                </>
              )}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step10_CrisisIntervention;

