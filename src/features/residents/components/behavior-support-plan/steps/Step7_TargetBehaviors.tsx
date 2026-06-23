import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, Tabs, Tab, Typography } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Control, Controller, useWatch, UseFormSetValue } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomTextArea from '../../../../../components/custom-text-area/custom-textarea';
import CustomButton from '../../../../../components/custom-buttons/custom-buttons';

interface Step7Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
  setValue?: UseFormSetValue<any>;
}

interface Behavior {
  id: string;
  behaviorName: string;
  replacedTargetBehaviors?: string;
  definition: string;
  teachingProtocol?: string;
  precursorBehaviors?: string;
  antecedents?: string;
  hypothesizedFunctions?: string;
}

const Step7_TargetBehaviors: React.FC<Step7Props> = ({ control, mode = "new", setValue }) => {
  const [activeTab, setActiveTab] = useState(0);
  const hasInitializedRef = useRef(false);
  
  // Watch form values for behaviors
  const formIncreaseBehaviors = useWatch({ control, name: 'increaseBehaviors' }) || [];
  const formDecreaseBehaviors = useWatch({ control, name: 'decreaseBehaviors' }) || [];
  
  const [increaseBehaviors, setIncreaseBehaviors] = useState<Behavior[]>([
    { id: '1', behaviorName: '', replacedTargetBehaviors: '', definition: '', teachingProtocol: '' }
  ]);
  const [decreaseBehaviors, setDecreaseBehaviors] = useState<Behavior[]>([
    { id: '1', behaviorName: '', precursorBehaviors: '', definition: '', antecedents: '', hypothesizedFunctions: '' }
  ]);

  // Initialize local state from form values when component mounts or form values change
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Initialize from form values if they exist and have data
      if (formIncreaseBehaviors && Array.isArray(formIncreaseBehaviors) && formIncreaseBehaviors.length > 0) {
        const formattedIncrease = formIncreaseBehaviors.map((behavior: any, index: number) => ({
          id: behavior.id || `increase_${Date.now()}_${index}`,
          behaviorName: behavior.behaviorName || '',
          replacedTargetBehaviors: behavior.replacedTargetBehaviors || '',
          definition: behavior.definition || '',
          teachingProtocol: behavior.teachingProtocol || '',
        }));
        setIncreaseBehaviors(formattedIncrease);
        // Also set individual field values for compatibility with existing Controllers
        formattedIncrease.forEach((behavior) => {
          if (setValue) {
            setValue(`increase_behaviorName_${behavior.id}`, behavior.behaviorName, { shouldValidate: false });
            setValue(`increase_replacedTargetBehaviors_${behavior.id}`, behavior.replacedTargetBehaviors || '', { shouldValidate: false });
            setValue(`increase_definition_${behavior.id}`, behavior.definition, { shouldValidate: false });
            setValue(`increase_teachingProtocol_${behavior.id}`, behavior.teachingProtocol || '', { shouldValidate: false });
          }
        });
      }
      
      if (formDecreaseBehaviors && Array.isArray(formDecreaseBehaviors) && formDecreaseBehaviors.length > 0) {
        const formattedDecrease = formDecreaseBehaviors.map((behavior: any, index: number) => ({
          id: behavior.id || `decrease_${Date.now()}_${index}`,
          behaviorName: behavior.behaviorName || '',
          precursorBehaviors: behavior.precursorBehaviors || '',
          definition: behavior.definition || '',
          antecedents: behavior.antecedents || '',
          hypothesizedFunctions: behavior.hypothesizedFunctions || '',
        }));
        setDecreaseBehaviors(formattedDecrease);
        // Also set individual field values for compatibility with existing Controllers
        formattedDecrease.forEach((behavior) => {
          if (setValue) {
            setValue(`decrease_behaviorName_${behavior.id}`, behavior.behaviorName, { shouldValidate: false });
            setValue(`decrease_antecedents_${behavior.id}`, behavior.antecedents || '', { shouldValidate: false });
            setValue(`decrease_precursorBehaviors_${behavior.id}`, behavior.precursorBehaviors || '', { shouldValidate: false });
            setValue(`decrease_hypothesizedFunctions_${behavior.id}`, behavior.hypothesizedFunctions || '', { shouldValidate: false });
            setValue(`decrease_definition_${behavior.id}`, behavior.definition, { shouldValidate: false });
          }
        });
      }
      hasInitializedRef.current = true;
    }
  }, [formIncreaseBehaviors, formDecreaseBehaviors, setValue]);

  // Sync local state to form whenever behaviors change
  useEffect(() => {
    if (hasInitializedRef.current && setValue) {
      setValue('increaseBehaviors', increaseBehaviors, { shouldValidate: false });
    }
  }, [increaseBehaviors, setValue]);

  useEffect(() => {
    if (hasInitializedRef.current && setValue) {
      setValue('decreaseBehaviors', decreaseBehaviors, { shouldValidate: false });
    }
  }, [decreaseBehaviors, setValue]);

  const addBehavior = (setter: React.Dispatch<React.SetStateAction<Behavior[]>>, behaviors: Behavior[], type: 'increase' | 'decrease') => {
    if (mode !== "view") {
      if (type === 'increase') {
        const newBehavior = { id: Date.now().toString(), behaviorName: '', replacedTargetBehaviors: '', definition: '', teachingProtocol: '' };
        const updated = [...behaviors, newBehavior];
        setter(updated);
        if (setValue) {
          setValue('increaseBehaviors', updated, { shouldValidate: false });
        }
      } else {
        const newBehavior = { id: Date.now().toString(), behaviorName: '', precursorBehaviors: '', definition: '', antecedents: '', hypothesizedFunctions: '' };
        const updated = [...behaviors, newBehavior];
        setter(updated);
        if (setValue) {
          setValue('decreaseBehaviors', updated, { shouldValidate: false });
        }
      }
    }
  };

  const removeBehavior = (setter: React.Dispatch<React.SetStateAction<Behavior[]>>, behaviors: Behavior[], id: string, type: 'increase' | 'decrease') => {
    if (mode !== "view" && behaviors.length > 1) {
      const updated = behaviors.filter(behavior => behavior.id !== id);
      setter(updated);
      if (setValue) {
        if (type === 'increase') {
          setValue('increaseBehaviors', updated, { shouldValidate: false });
        } else {
          setValue('decreaseBehaviors', updated, { shouldValidate: false });
        }
      }
    }
  };

  const updateBehavior = (setter: React.Dispatch<React.SetStateAction<Behavior[]>>, behaviors: Behavior[], id: string, field: keyof Behavior, value: string, fieldPrefix: 'increase' | 'decrease') => {
    const updated = behaviors.map(behavior => behavior.id === id ? { ...behavior, [field]: value } : behavior);
    setter(updated);
    // Also update the individual form field for compatibility
    if (setValue) {
      setValue(`${fieldPrefix}_${field}_${id}`, value, { shouldValidate: false });
    }
  };

  const renderIncreaseBehavior = (behavior: Behavior, index: number) => {
    return (
      <Grid key={behavior.id} size={{ xs: 12 }} sx={{ mb: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Grid size={{ xs: 12, sm: 10 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
              Target Behaviors for Increase #{index + 1}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Grid container sx={{ justifyContent: 'flex-end' }}>
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={() => removeBehavior(setIncreaseBehaviors, increaseBehaviors, behavior.id, 'increase')}
                sx={{ minWidth: 'auto', padding: '4px 8px', border: 'none' }}
                disabled={mode === "view"}
              >
                <Delete sx={{ fontSize: '18px', color: mode === "view" ? '#9CA3AF' : '#DC2626' }} />
              </CustomButton>
            </Grid>
          </Grid>
        </Grid>

        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name={`increase_behaviorName_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Behavior Name" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name={`increase_behaviorName_${behavior.id}`}
                        value={behavior.behaviorName}
                        onChange={(e) => {
                          updateBehavior(setIncreaseBehaviors, increaseBehaviors, behavior.id, 'behaviorName', e.target.value, 'increase');
                          field.onChange(e.target.value);
                        }}
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
                name={`increase_replacedTargetBehaviors_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Replaced Target Behaviors" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name={`increase_replacedTargetBehaviors_${behavior.id}`}
                        value={behavior.replacedTargetBehaviors || ''}
                        onChange={(e) => {
                          updateBehavior(setIncreaseBehaviors, increaseBehaviors, behavior.id, 'replacedTargetBehaviors', e.target.value, 'increase');
                          field.onChange(e.target.value);
                        }}
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
                name={`increase_definition_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Definition" />
                    </Grid>
                    <Grid>
                      <CustomTextArea
                        name={`increase_definition_${behavior.id}`}
                        placeholder="Enter"
                        value={behavior.definition}
                        onChange={(e) => {
                          updateBehavior(setIncreaseBehaviors, increaseBehaviors, behavior.id, 'definition', e.target.value, 'increase');
                          field.onChange(e.target.value);
                        }}
                        minRow={4}
                        isDisabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name={`increase_teachingProtocol_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Teaching Protocol" />
                    </Grid>
                    <Grid>
                      <CustomTextArea
                        name={`increase_teachingProtocol_${behavior.id}`}
                        placeholder="Enter"
                        value={behavior.teachingProtocol || ''}
                        onChange={(e) => {
                          updateBehavior(setIncreaseBehaviors, increaseBehaviors, behavior.id, 'teachingProtocol', e.target.value, 'increase');
                          field.onChange(e.target.value);
                        }}
                        minRow={4}
                        isDisabled={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    );
  };

  const renderDecreaseBehavior = (behavior: Behavior, index: number) => {
    return (
      <Grid key={behavior.id} size={{ xs: 12 }} sx={{ mb: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Grid size={{ xs: 12, sm: 10 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
              Target Behaviors for Decrease #{index + 1}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Grid container sx={{ justifyContent: 'flex-end' }}>
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={() => removeBehavior(setDecreaseBehaviors, decreaseBehaviors, behavior.id, 'decrease')}
                sx={{ minWidth: 'auto', padding: '4px 8px', border: 'none' }}
                disabled={mode === "view"}
              >
                <Delete sx={{ fontSize: '18px', color: mode === "view" ? '#9CA3AF' : '#DC2626' }} />
              </CustomButton>
            </Grid>
          </Grid>
        </Grid>

        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container spacing={2}>
            {/* Row 1: Behavior Name | Antecedents */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name={`decrease_behaviorName_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Behavior Name" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name={`decrease_behaviorName_${behavior.id}`}
                        value={behavior.behaviorName}
                        onChange={(e) => {
                          updateBehavior(setDecreaseBehaviors, decreaseBehaviors, behavior.id, 'behaviorName', e.target.value, 'decrease');
                          field.onChange(e.target.value);
                        }}
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
                name={`decrease_antecedents_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Antecedents" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name={`decrease_antecedents_${behavior.id}`}
                        value={behavior.antecedents || ''}
                        onChange={(e) => {
                          updateBehavior(setDecreaseBehaviors, decreaseBehaviors, behavior.id, 'antecedents', e.target.value, 'decrease');
                          field.onChange(e.target.value);
                        }}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            {/* Row 2: Precursor Behaviors | Hypothesized Functions */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name={`decrease_precursorBehaviors_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Precursor Behaviors" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name={`decrease_precursorBehaviors_${behavior.id}`}
                        value={behavior.precursorBehaviors || ''}
                        onChange={(e) => {
                          updateBehavior(setDecreaseBehaviors, decreaseBehaviors, behavior.id, 'precursorBehaviors', e.target.value, 'decrease');
                          field.onChange(e.target.value);
                        }}
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
                name={`decrease_hypothesizedFunctions_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Hypothesized Functions" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name={`decrease_hypothesizedFunctions_${behavior.id}`}
                        value={behavior.hypothesizedFunctions || ''}
                        onChange={(e) => {
                          updateBehavior(setDecreaseBehaviors, decreaseBehaviors, behavior.id, 'hypothesizedFunctions', e.target.value, 'decrease');
                          field.onChange(e.target.value);
                        }}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
            {/* Row 3: Definition (full width) */}
            <Grid size={{ xs: 12 }}>
              <Controller
                name={`decrease_definition_${behavior.id}`}
                control={control}
                render={({ field }) => (
                  <Grid container direction="column" spacing={0.5}>
                    <Grid>
                      <CustomLabel label="Definition" />
                    </Grid>
                    <Grid>
                      <CustomInput
                        placeholder="Enter"
                        name={`decrease_definition_${behavior.id}`}
                        value={behavior.definition}
                        onChange={(e) => {
                          updateBehavior(setDecreaseBehaviors, decreaseBehaviors, behavior.id, 'definition', e.target.value, 'decrease');
                          field.onChange(e.target.value);
                        }}
                        bgWhite
                        disableField={mode === "view"}
                      />
                    </Grid>
                  </Grid>
                )}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    );
  };

  return (
    <Grid container spacing={2}>
      {/* Tabs and Add Button */}
      <Grid size={{ xs: 12 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Grid>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Increase" />
              <Tab label="Decrease" />
            </Tabs>
          </Grid>
          <Grid>
            <CustomButton
              variant="secondary"
              size="sm"
              onClick={() => {
                if (activeTab === 0) {
                  addBehavior(setIncreaseBehaviors, increaseBehaviors, 'increase');
                } else {
                  addBehavior(setDecreaseBehaviors, decreaseBehaviors, 'decrease');
                }
              }}
              disabled={mode === "view"}
              sx={{ border: 'none' }}
            >
              + Add Behavior
            </CustomButton>
          </Grid>
        </Grid>
      </Grid>

      {/* Tab Content */}
      <Grid size={{ xs: 12 }}>
        {activeTab === 0 && (
          <Grid container spacing={2} direction="column">
            {increaseBehaviors.map((behavior, index) => renderIncreaseBehavior(behavior, index))}
          </Grid>
        )}
        {activeTab === 1 && (
          <Grid container spacing={2} direction="column">
            {decreaseBehaviors.map((behavior, index) => renderDecreaseBehavior(behavior, index))}
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default Step7_TargetBehaviors;

