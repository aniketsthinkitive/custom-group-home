import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Box,
} from '@mui/material';
import { 
  heading, 
  tableCellCss, 
  tableContainerCss,
  skeletonRowCss,
  skeletonCellCss 
} from './widgets/common-table-widgets';

interface TableHeader {
  id: string;
  label: string;
  width: string;
}

interface TableSkeletonProps {
  headers: TableHeader[];
  rowCount?: number;
  hasCheckbox?: boolean;
  hasAvatar?: boolean;
  hasActions?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  headers,
  rowCount = 5,
  hasCheckbox = true,
  hasAvatar = true,
  hasActions = true,
}) => {
  const renderSkeletonCell = (header: TableHeader, index: number) => {
    // Checkbox column
    if (header.id === 'select' || (hasCheckbox && index === 0)) {
      return (
        <Skeleton
          variant="rectangular"
          width={16}
          height={16}
          sx={{ borderRadius: '4px' }}
        />
      );
    }

    // Avatar + text column (usually client name)
    if (hasAvatar && (header.id === 'clientName' || index === 2)) {
      return (
        <Box display="flex" alignItems="center" gap="12px">
          <Skeleton variant="circular" width={32} height={32} />
          <Box display="flex" flexDirection="column" gap="4px" flex={1}>
            <Skeleton variant="text" width="80%" height={16} />
            <Skeleton variant="text" width="60%" height={12} />
          </Box>
        </Box>
      );
    }

    // Actions column
    if (header.id === 'actions' || (hasActions && index === headers.length - 1)) {
      return (
        <Box display="flex" gap="16px" alignItems="center">
          <Skeleton variant="rectangular" width={70} height={32} sx={{ borderRadius: '6px' }} />
          <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: '6px' }} />
        </Box>
      );
    }

    // Regular text columns
    const textWidth = header.id === 'treatmentDescription' ? '90%' : 
                     header.id === 'clientId' ? '70%' : 
                     header.id === 'code' ? '50%' : '75%';

    return <Skeleton variant="text" width={textWidth} height={16} />;
  };

  return (
    <TableContainer sx={tableContainerCss}>
      <Table stickyHeader aria-label="table skeleton" sx={{ ...tableCellCss, tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          {headers.map((header) => (
            <col key={header.id} style={{ width: header.width }} />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
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
                  <Skeleton
                    variant="rectangular"
                    width={16}
                    height={16}
                    sx={{ borderRadius: '4px' }}
                  />
                ) : (
                  <Skeleton variant="text" width="60%" height={14} />
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={`skeleton-row-${rowIndex}`} sx={skeletonRowCss}>
              {headers.map((header, cellIndex) => (
                <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`} sx={skeletonCellCss}>
                  {renderSkeletonCell(header, cellIndex)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableSkeleton;
