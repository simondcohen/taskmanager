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

export interface TodoItem {
  id: number;
  text: string;
  deadline: string | null;
  time: string | null;
  completed: boolean;
  completedAt: string | null;
  dateAdded: string;
  category?: string;
  parentCategory?: 'work' | 'personal';
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
  category?: string;
}

export interface BookItem {
  id: number;
  title: string;
  author?: string;
  notes?: string;
  completed: boolean;
  dateAdded: string;
  category?: string;
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
  category?: string;
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

export interface MedicationItem {
  id: number;
  name: string;
  dose: number;
  date: string;
  time: string;
  notes?: string;
  timestamp: string; // ISO string for sorting
}

export type Tab = 
  | 'daily' 
  | 'todos' 
  | 'data' 
  | 'reading' 
  | 'entertainment' 
  | 'videos' 
  | 'shopping'
  | 'grocery'
  | 'podcasts'
  | 'medications'
  | 'books';

export interface DateUtils {
  formatDate: (date: Date) => string;
  parseDate: (dateStr: string) => Date;
  addDays: (date: Date, days: number) => Date;
  isSameDay: (date1: Date, date2: Date) => boolean;
  isToday: (date: Date) => boolean;
}

export interface Category {
  name: string;
  color: string;
  parentCategory: 'work' | 'personal';
}