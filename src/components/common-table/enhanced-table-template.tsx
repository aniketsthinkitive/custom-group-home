import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Avatar,
  Checkbox,
  Button,
  Paper,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  heading,
  tableCellCss,
  primaryTextCss,
  secondaryTextCss,
  tertiaryTextCss,
  checkboxCss,
  denyButtonCss,
  approveButtonCss,
  avatarCss,
  tableContainerCss,
} from './widgets/common-table-widgets';
import TableSkeleton from './TableSkeleton';

interface ClientData {
  id: string;
  clientId: string;
  clientName: string;
  organization?: string;
  email?: string;
  avatar?: string;
  type: string;
  code: string;
  treatmentDescription: string;
  reason: string;
  isSelected?: boolean;
}

// Mock data
const mockClientData: ClientData[] = [
  {
    id: '1',
    clientId: '4526311',
    clientName: 'Leon Kennedy',
    organization: 'Denver Health Group',
    type: 'Group',
    code: '1004',
    treatmentDescription: '2025 Level II DUI Education',
    reason: 'Military',
  },
  {
    id: '2',
    clientId: '4526311',
    clientName: 'James Bond',
    organization: 'Denver Health Group',
    type: 'Group',
    code: '1004',
    treatmentDescription: '2025 DUI Intake Assessment',
    reason: 'Court',
  },
  {
    id: '3',
    clientId: '4526311',
    clientName: 'Wade Warren',
    email: 'sample.email@example.com',
    type: 'Individual',
    code: '1004',
    treatmentDescription: 'Clinical Intake Fee',
    reason: 'Probation',
  },
  {
    id: '4',
    clientId: '4526311',
    clientName: 'Darlene Robertson',
    email: 'sample.email@example.com',
    type: 'Individual',
    code: '1004',
    treatmentDescription: '2025 Level II DUI Education',
    reason: 'Medical',
  },
  {
    id: '5',
    clientId: '4526311',
    clientName: 'Jack Krauser',
    organization: 'Denver Health Group 2',
    type: 'Group',
    code: '1004',
    treatmentDescription: '2025 Track D DUI Therapy Program',
    reason: 'Military',
  },
];

interface EnhancedTableProps {
  initialData?: ClientData[];
  loading?: boolean;
}

const tableHeaders = [
  { id: 'select', label: '', width: '48px' },
  { id: 'clientId', label: 'Client ID', width: '120px' },
  { id: 'clientName', label: 'Client Name', width: '200px' },
  { id: 'type', label: 'Type', width: '120px' },
  { id: 'code', label: 'Code', width: '100px' },
  { id: 'treatmentDescription', label: 'Treatment Description', width: '240px' },
  { id: 'reason', label: 'Reason', width: '120px' },
  { id: 'actions', label: 'Actions', width: '160px' },
];

