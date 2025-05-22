import React, { useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
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

  // Get unique dates from checklists and sort them in reverse order (newest first)
  const dates = Object.keys(checklists)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Filter dates by selected month
  const filteredDates = dates.filter(date => date.startsWith(selectedMonth));

  // Calculate month options for the dropdown
  const monthOptions = Array.from(
    new Set(dates.map(date => date.substring(0, 7)))
  ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleDateClick = (date: string) => {
    onSelectDay(date);
    navigate('/daily');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMonthDisplayName = (monthYearString: string) => {
    const [year, month] = monthYearString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
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
              Filter by Month
            </h3>
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
          </div>
        </div>

        {filteredDates.length > 0 ? (
          <div className="space-y-6">
            {filteredDates.map(date => (
              <div 
                key={date} 
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 cursor-pointer transition-colors"
                onClick={() => handleDateClick(date)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{formatDate(date)}</h3>
                </div>
                <ChecklistProgress tasks={checklists[date]} />
                <div className="mt-4 text-sm text-gray-500">
                  {checklists[date].length} habits tracked
                  <span className="mx-2">•</span>
                  {checklists[date].filter(t => t.completed).length} completed
                  <span className="mx-2">•</span>
                  {checklists[date].filter(t => t.notCompleted).length} skipped
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No records found for {getMonthDisplayName(selectedMonth)}
          </div>
        )}
      </section>
    </div>
  );
} 