import React, { useState, useEffect } from 'react';
import { Clock, PlusCircle, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MedicationItem } from '../types';

interface MedicationListProps {
  items: MedicationItem[];
  onUpdateItems: (newItems: MedicationItem[]) => void;
}

export function MedicationList({ items, onUpdateItems }: MedicationListProps) {
  const [medications, setMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');
  const [newMedicationName, setNewMedicationName] = useState('');
  const [newDose, setNewDose] = useState(1);
  const [newDate, setNewDate] = useState(getTodayDate());
  const [newTime, setNewTime] = useState(getCurrentTime());
  const [newNotes, setNewNotes] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showMedicationManager, setShowMedicationManager] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Load saved medications from localStorage
  useEffect(() => {
    const savedMedications = localStorage.getItem('medications');
    if (savedMedications) {
      setMedications(JSON.parse(savedMedications));
    } else {
      // Initial default medications list
      const defaultMedications = ['Ibuprofen', 'Acetaminophen', 'Aspirin', 'Vitamin D'];
      setMedications(defaultMedications);
      localStorage.setItem('medications', JSON.stringify(defaultMedications));
    }
  }, []);

  // Helper functions for date and time
  function parseLocalDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d); // local midnight
  }

  function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().substring(0, 5);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }

  function formatTime(timeStr: string) {
    return timeStr;
  }

  // Helper to format date for display
  function formatDateForDisplay(dateStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Helper to format date for state
  function formatDateForState(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Get selected date logs (instead of just today's logs)
  const selectedDateLogs = items.filter(item => item.date === selectedDate);
  
  // Group medications taken on selected date
  const selectedDateMedications = selectedDateLogs.reduce((acc: {[key: string]: number}, item) => {
    if (!acc[item.name]) {
      acc[item.name] = 0;
    }
    acc[item.name] += item.dose;
    return acc;
  }, {});

  // Get the last dose for each medication on selected date
  const lastDoses = medications.reduce((acc: {[key: string]: MedicationItem | null}, medication) => {
    const medicationLogs = items.filter(item => item.name === medication && item.date === selectedDate);
    if (medicationLogs.length) {
      const sorted = [...medicationLogs].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      acc[medication] = sorted[0];
    } else {
      acc[medication] = null;
    }
    return acc;
  }, {});

  // Navigate to previous day
  const goToPreviousDay = () => {
    const currentDate = parseLocalDate(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(formatDateForState(currentDate));
  };

  // Navigate to next day
  const goToNextDay = () => {
    const currentDate = parseLocalDate(selectedDate);
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    
    // Only allow navigation to today or past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);
    
    if (nextDate <= today) {
      setSelectedDate(formatDateForState(nextDate));
    }
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(getTodayDate());
  };

  // Check if selected date is today
  const isToday = selectedDate === getTodayDate();

  // Add new medication record
  const addMedicationRecord = () => {
    if (!newMedicationName) {
      alert('Please select a medication');
      return;
    }

    // Use custom medication name if selected
    const medicationName = newMedicationName === 'custom' 
      ? newMedication.trim() 
      : newMedicationName;

    if (newMedicationName === 'custom' && !medicationName) {
      alert('Please enter a custom medication name');
      return;
    }

    const dateTime = new Date(`${newDate}T${newTime}`);
    // Create an ISO string but preserve local timezone information
    const timestamp = new Date(
      dateTime.getFullYear(),
      dateTime.getMonth(),
      dateTime.getDate(),
      dateTime.getHours(),
      dateTime.getMinutes()
    ).toISOString();
    
    const newItem: MedicationItem = {
      id: Date.now(),
      name: medicationName,
      dose: newDose,
      date: newDate,
      time: newTime,
      notes: newNotes.trim() || undefined,
      timestamp
    };

    if (editingId !== null) {
      // Update existing record
      const updatedItems = items.map(item => 
        item.id === editingId ? newItem : item
      );
      onUpdateItems(updatedItems);
      setEditingId(null);
    } else {
      // Add new record
      onUpdateItems([...items, newItem]);
    }

    // Reset form
    setNewMedicationName('');
    setNewDose(1);
    setNewDate(getTodayDate());
    setNewTime(getCurrentTime());
    setNewNotes('');
    setNewMedication('');
  };

  // Delete medication record
  const deleteMedicationRecord = (id: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this record?');
    if (confirmDelete) {
      const updatedItems = items.filter(item => item.id !== id);
      onUpdateItems(updatedItems);
    }
  };

  // Edit medication record
  const editMedicationRecord = (item: MedicationItem) => {
    setNewMedicationName(item.name);
    setNewDose(item.dose);
    setNewDate(item.date);
    setNewTime(item.time);
    setNewNotes(item.notes || '');
    setEditingId(item.id);
  };

  // Add new medication to the list
  const addMedicationToList = () => {
    if (!newMedication.trim()) {
      alert('Please enter a medication name');
      return;
    }

    const updatedMedications = [...medications, newMedication.trim()];
    setMedications(updatedMedications);
    localStorage.setItem('medications', JSON.stringify(updatedMedications));
    setNewMedication('');
  };

  // Remove medication from the list
  const removeMedicationFromList = (index: number) => {
    const updatedMedications = medications.filter((_, i) => i !== index);
    setMedications(updatedMedications);
    localStorage.setItem('medications', JSON.stringify(updatedMedications));
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Medication Tracking</h2>

      {/* Input Form */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium mb-4">Record Medication</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medication
            </label>
            <div className="flex">
              <select
                value={newMedicationName}
                onChange={(e) => setNewMedicationName(e.target.value)}
                className="w-full p-2 border rounded-l focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Medication</option>
                {medications.map((med, index) => (
                  <option key={index} value={med}>
                    {med}
                  </option>
                ))}
                <option value="custom">Custom medication...</option>
              </select>
              <button
                onClick={() => setShowMedicationManager(true)}
                className="bg-indigo-100 text-indigo-700 px-3 rounded-r border border-l-0 hover:bg-indigo-200"
                title="Manage medications"
              >
                <PlusCircle size={20} />
              </button>
            </div>
            {newMedicationName === 'custom' && (
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Enter medication name"
                className="w-full mt-2 p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dose
            </label>
            <input
              type="number"
              value={newDose}
              onChange={(e) => setNewDose(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full p-2 border rounded focus:ring-indigo-500 focus:border-indigo-500"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={addMedicationRecord}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {editingId !== null ? 'Update Medication' : 'Add Medication'}
          </button>
          {editingId !== null && (
            <button
              onClick={() => {
                setEditingId(null);
                setNewMedicationName('');
                setNewDose(1);
                setNewDate(getTodayDate());
                setNewTime(getCurrentTime());
                setNewNotes('');
              }}
              className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Date selector for viewing different days */}
      <div className="mb-6 flex justify-between items-center border-b pb-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={goToPreviousDay}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="font-medium">{formatDateForDisplay(selectedDate)}</span>
            {!isToday && (
              <button 
                onClick={goToToday}
                className="text-xs text-indigo-600 hover:underline"
              >
                Go to today
              </button>
            )}
          </div>
          
          <button 
            onClick={goToNextDay}
            className="p-1 rounded-full hover:bg-gray-100"
            disabled={isToday}
            title={isToday ? "Cannot go beyond today" : "Next day"}
            style={{ opacity: isToday ? 0.5 : 1 }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-1 border rounded text-sm"
            max={getTodayDate()}
          />
        </div>
      </div>

      {/* Selected Date Summary (previously Today's Summary) */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">
          {isToday ? "Today's Summary" : `Summary for ${formatDateForDisplay(selectedDate)}`}
        </h3>
        
        {Object.keys(selectedDateMedications).length > 0 ? (
          <div className="mb-6">
            <h4 className="text-md font-medium mb-2">Total Doses</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(selectedDateMedications).map(([medication, dose]) => (
                <div key={medication} className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium">{medication}</div>
                  <div className="text-sm text-gray-600">Total: {dose} doses {isToday ? 'today' : 'on this day'}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 py-2">No medications recorded {isToday ? 'today' : 'on this day'}.</p>
        )}

        <h4 className="text-md font-medium mb-2">Last Doses</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(lastDoses)
            .filter(([_, item]) => item !== null) // Only show medications with recorded doses
            .map(([medication, item]) => (
              <div key={medication} className="bg-gray-50 p-3 rounded-lg border">
                <div className="font-medium">{medication}</div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center mt-1">
                    <Clock size={14} className="mr-1" />
                    Last dose: {item!.dose} at {formatTime(item!.time)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Selected Date Records (previously Today's Records) */}
      <div>
        <h3 className="text-lg font-medium mb-4">
          {isToday ? "Today's Records" : `Records for ${formatDateForDisplay(selectedDate)}`}
        </h3>
        {selectedDateLogs.length > 0 ? (
          <div className="space-y-3">
            {selectedDateLogs
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) // Changed to ascending order
              .map((item) => (
                <div key={item.id} className="p-3 border rounded-lg flex justify-between items-start">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">
                      Dose: {item.dose} at {formatTime(item.time)}
                    </div>
                    {item.notes && (
                      <div className="text-sm text-gray-600 mt-1">
                        Notes: {item.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editMedicationRecord(item)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteMedicationRecord(item.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 py-4">No medications recorded {isToday ? 'today' : 'on this day'}.</p>
        )}
      </div>

      {/* Medication Manager Modal */}
      {showMedicationManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Manage Medications</h3>
              <button
                onClick={() => setShowMedicationManager(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  placeholder="Add new medication"
                  className="w-full p-2 border rounded-l focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={addMedicationToList}
                  className="bg-indigo-600 text-white px-4 rounded-r hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {medications.map((medication, index) => (
                  <li key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span>{medication}</span>
                    <button
                      onClick={() => removeMedicationFromList(index)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowMedicationManager(false)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
} 