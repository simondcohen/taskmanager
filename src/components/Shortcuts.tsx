import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, ExternalLink, Copy, Check, FileText, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface ShortcutLink {
  id: string;
  title: string;
  url: string;
}

interface TextSnippet {
  id: string;
  title: string;
  content: string;
}

// Demo data for first-time users
const demoLinks: ShortcutLink[] = [
  {
    id: '1',
    title: 'Google Drive',
    url: 'https://drive.google.com',
  },
  {
    id: '2',
    title: 'Gmail',
    url: 'https://mail.google.com',
  },
  {
    id: '3',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
  },
  {
    id: '4',
    title: 'GitHub',
    url: 'https://github.com',
  },
];

const demoSnippets: TextSnippet[] = [
  {
    id: '1',
    title: 'Email Template',
    content: 'Dear [Name],\n\nThank you for reaching out. I appreciate your interest in [topic].\n\nBest regards,\n[Your Name]',
  },
  {
    id: '2',
    title: 'Meeting Agenda',
    content: '1. Review previous action items\n2. Project updates\n3. Discussion topics\n4. Action items for next meeting\n5. Next meeting date',
  },
  {
    id: '3',
    title: 'Weekly Status Update',
    content: 'This week I completed:\n- Task 1\n- Task 2\n\nNext week I plan to:\n- Task 3\n- Task 4\n\nBlocking issues:\n- None',
  },
];

export const Shortcuts: React.FC = () => {
  const [links, setLinks] = useState<ShortcutLink[]>([]);
  const [snippets, setSnippets] = useState<TextSnippet[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newSnippetTitle, setNewSnippetTitle] = useState('');
  const [newSnippetContent, setNewSnippetContent] = useState('');
  const [editingLink, setEditingLink] = useState<ShortcutLink | null>(null);
  const [editingSnippet, setEditingSnippet] = useState<TextSnippet | null>(null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<'link' | 'snippet'>('link');
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Load links from localStorage on component mount
  useEffect(() => {
    const savedLinks = localStorage.getItem('shortcutsLinks');
    const savedSnippets = localStorage.getItem('shortcutsSnippets');
    
    // If no saved data exists, load demo data
    if (!savedLinks && !savedSnippets) {
      setLinks(demoLinks);
      setSnippets(demoSnippets);
      localStorage.setItem('shortcutsLinks', JSON.stringify(demoLinks));
      localStorage.setItem('shortcutsSnippets', JSON.stringify(demoSnippets));
    } else {
      // Otherwise load saved data
      if (savedLinks) {
        setLinks(JSON.parse(savedLinks));
      }
      
      if (savedSnippets) {
        setSnippets(JSON.parse(savedSnippets));
      }
    }
  }, []);

  // Save links to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('shortcutsLinks', JSON.stringify(links));
  }, [links]);
  
  // Save snippets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('shortcutsSnippets', JSON.stringify(snippets));
  }, [snippets]);

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
      };
      setLinks([...links, newLink]);
      setNewLinkTitle('');
      setNewLinkUrl('');
      setIsFormVisible(false);
    }
  };

  const addSnippet = () => {
    if (newSnippetTitle.trim() && newSnippetContent.trim()) {
      const newSnippet: TextSnippet = {
        id: Date.now().toString(),
        title: newSnippetTitle,
        content: newSnippetContent,
      };
      setSnippets([...snippets, newSnippet]);
      setNewSnippetTitle('');
      setNewSnippetContent('');
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

  const deleteLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter((snippet) => snippet.id !== id));
  };

  const startEditingLink = (link: ShortcutLink) => {
    setEditingLink({ ...link });
  };

  const startEditingSnippet = (snippet: TextSnippet) => {
    setEditingSnippet({ ...snippet });
  };

  const cancelEditingLink = () => {
    setEditingLink(null);
  };

  const cancelEditingSnippet = () => {
    setEditingSnippet(null);
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Shortcuts</h2>
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
          </div>
          
          {/* Add new item form */}
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

      {/* Combined Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {/* Display links and snippets */}
        {[...links.map(item => ({ ...item, type: 'link' })), ...snippets.map(item => ({ ...item, type: 'snippet' }))].map((item) => {
          if (item.type === 'link') {
            const link = item as ShortcutLink & { type: string };
            return (
              <div
                key={`link-${link.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
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
                  className="mt-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-center transition-colors"
                >
                  Open <ExternalLink size={16} />
                </a>
              </div>
            );
          } else {
            const snippet = item as TextSnippet & { type: string };
            return (
              <div
                key={`snippet-${snippet.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
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
                <div className="mb-3 text-sm text-gray-600 overflow-hidden max-h-20">
                  {snippet.content.length > 100 
                    ? `${snippet.content.substring(0, 100)}...` 
                    : snippet.content}
                </div>
                <button
                  onClick={() => copyToClipboard(snippet.content, snippet.id)}
                  className="mt-auto flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-center transition-colors"
                >
                  {copiedSnippetId === snippet.id ? (
                    <>Copied! <Check size={16} /></>
                  ) : (
                    <>Copy <Copy size={16} /></>
                  )}
                </button>
              </div>
            );
          }
        })}
      </div>

      {/* Empty state */}
      {links.length === 0 && snippets.length === 0 && (
        <div className="text-center text-gray-500 my-10">
          <p>No shortcuts added yet. Click the "Add New" button to add your first link or text snippet.</p>
        </div>
      )}
    </div>
  );
}; 