import { STATUS_COLORS, DEFAULT_STATUS_COLORS } from '../constants';

/**
 * Get status colors for a given status string
 */
export const getStatusColors = (status: string): { backgroundColor: string; color: string } => {
  const normalizedStatus = status?.toUpperCase() || '';
  return STATUS_COLORS[normalizedStatus] || DEFAULT_STATUS_COLORS;
};
