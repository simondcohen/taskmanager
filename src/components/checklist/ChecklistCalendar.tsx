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
    <div className="text-center checklist-calendar-wrapper">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="group relative inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow transition-all"
      >
        <CalendarIcon className="w-5 h-5 text-indigo-600" />
        <span className="font-medium">
          {selectedDay
            ? formatDateDisplay(selectedDay)
            : 'Select Date'}
        </span>
        {dateUtils.isToday(dateUtils.parseDate(selectedDay)) && (
          <span className="ml-2 text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
            Today
          </span>
        )}

        {showCalendar && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-lg p-4 z-50 checklist-calendar-dropdown min-w-[280px]">
            <div className="flex justify-between items-center mb-4">
              <button onClick={(e) => { e.stopPropagation(); navigateMonth(-1); }} 
                     className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-semibold text-gray-900">{calendarMonthYear}</h3>
              <button onClick={(e) => { e.stopPropagation(); navigateMonth(1); }} 
                     className="p-2 hover:bg-gray-100 rounded-full text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-3">
              {weekdays.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, index) => {
                const dayDate = dateUtils.parseDate(day.date);
                const isFuture = isFutureDate(dayDate);
                return (
                  <div className="relative" key={index}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectDay(day); }}
                      disabled={isFuture}
                      className={`
                        checklist-calendar-day relative
                        ${!day.currentMonth ? 'other-month' : ''}
                        ${day.isToday ? 'today' : ''}
                        ${day.isSelected ? 'selected' : ''}
                        ${day.hasChecklist ? 'has-data' : ''}
                        ${isFuture ? 'opacity-40 cursor-not-allowed' : ''}
                      `}
                    >
                      {day.day}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}