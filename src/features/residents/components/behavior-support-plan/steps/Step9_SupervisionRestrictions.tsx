import React, { useState } from 'react';
import { Grid, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Radio, Paper, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Control, Controller } from 'react-hook-form';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../components/custom-text-area/custom-textarea';

interface Step9Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
}

interface RestrictionCategory {
  id: string;
  label: string;
}

const Step9_SupervisionRestrictions: React.FC<Step9Props> = ({ control, mode = "new" }) => {
  const [expanded, setExpanded] = useState<string | false>('home');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const restrictionCategories: RestrictionCategory[] = [
    { id: 'home', label: 'Home' },
    { id: 'community', label: 'Community' },
    { id: 'work', label: 'Work' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'medicalCare', label: 'Medical Care' },
    { id: 'publicRestrooms', label: 'Public Restrooms' },
    { id: 'electronicsInternet', label: 'Electronics & Internet' },
    { id: 'phoneCalling', label: 'Phone / Calling' },
    { id: 'visitorsFamily', label: 'Visitors & Family' },
    { id: 'holdingMoney', label: 'Holding Money' },
    { id: 'accessToSharps', label: 'Access to Sharps' },
    { id: 'drugsAlcohol', label: 'Drugs / Alcohol' },
    { id: 'roomBodySearches', label: 'Room / Body Searches' },
    { id: 'egressAlarms', label: 'Egress & Alarms' },
  ];

  const statusOptions = [
    { value: 'allowed', label: 'Allowed' },
    { value: 'restricted', label: 'Restricted' },
    { value: 'not_allowed', label: 'Not Allowed' },
    { value: 'na', label: 'N/A' },
  ];

  const renderRestrictionCategory = (category: RestrictionCategory) => {
    return (
      <Grid key={category.id} size={{ xs: 12 }}>
        <Grid
          container
          sx={{
            border: '1px solid #27313F',
            borderRadius: '8px',
            mb: 2,
            boxShadow: '0px 1px 3px rgba(39, 49, 63, 0.2)',
            overflow: 'hidden',
          }}
        >
          <Accordion
            expanded={expanded === category.id}
            onChange={handleAccordionChange(category.id)}
            sx={{
              boxShadow: 'none',
              border: 'none',
              width: '100%',
              borderRadius: '8px',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                padding: '16px',
                minHeight: 'auto',
                '& .MuiAccordionSummary-content': {
                  margin: 0,
                },
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '120%',
                  letterSpacing: '0%',
                  color: '#27313F',
                }}
              >
                {category.label}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '0 16px 16px 16px' }}>
              <Grid container spacing={2} direction="column">
                <Grid size={{ xs: 12 }}>
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel
                        label="Status"
                        style={{ fontSize: '14px', marginBottom: '8px' }}
                      />
                    </Grid>
                    <Grid>
                      <Controller
                        name={`${category.id}Status` as any}
                        control={control}
                        render={({ field }) => (
                          <Grid container spacing={2}>
                            {statusOptions.map((option) => (
                              <Grid key={option.value}>
                                <FormControlLabel
                                  control={
                                    <Radio
                                      checked={field.value === option.value}
                                      onChange={(e) => field.onChange(e.target.value)}
                                      value={option.value}
                                      disabled={mode === "view"}
                                      sx={{
                                        color: '#A9ACA9',
                                        '&.Mui-checked': {
                                          color: '#0A2E45',
                                        },
                                      }}
                                    />
                                  }
                                  label={
                                    <CustomLabel
                                      label={option.label}
                                      style={{ fontSize: '14px', fontWeight: 400, color: '#2C2D2C', margin: 0 }}
                                    />
                                  }
                                />
                              </Grid>
                            ))}
                          </Grid>
                        )}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel
                        label="Note"
                        style={{ fontSize: '14px', marginBottom: '8px' }}
                      />
                    </Grid>
                    <Grid>
                      <Controller
                        name={`${category.id}Note` as any}
                        control={control}
                        render={({ field }) => (
                          <CustomTextArea
                            name={`${category.id}Note`}
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
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    );
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
            border: '1px solid #27313F',
            borderRadius: '8px',
            p: 2,
            mb: 2,
            boxShadow: '0px 1px 3px rgba(39, 49, 63, 0.2)',
            overflow: 'hidden',
          }}
        >
          <Accordion
            expanded={expanded === 'general'}
            onChange={handleAccordionChange('general')}
            sx={{
              boxShadow: 'none',
              border: 'none',
              width: '100%',
              borderRadius: '8px',
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
              <Typography
                sx={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontStyle: 'normal',
                  fontSize: '14px',
                  lineHeight: '120%',
                  letterSpacing: '0%',
                  color: '#27313F',
                }}
              >
                General Proactive Strategies (Policy)
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '16px 0 0 0' }}>
              <Paper
                sx={{
                  border: '1px solid #E3ECEF',
                  borderRadius: '8px',
                  p: 2,
                  backgroundColor: '#FFFFFF',
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

      {restrictionCategories.map(category => renderRestrictionCategory(category))}
    </Grid>
  );
};

export default Step9_SupervisionRestrictions;

