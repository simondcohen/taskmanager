import { listReminders } from '../storage/reminderStore';
import { ReminderItem } from '../types';
import { requestNotificationPermission, shouldNotifyForReminder, showReminderNotification } from '../utils/notificationUtils';

// Store active timers
let reminderCheckInterval: number | null = null;
let notifiedReminderIds = new Set<string>();

/**
 * Checks reminders and shows notifications for any that are due
 */
export async function checkReminders() {
  const reminders = listReminders();
  const now = new Date();

  // Check if any reminders should be notified
  reminders.forEach(reminder => {
    if (!reminder.completed && !notifiedReminderIds.has(reminder.id)) {
      if (shouldNotifyForReminder(reminder)) {
        showReminderNotification(reminder);
        notifiedReminderIds.add(reminder.id);
      }
    }
  });

  // Clean up notified reminder IDs for completed reminders
  const activeReminderIds = new Set(reminders.filter(r => !r.completed).map(r => r.id));
  for (const id of notifiedReminderIds) {
    if (!activeReminderIds.has(id)) {
      notifiedReminderIds.delete(id);
    }
  }
}

/**
 * Starts the reminder checking service
 */
export async function startReminderService() {
  // Request notification permission if not already granted
  const permissionGranted = await requestNotificationPermission();
  
  if (!permissionGranted) {
    console.warn('Notification permission not granted, reminders will not show notifications');
  }

  // Start reminder checking interval (check every minute)
  if (!reminderCheckInterval) {
    // Initial check immediately
    checkReminders();
    
    // Then check every minute
    reminderCheckInterval = window.setInterval(checkReminders, 60000);
  }
}

/**
 * Stops the reminder checking service
 */
export function stopReminderService() {
  if (reminderCheckInterval) {
    window.clearInterval(reminderCheckInterval);
    reminderCheckInterval = null;
  }
}

/**
 * Reset notification state for a specific reminder
 * (used when a reminder is updated)
 */
export function resetReminderNotification(reminderId: string) {
  notifiedReminderIds.delete(reminderId);
}

/**
 * Reset notification state for a new/updated reminder
 */
export function handleReminderUpdated(reminder: ReminderItem) {
  resetReminderNotification(reminder.id);
} 