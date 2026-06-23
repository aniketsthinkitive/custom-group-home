// import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
// import { AuthenticationService } from '../../../sdk/requests/services.gen';
// import { OpenAPI } from '../../../sdk/requests/core/OpenAPI';
// import { notifyPermissionsChanged } from '../../../utils/useFeaturePermissions';
// import { registerFCMTokenForUser } from '../../../utils/registerFCMToken';
// import type { 
//   AuthState, 
//   AuthContextType, 
//   User, 
//   LoginCredentials,
//   SetPasswordCredentials,
//   ResetPasswordCredentials,
//   ForgotPasswordCredentials
// } from '../types/auth.types';

// // Initial state
// const initialState: AuthState = {
//   user: null,
//   isAuthenticated: false,
//   isLoading: true,
//   error: null,
// };

// // Action types
// type AuthAction =
//   | { type: 'LOGIN_START' }
//   | { type: 'LOGIN_SUCCESS'; payload: User }
//   | { type: 'LOGIN_FAILURE'; payload: string }
//   | { type: 'LOGOUT' }
//   | { type: 'CLEAR_ERROR' }
//   | { type: 'SET_LOADING'; payload: boolean };

// // Reducer
// const authReducer = (state: AuthState, action: AuthAction): AuthState => {
//   switch (action.type) {
//     case 'LOGIN_START':
//       return {
//         ...state,
//         isLoading: true,
//         error: null,
//       };
//     case 'LOGIN_SUCCESS':
//       return {
//         ...state,
//         user: action.payload,
//         isAuthenticated: true,
//         isLoading: false,
//         error: null,
//       };
//     case 'LOGIN_FAILURE':
//       return {
//         ...state,
//         user: null,
//         isAuthenticated: false,
//         isLoading: false,
//         error: action.payload,
//       };
//     case 'LOGOUT':
//       return {
//         ...state,
//         user: null,
//         isAuthenticated: false,
//         isLoading: false,
//         error: null,
//       };
//     case 'CLEAR_ERROR':
//       return {
//         ...state,
//         error: null,
//       };
//     case 'SET_LOADING':
//       return {
//         ...state,
//         isLoading: action.payload,
//       };
//     default:
//       return state;
//   }
// };

// // Create context
// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Auth provider component
// interface AuthProviderProps {
//   children: ReactNode;
// }

// // ============== HELPER FUNCTION TO FETCH PERMISSIONS ==============
// const fetchAndUpdatePermissions = async (userId: string) => {
//   try {
//     const permissionsResponse = await AuthenticationService.getApiAuthMe({
//       userId: userId
//     });

//     if (permissionsResponse.code === 'OK' && permissionsResponse.data) {
//       // Store permissions in localStorage
//       localStorage.setItem('permissions', JSON.stringify(permissionsResponse.data));
      
//       // Notify all permission hooks about the change
//       notifyPermissionsChanged();
//     }
//   } catch (error) {
//     console.error('Failed to fetch user permissions:', error);
//   }
// };

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const [state, dispatch] = useReducer(authReducer, initialState);

//   // Check for existing session on mount and refresh permissions
//   useEffect(() => {
//     const checkAuthStatus = () => {
//       const token = localStorage.getItem('authToken');
//       const userData = localStorage.getItem('userData');
//       const authMethod = localStorage.getItem('authMethod');
      
//       if (userData) {
//         try {
//           const user = JSON.parse(userData);
          
//           if (token) {
//             dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            
//             // ============== REFRESH PERMISSIONS ON PAGE LOAD ==============
//             const userId = user.userId || user.uuid || user.username;
//             if (userId) {
//               fetchAndUpdatePermissions(userId);
//               // Register FCM token for already authenticated user
//               registerFCMTokenForUser(userId);
//             }
//           }
//           else if (authMethod === 'cookies' && document.cookie) {
//             dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            
//             // ============== REFRESH PERMISSIONS ON PAGE LOAD ==============
//             const userId = user.userId || user.uuid || user.username;
//             if (userId) {
//               fetchAndUpdatePermissions(userId);
//               // Register FCM token for already authenticated user
//               registerFCMTokenForUser(userId);
//             }
//           }
//           else {
//             localStorage.removeItem('authToken');
//             localStorage.removeItem('refreshToken');
//             localStorage.removeItem('userData');
//             localStorage.removeItem('authMethod');
//             localStorage.removeItem('permissions');
//             dispatch({ type: 'SET_LOADING', payload: false });
//           }
//         } catch (error) {
//           localStorage.removeItem('authToken');
//           localStorage.removeItem('refreshToken');
//           localStorage.removeItem('userData');
//           localStorage.removeItem('authMethod');
//           localStorage.removeItem('permissions');
//           dispatch({ type: 'SET_LOADING', payload: false });
//         }
//       } else {
//         dispatch({ type: 'SET_LOADING', payload: false });
//       }
//     };

//     checkAuthStatus();
//   }, []);

