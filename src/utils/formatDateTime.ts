import dayjs, { type Dayjs } from 'dayjs';

/**
 * Format date to MM-DD-YYYY format
 * @param date - Date string, Date object, or Dayjs object
 * @returns Formatted date string in MM-DD-YYYY format
 */
export const formatDate = (date: string | Date | Dayjs | null | undefined): string => {
  if (!date) return '';
  
  try {
    const dayjsDate = dayjs(date);
    if (!dayjsDate.isValid()) return '';
    
    return dayjsDate.format('MM-DD-YYYY');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date with time to MM-DD-YYYY hrs format
 * @param date - Date string, Date object, or Dayjs object
 * @param includeSeconds - Whether to include seconds in the time
 * @returns Formatted date string in MM-DD-YYYY hrs format
 */
export const formatDateTime = (
  date: string | Date | Dayjs | null | undefined,
  includeSeconds: boolean = false
): string => {
  if (!date) return '';
  
  try {
    const dayjsDate = dayjs(date);
    if (!dayjsDate.isValid()) return '';
    
    const timeFormat = includeSeconds ? 'HH:mm:ss' : 'HH:mm';
    const formattedDate = dayjsDate.format('MM-DD-YYYY');
    const formattedTime = dayjsDate.format(timeFormat);
    
    return `${formattedDate} ${formattedTime} hrs`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '';
  }
};

/**
 * Convert 24-hour time format to 12-hour AM/PM format
 * @param time24 - Time string in 24-hour format (HH:mm or HH:mm:ss)
 * @returns Time string in 12-hour AM/PM format (h:mm AM/PM)
 */
export const formatTimeTo12Hour = (time24: string | null | undefined): string => {
  if (!time24) return '';
  
  try {
    // Handle different time formats (HH:mm, HH:mm:ss, or just HH:mm)
    const timeParts = time24.trim().split(':');
    if (timeParts.length < 2) return time24;
    
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    const seconds = timeParts[2] || '';
    
    if (isNaN(hours) || hours < 0 || hours > 23) return time24;
    
    let hours12 = hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    if (hours === 0) {
      hours12 = 12; // Midnight (00:xx) becomes 12:xx AM
    } else if (hours > 12) {
      hours12 = hours - 12; // Afternoon hours (13-23) become 1-11 PM
    }
    
    // Format with leading zero for single digit hours if needed
    const formattedHours = hours12.toString();
    const timeString = seconds 
      ? `${formattedHours}:${minutes}:${seconds} ${ampm}`
      : `${formattedHours}:${minutes} ${ampm}`;
    
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error);
    return time24;
  }
};

/**
 * Format date and time together with 12-hour AM/PM format
 * @param date - Date string, Date object, or Dayjs object
 * @param time24 - Optional time string in 24-hour format (if date doesn't include time)
 * @param includeSeconds - Whether to include seconds in the time
 * @returns Formatted date and time string in MM-DD-YYYY h:mm AM/PM format
 */
export const formatDateTimeWith12Hour = (
  date: string | Date | Dayjs | null | undefined,
  time24?: string | null,
  includeSeconds: boolean = false
): string => {
  if (!date) return '';
  
  try {
    const dayjsDate = dayjs(date);
    if (!dayjsDate.isValid()) return '';
    
    let timeString = '';
    
    // If time24 is provided separately, use it
    if (time24) {
      timeString = formatTimeTo12Hour(time24);
    } else {
      // Extract time from date object
      const hours = dayjsDate.hour();
      const minutes = dayjsDate.minute();
      const seconds = dayjsDate.second();
      
      const time24Format = includeSeconds 
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      timeString = formatTimeTo12Hour(time24Format);
    }
    
    const formattedDate = dayjsDate.format('MM-DD-YYYY');
    
    return timeString ? `${formattedDate} ${timeString}` : formattedDate;
  } catch (error) {
    console.error('Error formatting date time with 12-hour:', error);
    return '';
  }
};
