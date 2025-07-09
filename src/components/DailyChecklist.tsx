import React, { useState, useEffect } from 'react';
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

  // Automatically generate today's checklist when component mounts
  useEffect(() => {
    const today = dateUtils.formatDate(new Date());
    if (!checklists[today]) {
      ensureChecklistForDate(today);
    }
    // If we're not on any day yet, select today
    if (!selectedDay) {
      onSelectDay(today);
    }
  }, []); // Run only on mount

  // Ensure we have a checklist for the selected day
  useEffect(() => {
    if (selectedDay && !checklists[selectedDay]) {
      ensureChecklistForDate(selectedDay);
    }
  }, [selectedDay, checklists]);

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date > today;
  };

  const ensureChecklistForDate = (dateString: string) => {
    if (!checklists[dateString]) {
      // Prevent creating checklists for future dates
      const date = dateUtils.parseDate(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      if (date > today) {
        return; // Don't create checklists for future dates
      }
      
      // Create a new checklist for this date using the master tasks
      const newChecklist = masterTasks.map((task) => ({
        text: task.text,
        status: 'unchecked' as const
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
      if (!task || task.status !== 'completed') break;
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
    
    // Prevent navigation to future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    if (currentDate > today) {
      return; // Don't navigate to future dates
    }
    
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
          { text: newTaskText.trim(), status: 'unchecked' }
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
        // Cycle through three states: unchecked -> completed -> not_completed -> unchecked
        let newStatus: 'unchecked' | 'completed' | 'not_completed';
        
        if (!task.status || task.status === 'unchecked') {
          newStatus = 'completed';
        } else if (task.status === 'completed') {
          newStatus = 'not_completed';
        } else {
          newStatus = 'unchecked';
        }
        
        return {
          ...task,
          status: newStatus
        };
      }
      return task;
    });
    
    onUpdateChecklists({
      ...checklists,
      [dateString]: updatedTasks
    });
  };

  const editTaskNote = (index: number) => {
    setNoteIndex(index);
    setNoteText(checklists[selectedDay][index].notes || '');
  };

  const markAllComplete = () => {
    const updatedTasks = checklists[selectedDay].map(task => ({ ...task, status: 'completed' as const }));
    onUpdateChecklists({
      ...checklists,
      [selectedDay]: updatedTasks
    });
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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8">
      <section className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 px-2">
              {selectedDay ? dateUtils.parseDate(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Daily Habits Tracker'}
            </h2>
            <button
              onClick={goToNextDay}
              disabled={!!(selectedDay && dateUtils.isToday(dateUtils.parseDate(selectedDay)))}
              className={`p-2 rounded-md transition-colors ${
                selectedDay && dateUtils.isToday(dateUtils.parseDate(selectedDay))
                  ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
              aria-label="Next Day"
              title={selectedDay && dateUtils.isToday(dateUtils.parseDate(selectedDay)) ? "Cannot navigate to future dates" : "Next Day"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/daily/history')}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
            <button
              onClick={generateChecklistForToday}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Today
            </button>
          </div>
        </div>

        {selectedDay ? (
          <>
            {(checklists[selectedDay] || []).length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200 p-5 flex items-center justify-between">
                <ChecklistProgress tasks={checklists[selectedDay] || []} />
                {dateUtils.isToday(dateUtils.parseDate(selectedDay)) && (
                  <button
                    onClick={markAllComplete}
                    className="ml-6 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Mark all complete
                  </button>
                )}
              </div>
            )}
            
            <ul className="space-y-3 mb-6">
              {(checklists[selectedDay] || []).length === 0 ? (
                <li className="text-center py-12">
                  <div className="max-w-sm mx-auto">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-500">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                      </svg>
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">No habits yet</h3>
                    <p className="text-sm text-gray-500">Start building healthy habits by adding your first one below.</p>
                  </div>
                </li>
              ) : (checklists[selectedDay] || []).map((task, index) => {
                const streak = calculateStreak(task.text);
                return (
                <li
                  key={task.text}
                  className={`border rounded-md transition-colors ${
                    task.status === 'completed'
                      ? 'border-emerald-300 bg-emerald-50'
                      : task.status === 'not_completed'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {noteIndex === index ? (
                    <div className="p-5">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-3 resize-none focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors text-base"
                        placeholder="Add note about today's habit..."
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => saveTaskNote(index)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : editIndex === index ? (
                    <div className="p-5">
                      <p className="text-sm text-amber-700 mb-3 bg-amber-50 border border-amber-200 rounded-md p-2">
                        ⚠️ Changes apply from today forward. Past records remain unchanged.
                      </p>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full border border-gray-300 rounded-md p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors text-base"
                        autoFocus
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => saveMasterTaskEdit(index)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-5">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-3 items-center flex-1">
                            <button
                              onClick={() => toggleTaskStatus(selectedDay, index)}
                              className={`w-9 h-9 rounded-md border-2 transition-colors flex items-center justify-center ${
                                task.status === 'completed'
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : task.status === 'not_completed'
                                  ? 'bg-red-500 border-red-500'
                                  : 'bg-white border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {task.status === 'completed' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                              {task.status === 'not_completed' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                                  <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                              )}
                            </button>
                            
                            
                            <span className={`flex-1 flex items-center text-base ${task.status === 'completed' ? 'line-through text-gray-500' : task.status === 'not_completed' ? 'text-red-700 font-medium' : 'text-gray-800'}`}>
                              {task.text}
                              {task.notes && (
                                <span className="ml-2 text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded truncate max-w-[150px]">
                                  📝 {task.notes.slice(0, 30)}
                                  {task.notes.length > 30 ? '…' : ''}
                                </span>
                              )}
                              {streak > 1 && (
                                <span className="ml-2 bg-orange-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                                  🔥 {streak} days
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex gap-1 ml-3">
                            <button
                              onClick={() => editTaskNote(index)}
                              className={`p-1.5 rounded transition-colors ${
                                task.notes 
                                  ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200' 
                                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                              }`}
                              title="Add note for today's habit"
                            >
                              <MessageSquare className="w-3.5 h-3.5" fill={task.notes ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => editMasterTask(index)}
                              className="p-1.5 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                              title="Edit habit (from today onward)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeMasterTask(index)}
                              className="p-1.5 text-red-600 bg-red-100 hover:bg-red-200 rounded transition-colors"
                              title="Remove habit (from today onward)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {task.notes && (
                        <div 
                          className="mt-0 px-5 pb-5"
                          onClick={() => editTaskNote(index)}
                        >
                          <div className="bg-gray-50 border border-gray-200 p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.notes}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </li>
                );
              })}
            </ul>
            <div className="mt-4 flex gap-2 bg-gray-50 p-4 rounded-md border border-gray-200">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new habit..."
                className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors text-base text-gray-800 placeholder-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && addMasterTask()}
              />
              <button
                onClick={addMasterTask}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-base font-medium flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-sm">Loading your habits...</p>
          </div>
        )}
      </section>
    </div>
  );
}