//   // Login function with SDK integration
//   const login = async (credentials: LoginCredentials): Promise<any> => {
//     dispatch({ type: 'LOGIN_START' });

//     // Set referer header for login API call using request interceptor
//     const refererUrl = `${window.location.origin}/counselor`;
//     const loginInterceptor = async (request: RequestInit): Promise<RequestInit> => {
//       // Set Referer header and referrer option for all requests during login
//       // The referrer option is what the browser uses to set the Referer header
//       const headers = new Headers(request.headers);
//       headers.set('Referer', refererUrl);
//       return {
//         ...request,
//         headers: headers,
//         referrer: refererUrl,
//         referrerPolicy: 'unsafe-url' as ReferrerPolicy,
//       };
//     };

//     // Add the interceptor
//     OpenAPI.interceptors.request.use(loginInterceptor);

//     try {
//       const response = await AuthenticationService.postApiAuthLogin({
//         requestBody: {
//           username: credentials.username,
//           password: credentials.password,
//         }
//       });

//       if (response.code === 'OK') {
//         let userData = response.data as any;
        
//         if (!userData || Object.keys(userData).length === 0) {
//           userData = response as any;
//         }
        
//         if (!userData) {
//           throw new Error('No user data received from server');
//         }

//         const user: User = {
//           uuid: userData.uuid || userData.id,
//           userId: userData.userId || userData.uuid || userData.id,
//           firstName: userData.firstName,
//           lastName: userData.lastName,
//           email: userData.email,
//           phone: userData.phone,
//           username: userData.username,
//           status: userData.status,
//           emailVerified: userData.emailVerified,
//           avatar: userData.avatar,
//           roleType: userData.roleType,
//           role: userData.role,
//           birthDate: userData.birthDate,
//           defaultLanguage: userData.defaultLanguage,
//           timezone: userData.timezone,
//           state: userData.state,
//           mailingAddress: userData.mailingAddress,
//           prefix: userData.prefix,
//           userTitle: userData.userTitle,
//           office: userData.office,
//           organization: userData.organization,
//           certifyInformation: userData.certifyInformation,
//           sex: userData.sex,
//           genderIdentity: userData.genderIdentity,
//           code: userData.code,
//           treatment: userData.treatment,
//           balanceDue: userData.balanceDue,
//           group: userData.group,
//           created: userData.created,
//           modified: userData.modified,
//           createdBy: userData.createdBy,
//           modifiedBy: userData.modifiedBy,
//           lastLogin: userData.lastLogin
//         };
        
//         // Store auth data in localStorage
//         const token = userData.token || userData.accessToken || userData.jwt || userData.access_token;
//         const refreshToken = userData.refreshToken || userData.refresh_token;
        
//         const cookies = document.cookie;
        
//         if (token) {
//           localStorage.setItem('authToken', token);
//         } else {
//           if (cookies.includes('token') || cookies.includes('auth') || cookies.includes('jwt')) {
//             localStorage.setItem('authMethod', 'cookies');
//           }
//         }
        
//         if (refreshToken) {
//           localStorage.setItem('refreshToken', refreshToken);
//         }
        
//         localStorage.setItem('userData', JSON.stringify(user));

//         // ============== FETCH PERMISSIONS AFTER LOGIN ==============
//         try {
//           const userId = user.userId || user.uuid || user.username;
//           if (userId) {
//             await fetchAndUpdatePermissions(userId);
//           }
//         } catch (permError) {
//           console.error('Failed to fetch user permissions:', permError);
//         }

//         dispatch({ type: 'LOGIN_SUCCESS', payload: user });
//         return { type: 'auth/login/fulfilled', payload: user };
//       } else {
//         throw new Error(response.message || 'Login failed');
//       }
      
//     } catch (error: any) {
//       const errorMessage = error.message || 'Login failed. Please try again.';
//       dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
//       return { type: 'auth/login/rejected', payload: errorMessage };
//     } finally {
//       // Remove the interceptor
//       OpenAPI.interceptors.request.eject(loginInterceptor);
//     }
//   };

//   // Set Password function with SDK integration
//   const setPassword = async (credentials: SetPasswordCredentials): Promise<any> => {
//     dispatch({ type: 'LOGIN_START' });

//     try {
//       const response = await AuthenticationService.postApiAuthSetPassword({
//         requestBody: {
//           userId: credentials.userId,
//           password: credentials.password,
//           confirmPassword: credentials.confirmPassword,
//         }
//       });

//       if (response.code === 'OK' || response.code === 'SET_PASSWORD_RESPONSE') {
//         dispatch({ type: 'SET_LOADING', payload: false });
//         dispatch({ type: 'CLEAR_ERROR' });
//         return { type: 'auth/setPassword/fulfilled', payload: { success: true, redirectToLogin: true } };
//       } else {
//         throw new Error(response.message || 'Failed to set password');
//       }
//     } catch (error: any) {
//       const errorMessage = error.message || 'Failed to set password. Please try again.';
//       dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
//       return { type: 'auth/setPassword/rejected', payload: errorMessage };
//     }
//   };

