import React, { useState, useEffect } from 'react';
import { Folder } from '../types';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folderData: Omit<Folder, 'id' | 'items' | 'owner'>) => void;
  folder: Folder | null;
  categoryName: string;
}

const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, onSave, folder, categoryName }) => {
  const [name, setName] = useState('');
  const [displayOnDashboard, setDisplayOnDashboard] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDisplayOnDashboard(folder.displayOnDashboard || false);
      setIframeUrl(folder.iframeUrl || '');
    } else {
      setName('');
      setDisplayOnDashboard(false);
      setIframeUrl('');
    }
  }, [folder, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        alert("Name is a required field.");
        return;
    }
    if (displayOnDashboard && !iframeUrl) {
      alert("Iframe URL is required when 'Show on Dashboard' is checked.");
      return;
    }
    onSave({ 
      name, 
      displayOnDashboard, 
      iframeUrl: displayOnDashboard ? iframeUrl : '' 
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 text-white rounded-2xl shadow-2xl p-7 w-full max-w-md border border-slate-700/80"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1 tracking-tight">
          {folder ? 'Edit Folder' : 'Add New Folder'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">in category "{categoryName}"</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Folder Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Workstation Utilities"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="pt-2">
              <div className="flex items-center">
                  <input
                      id="display-dashboard"
                      type="checkbox"
                      checked={displayOnDashboard}
                      onChange={(e) => setDisplayOnDashboard(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="display-dashboard" className="ml-3 block text-sm font-medium text-slate-300">
                      Show on Dashboard as an Embedded View
                  </label>
              </div>
          </div>
          {displayOnDashboard && (
              <div>
                  <label htmlFor="iframeUrl" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Embedded URL</label>
                  <input
                      type="url"
                      id="iframeUrl"
                      value={iframeUrl}
                      onChange={(e) => setIframeUrl(e.target.value)}
                      placeholder="https://example.com"
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
              </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-sm text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-95"
            >
              {folder ? 'Save Changes' : 'Add Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderModal;
