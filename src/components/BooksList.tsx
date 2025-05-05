import React, { useState } from 'react';
import { Edit2, X, Book, Tag } from 'lucide-react';
import { BookItem } from '../types';
import { CategoryManager, Category } from './CategoryManager';

interface BooksListProps {
  items: BookItem[];
  onUpdateItems: (newItems: BookItem[]) => void;
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
}

export function BooksList({ items, onUpdateItems, categories, onUpdateCategories }: BooksListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all']);
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const getCurrentDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredItems = items
    .filter(item => {
      // First filter by status
      if (statusFilter === 'active' && item.completed) return false;
      if (statusFilter === 'completed' && !item.completed) return false;
      
      // Then filter by category
      if (!categoryFilter.includes('all') && 
          !(item.category && categoryFilter.includes(item.category))) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return b.id - a.id;
    });

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

  const addBook = () => {
    if (!editTitle.trim()) {
      setError('Please enter a book title.');
      return;
    }

    setIsLoading(true);
    try {
      const newItem: BookItem = {
        id: Date.now(),
        title: editTitle.trim(),
        author: editAuthor.trim() || undefined,
        notes: editNotes.trim() || undefined,
        category: editCategory || undefined,
        completed: false,
        dateAdded: getCurrentDate()
      };

      onUpdateItems([...items, newItem]);
      setEditTitle('');
      setEditAuthor('');
      setEditNotes('');
      setEditCategory('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add book');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Books to Read</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded p-2"
          >
            <option value="all">All Books</option>
            <option value="active">To Read</option>
            <option value="completed">Read</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-gray-700">Sort By:</label>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="border rounded p-2"
          >
            <option value="added">Date Added</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
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

      <CategoryManager 
        categories={categories}
        onUpdateCategories={onUpdateCategories}
      />

      <div className="space-y-4 mt-6">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No books to display. Add new books below.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredItems.map((item) => (
              <li
                key={item.id}
                className={`p-4 rounded-lg border ${
                  item.completed ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                {editItemId === item.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Book title"
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      placeholder="Author (optional)"
                      className="w-full p-2 border rounded"
                    />
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full p-2 border rounded"
                      rows={2}
                    />
                    <select
                      value={editCategory || ''}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">No Category</option>
                      {categories.map(category => (
                        <option key={category.name} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!editTitle.trim()) {
                            setError('Please enter a book title');
                            return;
                          }

                          try {
                            const updatedItems = items.map(i => 
                              i.id === item.id 
                                ? {
                                    ...i,
                                    title: editTitle.trim(),
                                    author: editAuthor.trim() || undefined,
                                    notes: editNotes.trim() || undefined,
                                    category: editCategory || undefined
                                  }
                                : i
                            );
                            onUpdateItems(updatedItems);
                            setEditItemId(null);
                            setError('');
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update book');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditItemId(null);
                          setError('');
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) :
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          const updatedItems = items.map(i => 
                            i.id === item.id 
                              ? { ...i, completed: !i.completed }
                              : i
                          );
                          onUpdateItems(updatedItems);
                        }}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                      />
                      <div className={item.completed ? 'line-through text-gray-400' : ''}>
                        <div className="font-medium flex items-center gap-2">
                          {item.title} <Book className="w-4 h-4 text-indigo-600" />
                          {item.category && (
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: categories.find(c => c.name === item.category)?.color || '#9ca3af' }}
                            >
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.author && (
                          <div className="text-sm text-gray-600">
                            By: {item.author}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-sm text-gray-600 mt-1">
                            Notes: {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditItemId(item.id);
                          setEditTitle(item.title);
                          setEditAuthor(item.author || '');
                          setEditNotes(item.notes || '');
                          setEditCategory(item.category || '');
                          setError('');
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${item.title}" from books list?`)) {
                            onUpdateItems(items.filter(i => i.id !== item.id));
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                }
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 space-y-4 border-t pt-6">
          <h3 className="font-medium text-gray-900">Add New Book</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Book title"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={editAuthor}
              onChange={(e) => setEditAuthor(e.target.value)}
              placeholder="Author (optional)"
              className="w-full p-2 border rounded"
            />
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full p-2 border rounded"
              rows={2}
            />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full p-2 border rounded"
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
            onClick={addBook}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add to Books List'}
          </button>
        </div>
      </div>
    </section>
  );
} 