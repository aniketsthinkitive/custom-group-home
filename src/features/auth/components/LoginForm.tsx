/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Link,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import CustomInput from '../../../components/custom-input/custom-input';
import CustomButton from '../../../components/custom-buttons/custom-buttons';
import CustomLabel from '../../../components/custom-label/custom-label';
import { theme } from '../../../constant/styles/theme';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAppDispatch } from '../../../store/hooks';
import { clearError, setUser } from '../../../store/slices/authSlice';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '../../../sdk/sdk.gen';
import { APP_NAME } from '../../../config/branding';

// Validation schema
const loginSchema = yup.object({
  username: yup
    .string()
    .required("Please enter your email")
    .email('Invalid email format')
    .min(3, "Email must be at least 3 characters")
    .max(64, "Email must not exceed 64 characters"),
  password: yup
    .string()
    .required("Please enter your password")
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}


export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Local error state to persist through global interceptor wipes
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Use mutation for login to avoid Redux isLoading unmounting the form via UnprotectedRoute
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormData) => {
      const response = await loginUser({
        body: {
          email: credentials.username,
          password: credentials.password,
        },
      });

      // SDK handles error wrapping if throwOnError is false (default)
      // Check for error response format
      const responseWithError = response as any;
      if (responseWithError.error || (responseWithError.status && responseWithError.status >= 400)) {
        const errorData = responseWithError.error || responseWithError.data;

        // Prioritize nested validation errors (e.g., errorData.errors.email[0])
        let errorMessage = '';
        if (errorData?.errors && typeof errorData.errors === 'object') {
          const firstErrorKey = Object.keys(errorData.errors)[0];
          if (firstErrorKey) {
            const firstErrorValue = errorData.errors[firstErrorKey];
            errorMessage = Array.isArray(firstErrorValue) ? firstErrorValue[0] : firstErrorValue;
          }
        }

        // Fallback to top-level messages
        if (!errorMessage) {
          errorMessage = errorData?.message || errorData?.details || errorData?.detail || '';
        }

        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: (data: any) => {
      // console.log('Login successful');
      // Update Redux state with user data so the rest of the app knows we are logged in
      const userData = data?.data?.user || data?.data || data;
      dispatch(setUser(userData));
      onSuccess?.();
    },
    onError: (err: any) => {
      // Strictly show the message from the backend error
      const message = err.message;
      setLocalError(message || null);
    }
  });

  const {
    control,
    handleSubmit,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLocalError(null);
    dispatch(clearError());
    loginMutation.mutate(data);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
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
      {/* Welcome heading */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 500,
          fontSize: '28px',
          lineHeight: 1.2,
          color: theme.palette.text.primary,
          textAlign: 'left',
          width: '120%',
          display: 'block',
        }}
      >
        Welcome to {APP_NAME}
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
          width: '100%',
          display: 'block',
        }}
      >
        Please sign in using credentials provided.
      </Typography>

      {/* Demo credentials hint (prototype — no backend) */}
      <Alert severity="info" sx={{ fontSize: '13px', '& a': { color: 'inherit' } }}>
        <strong>Admin:</strong> admin@customgrouphome.com / Admin@123
        <br />
        <strong>Guardian:</strong> guardian@customgrouphome.com / Guardian@123
      </Alert>

      {/* Error message */}
      {localError && (
        <Alert severity="error" onClose={() => setLocalError(null)}>
          {localError}
        </Alert>
      )}


      {/* Username field */}
      <Grid container>
        <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <CustomLabel label="Email" isRequired />
          <Controller
            name="username"
            control={control}
            render={({ field, fieldState }) => (
              <CustomInput
                name="username"
                placeholder="Enter your email"
                value={field.value}
                onChange={field.onChange}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                disableField={loginMutation.isPending}
                InputProps={{
                  endAdornment: <PersonOutlineIcon />
                }}
                required
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Password field */}
      <Grid container>
        <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <CustomLabel label="Password" isRequired />
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <CustomInput
                name="password"
                placeholder="Enter your password"
                value={field.value}
                onChange={field.onChange}
                hasError={!!fieldState.error}
                errorMessage={fieldState.error?.message}
                disableField={loginMutation.isPending}
                isPassword
                required
              />
            )}
          />
        </Grid>
      </Grid>


      {/* Forgot password link */}
      <Grid container>
        <Grid size={{ xs: 12, md: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Link
            component="button"
            type="button"
            onClick={handleForgotPassword}
            disabled={loginMutation.isPending}
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              lineHeight: 1.15,
              textDecoration: 'none',
              color: theme.palette.primary.main,
              '&:hover': {
                textDecoration: 'underline',
                color: theme.palette.primary.dark,
              },
              '&:disabled': {
                color: theme.palette.text.disabled,
                cursor: 'not-allowed',
              },
            }}
          >
            Forgot Password?
          </Link>
        </Grid>
      </Grid>

      {/* Submit button */}
      <CustomButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={loginMutation.isPending}
        loading={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Signing In...' : 'Login'}
      </CustomButton>
    </Box>
  );
};

export default LoginForm;
