import React, { useState } from 'react';
import { Grid, Accordion, AccordionSummary, AccordionDetails, Paper, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Control, Controller } from 'react-hook-form';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../components/custom-text-area/custom-textarea';

interface Step8Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

const Step8_AntecedentStrategies: React.FC<Step8Props> = ({ control, mode = "new" }) => {
  const [expanded, setExpanded] = useState<string | false>('general');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const generalProactiveStrategies = [
    'Maintain consistent daily routines and clear expectations',
    'Provide advance notice of schedule changes',
    'Use visual supports and communication aids',
    'Ensure adequate sleep, nutrition, and exercise',
    'Create a calm, structured environment',
    'Use positive reinforcement for appropriate behaviors',
    'Monitor and address medical/health concerns promptly',
  ];

  return (
    <Grid container spacing={2}>
      {/* General Proactive Strategies (Policy) */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
          }}
        >
          <Accordion
            expanded={expanded === 'general'}
            onChange={handleAccordionChange('general')}
            sx={{
              boxShadow: 'none',
              border: 'none',
              width: '100%',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                padding: 0,
                minHeight: 'auto',
                '& .MuiAccordionSummary-content': {
                  margin: 0,
                },
              }}
            >
              <CustomLabel
                label="General Proactive Strategies (Policy)"
                style={{ fontSize: '16px', fontWeight: 600 }}
              />
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '16px 0 0 0' }}>
              <Paper
                sx={{
                  border: '1px solid #E3ECEF',
                  borderRadius: '8px',
                  p: 2,
                  backgroundColor: '#F5F9FC',
                }}
              >
                <Grid container spacing={1} direction="column">
                  {generalProactiveStrategies.map((strategy, index) => (
                    <Grid key={index}>
                      <CustomLabel
                        label={`• ${strategy}`}
                        style={{ fontSize: '14px', color: '#2C2D2C' }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>

      {/* Proactive Strategies Specific to Client */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          spacing={1}
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
              Proactive Strategies Specific to Client
            </Typography>
          </Grid>
          <Grid>
            <CustomLabel
              label="Client-Specific Proactive Strategies"
              isRequired={true}
              style={{ fontSize: '14px', marginBottom: '8px' }}
            />
          </Grid>
          <Grid>
            <Controller
              name="clientSpecificProactiveStrategies"
              control={control}
              rules={{
                required: "Client-Specific Proactive Strategies is required",
              }}
              render={({ field, fieldState }) => (
                <CustomTextArea
                  name="clientSpecificProactiveStrategies"
                  placeholder="Enter"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                    minRow={6}
                    isDisabled={mode === "view"}
                  hasError={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  />
              )}
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Reinforcement Strategies */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          spacing={2}
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
              Reinforcement Strategies
            </Typography>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <CustomLabel
                  label="Rationale & Description"
                  isRequired={true}
                  style={{ fontSize: '14px', marginBottom: '8px' }}
                />
              </Grid>
              <Grid>
                <Controller
                  name="reinforcementRationale"
                  control={control}
                  rules={{
                    required: "Rationale & Description is required",
                  }}
                  render={({ field, fieldState }) => (
                    <CustomTextArea
                      name="reinforcementRationale"
                      placeholder="Enter"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    minRow={6}
                    isDisabled={mode === "view"}
                      hasError={!!fieldState.error}
                      errorMessage={fieldState.error?.message}
                  />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <CustomLabel
                  label="Protocol (Numbered Steps)"
                  isRequired={true}
                  style={{ fontSize: '14px', marginBottom: '8px' }}
                />
              </Grid>
              <Grid>
                <Controller
                  name="reinforcementProtocol"
                  control={control}
                  rules={{
                    required: "Protocol (Numbered Steps) is required",
                  }}
                  render={({ field, fieldState }) => (
                    <CustomTextArea
                      name="reinforcementProtocol"
                      placeholder="Enter"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    minRow={6}
                    isDisabled={mode === "view"}
                      hasError={!!fieldState.error}
                      errorMessage={fieldState.error?.message}
                  />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Reactive / Consequence Strategies */}
      <Grid size={{ xs: 12 }}>
        <Grid
          container
          direction="column"
          spacing={2}
          sx={{
            border: '1px solid #E3ECEF',
            borderRadius: '8px',
            p: 2,
            mt: 2,
          }}
        >
          <Grid>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
              Reactive / Consequence Strategies
            </Typography>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <CustomLabel
                  label="Behavior"
                  style={{ fontSize: '14px', marginBottom: '8px' }}
                />
              </Grid>
              <Grid>
                <Controller
                  name="reactiveBehavior"
                  control={control}
                  render={({ field }) => (
                    <CustomTextArea
                      name="reactiveBehavior"
                      placeholder="Enter"
                      value={field.value}
                      onChange={field.onChange}
                    minRow={4}
                    isDisabled={mode === "view"}
                  />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid>
            <Grid container direction="column" spacing={0.5}>
              <Grid>
                <CustomLabel
                  label="Step-by-step Procedure"
                  style={{ fontSize: '14px', marginBottom: '8px' }}
                />
              </Grid>
              <Grid>
                <Controller
                  name="reactiveProcedure"
                  control={control}
                  render={({ field }) => (
                    <CustomTextArea
                      name="reactiveProcedure"
                      placeholder="Enter"
                      value={field.value}
                      onChange={field.onChange}
                    minRow={6}
                    isDisabled={mode === "view"}
                  />
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

export default Step8_AntecedentStrategies;

