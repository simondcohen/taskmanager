import React, { useState } from 'react';
import { Task, TodoItem, GroceryItem, ShoppingItem, ReadingItem, EntertainmentItem, VideoItem, PodcastItem, DeadlineItem } from '../types';
import { X } from 'lucide-react';

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
  selectedDay: string;
  onImportData: (data: { templateTasks: Task[]; checklists: { [date: string]: Task[] }; todos: TodoItem[] }) => void;
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
  selectedDay,
  onImportData,
  onResetApp,
  onLoadDemo,
  onClearDemo,
  isShowingDemo
}: DataManagementProps) {
  const [exportMessage, setExportMessage] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');

  const downloadData = () => {
    const dataToExport = {
      templateTasks,
      checklists,
      todos
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

    if (!isValid) {
      alert('Invalid: No recognizable sections found.');
      return false;
    }

    return true;
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

  const exportTodayAndTodos = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const data = {
      exportedAt: now.toISOString(),
      date: today,
      checklist: checklists[today] || [],
      todos: todos.filter(todo => !todo.completed)
    };

    copyToClipboard(
      JSON.stringify(data, null, 2),
      "Today's snapshot copied!"
    );
  };

  const exportTodayTodosAndLists = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const data = {
      exportedAt: now.toISOString(),
      date: today,
      checklist: checklists[today] || [],
      todos: todos.filter(todo => !todo.completed),
      lists: {
        grocery: groceryItems,
        shopping: shoppingItems,
        reading: readingItems,
        entertainment: entertainmentItems,
        videos: videoItems,
        podcasts: podcastItems,
        deadlines: deadlines || []
      }
    };

    copyToClipboard(
      JSON.stringify(data, null, 2),
      "Complete snapshot copied!"
    );
  };

  const handleImportFromChatGPT = () => {
    try {
      const data = JSON.parse(importText);
      let updated = false;

      // Helper function to merge items
      const mergeItems = <T extends { id: number }>(
        existingItems: T[],
        newItems: T[]
      ): T[] => {
        const merged = [...existingItems];
        newItems.forEach(newItem => {
          const index = merged.findIndex(item => item.id === newItem.id);
          if (index >= 0) {
            merged[index] = newItem;
          } else {
            merged.push(newItem);
          }
        });
        return merged;
      };

      // Process each recognized key
      if (Array.isArray(data.todos)) {
        updated = true;
        const newTodos = mergeItems(todos, data.todos);
        onImportData({ 
          templateTasks: templateTasks, 
          checklists: checklists, 
          todos: newTodos 
        });
      }

      if (Array.isArray(data.grocery)) {
        updated = true;
        const newGrocery = mergeItems(groceryItems, data.grocery);
        // Update groceryItems state
      }

      if (Array.isArray(data.shopping)) {
        updated = true;
        const newShopping = mergeItems(shoppingItems, data.shopping);
        // Update shoppingItems state
      }

      if (Array.isArray(data.reading)) {
        updated = true;
        const newReading = mergeItems(readingItems, data.reading);
        // Update readingItems state
      }

      if (Array.isArray(data.entertainment)) {
        updated = true;
        const newEntertainment = mergeItems(entertainmentItems, data.entertainment);
        // Update entertainmentItems state
      }

      if (Array.isArray(data.videos)) {
        updated = true;
        const newVideos = mergeItems(videoItems, data.videos);
        // Update videoItems state
      }

      if (Array.isArray(data.podcasts)) {
        updated = true;
        const newPodcasts = mergeItems(podcastItems, data.podcasts);
        // Update podcastItems state
      }

      if (updated) {
        setImportSuccess('Data imported successfully!');
        setTimeout(() => {
          setImportSuccess('');
          setShowImportModal(false);
          setImportText('');
        }, 2000);
      } else {
        setImportError('No recognized data found to import.');
      }
    } catch (err) {
      setImportError('Invalid JSON format. Please check your input.');
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Data Management</h2>

      <div className="space-y-8">
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Export Snapshots</h3>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Import from ChatGPT
            </button>

            <div className="flex gap-4">
              <button
                onClick={exportTodayAndTodos}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Export Today + Todos
              </button>
              <button
                onClick={exportTodayTodosAndLists}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Export Today + Todos + Lists
              </button>
            </div>

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
          {exportMessage && (
            <div className="mt-2 text-sm text-green-600 font-medium">
              {exportMessage}
            </div>
          )}
        </div>
      </div>

      {/* Import from ChatGPT Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Import from ChatGPT</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <textarea
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportError('');
                      setImportSuccess('');
                    }}
                    placeholder="Paste JSON here..."
                    className="w-full h-96 p-4 border rounded font-mono text-sm"
                  />
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={handleImportFromChatGPT}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Import
                    </button>
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                  {importError && (
                    <div className="mt-2 text-sm text-red-600">
                      {importError}
                    </div>
                  )}
                  {importSuccess && (
                    <div className="mt-2 text-sm text-green-600">
                      {importSuccess}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium text-gray-900 mb-2">Format Instructions</h4>
                  <div className="prose prose-sm">
                    <p>Paste JSON in this shape. Include one or more of these keys; leave out anything you don't want to change.</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "todos":       [ /* TodoItem[] */ ],
  "grocery":     [ /* GroceryItem[] */ ],
  "shopping":    [ /* ShoppingItem[] */ ],
  "reading":     [ /* ReadingItem[] */ ],
  "entertainment":[ /* EntertainmentItem[] */ ],
  "videos":      [ /* VideoItem[] */ ],
  "podcasts":    [ /* PodcastItem[] */ ]
}`}
                    </pre>
                    <h5 className="font-medium mt-4">Required fields for each list</h5>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`TodoItem { id:number, text:string, deadline:string, time:string|null, completed:boolean, dateAdded:string }

GroceryItem { id, name, quantity, category:'produce|dairy|meat|pantry|frozen|beverages|snacks|other', unit?, notes?, completed, dateAdded }

ShoppingItem { id, name, quantity, category:'household|electronics|clothing|other', priority:'low|medium|high', notes?, completed, dateAdded }

ReadingItem { id, title, notes?, completed, dateAdded }

EntertainmentItem { id, title, notes?, completed, dateAdded }

VideoItem { id, title, notes?, completed, dateAdded }

PodcastItem { id, title, creator?, episode?, notes?, completed, dateAdded }`}
                    </pre>
                    <p className="text-sm text-gray-600 mt-4">
                      Notes:
                      <br />• Dates should be ISO strings (e.g. "2025-04-18").
                      <br />• Items with completed:true are allowed but will import as completed.
                      <br />• Keys not listed above are ignored.
                    </p>
                  </div>
                </div>
              </div>
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