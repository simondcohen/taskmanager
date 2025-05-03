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
    
    // Format date in YYYY-MM-DD format
    const dateStr = clickedDate.toISOString().split('T')[0];
    
    // Set start time to current time, rounded to nearest hour
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1, 0, 0, 0);
    
    // Set end time to 1 hour after start
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    
    // Format to ISO strings
    const startTimeStr = dateUtils.formatDateTimeForInput(startTime);
    const endTimeStr = dateUtils.formatDateTimeForInput(endTime);
    
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
        <h1 className="text-2xl font-bold flex items-center text-gray-900">
          <Calendar className="mr-3 h-7 w-7 text-indigo-600" /> 
          Calendar
        </h1>
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
        eventDisplay="block"
        eventContent={(eventInfo) => (
          <div className="p-1 overflow-hidden h-full">
            <div className="text-xs font-medium">{eventInfo.timeText}</div>
            <div className="font-medium truncate">{eventInfo.event.title}</div>
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
    </div>
  );
} 