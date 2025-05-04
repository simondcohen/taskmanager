import React, { useState } from 'react';
import { Edit2, X, Settings } from 'lucide-react';
import { GroceryItem } from '../types';

interface GroceryListProps {
  items: GroceryItem[];
  onUpdateItems: (newItems: GroceryItem[]) => void;
}

export function GroceryList({ items, onUpdateItems }: GroceryListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'added' | 'alphabetical'>('added');
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [autoHideCompleted, setAutoHideCompleted] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newUnit, setNewUnit] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const getCurrentDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to check if a completed item should be hidden
  function shouldHideCompletedItem(item: GroceryItem): boolean {
    return autoHideCompleted && item.completed;
  }

  const filteredItems = items
    .filter(item => {
      // First check if completed items should be hidden
      if (shouldHideCompletedItem(item)) {
        return false;
      }
      
      // Then apply status filter
      if (statusFilter === 'active') return !item.completed;
      if (statusFilter === 'completed') return item.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      return b.id - a.id;
    });

  const addItem = () => {
    if (!newName.trim()) {
      alert('Item name is required.');
      return;
    }

    const newItem: GroceryItem = {
      id: Date.now(),
      name: newName.trim(),
      quantity: newQuantity,
      category: 'other',
      unit: newUnit.trim() || undefined,
      notes: newNotes.trim() || undefined,
      completed: false,
      dateAdded: getCurrentDate()
    };

    onUpdateItems([...items, newItem]);
    setNewName('');
    setNewQuantity(1);
    setNewUnit('');
    setNewNotes('');
  };

  // Function to mark an item as completed/uncompleted
  const toggleItemCompletion = (item: GroceryItem) => {
    const updatedItems = items.map(i => 
      i.id === item.id 
        ? { ...i, completed: !i.completed }
        : i
    );
    onUpdateItems(updatedItems);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-indigo-700">Grocery List</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-3 py-2 rounded"
          title="Settings"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-3">List Settings</h3>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="autoHideCompleted"
              checked={autoHideCompleted}
              onChange={() => setAutoHideCompleted(!autoHideCompleted)}
              className="mr-2 h-5 w-5"
            />
            <label htmlFor="autoHideCompleted" className="text-gray-700">
              Automatically hide completed items
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border rounded p-2"
          >
            <option value="all">All Items</option>
            <option value="active">To Buy</option>
            <option value="completed">Purchased</option>
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
            No grocery items to display. Add new items below.
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
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Item name"
                      className="w-full p-2 border rounded"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="w-24 p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        placeholder="Unit (e.g., lbs, oz)"
                        className="w-32 p-2 border rounded"
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
                          if (!newName.trim()) {
                            alert('Item name is required.');
                            return;
                          }
                          const updatedItems = items.map(i => 
                            i.id === item.id 
                              ? {
                                  ...i,
                                  name: newName.trim(),
                                  quantity: newQuantity,
                                  category: i.category,
                                  unit: newUnit.trim() || undefined,
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
                        onChange={() => toggleItemCompletion(item)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600"
                      />
                      <div className={item.completed ? 'line-through text-gray-400' : ''}>
                        <div className="font-medium flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                            {item.quantity} {item.unit || 'x'}
                          </span>
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
                          setEditItemId(item.id);
                          setNewName(item.name);
                          setNewQuantity(item.quantity);
                          setNewUnit(item.unit || '');
                          setNewNotes(item.notes || '');
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const updatedItems = items.filter(i => i.id !== item.id);
                          onUpdateItems(updatedItems);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 bg-indigo-50 p-4 rounded-lg">
        <h3 className="font-medium text-indigo-800 mb-3">Add New Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="col-span-1 md:col-span-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Item name"
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="w-24 p-2 border rounded"
            />
            <input
              type="text"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="Unit (e.g., lbs, oz)"
              className="w-32 p-2 border rounded"
            />
          </div>
          <div>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="w-full p-2 border rounded"
              rows={1}
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <button
              onClick={addItem}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}