const EnhancedTableTemplate: React.FC<EnhancedTableProps> = ({
  initialData = mockClientData,
  loading: externalLoading = false,
}) => {
  const [data, setData] = useState<ClientData[]>(initialData);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);

  // Use external loading state and update data when initialData changes
  React.useEffect(() => {
    if (!externalLoading) {
      setData(initialData);
    }
  }, [initialData, externalLoading]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(data.map(row => row.id));
      setAllSelected(true);
    } else {
      setSelectedRows([]);
      setAllSelected(false);
    }
  };

  const handleSelectRow = (clientId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = [...selectedRows, clientId];
      setSelectedRows(newSelected);
      setAllSelected(newSelected.length === data.length);
    } else {
      const newSelected = selectedRows.filter(id => id !== clientId);
      setSelectedRows(newSelected);
      setAllSelected(false);
    }
  };

  const handleApprove = (clientId: string) => () => {
    // Here you would typically make an API call
    const updatedData = data.filter(item => item.id !== clientId);
    setData(updatedData);
    setSelectedRows(selectedRows.filter(id => id !== clientId));
  };

  const handleDeny = (clientId: string) => () => {
    // Here you would typically make an API call
    const updatedData = data.filter(item => item.id !== clientId);
    setData(updatedData);
    setSelectedRows(selectedRows.filter(id => id !== clientId));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show skeleton loader when loading
  if (externalLoading) {
    return (
      <Paper sx={{ overflow: 'hidden' }}>
        <TableSkeleton 
          headers={tableHeaders}
          rowCount={5}
          hasCheckbox={true}
          hasAvatar={true}
          hasActions={true}
        />
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <TableContainer sx={tableContainerCss}>
        <Table stickyHeader aria-label="enhanced table" sx={tableCellCss}>
          <TableHead>
            <TableRow>
              {tableHeaders.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    ...heading,
                    width: header.width,
                    minWidth: header.width,
                  }}
                  align="left"
                >
                  {header.id === 'select' ? (
                    <Checkbox
                      size="small"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      sx={checkboxCss}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < data.length}
                    />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 500,
                        lineHeight: '1.2',
                        color: '#757775', // Neutral/60
                        fontFamily: '"Helvetica Neue", Arial, sans-serif',
                      }}
                    >
                      {header.label}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableHeaders.length} align="center">
                  <Typography
                    sx={{
                      padding: '40px 0',
                      color: '#989998', // Neutral/50
                      fontSize: '14px',
                    }}
                  >
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  {/* Checkbox Column */}
                  <TableCell sx={heading} align="left">
                    <Checkbox
                      size="small"
                      checked={selectedRows.includes(row.id)}
                      onChange={handleSelectRow(row.id)}
                      sx={checkboxCss}
                    />
                  </TableCell>

                  {/* Client ID Column */}
                  <TableCell sx={heading} align="left">
                    <Typography sx={primaryTextCss}>
                      {row.clientId}
                    </Typography>
                  </TableCell>

                  {/* Client Name Column */}
                  <TableCell sx={heading} align="left">
                    <Box display="flex" alignItems="center" gap="12px">
                      <Avatar
                        src={row.avatar}
                        sx={avatarCss}
                      >
                        {!row.avatar && getInitials(row.clientName)}
                      </Avatar>
                      <Box display="flex" flexDirection="column" gap="2px">
                        <Typography sx={primaryTextCss}>
                          {row.clientName}
                        </Typography>
                        {row.organization && (
                          <Typography sx={secondaryTextCss}>
                            {row.organization}
                          </Typography>
                        )}
                        {row.email && !row.organization && (
                          <Typography sx={tertiaryTextCss}>
                            {row.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Type Column */}
                  <TableCell sx={heading} align="left">
                    <Typography sx={primaryTextCss}>
                      {row.type}
                    </Typography>
                  </TableCell>

                  {/* Code Column */}
                  <TableCell sx={heading} align="left">
                    <Typography sx={primaryTextCss}>
                      {row.code}
                    </Typography>
                  </TableCell>

                  {/* Treatment Description Column */}
                  <TableCell sx={heading} align="left">
                    <Typography sx={primaryTextCss}>
                      {row.treatmentDescription}
                    </Typography>
                  </TableCell>

                  {/* Reason Column */}
                  <TableCell sx={heading} align="left">
                    <Typography sx={primaryTextCss}>
                      {row.reason}
                    </Typography>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell sx={heading} align="left">
                    <Box display="flex" gap="16px" alignItems="center">
                      <Button
                        startIcon={<CloseIcon sx={{ width: 18, height: 18 }} />}
                        sx={denyButtonCss}
                        onClick={handleDeny(row.id)}
                      >
                        Deny
                      </Button>
                      <Button
                        startIcon={<CheckIcon sx={{ width: 18, height: 18 }} />}
                        sx={approveButtonCss}
                        onClick={handleApprove(row.id)}
                      >
                        Approve
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default EnhancedTableTemplate;
