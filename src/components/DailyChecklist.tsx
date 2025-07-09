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
    
    // Sort the tasks to move completed ones to the bottom while preserving order otherwise
    const sortedTasks = [...updatedTasks].sort((a, b) => {
      // Move completed tasks to the bottom while preserving order otherwise
      if ((a.status === 'completed') !== (b.status === 'completed')) {
        return a.status === 'completed' ? 1 : -1;
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
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl shadow-gray-200/40 overflow-hidden p-10">
      <section className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousDay}
              className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-3xl font-bold text-gray-900 px-2">
              {selectedDay ? dateUtils.parseDate(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Daily Habits Tracker'}
            </h2>
            <button
              onClick={goToNextDay}
              disabled={!!(selectedDay && dateUtils.isToday(dateUtils.parseDate(selectedDay)))}
              className={`p-2.5 rounded-xl transition-all duration-200 shadow-sm ${
                selectedDay && dateUtils.isToday(dateUtils.parseDate(selectedDay))
                  ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
              aria-label="Next Day"
              title={selectedDay && dateUtils.isToday(dateUtils.parseDate(selectedDay)) ? "Cannot navigate to future dates" : "Next Day"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/daily/history')}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center gap-2 shadow-sm font-medium"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
            <button
              onClick={generateChecklistForToday}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-600/25 font-medium"
            >
              Today
            </button>
          </div>
        </div>

        {selectedDay ? (
          <>
            {(checklists[selectedDay] || []).length > 0 && (
              <div className="mb-8 flex items-center justify-between">
                <ChecklistProgress tasks={checklists[selectedDay] || []} />
                {dateUtils.isToday(dateUtils.parseDate(selectedDay)) && (
                  <button
                    onClick={markAllComplete}
                    className="ml-6 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/25 font-medium text-sm"
                  >
                    Mark all complete
                  </button>
                )}
              </div>
            )}
            
            <ul className="space-y-4 mb-8">
              {(checklists[selectedDay] || []).length === 0 ? (
                <li className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-indigo-600">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h3>
                    <p className="text-gray-600">Start building healthy habits by adding your first one below.</p>
                  </div>
                </li>
              ) : (checklists[selectedDay] || []).map((task, index) => {
                const streak = calculateStreak(task.text);
                return (
                <li
                  key={task.text}
                  className={`border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                    task.status === 'completed'
                      ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 shadow-lg shadow-emerald-200/40'
                      : task.status === 'not_completed'
                      ? 'border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 shadow-lg shadow-red-200/40'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-white hover:shadow-lg hover:shadow-indigo-200/30 bg-white'
                  }`}
                >
                  {noteIndex === index ? (
                    <div className="p-5">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 resize-none focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-400/20 transition-all"
                        placeholder="Add note about today's habit..."
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => saveTaskNote(index)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : editIndex === index ? (
                    <div className="p-5">
                      <p className="text-sm text-gray-600 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
                        ⚠️ Changes apply from today forward. Past records remain unchanged.
                      </p>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-400/20 transition-all"
                        autoFocus
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => saveMasterTaskEdit(index)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-md"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-5">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-4 items-center flex-1">
                            <button
                              onClick={() => toggleTaskStatus(selectedDay, index)}
                              className={`w-12 h-12 rounded-full border-2 transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
                                task.status === 'completed'
                                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-400 shadow-lg shadow-emerald-400/50 hover:shadow-xl hover:shadow-emerald-400/60'
                                  : task.status === 'not_completed'
                                  ? 'bg-gradient-to-br from-red-400 to-red-600 border-red-400 shadow-lg shadow-red-400/50 hover:shadow-xl hover:shadow-red-400/60'
                                  : 'bg-white border-gray-300 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-indigo-100 hover:shadow-lg hover:shadow-indigo-400/30'
                              }`}
                            >
                              {task.status === 'completed' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                              {task.status === 'not_completed' && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                                  <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                              )}
                            </button>
                            
                            
                            <span className={`flex-1 flex items-center text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : task.status === 'not_completed' ? 'text-red-700 font-medium' : 'text-gray-800'}`}>
                              {task.text}
                              {task.notes && (
                                <span className="ml-3 text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-lg truncate max-w-[150px]">
                                  📝 {task.notes.slice(0, 30)}
                                  {task.notes.length > 30 ? '…' : ''}
                                </span>
                              )}
                              {streak > 1 && (
                                <span className="ml-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-sm px-3 py-1 rounded-full font-medium shadow-md shadow-orange-400/30">
                                  🔥 {streak} days
                                </span>
                              )}
                            </span>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => editTaskNote(index)}
                              className={`p-2.5 rounded-lg transition-all duration-200 ${
                                task.notes 
                                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                                  : 'text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700'
                              }`}
                              title="Add note for today's habit"
                            >
                              <MessageSquare className="w-4 h-4" fill={task.notes ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => editMasterTask(index)}
                              className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200"
                              title="Edit habit (from today onward)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeMasterTask(index)}
                              className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
                              title="Remove habit (from today onward)"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {task.notes && (
                        <div 
                          className="mt-0 px-5 pb-5"
                          onClick={() => editTaskNote(index)}
                        >
                          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
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
            <div className="mt-6 flex gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new habit..."
                className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-400/20 transition-all text-gray-800 placeholder-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && addMasterTask()}
              />
              <button
                onClick={addMasterTask}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-lg shadow-indigo-600/25 font-medium flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500 py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg">Loading your habits...</p>
          </div>
        )}
      </section>
    </div>
  );
}