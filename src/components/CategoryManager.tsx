import React, { useState } from 'react';
import { X, Plus, Tag, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

// Define the category interface
export interface Category {
  name: string;
  color: string;
}

interface CategoryManagerProps {
  categories: Category[];
  onUpdateCategories: (newCategories: Category[]) => void;
}

// Predefined tasteful color palette
const colorPalette = [
  '#4F46E5', // indigo
  '#0891B2', // cyan
  '#059669', // emerald
  '#D97706', // amber
  '#DC2626', // red
  '#7C3AED', // violet
  '#2563EB', // blue
  '#DB2777', // pink
  '#65A30D', // lime
  '#0D9488', // teal
  '#9333EA', // purple
  '#EA580C', // orange
];

export function CategoryManager({ categories, onUpdateCategories }: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    // Don't add duplicates
    if (categories.some(cat => cat.name === newCategory.trim())) {
      alert('This category already exists.');
      return;
    }
    
    // Assign a color from the palette
    const usedColors = categories.map(cat => cat.color);
    const availableColors = colorPalette.filter(color => !usedColors.includes(color));
    
    // If all colors are used, cycle through the palette
    const newColor = availableColors.length > 0 
      ? availableColors[0] 
      : colorPalette[categories.length % colorPalette.length];
    
    onUpdateCategories([...categories, { name: newCategory.trim(), color: newColor }]);
    setNewCategory('');
  };

  const handleDeleteCategory = (index: number) => {
    const category = categories[index];
    // Show a warning dialog before deleting
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"? This will remove the category from all associated to-do items.`)) {
      const newCategories = [...categories];
      newCategories.splice(index, 1);
      onUpdateCategories(newCategories);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditedName(categories[index].name);
  };

  const saveEdit = (index: number) => {
    if (!editedName.trim()) {
      alert('Category name cannot be empty');
      return;
    }

    // Check for duplicates, but ignore the current category
    if (categories.some((cat, i) => i !== index && cat.name === editedName.trim())) {
      alert('This category name already exists');
      return;
    }

    const newCategories = [...categories];
    newCategories[index] = { 
      ...newCategories[index], 
      name: editedName.trim() 
    };
    
    onUpdateCategories(newCategories);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-indigo-700 font-medium mb-4 px-3 py-2 hover:bg-indigo-50 rounded transition-colors"
      >
        <Tag className="w-5 h-5" />
        Manage Categories
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name..."
              className="p-3 border rounded-lg flex-grow text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleAddCategory}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
          
          {categories.length > 0 ? (
            <div className="space-y-2 mb-4">
              {categories.map((category, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                >
                  {editingIndex === index ? (
                    <div className="flex-grow flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <input 
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-grow p-1 border rounded"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(index);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {editingIndex === index ? (
                      <>
                        <button
                          onClick={() => saveEdit(index)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(index)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-4 p-4 bg-gray-50 rounded-lg">No categories yet. Add one above.</p>
          )}
        </>
      )}
    </div>
  );
} 