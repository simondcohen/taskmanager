export interface Task {
  text: string;
  completed?: boolean;
  notCompleted?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface DailyChecklists {
  [date: string]: Task[];
}

export interface DailyNote {
  id: number;
  content: string;
  createdAt: string;
}

export interface TodoItem {
  id: number;
  text: string;
  deadline: string | null;
  time: string | null;
  completed: boolean;
  dateAdded: string;
  category?: string;
}

export interface ReadingItem {
  id: number;
  url?: string;
  title: string;
  siteName?: string;
  description?: string;
  imageUrl?: string;
  notes?: string;
  completed: boolean;
  dateAdded: string;
}

export interface EntertainmentItem {
  id: number;
  title: string;
  notes?: string;
  completed: boolean;
  dateAdded: string;
}

export interface VideoItem {
  id: number;
  url: string;
  title: string;
  thumbnailUrl: string;
  notes?: string;
  completed: boolean;
  dateAdded: string;
}

export interface PodcastItem {
  id: number;
  title: string;
  creator?: string;
  episode?: string;
  notes?: string;
  completed: boolean;
  dateAdded: string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  category: 'household' | 'electronics' | 'clothing' | 'other';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  completed: boolean;
  dateAdded: string;
}

export interface GroceryItem {
  id: number;
  name: string;
  quantity: number;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'beverages' | 'snacks' | 'other';
  unit?: string;
  notes?: string;
  completed: boolean;
  dateAdded: string;
}

export interface DeadlineItem { 
  id: string; 
  title: string; 
  dueDate: string; 
  notes?: string;
  completed?: boolean;
}

export type Tab = 'daily' | 'notes' | 'todos' | 'data' | 'reading' | 'entertainment' | 'videos' | 'shopping' | 'grocery' | 'podcasts' | 'deadlines' | 'calendar';

export interface CalendarDay {
  day: number;
  date: string;
  currentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasChecklist: boolean;
}

export interface DateUtils {
  formatDate: (date: Date) => string;
  parseDate: (dateStr: string) => Date;
  addDays: (date: Date, days: number) => Date;
  isSameDay: (date1: Date, date2: Date) => boolean;
  isToday: (date: Date) => boolean;
}

export interface EventItem {
  id?: string; // assigned when saved
  title: string;
  start_ts: string; // ISO 8601 string
  end_ts: string; // ISO 8601 string
  notes?: string;
  recurrence?: string; // '' or 'weekly:MO,TU'
}