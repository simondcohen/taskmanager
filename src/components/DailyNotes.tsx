import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, X, Calendar as CalendarIcon } from 'lucide-react';
import { DailyNote, CalendarDay } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface DailyNotesProps {
  notes: { [date: string]: DailyNote[] };
  selectedDay: string;
  onUpdateNotes: (newNotes: { [date: string]: DailyNote[] }) => void;
  onSelectDay: (day: string) => void;
}

export function DailyNotes({
  notes,
  selectedDay,
  onUpdateNotes,
  onSelectDay,
}: DailyNotesProps) {
  const [newNote, setNewNote] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editContent, setEditContent] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCurrentDate = () => {
    const d = new Date();
    return formatDateString(d);
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (err) {
      return dateStr;
    }
  };

  const formatTimeDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return dateStr;
    }
  };

  const isToday = (dateStr: string) => dateStr === getCurrentDate();

  const navigateMonth = (direction: number) => {
    const newDate = new Date(calendarYear, calendarMonth + direction, 1);
    setCalendarMonth(newDate.getMonth());
    setCalendarYear(newDate.getFullYear());
  };

  const getCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    
    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(calendarYear, calendarMonth, 0);
      const prevMonthDays = prevMonth.getDate();
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const date = new Date(calendarYear, calendarMonth - 1, day);
        const dateStr = formatDateString(date);
        
        days.push({
          day,
          date: dateStr,
          currentMonth: false,
          isToday: isToday(dateStr),
          isSelected: selectedDay === dateStr,
          hasChecklist: notes[dateStr] !== undefined
        });
      }
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(calendarYear, calendarMonth, day);
      const dateStr = formatDateString(date);
      
      days.push({
        day,
        date: dateStr,
        currentMonth: true,
        isToday: isToday(dateStr),
        isSelected: selectedDay === dateStr,
        hasChecklist: notes[dateStr] !== undefined
      });
    }
    
    // Add days from next month
    const daysNeeded = 42 - days.length;
    for (let day = 1; day <= daysNeeded; day++) {
      const date = new Date(calendarYear, calendarMonth + 1, day);
      const dateStr = formatDateString(date);
      
      days.push({
        day,
        date: dateStr,
        currentMonth: false,
        isToday: isToday(dateStr),
        isSelected: selectedDay === dateStr,
        hasChecklist: notes[dateStr] !== undefined
      });
    }
    
    return days;
  };

  const selectCalendarDay = (day: CalendarDay) => {
    onSelectDay(day.date);
    setShowCalendar(false);
  };

  const navigateDay = (direction: number) => {
    const currentDate = new Date(selectedDay);
    currentDate.setDate(currentDate.getDate() + direction);
    const newDateStr = formatDateString(currentDate);
    onSelectDay(newDateStr);
  };

  const calendarMonthYear = new Date(calendarYear, calendarMonth, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  const addNote = () => {
    if (!newNote.trim()) return;

    const currentNotes = notes[selectedDay] || [];
    const newNoteObj: DailyNote = {
      id: Date.now(),
      content: newNote.trim(),
      createdAt: new Date().toISOString()
    };

    onUpdateNotes({
      ...notes,
      [selectedDay]: [...currentNotes, newNoteObj]
    });

    setNewNote('');
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Daily Notes</h2>

      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigateDay(-1)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="group relative inline-flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="font-medium">
              {selectedDay
                ? formatDateDisplay(selectedDay)
                : 'Select Date'}
            </span>
            {isToday(selectedDay) && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Today
              </span>
            )}

            {showCalendar && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 w-64 z-50">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold">{calendarMonthYear}</span>
                  <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekdays.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((day, index) => (
                    <button
                      key={index}
                      onClick={() => selectCalendarDay(day)}
                      className={`
                        p-2 text-center rounded hover:bg-gray-100
                        ${!day.currentMonth ? 'text-gray-400' : ''}
                        ${day.isToday ? 'font-bold text-blue-600' : ''}
                        ${day.isSelected ? 'bg-blue-100' : ''}
                        ${day.hasChecklist ? 'border-b-2 border-blue-500' : ''}
                      `}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </button>
        </div>
        <button 
          onClick={() => navigateDay(1)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {selectedDay && notes[selectedDay]?.length > 0 ? (
          <ul className="space-y-4">
            {notes[selectedDay].map((note, index) => (
              <li
                key={note.id}
                className="p-4 bg-gray-50 rounded-lg border"
              >
                {editIndex === index ? (
                  <div className="space-y-2">
                    <RichTextEditor
                      content={editContent}
                      onChange={setEditContent}
                      placeholder="Edit your note..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!editContent.trim()) return;
                          const updatedNotes = [...notes[selectedDay]];
                          updatedNotes[index] = {
                            ...note,
                            content: editContent.trim()
                          };
                          onUpdateNotes({
                            ...notes,
                            [selectedDay]: updatedNotes
                          });
                          setEditIndex(-1);
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditIndex(-1)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-500">
                        {formatTimeDisplay(note.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditIndex(index);
                            setEditContent(note.content);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this note?')) {
                              const updatedNotes = notes[selectedDay].filter((_, i) => i !== index);
                              onUpdateNotes({
                                ...notes,
                                [selectedDay]: updatedNotes
                              });
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div 
                      className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No notes for this day. Add a new note below.
          </p>
        )}

        <div className="mt-6 space-y-4">
          <RichTextEditor
            content={newNote}
            onChange={setNewNote}
            placeholder="Write a new note..."
          />
          <button
            onClick={addNote}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add Note
          </button>
        </div>
      </div>
    </section>
  );
}