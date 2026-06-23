import React from 'react';
import { Box, Grid, Typography, IconButton, Divider } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { ExtractedLeadData } from '../types';
import { Tooltip } from "@mui/material";

interface InfoCardProps {
  title: string;
  icon: React.ReactNode;
  data: ExtractedLeadData;
  fields: Array<{
    label: string;
    value: string;
  }>;
  onEditClick: () => void;
  disabled?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  icon,
  data,
  fields,
  onEditClick,
  disabled = false,
}) => {
  const isDisabled = disabled || data.isFinalStatus;


  return (
    <Grid
      size={{ xs: 12, sm: 4, md: 4, lg: 4 }}
      sx={{
        border: '1px solid #d0d4d9',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        padding: { xs: 1.5, sm: 2 },
        height: '210px',
        minHeight: 'auto',
        minWidth: 0,
        flex: { xs: '0 0 100%', sm: '1 1 0%' },
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        alignSelf: 'flex-start',
      }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 1.25,
        }}
      >
        <Grid size="auto" sx={{ minWidth: 0 }}>
          <Grid container sx={{ alignItems: 'center', gap: 1, minWidth: 0 }}>
            {icon}
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontSize: { xs: '15px', sm: '16px' },
                fontWeight: 500,
                color: '#4b4a4a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </Typography>
          </Grid>
        </Grid>
        <Grid size="auto">
          <Tooltip
            title={
              disabled
                ? "You don't have permission"
                : data.status?.toUpperCase() === "COMPLETED"
                  ? "This lead is finalized. Please edit details from the Resident section."
                  : data.status?.toUpperCase() === "REJECTED"
                    ? "This lead has been rejected and can no longer be edited."
                    : ""
            }
            arrow
            disableHoverListener={!isDisabled}
            disableFocusListener={!isDisabled}
            disableTouchListener={!isDisabled}
          >
            <Box>
              <IconButton
                sx={{
                  padding: '4px',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
                onClick={onEditClick}
                disabled={isDisabled}
              >
                <EditOutlinedIcon sx={{ fontSize: '18px', color: '#757775' }} />
              </IconButton>
            </Box>
          </Tooltip>

        </Grid>
      </Grid>

      <Divider sx={{ marginBottom: 1.25 }} />

      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }}>
          {fields.map((field, index) => (
            <Box
              key={index}
              sx={{
                marginBottom: index < fields.length - 1 ? 1 : 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '14px',
                    color: '#636262',
                    flexShrink: 0,
                    minWidth: { xs: '100px', sm: '110px' },
                  }}
                >
                  {field.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '14px',
                    color: '#212121',
                    flex: 1,
                    minWidth: 0,
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  : {field.value != null && field.value !== '' ? String(field.value) : 'N/A'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default InfoCard;
