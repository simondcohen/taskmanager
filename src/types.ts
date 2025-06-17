export interface Task {
  text: string;
  completed?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface DailyChecklists {
  [date: string]: Task[];
}


export interface MedicationItem {
  id: number;
  name: string;
  dose: number;
  date: string;
  time: string;
  notes?: string;
  timestamp: string; // ISO string for sorting
}

export type Tab = 'daily' | 'medications';

export interface DateUtils {
  formatDate: (date: Date) => string;
  parseDate: (dateStr: string) => Date;
  addDays: (date: Date, days: number) => Date;
  isSameDay: (date1: Date, date2: Date) => boolean;
  isToday: (date: Date) => boolean;
}
