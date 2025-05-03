import React, { useState, useEffect } from 'react';
import { upsertEvent } from '../../storage/eventStore';
import { EventItem } from '../../types';
import { Calendar, Clock, ClipboardList, RefreshCw, Trash2 } from 'lucide-react';
import { dateUtils } from '../../utils/dateUtils';

interface Props {
  open: boolean;
  initial?: EventItem | null;
  onClose: () => void;
  onSaved: (evt: EventItem) => void;
  onDelete?: () => void;
}

export default function EventDialog({ open, initial, onClose, onSaved, onDelete }: Props) {
  if (!open) return null;

  const [form, setForm] = useState<EventItem>(
    initial ?? { title: '', start_ts: '', end_ts: '', notes: '', recurrence: '' }
  );
  
  // Separate state for date, start time, and end time
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Update form when initial changes
  useEffect(() => {
    if (initial) {
      // Make sure we have properly formatted datetime strings
      const formattedInitial = {
        ...initial,
        // Ensure dates are properly formatted for datetime-local inputs
        start_ts: initial.start_ts.includes('T') ? initial.start_ts : 
          dateUtils.formatDateTimeForInput(new Date(initial.start_ts)),
        end_ts: initial.end_ts.includes('T') ? initial.end_ts : 
          dateUtils.formatDateTimeForInput(new Date(initial.end_ts))
      };
      setForm(formattedInitial);
      
      // Extract date and times from start_ts and end_ts
      const startDate = new Date(formattedInitial.start_ts);
      const endDate = new Date(formattedInitial.end_ts);
      
      // Set date to start date (YYYY-MM-DD)
      setEventDate(formattedInitial.start_ts.split('T')[0]);
      
      // Set times (HH:MM)
      setStartTime(startDate.toTimeString().substring(0, 5));
      setEndTime(endDate.toTimeString().substring(0, 5));
    } else {
      setForm({ title: '', start_ts: '', end_ts: '', notes: '', recurrence: '' });
      
      // Set default date to today
      const today = new Date();
      setEventDate(today.toISOString().split('T')[0]);
      
      // Set default start time to next round hour
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      setStartTime(nextHour.toTimeString().substring(0, 5));
      
      // Set default end time to 1 hour after start
      const endHour = new Date(nextHour);
      endHour.setHours(endHour.getHours() + 1);
      setEndTime(endHour.toTimeString().substring(0, 5));
    }
  }, [initial]);

  // Update the form when date or times change
  useEffect(() => {
    if (eventDate && startTime && endTime) {
      const start_ts = `${eventDate}T${startTime}:00`;
      const end_ts = `${eventDate}T${endTime}:00`;
      setForm(prev => ({...prev, start_ts, end_ts}));
    }
  }, [eventDate, startTime, endTime]);

  const weekdays = [
    { code: 'MO', label: 'Mon' },
    { code: 'TU', label: 'Tue' },
    { code: 'WE', label: 'Wed' },
    { code: 'TH', label: 'Thu' },
    { code: 'FR', label: 'Fri' },
    { code: 'SA', label: 'Sat' },
    { code: 'SU', label: 'Sun' }
  ];
  
  const toggle = (wd: string) => {
    const r = form.recurrence?.startsWith('weekly:') ? form.recurrence.slice(7).split(',') : [];
    const next = r.includes(wd) ? r.filter(x => x !== wd) : [...r, wd];
    setForm({ ...form, recurrence: next.length ? 'weekly:' + next.join(',') : '' });
  };

  const save = async () => {
    // Validate form
    if (!form.title || !form.start_ts || !form.end_ts) {
      // Simple validation
      alert('Please fill out title, date, and times.');
      return;
    }
    
    // Validate that end time is after start time
    const startDate = new Date(form.start_ts);
    const endDate = new Date(form.end_ts);
    if (endDate <= startDate) {
      alert('End time must be after start time.');
      return;
    }
    
    const saved = await upsertEvent(form);
    onSaved(saved);
  };

  // Determine if form has recurring days selected
  const hasRecurrence = form.recurrence?.startsWith('weekly:');

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-5 shadow-xl border border-gray-200 animate-in fade-in duration-150 slide-in-from-bottom-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
            {initial?.id ? 'Edit Event' : 'New Event'}
          </h2>
          {initial?.id && onDelete && (
            <button 
              onClick={onDelete}
              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="Delete event"
              type="button"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">
              Event Title*
            </label>
            <input 
              id="event-title"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              placeholder="Add title"  
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 flex items-center">
              <Calendar size={16} className="mr-1 text-indigo-600" /> Date*
            </label>
            <input 
              id="event-date"
              type="date" 
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              value={eventDate} 
              onChange={e => setEventDate(e.target.value)}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 flex items-center">
                <Clock size={16} className="mr-1 text-indigo-600" /> Start Time*
              </label>
              <input 
                id="start-time"
                type="time" 
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                value={startTime} 
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 flex items-center">
                <Clock size={16} className="mr-1 text-indigo-600" /> End Time*
              </label>
              <input 
                id="end-time"
                type="time" 
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                value={endTime} 
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="event-notes" className="block text-sm font-medium text-gray-700 flex items-center">
              <ClipboardList size={16} className="mr-1 text-indigo-600" /> Notes
            </label>
            <textarea 
              id="event-notes"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
              placeholder="Add notes about this event" 
              rows={3}  
              value={form.notes || ''} 
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <RefreshCw size={16} className="mr-1 text-indigo-600" /> Repeat Weekly
            </label>
            <div className="flex flex-wrap gap-2">
              {weekdays.map(({ code, label }) => (
                <button 
                  key={code} 
                  className={`px-3 py-2 rounded-md text-sm transition-all shadow-sm ${
                    form.recurrence?.includes(code) 
                      ? 'bg-indigo-100 border border-indigo-300 text-indigo-700 font-medium ring-1 ring-indigo-200' 
                      : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}  
                  onClick={() => toggle(code)}
                  type="button"
                >
                  {label}
                </button>  
              ))}
            </div>
            {hasRecurrence && (
              <p className="text-sm text-indigo-600 bg-indigo-50 p-2 rounded-md flex items-center">
                <RefreshCw size={14} className="mr-1 inline" />
                This event will repeat weekly on the selected days.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-gray-700 shadow-sm"
            type="button"
          >
            Cancel
          </button>
          <button 
            onClick={save} 
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow"
            type="button"
          >
            {initial?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
} 