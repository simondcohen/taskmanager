import React, { useState } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';
import { useNavigate } from 'react-router-dom';
import { ChecklistProgress } from './checklist/ChecklistProgress';

interface DailyHabitsHistoryProps {
  checklists: { [date: string]: Task[] };
  onSelectDay: (day: string) => void;
}

export function DailyHabitsHistory({
  checklists,
  onSelectDay,
}: DailyHabitsHistoryProps) {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Get unique dates from checklists
  const dates = Object.keys(checklists);

  // Calculate month options for the dropdown
  const monthOptions = Array.from(
    new Set(dates.map(date => date.substring(0, 7)))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleDateClick = (date: string) => {
    onSelectDay(date);
    navigate('/daily');
  };

  const getMonthDisplayName = (monthYearString: string) => {
    const [year, month] = monthYearString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  // Generate calendar data for the selected month
  const generateCalendarData = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Get the number of days in the month
    const daysInMonth = lastDay.getDate();
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Create an array for the days, including empty cells for the days before the first day of the month
    const calendarDays = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      calendarDays.push({
        day,
        date: dateStr,
        hasData: dates.includes(dateStr),
        data: dates.includes(dateStr) ? checklists[dateStr] : null,
      });
    }
    
    return calendarDays;
  };
  
  const calendarData = generateCalendarData();
  
  const calculateCompletionPercentage = (tasks: Task[] | null) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };
  
  const getProgressColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const navigateToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newMonth = month - 1;
    let newYear = year;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const navigateToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newMonth = month + 1;
    let newYear = year;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    
    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const getDayStreakLength = (dateStr: string) => {
    let streak = 0;
    let date = new Date(dateStr);
    while (true) {
      const str = date.toISOString().slice(0, 10);
      const tasks = checklists[str];
      if (!tasks || tasks.some(t => !t.completed)) break;
      streak++;
      date.setDate(date.getDate() - 1);
    }
    return streak;
  };

  const getMonthlySummary = () => {
    const monthDates = dates.filter(d => d.startsWith(selectedMonth));
    if (monthDates.length === 0) return { avg: 0, perfect: 0 };
    let total = 0;
    let perfect = 0;
    monthDates.forEach(date => {
      const perc = calculateCompletionPercentage(checklists[date]);
      total += perc;
      if (perc === 100) perfect++;
    });
    return { avg: Math.round(total / monthDates.length), perfect };
  };
  
  // Function to get a weekly view of dates
  const getWeeklyView = () => {
    // Filter dates for the selected month
    const filteredDates = dates
      .filter(date => date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
    // Group dates by week
    const weeks: { [weekNumber: string]: string[] } = {};
    
    filteredDates.forEach(date => {
      const dateObj = new Date(date);
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().slice(0, 10);
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      
      weeks[weekKey].push(date);
    });
    
    return Object.entries(weeks).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
      <section className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Daily Habits History</h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/daily')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Today</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">
              <Calendar className="w-5 h-5 inline-block mr-2" />
              Monthly View
            </h3>
            <span className="text-sm text-gray-600">
              {getMonthlySummary().avg}% average completion, {getMonthlySummary().perfect} perfect days
            </span>
            <div className="flex items-center">
              <button 
                onClick={navigateToPreviousMonth}
                className="p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded-md p-2 bg-white"
              >
                {monthOptions.map(month => (
                  <option key={month} value={month}>
                    {getMonthDisplayName(month)}
                  </option>
                ))}
              </select>
              
              <button 
                onClick={navigateToNextMonth}
                className="p-2 ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="mb-8">
          <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-xs">
            {calendarData.map((dayData, index) => (
              <div
                key={index}
                className={`aspect-square border rounded-lg p-0.5 ${
                  dayData ? 'hover:border-indigo-300 cursor-pointer' : ''
                } ${
                  dayData && dayData.hasData ? 'bg-gray-50' : 'bg-gray-100 opacity-50'
                }`}
                onClick={() => dayData && dayData.hasData && handleDateClick(dayData.date)}
              >
                {dayData && (
                  <div className="h-full p-0.5 flex flex-col relative">
                    <div className="text-right text-sm font-medium mb-1">
                      {dayData.day}
                    </div>
                    
                    {dayData.hasData && dayData.data && (
                      <div className="flex-grow flex flex-col justify-center items-center">
                        <div className="text-2xl font-bold">
                          {calculateCompletionPercentage(dayData.data)}%
                        </div>
                        <div className="w-full mt-1">
                          <div 
                            className={`h-2 rounded ${getProgressColorClass(calculateCompletionPercentage(dayData.data))}`}
                            style={{width: `${calculateCompletionPercentage(dayData.data)}%`}}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dayData.data.filter(t => t.completed).length}/{dayData.data.length}
                        </div>
                      </div>
                    )}
                    {dayData.hasData && getDayStreakLength(dayData.date) > 1 && (
                      <div className="absolute top-0 right-0 m-1 text-orange-500">🔥</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Weekly Summary View */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Weekly Summary</h3>
          
          <div className="space-y-4">
            {getWeeklyView().map(([weekStart, weekDates]) => (
              <div key={weekStart} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">
                  Week of {new Date(weekStart).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {weekDates.map(date => (
                    <div 
                      key={date} 
                      className="border border-gray-200 rounded p-3 hover:border-indigo-300 cursor-pointer"
                      onClick={() => handleDateClick(date)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {new Date(date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-sm font-bold">
                          {calculateCompletionPercentage(checklists[date])}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
                        <div 
                          className={`h-full ${getProgressColorClass(calculateCompletionPercentage(checklists[date]))}`}
                          style={{width: `${calculateCompletionPercentage(checklists[date])}%`}}
                        ></div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {checklists[date].filter(t => t.completed).length} of {checklists[date].length} completed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 