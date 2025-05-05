import React, { useState, useEffect } from 'react';
import { Edit2, X, ExternalLink, Play, Tag } from 'lucide-react';
import { VideoItem } from '../types';
import { fetchYoutubeMeta } from '../utils/youtube';
import { CategoryManager, Category } from './CategoryManager';

interface VideoListProps {
  items: VideoItem[];
  onUpdateItems: (newItems: VideoItem[]) => void;
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
}

export function VideoList({ items, onUpdateItems, categories, onUpdateCategories }: VideoListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [categoryFilter, setCategoryFilter] = useState<string[]>(['all']);
  const [editItemId, setEditItemId] = useState<number | null>(null);

  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState('');

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

  const addVideo = async () => {
    if (!newUrl.trim()) {
      setError('Video URL is required');
      return;
    }

    setIsLoading(true);
    try {
      const videoId = extractYouTubeId(newUrl);
      if (!videoId) {
        setError('Invalid YouTube URL. Please provide a valid YouTube video URL.');
        setIsLoading(false);
        return;
      }

      // Get basic video info by URL parsing
      const newItem: VideoItem = {
        id: Date.now(),
        url: newUrl.trim(),
        title: newTitle.trim() || `YouTube Video (${videoId})`,
        thumbnailUrl: newThumbnailUrl || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        notes: newNotes.trim() || '',
        category: newCategory || undefined,
        completed: false,
        dateAdded: getCurrentDate()
      };

      onUpdateItems([...items, newItem]);
      setNewUrl('');
      setNewTitle('');
      setNewThumbnailUrl('');
      setNewNotes('');
      setNewCategory('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add video');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract YouTube video ID from URL
  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Get embed URL for YouTube video
  function getEmbedUrl(url: string): string {
    const videoId = extractYouTubeId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  }

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
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Videos</h2>

      <div className="flex flex-wrap gap-4 mb-6">
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
          <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-2">Add New Video</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => {
                    setNewUrl(e.target.value);
                    if (e.target.value.trim().startsWith('http')) {
                      handleUrlChange(e.target.value);
                    }
                  }}
                  placeholder="Paste YouTube URL"
                  className="flex-grow p-2 border rounded"
                />
                <button
                  onClick={addVideo}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Video title (optional, will be auto-filled)"
                className="w-full p-2 border rounded"
              />
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full p-2 border rounded"
                rows={2}
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">No Category</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Currently supports YouTube videos. Paste any YouTube video URL to add it to your watch list.
              </p>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No videos in your list. Add videos above to get started.
            </p>
          ) : (
            <ul className="space-y-4">
              {filteredItems.map((item) => (
                <li
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    item.completed ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  {editItemId === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="Video URL"
                        className="w-full p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Video title"
                        className="w-full p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={editThumbnailUrl}
                        onChange={(e) => setEditThumbnailUrl(e.target.value)}
                        placeholder="Thumbnail URL"
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
                            if (!editUrl.trim()) {
                              setError('Please enter a video URL');
                              return;
                            }

                            const videoId = extractYouTubeId(editUrl);
                            if (!videoId) {
                              setError('Invalid YouTube URL');
                              return;
                            }

                            const updatedItems = items.map(i => 
                              i.id === item.id 
                                ? {
                                    ...i,
                                    url: editUrl.trim(),
                                    title: editTitle.trim() || i.title,
                                    thumbnailUrl: editThumbnailUrl.trim() || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                                    notes: editNotes.trim() || undefined,
                                    category: editCategory || undefined
                                  }
                                : i
                            );
                            onUpdateItems(updatedItems);
                            setEditItemId(null);
                            setError('');
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
                    <div>
                      <div className="flex justify-between mb-2">
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
                              <a 
                                href={item.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {item.category && (
                                <span 
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                                  style={{ backgroundColor: categories.find(c => c.name === item.category)?.color || '#9ca3af' }}
                                >
                                  {item.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditItemId(item.id);
                              setEditUrl(item.url);
                              setEditTitle(item.title);
                              setEditThumbnailUrl(item.thumbnailUrl);
                              setEditNotes(item.notes || '');
                              setEditCategory(item.category || '');
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
                      
                      <div className="mt-2 flex md:flex-row flex-col gap-4">
                        <div className="md:w-1/3 w-full">
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block hover:opacity-90 transition-opacity"
                          >
                            <img 
                              src={item.thumbnailUrl} 
                              alt={item.title} 
                              className="w-full h-auto rounded"
                              onError={(e) => {
                                // If thumbnail fails to load, set a placeholder
                                (e.target as HTMLImageElement).src = 'https://placehold.co/320x180/eee/999?text=Video';
                              }}
                            />
                          </a>
                        </div>
                        <div className="md:w-2/3 w-full">
                          {item.notes && (
                            <div className="text-gray-700 mb-3">
                              {item.notes}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 inline-flex items-center gap-2"
                            >
                              Watch on YouTube
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}