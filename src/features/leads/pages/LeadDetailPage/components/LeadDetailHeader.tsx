import React, { useState } from 'react';
import { Box, Grid, Typography, IconButton, Tooltip, Popover, List, ListItem, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useAppSelector } from '../../../../../store/hooks';
import type { LeadTab } from '../constants';
import { usePermission } from "../../../../../hooks/usePermission";

interface LeadDetailHeaderProps {
  fullName: string;
  activeTab: LeadTab;
  onTabChange: (tab: LeadTab) => void;
  isFinalStatus: boolean;
  status?: string;
  onRejectClick: () => void;
  onCompleteOnboarding: () => void;
  allConsentFormsSigned?: boolean;
  canRejectReferral?: boolean;
}

const LeadDetailHeader: React.FC<LeadDetailHeaderProps> = ({
  fullName,
  activeTab,
  onTabChange,
  isFinalStatus,
  status,
  onRejectClick,
  onCompleteOnboarding,
  allConsentFormsSigned = false,
  canRejectReferral = true,
}) => {
  const navigate = useNavigate();
  const user = useAppSelector((state: any) => state.auth.user);
  const isNurse = user?.role?.name === "Nurse";

  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);

  const isRejectDisabled = isFinalStatus || !canRejectReferral;

  // Determine tooltip message based on status
  const getRejectTooltipMessage = (): string => {
    if (!canRejectReferral) return "You don't have permission";
    if (!isFinalStatus) return '';
    const normalizedStatus = status?.toUpperCase() || '';
    if (normalizedStatus === 'REJECTED') {
      return 'Cannot reject a referral that has already been rejected';
    }
    if (normalizedStatus === 'COMPLETED') {
      return 'Cannot reject a referral that has already been completed';
    }
    return 'This referral cannot be rejected';
  };
  const { hasPermission } = usePermission();
 const canCompletePermission = hasPermission("onboarding.complete");

  // Complete Onboarding is only allowed when all consent forms are signed
  // and status is ONBOARDING_IN_PROGRESS or UNDER_REVIEW
  const normalizedStatus = status?.toUpperCase() || '';
  const canCompleteOnboarding =
  (normalizedStatus === 'ONBOARDING_IN_PROGRESS' ||
   normalizedStatus === 'UNDER_REVIEW' ||
   normalizedStatus === 'DOCS_PENDING') &&
  allConsentFormsSigned;

  const onboardingSteps = [
    'Lead created',
    'Demographics & insurance details completed',
    'All consent forms filled',
    'All consent forms signed',
  ];
  const getCompleteOnboardingTooltipMessage = (): string => {
  if (!canCompletePermission) return "You don't have permission"; // ✅ ADD THIS FIRST

  if (canCompleteOnboarding) return '';

  if (normalizedStatus === 'REJECTED') {
    return 'Cannot complete onboarding for a rejected referral';
  }

  if (normalizedStatus === 'COMPLETED') {
    return 'Onboarding has already been completed';
  }

  if (normalizedStatus === 'DRAFT') {
    return 'Complete demographics and insurance details first';
  }

 if (normalizedStatus === 'DOCS_PENDING') {
  return 'Fill all consent forms and ensure they are signed';
}

  if (normalizedStatus === 'UNDER_REVIEW') {
    return 'Fill all consent forms and ensure they are signed';
  }

  if (normalizedStatus === 'ONBOARDING_IN_PROGRESS' && !allConsentFormsSigned) {
    return 'All consent forms must be signed to complete onboarding';
  }

  return 'Onboarding is not available at this stage';
};
const isCompleteDisabled = !canCompletePermission || !canCompleteOnboarding;

  return (
    <Grid size={{ xs: 12 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: { xs: 1.5, sm: 2 },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: { xs: 1, sm: 1.5, md: 1.75 },
          borderRadius: '10px',
          marginBottom: { xs: 1, sm: 1 },
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden', // Prevent content overflow
        }}
      >
        {/* Left Section: Back Button, Name, Tabs */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1.5, sm: 2.5 },
            flex: { xs: '1 1 100%', sm: '1 1 auto' },
            minWidth: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <IconButton
              onClick={() => navigate('/admin/leads')}
              sx={{
                padding: { xs: '6px', sm: '8px' },
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '16px', sm: '18px', md: '18px' },
                fontWeight: 600,
                color: '#3a3939',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: { xs: '200px', sm: '300px', md: 'none' },
              }}
            >
              {fullName}
            </Typography>
          </Box>

          {/* Tabs */}
          <Grid
            container
            sx={{
              border: '1px solid #E2E5E8',
              borderRadius: '4px',
              overflow: 'hidden',
              width: 'auto',
              maxWidth: '100%',
              flexShrink: 0,
            }}
          >
            <Grid
              size="auto"
              onClick={() => onTabChange('overview')}
              sx={{
                padding: { xs: '4px 12px', sm: '4px 16px' },
                backgroundColor: activeTab === 'overview' ? '#E3F2FD' : '#FFFFFF',
                color: '#212121',
                fontSize: { xs: '13px', sm: '14px' },
                fontWeight: 500,
                cursor: 'pointer',
                borderRight: '1px solid #E2E5E8',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                height: { xs: 28, sm: 30 },
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: activeTab === 'overview' ? '#E3F2FD' : '#F5F5F5',
                },
              }}
            >
              Overview
            </Grid>
           {!isNurse && (
  <Grid
    size="auto"
    onClick={() => onTabChange('documents')}
    sx={{
      padding: { xs: '4px 12px', sm: '4px 16px' },
      backgroundColor: activeTab === 'documents' ? '#E3F2FD' : '#FFFFFF',
      color: '#212121',
      fontSize: { xs: '13px', sm: '14px' },
      fontWeight: 500,
      cursor: 'pointer',
      borderRight: '1px solid #E2E5E8',
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      whiteSpace: 'nowrap',
      height: { xs: 28, sm: 30 },
      transition: 'background-color 0.2s',
      '&:hover': {
        backgroundColor: activeTab === 'documents' ? '#E3F2FD' : '#F5F5F5',
      },
    }}
  >
    <CheckCircleIcon
      sx={{ fontSize: { xs: '14px', sm: '16px' }, color: '#4CAF50' }}
    />
    Documents
  </Grid>
)}
            {!isNurse && (
              <Grid
                size="auto"
                onClick={() => onTabChange('consent')}
                sx={{
                  padding: { xs: '4px 12px', sm: '4px 16px' },
                  backgroundColor: activeTab === 'consent' ? '#E3F2FD' : '#FFFFFF',
                  color: '#212121',
                  fontSize: { xs: '13px', sm: '14px' },
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  whiteSpace: 'nowrap',
                  height: { xs: 28, sm: 30 },
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: activeTab === 'consent' ? '#E3F2FD' : '#F5F5F5',
                  },
                }}
              >
                <InfoIcon sx={{ fontSize: { xs: '14px', sm: '16px' }, color: '#FF9800' }} />
                Consent & Forms
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Right Section: Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 1 },
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Tooltip
            title={getRejectTooltipMessage()}
            arrow
            placement="top"
            disableHoverListener={!isRejectDisabled}
            disableFocusListener={!isRejectDisabled}
            disableTouchListener={!isRejectDisabled}
          >
            <span style={{ width: 'fit-content' }}>
              <Box
                component="button"
                onClick={onRejectClick}
                disabled={isRejectDisabled}
                sx={{
                  padding: { xs: '6px 12px', sm: '8px 16px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  color: isRejectDisabled ? '#9E9E9E' : '#D32F2F',
                  fontSize: { xs: '13px', sm: '14px' },
                  fontWeight: 500,
                  border: `1px solid ${isRejectDisabled ? '#9E9E9E' : '#D32F2F'}`,
                  cursor: isRejectDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  width: { xs: '100%', sm: 'auto' },
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: isRejectDisabled ? 'transparent' : 'rgba(211, 47, 47, 0.04)',
                  },
                  '&:disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: { xs: '14px', sm: '16px' } }} />
                Reject Referral
              </Box>
            </span>
          </Tooltip>

<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: -0.5 }}>
  <Tooltip
    title={
      !canCompletePermission
        ? "You don't have permission"
        : getCompleteOnboardingTooltipMessage()
    }
    arrow
    placement="top"
    disableHoverListener={!isCompleteDisabled}
    disableFocusListener={!isCompleteDisabled}
    disableTouchListener={!isCompleteDisabled}
  >
    <span style={{ width: 'fit-content' }}>
      <Box
        component="button"
        onClick={onCompleteOnboarding}
        disabled={isCompleteDisabled}
        sx={{
          padding: { xs: '6px 12px', sm: '8px 16px' },
          borderRadius: '4px',
          backgroundColor: isCompleteDisabled ? '#9E9E9E' : '#263874',
          color: '#FFFFFF',
          fontSize: { xs: '13px', sm: '14px' },
          fontWeight: 500,
          border: `1px solid ${isCompleteDisabled ? '#9E9E9E' : '#263874'}`,
          cursor: isCompleteDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          width: { xs: '100%', sm: 'auto' },
          whiteSpace: 'nowrap',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: isCompleteDisabled ? '#9E9E9E' : '#1d2b5c',
          },
          '&:disabled': {
            opacity: 0.6,
          },
        }}
      >
        <CheckIcon sx={{ fontSize: { xs: '14px', sm: '16px' } }} />
        Complete Onboarding
      </Box> 
    </span>
  </Tooltip>
  <Tooltip title="View onboarding requirements" arrow placement="top">
    <IconButton
      size="small"
      onClick={(e) => setInfoAnchorEl(e.currentTarget)}
      sx={{ color: '#5C6BC0', padding: '4px' }}
    >
      <InfoIcon sx={{ fontSize: { xs: '16px', sm: '18px' } }} />
    </IconButton>
  </Tooltip>
</Box>
<Popover
  open={Boolean(infoAnchorEl)}
  anchorEl={infoAnchorEl}
  onClose={() => setInfoAnchorEl(null)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  PaperProps={{ sx: { borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
>
  <Box sx={{ p: 2, minWidth: 280, maxWidth: 340 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: '#263874' }}>
      Complete Onboarding Requirements
    </Typography>
    <List dense disablePadding>
      {onboardingSteps.map((step, idx) => (
        <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
          <ListItemText
            primary={`${idx + 1}. ${step}`}
            primaryTypographyProps={{ fontSize: 13, color: '#424242' }}
          />
        </ListItem>
      ))}
    </List>
  </Box>
</Popover>


        </Box>
      </Box>

      {/* Divider */}
      <Box
        sx={{
          width: '100%',
          height: '1px',
          backgroundColor: '#ECEFF4',
          marginBottom: { xs: 1.25, sm: 1.5 },
        }}
      />
    </Grid>
  );
};

export default LeadDetailHeader;
