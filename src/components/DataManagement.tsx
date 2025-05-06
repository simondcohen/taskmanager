import React, { useState } from 'react';
import { Task, TodoItem, GroceryItem, ShoppingItem, ReadingItem, EntertainmentItem, VideoItem, PodcastItem, DeadlineItem, MedicationItem, BookItem } from '../types';
import { X } from 'lucide-react';
import { listEvents } from '../storage/eventStore';
import { Category } from './CategoryManager';

interface DataManagementProps {
  templateTasks: Task[];
  checklists: { [date: string]: Task[] };
  todos: TodoItem[];
  groceryItems: GroceryItem[];
  shoppingItems: ShoppingItem[];
  readingItems: ReadingItem[];
  entertainmentItems: EntertainmentItem[];
  videoItems: VideoItem[];
  podcastItems: PodcastItem[];
  deadlines?: DeadlineItem[];
  medicationItems: MedicationItem[];
  selectedDay: string;
  todoCategories: Category[];
  readingCategories: Category[];
  bookCategories: Category[];
  videoCategories: Category[];
  bookItems: BookItem[];
  onImportData: (data: { 
    templateTasks: Task[]; 
    checklists: { [date: string]: Task[] }; 
    todos: TodoItem[]; 
    deadlines?: DeadlineItem[]; 
    medicationItems?: MedicationItem[];
    readingItems?: ReadingItem[];
    bookItems?: BookItem[];
    entertainmentItems?: EntertainmentItem[];
    videoItems?: VideoItem[];
    shoppingItems?: ShoppingItem[];
    groceryItems?: GroceryItem[];
    podcastItems?: PodcastItem[];
    todoCategories?: Category[];
    readingCategories?: Category[];
    bookCategories?: Category[];
    videoCategories?: Category[];
    reminders?: any[];
  }) => void;
  onResetApp?: () => void;
  onLoadDemo?: () => void;
  onClearDemo?: () => void;
  isShowingDemo?: boolean;
}

