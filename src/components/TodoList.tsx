import React, { useState } from 'react';
import { Edit2, X, Plus, Filter, Settings, Clock, Upload } from 'lucide-react';
import { TodoItem } from '../types';
import { CategoryManager, Category } from './CategoryManager';

interface TodoListProps {
  todos: TodoItem[];
  onUpdateTodos: (newTodos: TodoItem[]) => void;
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
}

export function TodoList({ todos, onUpdateTodos, categories, onUpdateCategories }: TodoListProps) {
  const [todoStatusFilter, setTodoStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [todoSortOption, setTodoSortOption] = useState<'deadline' | 'deadline-reverse' | 'added' | 'alphabetical' | 'category'>('deadline');
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all']);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDeadline, setNewTodoDeadline] = useState(getCurrentDate());
  const [newTodoTime, setNewTodoTime] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editText, setEditText] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoHideCompleted, setAutoHideCompleted] = useState(true);
  const [hideAfterHours, setHideAfterHours] = useState(24);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');

  function getCurrentDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getTodayAtMidnight() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function parseLocalDate(dateStr: string | null) {
    if (!dateStr) return null;
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      // Check if we have valid date components
      if (!year || !month || !day || 
          isNaN(year) || isNaN(month) || isNaN(day) || 
          month < 1 || month > 12 || day < 1 || day > 31) {
        console.error('Invalid date components:', { year, month, day });
        return null;
      }
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    } catch (err) {
      console.error('Error parsing date:', dateStr, err);
      return null;
    }
  }

  function formatTimeDisplay(timeStr: string) {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return timeStr;
    }
  }

  function isPastDeadline(todo: TodoItem) {
    if (!todo.deadline) return false;
    const today = getTodayAtMidnight();
    const deadlineDate = parseLocalDate(todo.deadline);
    if (!deadlineDate) return false;
    return deadlineDate < today;
  }

  function isDueToday(todo: TodoItem) {
    if (!todo.deadline) return false;
    const today = getTodayAtMidnight();
    const deadlineDate = parseLocalDate(todo.deadline);
    if (!deadlineDate) return false;
    return deadlineDate.getTime() === today.getTime();
  }

  function isUrgent(todo: TodoItem) {
    const days = getDaysUntilDeadline(todo);
    return days !== null && days >= 0 && days <= 3;
  }

  function getDaysUntilDeadline(todo: TodoItem) {
    if (!todo.deadline) return null;
    const today = getTodayAtMidnight();
    const deadlineDate = parseLocalDate(todo.deadline);
    if (!deadlineDate) return null;
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Helper function to get category color
  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : '';
  };

  // Function to check if a completed todo should be hidden based on completion time
  function shouldHideCompletedTodo(todo: TodoItem): boolean {
    if (!todo.completed || !todo.completedAt || !autoHideCompleted) {
      return false;
    }

    // We've validated completedAt is not null above
    const completedTime = new Date(todo.completedAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceCompletion = (currentTime - completedTime) / (1000 * 60 * 60);
    
    return hoursSinceCompletion >= hideAfterHours;
  }

  const filteredTodos = todos
    .filter(todo => {
      // First check if completed todos should be hidden
      if (shouldHideCompletedTodo(todo)) {
        return false;
      }
      
      // Then apply status filter
      if (todoStatusFilter === 'active' && todo.completed) return false;
      if (todoStatusFilter === 'completed' && !todo.completed) return false;
      
      // Then apply category filter if needed
      if (!categoryFilter.includes('all') && todo.category && !categoryFilter.includes(todo.category)) return false;
      
      return true;
    })
    .sort((a, b) => {
      // First sort by completion status - uncompleted tasks first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // Completed items go to the bottom
      }
      
      // Then apply the selected sort option
      if (todoSortOption === 'category') {
        // First sort by category
        const catA = a.category || '';
        const catB = b.category || '';
        const catComparison = catA.localeCompare(catB);
        
        // If categories are the same, sort by deadline
        if (catComparison === 0) {
          const dateA = parseLocalDate(a.deadline);
          const dateB = parseLocalDate(b.deadline);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateA.getTime() - dateB.getTime();
        }
        
        return catComparison;
      }
      
      if (todoSortOption === 'deadline') {
        const dateA = parseLocalDate(a.deadline);
        const dateB = parseLocalDate(b.deadline);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // Null dates go to the end
        if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
      }
      if (todoSortOption === 'deadline-reverse') {
        const dateA = parseLocalDate(a.deadline);
        const dateB = parseLocalDate(b.deadline);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1; // Null dates go to the end
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      }
      if (todoSortOption === 'alphabetical') {
        return a.text.localeCompare(b.text);
      }
      return b.id - a.id; // 'added' sort option, most recent first
    });

  function addTodo() {
    if (!newTodoText.trim()) {
      alert('Description is required.');
      return;
    }
    
    const newTodo: TodoItem = {
      id: Date.now(),
      text: newTodoText.trim(),
      deadline: newTodoDeadline || null,
      time: newTodoTime || null,
      completed: false,
      completedAt: null,
      dateAdded: new Date().toISOString(),
      category: newTodoCategory || undefined
    };
    
    onUpdateTodos([...todos, newTodo]);
    setNewTodoText('');
    setNewTodoTime('');
    // Keep the deadline as the current date
    // Keep the last used category for convenience
  }

  function saveEdit() {
    if (!editText.trim()) {
      alert('Description is required.');
      return;
    }
    
    const newTodos = [...todos];
    const todoToEdit = filteredTodos[editIndex];
    const originalIndex = newTodos.findIndex(t => t.id === todoToEdit.id);
    if (originalIndex !== -1) {
      newTodos[originalIndex] = {
        ...todoToEdit,
        text: editText.trim(),
        deadline: editDeadline || null,
        time: editTime || null,
        category: editCategory || undefined
      };
      onUpdateTodos(newTodos);
    } else {
      console.error('Could not find todo with ID:', todoToEdit.id);
    }
    setEditIndex(-1);
  }

  // Function to handle multiple category selection
  const handleCategoryFilterChange = (categoryName: string) => {
    // If 'all' is clicked, reset to just 'all'
    if (categoryName === 'all') {
      setCategoryFilter(['all']);
      return;
    }

    // Remove 'all' when selecting specific categories
    const newFilter = categoryFilter.filter(cat => cat !== 'all');
    
    // Toggle the selected category
    if (newFilter.includes(categoryName)) {
      // Remove the category if already selected
      const updatedFilter = newFilter.filter(cat => cat !== categoryName);
      // If no categories selected, default back to 'all'
      setCategoryFilter(updatedFilter.length ? updatedFilter : ['all']);
    } else {
      // Add the category
      setCategoryFilter([...newFilter, categoryName]);
    }
  };

  // Add this function to handle toggling completion status
  function toggleTaskCompletion(todo: TodoItem) {
    const newTodos = [...todos];
    const originalIndex = newTodos.findIndex(t => t.id === todo.id);
    
    if (originalIndex !== -1) {
      const nowCompleted = !todo.completed;
      newTodos[originalIndex] = {
        ...todo,
        completed: nowCompleted,
        completedAt: nowCompleted ? new Date().toISOString() : null
      };
      onUpdateTodos(newTodos);
    } else {
      console.error('Could not find todo with ID:', todo.id);
    }
  }

  // Import JSON functionality
  function handleImportJson() {
    if (!importJson.trim()) {
      alert('Please enter valid JSON data.');
      return;
    }

    try {
      const importedData = JSON.parse(importJson);
      
      // Validate the imported data
      if (!Array.isArray(importedData)) {
        throw new Error('Imported data must be an array of todo items');
      }
      
      // Validate each todo item and assign new IDs to avoid conflicts
      const validatedTodos: TodoItem[] = importedData.map(item => {
        if (typeof item !== 'object' || item === null) {
          throw new Error('Each item must be an object');
        }
        
        if (typeof item.text !== 'string' || !item.text.trim()) {
          throw new Error('Each item must have a valid text property');
        }
        
        // Create a new todo with required fields and current timestamp
        const newTodo: TodoItem = {
          id: Date.now() + Math.floor(Math.random() * 1000), // Generate a unique ID
          text: item.text,
          deadline: typeof item.deadline === 'string' ? item.deadline : null,
          time: typeof item.time === 'string' ? item.time : null,
          completed: typeof item.completed === 'boolean' ? item.completed : false,
          completedAt: item.completed && item.completedAt ? item.completedAt : null,
          dateAdded: new Date().toISOString(),
          category: typeof item.category === 'string' ? item.category : undefined
        };
        
        return newTodo;
      });
      
      // Merge with existing todos
      const mergedTodos = [...todos, ...validatedTodos];
      onUpdateTodos(mergedTodos);
      
      // Close the dialog and reset the input
      setShowImportDialog(false);
      setImportJson('');
      
      alert(`Successfully imported ${validatedTodos.length} todo items.`);
    } catch (error) {
      alert(`Error importing data: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">To-Do Items</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded"
            title="Import todos from JSON"
          >
            <Upload size={16} />
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-200 px-3 py-2 rounded"
            title="Filter todos"
          >
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-200 px-3 py-2 rounded"
            title="Settings"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>
      
      {/* New ToDo Form - Now at the top, more prominent */}
      <div className="bg-indigo-50 rounded-lg p-4 mb-6 shadow-sm">
        <h3 className="font-medium text-indigo-800 mb-3">Add New To-Do</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="col-span-1 md:col-span-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <div className="flex items-center mb-1">
              <label className="text-xs text-indigo-700 font-medium">Due Date (Optional)</label>
            </div>
            <input
              type="date"
              value={newTodoDeadline}
              onChange={(e) => setNewTodoDeadline(e.target.value)}
              min={getCurrentDate()}
              className="w-full p-2 border border-indigo-200 rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center mb-1">
              <label className="text-xs text-indigo-700 font-medium">Time (Optional)</label>
            </div>
            <input
              type="time"
              value={newTodoTime}
              onChange={(e) => setNewTodoTime(e.target.value)}
              className="w-full p-2 border border-indigo-200 rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center mb-1">
              <label className="text-xs text-indigo-700 font-medium">Category (Optional)</label>
            </div>
            <select
              value={newTodoCategory}
              onChange={(e) => setNewTodoCategory(e.target.value)}
              className="w-full p-2 border border-indigo-200 rounded-lg"
            >
              <option value="">No Category</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-1 md:col-span-2">
            <button
              onClick={addTodo}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add To-Do
            </button>
          </div>
        </div>
      </div>
      
      {/* Filters Section - Collapsible */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-indigo-600 font-medium mb-2 hover:text-indigo-800"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-indigo-600 font-medium mb-2 hover:text-indigo-800"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? 'Hide Settings' : 'Settings'}
          </button>
        </div>
        
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Status</label>
                <select
                  value={todoStatusFilter}
                  onChange={(e) => setTodoStatusFilter(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="all">All Items</option>
                  <option value="active">Active Only</option>
                  <option value="completed">Completed Only</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Sort By</label>
                <select
                  value={todoSortOption}
                  onChange={(e) => setTodoSortOption(e.target.value as any)}
                  className="w-full border rounded p-2"
                >
                  <option value="deadline">Deadline (Soonest First)</option>
                  <option value="deadline-reverse">Deadline (Latest First)</option>
                  <option value="added">Date Added</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="category">Category</option>
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-gray-700 text-sm font-medium mb-2">Filter Categories</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter(['all'])}
                    className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${categoryFilter.includes('all') 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                  >
                    All Categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.name}
                      onClick={() => handleCategoryFilterChange(category.name)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-colors ${
                        categoryFilter.includes(category.name)
                          ? 'text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                      style={categoryFilter.includes(category.name) 
                        ? { backgroundColor: category.color } 
                        : { borderLeftWidth: '4px', borderLeftColor: category.color }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.name}
                    </button>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2 p-3 bg-gray-50 rounded-lg">No categories available. Create categories below.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {showSettings && (
          <div className="bg-gray-50 p-4 rounded-lg transition-all mt-2">
            <h3 className="font-medium text-gray-700 mb-3">Auto-Hide Settings</h3>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="autoHideCompleted"
                checked={autoHideCompleted}
                onChange={(e) => setAutoHideCompleted(e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="autoHideCompleted" className="text-gray-700">
                Automatically hide completed tasks
              </label>
            </div>
            
            {autoHideCompleted && (
              <div className="ml-6 flex items-center">
                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                <label htmlFor="hideAfterHours" className="text-gray-700 mr-2">
                  Hide after:
                </label>
                <input
                  type="number"
                  id="hideAfterHours"
                  min="1"
                  value={hideAfterHours}
                  onChange={(e) => setHideAfterHours(Math.max(1, parseInt(e.target.value) || 24))}
                  className="w-16 p-1 border border-gray-300 rounded mr-2"
                />
                <span className="text-gray-700">hours</span>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-2">
              Completed tasks will automatically disappear after the specified time period.
              You can still view them by selecting "Completed Only" in the filters.
            </p>
          </div>
        )}
      </div>

      {/* To-Do List */}
      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No to-do items to display. Add new items above.
          </p>
        ) :
          <ul className="space-y-2">
            {filteredTodos.map((todo, index) => {
              const categoryColor = todo.category ? getCategoryColor(todo.category) : '';
              
              return (
                <li
                  key={todo.id}
                  className={`
                    p-4 rounded-lg border transition-all
                    ${isPastDeadline(todo) && !todo.completed ? 'border-l-4 border-l-red-500' : ''}
                    ${isUrgent(todo) && !todo.completed ? 'border-l-4 border-l-yellow-400' : ''}
                    ${isDueToday(todo) && !todo.completed ? 'border-l-4 border-l-blue-500' : ''}
                    ${todo.category ? 'border-t-4' : ''}
                  `}
                  style={todo.category ? {
                    borderTopColor: categoryColor,
                    boxShadow: todo.completed ? 'none' : `0 2px 6px rgba(0, 0, 0, 0.05), 0 -2px 0 ${categoryColor}`
                  } : {}}
                >
                  {editIndex === index ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                          className="p-2 border rounded"
                        />
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="p-2 border rounded"
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="p-2 border rounded"
                        >
                          <option value="">No Category</option>
                          {categories.map(category => (
                            <option key={category.name} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setEditIndex(-1)}
                          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => toggleTaskCompletion(todo)}
                          className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                          style={categoryColor ? { 
                            accentColor: categoryColor, 
                            borderColor: categoryColor 
                          } : {}}
                        />
                        <div className={`${todo.completed ? 'line-through text-gray-400' : ''}`}>
                          <div className="font-medium">
                            {todo.text}
                            {todo.category && (
                              <span 
                                className="ml-2 px-2 py-0.5 rounded-full text-xs text-white inline-flex items-center"
                                style={{ backgroundColor: categoryColor }}
                              >
                                {todo.category}
                              </span>
                            )}
                          </div>
                          {todo.deadline && (
                            <div className="text-sm text-gray-500">
                              Due: {todo.deadline}
                              {todo.time && ` at ${formatTimeDisplay(todo.time)}`}
                              {isDueToday(todo) && !todo.completed && (
                                <span className="ml-2 text-blue-600 font-bold">DUE TODAY</span>
                              )}
                              {isPastDeadline(todo) && !todo.completed && (
                                <span className="ml-2 text-red-600 font-bold">OVERDUE</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditText(todo.text);
                            setEditDeadline(todo.deadline || '');
                            setEditTime(todo.time || '');
                            setEditCategory(todo.category || '');
                            setEditIndex(index);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove to-do: "${todo.text}"?`)) {
                              onUpdateTodos(todos.filter(t => t.id !== todo.id));
                            }
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        }
      </div>
      
      {/* Category Manager - Moved to the bottom */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <CategoryManager 
          categories={categories}
          onUpdateCategories={onUpdateCategories}
        />
      </div>

      {/* Import JSON Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-xl w-full space-y-4 shadow-xl animate-in fade-in duration-150 slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Import Todo Items</h3>
              <button 
                onClick={() => setShowImportDialog(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-gray-700 dark:text-gray-300">Paste your JSON data below. The data should be an array of todo items with the following structure:</p>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-40">
{`[
  {
    "text": "Task description", // required
    "deadline": "YYYY-MM-DD", // optional
    "time": "HH:MM", // optional
    "completed": true|false, // optional, default: false
    "category": "Category name" // optional
  },
  ...
]`}
                </pre>
              </div>
              
              <textarea
                className="w-full h-64 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste JSON data here..."
              />
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportJson}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}