import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import permissionsReducer, { restoreFromStorage } from './slices/permissionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    permissions: permissionsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/refreshToken/fulfilled'],
      },
    }),
});

// Restore permissions from localStorage on app init so tabs are visible immediately after page refresh
store.dispatch(restoreFromStorage());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
