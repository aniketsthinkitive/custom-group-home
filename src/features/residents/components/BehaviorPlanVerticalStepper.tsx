import React from 'react';
import { Grid } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import CustomLabel from '../../../components/custom-label/custom-label';

export interface BehaviorPlanVerticalStepperProps {
  activeStep: number;
  completedSteps: Set<number>;
  onStepChange: (step: number) => void;
  steps: string[];
}

const BehaviorPlanVerticalStepper: React.FC<BehaviorPlanVerticalStepperProps> = ({
  activeStep,
  completedSteps,
  onStepChange,
  steps,
}) => {
  return (
    <Grid container direction="column">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(index);
        const isActive = activeStep === index;
        const stepNumber = index + 1;

        return (
          <Grid key={index} container direction="column">
            {/* Step Item */}
            <Grid
              onClick={() => onStepChange(index)}
              sx={{
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: isActive ? '#0A2E45' : 'transparent',
                '&:hover': {
                  backgroundColor: isActive ? '#0A2E45' : '#F5F5F5',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
                {/* Step Indicator */}
                <Grid>
                  {isCompleted ? (
                    <CheckCircle 
                      sx={{ 
                        color: '#4CAF50', 
                        fontSize: '24px',
                        transition: 'all 0.3s ease',
                      }} 
                    />
                  ) : (
                    <Grid
                      sx={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#0A2E45' : '#E7E9EB',
                        color: isActive ? '#FFFFFF' : '#757775',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {stepNumber}
                    </Grid>
                  )}
                </Grid>

                {/* Step Label */}
                <Grid sx={{ flex: 1 }}>
                  <CustomLabel
                    label={step}
                    style={{
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#0A2E45' : '#424342',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <Grid
                sx={{
                  width: '2px',
                  height: '24px',
                  backgroundColor: isCompleted ? '#4CAF50' : '#E7E9EB',
                  marginLeft: '20px',
                  marginTop: '4px',
                  marginBottom: '4px',
                  transition: 'all 0.3s ease',
                }}
              />
            )}
          </Grid>
        );
      })}
    </Grid>
  );
};

export default BehaviorPlanVerticalStepper;
