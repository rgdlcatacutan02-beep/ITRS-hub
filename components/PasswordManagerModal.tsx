
import React, { useState, useEffect, useMemo } from 'react';
import { Credential } from '../types';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import KeyIcon from './icons/KeyIcon';
import EyeIcon from './icons/EyeIcon';
import EyeOffIcon from './icons/EyeOffIcon';
import ClipboardCopyIcon from './icons/ClipboardCopyIcon';
import ConfirmationModal from './ConfirmationModal';

interface PasswordManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: Credential[];
  onAdd: (credential: Omit<Credential, 'id' | 'owner'>) => void;
  onUpdate: (credential: Credential) => void;
  onDelete: (id: string) => void;
  currentUser: { 
    username: string; 
    permissions: {
        canViewFullAudit: boolean;
    } 
  };
}

const PasswordManagerModal: React.FC<PasswordManagerModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onAdd,
  onUpdate,
  onDelete,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCredential, setEditingCredential] = useState<Credential | 'new' | null>(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', notes: '' });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
        setSearchTerm('');
        setEditingCredential(null);
        setVisiblePasswords(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingCredential && editingCredential !== 'new') {
        setFormData({
            name: editingCredential.name,
            username: editingCredential.username,
            password: editingCredential.password || '',
            notes: editingCredential.notes || ''
        });
    } else {
        setFormData({ name: '', username: '', password: '', notes: '' });
    }
  }, [editingCredential]);

  const filteredCredentials = useMemo(() => {
    const accessibleCredentials = currentUser.permissions.canViewFullAudit 
      ? credentials 
      : credentials.filter(c => c.owner === currentUser.username);
      
    if (!searchTerm.trim()) return accessibleCredentials;
    
    return accessibleCredentials.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [credentials, searchTerm, currentUser]);
  
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCredential === 'new') {
      onAdd(formData);
    } else if (editingCredential) {
      onUpdate({ ...editingCredential, ...formData });
    }
    setEditingCredential(null);
  };

  const credentialToDelete = credentials.find(c => c.id === deletingId);

  const renderList = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
          <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Search workspace passwords..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
          </div>
          <button onClick={() => setEditingCredential('new')} className="ml-4 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 text-sm">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Entry
          </button>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {filteredCredentials.length > 0 ? filteredCredentials.map(c => {
            const canModify = currentUser.permissions.canViewFullAudit || c.owner === currentUser.username;
            return (
            <div key={c.id} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 animate-fade-in">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-white">{c.name}</h3>
                        <p className="text-[10px] text-gray-500 font-mono">ID: {c.id.substring(0,8)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {canModify ? (
                            <>
                                <button onClick={() => setEditingCredential(c)} className="p-1.5 text-gray-400 hover:text-white hover:bg-blue-500 rounded-full" title="Edit"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={() => setDeletingId(c.id)} className="p-1.5 text-gray-400 hover:text-white hover:bg-red-500 rounded-full" title="Delete"><TrashIcon className="w-4 h-4" /></button>
                            </>
                        ) : null}
                    </div>
                </div>
                <div className="mt-3 space-y-2">
                    <div className="flex items-center">
                        <input type="text" value={c.username} readOnly className="flex-1 bg-gray-600/50 border-gray-500 border rounded-l-md px-3 py-1.5 text-sm font-mono text-blue-300" />
                        <button onClick={() => handleCopy(c.username)} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-r-md transition-colors" title="Copy username">
                            {copied === c.username ? <span className="text-[10px] text-green-400">Copied!</span> : <ClipboardCopyIcon className="w-4 h-4"/>}
                        </button>
                    </div>
                     <div className="flex items-center">
                        <input type={visiblePasswords.has(c.id) ? 'text' : 'password'} value={c.password} readOnly className="flex-1 bg-gray-600/50 border-gray-500 border rounded-l-md px-3 py-1.5 text-sm font-mono text-red-300" />
                        <button onClick={() => togglePasswordVisibility(c.id)} className="p-2 bg-gray-600 hover:bg-gray-500 border-x border-gray-500" title={visiblePasswords.has(c.id) ? 'Hide' : 'Show'}>
                          {visiblePasswords.has(c.id) ? <EyeOffIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                        </button>
                        <button onClick={() => c.password && handleCopy(c.password)} className="p-2 bg-gray-600 hover:bg-gray-500 rounded-r-md transition-colors" title="Copy password">
                            {copied === c.password ? <span className="text-[10px] text-green-400">Copied!</span> : <ClipboardCopyIcon className="w-4 h-4"/>}
                        </button>
                    </div>
                </div>
                {c.notes && <p className="mt-2 text-xs text-gray-400 italic bg-gray-900/30 p-2 rounded border border-gray-700">{c.notes}</p>}
            </div>
            )
        }) : <p className="text-center text-gray-500 pt-10 text-sm">No entries matching your search.</p>}
      </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={handleFormSubmit} className="space-y-4 animate-fade-in">
      <h3 className="text-xl font-bold mb-4">{editingCredential === 'new' ? 'Create Password Entry' : 'Update Entry'}</h3>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Entry Name</label>
        <input name="name" value={formData.name} onChange={handleFormChange} required placeholder="e.g., Internal Server API" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">User Identifier</label>
        <input name="username" value={formData.username} onChange={handleFormChange} required placeholder="Username or ID" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Passphrase</label>
        <input name="password" type="password" value={formData.password} onChange={handleFormChange} placeholder="Password" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Additional Notes</label>
        <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={3} placeholder="Context or usage notes..." className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 resize-none" />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={() => setEditingCredential(null)} className="px-4 py-2 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors text-sm text-slate-300">Discard</button>
        <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all font-semibold text-sm text-white shadow-md shadow-indigo-600/25">Commit Entry</button>
      </div>
    </form>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-2xl flex flex-col border border-gray-700"
          style={{ height: '80vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
            <div className="flex items-center">
                <KeyIcon className="w-6 h-6 mr-3 text-red-500"/>
                <h2 className="text-2xl font-bold">Password Hub</h2>
            </div>
            <button onClick={onClose} className="px-4 py-2 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors text-xs font-semibold">
              Dismiss
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {editingCredential ? renderForm() : renderList()}
          </div>
        </div>
      </div>
      {deletingId && (
        <ConfirmationModal
            isOpen={!!deletingId}
            onClose={() => setDeletingId(null)}
            onConfirm={() => {
                onDelete(deletingId);
                setDeletingId(null);
            }}
            title="Remove Password Entry"
            message={`Are you sure you want to permanently remove "${credentialToDelete?.name}"? This action cannot be undone.`}
        />
      )}
    </>
  );
};

export default PasswordManagerModal;
