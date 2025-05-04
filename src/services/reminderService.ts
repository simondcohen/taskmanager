import { listReminders } from '../storage/reminderStore';
import { ReminderItem } from '../types';
import { requestNotificationPermission, shouldNotifyForReminder, showReminderNotification, showNotification } from '../utils/notificationUtils';

// Store active timers
let reminderCheckInterval: number | null = null;
let notifiedReminderIds = new Set<string>();
// Track active in-app notifications
let activeInAppReminders: ReminderItem[] = [];
let inAppNotificationListeners: ((reminders: ReminderItem[]) => void)[] = [];

/**
 * Subscribe to in-app notification updates
 * @param listener Function to call when active reminders change
 * @returns Unsubscribe function
 */
export function subscribeToInAppNotifications(listener: (reminders: ReminderItem[]) => void): () => void {
  inAppNotificationListeners.push(listener);
  
  // Immediately call with current state
  listener([...activeInAppReminders]);
  
  // Return unsubscribe function
  return () => {
    inAppNotificationListeners = inAppNotificationListeners.filter(l => l !== listener);
  };
}

/**
 * Notify all listeners of the current active in-app reminders
 */
function notifyInAppListeners() {
  inAppNotificationListeners.forEach(listener => {
    listener([...activeInAppReminders]);
  });
}

/**
 * Dismiss an in-app notification without marking the reminder as complete
 * @param reminderId ID of the reminder to dismiss
 */
export function dismissInAppNotification(reminderId: string) {
  activeInAppReminders = activeInAppReminders.filter(r => r.id !== reminderId);
  notifyInAppListeners();
}

/**
 * Check if a reminder is currently due and should be shown
 * This is separate from shouldNotifyForReminder as we want stricter rules for displaying in the sidebar
 */
function isReminderDueNow(reminder: ReminderItem): boolean {
  if (reminder.completed) {
    return false;
  }

  const now = new Date();
  const reminderDate = new Date(reminder.date);
  
  // Set time if provided, otherwise use start of day
  if (reminder.time) {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    reminderDate.setHours(hours, minutes, 0, 0);
  } else {
    // For reminders without time, use start of day
    reminderDate.setHours(0, 0, 0, 0);
  }

  // Time-based reminders should only show when the exact time has passed
  if (reminder.time) {
    // Show only if the reminder time has passed
    return reminderDate <= now;
  } else {
    // For date-only reminders, show on that day or past days
    if (reminderDate.toDateString() === now.toDateString()) {
      return true; // It's today
    } else {
      return reminderDate < now; // It's past due
    }
  }
}

/**
 * Checks reminders and shows notifications for any that are due
 */
export async function checkReminders() {
  const reminders = listReminders();
  const now = new Date();
  
  console.log(`[ReminderService] Checking ${reminders.length} reminders at ${now.toLocaleTimeString()}`);
  
  if (reminders.length === 0) {
    console.log("[ReminderService] No reminders found. Add a reminder to see notifications.");
  }

  // Track newly active reminders for this check cycle
  const newlyActiveReminders: ReminderItem[] = [];

  // First, clean up any reminders in the active list that are no longer due
  // (in case their due time was moved forward)
  activeInAppReminders = activeInAppReminders.filter(reminder => isReminderDueNow(reminder));

  // Check if any reminders should be notified
  reminders.forEach(reminder => {
    if (!reminder.completed) {
      const shouldNotify = shouldNotifyForReminder(reminder);
      const isDueNow = isReminderDueNow(reminder);
      
      console.log(`[ReminderService] Reminder "${reminder.text}" due at ${reminder.date} ${reminder.time || ''} - should notify: ${shouldNotify}, is due now: ${isDueNow} (already notified: ${notifiedReminderIds.has(reminder.id)})`);
      
      // Only send system notification when it first becomes due (shouldNotify)
      if (shouldNotify && !notifiedReminderIds.has(reminder.id)) {
        const notification = showReminderNotification(reminder);
        if (notification) {
          console.log(`[ReminderService] Notification sent for reminder: ${reminder.text}`);
          notifiedReminderIds.add(reminder.id);
        } else {
          console.warn(`[ReminderService] Failed to show notification for reminder: ${reminder.text}`);
        }
      }
      
      // Only add to in-app notifications if it's actually due now
      if (isDueNow && !activeInAppReminders.some(r => r.id === reminder.id)) {
        console.log(`[ReminderService] Adding to in-app notifications: ${reminder.text}`);
        newlyActiveReminders.push(reminder);
      }
    }
  });

  // Update active in-app reminders
  if (newlyActiveReminders.length > 0) {
    console.log(`[ReminderService] Adding ${newlyActiveReminders.length} new reminders to in-app notifications`);
    activeInAppReminders = [...activeInAppReminders, ...newlyActiveReminders];
    notifyInAppListeners();
  }

  // Debug logs
  console.log(`[ReminderService] Active in-app reminders: ${activeInAppReminders.length}`);
  
  // Clean up notified reminder IDs for completed reminders
  const activeReminderIds = new Set(reminders.filter(r => !r.completed).map(r => r.id));
  for (const id of notifiedReminderIds) {
    if (!activeReminderIds.has(id)) {
      notifiedReminderIds.delete(id);
    }
  }
  
  // Clean up in-app notifications for completed reminders
  const completedInAppReminders = activeInAppReminders.filter(r => !activeReminderIds.has(r.id));
  if (completedInAppReminders.length > 0) {
    activeInAppReminders = activeInAppReminders.filter(r => activeReminderIds.has(r.id));
    notifyInAppListeners();
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
  dismissInAppNotification(reminderId);
}

/**
 * Reset notification state for a new/updated reminder
 */
export function handleReminderUpdated(reminder: ReminderItem) {
  resetReminderNotification(reminder.id);
}

/**
 * Handle when a reminder is marked as complete
 */
export function handleReminderCompleted(reminderId: string) {
  // Remove from in-app notifications
  dismissInAppNotification(reminderId);
  // Remove from notified reminders
  notifiedReminderIds.delete(reminderId);
}

/**
 * Force an in-app notification for testing
 * Creates a test reminder and adds it to active reminders
 */
export function forceTestNotification() {
  // Create a test reminder that's definitely due now (5 minutes ago)
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5);
  
  const testReminder: ReminderItem = {
    id: `test-${Date.now()}`,
    text: "Test Reminder",
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().slice(0, 5),
    completed: false,
    completedAt: null,
    notes: "This is a test reminder to verify notifications are working",
  };
  
  console.log("[ReminderService] Creating test reminder", testReminder);
  
  // Add to active in-app notifications
  activeInAppReminders = [...activeInAppReminders, testReminder];
  notifyInAppListeners();
  
  // Also try to show a system notification
  showReminderNotification(testReminder);
  
  return testReminder;
} 