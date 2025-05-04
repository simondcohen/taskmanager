import React from 'react';
import { X, Check, Bell } from 'lucide-react';
import { ReminderItem } from '../types';

interface InAppNotificationsProps {
  activeReminders: ReminderItem[];
  onMarkComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function InAppNotifications({ activeReminders, onMarkComplete, onDismiss }: InAppNotificationsProps) {
  if (activeReminders.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            <span className="font-medium">Active Reminders</span>
          </div>
          <div className="text-xs text-gray-400">
            {activeReminders.length} {activeReminders.length === 1 ? 'reminder' : 'reminders'} due
          </div>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto pb-2">
          {activeReminders.map(reminder => (
            <div key={reminder.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3 shadow-sm">
              <div className="flex-1">
                <div className="font-medium">{reminder.text}</div>
                <div className="text-sm text-gray-300 flex items-center gap-1">
                  Due: {reminder.date} {reminder.time && `at ${reminder.time}`}
                  {reminder.notes && (
                    <span className="text-xs bg-gray-600 px-2 py-0.5 rounded ml-2">{reminder.notes}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onMarkComplete(reminder.id)}
                  className="p-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                  title="Mark as Complete"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDismiss(reminder.id)}
                  className="p-1.5 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  title="Dismiss Notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 