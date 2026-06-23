import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useMutation, type DefaultError } from '@tanstack/react-query';
import {
  Box,
  Alert,
  Typography,
} from '@mui/material';
import {
  Lock as LockIcon,
} from '@mui/icons-material';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomLabel from '../../../components/custom-label/custom-label';
import CommonSnackbar from '../../../components/common-snackbar/common-snackbar';
import { setPasswordMutation } from '../../../sdk/@tanstack/react-query.gen';
import type { AxiosError } from 'axios';
// import { useAuth } from '../hooks/useAuth';
// import type { ResetPasswordCredentials } from '../types/auth.types';

// Password validation schema according to user story requirements
const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('Password is required')
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]/, 'Password must contain at least one number, symbol, or whitespace'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters")
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
  // onSuccess?: () => void;
}

interface PasswordRequirement {
  id: string;
  text: string;
  isValid: boolean;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    isOpen: boolean;
    message: string;
    status: 'success' | 'error';
  }>({
    isOpen: false,
    message: '',
    status: 'success',
  });

  const {
    control,
    handleSubmit,
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const setPasswordMutationHook = useMutation({
    ...setPasswordMutation(),
    onSuccess: (data: unknown) => {
      // Extract message from backend response
      // Backend returns: { status: "success", code: 200, message: "Password set successfully" }
      const responseData = data as { message?: string };
      const message = responseData?.message || 'Password set successfully';
      setSnackbar({
        isOpen: true,
        message: message,
        status: 'success',
      });
      // Redirect to login page after showing success message
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000); // Give time for user to see the success message
    },
    onError: (error: AxiosError<DefaultError>) => {
      // Extract error message from backend response
      // Backend returns: { status: "error", code: number, message: "error message" }
      const errorData = error.response?.data as { message?: string } | undefined;
      const errorMessage = 
        errorData?.message || 
        error.message || 
        'Failed to set password. Please try again.';
      setSnackbar({
        isOpen: true,
        message: errorMessage,
        status: 'error',
      });
      setFormError(errorMessage);
      // Do not redirect on error
    },
  });

  // Validate URL parameters on component mount
  // useEffect(() => {
  //   if (!token) {
  //     setFormError('Invalid or missing reset token. Please check your email link.');
  //   }
  // }, [token]);

  // Watch password field for real-time validation
  const watchedPassword = watch('password');

  // Password requirements validation - matching exact Figma text
  const getPasswordRequirements = (password: string): PasswordRequirement[] => [
    {
      id: 'length',
      text: 'Must be at least 8 characters long (longer is better)',
      isValid: password.length >= 8,
    },
    {
      id: 'lowercase',
      text: 'Requires at least one lowercase letter',
      isValid: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      text: 'Requires at least one uppercase letter',
      isValid: /[A-Z]/.test(password),
    },
    {
      id: 'number-symbol',
      text: 'Requires at least one number, symbol, or whitespace',
      isValid: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?\s]/.test(password),
    },
  ];

  const passwordRequirements = getPasswordRequirements(watchedPassword || '');

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setFormError(null);

      if (!token) {
        setFormError('Invalid or missing reset token. Please check your email link.');
        return;
      }

      // Call the mutation with password and token as query parameter
      // Note: Type assertion needed because generated type doesn't include query param
      // but backend requires it
      setPasswordMutationHook.mutate({
        body: {
          password: data.password,
        },
        query: {
          token: token,
        },
      } as any);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please try again.';
      setFormError(errorMessage);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit as any)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        width: '100%',
      }}
      noValidate
    >
      {/* Form-level error alert */}
      {(formError) && (
        <Alert 
          severity="error" 
          role="alert"
          sx={{ mb: 2 }}
          onClose={() => {
            setFormError(null);
            // clearAuthError();
          }}
        >
          {formError}
        </Alert>
      )}

      {/* Password field */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <CustomLabel label="New Password" isRequired />
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <CustomInput
              name="password"
              placeholder="Enter Your Password"
              value={field.value}
              onChange={field.onChange}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              // disableField={isLoading || isSubmitting}
              icon={<LockIcon />}
              isPassword
              required
            />
          )}
        />
      </Box>

      {/* Confirm Password field */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <CustomLabel label="Confirm Password" isRequired />
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <CustomInput
              name="confirmPassword"
              placeholder="Re-enter Your Password"
              value={field.value}
              onChange={field.onChange}
              hasError={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              // disableField={isLoading || isSubmitting}
              icon={<LockIcon />}
              isPassword
              required
            />
          )}
        />
      </Box>

      {/* Submit button */}
      <CustomButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={setPasswordMutationHook.isPending}
        loading={setPasswordMutationHook.isPending}
      >
        {setPasswordMutationHook.isPending ? 'Creating Password...' : 'Create Password'}
      </CustomButton>

      {/* Password Requirements - Matching Figma Design */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '12px',
          backgroundColor: '#F6F6F6',
          borderRadius: '8px',
          width: '100%',
        }}
      >
        {passwordRequirements.map((requirement) => (
          <Box
            key={requirement.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Box
              sx={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#757775',
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontFamily: 'Helvetica Neue',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: 1.2,
                letterSpacing: '1.2%',
                color: '#2C2D2C',
                flex: 1,
              }}
            >
              {requirement.text}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Snackbar for success/error messages */}
      <CommonSnackbar
        message={snackbar.message}
        status={snackbar.status}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
        autoClose={true}
        autoCloseDelay={snackbar.status === 'success' ? 2000 : 5000}
        position="bottom-left"
      />
    </Box>
  );
};

export default ResetPasswordForm;

