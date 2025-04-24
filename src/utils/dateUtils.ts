export const dateUtils = {
  formatDate: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  parseDate: (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  },

  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
  },

  isSameDay: (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  },

  isToday: (date: Date): boolean => {
    const today = new Date();
    return dateUtils.isSameDay(date, today);
  },
  
  isOverdue: (dateString: string): boolean => {
    const date = dateUtils.parseDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  },
  
  formatDisplayDate: (dateString: string): string => {
    const date = dateUtils.parseDate(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  // New utility function for formatting datetime for input fields
  formatDateTimeForInput: (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
};