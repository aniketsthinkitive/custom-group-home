import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import CustomButton from '../custom-buttons/custom-buttons';
import LogoutIcon from '@mui/icons-material/Logout';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = 'secondary',
  size = 'md',
  showIcon = true 
}) => {
  const { logout, isLoading } = useAuth();

  return (
    <CustomButton
      variant={variant}
      size={size}
      onClick={logout}
      disabled={isLoading}
      icon={showIcon ? <LogoutIcon /> : undefined}
      iconPosition="left"
    >
      Logout
    </CustomButton>
  );
};

export default LogoutButton;
