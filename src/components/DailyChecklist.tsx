import React, { useState } from 'react';
import { Plus, Edit2, X, Save, MessageSquare, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '../types';
import { dateUtils } from '../utils/dateUtils';
import { ChecklistProgress } from './checklist/ChecklistProgress';
import { useNavigate } from 'react-router-dom';

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
  const [newTaskText, setNewTaskText] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editText, setEditText] = useState('');
  const [noteIndex, setNoteIndex] = useState(-1);
  const [noteText, setNoteText] = useState('');
  const navigate = useNavigate();

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
        completed: false
      }));
      
      onUpdateChecklists({
        ...checklists,
        [dateString]: newChecklist,
      });
    }
  };

  const calculateStreak = (taskText: string) => {
    let streak = 0;
    let date = dateUtils.parseDate(selectedDay);

    while (true) {
      const dateStr = dateUtils.formatDate(date);
      const tasksForDate = checklists[dateStr];
      if (!tasksForDate) break;
      const task = tasksForDate.find(t => t.text === taskText);
      if (!task || !task.completed) break;
      streak++;
      date.setDate(date.getDate() - 1);
    }

    return streak;
  };

  const generateChecklistForToday = () => {
    const today = dateUtils.formatDate(new Date());
    ensureChecklistForDate(today);
    onSelectDay(today);
  };

  // Function to navigate to the previous day
  const goToPreviousDay = () => {
    const currentDate = dateUtils.parseDate(selectedDay);
    currentDate.setDate(currentDate.getDate() - 1);
    const previousDay = dateUtils.formatDate(currentDate);
    
    // Ensure checklist exists for the previous day
    ensureChecklistForDate(previousDay);
    onSelectDay(previousDay);
  };

  // Function to navigate to the next day
  const goToNextDay = () => {
    const currentDate = dateUtils.parseDate(selectedDay);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDay = dateUtils.formatDate(currentDate);
    
    // Ensure checklist exists for the next day
    ensureChecklistForDate(nextDay);
    onSelectDay(nextDay);
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
    
    // Only update the selected day and future days
    Object.keys(updatedChecklists).forEach(date => {
      const dateObj = dateUtils.parseDate(date);
      const selectedDayObj = dateUtils.parseDate(selectedDay);
      
      // Only apply changes to selected day and future days
      if (dateObj >= selectedDayObj) {
        updatedChecklists[date] = [
          ...updatedChecklists[date],
          { text: newTaskText.trim(), completed: false }
        ];
      }
    });
    
    onUpdateChecklists(updatedChecklists);
    setNewTaskText('');
  };

  const removeMasterTask = (index: number) => {
    if (!confirm('Remove this habit starting from today? Past records will be preserved.')) return;
    const taskText = checklists[selectedDay][index].text;
    
    // Remove from master list
    const newMasterTasks = masterTasks.filter(task => task.text !== taskText);
    onUpdateTemplate(newMasterTasks);
    
    // Remove from all checklists
    const updatedChecklists = { ...checklists };
    Object.keys(updatedChecklists).forEach(date => {
      const dateObj = dateUtils.parseDate(date);
      const selectedDayObj = dateUtils.parseDate(selectedDay);
      
      // Only apply changes to selected day and future days
      if (dateObj >= selectedDayObj) {
        updatedChecklists[date] = updatedChecklists[date].filter(
          task => task.text !== taskText
        );
      }
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
      const dateObj = dateUtils.parseDate(date);
      const selectedDayObj = dateUtils.parseDate(selectedDay);
      
      // Only apply changes to selected day and future days
      if (dateObj >= selectedDayObj) {
        updatedChecklists[date] = updatedChecklists[date].map(task => 
          task.text === oldText 
            ? { ...task, text: editText.trim(), notes: task.notes }
            : task
        );
      }
    });
    
    onUpdateChecklists(updatedChecklists);
    setEditIndex(-1);
    setEditText('');
  };

  const toggleTaskStatus = (dateString: string, index: number) => {
    const taskText = checklists[dateString][index].text;
    const updatedTasks = checklists[dateString].map(task => {
      if (task.text === taskText) {
        return {
          ...task,
          completed: !task.completed
        };
      }
      return task;
    });
    
    // Sort the tasks to move completed ones to the bottom
    const sortedTasks = [...updatedTasks].sort((a, b) => {
      // Move completed tasks to the bottom while preserving order otherwise
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return 0;
    });
    
    onUpdateChecklists({
      ...checklists,
      [dateString]: sortedTasks
    });
  };

  const editTaskNote = (index: number) => {
    setNoteIndex(index);
    setNoteText(checklists[selectedDay][index].notes || '');
  };

  const markAllComplete = () => {
    const updatedTasks = checklists[selectedDay].map(task => ({ ...task, completed: true }));
    onUpdateChecklists({
      ...checklists,
      [selectedDay]: updatedTasks
    });
  };

  const applySuggestedHabits = () => {
    const suggestions = ['\uD83C\uDF05 Morning routine', '\uD83D\uDCAA Exercise', '\uD83D\uDCDA Read for 20 minutes'];
    const newMaster = [...masterTasks];
    const updatedChecklists = { ...checklists };
    suggestions.forEach(text => {
      if (!newMaster.some(t => t.text === text)) {
        newMaster.push({ text });
        Object.keys(updatedChecklists).forEach(date => {
          const dateObj = dateUtils.parseDate(date);
          const selectedDayObj = dateUtils.parseDate(selectedDay);
          if (dateObj >= selectedDayObj) {
            updatedChecklists[date] = [
              ...updatedChecklists[date],
              { text, completed: false }
            ];
          }
        });
      }
    });
    onUpdateTemplate(newMaster);
    onUpdateChecklists(updatedChecklists);
  };

  const saveTaskNote = (index: number) => {
    const updatedTasks = checklists[selectedDay].map((task, idx) => {
      if (idx === index) {
        return { ...task, notes: noteText.trim() };
      }
      return task;
    });
    
    onUpdateChecklists({
      ...checklists,
      [selectedDay]: updatedTasks
    });
    
    setNoteIndex(-1);
    setNoteText('');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
      <section className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={goToPreviousDay}
              className="p-2 mr-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedDay ? dateUtils.parseDate(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Daily Habits Tracker'}
            </h2>
            <button
              onClick={goToNextDay}
              className="p-2 ml-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              aria-label="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/daily/history')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-1"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
            <button
              onClick={generateChecklistForToday}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {selectedDay && checklists[selectedDay] ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <ChecklistProgress tasks={checklists[selectedDay]} />
              {dateUtils.isToday(dateUtils.parseDate(selectedDay)) && (
                <button
                  onClick={markAllComplete}
                  className="ml-4 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Mark all complete
                </button>
              )}
            </div>
            
            <ul className="space-y-3 mb-6">
              {checklists[selectedDay].map((task, index) => {
                const streak = calculateStreak(task.text);
                return (
                <li
                  key={index}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    task.completed
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  {noteIndex === index ? (
                    <div className="p-4">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Add note about today's habit..."
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => saveTaskNote(index)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : editIndex === index ? (
                    <div className="p-4">
                      <p className="text-sm text-gray-500 mb-2">Changes apply from today forward. Past records remain unchanged.</p>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full border rounded p-2"
                        autoFocus
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => saveMasterTaskEdit(index)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-3 items-center flex-1">
                            <button
                              onClick={() => toggleTaskStatus(selectedDay, index)}
                              className={`w-8 h-8 rounded-full border transition-colors ${
                                task.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {task.completed && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </button>
                            
                            
                            <span className={`flex-1 flex items-center ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.text}
                              {task.notes && (
                                <span className="ml-2 text-gray-400 text-xs truncate max-w-[120px]">
                                  {task.notes.slice(0, 30)}
                                  {task.notes.length > 30 ? '…' : ''}
                                </span>
                              )}
                              {streak > 1 && (
                                <span className="ml-2 text-orange-500 text-xs">🔥 {streak} days</span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => editTaskNote(index)}
                              className={`p-1 ${task.notes ? 'text-green-600' : 'text-gray-500'} hover:bg-blue-50 rounded`}
                              title="Add note for today's habit"
                            >
                              <MessageSquare className="w-4 h-4" fill={task.notes ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => editMasterTask(index)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit habit (from today onward)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeMasterTask(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Remove habit (from today onward)"
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
                );
              })}
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
            <p className="text-xs text-gray-500 mt-1">Press Enter to add habit, Space to toggle completion</p>
          </>
        ) : (
          <div className="text-center text-gray-500 py-8 space-y-4">
            <p className="text-lg">Welcome! Start building your habit routine.</p>
            <ul className="space-y-1">
              <li>\uD83C\uDF05 Morning routine</li>
              <li>\uD83D\uDCAA Exercise</li>
              <li>\uD83D\uDCDA Read for 20 minutes</li>
            </ul>
            <button
              onClick={applySuggestedHabits}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Get started with suggested habits
            </button>
          </div>
        )}
      </section>
    </div>
  );
}