//   // Reset Password function with SDK integration
//   const resetPassword = async (credentials: ResetPasswordCredentials): Promise<any> => {
//     dispatch({ type: 'LOGIN_START' });

//     try {
//       const response = await AuthenticationService.postApiAuthResetPassword({
//         requestBody: {
//           token: credentials.token,
//           password: credentials.password,
//           confirmPassword: credentials.confirmPassword,
//         }
//       });

//       console.log('Reset password API response:', response);

//       // Check for success - accept OK, SET_PASSWORD_RESPONSE, or any successful response (200 status)
//       // The backend returns SET_PASSWORD_RESPONSE for reset password success
//       if (response.code === 'OK' || response.code === 'SET_PASSWORD_RESPONSE' || !response.code) {
//         dispatch({ type: 'SET_LOADING', payload: false });
//         dispatch({ type: 'CLEAR_ERROR' });
//         const result = { type: 'auth/resetPassword/fulfilled', payload: { success: true, redirectToLogin: true } };
//         console.log('Returning fulfilled result:', result);
//         return result;
//       } else {
//         throw new Error(response.message || 'Failed to reset password');
//       }
//     } catch (error: any) {
//       console.error('Reset password error:', error);
//       const errorMessage = error.message || 'Failed to reset password. Please try again.';
//       dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
//       return { type: 'auth/resetPassword/rejected', payload: errorMessage };
//     }
//   };

//   // Get dynamic base URL based on current environment
//   // Returns window.location.origin + '/counselor/' format
//   const getDynamicBaseUrl = (): string => {
//     // Use window.location.origin like ClientPage.tsx
//     const baseUrl = `${window.location.origin}/counselor`;
//     return baseUrl;
//   };

//   // Forgot Password function with SDK integration
//   const forgotPassword = async (credentials: ForgotPasswordCredentials): Promise<any> => {
//     dispatch({ type: 'LOGIN_START' });

//     try {
//       // Get dynamic base URL if not provided
//       const baseUrl = credentials.baseUrl || getDynamicBaseUrl();
      
//       // Include baseUrl in request (backend expects it even if SDK type doesn't include it)
//       const response = await AuthenticationService.postApiAuthForgotPassword({
//         requestBody: {
//           email: credentials.email,
//           baseUrl: baseUrl,
//         } as any // Type assertion needed as SDK type may not include baseUrl yet
//       });

//       if (response.code === 'OK' || response.code === 'FORGOT_PASSWORD_RESPONSE' || response.code === 'MAIL_SENT_SUCCESSFULLY') {
//         dispatch({ type: 'SET_LOADING', payload: false });
//         dispatch({ type: 'CLEAR_ERROR' });
//         return { type: 'auth/forgotPassword/fulfilled', payload: { success: true, email: credentials.email } };
//       } else {
//         throw new Error(response.message || 'Failed to send password reset email');
//       }
//     } catch (error: any) {
//       const errorMessage = error.message || 'Failed to send password reset email. Please try again.';
//       dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
//       return { type: 'auth/forgotPassword/rejected', payload: errorMessage };
//     }
//   };

//   const logout = async () => {
//     try {
//       const refreshToken = localStorage.getItem('refreshToken');
//       if (refreshToken) {
//         await AuthenticationService.postApiAuthLogout({
//           requestBody: { refreshToken }
//         });
//       }
//     } catch (error) {
//       console.error('Logout API call failed:', error);
//     } finally {
//       localStorage.removeItem('authToken');
//       localStorage.removeItem('userData');
//       localStorage.removeItem('refreshToken');
//       localStorage.removeItem('authMethod');
//       localStorage.removeItem('permissions');
//       dispatch({ type: 'LOGOUT' });
//     }
//   };

//   const clearAuthError = () => {
//     dispatch({ type: 'CLEAR_ERROR' });
//   };

//   const getRedirectPathForCurrentUser = (): string => {
//     if (!state.user) return '/clinician/login';
    
//     switch (state.user.roleType) {
//       case 'ADMIN':
//         return '/admin/dashboard';
//       case 'CLINICIAN':
//         return '/admin/dashboard';
//       case 'RECEPTIONIST':
//         return '/admin/dashboard';
//       case 'SUPER_USER':
//         return '/admin/dashboard';
//       case 'STAFF':
//         return '/admin/dashboard';
//       default:
//         return '/admin/dashboard';
//     }
//   };

//   const checkUserIdMatch = (setPasswordUserId: string): boolean => {
//     if (!state.user) return false;
    
//     const currentUserId = state.user.userId || state.user.uuid;
//     return currentUserId === setPasswordUserId;
//   };

//   const contextValue: AuthContextType = {
//     ...state,
//     login,
//     setPassword,
//     resetPassword,
//     forgotPassword,
//     logout,
//     clearAuthError,
//     getRedirectPathForCurrentUser,
//     checkUserIdMatch,
//   };

//   return (
//     <AuthContext.Provider value={contextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use auth context
// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
