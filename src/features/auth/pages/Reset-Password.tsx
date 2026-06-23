import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  useMediaQuery,
  Grid,
  Alert,
} from '@mui/material';
import { ResetPasswordForm } from '../components/ResetPasswordForm';
// import { useAuth } from '../../hooks/useAuth';
// import logo from '../../../assets/images/logo.svg';
import LoginSlideshow from '../components/LoginSlideshow';
import { theme } from '../../../constant/styles/theme';
import { APP_NAME } from '../../../config/branding';

export const ResetPassword: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams] = useSearchParams();
  
  // Get token from URL parameters
  const token = searchParams.get('token');
  
  // Validate token - show error if missing
  const pageError = !token ? 'Invalid or missing reset token. Please check your email link.' : null;
  // const { isAuthenticated, user, logout } = useAuth();

  // Clear auth if user is authenticated (reset password should be done when logged out)
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     // Clear auth data for reset password flow
  //     localStorage.removeItem('cauthToken');
  //     localStorage.removeItem('cuserData');
  //     localStorage.removeItem('crefreshToken');
  //     localStorage.removeItem('rememberMe');
  //     logout();
  //   }
  // }, [isAuthenticated, user, logout]);

  // const handleResetPasswordSuccess = () => {
  //   // Clear any existing auth data and redirect to login
  //   localStorage.removeItem('cauthToken');
  //   localStorage.removeItem('cuserData');
  //   localStorage.removeItem('crefreshToken');
  //   localStorage.removeItem('rememberMe');
    
  //   // Navigate to login page after successful password reset
  //   navigate('/login', { replace: true });
  // };

  // Show error if URL parameters are invalid
  if (pageError) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
        }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          
        </Box>
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 480,
            padding: 3,
            borderRadius: 1,
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            {pageError}
          </Alert>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Please check your email for the correct link to reset your password.
          </Typography>
        </Paper>
      </Box>
    );
  }

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

      {/* Reset Password Section - Right Column */}
      <Box
        sx={{
          flex: { xs: '1', md: '0 0 50%' },
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
          <Box
            component="img"
            src={logo}
            alt="Custom Group Home Logo"
            sx={{
              width: { xs: 60, sm: 60, md: 60 },
              height: 'auto',
              maxWidth: '100%',
            }}
          />
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

        {/* Reset Password Card - Centered */}
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
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'left',
                    gap: 1,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 500,
                      fontSize: '28px',
                      lineHeight: 1.2,
                      color: theme.palette.text.primary,
                      textAlign: 'left',
                    }}
                  >
                    Set Your New Password
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '14px',
                      fontWeight: 400,
                      lineHeight: 1.57,
                      color: theme.palette.text.secondary,
                      textAlign: 'left',
                    }}
                  >
                    Create a strong password to secure your account.
                  </Typography>
                </Box>

                {/* Reset Password Form */}
                <ResetPasswordForm token={token || ''} />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;
