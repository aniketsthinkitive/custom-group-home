// Firebase utility functions
// TODO: Implement Firebase configuration and message listener

export const onMessageListener = (_callback: (payload: any) => void): (() => void) => {
  // Stub implementation - replace with actual Firebase message listener
  console.warn('Firebase onMessageListener not implemented');
  return () => {
    // Cleanup function
  };
};
