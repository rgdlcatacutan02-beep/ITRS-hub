import React, { useRef } from 'react';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (fileContent: string) => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          onImport(text);
        } else {
          alert('Error: Could not read file content.');
        }
      };
      reader.readAsText(file);
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
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold tracking-tight mb-3">Cloud Snapshot & Backup</h2>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Export full workspace configuration, resources, setups, and accounts into a portable JSON manifest for backup or migration.
        </p>

        <div className="space-y-3">
          <button
            onClick={onExport}
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all active:scale-95"
          >
            <DownloadIcon className="w-4 h-4 mr-2.5" />
            Export Cloud Backup (JSON)
          </button>
          
          <button
            onClick={handleImportClick}
            className="w-full inline-flex items-center justify-center px-4 py-3 bg-slate-800 text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-700 border border-slate-700 transition-all active:scale-95"
          >
            <UploadIcon className="w-4 h-4 mr-2.5" />
            Restore from Backup File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileChange}
          />
        </div>

        <div className="mt-7 text-center">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;