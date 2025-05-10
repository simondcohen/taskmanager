import dayjs from "dayjs";  
import utc from "dayjs/plugin/utc";  
import tz from "dayjs/plugin/timezone";  
dayjs.extend(utc);  
dayjs.extend(tz);  
  
// Always read & return ISO with offset, e.g. 2025-05-09T21:00:00-07:00  
export const toStorage = (d: Date | string) => dayjs(d).format();  
  
// Parse from storage and hand back **local** Date objects  
export const fromStorage = (iso: string) => dayjs(iso).toDate();

// For testing purposes
export const formatDateOnly = (iso: string) => dayjs(iso).format("YYYY-MM-DD"); 