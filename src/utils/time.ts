import dayjs from "dayjs";  
import utc from "dayjs/plugin/utc";  
import tz from "dayjs/plugin/timezone";  
dayjs.extend(utc);  
dayjs.extend(tz);  
  
// Always read & return ISO with offset, e.g. 2025-05-09T21:00:00-07:00  
export const toStorage = (d: Date | string) => dayjs(d).format();  
  
// Parse from storage and preserve the exact date (fixes timezone issue)
export const fromStorage = (iso: string) => {
  // Use parse the date directly without timezone conversion
  // First split the date string to extract date parts
  const parts = iso.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JS Date
    const day = parseInt(parts[2]);
    
    // Create a new date with time set to noon to avoid any date shifting issues
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  
  // Fallback to regular parsing if format isn't as expected
  return dayjs(iso).toDate();
};

// For testing purposes
export const formatDateOnly = (iso: string) => dayjs(iso).format("YYYY-MM-DD"); 