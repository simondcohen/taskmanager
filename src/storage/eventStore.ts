import { EventItem } from '../types';

const KEY = 'events';

function read(): EventItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch { return []; }
}

function write(data: EventItem[]) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function listEvents() {
  return read();
}

export function upsertEvent(evt: EventItem) {
  const data = read();
  if (!evt.id) evt.id = crypto.randomUUID();
  const i = data.findIndex(d => d.id === evt.id);
  if (i >= 0) data[i] = evt;
  else data.push(evt);
  write(data);
  return evt;
}

export function deleteEvent(id: string) {
  write(read().filter(e => e.id !== id));
} 