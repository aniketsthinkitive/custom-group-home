import React from 'react';
import { Box, Grid, Typography, Divider } from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import dayjs from 'dayjs';

interface RejectionCardProps {
  rejectionReason: string;
  rejectedAt: string | null;
}

const RejectionCard: React.FC<RejectionCardProps> = ({
  rejectionReason,
  rejectedAt,
}) => {
  return (
    <Grid
      size={{ xs: 12 }}
      sx={{
        border: '2px solid #e8ebee',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        padding: { xs: 2, sm: 2.5 },
        minHeight: 'auto',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <Grid
        container
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 1.5,
        }}
      >
        <Grid size="auto">
          <Grid container sx={{ alignItems: 'center', gap: 1 }}>
            <WarningAmberRoundedIcon sx={{ color: '#D32F2F', fontSize: '20px' }} />
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '15px', sm: '16px' },
                fontWeight: 500,
                color: '#4b4a4a',
              }}
            >
              Rejection Information
            </Typography>
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ marginBottom: 2, backgroundColor: '#FFEBEE' }} />

      <Grid container spacing={1}>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ marginBottom: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  color: '#636262',
                  minWidth: { xs: '120px', sm: '140px' },
                  flexShrink: 0,
                }}
              >
                Reason
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  color: '#212121',
                  flex: 1,
                  wordBreak: 'break-word',
                }}
              >
                : {rejectionReason}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ marginBottom: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  color: '#636262',
                  minWidth: { xs: '120px', sm: '140px' },
                  flexShrink: 0,
                }}
              >
                Rejected On
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  color: '#212121',
                  flex: 1,
                }}
              >
                : {rejectedAt ? dayjs(rejectedAt).format('DD MMM YYYY [at] hh:mm A') : 'Not Provided'}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default RejectionCard;
