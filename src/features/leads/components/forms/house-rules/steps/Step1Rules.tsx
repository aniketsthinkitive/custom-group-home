import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import type { Control, FieldErrors, FieldValues } from 'react-hook-form';

interface Step1Props {
  control: Control<FieldValues>;
  errors?: FieldErrors<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Step1Rules: React.FC<Step1Props> = () => {
  // House rules content - exact text as provided
  const houseRules = [
    "All persons should be treated with dignity and respect. Use a level voice tone, knock before entering doors, no property destruction (see note below for property destruction)",
    "It is asked that you follow your daily schedule and participate in programming activities.",
    "Smoking in designated areas only. Smoking is not allowed in company vehicles or staff vehicles.",
    "To allow for adequate rest, individuals should be in their rooms from 10:45pm until 6am. Individuals should let staff know if they need to smoke at night and limit cigarette times to 10 minutes overnight. Individuals should not congregate outside to smoke overnight.",
    "Please use your bedroom for naps and for sleeping.",
    "Quiet time is between 9pm and 6am. Always keep music and television at appropriate levels and avoid loud activities that may disturb the other individuals in the house.",
    "Meals will be eaten in the kitchen and dining areas. Snacks and drinks are allowed in the common areas. Drinks are allowed in bedrooms, but please limit food items. Please make sure to clean up after yourself.",
    "Hand washing and/or gloves are required for food handling and meal preparation.",
    "Mealtimes are from 7:30-9:00am, 11:30-12:30pm, and 4:30-6:15pm. Snacks are available upon request at any time. Food is always available to individuals. The kitchen should not be used to cook full meals during quiet time (unless permission is given i.e. an appointment ran late or individuals haven't had a meal yet).",
    "Cabinets can and will be locked for safety reasons, no food cabinets will be locked unless requested by an individual (to prevent food from being stolen), and will be immediately unlocked at the request of the individual who's food items are locked.",
    "Individuals may not record or take photos of other individuals at any time.",
    "All individuals have individual programs that they are working on to transition. Do not discuss your program or another individuals' program as it may be different than yours.",
    "Individuals should be dressed appropriately when in common areas. This means wearing shoes/slippers and being fully clothed. Individuals should use an appropriate cover when in nightclothes (i.e. robe, pants or shorts not boxers or briefs, proper top covering shirt, t-shirt).",
    "No visitors before 8am or after 9pm. Exceptions may be made on an individual basis. Notice for visitors will require at least 24-hour notification and need to be approved by the House Coordinator or Program Manager. Please refrain from having unscheduled or \"pop\" in visits.",
    "Seatbelts are required in company vehicles and staff vehicles.",
    "Do not horseplay as it could cause injury or be misinterpreted as aggression or fighting.",
    "Individuals are not to use alcohol or drugs at any time.",
    "Lighters are not permitted to be held by individuals or on the premises. There are flameless lighters placed in the designated smoking areas. We are a flameless home.",
    "Selling, buying, borrowing, bartering, or contracting (of any kind) with other individuals is prohibited. (i.e., money, cigarettes, personal items, foods)",
    "Stealing of any kind is prohibited.",
    "Individuals are not allowed to purchase over-the-counter medications. All medications, including over-the-counter medications, must have a doctor's orders and be stored in the medication cart.",
    "Individuals are not allowed to enter other individuals' bedrooms unless specific permission is given.",
    "Any physical incidents, sign of discomfort, or other sicknesses or areas of concern should be reported to staff and/or supervisor on duty.",
  ];
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          House Rules
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
          {/* House Rules Card */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                backgroundColor: '#F5F7FA',
                border: '1px solid #E3ECEF',
                borderRadius: '8px',
                padding: '16px',
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1F2A37',
                  mb: 2,
                }}
              >
                Common Actions For Change – House Rules:
              </Typography>
              <Box component="ul" sx={{ margin: 0, paddingLeft: '20px' }}>
                {houseRules.map((rule, index) => (
                  <Box
                    component="li"
                    key={index}
                    sx={{
                      fontSize: '14px',
                      color: '#424342',
                      lineHeight: '1.8',
                      mb: 1.5,
                    }}
                  >
                    {rule}
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step1Rules;

