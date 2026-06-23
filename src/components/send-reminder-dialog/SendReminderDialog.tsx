import React from 'react';
import {
  Button,
  Box,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CustomDialog from '../custom-dialog/custom-dialog';

interface SendReminderDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (subject: string, body: string) => void;
  loading?: boolean;
  clientName?: string;
}

const SendReminderDialog: React.FC<SendReminderDialogProps> = ({
  open,
  onClose,
  onSend,
  loading = false,
  clientName,
}) => {
  const handleSend = () => {
    // Send with empty subject and body as API uses predefined template
    onSend('', '');
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Send Escalation Mail to PO"
      buttonName={[]}
      width="600px"
      padding="24px"
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          width: { xs: '95%', sm: '600px' },
          maxWidth: { xs: '95%', sm: '600px' },
          margin: { xs: '16px', sm: '32px' },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: '16px', sm: '20px' }, paddingTop: '8px', maxHeight: { xs: 'calc(100vh - 180px)', sm: 'auto' }, overflowY: 'auto' }}>
          {/* Information Box */}
          <Box
            sx={{
              backgroundColor: '#FFF9E6',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #FFE8A3',
            }}
          >
              <Typography
                sx={{
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  fontSize: { xs: '12px', sm: '13px' },
                  fontWeight: 400,
                  color: '#856404',
                  lineHeight: '18px',
                }}
              >
                This will send a predefined escalation email to the Probation Officer regarding the client's 4 consecutive missed sessions.
              </Typography>
          </Box>

          {/* Client Info */}
          {clientName && (
            <Box
              sx={{
                backgroundColor: '#F9FAF9',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E7E9EB',
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  fontSize: { xs: '11px', sm: '12px' },
                  fontWeight: 500,
                  color: '#757775',
                  marginBottom: '4px',
                }}
              >
                Client:
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Helvetica Neue", Arial, sans-serif',
                  fontSize: { xs: '13px', sm: '14px' },
                  fontWeight: 500,
                  color: '#2C2D2C',
                }}
              >
                {clientName}
              </Typography>
            </Box>
          )}

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '24px',
            marginTop: '24px',
            borderTop: '1px solid #E7E9EB',
          }}
        >
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #C5C9C5',
              color: '#2C2D2C',
              borderRadius: '6px',
              padding: { xs: '12px 16px', sm: '10px 16px' },
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: 500,
              lineHeight: '20px',
              textTransform: 'none',
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
              width: { xs: '100%', sm: 'auto' },
              '&:hover': {
                backgroundColor: '#F9FAF9',
                borderColor: '#C5C9C5',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            startIcon={<SendIcon sx={{ width: '18px', height: '18px' }} />}
            sx={{
              backgroundColor: '#439322',
              color: '#FFFFFF',
              border: '1px solid #439322',
              borderRadius: '6px',
              padding: { xs: '12px 16px', sm: '10px 16px' },
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: 500,
              lineHeight: '20px',
              textTransform: 'none',
              fontFamily: '"Helvetica Neue", Arial, sans-serif',
              boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
              width: { xs: '100%', sm: 'auto' },
              '&:hover': {
                backgroundColor: '#3a7d1d',
              },
              '&:disabled': {
                backgroundColor: '#E7E9EB',
                color: '#989998',
                border: '1px solid #E7E9EB',
              },
            }}
          >
            {loading ? 'Sending...' : 'Send Email'}
          </Button>
        </Box>
      </Box>
    </CustomDialog>
  );
};

export default SendReminderDialog;

