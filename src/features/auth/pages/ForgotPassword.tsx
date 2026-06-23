import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  useMediaQuery,
  Grid,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation, type DefaultError } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { Email as EmailIcon } from '@mui/icons-material';
// import logo from '../../../assets/images/logo.svg';
import LoginSlideshow from '../components/LoginSlideshow';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomLabel from '../../../components/custom-label/custom-label';
import { theme } from '../../../constant/styles/theme';
import { forgotPasswordSendOtpMutation } from '../../../sdk/@tanstack/react-query.gen';
import { APP_NAME } from '../../../config/branding';

// Validation schema
const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>('');

  const {
    control,
    handleSubmit,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutationHook = useMutation({
    ...forgotPasswordSendOtpMutation(),
    onSuccess: () => {
      // Show success message and navigate to OTP verification page
      setFormError(null);
      if (submittedEmail) {
        navigate('/verify-otp', { 
          state: { email: submittedEmail },
          replace: true 
        });
      }
    },
    onError: (error: AxiosError<DefaultError>) => {
      // Extract error message from backend response
      const errorData = error.response?.data as { message?: string } | undefined;
      const errorMessage = 
        errorData?.message || 
        error.message || 
        'Failed to send OTP. Please try again.';
      setFormError(errorMessage);
    },
  });

  const onSubmit = async (formData: ForgotPasswordFormData) => {
    setFormError(null);
    setSubmittedEmail(formData.email);
    
    // Call the mutation with email in the body
    // Note: Type assertion needed because generated type doesn't include body
    // but backend requires it (backend expects { email: string } in request body)
    forgotPasswordMutationHook.mutate({
      body: {
        email: formData.email,
      },
    } as any);
  };

  const handleBackToLogin = () => {
    navigate('/login');
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

      {/* Forgot Password Section - Right Column */}
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

        {/* Forgot Password Card - Centered */}
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
                <Box
                  component="form"
                  onSubmit={handleSubmit(onSubmit)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    width: '100%',
                  }}
                  noValidate
                >
                  {/* Error Alert */}
                  {formError && (
                    <Alert 
                      severity="error" 
                      role="alert"
                      sx={{ mb: 2 }}
                      onClose={() => setFormError(null)}
                    >
                      {formError}
                    </Alert>
                  )}

                  {/* Header */}
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
                    Forgot Your Password
                  </Typography>

                  {/* Description */}
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
                    Enter your registered email to receive a OTP.
                  </Typography>

                  {/* Email field */}
                  <Grid container>
                    <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <CustomLabel label="Email" isRequired />
                      <Controller
                        name="email"
                        control={control}
                        render={({ field, fieldState }) => (
                          <CustomInput
                            name="email"
                            placeholder="Enter Email"
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                            disableField={forgotPasswordMutationHook.isPending}
                            isEmail
                            InputProps={{
                              endAdornment: <EmailIcon />
                            }}
                            required
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  {/* Submit button */}
                  <CustomButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={forgotPasswordMutationHook.isPending}
                    loading={forgotPasswordMutationHook.isPending}
                  >
                    {forgotPasswordMutationHook.isPending ? 'Sending OTP...' : 'Send OTP'}
                  </CustomButton>

                  {/* Back to Login */}
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CustomButton
                      type="button"
                      variant="text"
                      size="lg"
                      onClick={handleBackToLogin}
                      sx={{
                        color: theme.palette.text.primary,
                        border: 'none',
                        backgroundColor: 'transparent',
                      }}
                    >
                      Back To Login
                    </CustomButton>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
