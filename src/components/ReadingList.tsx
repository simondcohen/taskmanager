import React, { useState, useEffect } from 'react';
import { Edit2, X, ExternalLink, Book, Link } from 'lucide-react';
import { ReadingItem } from '../types';
import { fetchArticleMeta } from '../utils/articleMeta';

interface ReadingListProps {
  items: ReadingItem[];
  onUpdateItems: (newItems: ReadingItem[]) => void;
}

export function ReadingList({ items, onUpdateItems }: ReadingListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // On component mount, migrate any existing data
  useEffect(() => {
    migrateExistingData();
  }, []);

  const migrateExistingData = () => {
    if (items.length > 0 && (!items[0].url || !items[0].siteName)) {
      // Migrate existing items if they don't have the new fields
      const migratedItems = items.map(item => ({
        ...item,
        url: item.url || '',
        siteName: item.siteName || '',
        description: item.description || '',
        imageUrl: item.imageUrl || ''
      }));
      onUpdateItems(migratedItems);
    }
  };

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

  const handleUrlChange = async (url: string, isEdit = false) => {
    if (!url) return;
    
    try {
      setIsLoading(true);
      setError('');
      const metadata = await fetchArticleMeta(url);
      
      if (isEdit) {
        // Combine title and site name if both exist
        const combinedTitle = metadata.siteName && metadata.title !== metadata.siteName 
          ? `${metadata.title} - ${metadata.siteName}` 
          : metadata.title;
        setEditTitle(combinedTitle);
      } else {
        // Combine title and site name if both exist
        const combinedTitle = metadata.siteName && metadata.title !== metadata.siteName 
          ? `${metadata.title} - ${metadata.siteName}` 
          : metadata.title;
        setNewTitle(combinedTitle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article metadata');
      console.error('Error fetching article metadata:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addArticle = async () => {
    if (!editUrl.trim() && !editTitle.trim()) {
      setError('Please enter either a URL or a title.');
      return;
    }

    setIsLoading(true);
    try {
      const newItem: ReadingItem = {
        id: Date.now(),
        url: editUrl.trim() || undefined,
        title: editTitle.trim() || 'Untitled Article',
        notes: editNotes.trim() || undefined,
        completed: false,
        dateAdded: getCurrentDate()
      };

      onUpdateItems([...items, newItem]);
      setEditUrl('');
      setEditTitle('');
      setEditNotes('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add article');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Reading List</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded p-2"
          >
            <option value="all">All Items</option>
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
            No articles to display. Add new items below.
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
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Article URL (optional)"
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Article title"
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
                        onClick={async () => {
                          if (!editUrl.trim() && !editTitle.trim()) {
                            setError('Please enter either an article URL or title');
                            return;
                          }

                          try {
                            const updatedItems = items.map(i => 
                              i.id === item.id 
                                ? {
                                    ...i,
                                    url: editUrl.trim() ? editUrl.trim() : undefined,
                                    title: editTitle.trim(),
                                    notes: editNotes.trim() ? editNotes.trim() : undefined
                                  }
                                : i
                            );
                            onUpdateItems(updatedItems);
                            setEditItemId(null);
                            setError('');
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update article');
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
                          {item.title}
                          {item.url && (
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        {item.siteName && (
                          <div className="text-sm text-gray-600">
                            {item.siteName}
                          </div>
                        )}
                        {item.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.description}
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
                          setEditUrl(item.url || '');
                          setEditTitle(item.title);
                          setEditNotes(item.notes || '');
                          setError('');
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${item.title}" from reading list?`)) {
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
          <h3 className="font-medium text-gray-900">Add New Article</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="Article URL (optional)"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Article title"
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
            onClick={addArticle}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add to Reading List'}
          </button>
        </div>
      </div>
    </section>
  );
}