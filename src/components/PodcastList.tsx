import React, { useState } from 'react';
import { Edit2, X } from 'lucide-react';
import { PodcastItem } from '../types';

interface PodcastListProps {
  items: PodcastItem[];
  onUpdateItems: (newItems: PodcastItem[]) => void;
}

export function PodcastList({ items, onUpdateItems }: PodcastListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [editItemId, setEditItemId] = useState<number | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCreator, setNewCreator] = useState('');
  const [newEpisode, setNewEpisode] = useState('');
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
    .sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return b.id - a.id;
    });

  const addItem = () => {
    if (!newTitle.trim()) {
      alert('Podcast title is required.');
      return;
    }

    const newItem: PodcastItem = {
      id: Date.now(),
      title: newTitle.trim(),
      creator: newCreator.trim() || undefined,
      episode: newEpisode.trim() || undefined,
      notes: newNotes.trim() || undefined,
      completed: false,
      dateAdded: getCurrentDate()
    };

    onUpdateItems([...items, newItem]);
    setNewTitle('');
    setNewCreator('');
    setNewEpisode('');
    setNewNotes('');
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-indigo-700 mb-6">Podcasts</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded p-2"
          >
            <option value="all">All Items</option>
            <option value="active">To Listen</option>
            <option value="completed">Listened</option>
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
        {filteredItems.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No podcasts to display. Add new items below.
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
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Podcast title"
                      className="w-full p-2 border rounded"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newCreator}
                        onChange={(e) => setNewCreator(e.target.value)}
                        placeholder="Creator/Host (optional)"
                        className="p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={newEpisode}
                        onChange={(e) => setNewEpisode(e.target.value)}
                        placeholder="Episode name (optional)"
                        className="p-2 border rounded"
                      />
                    </div>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Notes (optional)"
                      className="w-full p-2 border rounded"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!newTitle.trim()) {
                            alert('Title is required.');
                            return;
                          }
                          const updatedItems = items.map(i => 
                            i.id === item.id 
                              ? {
                                  ...i,
                                  title: newTitle.trim(),
                                  creator: newCreator.trim() || undefined,
                                  episode: newEpisode.trim() || undefined,
                                  notes: newNotes.trim() || undefined
                                }
                              : i
                          );
                          onUpdateItems(updatedItems);
                          setEditItemId(null);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditItemId(null)}
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
                        <div className="font-medium">{item.title}</div>
                        {(item.creator || item.episode) && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.creator && <span>{item.creator}</span>}
                            {item.creator && item.episode && <span> - </span>}
                            {item.episode && <span>{item.episode}</span>}
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
                          setNewTitle(item.title);
                          setNewCreator(item.creator || '');
                          setNewEpisode(item.episode || '');
                          setNewNotes(item.notes || '');
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove "${item.title}" from podcast list?`)) {
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
          <h3 className="font-medium text-gray-900">Add New Podcast</h3>
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Podcast title"
              className="w-full p-2 border rounded"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newCreator}
                onChange={(e) => setNewCreator(e.target.value)}
                placeholder="Creator/Host (optional)"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={newEpisode}
                onChange={(e) => setNewEpisode(e.target.value)}
                placeholder="Episode name (optional)"
                className="p-2 border rounded"
              />
            </div>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full p-2 border rounded"
              rows={2}
            />
          </div>
          <button
            onClick={addItem}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Add to Podcast List
          </button>
        </div>
      </div>
    </section>
  );
} 