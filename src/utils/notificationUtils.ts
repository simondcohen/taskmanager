import { ReminderItem } from '../types';

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  onClick?: () => void;
}

/**
 * Request permission to display notifications.
 * @returns Promise that resolves to whether permission was granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
}

/**
 * Show a system notification
 * @param options Notification options
 * @returns The notification object or null if notifications aren't supported
 */
export function showNotification(options: NotificationOptions): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico', // Default icon
    });

    if (options.onClick) {
      notification.onclick = options.onClick;
    }

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
}

/**
 * Shows a notification for a reminder
 * @param reminder The reminder to show a notification for
 */
export function showReminderNotification(reminder: ReminderItem): Notification | null {
  const title = reminder.text;
  const timeInfo = reminder.time ? ` at ${reminder.time}` : '';
  const body = `Due on ${reminder.date}${timeInfo}${reminder.notes ? `\n${reminder.notes}` : ''}`;
  
  return showNotification({
    title,
    body,
    onClick: () => {
      // Focus on the window and navigate to reminders tab when clicked
      window.focus();
      // The actual navigation should be handled by the app's router
      // This will be implemented in the reminder checker service
    }
  });
}

/**
 * Checks if a reminder should trigger a notification now
 * @param reminder The reminder to check
 * @returns True if the reminder should notify now
 */
export function shouldNotifyForReminder(reminder: ReminderItem): boolean {
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

  // For today's reminders:
  if (reminderDate.toDateString() === now.toDateString()) {
    // If reminder has time, only show if it's due or up to 5 minutes past due
    if (reminder.time) {
      // Calculate time difference in milliseconds
      const timeDiff = now.getTime() - reminderDate.getTime();
      // Only notify if the time has passed (positive diff) and is less than 5 minutes
      return timeDiff >= 0 && timeDiff < 300000; // 5 minutes in milliseconds
    } else {
      // For reminders without time, only show if we're already past the start of the day
      return now.getHours() > 0 || now.getMinutes() > 0;
    }
  }
  
  // For past-due reminders (from previous days)
  if (reminderDate < now && reminderDate.toDateString() !== now.toDateString()) {
    return true;
  }
  
  return false;
} 