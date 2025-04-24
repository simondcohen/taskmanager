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
    } else {
      setForm({ title: '', start_ts: '', end_ts: '', notes: '', recurrence: '' });
    }
  }, [initial]);

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
      alert('Please fill out title, start time, and end time.');
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-5 shadow-xl border border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{initial?.id ? 'Edit Event' : 'New Event'}</h2>
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
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              placeholder="Add title"  
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="event-start" className="block text-sm font-medium text-gray-700 flex items-center">
                <Calendar size={16} className="mr-1" /> Start*
              </label>
              <input 
                id="event-start"
                type="datetime-local" 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={form.start_ts} 
                onChange={e => setForm({ ...form, start_ts: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="event-end" className="block text-sm font-medium text-gray-700 flex items-center">
                <Clock size={16} className="mr-1" /> End*
              </label>
              <input 
                id="event-end"
                type="datetime-local" 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={form.end_ts} 
                onChange={e => setForm({ ...form, end_ts: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="event-notes" className="block text-sm font-medium text-gray-700 flex items-center">
              <ClipboardList size={16} className="mr-1" /> Notes
            </label>
            <textarea 
              id="event-notes"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
              placeholder="Add notes about this event" 
              rows={3}  
              value={form.notes || ''} 
              onChange={e => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center">
              <RefreshCw size={16} className="mr-1" /> Repeat Weekly
            </label>
            <div className="flex flex-wrap gap-2">
              {weekdays.map(({ code, label }) => (
                <button 
                  key={code} 
                  className={`px-3 py-2 rounded-md text-sm transition-all ${
                    form.recurrence?.includes(code) 
                      ? 'bg-indigo-100 border border-indigo-300 text-indigo-700 font-medium' 
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
              <p className="text-sm text-indigo-600">
                This event will repeat weekly on the selected days.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            type="button"
          >
            Cancel
          </button>
          <button 
            onClick={save} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            type="button"
          >
            {initial?.id ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
} 