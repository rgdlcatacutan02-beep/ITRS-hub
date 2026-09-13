
import React, { useState, useEffect } from 'react';
import { ResourceItem } from '../types';

interface ResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Omit<ResourceItem, 'id' | 'owner'> | ResourceItem) => void;
  resource: ResourceItem | null;
  folderName: string;
}

const ResourceModal: React.FC<ResourceModalProps> = ({ isOpen, onClose, onSave, resource, folderName }) => {
  const [resourceType, setResourceType] = useState<'url' | 'file'>('url');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [displayOnDashboard, setDisplayOnDashboard] = useState(false);

  useEffect(() => {
    if (resource) {
      if (resource.fileContent && resource.fileName) {
        setResourceType('file');
        setFileName(resource.fileName);
        setLink('');
        setFile(null);
      } else {
        setResourceType('url');
        setLink(resource.link || '');
        setFileName('');
      }
      setName(resource.name);
      setDescription(resource.description);
      setDisplayOnDashboard(resource.displayOnDashboard || false);
    } else {
      // Reset for new resource
      setResourceType('url');
      setName('');
      setDescription('');
      setLink('');
      setFile(null);
      setFileName('');
      setDisplayOnDashboard(false);
    }
  }, [resource, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // localStorage typically has a 5MB limit. 
      // Base64 encoding adds ~33% overhead.
      // We warn if file + overhead likely exceeds limit.
      const limit = 3.5 * 1024 * 1024; // ~3.5MB to be safe with base64 overhead
      if (selectedFile.size > limit) { 
        alert("Warning: This file is quite large. Files over 3.5MB might fail to save to browser storage. Try using a URL link or a smaller file if possible.");
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Name is a required field.");
      return;
    }
    if (resourceType === 'url' && !link) {
      alert("Link is required for URL-type resources.");
      return;
    }
    if (resourceType === 'file' && !file && !resource?.fileName) {
      alert("A file upload is required for File-type resources.");
      return;
    }

    let resourceData: Partial<Omit<ResourceItem, 'id' | 'owner'>>;

    if (resourceType === 'file') {
      let fileContent = resource?.fileContent;
      let fileType = resource?.fileType;
      
      if (file) { // A new file was selected, or it's a new resource
        fileContent = await fileToBase64(file);
        fileType = file.type;
      }
      
      resourceData = { name, description, fileContent, fileName: fileName, fileType, link: undefined, displayOnDashboard };
    } else {
      resourceData = { name, description, link, fileContent: undefined, fileName: undefined, fileType: undefined, displayOnDashboard };
    }

    if (resource) {
      onSave({ ...resource, ...resourceData });
    } else {
      onSave(resourceData as Omit<ResourceItem, 'id' | 'owner'>);
    }
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
          {resource ? 'Edit Resource' : 'Add New Resource'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">in folder "{folderName}"</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Resource Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Google Chrome Enterprise"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description or installation instructions..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Resource Type</label>
            <div className="flex space-x-6 text-sm">
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input type="radio" value="url" checked={resourceType === 'url'} onChange={() => setResourceType('url')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                URL Link
              </label>
              <label className="flex items-center text-slate-300 cursor-pointer">
                <input type="radio" value="file" checked={resourceType === 'file'} onChange={() => setResourceType('file')} className="mr-2 text-indigo-600 focus:ring-indigo-500" />
                File Upload
              </label>
            </div>
          </div>
          
          {resourceType === 'url' ? (
            <div>
              <label htmlFor="link" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Destination Link (URL)</label>
              <input
                type="url"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required={resourceType === 'url'}
                placeholder="https://..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="file" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Upload File</label>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
              {fileName && <p className="text-xs text-indigo-400 mt-2">Selected: {fileName}</p>}
            </div>
          )}

          <div className="pt-2">
            <div className="flex items-center">
              <input
                id="display-dashboard-resource"
                type="checkbox"
                checked={displayOnDashboard}
                onChange={(e) => setDisplayOnDashboard(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="display-dashboard-resource" className="ml-3 block text-sm font-medium text-slate-300">
                Pin to Dashboard as Embedded View
              </label>
            </div>
          </div>
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
              {resource ? 'Save Changes' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceModal;
