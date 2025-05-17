import React, { useState } from 'react';
import { Plus, Edit2, X, Save, MessageSquare } from 'lucide-react';
import { Task } from '../types';
import { dateUtils } from '../utils/dateUtils';
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
    
    // Only update the selected day and future days
    Object.keys(updatedChecklists).forEach(date => {
      const dateObj = dateUtils.parseDate(date);
      const selectedDayObj = dateUtils.parseDate(selectedDay);
      
      // Only apply changes to selected day and future days
      if (dateObj >= selectedDayObj) {
        updatedChecklists[date] = [
          ...updatedChecklists[date],
          { text: newTaskText.trim(), completed: false, notCompleted: false }
        ];
      }
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

  const toggleTaskStatus = (dateString: string, index: number, status: 'completed' | 'notCompleted') => {
    const taskText = checklists[dateString][index].text;
    const updatedTasks = checklists[dateString].map(task => {
      if (task.text === taskText) {
        if (status === 'completed') {
          return { 
            ...task, 
            completed: !task.completed,
            notCompleted: false 
          };
        } else {
          return { 
            ...task, 
            notCompleted: !task.notCompleted,
            completed: false 
          };
        }
      }
      return task;
    });
    
    // Sort the tasks to move completed ones to the bottom
    const sortedTasks = [...updatedTasks].sort((a, b) => {
      // First check for completed status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Move completed to the bottom
      }
      
      // Then check for not-completed status (put at the bottom but above completed)
      if (a.notCompleted !== b.notCompleted) {
        return a.notCompleted ? 1 : -1;
      }
      
      // Keep original order for the rest
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
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedDay ? new Date(selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Daily Habits Tracker'}
          </h2>
          
          <button
            onClick={generateChecklistForToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Today
          </button>
        </div>

        {selectedDay && checklists[selectedDay] ? (
          <>
            <div className="mb-6">
              <ChecklistProgress tasks={checklists[selectedDay]} />
            </div>
            
            <ul className="space-y-3 mb-6">
              {checklists[selectedDay].map((task, index) => (
                <li 
                  key={index}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    task.completed 
                      ? 'border-green-200 bg-green-50' 
                      : task.notCompleted 
                        ? 'border-red-200 bg-red-50'
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
                              onClick={() => toggleTaskStatus(selectedDay, index, 'completed')}
                              className={`w-6 h-6 rounded-full border transition-colors ${
                                task.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {task.completed && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              )}
                            </button>
                            
                            <button
                              onClick={() => toggleTaskStatus(selectedDay, index, 'notCompleted')}
                              className={`w-6 h-6 rounded-full border transition-colors ${
                                task.notCompleted
                                  ? 'bg-red-500 border-red-500'
                                  : 'border-gray-300 hover:border-red-500'
                              }`}
                            >
                              {task.notCompleted && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              )}
                            </button>
                            
                            <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                              {task.text}
                            </span>
                          </div>
                          
                          <div className="flex gap-1">
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
            No day selected. Click "Today" to get started.
          </p>
        )}
      </section>
    </div>
  );
}