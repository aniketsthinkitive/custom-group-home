/**
 * Format phone number to (XXX) XXX-XXXX format
 * @param phone - Phone number as string or number
 * @returns Formatted phone number string
 */
const formatPhone = (phone: string | number | null | undefined): string => {
  if (!phone) return '-';
  
  // Convert to string and remove all non-numeric characters
  const cleaned = String(phone).replace(/\D/g, '');
  
  // If empty after cleaning, return dash
  if (cleaned.length === 0) return '-';
  
  // Format based on length
  if (cleaned.length === 10) {
    const areaCode = cleaned.slice(0, 3);
    const firstPart = cleaned.slice(3, 6);
    const secondPart = cleaned.slice(6, 10);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
  }
  
  // If not 10 digits, return as is (or could format differently)
  return cleaned;
};

export default formatPhone;
