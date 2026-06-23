import React, { useMemo, useState } from 'react';
import {
  Typography,
  Grid,
  Box,
  Avatar,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ListIcon from '@mui/icons-material/List';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CustomDrawer from '../../../components/custom-drawer/custom-drawer';
import ViewDocumentsDialog from './ViewDocumentsDialog';
import { useQuery } from '@tanstack/react-query';
import { getAppointmentOptions, getLeadDetailOptions } from '../../../sdk/@tanstack/react-query.gen';
import type { AppointmentData } from './AppointmentsTable';
import { formatTimeTo12Hour } from '../../../utils';
import dayjs from 'dayjs';

interface ViewAppointmentDrawerProps {
  open: boolean;
  appointment: AppointmentData | null;
  onClose: () => void;
  onEdit?: (appointment: AppointmentData) => void;
}

const formatFileSize = (bytes: number | undefined): string => {
  if (bytes == null || bytes === 0) return '0 B';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  const unit = ['B', 'KB', 'MB', 'GB'][i];
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`;
};

const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
    <Typography component="span" sx={{ fontSize: '14px', fontWeight: 400, color: '#30353A', fontFamily: '"Helvetica Neue", Arial, sans-serif', minWidth: '88px' }}>
      {label}:
    </Typography>
    <Typography component="span" sx={{ fontSize: '14px', fontWeight: 400, color: '#30353A', fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
      {value}
    </Typography>
  </Box>
);

interface MediaItem {
  id: string;
  file_url: string;
  original_filename?: string;
  file_size?: number;
  mime_type?: string;
}

const DocumentsBlock: React.FC<{
  media?: MediaItem[] | null;
  onDocumentClick?: (media: MediaItem[], index: number) => void;
}> = ({ media, onDocumentClick }) => {
  const hasDocs = Array.isArray(media) && media.length > 0;
  const labelSx = { fontSize: '14px', fontWeight: 400, color: '#30353A', fontFamily: '"Helvetica Neue", Arial, sans-serif' } as const;
  const secondarySx = { fontSize: '14px', fontWeight: 400, color: '#757775', fontFamily: '"Helvetica Neue", Arial, sans-serif' } as const;
  if (!hasDocs) {
    return (
      <Box sx={{ padding: '16px', border: '1px dashed #E7E9EB', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#FFFFFF' }}>
        <InsertDriveFileIcon sx={{ width: 24, height: 24, color: '#B0BEC5' }} />
        <Typography sx={secondarySx}>No documents attached</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ border: '1px solid #E7E9EB', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
      {media!.map((item, index) => (
        <Box
          key={item.id}
          onClick={() => onDocumentClick?.(media!, index)}
          role={onDocumentClick ? 'button' : undefined}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 16px',
            borderBottom: media!.length > 0 && index < media!.length - 1 ? '1px solid #E7E9EB' : 'none',
            ...(onDocumentClick && { cursor: 'pointer', '&:hover': { backgroundColor: '#F5F5F5' } }),
          }}
        >
          <InsertDriveFileIcon sx={{ width: 24, height: 24, color: '#64B5F6', flexShrink: 0, mt: '2px' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ ...labelSx, display: 'block', color: '#173B5B', ...(onDocumentClick && { textDecoration: 'underline' }) }}>
              {item.original_filename || item.id}
            </Typography>
            <Typography sx={{ ...secondarySx, fontSize: '13px', marginTop: '2px' }}>
              {formatFileSize(item.file_size)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const ViewAppointmentDrawer: React.FC<ViewAppointmentDrawerProps> = ({
  open,
  appointment,
  onClose,
  onEdit,
}) => {
  const [viewDocOpen, setViewDocOpen] = useState(false);
  const [viewDocFiles, setViewDocFiles] = useState<MediaItem[]>([]);
  const [viewDocInitialIndex, setViewDocInitialIndex] = useState(0);

  const handleDocumentClick = (media: MediaItem[], index: number) => {
    setViewDocFiles(media);
    setViewDocInitialIndex(index);
    setViewDocOpen(true);
  };

  // Fetch appointment details if UUID is available
  const { data: appointmentDetails, isLoading } = useQuery({
    ...getAppointmentOptions({
      path: {
        uuid: appointment?.uuid || '',
      },
    }),
    enabled: open && !!appointment?.uuid,
  });

  // Get lead UUID from appointment to fetch lead details
  const leadUuid = useMemo(() => {
    if (appointmentDetails && typeof appointmentDetails === 'object' && 'data' in appointmentDetails) {
      const details = appointmentDetails.data as any;
      return details.lead_uuid || appointment?.lead_uuid;
    }
    return appointment?.lead_uuid;
  }, [appointmentDetails, appointment]);

  // Fetch lead details for resident information
  const { data: leadDetails } = useQuery({
    ...getLeadDetailOptions({
      path: {
        uuid: leadUuid || '',
      },
    }),
    enabled: open && !!leadUuid,
  });

  // Get appointment data
  const appointmentData = useMemo(() => {
    if (appointmentDetails && typeof appointmentDetails === 'object' && 'data' in appointmentDetails) {
      const details = appointmentDetails.data as any;
      return {
        ...appointment,
        ...details,
      } as AppointmentData;
    }
    return appointment;
  }, [appointmentDetails, appointment]);

  // Get lead/resident data
  const leadData = useMemo(() => {
    if (leadDetails && typeof leadDetails === 'object' && 'data' in leadDetails) {
      return leadDetails.data as any;
    }
    return null;
  }, [leadDetails]);

  const referralDisplay = useMemo(() => {
    const apt: any = appointmentData;
    if (apt?.referral_number) return apt.referral_number;
    const ld: any = leadData;
    if (ld?.referral_number) return ld.referral_number;
    return "";
  }, [appointmentData, leadData]);

  const formatBirthDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = dayjs(dateString);
      if (!date.isValid()) return 'Unknown';
      const age = dayjs().diff(date, 'year');
      return `${date.format('MMMM D, YYYY')} (${age})`;
    } catch {
      return 'Unknown';
    }
  };

  const formatCreatedOn = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown';
    try {
      const date = dayjs(dateString);
      if (!date.isValid()) return 'Unknown';
      return date.format('MMMM D, YYYY [at] h:mm A');
    } catch {
      return 'Unknown';
    }
  };

  const getStatusColors = (status: string | undefined): { bg: string; color: string } => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'REQUESTED':
        return { bg: '#E3F2FD', color: '#1976D2' };
      case 'COMPLETED':
        return { bg: '#E6F4EA', color: '#137333' };
      case 'CANCELLED':
        return { bg: '#FCE8E6', color: '#C5221F' };
      default:
        return { bg: '#F2F2F2', color: '#757775' };
    }
  };

  const getUserInitials = (name: string | undefined): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
    }
    return name.charAt(0).toUpperCase();
  };

  const getResidentName = (): string => {
    if (appointmentData?.resident_name) {
      return appointmentData.resident_name;
    }
    if (leadData?.user) {
      const firstName = leadData.user.first_name || '';
      const lastName = leadData.user.last_name || '';
      return `${firstName} ${lastName}`.trim() || 'Unknown Resident';
    }
    return 'Unknown Resident';
  };

  const getGender = (): string => {
    if (leadData?.gender) {
      return leadData.gender;
    }
    return 'Unknown';
  };

  const getBirthDate = (): string => {
    if (leadData?.date_of_birth) {
      return formatBirthDate(leadData.date_of_birth);
    }
    return 'Unknown';
  };

  // console.log("leadData", leadData);

  const getRoomNumber = (): string => {
    if (appointmentData?.room?.room_number) {
      return `Room no ${appointmentData.room.room_number}`;
    }
    return '-';
  };

  const residentName = getResidentName();
  const statusColors = getStatusColors(appointmentData?.status);

  if (!appointmentData) {
    return null;
  }

  const formattedDate = appointmentData.appointment_date
    ? (() => {
      try {
        const date = dayjs(appointmentData.appointment_date);
        if (!date.isValid()) return 'Not set';
        return date.format('D MMMM YYYY'); // e.g., "25 December 2025"
      } catch {
        return 'Not set';
      }
    })()
    : 'Not set';

  const formattedTime = appointmentData.appointment_time
    ? formatTimeTo12Hour(appointmentData.appointment_time)
    : 'Not set';

  const formattedCreatedOn = formatCreatedOn(appointmentData.created_at);
  const createdByName = (appointmentData as { created_by_name?: string | null }).created_by_name
    ?? appointmentData.created_by_email
    ?? 'Unknown';

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      drawerWidth="600px"
      drawermargin="0"
      drawerPadding="0"
    >
      <Grid
        container
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "5px 16px",
            borderBottom: "1px solid #E3ECEF",
            flexShrink: 0,
            marginTop: "-10px",
          }}
        >
          <Typography
            sx={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#424342",
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
            }}
          >
            Appointment Details
          </Typography>
          <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {onEdit && appointmentData.status === "REQUESTED" && (
              <IconButton
                onClick={() => {
                  onEdit(appointmentData);
                  onClose();
                }}
                sx={{
                  padding: "6px",
                  borderRadius: "6px",
                  "&:hover": {
                    backgroundColor: "rgba(67, 147, 34, 0.04)",
                  },
                }}
              >

              </IconButton>
            )}
            <IconButton
              onClick={onClose}
              sx={{
                padding: "6px",
                borderRadius: "6px",
                "&:hover": {
                  backgroundColor: "rgba(67, 147, 34, 0.04)",
                },
              }}
            >
              <Typography sx={{ fontSize: "20px", color: "#2C2D2C" }}>
                ×
              </Typography>
            </IconButton>
          </Box>
        </Grid>

        {/* Content */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Appointment Title Section */}
          <Grid size={{ xs: 12 }}>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#30353A",
                fontFamily: '"Helvetica Neue", Arial, sans-serif',
                marginBottom: "16px",
              }}
            >
              {appointmentData.appointment_title || 'Appointment'}
            </Typography>

            {/* Patient Information Card */}
            <Grid
              container
              size={{ xs: 12 }}
              sx={{
                backgroundColor: "#F2F7FA",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <Avatar
                src={appointmentData?.avatar_url ?? undefined}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  fontSize: "24px",
                  fontWeight: 500,
                  backgroundColor: "#d1d1d1",
                }}
              >
                {getUserInitials(residentName)}
              </Avatar>

              <Grid
                size={{ xs: 12 }}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                {/* TOP ROW: Name + Referral + Status chip on right */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <Typography
                      sx={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#30353A",
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                      }}
                    >
                      {residentName}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: "14px",
                        fontWeight: 400,
                        color: "#757775",
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                      }}
                    >
                      ({referralDisplay})
                    </Typography>
                  </Box>

                  <Chip
                    label={appointmentData.status || "REQUESTED"}
                    sx={{
                      backgroundColor: statusColors.bg,
                      color: statusColors.color,
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                      fontSize: "12px",
                      fontWeight: 500,
                      height: "28px",
                      borderRadius: "6px",
                      "& .MuiChip-label": {
                        padding: "0 12px",
                      },
                    }}
                  />
                </Box>

                {/* SECOND ROW: Date | Gender | Room */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#757775",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    {getBirthDate()}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#757775",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    |
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#757775",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    {getGender()}
                  </Typography>
                   <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#757775",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    |
                  </Typography> 
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "#757775",
                      fontFamily: '"Helvetica Neue", Arial, sans-serif',
                    }}
                  >
                    {getRoomNumber()}
                  </Typography> 
                </Box>
              </Grid>
            </Grid>

          </Grid>

          {/* Appointment Details Section */}
          <Grid
            container
            size={{ xs: 12 }}
            sx={{
              backgroundColor: "#FFFFFF",
              borderRadius: "8px",
              border: "1px solid #E7E9EB",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {/* Date */}
            <Grid
              container
              size={{ xs: 12 }}
              sx={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <CalendarTodayIcon
                sx={{
                  width: 20,
                  height: 20,
                  color: "#757775",
                }}
              />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                }}
              >
                {formattedDate}
              </Typography>
            </Grid>

            {/* Time */}
            <Grid
              container
              size={{ xs: 12 }}
              sx={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <AccessTimeIcon
                sx={{
                  width: 20,
                  height: 20,
                  color: "#757775",
                }}
              />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                }}
              >
                {formattedTime}
              </Typography>
            </Grid>

            <Grid
              container
              size={{ xs: 12 }}
              sx={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <PersonIcon
                sx={{
                  width: 20,
                  height: 20,
                  color: "#757775",
                }}
              />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                }}
              >
                {appointmentData.contact_name || "-"}
              </Typography>
            </Grid>

            <Grid
              container
              size={{ xs: 12 }}
              sx={{ display: "flex", alignItems: "center", gap: "12px" }}
            >
              <EmailIcon
                sx={{
                  width: 20,
                  height: 20,
                  color: "#757775",
                }}
              />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                }}
              >
                {appointmentData.contact_email || "-"}
              </Typography>
            </Grid>

            <Grid
              container
              size={{ xs: 12 }}
              sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <ListIcon
                  sx={{
                    width: 20,
                    height: 20,
                    color: "#757775",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#30353A",
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  Description
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  marginLeft: "32px",
                  lineHeight: "1.5",
                }}
              >
                {appointmentData.description || "-"}
              </Typography>
            </Grid>

            <Grid
              container
              size={{ xs: 12 }}
              sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <DescriptionIcon
                  sx={{
                    width: 20,
                    height: 20,
                    color: "#757775",
                  }}
                />
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#30353A",
                    fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  }}
                >
                  Notes
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "#30353A",
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  marginLeft: "32px",
                  lineHeight: "1.5",
                }}
              >
                {appointmentData.action_note || "-"}
              </Typography>
            </Grid>
          </Grid>

          {/* Documents Section */}
          <Grid container size={{ xs: 12 }} sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Typography sx={{ fontSize: "16px", fontWeight: 600, color: "#30353A", fontFamily: '"Helvetica Neue", Arial, sans-serif' }}>
              Documents
            </Typography>
            <DocumentsBlock
              media={(appointmentData as { media?: MediaItem[] })?.media}
              onDocumentClick={handleDocumentClick}
            />
          </Grid>

          {/* Creation Metadata */}
          <Grid
            container
            size={{ xs: 12 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              paddingTop: "24px",
              marginTop: "8px",
              borderTop: "1px solid #E7E9EB",
            }}
          >
            <MetaRow label="Created By" value={createdByName} />
            <MetaRow label="Created On" value={formattedCreatedOn} />
          </Grid>
        </Grid>
      </Grid>

      <ViewDocumentsDialog
        open={viewDocOpen}
        onClose={() => setViewDocOpen(false)}
        files={viewDocFiles}
        title="Document Viewer"
        initialIndex={viewDocInitialIndex}
        allowDownload
      />
    </CustomDrawer>
  );
};

export default ViewAppointmentDrawer;
