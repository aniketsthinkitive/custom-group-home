// Re-export User type from SDK for convenience
export type { User } from '../../../sdk/types.gen';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SetPasswordCredentials {
  userId: string;
  password: string;
  confirmPassword: string;
}

export interface ResetPasswordCredentials {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordCredentials {
  email: string;
  baseUrl?: string; // Optional, will be generated dynamically if not provided
}

export interface AuthState {
  user: import('../../../sdk/types.gen').User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginResponse {
  user: import('../../../sdk/types.gen').User;
  token: string;
  refreshToken?: string;
}

// export interface AuthContextType extends AuthState {
//   login: (credentials: LoginCredentials) => Promise<any>;
//   setPassword: (credentials: SetPasswordCredentials) => Promise<any>;
//   resetPassword: (credentials: ResetPasswordCredentials) => Promise<any>;
//   forgotPassword: (credentials: ForgotPasswordCredentials) => Promise<any>;
//   logout: () => void;
//   clearAuthError: () => void;
//   getRedirectPathForCurrentUser: () => string;
//   getAuthToken: () => string | null;
//   getRefreshToken: () => string | null;
//   isCurrentUser: (userId: string) => boolean;
// }
