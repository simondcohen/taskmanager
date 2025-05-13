import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { listEvents, deleteEvent, upsertEvent } from '../storage/eventStore';
import EventDialog from '../components/events/EventDialog';
import { EventItem } from '../types';
import { Calendar, Plus, Trash2, Upload, X } from 'lucide-react';
import { dateUtils } from '../utils/dateUtils';

export default function CalendarView() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');

  const loadEvents = () => {
    setEvents(listEvents());
  };

  useEffect(() => { 
    loadEvents(); 
  }, []);

  const fcEvents = events.flatMap(evt => {
    if (evt.recurrence?.startsWith('weekly:')) {
      const byweekday = evt.recurrence.slice(7).split(',');
      return {
        id: evt.id, title: evt.title,
        rrule: { freq: 'weekly', byweekday, dtstart: evt.start_ts },
        duration: new Date(evt.end_ts).getTime() - new Date(evt.start_ts).getTime(),
        extendedProps: { notes: evt.notes, eventData: evt }
      };
    }
    return { 
      id: evt.id, 
      title: evt.title, 
      start: evt.start_ts, 
      end: evt.end_ts,
      extendedProps: { notes: evt.notes, eventData: evt }
    };
  });

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowDialog(true);
    }
  };

  const handleSelect = (info: any) => {
    const start = info.start;
    const end = info.end || new Date(info.start.getTime() + 60*60*1000);
    
    // Format to ISO strings
    const startTimeStr = dateUtils.formatDateTimeForInput(start);
    const endTimeStr = dateUtils.formatDateTimeForInput(end);
    
    setSelectedEvent({
      title: '',
      start_ts: startTimeStr,
      end_ts: endTimeStr,
      notes: '',
      recurrence: ''
    });
    setShowDialog(true);
  };

  const handleEventSaved = (evt: EventItem) => {
    loadEvents();
    setShowDialog(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (id: string | undefined) => {
    if (!id) return;
    
    deleteEvent(id);
    loadEvents();
    setConfirmDelete(null);
    setShowDialog(false);
  };

  // Import JSON functionality
  function handleImportJson() {
    if (!importJson.trim()) {
      alert('Please enter valid JSON data.');
      return;
    }

    try {
      const importedData = JSON.parse(importJson);
      
      // Validate the imported data
      if (!Array.isArray(importedData)) {
        throw new Error('Imported data must be an array of event items');
      }
      
      // Validate each event item
      const validatedEvents: EventItem[] = [];
      for (const item of importedData) {
        if (typeof item !== 'object' || item === null) {
          throw new Error('Each item must be an object');
        }
        
        if (typeof item.title !== 'string' || !item.title.trim()) {
          throw new Error('Each event must have a valid title property');
        }
        
        if (typeof item.start_ts !== 'string' || !item.start_ts.trim()) {
          throw new Error('Each event must have a valid start_ts property');
        }
        
        if (typeof item.end_ts !== 'string' || !item.end_ts.trim()) {
          throw new Error('Each event must have a valid end_ts property');
        }
        
        // Create a new event with required fields
        const newEvent: EventItem = {
          id: undefined, // Will be assigned by upsertEvent
          title: item.title,
          start_ts: item.start_ts,
          end_ts: item.end_ts,
          notes: typeof item.notes === 'string' ? item.notes : '',
          recurrence: typeof item.recurrence === 'string' ? item.recurrence : ''
        };
        
        // Add the event to the validated list
        validatedEvents.push(newEvent);
      }
      
      // Add events to storage without clearing existing ones
      let addedCount = 0;
      for (const event of validatedEvents) {
        upsertEvent(event); // This adds the event without replacing existing ones
        addedCount++;
      }
      
      // Reload events
      loadEvents();
      
      // Close the dialog and reset the input
      setShowImportDialog(false);
      setImportJson('');
      
      alert(`Successfully imported ${addedCount} event items.`);
    } catch (error) {
      alert(`Error importing data: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    }
  }

  // Add event handlers for drag and resize
  const handleEventDrop = (info: any) => {
    const eventId = info.event.id;
    const event = events.find(e => e.id === eventId);
    
    if (event) {
      const updatedEvent = {
        ...event,
        start_ts: dateUtils.formatDateTimeForInput(info.event.start),
        end_ts: dateUtils.formatDateTimeForInput(info.event.end || new Date(info.event.start.getTime() + 60*60*1000))
      };
      
      upsertEvent(updatedEvent);
      loadEvents();
    }
  };

  const handleEventResize = (info: any) => {
    const eventId = info.event.id;
    const event = events.find(e => e.id === eventId);
    
    if (event) {
      const updatedEvent = {
        ...event,
        start_ts: dateUtils.formatDateTimeForInput(info.event.start),
        end_ts: dateUtils.formatDateTimeForInput(info.event.end)
      };
      
      upsertEvent(updatedEvent);
      loadEvents();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center text-gray-900">
          <Calendar className="mr-3 h-7 w-7 text-indigo-600" /> 
          Calendar
        </h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow"
          >
            <Upload size={18} />
            Import Events
          </button>
          <button 
            onClick={() => {
              setSelectedEvent(null);
              setShowDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow"
          >
            <Plus size={18} />
            New Event
          </button>
        </div>
      </div>

      <FullCalendar 
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="timeGridWeek" 
        events={fcEvents} 
        height="800px"
        scrollTime="08:00:00"
        allDaySlot={true}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        eventClick={handleEventClick}
        select={handleSelect}
        selectable={true}
        slotDuration="00:30:00"
        editable={true}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: 'short'
        }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }}
        nowIndicator={true}
        navLinks={true}
        eventBackgroundColor="#6366F1"
        eventBorderColor="#4F46E5"
        eventDisplay="block"
        eventMinHeight={40}
        eventContent={(info) => (
          <div className="flex flex-col text-xs leading-tight">
            <span className="font-medium">{info.timeText}</span>
            <span className="whitespace-normal break-words">{info.event.title}</span>
          </div>
        )}
        dayCellClassNames="hover:bg-indigo-50 transition-colors"
        dayHeaderClassNames="text-xs uppercase font-semibold tracking-wider py-2"
        slotLabelClassNames="text-xs font-medium text-gray-500"
        allDayClassNames="text-xs font-medium"
        viewClassNames="rounded-lg overflow-hidden"
        stickyHeaderDates={true}
        firstDay={1}
      />

      {/* Event Dialog */}
      <EventDialog 
        open={showDialog} 
        initial={selectedEvent}
        onClose={() => {
          setShowDialog(false);
          setSelectedEvent(null);
        }}
        onSaved={handleEventSaved}
        onDelete={selectedEvent?.id ? () => {
          setConfirmDelete(selectedEvent.id!);
          // Don't close dialog yet, wait for confirmation
        } : undefined}
      />

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-xl border border-gray-200 animate-in fade-in duration-150 slide-in-from-bottom-4">
            <h2 className="text-xl font-semibold flex items-center text-red-600">
              <Trash2 className="mr-2 h-5 w-5" /> Delete Event
            </h2>
            <p className="text-gray-600">Are you sure you want to delete this event? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteEvent(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:shadow-md"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-xl w-full max-w-xl space-y-4 shadow-xl border border-gray-200 animate-in fade-in duration-150 slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Import Calendar Events</h2>
              <button 
                onClick={() => setShowImportDialog(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-gray-700">Paste your JSON data below. The data should be an array of event items with the following structure:</p>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
{`[
  {
    "title": "Event title", // required
    "start_ts": "2023-05-15T10:00:00", // required, ISO string
    "end_ts": "2023-05-15T11:00:00", // required, ISO string
    "notes": "Additional notes", // optional
    "recurrence": "weekly:MO,TU" // optional, for recurring events
  },
  ...
]`}
                </pre>
              </div>
              
              <textarea
                className="w-full h-64 px-3 py-2 border rounded-lg"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste JSON data here..."
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportJson}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 