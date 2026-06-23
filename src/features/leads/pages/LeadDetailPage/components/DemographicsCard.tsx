import React from 'react';
import { Grid, Typography, Avatar, IconButton, Divider, Tooltip } from '@mui/material';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import dayjs from 'dayjs';
import { getInitials } from '../utils/dataExtraction';
import { STATUS_COLORS, DEFAULT_STATUS_COLORS } from '../constants';
import type { ExtractedLeadData } from '../types';

interface DemographicsCardProps {
  data: ExtractedLeadData;
  avatarError: boolean;
  onAvatarError: () => void;
  onEditClick: () => void;
  disabled?: boolean;
}

/** Shared label style */
const labelSx = {
  fontSize: { xs: '12px', sm: '13px', md: '14px' },
  color: '#636262',
  flexShrink: 0,
  lineHeight: 1.5,
  whiteSpace: 'nowrap' as const,
  // fixed label widths so value column always has room
  minWidth: { xs: '95px', sm: '110px', md: '120px' },
  maxWidth: { xs: '95px', sm: '110px', md: '120px' },
};

/** Shared value style — ellipsis truncation */
const valueSx = {
  fontSize: { xs: '12px', sm: '13px', md: '14px' },
  color: '#212121',
  lineHeight: 1.5,
  // ellipsis
  flex: 1,
  minWidth: 0,
  overflow: 'hidden' as const,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap' as const,
};

/** A single label : value row with ellipsis + hover tooltip */
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Grid
    container
    size={12}
    sx={{ alignItems: 'center', mb: 1, flexWrap: 'nowrap', minWidth: 0, overflow: 'hidden' }}
  >
    <Typography variant="body2" sx={labelSx}>
      {label}
    </Typography>
    <Tooltip title={value || ''} arrow disableHoverListener={!value || value.length < 25}>
      <Typography variant="body2" sx={valueSx}>
        : {value}
      </Typography>
    </Tooltip>
  </Grid>
);

const DemographicsCard: React.FC<DemographicsCardProps> = ({
  data,
  avatarError,
  onAvatarError,
  onEditClick,
  disabled = false,
}) => {
  const statusColors = STATUS_COLORS[data.status.toUpperCase()] || DEFAULT_STATUS_COLORS;
  const isDisabled = disabled || data.isFinalStatus;

  return (
    <Grid
      size={{ xs: 12 }}
      sx={{
        border: '1px solid #d0d4d9',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        padding: { xs: 1.5, sm: 2.5, md: 3 },
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Header row ── */}
      <Grid
        container
        size={12}
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.25, flexWrap: 'nowrap' }}
      >
        <Grid size="auto">
          <Grid container sx={{ alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
            <PersonOutlinedIcon sx={{ color: '#525552', fontSize: '20px', flexShrink: 0 }} />
            <Typography
              variant="h6"
              sx={{ fontSize: { xs: '15px', sm: '16px' }, fontWeight: 600, color: '#464646' }}
            >
              Demographics
            </Typography>
          </Grid>
        </Grid>

        {/* Right side: edit button only */}
        <Grid size="auto">
          <Tooltip
            title={
              disabled
                ? "You don't have permission"
                : data.status?.toUpperCase() === 'COMPLETED'
                ? 'This lead is finalized. Please edit details from the Resident section.'
                : data.status?.toUpperCase() === 'REJECTED'
                ? 'This lead has been rejected and can no longer be edited.'
                : ''
            }
            arrow
            disableHoverListener={!isDisabled}
            disableFocusListener={!isDisabled}
            disableTouchListener={!isDisabled}
          >
            {/* span wrapper needed when button is disabled */}
            <span>
              <IconButton
                sx={{ padding: '4px', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
                onClick={onEditClick}
                disabled={isDisabled}
              >
                <EditOutlinedIcon sx={{ fontSize: '18px', color: '#757775' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2, mx: { xs: 0, sm: 1.25 } }} />

      {/* ── Avatar + Info ── */}
      <Grid container size={12} spacing={2} sx={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        {/* Avatar — fixed width, never shrinks */}
        <Grid size="auto" sx={{ flexShrink: 0 }}>
          <Avatar
            src={data.user.avatar_url && !avatarError ? data.user.avatar_url : undefined}
            sx={{
              width: { xs: 44, sm: 56, md: 64 },
              height: { xs: 44, sm: 56, md: 64 },
              fontSize: { xs: '16px', sm: '20px', md: '24px' },
              fontWeight: 500,
            }}
            imgProps={{ referrerPolicy: 'no-referrer', onError: onAvatarError }}
          >
            {!data.user.avatar_url || avatarError ? getInitials(data.fullName) : null}
          </Avatar>
        </Grid>

        {/* Info columns — "grow" so it takes remaining space AND is properly bounded */}
        <Grid
          size="grow"
          sx={{ minWidth: 0, overflow: 'hidden' }}
        >
          <Grid container size={12} spacing={{ xs: 1, sm: 2 }}>

            {/* ── Left column ── */}
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 0, overflow: 'hidden' }}>
              <InfoRow label="Resident Name"  value={data.fullName} />
              <InfoRow label="Referral ID"    value={data.referralId} />
              <InfoRow label="Referral Source" value={data.referralSource} />
              <InfoRow label="Address"        value={data.guardianAddress} />
            </Grid>

            {/* ── Right column ── */}
            <Grid size={{ xs: 12, sm: 6 }} sx={{ minWidth: 0, overflow: 'hidden' }}>

              {/* Gender row — status badge floated to far right */}
              <Grid
                container
                size={12}
                sx={{
                  alignItems: 'center',
                  mb: 1,
                  flexWrap: 'nowrap',
                  minWidth: 0,
                  overflow: 'hidden',
                  justifyContent: 'space-between',
                }}
              >
                <Grid container sx={{ alignItems: 'center', flexWrap: 'nowrap', flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={labelSx}>
                    Gender
                  </Typography>
                  <Typography variant="body2" sx={valueSx}>
                    : {data.gender}
                  </Typography>
                </Grid>
                {data.status && (
                  <Typography
                    sx={{
                      fontSize: { xs: '10px', sm: '11px' },
                      color: statusColors.color,
                      backgroundColor: statusColors.backgroundColor,
                      padding: { xs: '2px 6px', sm: '3px 8px' },
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      ml: 1,
                      fontWeight: 500,
                    }}
                  >
                    {data.status}
                  </Typography>
                )}
              </Grid>

              <InfoRow
                label="Date of Birth"
                value={data.dateOfBirth ? dayjs(data.dateOfBirth).format('MM/DD/YYYY') : 'N/A'}
              />
              <InfoRow label="Age"          value={String(data.age ?? '—')} />
              <InfoRow label="Phone Number" value={data.contactNumber} />
              <InfoRow label="Email"        value={data.email} />
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DemographicsCard;
