/**
 * Get the full URL for an image path
 * If the path is already a full URL, return it as is
 * Otherwise, prepend the API base URL
 */
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // If it's already a full URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Get API base URL from environment or use default
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  
  // Remove leading slash from path if present (to avoid double slashes)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Construct full URL
  return apiBaseUrl ? `${apiBaseUrl}/${cleanPath}` : `/${cleanPath}`;
};

// Re-export auth utilities
export * from './auth';

// Re-export formatPhone
export { default as formatPhone } from './formatPhone';

// Re-export date/time formatting utilities
export {
  formatDate,
  formatDateTime,
  formatTimeTo12Hour,
  formatDateTimeWith12Hour,
} from './formatDateTime';
