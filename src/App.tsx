import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Database, ListTodo, Book, Film, ShoppingBag, Apple, LayoutGrid, Video, StickyNote } from 'lucide-react';
import { DailyChecklist } from './components/DailyChecklist';
import { DailyNotes } from './components/DailyNotes';
import { TodoList } from './components/TodoList';
import { DataManagement } from './components/DataManagement';
import { ReadingList } from './components/ReadingList';
import { EntertainmentList } from './components/EntertainmentList';
import { VideoList } from './components/VideoList';
import { ShoppingList } from './components/ShoppingList';
import { GroceryList } from './components/GroceryList';
import { Task, DailyChecklists, Tab, TodoItem, ReadingItem, EntertainmentItem, VideoItem, ShoppingItem, GroceryItem, DailyNote } from './types';

// Group tabs by category
const tabGroups = [
  {
    name: 'Tasks',
    tabs: [
      { id: 'daily', label: 'Daily Checklists', icon: CheckSquare },
      { id: 'todos', label: 'To-Do Items', icon: ListTodo },
      { id: 'notes', label: 'Daily Notes', icon: StickyNote },
    ],
  },
  {
    name: 'Lists',
    tabs: [
      { id: 'grocery', label: 'Grocery List', icon: Apple },
      { id: 'shopping', label: 'Shopping List', icon: ShoppingBag },
      { id: 'reading', label: 'Reading List', icon: Book },
      { id: 'entertainment', label: 'Movies & TV', icon: Film },
      { id: 'videos', label: 'Videos', icon: Video },
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
    notes: {
      [formatDate(yesterday)]: [
        {
          id: 1,
          content: "Had a productive meeting with the design team. Key decisions made about the new UI components.",
          createdAt: new Date(yesterday).toISOString()
        }
      ],
      [formatDate(today)]: [
        {
          id: 2,
          content: "Remember to follow up with John about the project timeline.",
          createdAt: new Date(today).toISOString()
        },
        {
          id: 3,
          content: "Ideas for the upcoming presentation:\n- Focus on Q1 results\n- Highlight team achievements\n- Discuss future roadmap",
          createdAt: new Date(today).toISOString()
        }
      ]
    },
    todos: [
      {
        id: 1,
        text: "Complete quarterly report",
        deadline: formatDate(tomorrow),
        time: "15:00",
        completed: false,
        dateAdded: formatDate(yesterday)
      },
      {
        id: 2,
        text: "Schedule team building event",
        deadline: formatDate(new Date(today.setDate(today.getDate() + 5))),
        time: null,
        completed: false,
        dateAdded: formatDate(yesterday)
      },
      {
        id: 3,
        text: "Review project proposals",
        deadline: formatDate(today),
        time: "14:30",
        completed: true,
        dateAdded: formatDate(yesterday)
      },
      {
        id: 4,
        text: "Update documentation",
        deadline: formatDate(new Date(today.setDate(today.getDate() + 2))),
        time: null,
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 5,
        text: "Prepare presentation slides",
        deadline: formatDate(tomorrow),
        time: "11:00",
        completed: false,
        dateAdded: formatDate(today)
      }
    ],
    readingItems: [
      {
        id: 1,
        title: "The Pragmatic Programmer",
        author: "David Thomas, Andrew Hunt",
        type: "book",
        notes: "Recommended by tech lead",
        completed: false,
        dateAdded: formatDate(yesterday)
      },
      {
        id: 2,
        title: "Understanding ECMAScript 6",
        author: "Nicholas C. Zakas",
        type: "book",
        url: "https://leanpub.com/understandinges6",
        completed: true,
        dateAdded: formatDate(yesterday)
      },
      {
        id: 3,
        title: "Introducing WebAssembly",
        author: "Brian Sletten",
        type: "article",
        url: "https://example.com/webassembly-intro",
        completed: false,
        dateAdded: formatDate(today)
      }
    ],
    entertainmentItems: [
      {
        id: 1,
        title: "The Social Dilemma",
        type: "movie",
        platform: "Netflix",
        duration: "1h 34m",
        notes: "Documentary about social media",
        completed: true,
        dateAdded: formatDate(yesterday)
      },
      {
        id: 2,
        title: "Mr. Robot",
        type: "series",
        platform: "Prime Video",
        duration: "4 seasons",
        notes: "Cybersecurity thriller",
        completed: false,
        dateAdded: formatDate(today)
      }
    ],
    videoItems: [
      {
        id: 1,
        title: "System Design Fundamentals",
        platform: "YouTube",
        duration: "45m",
        url: "https://example.com/system-design",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        title: "Advanced TypeScript Tips",
        platform: "YouTube",
        duration: "25m",
        url: "https://example.com/typescript-tips",
        completed: false,
        dateAdded: formatDate(today)
      }
    ],
    shoppingItems: [
      {
        id: 1,
        name: "Laundry Detergent",
        quantity: 1,
        category: "household",
        priority: "high",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        name: "USB-C Cable",
        quantity: 2,
        category: "electronics",
        priority: "low",
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
        category: "produce",
        unit: "bags",
        notes: "Organic preferred",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 2,
        name: "Greek Yogurt",
        quantity: 1,
        category: "dairy",
        unit: "32oz tub",
        completed: false,
        dateAdded: formatDate(today)
      },
      {
        id: 3,
        name: "Chicken Breast",
        quantity: 2,
        category: "meat",
        unit: "lbs",
        notes: "Free-range",
        completed: false,
        dateAdded: formatDate(today)
      }
    ]
  };

  const [templateTasks, setTemplateTasks] = useState<Task[]>([]);
  const [checklists, setChecklists] = useState<DailyChecklists>({});
  const [notes, setNotes] = useState<{ [date: string]: DailyNote[] }>({});
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([]);
  const [entertainmentItems, setEntertainmentItems] = useState<EntertainmentItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));

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
          setNotes(parsedData.notes || {});
          setTodos(parsedData.todos || []);
          setReadingItems(parsedData.readingItems || []);
          setEntertainmentItems(parsedData.entertainmentItems || []);
          setVideoItems(parsedData.videoItems || []);
          setShoppingItems(parsedData.shoppingItems || []);
          setGroceryItems(parsedData.groceryItems || []);
        } else {
          setTemplateTasks([]);
          setChecklists({});
          setNotes({});
          setTodos([]);
          setReadingItems([]);
          setEntertainmentItems([]);
          setVideoItems([]);
          setShoppingItems([]);
          setGroceryItems([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setTemplateTasks([]);
        setChecklists({});
        setNotes({});
        setTodos([]);
        setReadingItems([]);
        setEntertainmentItems([]);
        setVideoItems([]);
        setShoppingItems([]);
        setGroceryItems([]);
      }
    } else {
      setTemplateTasks(demoData.templateTasks);
      setChecklists(demoData.checklists);
      setNotes(demoData.notes);
      setTodos(demoData.todos);
      setReadingItems(demoData.readingItems);
      setEntertainmentItems(demoData.entertainmentItems);
      setVideoItems(demoData.videoItems);
      setShoppingItems(demoData.shoppingItems);
      setGroceryItems(demoData.groceryItems);
    }
  }, [isShowingDemo]);

  // Save data to localStorage when it changes (only if not showing demo)
  useEffect(() => {
    if (!isShowingDemo) {
      const dataToSave = {
        templateTasks,
        checklists,
        notes,
        todos,
        readingItems,
        entertainmentItems,
        videoItems,
        shoppingItems,
        groceryItems
      };
      localStorage.setItem('react-task-manager-app', JSON.stringify(dataToSave));
    }
  }, [templateTasks, checklists, notes, todos, readingItems, entertainmentItems, videoItems, shoppingItems, groceryItems, isShowingDemo]);

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
                  className={`flex-1 ${
                    groupIndex !== 0 ? 'sm:border-l border-gray-200' : ''
                  }`}
                >
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-600">
                    {group.name}
                  </div>
                  <div className="p-2">
                    {group.tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as Tab)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors
                            ${activeTab === tab.id
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                            }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          {!isCompactView && (
                            <span className="truncate">{tab.label}</span>
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

        {activeTab === 'notes' && (
          <DailyNotes
            notes={notes}
            selectedDay={selectedDay}
            onUpdateNotes={setNotes}
            onSelectDay={setSelectedDay}
          />
        )}

        {activeTab === 'todos' && (
          <TodoList
            todos={todos}
            onUpdateTodos={setTodos}
          />
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
            selectedDay={selectedDay}
            onImportData={(data) => {
              setTemplateTasks(data.templateTasks || []);
              setChecklists(data.checklists || {});
              setTodos(data.todos || []);
            }}
          />
        )}

        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => setIsShowingDemo(true)}
            className={`px-4 py-2 rounded transition-colors ${
              isShowingDemo
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            disabled={isShowingDemo}
          >
            Show Demo Data
          </button>
          <button
            onClick={() => setIsShowingDemo(false)}
            className={`px-4 py-2 rounded transition-colors ${
              !isShowingDemo
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            disabled={!isShowingDemo}
          >
            Hide Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;