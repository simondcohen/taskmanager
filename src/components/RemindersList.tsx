import React, { useState, useEffect } from 'react';
import { ReminderItem } from '../types';
import { dateUtils } from '../utils/dateUtils';
import { X, Edit2, Check, Plus, Calendar, Clock, RefreshCcw, FileText, Bell, AlertTriangle } from 'lucide-react';
import { startReminderService, handleReminderUpdated, handleReminderCompleted, forceTestNotification } from '../services/reminderService';
import { requestNotificationPermission } from '../utils/notificationUtils';

interface RemindersListProps {
  reminders: ReminderItem[];
  onUpdateReminders: (reminders: ReminderItem[]) => void;
}

const recurrenceOptions = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function RemindersList({ reminders, onUpdateReminders }: RemindersListProps) {
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState(dateUtils.formatDate(new Date()));
  const [newTime, setNewTime] = useState('');
  const [newRecurrence, setNewRecurrence] = useState('none');
  const [newNotes, setNewNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<ReminderItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  // Initialize notification permissions and reminder service
  useEffect(() => {
    // Start the reminder service when the component mounts
    startReminderService();

    // Check if notifications are already enabled
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Cleanup is handled by the service itself
  }, []);

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    
    if (granted) {
      // If permission was just granted, start the service
      startReminderService();
    }
  };

  const handleAddReminder = () => {
    if (!newText.trim()) {
      alert('Reminder text is required.');
      return;
    }
    const newReminder: ReminderItem = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      date: newDate,
      time: newTime || undefined,
      recurrence: newRecurrence !== 'none' ? newRecurrence : undefined,
      completed: false,
      completedAt: null,
      notes: newNotes.trim() || undefined,
    };
    onUpdateReminders([newReminder, ...reminders]);
    // Reset notification tracking for the new reminder
    handleReminderUpdated(newReminder);

    setNewText('');
    setNewDate(dateUtils.formatDate(new Date()));
    setNewTime('');
    setNewRecurrence('none');
    setNewNotes('');
    setShowAddForm(false);
  };

  const handleEditReminder = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    setEditingId(id);
    setEditFields({ ...reminder });
  };

  const handleSaveEdit = () => {
    if (!editFields.text || !editFields.date) {
      alert('Text and date are required.');
      return;
    }
    const updatedReminder = { ...reminders.find(r => r.id === editingId), ...editFields } as ReminderItem;
    onUpdateReminders(reminders.map(r => r.id === editingId ? updatedReminder : r));
    // Reset notification tracking for the updated reminder
    handleReminderUpdated(updatedReminder);
    
    setEditingId(null);
    setEditFields({});
  };

  const handleDeleteReminder = (id: string) => {
    if (window.confirm('Delete this reminder?')) {
      onUpdateReminders(reminders.filter(r => r.id !== id));
    }
  };

  const handleToggleComplete = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    
    const isCompleting = !reminder.completed;
    
    // Create a copy of the reminders list to modify
    let updatedReminders = [...reminders];
    
    // Update the current reminder's completion status
    updatedReminders = updatedReminders.map(r =>
      r.id === id ? { ...r, completed: isCompleting, completedAt: isCompleting ? new Date().toISOString() : null } : r
    );
    
    // If we're completing a recurring reminder, create the next occurrence
    if (isCompleting && reminder.recurrence && reminder.recurrence !== 'none') {
      // Calculate the next date based on the recurrence pattern
      const nextDate = dateUtils.getNextRecurringDate(reminder.date, reminder.recurrence);
      
      console.log(`[Recurring] Completed reminder "${reminder.text}" with ${reminder.recurrence} recurrence`);
      console.log(`[Recurring] Creating next occurrence on ${nextDate}`);
      
      // Create a new reminder for the next occurrence
      const nextReminder: ReminderItem = {
        id: crypto.randomUUID(),
        text: reminder.text,
        date: nextDate,
        time: reminder.time,
        recurrence: reminder.recurrence,
        completed: false,
        completedAt: null,
        notes: reminder.notes,
      };
      
      // Add the new reminder to the list
      updatedReminders = [nextReminder, ...updatedReminders];
      
      // Also reset notification tracking for the new recurring reminder
      handleReminderUpdated(nextReminder);
      console.log(`[Recurring] Created new reminder with ID: ${nextReminder.id}`);
    }
    
    // Update the reminders list
    onUpdateReminders(updatedReminders);
    
    // Update notification state for the original reminder
    if (isCompleting) {
      handleReminderCompleted(id);
    } else {
      // Reset notification state if uncompleted
      handleReminderUpdated(reminder);
    }
  };

  const handleForceNotification = () => {
    const testReminder = forceTestNotification();
    onUpdateReminders([testReminder, ...reminders]);
  };

  // Filter reminders to show only incomplete ones unless showCompleted is true
  const visibleReminders = reminders.filter(r => showCompleted || !r.completed);

  // Group reminders by date
  const groupedReminders = visibleReminders.reduce<{[key: string]: ReminderItem[]}>((acc, reminder) => {
    const key = reminder.date;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(reminder);
    return acc;
  }, {});

  // Sort dates (keys) by chronological order
  const sortedDates = Object.keys(groupedReminders).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  // Count completed reminders for the toggle button
  const completedCount = reminders.filter(r => r.completed).length;

  return (
    <section className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Reminders</h2>
        <div className="flex gap-2">
          {!notificationsEnabled && (
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-colors"
              onClick={handleRequestNotificationPermission}
            >
              <Bell className="w-4 h-4" />
              Enable Notifications
            </button>
          )}
          <button
            className="bg-amber-500 text-white px-4 py-2 rounded-full hover:bg-amber-600 flex items-center gap-1 shadow-sm transition-colors"
            onClick={handleForceNotification}
            title="Create a test notification"
          >
            <AlertTriangle className="w-4 h-4" />
            Test Notification
          </button>
          {completedCount > 0 && (
            <button
              className={`px-4 py-2 rounded-full flex items-center gap-1 shadow-sm transition-colors ${
                showCompleted 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              {showCompleted ? 'Hide Completed' : `Show Completed (${completedCount})`}
            </button>
          )}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 flex items-center gap-1 shadow-sm transition-colors"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              <>Cancel</>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Reminder
              </>
            )}
          </button>
        </div>
      </div>
      
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-100 transition-all">
          <h3 className="font-medium text-lg mb-4 text-gray-700">New Reminder</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 flex-shrink-0 text-indigo-500">
                <FileText className="w-5 h-5" />
              </div>
              <input
                type="text"
                className="border rounded-md p-2 flex-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                placeholder="What do you need to remember?"
                value={newText}
                onChange={e => setNewText(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 flex-shrink-0 text-indigo-500">
                <Calendar className="w-5 h-5" />
              </div>
              <input
                type="date"
                className="border rounded-md p-2 flex-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 flex-shrink-0 text-indigo-500">
                <Clock className="w-5 h-5" />
              </div>
              <input
                type="time"
                className="border rounded-md p-2 flex-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                placeholder="Time (optional)"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 flex-shrink-0 text-indigo-500">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <select
                className="border rounded-md p-2 flex-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                value={newRecurrence}
                onChange={e => setNewRecurrence(e.target.value)}
              >
                {recurrenceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-10 flex-shrink-0 text-indigo-500">
                <FileText className="w-5 h-5" />
              </div>
              <textarea
                rows={2}
                className="border rounded-md p-2 flex-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none resize-none"
                placeholder="Notes (optional)"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                onClick={handleAddReminder}
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
      
      {reminders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-500 mb-2">No reminders yet</p>
          <p className="text-gray-400 text-sm">Create a reminder to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date} className="mb-6">
              <div className="flex items-center mb-2">
                <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                  {dateUtils.formatDisplayDate(date)}
                </div>
                {new Date(date) < new Date() && new Date(date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && (
                  <div className="ml-2 text-red-500 text-xs font-medium">Past due</div>
                )}
                {dateUtils.isToday(new Date(date)) && (
                  <div className="ml-2 text-green-500 text-xs font-medium">Today</div>
                )}
              </div>
              
              <ul className="space-y-3">
                {groupedReminders[date].map(reminder => (
                  <li 
                    key={reminder.id} 
                    className={`
                      bg-white rounded-lg shadow-sm p-4 border-l-4 
                      ${reminder.completed ? 'border-green-400 bg-green-50' : 'border-indigo-400'}
                      hover:shadow-md transition-all
                    `}
                  >
                    {editingId === reminder.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          className="border rounded-md p-2 w-full focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                          value={editFields.text || ''}
                          onChange={e => setEditFields(f => ({ ...f, text: e.target.value }))}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="date"
                            className="border rounded-md p-2 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                            value={editFields.date || ''}
                            onChange={e => setEditFields(f => ({ ...f, date: e.target.value }))}
                          />
                          <input
                            type="time"
                            className="border rounded-md p-2 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                            value={editFields.time || ''}
                            onChange={e => setEditFields(f => ({ ...f, time: e.target.value }))}
                          />
                          <select
                            className="border rounded-md p-2 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none"
                            value={editFields.recurrence || 'none'}
                            onChange={e => setEditFields(f => ({ ...f, recurrence: e.target.value !== 'none' ? e.target.value : undefined }))}
                          >
                            {recurrenceOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          rows={2}
                          className="border rounded-md p-2 w-full focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none resize-none"
                          placeholder="Notes (optional)"
                          value={editFields.notes || ''}
                          onChange={e => setEditFields(f => ({ ...f, notes: e.target.value }))}
                        />
                        <div className="flex justify-end gap-2 mt-3">
                          <button
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <button
                          className={`
                            mt-1 flex-shrink-0 rounded-full p-1.5 
                            ${reminder.completed 
                              ? 'bg-green-100 text-green-600 ring-2 ring-green-400' 
                              : 'bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600'}
                          `}
                          title={reminder.completed ? 'Mark as incomplete' : 'Mark as complete'}
                          onClick={() => handleToggleComplete(reminder.id)}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        
                        <div className="flex-1">
                          <div className={`font-medium ${reminder.completed ? 'line-through text-gray-400' : ''}`}>
                            {reminder.text}
                          </div>
                          
                          <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {reminder.time && (
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {reminder.time}
                              </span>
                            )}
                            
                            {reminder.recurrence && (
                              <span className="flex items-center">
                                <RefreshCcw className="w-3 h-3 mr-1" />
                                <span className="capitalize">{reminder.recurrence}</span>
                              </span>
                            )}
                          </div>
                          
                          {reminder.notes && (
                            <div className="text-sm text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                              {reminder.notes}
                            </div>
                          )}
                          
                          {reminder.completed && reminder.completedAt && (
                            <div className="text-xs text-green-600 mt-2">
                              Completed on {new Date(reminder.completedAt).toLocaleDateString()} at {new Date(reminder.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            onClick={() => handleEditReminder(reminder.id)}
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            title="Delete"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
} 