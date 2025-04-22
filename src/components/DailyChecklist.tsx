import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task, CalendarDay } from '../types';
import { dateUtils } from '../utils/dateUtils';
import { ChecklistTemplate } from './checklist/ChecklistTemplate';
import { ChecklistCalendar } from './checklist/ChecklistCalendar';
import { ChecklistItem } from './checklist/ChecklistItem';
import { ChecklistProgress } from './checklist/ChecklistProgress';

interface DailyChecklistProps {
  templateTasks: Task[];
  checklists: { [date: string]: Task[] };
  selectedDay: string;
  onUpdateChecklists: (newChecklists: { [date: string]: Task[] }) => void;
  onUpdateTemplate: (newTemplate: Task[]) => void;
  onSelectDay: (day: string) => void;
}

export function DailyChecklist({
  templateTasks,
  checklists,
  selectedDay,
  onUpdateChecklists,
  onUpdateTemplate,
  onSelectDay,
}: DailyChecklistProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [newDailyTaskText, setNewDailyTaskText] = useState('');

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const generateChecklistForToday = () => {
    const today = dateUtils.formatDate(new Date());
    const newChecklist = templateTasks.map((task) => ({
      text: task.text,
      completed: false,
      notCompleted: false
    }));
    
    onUpdateChecklists({
      ...checklists,
      [today]: newChecklist,
    });
    
    onSelectDay(today);
  };

  const addToTemplate = (taskText: string) => {
    if (!taskText.trim()) return;
    if (templateTasks.some(t => t.text === taskText)) {
      alert('This task already exists in the template.');
      return;
    }
    onUpdateTemplate([...templateTasks, { text: taskText }]);
  };

  const addDailyTask = () => {
    if (!newDailyTaskText.trim() || !selectedDay) return;
    const currentTasks = checklists[selectedDay] || [];
    const newTask: Task = {
      text: newDailyTaskText.trim(),
      completed: false,
      notCompleted: false
    };
    onUpdateChecklists({
      ...checklists,
      [selectedDay]: [...currentTasks, newTask]
    });
    setNewDailyTaskText('');
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(calendarYear, calendarMonth + direction, 1);
    setCalendarMonth(newDate.getMonth());
    setCalendarYear(newDate.getFullYear());
  };

  const getCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    
    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(calendarYear, calendarMonth, 0);
      const prevMonthDays = prevMonth.getDate();
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const date = new Date(calendarYear, calendarMonth - 1, day);
        const dateStr = dateUtils.formatDate(date);
        
        days.push({
          day,
          date: dateStr,
          currentMonth: false,
          isToday: dateUtils.isToday(date),
          isSelected: selectedDay === dateStr,
          hasChecklist: checklists[dateStr] !== undefined
        });
      }
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(calendarYear, calendarMonth, day);
      const dateStr = dateUtils.formatDate(date);
      
      days.push({
        day,
        date: dateStr,
        currentMonth: true,
        isToday: dateUtils.isToday(date),
        isSelected: selectedDay === dateStr,
        hasChecklist: checklists[dateStr] !== undefined
      });
    }
    
    // Add days from next month
    const daysNeeded = 42 - days.length;
    for (let day = 1; day <= daysNeeded; day++) {
      const date = new Date(calendarYear, calendarMonth + 1, day);
      const dateStr = dateUtils.formatDate(date);
      
      days.push({
        day,
        date: dateStr,
        currentMonth: false,
        isToday: dateUtils.isToday(date),
        isSelected: selectedDay === dateStr,
        hasChecklist: checklists[dateStr] !== undefined
      });
    }
    
    return days;
  };

  const selectCalendarDay = (day: CalendarDay) => {
    const selectedDate = dateUtils.parseDate(day.date);
    if (isFutureDate(selectedDate)) {
      alert("Cannot select future dates");
      return;
    }

    if (!checklists[day.date]) {
      onUpdateChecklists({
        ...checklists,
        [day.date]: templateTasks.map(t => ({ text: t.text, completed: false, notCompleted: false }))
      });
    }
    onSelectDay(day.date);
    setShowCalendar(false);
  };

  const navigateDay = (direction: number) => {
    if (!selectedDay) {
      generateChecklistForToday();
      return;
    }

    const currentDate = dateUtils.parseDate(selectedDay);
    const newDate = dateUtils.addDays(currentDate, direction);

    // Prevent navigation to future dates
    if (direction > 0 && isFutureDate(newDate)) {
      return;
    }

    const newDateStr = dateUtils.formatDate(newDate);

    onUpdateChecklists(prev => {
      const updatedChecklists = { ...prev };
      if (!updatedChecklists[newDateStr]) {
        updatedChecklists[newDateStr] = templateTasks.map(t => ({
          text: t.text,
          completed: false,
          notCompleted: false
        }));
      }
      onSelectDay(newDateStr);
      return updatedChecklists;
    });
  };

  return (
    <div className="space-y-6">
      <ChecklistTemplate
        templateTasks={templateTasks}
        onUpdateTemplate={onUpdateTemplate}
      />

      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-indigo-700">Daily Checklist</h2>
          <button
            onClick={generateChecklistForToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Generate Today's Checklist
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigateDay(-1)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <ChecklistCalendar
            selectedDay={selectedDay}
            showCalendar={showCalendar}
            setShowCalendar={setShowCalendar}
            calendarMonth={calendarMonth}
            calendarYear={calendarYear}
            navigateMonth={navigateMonth}
            calendarDays={getCalendarDays()}
            onSelectDay={selectCalendarDay}
            isFutureDate={isFutureDate}
          />

          <button 
            onClick={() => navigateDay(1)}
            className={`p-2 rounded ${
              isFutureDate(dateUtils.addDays(dateUtils.parseDate(selectedDay), 1))
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100'
            }`}
            disabled={isFutureDate(dateUtils.addDays(dateUtils.parseDate(selectedDay), 1))}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {selectedDay && checklists[selectedDay] && (
          <ChecklistProgress tasks={checklists[selectedDay]} />
        )}

        {selectedDay && checklists[selectedDay] ? (
          <>
            <ul className="space-y-2">
              {checklists[selectedDay].map((task, index) => (
                <ChecklistItem
                  key={index}
                  task={task}
                  index={index}
                  onSave={(index, updatedTask) => {
                    const newTasks = [...checklists[selectedDay]];
                    newTasks[index] = updatedTask;
                    onUpdateChecklists({
                      ...checklists,
                      [selectedDay]: newTasks,
                    });
                  }}
                  onDelete={(index) => {
                    const newTasks = checklists[selectedDay].filter((_, i) => i !== index);
                    onUpdateChecklists({
                      ...checklists,
                      [selectedDay]: newTasks,
                    });
                  }}
                  onAddToTemplate={addToTemplate}
                />
              ))}
            </ul>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newDailyTaskText}
                onChange={(e) => setNewDailyTaskText(e.target.value)}
                placeholder="Add a new task to today's checklist"
                className="flex-1 p-2 border rounded"
                onKeyDown={(e) => e.key === 'Enter' && addDailyTask()}
              />
              <button
                onClick={addDailyTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No day selected. Pick a day or generate today's checklist.
          </p>
        )}
      </section>
    </div>
  );
}