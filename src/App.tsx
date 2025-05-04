import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { Calendar, CheckSquare, Database, ListTodo, Book, Film, ShoppingBag, Apple, LayoutGrid, Video, Headphones, Pill } from 'lucide-react';
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
import CalendarView from './pages/CalendarView';
import { Task, DailyChecklists, Tab, TodoItem, ReadingItem, EntertainmentItem, VideoItem, ShoppingItem, GroceryItem, PodcastItem, DeadlineItem, MedicationItem, ReminderItem } from './types';
import { Category } from './components/CategoryManager';
import { RemindersList } from './components/RemindersList';
import { listReminders, upsertReminder, deleteReminder } from './storage/reminderStore';
import { startReminderService, stopReminderService } from './services/reminderService';

// Group tabs by category
const tabGroups = [
  {
    name: 'Tasks',
    tabs: [
      { id: 'daily', label: 'Daily Habits', icon: CheckSquare },
      { id: 'todos', label: 'To-Do Items', icon: ListTodo },
      { id: 'deadlines', label: 'Deadlines', icon: Calendar },
      { id: 'reminders', label: 'Reminders', icon: CheckSquare },
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
  const [isShowingDemo, setIsShowingDemo] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);
  
  // Start the reminder service when the app loads
  useEffect(() => {
    // Start the reminder service
    startReminderService();
    
    // Clean up when the app unmounts
    return () => {
      stopReminderService();
    };
  }, []);
  
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

  const demoData = {
    templateTasks: [
      { text: "Morning meditation (10 mins)" },
      { text: "Review and prioritize daily tasks" },
      { text: "Check and respond to important emails" },
      { text: "Team standup meeting" },
      { text: "Take a short walk" },
      { text: "Drink 8 glasses of water" },
      { text: "Review progress on key projects" },
      { text: "Evening reflection and planning" }
    ],
    checklists: {
      [formatDate(yesterday)]: [
        { text: "Morning meditation (10 mins)", completed: true },
        { text: "Review and prioritize daily tasks", completed: true },
        { text: "Check and respond to important emails", completed: true },
        { text: "Team standup meeting", completed: true },
        { text: "Take a short walk", completed: false },
        { text: "Drink 8 glasses of water", completed: true },
        { text: "Review progress on key projects", completed: true },
        { text: "Evening reflection and planning", completed: true }
      ],
      [formatDate(today)]: [
        { text: "Morning meditation (10 mins)", completed: true },
        { text: "Review and prioritize daily tasks", completed: true },
        { text: "Check and respond to important emails", completed: false },
        { text: "Team standup meeting", completed: true },
        { text: "Take a short walk", completed: false },
        { text: "Drink 8 glasses of water", completed: false },
        { text: "Review progress on key projects", completed: false },
        { text: "Evening reflection and planning", completed: false }
      ],
      [formatDate(tomorrow)]: [
        { text: "Morning meditation (10 mins)", completed: false },
        { text: "Review and prioritize daily tasks", completed: false },
        { text: "Check and respond to important emails", completed: false },
        { text: "Team standup meeting", completed: false },
        { text: "Take a short walk", completed: false },
        { text: "Drink 8 glasses of water", completed: false },
        { text: "Review progress on key projects", completed: false },
        { text: "Evening reflection and planning", completed: false }
      ]
    },
    todos: [
      {
        id: 1,
        text: "Complete quarterly report",
        deadline: formatDate(tomorrow),
        time: "15:00",
        completed: false,
        completedAt: null,
        dateAdded: formatDate(yesterday),
        category: "Work"
      },
      {
        id: 2,
        text: "Schedule team building event",
        deadline: formatDate(new Date(today.setDate(today.getDate() + 5))),
        time: null,
        completed: false,
        completedAt: null,
        dateAdded: formatDate(yesterday),
        category: "Work"
      },
      {
        id: 3,
        text: "Review project proposals",
        deadline: formatDate(today),
        time: "14:30",
        completed: true,
        completedAt: new Date(today.setHours(today.getHours() - 2)).toISOString(),
        dateAdded: formatDate(yesterday),
        category: "Work"
      },
      {
        id: 4,
        text: "Update documentation",
        deadline: formatDate(new Date(today.setDate(today.getDate() + 2))),
        time: null,
        completed: false,
        completedAt: null,
        dateAdded: formatDate(today)
      },
      {
        id: 5,
        text: "Prepare presentation slides",
        deadline: formatDate(tomorrow),
        time: "11:00",
        completed: false,
        completedAt: null,
        dateAdded: formatDate(today),
        category: "Work"
      },
      {
        id: 6,
        text: "Gym session",
        deadline: formatDate(today),
        time: "18:00",
        completed: false,
        completedAt: null,
        dateAdded: formatDate(today),
        category: "Health"
      },
      {
        id: 7,
        text: "Buy groceries",
        deadline: formatDate(tomorrow),
        time: null,
        completed: false,
        completedAt: null,
        dateAdded: formatDate(today),
        category: "Shopping"
      }
    ],
    todoCategories: [
      { name: "Work", color: "#4F46E5" },
      { name: "Personal", color: "#0891B2" },
      { name: "Shopping", color: "#059669" },
      { name: "Health", color: "#D97706" }
    ],
    readingItems: [
      {
        id: 1,
        title: "The Future of Web Development",
        siteName: "TechCrunch",
        description: "Exploring trends in web development for the next decade.",
        completed: false,
        dateAdded: formatDate(yesterday)
      },
      {
        id: 2,
        title: "Mastering React Hooks",
        siteName: "React Documentation",
        description: "A comprehensive guide to React hooks and their use cases.",
        completed: false,
        dateAdded: formatDate(today)
      }
    ],
    entertainmentItems: [
      {
        id: 1,
        title: "The Matrix Resurrections",
        notes: "New release in theaters",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        title: "Squid Game",
        notes: "Netflix series",
        completed: false,
        dateAdded: formatDate(yesterday)
      }
    ],
    videoItems: [
      {
        id: 1,
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        title: "Advanced TypeScript Patterns",
        thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
        title: "React Performance Optimization",
        thumbnailUrl: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
        completed: false,
        dateAdded: formatDate(yesterday)
      }
    ],
    shoppingItems: [
      {
        id: 1,
        name: "Laundry Detergent",
        quantity: 1,
        category: "household" as "household",
        priority: "high" as "high",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        name: "USB-C Cable",
        quantity: 2,
        category: "electronics" as "electronics",
        priority: "low" as "low",
        notes: "At least 6ft long",
        completed: false,
        dateAdded: formatDate(today)
      }
    ],
    groceryItems: [
      {
        id: 1,
        name: "Fresh Spinach",
        quantity: 2,
        category: "produce" as "produce",
        unit: "bags",
        notes: "Organic preferred",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        name: "Greek Yogurt",
        quantity: 1,
        category: "dairy" as "dairy",
        unit: "32oz tub",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 3,
        name: "Chicken Breast",
        quantity: 2,
        category: "meat" as "meat",
        unit: "lbs",
        notes: "Free-range",
        completed: false,
        dateAdded: formatDate(today)
      }
    ],
    podcastItems: [
      {
        id: 1,
        title: "The Daily Tech News",
        creator: "Tech Media Inc",
        episode: "Latest in AI Development",
        notes: "Interesting discussion on LLMs",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        title: "Code Review",
        creator: "Developer Network",
        episode: "Best Practices in React",
        notes: "Tips for component optimization",
        completed: false,
        dateAdded: formatDate(today)
      }
    ]
  };

  const [templateTasks, setTemplateTasks] = useState<Task[]>([]);
  const [checklists, setChecklists] = useState<DailyChecklists>({});
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoCategories, setTodoCategories] = useState<Category[]>([]);
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([]);
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
  const [reminders, setReminders] = useState<ReminderItem[]>(() => listReminders());

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Load data from localStorage on mount
  useEffect(() => {
    if (!isShowingDemo) {
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
                completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
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
          
          setTodos(upgradedTodos);
          setTodoCategories(parsedData.todoCategories || []);
          setReadingItems(parsedData.readingItems || []);
          setEntertainmentItems(parsedData.entertainmentItems || []);
          setVideoItems(parsedData.videoItems || []);
          setShoppingItems(parsedData.shoppingItems || []);
          setGroceryItems(parsedData.groceryItems || []);
          setPodcastItems(parsedData.podcastItems || []);
          setDeadlines(parsedData.deadlines || []);
        } else {
          setTemplateTasks([]);
          setChecklists({});
          setTodos([]);
          setTodoCategories([]);
          setReadingItems([]);
          setEntertainmentItems([]);
          setVideoItems([]);
          setShoppingItems([]);
          setGroceryItems([]);
          setPodcastItems([]);
          setDeadlines([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setTemplateTasks([]);
        setChecklists({});
        setTodos([]);
        setTodoCategories([]);
        setReadingItems([]);
        setEntertainmentItems([]);
        setVideoItems([]);
        setShoppingItems([]);
        setGroceryItems([]);
        setPodcastItems([]);
        setDeadlines([]);
      }
    } else {
      setTemplateTasks(demoData.templateTasks);
      setChecklists(demoData.checklists);
      setTodos(demoData.todos);
      setTodoCategories(demoData.todoCategories || []);
      setReadingItems(demoData.readingItems);
      setEntertainmentItems(demoData.entertainmentItems);
      setVideoItems(demoData.videoItems);
      setShoppingItems(demoData.shoppingItems);
      setGroceryItems(demoData.groceryItems);
      setPodcastItems(demoData.podcastItems || []);
    }
  }, [isShowingDemo]);

  // Save data to localStorage when it changes (only if not showing demo)
  useEffect(() => {
    if (!isShowingDemo) {
      const dataToSave = {
        templateTasks,
        checklists,
        todos,
        todoCategories,
        readingItems,
        entertainmentItems,
        videoItems,
        shoppingItems,
        groceryItems,
        podcastItems,
        deadlines,
      };
      localStorage.setItem('react-task-manager-app', JSON.stringify(dataToSave));
    }
  }, [isShowingDemo, templateTasks, checklists, todos, todoCategories, readingItems, entertainmentItems, videoItems, shoppingItems, groceryItems, podcastItems, deadlines]);

  // Save medication items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('medicationItems', JSON.stringify(medicationItems));
  }, [medicationItems]);

  // Load reminders from localStorage on mount
  useEffect(() => {
    setReminders(listReminders());
  }, []);

  // Save reminders to localStorage when they change
  useEffect(() => {
    localStorage.setItem('reminders', JSON.stringify(reminders));
  }, [reminders]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
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

          <nav className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row">
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
                        <button
                          key={tab.id}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                            activeTab === tab.id
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setActiveTab(tab.id as Tab)}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isCompactView && (
                            <span className="ml-3">{tab.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={
              <div className={`flex-grow p-4 md:p-8 overflow-auto ${isCompactView ? 'max-h-screen' : ''}`}>
                {activeTab === 'daily' && (
                  <DailyChecklist
                    templateTasks={templateTasks}
                    checklists={checklists}
                    selectedDay={selectedDay}
                    onUpdateChecklists={setChecklists}
                    onUpdateTemplate={setTemplateTasks}
                    onSelectDay={setSelectedDay}
                  />
                )}
                {activeTab === 'todos' && (
                  <TodoList 
                    todos={todos} 
                    onUpdateTodos={setTodos} 
                    categories={todoCategories}
                    onUpdateCategories={setTodoCategories}
                  />
                )}
                {activeTab === 'calendar' && (
                  <CalendarView />
                )}
                {activeTab === 'grocery' && (
                  <GroceryList
                    items={groceryItems}
                    onUpdateItems={setGroceryItems}
                  />
                )}
                {activeTab === 'shopping' && (
                  <ShoppingList
                    items={shoppingItems}
                    onUpdateItems={setShoppingItems}
                  />
                )}
                {activeTab === 'reading' && (
                  <ReadingList
                    items={readingItems}
                    onUpdateItems={setReadingItems}
                  />
                )}
                {activeTab === 'entertainment' && (
                  <EntertainmentList
                    items={entertainmentItems}
                    onUpdateItems={setEntertainmentItems}
                  />
                )}
                {activeTab === 'videos' && (
                  <VideoList
                    items={videoItems}
                    onUpdateItems={setVideoItems}
                  />
                )}
                {activeTab === 'podcasts' && (
                  <PodcastList
                    items={podcastItems}
                    onUpdateItems={setPodcastItems}
                  />
                )}
                {activeTab === 'deadlines' && (
                  <DeadlineTimeline deadlines={deadlines} onUpdate={setDeadlines} />
                )}
                {activeTab === 'medications' && (
                  <MedicationList
                    items={medicationItems}
                    onUpdateItems={setMedicationItems}
                  />
                )}
                {activeTab === 'reminders' && (
                  <RemindersList
                    reminders={reminders}
                    onUpdateReminders={setReminders}
                  />
                )}
                {activeTab === 'data' && (
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
                      if (data.entertainmentItems) setEntertainmentItems(data.entertainmentItems);
                      if (data.videoItems) setVideoItems(data.videoItems);
                      if (data.shoppingItems) setShoppingItems(data.shoppingItems);
                      if (data.groceryItems) setGroceryItems(data.groceryItems);
                      if (data.podcastItems) setPodcastItems(data.podcastItems);
                      if (data.todoCategories) setTodoCategories(data.todoCategories);
                    }}
                    onResetApp={() => {
                      if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
                        setTemplateTasks([]);
                        setChecklists({});
                        setTodos([]);
                        setTodoCategories([]);
                        setReadingItems([]);
                        setEntertainmentItems([]);
                        setVideoItems([]);
                        setShoppingItems([]);
                        setGroceryItems([]);
                        setPodcastItems([]);
                        setDeadlines([]);
                        setMedicationItems([]);
                        localStorage.removeItem('react-task-manager-app');
                        localStorage.removeItem('medications');
                      }
                    }}
                    isShowingDemo={isShowingDemo}
                    onLoadDemo={() => setIsShowingDemo(true)}
                    onClearDemo={() => setIsShowingDemo(false)}
                  />
                )}
              </div>
            } />
            <Route 
              path="/medications" 
              element={
                <MedicationList 
                  items={medicationItems}
                  onUpdateItems={setMedicationItems}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;