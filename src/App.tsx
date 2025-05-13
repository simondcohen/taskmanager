import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, ListTodo, Book, Film, ShoppingBag, Apple, LayoutGrid, Video, Headphones, Pill, BookOpen, Database, Download, Upload, ClipboardCopy } from 'lucide-react';
import { DailyChecklist } from './components/DailyChecklist';
import { TodoList } from './components/TodoList';
import { ReadingList } from './components/ReadingList';
import { EntertainmentList } from './components/EntertainmentList';
import { VideoList } from './components/VideoList';
import { ShoppingList } from './components/ShoppingList';
import { GroceryList } from './components/GroceryList';
import { PodcastList } from './components/PodcastList';
import { MedicationList } from './components/MedicationList';
import { BooksList } from './components/BooksList';
import CalendarView from './pages/CalendarView';
import { Task, DailyChecklists, Tab, TodoItem, ReadingItem, EntertainmentItem, VideoItem, ShoppingItem, GroceryItem, PodcastItem, MedicationItem, BookItem, EventItem } from './types';
import { Category } from './components/CategoryManager';
import { toStorage, fromStorage, formatDateOnly } from './utils/time';
import { listEvents, upsertEvent } from './storage/eventStore';

// Group tabs by category
const tabGroups = [
  {
    name: 'Tasks',
    tabs: [
      { id: 'todos', label: 'To-Do Items', icon: ListTodo },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    name: 'Personal',
    tabs: [
      { id: 'daily', label: 'Daily Habits', icon: CheckSquare },
      { id: 'medications', label: 'Medications', icon: Pill },
    ],
  },
  {
    name: 'Lists',
    tabs: [
      { id: 'grocery', label: 'Grocery List', icon: Apple },
      { id: 'shopping', label: 'Shopping List', icon: ShoppingBag },
      { id: 'reading', label: 'Articles', icon: Book },
      { id: 'books', label: 'Books', icon: BookOpen },
      { id: 'entertainment', label: 'Movies & TV', icon: Film },
      { id: 'videos', label: 'Videos', icon: Video },
      { id: 'podcasts', label: 'Podcasts', icon: Headphones },
    ],
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as Tab) || 'daily';
  });
  const [isCompactView, setIsCompactView] = useState(false);
  const location = useLocation();
  
  // Update activeTab based on URL path
  useEffect(() => {
    const path = location.pathname.substring(1); // Remove the leading '/'
    const validTab = path as Tab;
    
    if (path === '') {
      setActiveTab('daily');
    } else if (tabGroups.some(group => 
      group.tabs.some(tab => tab.id === validTab)
    )) {
      setActiveTab(validTab);
      localStorage.setItem('activeTab', validTab);
    }
  }, [location.pathname]);
  
  // Update document title when activeTab changes
  useEffect(() => {
    // Find the current tab label for the title
    let tabLabel = "Task Manager";
    
    for (const group of tabGroups) {
      const tab = group.tabs.find(t => t.id === activeTab);
      if (tab) {
        tabLabel = `${tab.label} - Task Manager`;
        break;
      }
    }
    
    document.title = tabLabel;
  }, [activeTab]);
  
  // Get dates for demo data
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [templateTasks, setTemplateTasks] = useState<Task[]>([]);
  const [checklists, setChecklists] = useState<DailyChecklists>({});
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const savedItems = localStorage.getItem('react-task-manager-app');
    if (savedItems) {
      try {
        const parsedData = JSON.parse(savedItems);
        return parsedData.todos || [];
      } catch (e) {
        console.error('Error parsing todos from localStorage:', e);
        return [];
      }
    }
    return [];
  });
  const [todoCategories, setTodoCategories] = useState<Category[]>(() => {
    const savedItems = localStorage.getItem('react-task-manager-app');
    if (savedItems) {
      try {
        const parsedData = JSON.parse(savedItems);
        return parsedData.todoCategories || [];
      } catch (e) {
        console.error('Error parsing todoCategories from localStorage:', e);
        return [];
      }
    }
    return [];
  });
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([]);
  const [bookItems, setBookItems] = useState<BookItem[]>([]);
  const [entertainmentItems, setEntertainmentItems] = useState<EntertainmentItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [podcastItems, setPodcastItems] = useState<PodcastItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>(() => {
    const savedItems = localStorage.getItem('medicationItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [readingCategories, setReadingCategories] = useState<Category[]>([]);
  const [bookCategories, setBookCategories] = useState<Category[]>([]);
  const [videoCategories, setVideoCategories] = useState<Category[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [showTooltip, setShowTooltip] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('react-task-manager-app');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setTemplateTasks(parsedData.templateTasks || []);
        setChecklists(parsedData.checklists || {});
        
        // No need to set todos again as they're loaded in useState initialization
        // No need to set todoCategories again as they're loaded in useState initialization
        
        const upgradeOtherCategories = (categories: any[]) => {
          return categories.map((cat: any) => {
            if (!cat.parentCategory) {
              return {
                ...cat,
                parentCategory: 'default' // Default for other categories
              };
            }
            return cat;
          });
        };
        
        // Handle other categories
        if (parsedData.readingCategories) {
          setReadingCategories(upgradeOtherCategories(parsedData.readingCategories));
        }
        
        if (parsedData.bookCategories) {
          setBookCategories(upgradeOtherCategories(parsedData.bookCategories));
        }
        
        if (parsedData.videoCategories) {
          setVideoCategories(upgradeOtherCategories(parsedData.videoCategories));
        }
        
        // Handle other data
        setReadingItems(parsedData.readingItems || []);
        setBookItems(parsedData.bookItems || []);
        setEntertainmentItems(parsedData.entertainmentItems || []);
        setVideoItems(parsedData.videoItems || []);
        setShoppingItems(parsedData.shoppingItems || []);
        setGroceryItems(parsedData.groceryItems || []);
        setPodcastItems(parsedData.podcastItems || []);
      } else {
        // Use default date format for initial load
        const today = formatDate(new Date());
        
        // Set today as the selected day
        setSelectedDay(today);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // Set today as the selected day
      setSelectedDay(formatDate(new Date()));
    }
  }, []); // Empty dependency array to run only on mount

  // Save data to localStorage when it changes
  useEffect(() => {
    const dataToSave = {
      templateTasks,
      checklists,
      todos,
      todoCategories,
      readingCategories,
      bookCategories,
      videoCategories,
      readingItems,
      bookItems,
      entertainmentItems,
      videoItems,
      shoppingItems,
      groceryItems,
      podcastItems,
    };
    localStorage.setItem('react-task-manager-app', JSON.stringify(dataToSave));
  }, [templateTasks, checklists, todos, todoCategories, readingCategories, bookCategories, videoCategories, readingItems, bookItems, entertainmentItems, videoItems, shoppingItems, groceryItems, podcastItems]);

  // Save medication items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('medicationItems', JSON.stringify(medicationItems));
  }, [medicationItems]);

  const showTemporaryMessage = (message: string) => {
    setShowTooltip(message);
    setTimeout(() => setShowTooltip(''), 3000);
  };

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
    link.download = `task-manager-data-${formatDateOnly(toStorage(new Date()))}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showTemporaryMessage('Backup downloaded');
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
      'entertainmentItems', 'videoItems', 'podcastItems', 'medicationItems', 
      'reminders'
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (validateImportData(parsed)) {
          handleImportData(parsed);
          showTemporaryMessage('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid JSON file or error during parsing.');
        console.error('Import Error:', err);
      }
    };
    reader.readAsText(file);
  };
  
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showTemporaryMessage(successMessage);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleImportText = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importText);
      
      if (validateImportData(parsed)) {
        handleImportData(parsed);
        setIsImportModalOpen(false);
        setImportText('');
        showTemporaryMessage('Data imported successfully!');
      } else {
        setImportError('JSON schema not recognised');
      }
    } catch (err) {
      setImportError('Invalid JSON');
      console.error('Import Error:', err);
    }
  };

  const exportCurrentTasks = () => {
    // Get current date
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    // Get incomplete tasks
    const incompleteTasks = todos.filter(todo => !todo.completed);

    // Get calendar events
    const calendarEvents = listEvents();

    // Process events to include only future events and handle recurring ones efficiently
    const futureEvents = calendarEvents
      .map((event: any) => {
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
      exportedAt: toStorage(new Date()),
      tasks: incompleteTasks,
      categories: activeCategories,
      calendar_events: futureEvents
    };

    copyToClipboard(
      JSON.stringify(data, null, 2),
      "Tasks & calendar copied to clipboard!"
    );
  };
  
  const handleImportData = (data: any) => {
    // Only import todos and merge with existing ones instead of replacing
    if (data.todos) {
      // Merge new todos with existing ones
      setTodos(prevTodos => [...prevTodos, ...data.todos]);
    }
    
    // Handle calendar events if present - already merges by default
    if (data.calendar_events) {
      data.calendar_events.forEach((evt: EventItem) => upsertEvent(evt));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full overflow-x-hidden">
      <div className="transition-all duration-300 ease-in-out w-full px-4">
        <div className="max-w-3xl mx-auto w-full">
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold text-indigo-600">Task Manager</h1>
              <button
                onClick={() => setIsCompactView(!isCompactView)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                title={isCompactView ? "Show labels" : "Compact view"}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row w-full">
                {tabGroups.map((group, groupIndex) => (
                  <div
                    key={group.name}
                    className={`flex-1 ${groupIndex > 0 ? 'sm:border-l' : ''}`}
                  >
                    <div className="pl-4 pr-2 py-2 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                      {group.name}
                    </div>
                    <div className="px-2 pb-2">
                      {group.tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <NavLink
                            key={tab.id}
                            to={`/${tab.id}`}
                            className={({ isActive }) => `w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                              isActive
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!isCompactView && (
                              <span className="ml-3 truncate">{tab.label}</span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* New Data Management Section */}
                <div className="flex-1 sm:border-l">
                  <div className="pl-4 pr-2 py-2 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                    Data
                  </div>
                  <div className="px-2 pb-2">
                    <button
                      onClick={exportCurrentTasks}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center hover:bg-gray-100"
                    >
                      <ClipboardCopy className="w-5 h-5 flex-shrink-0" />
                      {!isCompactView && (
                        <span className="ml-3 truncate">Export Tasks</span>
                      )}
                    </button>

                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center hover:bg-gray-100"
                    >
                      <Database className="w-5 h-5 flex-shrink-0" />
                      {!isCompactView && (
                        <span className="ml-3 truncate">Paste JSON</span>
                      )}
                    </button>

                    <button
                      onClick={downloadData}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center hover:bg-gray-100"
                    >
                      <Download className="w-5 h-5 flex-shrink-0" />
                      {!isCompactView && (
                        <span className="ml-3 truncate">Download Data</span>
                      )}
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center hover:bg-gray-100"
                    >
                      <Upload className="w-5 h-5 flex-shrink-0" />
                      {!isCompactView && (
                        <span className="ml-3 truncate">Upload Data</span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          </header>
          
          <main className="w-full overflow-x-hidden">
            <Routes>
              <Route path="/" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <DailyChecklist
                    templateTasks={templateTasks}
                    checklists={checklists}
                    selectedDay={selectedDay}
                    onUpdateChecklists={setChecklists}
                    onUpdateTemplate={setTemplateTasks}
                    onSelectDay={setSelectedDay}
                  />
                </div>
              } />
              <Route path="/daily" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <DailyChecklist
                    templateTasks={templateTasks}
                    checklists={checklists}
                    selectedDay={selectedDay}
                    onUpdateChecklists={setChecklists}
                    onUpdateTemplate={setTemplateTasks}
                    onSelectDay={setSelectedDay}
                  />
                </div>
              } />
              <Route path="/todos" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <TodoList 
                    todos={todos} 
                    onUpdateTodos={setTodos} 
                    categories={todoCategories}
                    onUpdateCategories={setTodoCategories}
                  />
                </div>
              } />
              <Route path="/calendar" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <CalendarView />
                </div>
              } />
              <Route path="/grocery" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <GroceryList
                    items={groceryItems}
                    onUpdateItems={setGroceryItems}
                  />
                </div>
              } />
              <Route path="/shopping" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <ShoppingList
                    items={shoppingItems}
                    onUpdateItems={setShoppingItems}
                  />
                </div>
              } />
              <Route path="/reading" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <ReadingList 
                    items={readingItems} 
                    onUpdateItems={setReadingItems} 
                    categories={readingCategories}
                    onUpdateCategories={setReadingCategories}
                  />
                </div>
              } />
              <Route path="/books" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <BooksList 
                    items={bookItems} 
                    onUpdateItems={setBookItems} 
                    categories={bookCategories}
                    onUpdateCategories={setBookCategories}
                  />
                </div>
              } />
              <Route path="/entertainment" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <EntertainmentList
                    items={entertainmentItems}
                    onUpdateItems={setEntertainmentItems}
                  />
                </div>
              } />
              <Route path="/videos" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <VideoList 
                    items={videoItems} 
                    onUpdateItems={setVideoItems} 
                    categories={videoCategories}
                    onUpdateCategories={setVideoCategories}
                  />
                </div>
              } />
              <Route path="/podcasts" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <PodcastList
                    items={podcastItems}
                    onUpdateItems={setPodcastItems}
                  />
                </div>
              } />
              <Route path="/medications" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <MedicationList
                    items={medicationItems}
                    onUpdateItems={setMedicationItems}
                  />
                </div>
              } />
            </Routes>

            {showTooltip && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-50 transition-opacity">
                {showTooltip}
              </div>
            )}

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
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">JSON Format Documentation</h4>
                        <button
                          onClick={() => {
                            // Group categories by parent category
                            const workCategories = todoCategories
                              .filter(cat => cat.parentCategory === 'work')
                              .map(cat => `"${cat.name}"`)
                              .join(', ');
                              
                            const personalCategories = todoCategories
                              .filter(cat => cat.parentCategory === 'personal')
                              .map(cat => `"${cat.name}"`)
                              .join(', ');
                              
                            const documentationText = `JSON FORMAT DOCUMENTATION

IMPORTANT: For todos, please use ONLY the existing categories listed below.

To-Do Categories (${todoCategories.length}):
  - Work Categories: ${workCategories || "None defined"}
  - Personal Categories: ${personalCategories || "None defined"}

Tasks (todos):
"todos": [
  {
    "id": 1234567890,
    "text": "Task description",
    "deadline": "YYYY-MM-DD",     // Optional
    "time": "HH:MM",              // Optional
    "completed": false,           // Optional, default: false
    "completedAt": null,          // Optional, set when completed
    "dateAdded": "ISO-timestamp", // Required
    "category": "Category name",  // Optional - MUST match one of the listed categories above
    "parentCategory": "work" | "personal" // Optional - Available options: work, personal
  }
]

Calendar Events:
"calendar_events": [
  {
    "title": "Event name",
    "start_ts": "ISO-timestamp", // Required
    "end_ts": "ISO-timestamp",   // Required
    "notes": "Additional info",  // Optional
    "recurrence": ""             // Optional, format: 'weekly:MO,TU,WE' 
  }
]

Categories:
"todoCategories": [
  // Work categories
  {
    "name": "Work Category 1",
    "color": "#4F46E5",
    "parentCategory": "work"
  },
  {
    "name": "Work Category 2",
    "color": "#0891B2",
    "parentCategory": "work"
  },
  
  // Personal categories
  {
    "name": "Personal Category 1",
    "color": "#059669",
    "parentCategory": "personal"
  },
  {
    "name": "Personal Category 2",
    "color": "#D97706",
    "parentCategory": "personal"
  }
]

Reminders:
"reminders": [
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
]`;
                            copyToClipboard(documentationText, "Documentation copied to clipboard!");
                          }}
                          className="px-2 py-1 bg-gray-200 text-xs text-gray-800 rounded hover:bg-gray-300 flex items-center"
                        >
                          Copy Instructions
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        The JSON data should be an object containing one or more of these arrays. 
                        Please use ONLY the existing to-do categories listed below:
                      </p>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div>
                          <h5 className="font-semibold text-indigo-600">Available Categories</h5>
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            {todoCategories.length > 0 ? (
                              <>
                                <div className="mb-1">
                                  <strong>Work Categories:</strong> {todoCategories
                                    .filter(cat => cat.parentCategory === 'work')
                                    .map(cat => cat.name)
                                    .join(', ') || "None defined"
                                  }
                                </div>
                                <div>
                                  <strong>Personal Categories:</strong> {todoCategories
                                    .filter(cat => cat.parentCategory === 'personal')
                                    .map(cat => cat.name)
                                    .join(', ') || "None defined"
                                  }
                                </div>
                              </>
                            ) : (
                              "No categories defined yet"
                            )}
                          </div>
                        </div>
                      </div>
                      
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
    "category": "Category name",  // Optional - MUST match one of the listed categories above
    "parentCategory": "work" | "personal" // Optional - Available options: work, personal
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
{`"todoCategories": [
  // Work categories
  {
    "name": "Work Category 1",
    "color": "#4F46E5",
    "parentCategory": "work"
  },
  {
    "name": "Work Category 2",
    "color": "#0891B2",
    "parentCategory": "work"
  },
  
  // Personal categories
  {
    "name": "Personal Category 1",
    "color": "#059669",
    "parentCategory": "personal"
  },
  {
    "name": "Personal Category 2",
    "color": "#D97706",
    "parentCategory": "personal"
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
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;