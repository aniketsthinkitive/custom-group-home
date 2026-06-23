import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance so auth session clear can invalidate cache.
 * Used by main.tsx (QueryClientProvider) and authSlice (clear on logout/session clear).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
