import React, { useState } from 'react';
import { Film, Edit2, X, ExternalLink } from 'lucide-react';
import { WatchItem } from '../types';

interface WatchListProps {
  items: WatchItem[];
  onUpdateItems: (newItems: WatchItem[]) => void;
}

export function WatchList({ items, onUpdateItems }: WatchListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series' | 'video'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [editIndex, setEditIndex] = useState(-1);

  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'movie' | 'series' | 'video'>('movie');
  const [newPlatform, setNewPlatform] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');

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
    .filter(item => {
      if (typeFilter === 'all') return true;
      return item.type === typeFilter;
    })
    .sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return b.id - a.id; // 'added' sort option
    });

  const addItem = () => {
    if (!newTitle.trim()) {
      alert('Title is required.');
      return;
    }

    const newItem: WatchItem = {
      id: Date.now(),
      title: newTitle.trim(),
      type: newType,
      platform: newPlatform.trim() || undefined,
      duration: newDuration.trim() || undefined,
      url: newUrl.trim() || undefined,
      notes: newNotes.trim() || undefined,
      completed: false,
      dateAdded: getCurrentDate()
    };

    onUpdateItems([...items, newItem]);
    setNewTitle('');
    setNewType('movie');
    setNewPlatform('');
    setNewDuration('');
    setNewUrl('');
    setNewNotes('');
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Watch List</h2>

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
              <option value="active">To Watch</option>
              <option value="completed">Watched</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-700">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border rounded p-2"
            >
              <option value="all">All Types</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
              <option value="video">Videos</option>
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
            No watch items to display. Add new items below.
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
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full p-2 border rounded"
                    />
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="movie">Movie</option>
                      <option value="series">Series</option>
                      <option value="video">Video</option>
                    </select>
                    <input
                      type="text"
                      value={newPlatform}
                      onChange={(e) => setNewPlatform(e.target.value)}
                      placeholder="Platform (e.g., Netflix, YouTube)"
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="Duration (e.g., 2h 30m, 12 episodes)"
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="URL (optional)"
                      className="w-full p-2 border rounded"
                    />
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full p-2 border rounded"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!newTitle.trim()) {
                            alert('Title is required.');
                            return;
                          }
                          const newItems = [...items];
                          newItems[index] = {
                            ...item,
                            title: newTitle.trim(),
                            type: newType,
                            platform: newPlatform.trim() || undefined,
                            duration: newDuration.trim() || undefined,
                            url: newUrl.trim() || undefined,
                            notes: newNotes.trim() || undefined
                          };
                          onUpdateItems(newItems);
                          setEditIndex(-1);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditIndex(-1)}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
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
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500">
                          {item.type}
                          {item.platform && ` • ${item.platform}`}
                          {item.duration && ` • ${item.duration}`}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4 inline" />
                            </a>
                          )}
                        </div>
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
                          setEditIndex(index);
                          setNewTitle(item.title);
                          setNewType(item.type);
                          setNewPlatform(item.platform || '');
                          setNewDuration(item.duration || '');
                          setNewUrl(item.url || '');
                          setNewNotes(item.notes || '');
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${item.title}" from watch list?`)) {
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
          <h3 className="font-medium text-gray-900">Add New Item</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title"
              className="w-full p-2 border rounded"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="movie">Movie</option>
              <option value="series">Series</option>
              <option value="video">Video</option>
            </select>
            <input
              type="text"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              placeholder="Platform (e.g., Netflix, YouTube)"
              className="w-full p-2 border rounded"
            />
            <input
              type="text"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              placeholder="Duration (e.g., 2h 30m, 12 episodes)"
              className="w-full p-2 border rounded"
            />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (optional)"
              className="w-full p-2 border rounded"
            />
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>
          <button
            onClick={addItem}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add to Watch List
          </button>
        </div>
      </div>
    </section>
  );
}