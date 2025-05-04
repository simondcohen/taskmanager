import React, { useState } from 'react';
import { X, Check, Bell, ChevronRight, ChevronLeft } from 'lucide-react';
import { ReminderItem } from '../types';

interface InAppNotificationsProps {
  activeReminders: ReminderItem[];
  onMarkComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function InAppNotifications({ activeReminders, onMarkComplete, onDismiss }: InAppNotificationsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (activeReminders.length === 0) {
    return null;
  }

  return (
    <div 
      className={`fixed top-0 left-0 bottom-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-12' : 'w-72'
      }`}
    >
      {/* Toggle button */}
      <button 
        className="absolute -right-3 top-20 bg-gray-800 p-1 rounded-full shadow-md hover:bg-gray-700 transition-colors z-10"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand reminders" : "Collapse reminders"}
      >
        {isCollapsed ? 
          <ChevronRight className="h-4 w-4 text-white" /> : 
          <ChevronLeft className="h-4 w-4 text-white" />
        }
      </button>

      {/* Header */}
      <div className={`px-4 py-4 border-b border-gray-700 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <Bell className="h-5 w-5 text-yellow-400" />
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-400" />
              <span className="font-medium">Active Reminders</span>
            </div>
            <div className="text-xs text-gray-400">
              {activeReminders.length} {activeReminders.length === 1 ? 'reminder' : 'reminders'}
            </div>
          </div>
        )}
      </div>
      
      {/* Reminder list - only show when expanded */}
      {!isCollapsed && (
        <div className="px-3 py-2 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {activeReminders.map(reminder => (
            <div key={reminder.id} className="flex flex-col bg-gray-700 rounded-lg p-3 shadow-sm">
              <div className="font-medium mb-1">{reminder.text}</div>
              <div className="text-xs text-gray-300 mb-2">
                Due: {reminder.date} {reminder.time && `at ${reminder.time}`}
              </div>
              {reminder.notes && (
                <div className="text-xs bg-gray-600 px-2 py-1 rounded mb-2 text-gray-300">
                  {reminder.notes}
                </div>
              )}
              <div className="flex justify-end gap-2 mt-1">
                <button 
                  onClick={() => onMarkComplete(reminder.id)}
                  className="p-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                  title="Mark as Complete"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button 
                  onClick={() => onDismiss(reminder.id)}
                  className="p-1.5 rounded-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                  title="Dismiss Notification"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* When collapsed, show dots for each reminder */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-3 gap-2">
          {activeReminders.slice(0, 10).map((reminder, index) => (
            <div 
              key={reminder.id}
              className="w-3 h-3 rounded-full bg-yellow-400" 
              title={`${reminder.text} - Due: ${reminder.date} ${reminder.time ? `at ${reminder.time}` : ''}`}
            />
          ))}
          {activeReminders.length > 10 && (
            <div className="text-xs text-gray-400 mt-1">+{activeReminders.length - 10}</div>
          )}
        </div>
      )}
    </div>
  );
} 