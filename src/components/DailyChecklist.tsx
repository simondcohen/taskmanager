import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, X, Save, MessageSquare } from 'lucide-react';
import { Task, CalendarDay } from '../types';
import { dateUtils } from '../utils/dateUtils';
import { ChecklistCalendar } from './checklist/ChecklistCalendar';
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
  const [newTaskText, setNewTaskText] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editText, setEditText] = useState('');
  const [noteIndex, setNoteIndex] = useState(-1);
  const [noteText, setNoteText] = useState('');

  // This is now the master list of recurring tasks
  const masterTasks = templateTasks;

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const ensureChecklistForDate = (dateString: string) => {
    if (!checklists[dateString]) {
      // Create a new checklist for this date using the master tasks
      const newChecklist = masterTasks.map((task) => ({
        text: task.text,
        completed: false,
        notCompleted: false
      }));
      
      onUpdateChecklists({
        ...checklists,
        [dateString]: newChecklist,
      });
    }
  };

  const generateChecklistForToday = () => {
    const today = dateUtils.formatDate(new Date());
    ensureChecklistForDate(today);
    onSelectDay(today);
  };

  const addMasterTask = () => {
    if (!newTaskText.trim()) return;
    if (masterTasks.some(t => t.text === newTaskText.trim())) {
      alert('This task already exists in your recurring tasks.');
      return;
    }
    
    // Add to master list
    const newMasterTasks = [...masterTasks, { text: newTaskText.trim() }];
    onUpdateTemplate(newMasterTasks);
    
    // Add to all existing checklists with default values
    const updatedChecklists = { ...checklists };
    Object.keys(updatedChecklists).forEach(date => {
      updatedChecklists[date] = [
        ...updatedChecklists[date],
        { text: newTaskText.trim(), completed: false, notCompleted: false }
      ];
    });
    
    onUpdateChecklists(updatedChecklists);
    setNewTaskText('');
  };

  const removeMasterTask = (index: number) => {
    const taskText = checklists[selectedDay][index].text;
    
    // Remove from master list
    const newMasterTasks = masterTasks.filter(task => task.text !== taskText);
    onUpdateTemplate(newMasterTasks);
    
    // Remove from all checklists
    const updatedChecklists = { ...checklists };
    Object.keys(updatedChecklists).forEach(date => {
      updatedChecklists[date] = updatedChecklists[date].filter(
        task => task.text !== taskText
      );
    });
    
    onUpdateChecklists(updatedChecklists);
  };

  const editMasterTask = (index: number) => {
    setEditIndex(index);
    setEditText(checklists[selectedDay][index].text);
  };

  const saveMasterTaskEdit = (index: number) => {
    if (!editText.trim()) return;
    const oldText = checklists[selectedDay][index].text;
    
    // Update in master list
    const newMasterTasks = masterTasks.map(task => 
      task.text === oldText ? { text: editText.trim() } : task
    );
    onUpdateTemplate(newMasterTasks);
    
    // Update in all checklists
    const updatedChecklists = { ...checklists };
    Object.keys(updatedChecklists).forEach(date => {
      updatedChecklists[date] = updatedChecklists[date].map(task => 
        task.text === oldText 
          ? { ...task, text: editText.trim(), notes: task.notes }
          : task
      );
    });
    
    onUpdateChecklists(updatedChecklists);
    setEditIndex(-1);
    setEditText('');
  };

  const toggleTaskStatus = (dateString: string, index: number, status: 'completed' | 'notCompleted') => {
    const currentTasks = [...checklists[dateString]];
    
    if (status === 'completed') {
      currentTasks[index] = { 
        ...currentTasks[index], 
        completed: !currentTasks[index].completed,
        notCompleted: false 
      };
    } else {
      currentTasks[index] = { 
        ...currentTasks[index], 
        notCompleted: !currentTasks[index].notCompleted,
        completed: false 
      };
    }
    
    onUpdateChecklists({
      ...checklists,
      [dateString]: currentTasks
    });
  };

  const editTaskNote = (index: number) => {
    setNoteIndex(index);
    setNoteText(checklists[selectedDay][index].notes || '');
  };

  const saveTaskNote = (index: number) => {
    const currentTasks = [...checklists[selectedDay]];
    currentTasks[index] = {
      ...currentTasks[index],
      notes: noteText.trim() || undefined
    };
    
    onUpdateChecklists({
      ...checklists,
      [selectedDay]: currentTasks
    });
    
    setNoteIndex(-1);
    setNoteText('');
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

    ensureChecklistForDate(day.date);
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
    ensureChecklistForDate(newDateStr);
    onSelectDay(newDateStr);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-indigo-700">Daily Habits</h2>
          <button
            onClick={generateChecklistForToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go to Today
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
            <ul className="space-y-2 mt-4">
              {checklists[selectedDay].map((task, index) => (
                <li
                  key={index}
                  className="flex flex-col p-3 bg-gray-50 rounded border border-gray-200"
                >
                  {editIndex === index ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 p-2 border rounded"
                        onKeyDown={(e) => e.key === 'Enter' && saveMasterTaskEdit(index)}
                      />
                      <button
                        onClick={() => saveMasterTaskEdit(index)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditIndex(-1);
                          setEditText('');
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : noteIndex === index ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={3}
                        placeholder="Add a note for this day's habit..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveTaskNote(index)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Save Note
                        </button>
                        <button
                          onClick={() => {
                            setNoteIndex(-1);
                            setNoteText('');
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.text}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => toggleTaskStatus(selectedDay, index, 'completed')}
                              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                task.completed
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => toggleTaskStatus(selectedDay, index, 'notCompleted')}
                              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                task.notCompleted
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              ✗
                            </button>
                          </div>
                          <div className="flex space-x-1 ml-2 border-l pl-2">
                            <button
                              onClick={() => editTaskNote(index)}
                              className={`p-1 ${task.notes ? 'text-green-600' : 'text-gray-500'} hover:bg-blue-50 rounded`}
                              title="Add note for today's habit"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => editMasterTask(index)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit habit (changes apply to all days)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeMasterTask(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Remove habit (removes from all days)"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {task.notes && (
                        <div 
                          className="mt-2 pt-2 border-t text-gray-600 text-sm"
                          onClick={() => editTaskNote(index)}
                        >
                          <div className="bg-gray-100 p-2 rounded">
                            {task.notes}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new habit"
                className="flex-1 p-2 border rounded"
                onKeyDown={(e) => e.key === 'Enter' && addMasterTask()}
              />
              <button
                onClick={addMasterTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No day selected. Pick a day or go to today.
          </p>
        )}
      </section>
    </div>
  );
}