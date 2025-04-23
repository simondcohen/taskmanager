import React, { useState } from 'react';
import { X, Plus, Tag, ChevronDown, ChevronUp } from 'lucide-react';

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
    <div>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-700 font-medium mb-3 hover:text-gray-900"
      >
        <Tag className="w-4 h-4" />
        Manage Categories
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isExpanded && (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name..."
              className="p-2 border rounded flex-grow text-sm"
            />
            <button
              onClick={handleAddCategory}
              className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 rounded flex items-center gap-1 hover:bg-gray-200 text-sm"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {categories.map((category, index) => (
                <div 
                  key={index} 
                  className="py-1 px-2 rounded-full flex items-center gap-1 text-white text-xs"
                  style={{ backgroundColor: category.color }}
                >
                  <span>{category.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(index)}
                    className="text-white hover:text-gray-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-xs mb-2">No categories yet. Add one above.</p>
          )}
        </>
      )}
    </div>
  );
} 