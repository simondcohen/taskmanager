import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, ExternalLink } from 'lucide-react';

interface DashboardLink {
  id: string;
  title: string;
  url: string;
}

export const Dashboard: React.FC = () => {
  const [links, setLinks] = useState<DashboardLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingLink, setEditingLink] = useState<DashboardLink | null>(null);

  // Load links from localStorage on component mount
  useEffect(() => {
    const savedLinks = localStorage.getItem('dashboardLinks');
    if (savedLinks) {
      setLinks(JSON.parse(savedLinks));
    }
  }, []);

  // Save links to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboardLinks', JSON.stringify(links));
  }, [links]);

  const addLink = () => {
    if (newLinkTitle.trim() && newLinkUrl.trim()) {
      const newLink: DashboardLink = {
        id: Date.now().toString(),
        title: newLinkTitle,
        url: ensureHttpPrefix(newLinkUrl),
      };
      setLinks([...links, newLink]);
      setNewLinkTitle('');
      setNewLinkUrl('');
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

  const deleteLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
  };

  const startEditing = (link: DashboardLink) => {
    setEditingLink({ ...link });
  };

  const cancelEditing = () => {
    setEditingLink(null);
  };

  // Ensure URLs have http:// or https:// prefix
  const ensureHttpPrefix = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      
      {/* Add new link form */}
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
                  onClick={cancelEditing}
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

      {/* Links grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{link.title}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => startEditing(link)}
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
        ))}
      </div>

      {links.length === 0 && (
        <div className="text-center text-gray-500 my-10">
          <p>No links added yet. Add your first link above.</p>
        </div>
      )}
    </div>
  );
}; 