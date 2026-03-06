// IST (Indian Standard Time) is UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Convert a date to IST and format for display
 */
export const formatToIST = (date: Date | string, formatStr: "datetime" | "date" | "time" = "datetime"): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Get UTC time and add IST offset
  const istDate = new Date(d.getTime() + IST_OFFSET_MS);
  
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = istDate.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const year = istDate.getUTCFullYear();
  const hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;

  if (formatStr === "date") {
    return `${month} ${day}, ${year}`;
  }
  if (formatStr === "time") {
    return `${hours12}:${minutes} ${ampm} IST`;
  }
  return `${month} ${day}, ${year} ${hours12}:${minutes} ${ampm} IST`;
};

/**
 * Format datetime-local input value to IST for display
 * The input value is in local time, we need to convert it for storage as UTC
 */
export const localInputToUTC = (localDateTimeStr: string): string => {
  // datetime-local gives us a string like "2024-01-15T10:30"
  // This is interpreted as local time by the browser
  const localDate = new Date(localDateTimeStr);
  return localDate.toISOString();
};

/**
 * Convert UTC date to local datetime-local input format
 */
export const utcToLocalInput = (utcDateStr: string): string => {
  const date = new Date(utcDateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert UTC date to IST datetime-local input format
 */
export const utcToISTInput = (utcDateStr: string): string => {
  const date = new Date(utcDateStr);
  // Add IST offset to get IST time
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert IST datetime-local input to UTC for storage
 */
export const istInputToUTC = (istDateTimeStr: string): string => {
  // Parse the datetime-local string as IST and convert to UTC
  const [datePart, timePart] = istDateTimeStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date in UTC with IST values, then subtract IST offset
  const istAsUTC = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  const utcTime = istAsUTC - IST_OFFSET_MS;
  
  return new Date(utcTime).toISOString();
};
