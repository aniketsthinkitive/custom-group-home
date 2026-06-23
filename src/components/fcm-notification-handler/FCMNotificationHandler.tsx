import React, { useEffect, useState } from 'react';
import { onMessageListener } from '../../utils/firebase';
import CommonSnackbar from '../common-snackbar/common-snackbar';

interface FCMNotificationHandlerProps {
  isAuthenticated: boolean;
}

const FCMNotificationHandler: React.FC<FCMNotificationHandlerProps> = ({ isAuthenticated }) => {
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    message: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Set up foreground message listener
    const handleMessage = (payload: any) => {
      try {
        // Extract notification data from payload
        const notificationData = payload.notification || {};
        const data = payload.data || {};
        
        // Get title and body from notification or data
        const title = notificationData.title || data.title || 'New Notification';
        const body = notificationData.body || data.body || data.message || 'You have a new message';
        
        // Combine title and body for display
        const message = title && body ? `${title}: ${body}` : body || title;
        
        setNotification({
          isOpen: true,
          message: message,
          title: title,
        });
      } catch (error) {
        console.error('Error handling FCM message:', error);
      }
    };

    // Set up the message listener
    const cleanup = onMessageListener(handleMessage);

    // Cleanup on unmount
    return cleanup;
  }, [isAuthenticated]);

  const handleClose = () => {
    setNotification({
      isOpen: false,
      message: '',
      title: undefined,
    });
  };

  if (!notification.isOpen) {
    return null;
  }

  return (
    <CommonSnackbar
      message={notification.message}
      status="success"
      isOpen={notification.isOpen}
      onClose={handleClose}
      autoClose={true}
      autoCloseDelay={5000}
      position="top-right"
    />
  );
};

export default FCMNotificationHandler;

