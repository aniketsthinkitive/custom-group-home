import React from 'react';
import { Grid, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import type { Control, FieldErrors, FieldValues } from 'react-hook-form';

interface Step2Props {
  control: Control<FieldValues>;
  errors?: FieldErrors<FieldValues>;
  mode?: "new" | "draft" | "view";
}

const Step2PropertyDamage: React.FC<Step2Props> = () => {
  // Property Damage Matrix - exact text as provided
  const damageMatrix = [
    { damage: "$50 per hole in the wall", consequence: "" },
    { damage: "$100 per damaged window", consequence: "" },
    { damage: "$50 for damage to small furniture (love seats, dining room chairs, etc.)", consequence: "" },
    { damage: "$100 for damage to big furniture (couches, beds, tables)", consequence: "" },
    { damage: "$100 for electronics under $500", consequence: "" },
    { damage: "$200 for electronics over $500", consequence: "" },
    { damage: "$150 per damaged door if it is a regular door", consequence: "" },
    { damage: "$300 per damaged door if it has magnetic locks", consequence: "" },
    { damage: "$500 per damaged car", consequence: "" },
  ];
  
  return (
    <Grid container spacing={2}>
      {/* Section Title */}
      <Grid size={{ xs: 12 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#1F2A37', mb: 2 }}>
          Property Damage Consequences
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
          {/* Property Damage Rule */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#424342',
                lineHeight: '1.8',
              }}
            >
              Property Damage is the responsibility of the individual/rep payee of the individual that causes the damage. Restitution is broken down by the matrix below:
            </Typography>
          </Grid>

          {/* Property Damage Matrix Card */}
          <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
            <Box
              sx={{
                backgroundColor: '#F5F7FA',
                border: '1px solid #E3ECEF',
                borderRadius: '8px',
                padding: '16px',
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
                Property Damage Consequence Matrix:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#1F2A37', borderBottom: '2px solid #E3ECEF' }}>
                        Type of Damage
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {damageMatrix.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: '14px', color: '#424342', borderBottom: '1px solid #E3ECEF' }}>
                          {row.damage}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>

          {/* Note at the bottom */}
          <Grid size={{ xs: 12 }}>
            <Typography
              sx={{
                fontSize: '14px',
                color: '#424342',
                lineHeight: '1.8',
                fontStyle: 'italic',
              }}
            >
              The above rules are designed to address general expectations of individuals. These rules may not address every situation that arises within the home and community. Individuals should consult with staff for feedback and direction when new situations arise or consult with the treatment team.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Step2PropertyDamage;

