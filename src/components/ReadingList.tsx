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
  const [editIndex, setEditIndex] = useState(-1);

  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSiteName, setEditSiteName] = useState('');
  const [editDescription, setEditDescription] = useState('');
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
        setEditTitle(metadata.title);
        setEditSiteName(metadata.siteName);
        setEditDescription(metadata.description || '');
      } else {
        setNewTitle(metadata.title);
        setNewSiteName(metadata.siteName);
        setNewDescription(metadata.description || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch article metadata');
      console.error('Error fetching article metadata:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async () => {
    if (!newUrl.trim()) {
      setError('Article URL is required');
      return;
    }

    if (!newTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      // If no metadata has been fetched yet, fetch it now
      if (newUrl && !newSiteName) {
        setIsLoading(true);
        const metadata = await fetchArticleMeta(newUrl);
        setNewTitle(metadata.title);
        setNewSiteName(metadata.siteName);
        setNewDescription(metadata.description || '');
        setIsLoading(false);
      }

      const newItem: ReadingItem = {
        id: Date.now(),
        url: newUrl.trim(),
        title: newTitle.trim(),
        siteName: newSiteName,
        description: newDescription || undefined,
        imageUrl: '',
        notes: newNotes.trim() || undefined,
        completed: false,
        dateAdded: getCurrentDate()
      };

      onUpdateItems([...items, newItem]);
      setNewUrl('');
      setNewTitle('');
      setNewSiteName('');
      setNewDescription('');
      setNewNotes('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reading item');
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Reading List</h2>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
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
      </div>

      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No reading items to display. Add new items below.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredItems.map((item, index) => (
              <li
                key={item.id}
                className="p-4 rounded-lg border bg-gray-50"
              >
                {editIndex === index ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      onBlur={() => handleUrlChange(editUrl, true)}
                      placeholder="Article URL"
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      value={editSiteName}
                      onChange={(e) => setEditSiteName(e.target.value)}
                      placeholder="Site Name"
                      className="w-full p-2 border rounded"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full p-2 border rounded"
                      rows={2}
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
                          if (!editUrl.trim()) {
                            setError('Article URL is required');
                            return;
                          }
                          if (!editTitle.trim()) {
                            setError('Title is required');
                            return;
                          }

                          try {
                            const newItems = [...items];
                            newItems[index] = {
                              ...item,
                              url: editUrl.trim(),
                              title: editTitle.trim(),
                              siteName: editSiteName,
                              description: editDescription || undefined,
                              imageUrl: '',
                              notes: editNotes.trim() || undefined
                            };
                            onUpdateItems(newItems);
                            setEditIndex(-1);
                            setError('');
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update reading item');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditIndex(-1);
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
                  <div className="flex gap-3">
                    <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center">
                      <Link size={18} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => {
                              const newItems = [...items];
                              newItems[index] = {
                                ...item,
                                completed: !item.completed
                              };
                              onUpdateItems(newItems);
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                          />
                          <div className={item.completed ? 'line-through text-gray-400' : ''}>
                            <div className="font-medium flex items-center gap-1">
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-indigo-600"
                              >
                                {item.title}
                              </a>
                              <ExternalLink size={14} className="text-gray-400" />
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {item.siteName}
                              {item.description && (
                                <span className="ml-2 text-gray-400">•</span>
                              )}
                              {item.description && (
                                <span className="ml-2">{item.description}</span>
                              )}
                            </div>
                            {item.notes && (
                              <div className="text-sm italic text-gray-600 mt-1">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditIndex(index);
                              setEditUrl(item.url);
                              setEditTitle(item.title);
                              setEditSiteName(item.siteName);
                              setEditDescription(item.description || '');
                              setEditNotes(item.notes || '');
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
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 space-y-4 border-t pt-6">
          <h3 className="font-medium text-gray-900">Add New Reading Item</h3>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Article URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onBlur={() => handleUrlChange(newUrl)}
                  placeholder="https://example.com/article"
                  className="flex-grow p-2 border rounded"
                />
                <button
                  onClick={() => handleUrlChange(newUrl)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isLoading || !newUrl}
                >
                  Fetch
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title {isLoading && <span className="text-gray-400 text-xs ml-2">Fetching metadata...</span>}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Article title"
                className="w-full p-2 border rounded"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name
              </label>
              <input
                type="text"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="Site name (e.g., Medium, The New York Times)"
                className="w-full p-2 border rounded"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Article description"
                className="w-full p-2 border rounded"
                rows={2}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Your notes about this article"
                className="w-full p-2 border rounded"
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            onClick={addItem}
            disabled={isLoading || !newUrl.trim() || !newTitle.trim()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isLoading ? 'Loading...' : 'Add to Reading List'}
          </button>
        </div>
      </div>
    </section>
  );
}