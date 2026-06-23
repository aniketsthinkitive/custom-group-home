import React from 'react';
import { Box, Typography } from '@mui/material';

const PortalDashboardPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Portal Dashboard
      </Typography>
      <Typography variant="body1">
        Welcome to the Guardian/Agent Portal
      </Typography>
    </Box>
  );
};

export default PortalDashboardPage;
