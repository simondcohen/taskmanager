import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, ExternalLink, Copy, Check, FileText, Link as LinkIcon, ChevronDown, ChevronUp, Folder, FolderOpen, RefreshCw, ChevronRight, Download, Clipboard } from 'lucide-react';

interface ShortcutCategory {
  id: string;
  name: string;
  parentId: string | null; // null for top-level categories
  expanded?: boolean; // UI state
}

interface ShortcutLink {
  id: string;
  title: string;
  url: string;
  categoryId: string | null; // Reference to a category
}

interface TextSnippet {
  id: string;
  title: string;
  content: string;
  categoryId: string | null; // Reference to a category
}

type ShortcutItemType = (ShortcutLink | TextSnippet) & { type: 'link' | 'snippet' };

export const Shortcuts: React.FC = () => {
  const [links, setLinks] = useState<ShortcutLink[]>([]);
  const [snippets, setSnippets] = useState<TextSnippet[]>([]);
  const [categories, setCategories] = useState<ShortcutCategory[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkCategoryId, setNewLinkCategoryId] = useState<string | null>(null);
  const [newSnippetTitle, setNewSnippetTitle] = useState('');
  const [newSnippetContent, setNewSnippetContent] = useState('');
  const [newSnippetCategoryId, setNewSnippetCategoryId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<ShortcutLink | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<TextSnippet | null>(null);
  const [editingCategory, setEditingCategory] = useState<ShortcutCategory | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<'link' | 'snippet' | 'category'>('link');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | null>(null);
  const [showBackupOptions, setShowBackupOptions] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedLinks = localStorage.getItem('shortcutsLinks');
    const savedSnippets = localStorage.getItem('shortcutsSnippets');
    const savedCategories = localStorage.getItem('shortcutsCategories');
    
    if (savedLinks) {
      try {
        const parsedLinks = JSON.parse(savedLinks);
        // Handle migration from old format
        setLinks(parsedLinks.map((link: any) => ({
          ...link,
          categoryId: link.categoryId || null
        })));
      } catch (e) {
        console.error('Error loading shortcuts links:', e);
        setLinks([]);
      }
    }
    
    if (savedSnippets) {
      try {
        const parsedSnippets = JSON.parse(savedSnippets);
        // Handle migration from old format
        setSnippets(parsedSnippets.map((snippet: any) => ({
          ...snippet,
          categoryId: snippet.categoryId || null
        })));
      } catch (e) {
        console.error('Error loading shortcuts snippets:', e);
        setSnippets([]);
      }
    }
    
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Error loading shortcuts categories:', e);
        setCategories([]);
      }
    }
  }, []);

  // Save data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('shortcutsLinks', JSON.stringify(links));
  }, [links]);
  
  useEffect(() => {
    localStorage.setItem('shortcutsSnippets', JSON.stringify(snippets));
  }, [snippets]);
  
  useEffect(() => {
    localStorage.setItem('shortcutsCategories', JSON.stringify(categories));
  }, [categories]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copiedSnippetId) {
      const timer = setTimeout(() => {
        setCopiedSnippetId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedSnippetId]);

  const addLink = () => {
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      const newLink: ShortcutLink = {
        id: Date.now().toString(),
        title: newLinkTitle,
        url: ensureHttpPrefix(newLinkUrl),
        categoryId: newLinkCategoryId,
      };
      setLinks([...links, newLink]);
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkCategoryId(null);
      setIsFormVisible(false);
    }
  };

  const addSnippet = () => {
    if (newSnippetTitle.trim() && newSnippetContent.trim()) {
      const newSnippet: TextSnippet = {
        id: Date.now().toString(),
        title: newSnippetTitle,
        content: newSnippetContent,
        categoryId: newSnippetCategoryId,
      };
      setSnippets([...snippets, newSnippet]);
      setNewSnippetTitle('');
      setNewSnippetContent('');
      setNewSnippetCategoryId(null);
      setIsFormVisible(false);
    }
  };

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: ShortcutCategory = {
        id: Date.now().toString(),
        name: newCategoryName,
        parentId: newCategoryParentId,
        expanded: true,
      };
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setNewCategoryParentId(null);
      setIsFormVisible(false);
    }
  };

  const updateLink = () => {
    if (editingLink && editingLink.title.trim() && editingLink.url.trim()) {
      setLinks(
        links.map((link) =>
          link.id === editingLink.id
            ? { ...editingLink, url: ensureHttpPrefix(editingLink.url) }
            : link
        )
      );
      setEditingLink(null);
    }
  };

  const updateSnippet = () => {
    if (editingSnippet && editingSnippet.title.trim() && editingSnippet.content.trim()) {
      setSnippets(
        snippets.map((snippet) =>
          snippet.id === editingSnippet.id
            ? editingSnippet
            : snippet
        )
      );
      setEditingSnippet(null);
    }
  };

  const updateCategory = () => {
    if (editingCategory && editingCategory.name.trim()) {
      // Check for circular dependency when changing parent
      if (wouldCreateCircularDependency(editingCategory.id, editingCategory.parentId)) {
        alert("This would create a circular dependency. Cannot set a category as a subcategory of itself or its descendants.");
        return;
      }
      
      setCategories(
        categories.map((category) =>
          category.id === editingCategory.id
            ? editingCategory
            : category
        )
      );
      setEditingCategory(null);
    }
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter((snippet) => snippet.id !== id));
  };

  const deleteCategory = (id: string) => {
    // First handle reassigning items
    setLinks(links.map(link => 
      link.categoryId === id ? { ...link, categoryId: null } : link
    ));
    
    setSnippets(snippets.map(snippet => 
      snippet.categoryId === id ? { ...snippet, categoryId: null } : snippet
    ));
    
    // Remove category and update parent references
    setCategories(categories.filter(category => category.id !== id)
      .map(category => 
        category.parentId === id ? { ...category, parentId: null } : category
      )
    );
  };

  const startEditingLink = (link: ShortcutLink) => {
    setEditingLink({ ...link });
  };

  const startEditingSnippet = (snippet: TextSnippet) => {
    setEditingSnippet({ ...snippet });
  };

  const startEditingCategory = (category: ShortcutCategory) => {
    setEditingCategory({ ...category });
  };

  const cancelEditingLink = () => {
    setEditingLink(null);
  };

  const cancelEditingSnippet = () => {
    setEditingSnippet(null);
  };

  const cancelEditingCategory = () => {
    setEditingCategory(null);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSnippetId(id);
    });
  };

  // Ensure URLs have http:// or https:// prefix
  const ensureHttpPrefix = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  const toggleCategoryExpanded = (categoryId: string) => {
    setCategories(
      categories.map((category) =>
        category.id === categoryId
          ? { ...category, expanded: !category.expanded }
          : category
      )
    );
  };

  // Get subcategories of a parent
  const getSubcategories = (parentId: string | null) => {
    return categories.filter(category => category.parentId === parentId);
  };

  // Check if a category would create circular dependency
  const wouldCreateCircularDependency = (categoryId: string, newParentId: string | null): boolean => {
    if (!newParentId) return false;
    if (newParentId === categoryId) return true;
    
    // Check if new parent is a descendant of the category
    const isDescendant = (parentId: string): boolean => {
      const children = categories.filter(c => c.parentId === categoryId);
      return children.some(child => 
        child.id === parentId || isDescendant(child.id)
      );
    };
    
    return isDescendant(newParentId);
  };

  // Get items for a specific category
  const getCategoryItems = (categoryId: string | null): ShortcutItemType[] => {
    const categoryLinks = links
      .filter(link => link.categoryId === categoryId)
      .map(link => ({ ...link, type: 'link' as const }));
      
    const categorySnippets = snippets
      .filter(snippet => snippet.categoryId === categoryId)
      .map(snippet => ({ ...snippet, type: 'snippet' as const }));
      
    return [...categoryLinks, ...categorySnippets];
  };

  // Recursively render a category and its items
  const renderCategory = (category: ShortcutCategory) => {
    const subcategories = getSubcategories(category.id);
    const items = getCategoryItems(category.id);
    
    return (
      <div key={category.id} className="mb-6 border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => toggleCategoryExpanded(category.id)}
          >
            {category.expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            <div className="flex items-center ml-1">
              <Folder size={18} className="text-yellow-500 mr-2" />
              <h3 className="text-lg font-medium">{category.name}</h3>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => startEditingCategory(category)}
              className="text-gray-500 hover:text-blue-500"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => deleteCategory(category.id)}
              className="text-gray-500 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {category.expanded && (
          <>
            {subcategories.length > 0 && (
              <div className="ml-6 mb-4">
                {subcategories.map(subcategory => renderCategory(subcategory))}
              </div>
            )}
            
            {items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-6">
                {items.map(item => renderShortcutItem(item))}
              </div>
            ) : subcategories.length === 0 && (
              <p className="text-sm text-gray-500 ml-6">No items in this category yet.</p>
            )}
          </>
        )}
      </div>
    );
  };

  // Render a specific shortcut item (link or snippet)
  const renderShortcutItem = (item: ShortcutItemType) => {
    if (item.type === 'link') {
      const link = item as ShortcutLink & { type: 'link' };
      return (
        <div
          key={`link-${link.id}`}
          className="border rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col bg-white"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <LinkIcon size={16} className="text-blue-500 mr-2 flex-shrink-0" />
              <h3 className="font-medium">{link.title}</h3>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => startEditingLink(link)}
                className="text-gray-500 hover:text-blue-500"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => deleteLink(link.id)}
                className="text-gray-500 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-center transition-colors text-sm"
          >
            Open <ExternalLink size={14} />
          </a>
        </div>
      );
    } else {
      const snippet = item as TextSnippet & { type: 'snippet' };
      return (
        <div
          key={`snippet-${snippet.id}`}
          className="border rounded-lg p-3 hover:shadow-md transition-shadow flex flex-col bg-white"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <FileText size={16} className="text-green-500 mr-2 flex-shrink-0" />
              <h3 className="font-medium">{snippet.title}</h3>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => startEditingSnippet(snippet)}
                className="text-gray-500 hover:text-blue-500"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => deleteSnippet(snippet.id)}
                className="text-gray-500 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <div className="mb-3 text-sm text-gray-600 overflow-hidden max-h-16">
            {snippet.content.length > 80 
              ? `${snippet.content.substring(0, 80)}...` 
              : snippet.content}
          </div>
          <button
            onClick={() => copyToClipboard(snippet.content, snippet.id)}
            className="mt-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-center transition-colors text-sm"
          >
            {copiedSnippetId === snippet.id ? (
              <>Copied! <Check size={14} /></>
            ) : (
              <>Copy <Copy size={14} /></>
            )}
          </button>
        </div>
      );
    }
  };

  // For category selection component
  const renderCategoryOptions = (parentId: string | null = null, depth = 0) => {
    const currentLevelCategories = categories.filter(cat => cat.parentId === parentId);
    
    return currentLevelCategories.map(category => (
      <React.Fragment key={category.id}>
        <option value={category.id}>
          {'\u00A0'.repeat(depth * 4)}{depth > 0 ? '↳ ' : ''}{category.name}
        </option>
        {renderCategoryOptions(category.id, depth + 1)}
      </React.Fragment>
    ));
  };

  const handleBackup = (method: 'download' | 'clipboard') => {
    const backupData = {
      links,
      snippets,
      categories,
      version: '1.0',
      timestamp: new Date().toISOString()
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    if (method === 'download') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shortcuts-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      navigator.clipboard.writeText(jsonString).then(() => {
        setShowBackupOptions(false);
      });
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Shortcuts</h2>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowBackupOptions(!showBackupOptions)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
            >
              <Download size={16} /> Backup
            </button>
            {showBackupOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border">
                <div className="py-1">
                  <button
                    onClick={() => handleBackup('download')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Download size={16} /> Download File
                  </button>
                  <button
                    onClick={() => handleBackup('clipboard')}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Clipboard size={16} /> Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={toggleFormVisibility}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            {isFormVisible ? (
              <>
                <ChevronUp size={16} /> Hide Form
              </>
            ) : (
              <>
                <Plus size={16} /> Add New
              </>
            )}
          </button>
        </div>
      </div>
      
      {isFormVisible && (
        <>
          {/* Add new item form selector */}
          <div className="flex border-b mb-6">
            <button
              className={`py-2 px-4 font-medium ${
                activeForm === 'link'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveForm('link')}
            >
              Add Link
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeForm === 'snippet'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveForm('snippet')}
            >
              Add Text Snippet
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeForm === 'category'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveForm('category')}
            >
              Add Category
            </button>
          </div>
          
          {/* Add new link form */}
          {activeForm === 'link' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Add New Link</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (optional)
                  </label>
                  <select
                    value={newLinkCategoryId || ""}
                    onChange={(e) => setNewLinkCategoryId(e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="">No category</option>
                    {renderCategoryOptions()}
                  </select>
                </div>
                <button
                  onClick={addLink}
                  disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                  className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                >
                  <Plus size={16} /> Add Link
                </button>
              </div>
            </div>
          )}
          
          {/* Add new snippet form */}
          {activeForm === 'snippet' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Add New Text Snippet</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={newSnippetTitle}
                  onChange={(e) => setNewSnippetTitle(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="Content"
                  value={newSnippetContent}
                  onChange={(e) => setNewSnippetContent(e.target.value)}
                  className="px-3 py-2 border rounded-md h-24 resize-y"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (optional)
                  </label>
                  <select
                    value={newSnippetCategoryId || ""}
                    onChange={(e) => setNewSnippetCategoryId(e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="">No category</option>
                    {renderCategoryOptions()}
                  </select>
                </div>
                <button
                  onClick={addSnippet}
                  disabled={!newSnippetTitle.trim() || !newSnippetContent.trim()}
                  className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                >
                  <Plus size={16} /> Add Snippet
                </button>
              </div>
            </div>
          )}
          
          {/* Add new category form */}
          {activeForm === 'category' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Add New Category</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category (optional)
                  </label>
                  <select
                    value={newCategoryParentId || ""}
                    onChange={(e) => setNewCategoryParentId(e.target.value || null)}
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="">Top Level (No Parent)</option>
                    {renderCategoryOptions()}
                  </select>
                </div>
                <button
                  onClick={addCategory}
                  disabled={!newCategoryName.trim()}
                  className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                >
                  <Plus size={16} /> Add Category
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit link modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Link</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Title"
                value={editingLink.title}
                onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="URL"
                value={editingLink.url}
                onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingLink.categoryId || ""}
                  onChange={(e) => setEditingLink({ ...editingLink, categoryId: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-md bg-white"
                >
                  <option value="">No category</option>
                  {renderCategoryOptions()}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={cancelEditingLink}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={updateLink}
                  disabled={!editingLink.title.trim() || !editingLink.url.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit snippet modal */}
      {editingSnippet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Snippet</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Title"
                value={editingSnippet.title}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, title: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
              <textarea
                placeholder="Content"
                value={editingSnippet.content}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, content: e.target.value })}
                className="px-3 py-2 border rounded-md h-32 resize-y"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={editingSnippet.categoryId || ""}
                  onChange={(e) => setEditingSnippet({ ...editingSnippet, categoryId: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-md bg-white"
                >
                  <option value="">No category</option>
                  {renderCategoryOptions()}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={cancelEditingSnippet}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={updateSnippet}
                  disabled={!editingSnippet.title.trim() || !editingSnippet.content.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit category modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Category</h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Category Name"
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  value={editingCategory.parentId || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, parentId: e.target.value || null })}
                  className="w-full px-3 py-2 border rounded-md bg-white"
                >
                  <option value="">Top Level (No Parent)</option>
                  {categories
                    .filter(cat => cat.id !== editingCategory.id) // Prevent selecting self
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  }
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={cancelEditingCategory}
                  className="px-4 py-2 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={updateCategory}
                  disabled={!editingCategory.name.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categorized Content */}
      <div className="mt-6">
        {/* Top-level categories */}
        {getSubcategories(null).map(category => renderCategory(category))}
        
        {/* Uncategorized items */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Uncategorized Items</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getCategoryItems(null).map(item => renderShortcutItem(item))}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {links.length === 0 && snippets.length === 0 && categories.length === 0 && (
        <div className="text-center text-gray-500 my-10">
          <p>No shortcuts added yet. Click the "Add New" button to add your first link, text snippet, or category.</p>
        </div>
      )}
    </div>
  );
}; 