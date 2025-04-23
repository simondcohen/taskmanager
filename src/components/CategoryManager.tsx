import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

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
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    onUpdateCategories(newCategories);
  };

  return (
    <div className="mb-6">
      <h3 className="font-medium text-gray-700 mb-2">Manage Categories</h3>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name..."
          className="p-2 border rounded flex-grow"
        />
        <button
          onClick={handleAddCategory}
          className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center gap-1 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
      
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="py-1 px-3 rounded-full flex items-center gap-1 text-white"
              style={{ backgroundColor: category.color }}
            >
              <span>{category.name}</span>
              <button
                onClick={() => handleDeleteCategory(index)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No categories yet. Add one above.</p>
      )}
    </div>
  );
} 