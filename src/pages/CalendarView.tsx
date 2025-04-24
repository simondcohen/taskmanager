import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import { listEvents, deleteEvent } from '../storage/eventStore';
import EventDialog from '../components/events/EventDialog';
import { EventItem } from '../types';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { dateUtils } from '../utils/dateUtils';

export default function CalendarView() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const handleDateClick = (info: any) => {
    // Parse the clicked date, maintaining local timezone
    const clickedDate = new Date(info.dateStr);
    
    // Set start time to the clicked time
    const startTimeStr = dateUtils.formatDateTimeForInput(clickedDate);
    
    // Set end time to 1 hour after start
    const endDate = new Date(clickedDate);
    endDate.setHours(endDate.getHours() + 1);
    const endTimeStr = dateUtils.formatDateTimeForInput(endDate);
    
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Calendar className="mr-2 h-6 w-6" /> 
          Calendar
        </h1>
        <button 
          onClick={() => {
            setSelectedEvent(null);
            setShowDialog(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          New Event
        </button>
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
        dateClick={handleDateClick}
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
        editable={true}
        eventBackgroundColor="#6366F1"
        eventBorderColor="#4F46E5"
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4 shadow-xl border border-gray-200">
            <h2 className="text-xl font-semibold flex items-center text-red-600">
              <Trash2 className="mr-2 h-5 w-5" /> Delete Event
            </h2>
            <p className="text-gray-600">Are you sure you want to delete this event? This action cannot be undone.</p>
            
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteEvent(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 