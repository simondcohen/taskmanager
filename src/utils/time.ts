import dayjs from "dayjs";  
import utc from "dayjs/plugin/utc";  
import tz from "dayjs/plugin/timezone";  
dayjs.extend(utc);  
dayjs.extend(tz);  
  
// Always read & return ISO with offset, e.g. 2025-05-09T21:00:00-07:00  
export const toStorage = (d: Date | string) => dayjs(d).format();  
  
// Parse from storage and preserve the exact date and time (fixes timezone issue)
export const fromStorage = (iso: string) => {
  // Use dayjs to parse the ISO string while preserving the exact datetime
  // This maintains both date and time information from the original timestamp
  return dayjs(iso).toDate();
};

// For testing purposes
export const formatDateOnly = (iso: string) => dayjs(iso).format("YYYY-MM-DD"); 