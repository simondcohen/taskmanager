import React, { useState } from 'react';
import { Edit2, X } from 'lucide-react';
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoDeadline, setNewTodoDeadline] = useState(getCurrentDate());
  const [newTodoTime, setNewTodoTime] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editText, setEditText] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCategory, setEditCategory] = useState('');

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

  function parseLocalDate(dateStr: string) {
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

  const filteredTodos = todos.filter(todo => {
    // First apply status filter
    if (todoStatusFilter === 'active' && todo.completed) return false;
    if (todoStatusFilter === 'completed' && !todo.completed) return false;
    
    // Then apply category filter if needed
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;
    
    return true;
  }).sort((a, b) => {
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
    
    if (!newTodoDeadline) {
      alert('Deadline is required.');
      return;
    }
    
    try {
      // Validate deadline format
      const deadlineDate = parseLocalDate(newTodoDeadline);
      if (!deadlineDate) {
        alert('Invalid date format. Please use YYYY-MM-DD.');
        return;
      }
      
      const newTodo: TodoItem = {
        id: Date.now(),
        text: newTodoText.trim(),
        deadline: newTodoDeadline,
        time: newTodoTime || null,
        category: newTodoCategory || undefined,
        completed: false,
        dateAdded: getCurrentDate()
      };

      onUpdateTodos([...todos, newTodo]);
      setNewTodoText('');
      setNewTodoTime('');
      // Keep the deadline at today's date for convenience
      setNewTodoCategory('');
    } catch (err) {
      console.error('Error adding todo:', err);
      alert('Failed to add todo. Please try again.');
    }
  }

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">To-Do Items with Deadlines</h2>
      
      <CategoryManager 
        categories={categories}
        onUpdateCategories={onUpdateCategories}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-gray-700">Status:</label>
            <select
              value={todoStatusFilter}
              onChange={(e) => setTodoStatusFilter(e.target.value as any)}
              className="border rounded p-2"
            >
              <option value="all">All Items</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-700">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded p-2"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-700">Sort By:</label>
            <select
              value={todoSortOption}
              onChange={(e) => setTodoSortOption(e.target.value as any)}
              className="border rounded p-2"
            >
              <option value="deadline">Deadline (Soonest First)</option>
              <option value="deadline-reverse">Deadline (Latest First)</option>
              <option value="added">Date Added</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No to-do items to display. Add new items below.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredTodos.map((todo, index) => {
              const categoryColor = todo.category ? getCategoryColor(todo.category) : '';
              
              return (
                <li
                  key={todo.id}
                  className={`
                    p-4 rounded-lg border transition-all
                    ${isPastDeadline(todo) && !todo.completed ? 'border-l-4 border-l-red-500' : ''}
                    ${isUrgent(todo) && !todo.completed ? 'border-l-4 border-l-orange-500' : ''}
                    ${isDueToday(todo) && !todo.completed ? 'border-l-4 border-l-blue-500' : ''}
                    ${todo.category ? 'border-t-4' : ''}
                  `}
                  style={todo.category ? {
                    borderTopColor: categoryColor,
                    boxShadow: todo.completed ? 'none' : `0 2px 6px rgba(0, 0, 0, 0.05), 0 -2px 0 ${categoryColor}`
                  } : {}}
                >
                  {editIndex === index ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <div className="flex gap-2">
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!editText.trim() || !editDeadline) {
                              alert('Description and deadline required.');
                              return;
                            }
                            const newTodos = [...todos];
                            const originalIndex = newTodos.findIndex(t => t.id === todo.id);
                            if (originalIndex !== -1) {
                              newTodos[originalIndex] = {
                                ...todo,
                                text: editText.trim(),
                                deadline: editDeadline,
                                time: editTime || null,
                                category: editCategory || undefined
                              };
                              onUpdateTodos(newTodos);
                            } else {
                              console.error('Could not find todo with ID:', todo.id);
                            }
                            setEditIndex(-1);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditIndex(-1)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => {
                            const newTodos = [...todos];
                            const originalIndex = newTodos.findIndex(t => t.id === todo.id);
                            if (originalIndex !== -1) {
                              newTodos[originalIndex] = {
                                ...todo,
                                completed: !todo.completed
                              };
                              onUpdateTodos(newTodos);
                            } else {
                              console.error('Could not find todo with ID:', todo.id);
                            }
                          }}
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
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditText(todo.text);
                            setEditDeadline(todo.deadline);
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
        )}

        <div className="mt-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="New to-do description"
              className="flex-1 p-2 border rounded"
            />
            <input
              type="date"
              value={newTodoDeadline}
              onChange={(e) => setNewTodoDeadline(e.target.value)}
              min={getCurrentDate()}
              className="p-2 border rounded"
            />
            <input
              type="time"
              value={newTodoTime}
              onChange={(e) => setNewTodoTime(e.target.value)}
              className="p-2 border rounded"
            />
            <select
              value={newTodoCategory}
              onChange={(e) => setNewTodoCategory(e.target.value)}
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
          <button
            onClick={addTodo}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add To-Do
          </button>
        </div>
      </div>
    </section>
  );
}