import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  useMediaQuery,
  Grid,
  Typography,
} from '@mui/material';
import { LoginForm } from "../components/LoginForm";
// import logo from '../../../assets/images/logo.svg';
import LoginSlideshow from '../components/LoginSlideshow';
import { theme } from '../../../constant/styles/theme';
import { getDefaultRedirectPath } from '../../../utils/auth';
import { APP_NAME } from '../../../config/branding';

export const LoginPage: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Clear any stale auth data when arriving at login page to prevent redirect loops
  React.useEffect(() => {
    localStorage.removeItem('userData');
  }, []);

  const handleLoginSuccess = () => {
    // Use utility function to get default redirect path based on role
    const redirectPath = getDefaultRedirectPath();
    navigate(redirectPath, { replace: true });
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
      }}
    >
      {/* Marketing Section - Left Column */}
      {!isMobile && (
        <Box
          sx={{
            flex: '0 0 50%',
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          <LoginSlideshow />
        </Box>
      )}

      {/* Login Section - Right Column */}
      <Box
        sx={{
          flex: { xs: '1', md: '0 0 50%' },
          // backgroundColor: '#ECF2F3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          padding: { xs: 2, md: 4 },
          height: { xs: '100vh', md: '100vh' },
          overflow: 'auto',
        }}
      >
        {/* Logo - At Top */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 1,
          mb: 4,
          mt: { xs: 2, md: 4 },
        }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              letterSpacing: '2px',
              fontFamily: 'sans-serif',
            }}
          >
            {APP_NAME}
          </Typography>
        </Box>

        {/* Login Card - Centered */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          minHeight: 0,
        }}>
          <Grid container maxWidth="sm" sx={{ width: '100%' }} justifyContent="center">
            <Grid size={{ xs: 12, sm: 12, md: 12 }}>
              <Paper
                elevation={0}
                sx={{
                  width: '100%',
                  maxWidth: 480,
                  margin: '0 auto',
                  padding: 3,
                  borderRadius: 1,
                  // boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.08)',
                  // border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {/* Login Form */}
                <LoginForm onSuccess={handleLoginSuccess} />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
