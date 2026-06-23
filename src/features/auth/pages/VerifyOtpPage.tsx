import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  useMediaQuery,
  Grid,
  Alert,
  TextField,
  Tooltip,
} from '@mui/material';
import { useMutation, type DefaultError } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
// import logo from '../../../assets/images/logo.svg';
import LoginSlideshow from '../components/LoginSlideshow';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import { theme } from '../../../constant/styles/theme';
import { verifyPasswordOtpMutation, resendPasswordOtpMutation } from '../../../sdk/@tanstack/react-query.gen';
import { APP_NAME } from '../../../config/branding';

const OTP_LENGTH = 6;

export const VerifyOtpPage: React.FC = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [email, setEmail] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState<number>(60); // 60 seconds cooldown
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from location state or URL params
  useEffect(() => {
    const stateEmail = (location.state as { email?: string })?.email;
    const urlParams = new URLSearchParams(location.search);
    const paramEmail = urlParams.get('email');
    
    const userEmail = stateEmail || paramEmail || '';
    
    if (!userEmail) {
      // If no email found, redirect back to forgot password
      navigate('/forgot-password', { replace: true });
      return;
    }
    
    setEmail(userEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyOtpMutationHook = useMutation({
    ...verifyPasswordOtpMutation(),
    onSuccess: (data: unknown) => {
      // Extract set_password_token from backend response
      const responseData = data as { set_password_token?: string; message?: string } | undefined;
      const token = responseData?.set_password_token;
      
      if (token) {
        setFormError(null);
        // Navigate to reset password page with token
        navigate(`/reset-password?token=${token}`, { replace: true });
      } else {
        setFormError('Token not received. Please try again.');
      }
    },
    onError: (error: AxiosError<DefaultError>) => {
      // Extract error message from backend response
      const errorData = error.response?.data as { message?: string } | undefined;
      const errorMessage = 
        errorData?.message || 
        error.message || 
        'Invalid OTP. Please try again.';
      setFormError(errorMessage);
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    },
  });

  const resendOtpMutationHook = useMutation({
    ...resendPasswordOtpMutation(),
    onSuccess: () => {
      setFormError(null);
      // Clear OTP inputs
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    },
    onError: (error: AxiosError<DefaultError>) => {
      // Extract error message from backend response
      const errorData = error.response?.data as { message?: string } | undefined;
      const errorMessage = 
        errorData?.message || 
        error.message || 
        'Failed to resend OTP. Please try again.';
      setFormError(errorMessage);
    },
  });

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numeric input
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setFormError(null);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        if (index < OTP_LENGTH) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      setFormError(null);
      
      // Focus last input when complete
      if (newOtp.every(digit => digit !== '')) {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
      } else {
        const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
        if (nextEmptyIndex !== -1) {
          inputRefs.current[nextEmptyIndex]?.focus();
        }
      }
    }
  };

  const handleVerifyOtp = (otpValue?: string) => {
    const otpToVerify = otpValue || otp.join('');
    
    if (otpToVerify.length !== OTP_LENGTH) {
      setFormError('Please enter a complete 6-digit OTP.');
      return;
    }

    if (!email) {
      setFormError('Email is required. Please go back and try again.');
      return;
    }

    setFormError(null);
    
    // Call the mutation with email and OTP
    verifyOtpMutationHook.mutate({
      body: {
        email: email,
        otp: otpToVerify,
      },
    });
  };

  const handleResendOtp = () => {
    if (!email) {
      setFormError('Email is required. Please go back and try again.');
      return;
    }

    setFormError(null);
    
    // Call the mutation with email
    // Note: Type assertion needed because generated type doesn't include body
    // but backend requires it (backend expects { email: string } in request body)
    resendOtpMutationHook.mutate({
      body: {
        email: email,
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

      {/* OTP Verification Section - Right Column */}
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

        {/* OTP Verification Card - Centered */}
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
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    width: '100%',
                  }}
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
                    Enter OTP
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
                    We've sent a 6-digit verification code to your registered email.
                  </Typography>

                  {/* OTP Input Fields */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 1.5,
                      mb: 1,
                    }}
                  >
                    {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                      <TextField
                        key={index}
                        inputRef={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        value={otp[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e as React.KeyboardEvent<HTMLInputElement>)}
                        onPaste={handlePaste}
                        inputProps={{
                          maxLength: 1,
                          style: {
                            textAlign: 'center',
                            fontSize: '24px',
                            fontWeight: 600,
                            padding: '12px',
                          },
                        }}
                        disabled={verifyOtpMutationHook.isPending}
                        error={!!formError && !otp[index]}
                        sx={{
                          width: '56px',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1,
                            '& fieldset': {
                              borderColor: formError && !otp[index] 
                                ? theme.palette.error.main 
                                : theme.palette.divider,
                            },
                            '&:hover fieldset': {
                              borderColor: formError && !otp[index]
                                ? theme.palette.error.main
                                : theme.palette.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.palette.divider,
                              borderWidth: '1px',
                            },
                            '& input': {
                              outline: 'none',
                              '&:focus': {
                                outline: 'none',
                              },
                            },
                          },
                        }}
                      />
                    ))}
                  </Box>

                  {/* Resend OTP */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '14px',
                        fontWeight: 400,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Didn't receive the code?
                    </Typography>
                    <Tooltip
                      title={
                        resendCooldown > 0
                          ? `Please wait ${resendCooldown} second${resendCooldown !== 1 ? 's' : ''} before resending`
                          : 'Click to resend OTP'
                      }
                      arrow
                    >
                      <span>
                        <CustomButton
                          type="button"
                          variant="text"
                          size="sm"
                          onClick={handleResendOtp}
                          disabled={
                            resendCooldown > 0 ||
                            resendOtpMutationHook.isPending ||
                            verifyOtpMutationHook.isPending
                          }
                          sx={{
                            color: resendCooldown > 0
                              ? theme.palette.text.disabled
                              : theme.palette.primary.main,
                            border: 'none',
                            backgroundColor: 'transparent',
                            padding: 0,
                            minWidth: 'auto',
                            textTransform: 'none',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {resendOtpMutationHook.isPending
                            ? 'Sending...'
                            : resendCooldown > 0
                            ? `Resend OTP (${resendCooldown}s)`
                            : 'Resend OTP'}
                        </CustomButton>
                      </span>
                    </Tooltip>
                  </Box>

                  {/* Verify Button */}
                  <CustomButton
                    type="button"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={otp.join('').length !== OTP_LENGTH || verifyOtpMutationHook.isPending}
                    loading={verifyOtpMutationHook.isPending}
                    onClick={() => handleVerifyOtp()}
                  >
                    {verifyOtpMutationHook.isPending ? 'Verifying...' : 'Verify & Continue'}
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

export default VerifyOtpPage;
