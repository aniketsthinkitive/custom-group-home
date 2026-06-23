/**
 * Login Image Component
 * Displays a single login image
 */

import React from 'react';
import { Box } from '@mui/material';
import LoginImage from '../../../assets/images/loginImage.png';

const LoginSlideshow: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        backgroundImage: `url(${LoginImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f0f0f0',
      }}
    />
  );
};

export default LoginSlideshow;
