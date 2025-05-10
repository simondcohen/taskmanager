import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Calendar, CheckSquare, Database, ListTodo, Book, Film, ShoppingBag, Apple, LayoutGrid, Video, Headphones, Pill, BookOpen } from 'lucide-react';
import { DailyChecklist } from './components/DailyChecklist';
import { TodoList } from './components/TodoList';
import { DataManagement } from './components/DataManagement';
import { ReadingList } from './components/ReadingList';
import { EntertainmentList } from './components/EntertainmentList';
import { VideoList } from './components/VideoList';
import { ShoppingList } from './components/ShoppingList';
import { GroceryList } from './components/GroceryList';
import { PodcastList } from './components/PodcastList';
import { DeadlineTimeline } from './components/DeadlineTimeline';
import { MedicationList } from './components/MedicationList';
import { BooksList } from './components/BooksList';
import CalendarView from './pages/CalendarView';
import { Task, DailyChecklists, Tab, TodoItem, ReadingItem, EntertainmentItem, VideoItem, ShoppingItem, GroceryItem, PodcastItem, DeadlineItem, MedicationItem, BookItem } from './types';
import { Category } from './components/CategoryManager';
import { toStorage, fromStorage } from './utils/time';

// Group tabs by category
const tabGroups = [
  {
    name: 'Tasks',
    tabs: [
      { id: 'daily', label: 'Daily Habits', icon: CheckSquare },
      { id: 'todos', label: 'To-Do Items', icon: ListTodo },
      { id: 'deadlines', label: 'Deadlines', icon: Calendar },
      { id: 'medications', label: 'Medications', icon: Pill },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
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
  {
    name: 'System',
    tabs: [
      { id: 'data', label: 'Data Management', icon: Database },
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
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoCategories, setTodoCategories] = useState<Category[]>([]);
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([]);
  const [bookItems, setBookItems] = useState<BookItem[]>([]);
  const [entertainmentItems, setEntertainmentItems] = useState<EntertainmentItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [podcastItems, setPodcastItems] = useState<PodcastItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>(() => {
    const savedItems = localStorage.getItem('medicationItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [readingCategories, setReadingCategories] = useState<Category[]>([]);
  const [bookCategories, setBookCategories] = useState<Category[]>([]);
  const [videoCategories, setVideoCategories] = useState<Category[]>([]);

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
        
        // Handle the case where we're upgrading from a version without completedAt
        const existingTodos = parsedData.todos || [];
        const upgradedTodos = existingTodos.map((todo: any) => {
          // If a todo is completed but doesn't have completedAt, add it
          if (todo.completed && !todo.completedAt) {
            return {
              ...todo,
              // Use a timestamp from half an hour ago to prevent immediate hiding
              completedAt: toStorage(new Date(Date.now() - 30 * 60 * 1000))
            };
          }
          // Otherwise just ensure the completedAt field exists
          if (!('completedAt' in todo)) {
            return {
              ...todo,
              completedAt: null
            };
          }
          return todo;
        });
        
        // Update categories to have parentCategory if needed
        const existingCategories = parsedData.todoCategories || [];
        const upgradedCategories = existingCategories.map((cat: any) => {
          if (!cat.parentCategory) {
            return {
              ...cat,
              parentCategory: 'work' // Default to 'work' for existing categories
            };
          }
          return cat;
        });
        
        setTodos(upgradedTodos);
        setTodoCategories(upgradedCategories);
        
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
        setDeadlines(parsedData.deadlines || []);
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
      deadlines,
    };
    localStorage.setItem('react-task-manager-app', JSON.stringify(dataToSave));
  }, [templateTasks, checklists, todos, todoCategories, readingCategories, bookCategories, videoCategories, readingItems, bookItems, entertainmentItems, videoItems, shoppingItems, groceryItems, podcastItems, deadlines]);

  // Save medication items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('medicationItems', JSON.stringify(medicationItems));
  }, [medicationItems]);

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
              <Route path="/deadlines" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <DeadlineTimeline deadlines={deadlines} onUpdate={setDeadlines} />
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
              <Route path="/data" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <DataManagement
                    templateTasks={templateTasks}
                    checklists={checklists}
                    todos={todos}
                    groceryItems={groceryItems}
                    shoppingItems={shoppingItems}
                    readingItems={readingItems}
                    entertainmentItems={entertainmentItems}
                    videoItems={videoItems}
                    podcastItems={podcastItems}
                    deadlines={deadlines}
                    medicationItems={medicationItems}
                    bookItems={bookItems}
                    todoCategories={todoCategories}
                    readingCategories={readingCategories}
                    bookCategories={bookCategories}
                    videoCategories={videoCategories}
                    selectedDay={selectedDay}
                    onImportData={data => {
                      if (data.todos) {
                        setTodos(prev => {
                          const map = new Map(prev.map(t => [t.id, { ...t }]));
                          data.todos.forEach(nt => {
                            if (map.has(nt.id)) map.set(nt.id, { ...map.get(nt.id), ...nt });
                            else map.set(nt.id, nt);
                          });
                          return Array.from(map.values());
                        });
                      }

                      if (data.deadlines) {
                        setDeadlines(prev => {
                          const map = new Map(prev.map(d => [d.id, { ...d }]));
                          (data.deadlines || []).forEach((nd: DeadlineItem) => {
                            if (map.has(nd.id)) map.set(nd.id, { ...map.get(nd.id), ...nd });
                            else map.set(nd.id, nd);
                          });
                          return Array.from(map.values());
                        });
                      }

                      if (data.templateTasks) setTemplateTasks(data.templateTasks);
                      if (data.checklists) setChecklists(data.checklists);
                      if (data.medicationItems) setMedicationItems(data.medicationItems);
                      if (data.readingItems) setReadingItems(data.readingItems);
                      if (data.bookItems) setBookItems(data.bookItems);
                      if (data.entertainmentItems) setEntertainmentItems(data.entertainmentItems);
                      if (data.videoItems) setVideoItems(data.videoItems);
                      if (data.shoppingItems) setShoppingItems(data.shoppingItems);
                      if (data.groceryItems) setGroceryItems(data.groceryItems);
                      if (data.podcastItems) setPodcastItems(data.podcastItems);
                      
                      // Handle category imports
                      if (data.todoCategories) setTodoCategories(data.todoCategories);
                      if (data.readingCategories) setReadingCategories(data.readingCategories);
                      if (data.bookCategories) setBookCategories(data.bookCategories);
                      if (data.videoCategories) setVideoCategories(data.videoCategories);
                    }}
                    onResetApp={() => {
                      if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
                        setTemplateTasks([]);
                        setChecklists({});
                        setTodos([]);
                        setTodoCategories([]);
                        setReadingCategories([]);
                        setBookCategories([]);
                        setVideoCategories([]);
                        setReadingItems([]);
                        setBookItems([]);
                        setEntertainmentItems([]);
                        setVideoItems([]);
                        setShoppingItems([]);
                        setGroceryItems([]);
                        setPodcastItems([]);
                        setDeadlines([]);
                        setMedicationItems([]);
                        localStorage.removeItem('react-task-manager-app');
                        localStorage.removeItem('medications');
                        localStorage.removeItem('reminders');
                      }
                    }}
                    isShowingDemo={false}
                    onLoadDemo={() => {}}
                    onClearDemo={() => {}}
                  />
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;