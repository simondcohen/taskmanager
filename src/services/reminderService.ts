import { listReminders } from '../storage/reminderStore';
import { ReminderItem } from '../types';
import { requestNotificationPermission, shouldNotifyForReminder, showReminderNotification, showNotification } from '../utils/notificationUtils';

// Store active timers
let reminderCheckInterval: number | null = null;
let notifiedReminderIds = new Set<string>();

/**
 * Checks reminders and shows notifications for any that are due
 */
export async function checkReminders() {
  const reminders = listReminders();
  const now = new Date();
  
  console.log(`[ReminderService] Checking ${reminders.length} reminders at ${now.toLocaleTimeString()}`);

  // Check if any reminders should be notified
  reminders.forEach(reminder => {
    if (!reminder.completed && !notifiedReminderIds.has(reminder.id)) {
      const shouldNotify = shouldNotifyForReminder(reminder);
      console.log(`[ReminderService] Reminder "${reminder.text}" due at ${reminder.date} ${reminder.time || ''} - should notify: ${shouldNotify}`);
      
      if (shouldNotify) {
        const notification = showReminderNotification(reminder);
        if (notification) {
          console.log(`[ReminderService] Notification sent for reminder: ${reminder.text}`);
          notifiedReminderIds.add(reminder.id);
        } else {
          console.warn(`[ReminderService] Failed to show notification for reminder: ${reminder.text}`);
        }
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
  } else {
    console.log('[ReminderService] Notification permission granted, reminders will show notifications');
    
    // Send a test notification to verify they're working
    showNotification({
      title: 'Notifications Enabled',
      body: 'You will now receive reminder notifications',
      onClick: () => window.focus()
    });
  }

  // Start reminder checking interval (check every 30 seconds instead of every minute)
  if (!reminderCheckInterval) {
    // Initial check immediately
    checkReminders();
    
    // Then check every 30 seconds (reduced from 60 seconds)
    reminderCheckInterval = window.setInterval(checkReminders, 30000);
    console.log('[ReminderService] Reminder service started, checking every 30 seconds');
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