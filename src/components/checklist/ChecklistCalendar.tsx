import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarDay } from '../../types';
import { dateUtils } from '../../utils/dateUtils';

interface ChecklistCalendarProps {
  selectedDay: string;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  calendarMonth: number;
  calendarYear: number;
  navigateMonth: (direction: number) => void;
  calendarDays: CalendarDay[];
  onSelectDay: (day: CalendarDay) => void;
  isFutureDate: (date: Date) => boolean;
}

export function ChecklistCalendar({
  selectedDay,
  showCalendar,
  setShowCalendar,
  calendarMonth,
  calendarYear,
  navigateMonth,
  calendarDays,
  onSelectDay,
  isFutureDate
}: ChecklistCalendarProps) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = dateUtils.parseDate(dateStr);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      return dateStr;
    }
  };

  const calendarMonthYear = new Date(calendarYear, calendarMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="text-center">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="group relative inline-flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
      >
        <CalendarIcon className="w-5 h-5" />
        <span className="font-medium">
          {selectedDay
            ? formatDateDisplay(selectedDay)
            : 'Select Date'}
        </span>
        {dateUtils.isToday(dateUtils.parseDate(selectedDay)) && (
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            Today
          </span>
        )}

        {showCalendar && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 w-64 z-50">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">{calendarMonthYear}</span>
              <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekdays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayDate = dateUtils.parseDate(day.date);
                const isFuture = isFutureDate(dayDate);
                return (
                  <button
                    key={index}
                    onClick={() => onSelectDay(day)}
                    disabled={isFuture}
                    className={`
                      p-2 text-center rounded
                      ${!day.currentMonth ? 'text-gray-400' : ''}
                      ${day.isToday ? 'font-bold text-blue-600' : ''}
                      ${day.isSelected ? 'bg-blue-100' : ''}
                      ${day.hasChecklist ? 'border-b-2 border-blue-500' : ''}
                      ${isFuture ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
                    `}
                  >
                    {day.day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}