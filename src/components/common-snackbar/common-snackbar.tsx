import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './common-snackbar.css';

export interface SnackbarProps {
  message: string;
  status: 'success' | 'error';
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const CommonSnackbar: React.FC<SnackbarProps> = ({
  message,
  status,
  isOpen,
  onClose,
  autoClose = true,
  autoCloseDelay = 10000,
  position = "bottom-left",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return (
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.1337 16.4003L9.26699 13.5337C9.02255 13.2892 8.71144 13.167 8.33366 13.167C7.95588 13.167 7.64477 13.2892 7.40033 13.5337C7.15588 13.7781 7.03366 14.0892 7.03366 14.467C7.03366 14.8448 7.15588 15.1559 7.40033 15.4003L11.2003 19.2003C11.467 19.467 11.7781 19.6003 12.1337 19.6003C12.4892 19.6003 12.8003 19.467 13.067 19.2003L20.6003 11.667C20.8448 11.4225 20.967 11.1114 20.967 10.7337C20.967 10.3559 20.8448 10.0448 20.6003 9.80032C20.3559 9.55588 20.0448 9.43366 19.667 9.43366C19.2892 9.43366 18.9781 9.55588 18.7337 9.80032L12.1337 16.4003ZM14.0003 27.3337C12.1559 27.3337 10.4225 26.9837 8.80032 26.2837C7.1781 25.5837 5.76699 24.6337 4.56699 23.4337C3.36699 22.2337 2.41699 20.8225 1.71699 19.2003C1.01699 17.5781 0.666992 15.8448 0.666992 14.0003C0.666992 12.1559 1.01699 10.4225 1.71699 8.80032C2.41699 7.1781 3.36699 5.76699 4.56699 4.56699C5.76699 3.36699 7.1781 2.41699 8.80032 1.71699C10.4225 1.01699 12.1559 0.666992 14.0003 0.666992C15.8448 0.666992 17.5781 1.01699 19.2003 1.71699C20.8225 2.41699 22.2337 3.36699 23.4337 4.56699C24.6337 5.76699 25.5837 7.1781 26.2837 8.80032C26.9837 10.4225 27.3337 12.1559 27.3337 14.0003C27.3337 15.8448 26.9837 17.5781 26.2837 19.2003C25.5837 20.8225 24.6337 22.2337 23.4337 23.4337C22.2337 24.6337 20.8225 25.5837 19.2003 26.2837C17.5781 26.9837 15.8448 27.3337 14.0003 27.3337Z"
              fill="#1AA23A"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.0003 20.667C14.3781 20.667 14.6948 20.5392 14.9503 20.2837C15.2059 20.0281 15.3337 19.7114 15.3337 19.3337C15.3337 18.9559 15.2059 18.6392 14.9503 18.3837C14.6948 18.1281 14.3781 18.0003 14.0003 18.0003C13.6225 18.0003 13.3059 18.1281 13.0503 18.3837C12.7948 18.6392 12.667 18.9559 12.667 19.3337C12.667 19.7114 12.7948 20.0281 13.0503 20.2837C13.3059 20.5392 13.6225 20.667 14.0003 20.667ZM14.0003 15.3337C14.3781 15.3337 14.6948 15.2059 14.9503 14.9503C15.2059 14.6948 15.3337 14.3781 15.3337 14.0003V8.66699C15.3337 8.28921 15.2059 7.97255 14.9503 7.71699C14.6948 7.46144 14.3781 7.33366 14.0003 7.33366C13.6225 7.33366 13.3059 7.46144 13.0503 7.71699C12.7948 7.97255 12.667 8.28921 12.667 8.66699V14.0003C12.667 14.3781 12.7948 14.6948 13.0503 14.9503C13.3059 15.2059 13.6225 15.3337 14.0003 15.3337ZM14.0003 27.3337C12.1559 27.3337 10.4225 26.9837 8.80032 26.2837C7.1781 25.5837 5.76699 24.6337 4.56699 23.4337C3.36699 22.2337 2.41699 20.8225 1.71699 19.2003C1.01699 17.5781 0.666992 15.8448 0.666992 14.0003C0.666992 12.1559 1.01699 10.4225 1.71699 8.80032C2.41699 7.1781 3.36699 5.76699 4.56699 4.56699C5.76699 3.36699 7.1781 2.41699 8.80032 1.71699C10.4225 1.01699 12.1559 0.666992 14.0003 0.666992C15.8448 0.666992 17.5781 1.01699 19.2003 1.71699C20.8225 2.41699 22.2337 3.36699 23.4337 4.56699C24.6337 5.76699 25.5837 7.1781 26.2837 8.80032C26.9837 10.4225 27.3337 12.1559 27.3337 14.0003C27.3337 15.8448 26.9837 17.5781 26.2837 19.2003C25.5837 20.8225 24.6337 22.2337 23.4337 23.4337C22.2337 24.6337 20.8225 25.5837 19.2003 26.2837C17.5781 26.9837 15.8448 27.3337 14.0003 27.3337Z"
              fill="#CA1C1C"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen && !isVisible) {
    return null;
  }

  const snackbarContent = (
    <div
      className={`common-snackbar common-snackbar--${status} common-snackbar--${position} ${isVisible ? "common-snackbar--visible" : ""}`}
    >
      <div className="common-snackbar__content">
        <div
          className={`common-snackbar__icon common-snackbar__icon--${status}`}
        >
          {getStatusIcon()}
        </div>
        <div className="common-snackbar__message">{message}</div>
        <button
          className="common-snackbar__close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  // Use portal to render snackbar outside of any parent containers
  return createPortal(snackbarContent, document.body);
};

export default CommonSnackbar;