export function DataManagement({
  templateTasks,
  checklists,
  todos,
  groceryItems,
  shoppingItems,
  readingItems,
  entertainmentItems,
  videoItems,
  podcastItems,
  deadlines,
  medicationItems,
  selectedDay,
  todoCategories,
  readingCategories,
  bookCategories,
  videoCategories,
  bookItems,
  onImportData,
  onResetApp,
  onLoadDemo,
  onClearDemo,
  isShowingDemo
}: DataManagementProps) {
  const [exportMessage, setExportMessage] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const downloadData = () => {
    const dataToExport = {
      templateTasks,
      checklists,
      todos,
      todoCategories,
      readingCategories,
      bookCategories,
      videoCategories,
      readingItems,
      bookItems,
      groceryItems,
      shoppingItems,
      entertainmentItems,
      videoItems,
      podcastItems,
      deadlines: deadlines || [],
      medicationItems,
      // Include reminders if they exist in the app context
      reminders: window.localStorage.getItem('reminders') ? 
        JSON.parse(window.localStorage.getItem('reminders') || '[]') : 
        []
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-manager-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (validateImportData(parsed)) {
          onImportData(parsed);
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid JSON file or error during parsing.');
        console.error('Import Error:', err);
      }
    };
    reader.readAsText(file);
  };

  const validateImportData = (data: any) => {
    if (!data || typeof data !== 'object') {
      alert('Invalid format: Not an object.');
      return false;
    }

    let isValid = false;

    if (data.hasOwnProperty('templateTasks')) {
      if (!Array.isArray(data.templateTasks)) {
        alert('Invalid: templateTasks not array.');
        return false;
      }
      isValid = true;
    }

    if (data.hasOwnProperty('checklists')) {
      if (typeof data.checklists !== 'object' || Array.isArray(data.checklists)) {
        alert('Invalid: checklists not object.');
        return false;
      }
      isValid = true;
    }

    if (data.hasOwnProperty('todos')) {
      if (!Array.isArray(data.todos)) {
        alert('Invalid: todos not array.');
        return false;
      }
      isValid = true;
    }

    // Check other data types
    const arrayTypes = [
      'todoCategories', 'readingCategories', 'bookCategories', 'videoCategories',
      'readingItems', 'bookItems', 'groceryItems', 'shoppingItems', 
      'entertainmentItems', 'videoItems', 'podcastItems', 'deadlines', 
      'medicationItems', 'reminders'
    ];

    for (const type of arrayTypes) {
      if (data.hasOwnProperty(type)) {
        if (!Array.isArray(data[type])) {
          alert(`Invalid: ${type} not array.`);
          return false;
        }
        isValid = true;
      }
    }

    if (!isValid) {
      alert('Invalid: No recognizable sections found.');
      return false;
    }

    return true;
  };
  
  const handleImportText = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      
      if (validateImportData(parsed)) {
        onImportData(parsed);
        setIsImportModalOpen(false);
        setImportText('');
      } else {
        setImportError('JSON schema not recognised');
      }
    } catch (err) {
      setImportError('Invalid JSON');
      console.error('Import Error:', err);
    }
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setExportMessage(successMessage);
      setTimeout(() => setExportMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const exportCurrentTasks = () => {
    // Get current date
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    // Get incomplete tasks
    const incompleteTasks = todos.filter(todo => !todo.completed);

    // Get incomplete deadlines
    const incompleteDeadlines = (deadlines || []).filter(deadline => !deadline.completed);

    // Get calendar events
    const calendarEvents = listEvents();

    // Process events to include only future events and handle recurring ones efficiently
    const futureEvents = calendarEvents
      .map(event => {
        const eventStartDate = new Date(event.start_ts);
        // For non-recurring events, just check if they're in the future
        if (!event.recurrence) {
          return eventStartDate >= now ? event : null;
        } 
        
        // For recurring events, format them efficiently
        if (event.recurrence?.startsWith('weekly:')) {
          const weekdays = event.recurrence.slice(7).split(',');
          return {
            ...event,
            recurrence_details: {
              frequency: 'weekly',
              byweekday: weekdays
            }
          };
        }
        
        return event;
      })
      .filter(Boolean); // Remove null values (past non-recurring events)

    // Get active categories
    const activeCategoriesMap = new Map();
    incompleteTasks.forEach(task => {
      if (task.category) activeCategoriesMap.set(task.category, true);
    });
    const activeCategories = todoCategories.filter(cat => 
      activeCategoriesMap.has(cat.name)
    );

    const data = {
      exportedAt: new Date().toISOString(),
      tasks: incompleteTasks,
      deadlines: incompleteDeadlines,
      categories: activeCategories,
      calendar_events: futureEvents
    };

    copyToClipboard(
      JSON.stringify(data, null, 2),
      "Current tasks, deadlines, categories, and future calendar events copied to clipboard!"
    );
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Data Management</h2>

      <div className="space-y-8">
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Export Snapshots</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                onClick={exportCurrentTasks}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Export Tasks & Calendar
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Paste JSON
              </button>
            </div>
          </div>
          {exportMessage && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              {exportMessage}
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Backups</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                onClick={downloadData}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Download Data
              </button>
              <label className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer">
                Upload Data
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Import JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Import JSON Data</h3>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportText('');
                  setImportError('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full border rounded p-2 mb-2 h-[500px]"
                  placeholder="Paste your JSON here..."
                />
                
                {importError && (
                  <div className="text-red-500">{importError}</div>
                )}
              </div>
              
              <div className="border rounded p-4 h-[500px] overflow-y-auto">
                <h4 className="font-medium mb-2">JSON Format Documentation</h4>
                <p className="text-sm text-gray-600 mb-3">
                  The JSON data should be an object containing one or more of these arrays:
                </p>
                
                <div className="space-y-6 text-sm">
                  <div>
                    <h5 className="font-semibold text-indigo-600">Tasks (todos)</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`"todos": [
  {
    "id": 1234567890,
    "text": "Task description",
    "deadline": "YYYY-MM-DD",     // Optional
    "time": "HH:MM",              // Optional
    "completed": false,           // Optional, default: false
    "completedAt": null,          // Optional, set when completed
    "dateAdded": "ISO-timestamp", // Required
    "category": "Category name"   // Optional
  }
]`}
                    </pre>
                  </div>

                  <div>
                    <h5 className="font-semibold text-indigo-600">Deadlines</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`"deadlines": [
  {
    "id": "unique-string-id",
    "title": "Deadline title",
    "dueDate": "YYYY-MM-DD",  // Required
    "notes": "Optional notes", // Optional
    "completed": false         // Optional, default: false
  }
]`}
                    </pre>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-indigo-600">Calendar Events</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`"calendar_events": [
  {
    "title": "Event name",
    "start_ts": "ISO-timestamp", // Required
    "end_ts": "ISO-timestamp",   // Required
    "notes": "Additional info",  // Optional
    "recurrence": ""             // Optional, format: 'weekly:MO,TU,WE' 
  }
]`}
                    </pre>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-indigo-600">Categories</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`"todoCategories": [  // Also: readingCategories, bookCategories, videoCategories
  {
    "id": "unique-id",
    "name": "Category name",
    "color": "#RRGGBB"
  }
]`}
                    </pre>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-indigo-600">Reading Items</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`"readingItems": [
  {
    "id": 1234567890,
    "url": "https://website.com/article", // Optional
    "title": "Article title",             // Required
    "siteName": "Website Name",           // Optional
    "description": "Article description", // Optional
    "imageUrl": "https://...",            // Optional
    "notes": "My notes",                  // Optional
    "completed": false,                   // Required
    "dateAdded": "ISO-timestamp",         // Required
    "category": "Category name"           // Optional
  }
]`}
                    </pre>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-indigo-600">Reminders</h5>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
{`"reminders": [
  {
    "id": "unique-string-id",
    "text": "Reminder text",
    "date": "YYYY-MM-DD",              // Required
    "time": "HH:MM",                    // Optional
    "recurrence": "none|daily|weekly|monthly|yearly", // Optional
    "completed": false,                 // Required
    "completedAt": null,                // Optional
    "notes": "Additional notes"         // Optional
  }
]`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportText('');
                  setImportError('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleImportText}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Data and Reset Section */}
      {(onResetApp || onLoadDemo || onClearDemo) && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-medium mb-4">App Management</h3>
          <div className="flex flex-col gap-4">
            {onResetApp && (
              <button
                onClick={onResetApp}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reset App
              </button>
            )}
            
            {(onLoadDemo && onClearDemo) && (
              <div className="flex gap-4">
                <button
                  onClick={onLoadDemo}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  disabled={isShowingDemo}
                >
                  Load Demo Data
                </button>
                <button
                  onClick={onClearDemo}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  disabled={!isShowingDemo}
                >
                  Clear Demo Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}