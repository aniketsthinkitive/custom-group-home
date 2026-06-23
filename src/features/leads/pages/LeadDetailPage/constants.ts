/**
 * Constants and types for LeadDetailPage
 */

export type LeadTab = "overview" | "documents" | "consent";

/**
 * Status color mappings for lead status badges
 */
export const STATUS_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  REJECTED: { backgroundColor: '#FFEBEE', color: '#C62828' },
  COMPLETED: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
  DOCS_PENDING: { backgroundColor: '#FFF3E0', color: '#E65100' },
  'DOCS PENDING': { backgroundColor: '#FFF3E0', color: '#E65100' },
  DRAFT: { backgroundColor: '#F5F5F5', color: '#616161' },
  UNDER_REVIEW: { backgroundColor: '#E3F2FD', color: '#1565C0' },
  'UNDER REVIEW': { backgroundColor: '#E3F2FD', color: '#1565C0' },
  ONBOARDING_IN_PROGRESS: { backgroundColor: '#E1BEE7', color: '#6A1B9A' },
  'ONBOARDING IN PROGRESS': { backgroundColor: '#E1BEE7', color: '#6A1B9A' },
};

export const DEFAULT_STATUS_COLORS = { backgroundColor: '#E3F2FD', color: '#0A2E45' };

/**
 * Spacing constants using theme spacing system (8px base unit)
 */
export const SPACING = {
  xs: 1,   // 8px
  sm: 2,   // 16px
  md: 3,   // 24px
  lg: 4,   // 32px
  xl: 5,   // 40px
} as const;

/**
 * Responsive padding values
 */
export const CONTAINER_PADDING = {
  xs: 1.5,  // 12px
  sm: 2.5,  // 20px
  md: 3,    // 24px
} as const;

/**
 * Card border radius
 */
export const CARD_BORDER_RADIUS = '8px';

/**
 * Card border color
 */
export const CARD_BORDER_COLOR = '#e8ebee';

/**
 * Background colors
 */
export const COLORS = {
  background: '#ecf1f7',
  cardBackground: '#FFFFFF',
  divider: '#ECEFF4',
  textPrimary: '#212121',
  textSecondary: '#636262',
  textTertiary: '#757775',
} as const;
