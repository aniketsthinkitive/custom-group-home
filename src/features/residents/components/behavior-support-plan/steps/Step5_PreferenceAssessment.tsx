import React, { useState, useEffect, useRef } from 'react';
import { Grid, Paper, Typography } from '@mui/material';
import { Control, Controller, useWatch, UseFormSetValue } from 'react-hook-form';
import CustomInput from '../../../../../components/custom-input/custom-input';
import CustomLabel from '../../../../../components/custom-label/custom-label';
import CustomButton from '../../../../../components/custom-buttons/custom-buttons';

interface Step5Props {
  control: Control<any>;
  mode?: "new" | "draft" | "view";
  setValue?: UseFormSetValue<any>;
}

interface PreferenceItem {
  id: string;
  value: string;
}

const Step5_PreferenceAssessment: React.FC<Step5Props> = ({ control, mode = "new", setValue }) => {
  const hasInitializedRef = useRef(false);
  
  // Watch form values for preference arrays
  const formOnSiteActivities = useWatch({ control, name: 'onSiteActivities' }) || [];
  const formCommunityActivities = useWatch({ control, name: 'communityActivities' }) || [];
  const formItemsFood = useWatch({ control, name: 'itemsFood' }) || [];
  
  const [onSiteActivities, setOnSiteActivities] = useState<PreferenceItem[]>([
    { id: '1', value: '' }
  ]);
  const [communityActivities, setCommunityActivities] = useState<PreferenceItem[]>([
    { id: '1', value: '' }
  ]);
  const [itemsFood, setItemsFood] = useState<PreferenceItem[]>([
    { id: '1', value: '' }
  ]);

  // Initialize local state from form values when component mounts or form values change
  useEffect(() => {
    if (!hasInitializedRef.current) {
      // Initialize from form values if they exist and have data
      if (formOnSiteActivities && Array.isArray(formOnSiteActivities) && formOnSiteActivities.length > 0) {
        const formatted = formOnSiteActivities.map((item: any, index: number) => ({
          id: item.id || `onSite_${Date.now()}_${index}`,
          value: item.value || '',
        }));
        setOnSiteActivities(formatted);
        // Also set individual field values for compatibility with existing Controllers
        formatted.forEach((item) => {
          if (setValue) {
            setValue(`onSiteActivity_${item.id}`, item.value, { shouldValidate: false });
          }
        });
      }
      
      if (formCommunityActivities && Array.isArray(formCommunityActivities) && formCommunityActivities.length > 0) {
        const formatted = formCommunityActivities.map((item: any, index: number) => ({
          id: item.id || `community_${Date.now()}_${index}`,
          value: item.value || '',
        }));
        setCommunityActivities(formatted);
        // Also set individual field values for compatibility with existing Controllers
        formatted.forEach((item) => {
          if (setValue) {
            setValue(`communityActivity_${item.id}`, item.value, { shouldValidate: false });
          }
        });
      }
      
      if (formItemsFood && Array.isArray(formItemsFood) && formItemsFood.length > 0) {
        const formatted = formItemsFood.map((item: any, index: number) => ({
          id: item.id || `itemFood_${Date.now()}_${index}`,
          value: item.value || '',
        }));
        setItemsFood(formatted);
        // Also set individual field values for compatibility with existing Controllers
        formatted.forEach((item) => {
          if (setValue) {
            setValue(`itemFood_${item.id}`, item.value, { shouldValidate: false });
          }
        });
      }
      hasInitializedRef.current = true;
    }
  }, [formOnSiteActivities, formCommunityActivities, formItemsFood, setValue]);

  // Sync local state to form whenever items change
  useEffect(() => {
    if (hasInitializedRef.current && setValue) {
      setValue('onSiteActivities', onSiteActivities, { shouldValidate: false });
    }
  }, [onSiteActivities, setValue]);

  useEffect(() => {
    if (hasInitializedRef.current && setValue) {
      setValue('communityActivities', communityActivities, { shouldValidate: false });
    }
  }, [communityActivities, setValue]);

  useEffect(() => {
    if (hasInitializedRef.current && setValue) {
      setValue('itemsFood', itemsFood, { shouldValidate: false });
    }
  }, [itemsFood, setValue]);

  const addItem = (setter: React.Dispatch<React.SetStateAction<PreferenceItem[]>>, items: PreferenceItem[], formFieldName: 'onSiteActivities' | 'communityActivities' | 'itemsFood') => {
    if (mode !== "view") {
      const newItem = { id: Date.now().toString(), value: '' };
      const updated = [...items, newItem];
      setter(updated);
      if (setValue) {
        setValue(formFieldName, updated, { shouldValidate: false });
      }
    }
  };

  const updateItem = (setter: React.Dispatch<React.SetStateAction<PreferenceItem[]>>, items: PreferenceItem[], id: string, value: string, formFieldName: 'onSiteActivities' | 'communityActivities' | 'itemsFood', fieldPrefix: 'onSiteActivity' | 'communityActivity' | 'itemFood') => {
    const updated = items.map(item => item.id === id ? { ...item, value } : item);
    setter(updated);
    // Also update the individual form field for compatibility
    if (setValue) {
      setValue(`${fieldPrefix}_${id}`, value, { shouldValidate: false });
      setValue(formFieldName, updated, { shouldValidate: false });
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ border: '1px solid #E3ECEF', borderRadius: '8px', p: 2 }}>
          <Grid container direction="column" spacing={2}>
            {/* Header */}
            <Grid>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2A37' }}>
                Preference Assessment
              </Typography>
            </Grid>

            {/* Content - Three columns */}
            <Grid container spacing={2}>
              {/* On-Site Activities */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Grid container direction="column" spacing={2}>
                  <Grid>
                    <CustomLabel
                      label="On-Site Activities"
                      style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1px' }}
                    />
                  </Grid>
                  {onSiteActivities.map((item) => (
                    <Grid key={item.id}>
                      <Controller
                        name={`onSiteActivity_${item.id}`}
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            placeholder="Enter"
                            name={`onSiteActivity_${item.id}`}
                            value={item.value}
                            onChange={(e) => {
                              updateItem(setOnSiteActivities, onSiteActivities, item.id, e.target.value, 'onSiteActivities', 'onSiteActivity');
                              field.onChange(e.target.value);
                            }}
                            bgWhite
                            disableField={mode === "view"}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                  <Grid>
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      onClick={() => addItem(setOnSiteActivities, onSiteActivities, 'onSiteActivities')}
                      disabled={mode === "view"}
                      sx={{
                        border: 'none',
                        '&:hover': {
                          border: 'none',
                        },
                      }}
                    >
                      + Add More
                    </CustomButton>
                  </Grid>
                </Grid>
              </Grid>

              {/* Community Activities */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Grid container direction="column" spacing={2}>
                  <Grid>
                    <CustomLabel
                      label="Community Activities"
                      style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1px' }}
                    />
                  </Grid>
                  {communityActivities.map((item) => (
                    <Grid key={item.id}>
                      <Controller
                        name={`communityActivity_${item.id}`}
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            placeholder="Enter"
                            name={`communityActivity_${item.id}`}
                            value={item.value}
                            onChange={(e) => {
                              updateItem(setCommunityActivities, communityActivities, item.id, e.target.value, 'communityActivities', 'communityActivity');
                              field.onChange(e.target.value);
                            }}
                            bgWhite
                            disableField={mode === "view"}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                  <Grid>
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      onClick={() => addItem(setCommunityActivities, communityActivities, 'communityActivities')}
                      disabled={mode === "view"}
                      sx={{
                        border: 'none',
                        '&:hover': {
                          border: 'none',
                        },
                      }}
                    >
                      + Add More
                    </CustomButton>
                  </Grid>
                </Grid>
              </Grid>

              {/* Items/Food */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Grid container direction="column" spacing={2}>
                  <Grid>
                    <CustomLabel
                      label="Items/Food"
                      style={{ fontSize: '14px', fontWeight: 600, marginBottom: '1px' }}
                    />
                  </Grid>
                  {itemsFood.map((item) => (
                    <Grid key={item.id}>
                      <Controller
                        name={`itemFood_${item.id}`}
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            placeholder="Enter"
                            name={`itemFood_${item.id}`}
                            value={item.value}
                            onChange={(e) => {
                              updateItem(setItemsFood, itemsFood, item.id, e.target.value, 'itemsFood', 'itemFood');
                              field.onChange(e.target.value);
                            }}
                            bgWhite
                            disableField={mode === "view"}
                          />
                        )}
                      />
                    </Grid>
                  ))}
                  <Grid>
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      onClick={() => addItem(setItemsFood, itemsFood, 'itemsFood')}
                      disabled={mode === "view"}
                      sx={{
                        border: 'none',
                        '&:hover': {
                          border: 'none',
                        },
                      }}
                    >
                      + Add More
                    </CustomButton>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Step5_PreferenceAssessment;

