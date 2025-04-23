import React, { useState, useEffect } from 'react';
import { Edit2, X, ExternalLink, Play } from 'lucide-react';
import { VideoItem } from '../types';
import { fetchYoutubeMeta } from '../utils/youtube';

interface VideoListProps {
  items: VideoItem[];
  onUpdateItems: (newItems: VideoItem[]) => void;
}

export function VideoList({ items, onUpdateItems }: VideoListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [editIndex, setEditIndex] = useState(-1);

  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // On component mount, migrate any existing data
  useEffect(() => {
    migrateExistingData();
  }, []);

  const migrateExistingData = () => {
    if (items.length > 0 && (!items[0].url || !items[0].thumbnailUrl)) {
      // Migrate existing items if they don't have url or thumbnailUrl
      const migratedItems = items.map(item => ({
        ...item,
        url: item.url || '',
        thumbnailUrl: item.thumbnailUrl || ''
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
      const metadata = await fetchYoutubeMeta(url);
      
      if (isEdit) {
        setEditTitle(metadata.title);
        setEditThumbnailUrl(metadata.thumbnailUrl);
      } else {
        setNewTitle(metadata.title);
        setNewThumbnailUrl(metadata.thumbnailUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch YouTube metadata');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async () => {
    if (!newUrl.trim()) {
      setError('YouTube URL is required');
      return;
    }

    if (!newTitle.trim()) {
      setError('Title is required');
      return;
    }

    try {
      // If no metadata has been fetched yet, fetch it now
      if (!newThumbnailUrl && newUrl) {
        setIsLoading(true);
        const metadata = await fetchYoutubeMeta(newUrl);
        setNewTitle(metadata.title);
        setNewThumbnailUrl(metadata.thumbnailUrl);
        setIsLoading(false);
      }

      const newItem: VideoItem = {
        id: Date.now(),
        url: newUrl.trim(),
        title: newTitle.trim(),
        thumbnailUrl: newThumbnailUrl,
        notes: newNotes.trim() || undefined,
        completed: false,
        dateAdded: getCurrentDate()
      };

      onUpdateItems([...items, newItem]);
      setNewUrl('');
      setNewTitle('');
      setNewThumbnailUrl('');
      setNewNotes('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video');
      setIsLoading(false);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Replace broken image with placeholder
    e.currentTarget.onerror = null;
    e.currentTarget.style.display = 'none';
    e.currentTarget.parentElement!.classList.add('bg-gray-200', 'flex', 'items-center', 'justify-center');
    
    // Find or create placeholder icon
    let icon = e.currentTarget.parentElement!.querySelector('.placeholder-icon');
    if (!icon) {
      icon = document.createElement('div');
      icon.className = 'placeholder-icon text-gray-400';
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
      e.currentTarget.parentElement!.appendChild(icon);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">YouTube Videos</h2>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border rounded p-2"
            >
              <option value="all">All Videos</option>
              <option value="active">To Watch</option>
              <option value="completed">Watched</option>
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
            No videos to display. Add new videos below.
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
                      placeholder="YouTube URL"
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full p-2 border rounded"
                    />
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full p-2 border rounded"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!editUrl.trim()) {
                            setError('YouTube URL is required');
                            return;
                          }
                          if (!editTitle.trim()) {
                            setError('Title is required');
                            return;
                          }

                          try {
                            // If thumbnail is not set, try to fetch metadata
                            if (!editThumbnailUrl) {
                              setIsLoading(true);
                              const metadata = await fetchYoutubeMeta(editUrl);
                              setEditThumbnailUrl(metadata.thumbnailUrl);
                              setIsLoading(false);
                            }

                            const newItems = [...items];
                            newItems[index] = {
                              ...item,
                              url: editUrl.trim(),
                              title: editTitle.trim(),
                              thumbnailUrl: editThumbnailUrl,
                              notes: editNotes.trim() || undefined
                            };
                            onUpdateItems(newItems);
                            setEditIndex(-1);
                            setError('');
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Failed to update video');
                            setIsLoading(false);
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
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-20 h-12 relative rounded overflow-hidden"
                      >
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Play className="text-gray-400" size={20} />
                          </div>
                        )}
                      </a>
                    </div>
                    <div className="flex-grow flex items-center justify-between">
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
                          {item.notes && (
                            <div className="text-sm text-gray-600 mt-1">
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
                            setEditThumbnailUrl(item.thumbnailUrl);
                            setEditNotes(item.notes || '');
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove "${item.title}"?`)) {
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
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 space-y-4 border-t pt-6">
          <h3 className="font-medium text-gray-900">Add New Video</h3>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onBlur={() => handleUrlChange(newUrl)}
                  placeholder="https://www.youtube.com/watch?v=..."
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
            
            {newThumbnailUrl && (
              <div className="flex items-center gap-4">
                <div className="w-20 h-12 rounded overflow-hidden">
                  <img 
                    src={newThumbnailUrl} 
                    alt="Thumbnail Preview" 
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Thumbnail preview
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title {isLoading && <span className="text-gray-400 text-xs ml-2">Fetching metadata...</span>}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Video title"
                className="w-full p-2 border rounded"
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
                placeholder="Add notes about the video"
                className="w-full p-2 border rounded"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            onClick={addItem}
            disabled={isLoading || !newUrl.trim()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isLoading ? 'Loading...' : 'Add Video'}
          </button>
        </div>
      </div>
    </section>
  );
}