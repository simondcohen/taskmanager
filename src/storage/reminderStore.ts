import { ReminderItem } from '../types';

const KEY = 'reminders';

function read(): ReminderItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch { return []; }
}

function write(data: ReminderItem[]) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function listReminders() {
  return read();
}

export function upsertReminder(reminder: ReminderItem) {
  const data = read();
  const i = data.findIndex(r => r.id === reminder.id);
  if (i >= 0) data[i] = reminder;
  else data.push(reminder);
  write(data);
  return reminder;
}

export function deleteReminder(id: string) {
  write(read().filter(r => r.id !== id));
} 