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