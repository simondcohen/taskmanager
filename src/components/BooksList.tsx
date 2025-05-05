import React, { useState } from 'react';
import { Edit2, X, Book } from 'lucide-react';
import { BookItem } from '../types';

interface BooksListProps {
  items: BookItem[];
  onUpdateItems: (newItems: BookItem[]) => void;
}

export function BooksList({ items, onUpdateItems }: BooksListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const getCurrentDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredItems = items
    .filter(item => {
      if (statusFilter === 'active') return !item.completed;
      if (statusFilter === 'completed') return item.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return b.id - a.id;
    });

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
        completed: false,
        dateAdded: getCurrentDate()
      };

      onUpdateItems([...items, newItem]);
      setEditTitle('');
      setEditAuthor('');
      setEditNotes('');
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

      <div className="space-y-4">
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
                                    notes: editNotes.trim() || undefined
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
                ) : (
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
                )}
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