import React, { useState, useEffect, useCallback } from 'react';

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


interface NotepadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  onSave: (content: string) => void;
}

const NotepadModal: React.FC<NotepadModalProps> = ({ isOpen, onClose, initialContent = '', onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, isOpen]);
  
  // Auto-save effect
  useEffect(() => {
    if (isOpen) {
        onSave(debouncedContent);
        if (debouncedContent === initialContent) {
          // If content hasn't changed from initial, don't update timestamp
        } else {
          setLastSaved(new Date());
        }
    }
  }, [debouncedContent, isOpen, onSave, initialContent]);


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl flex flex-col border border-slate-700/80"
        style={{ height: '75vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight">IT Operations Scratchpad</h2>
            <span className="text-xs text-indigo-400 font-mono">
                {lastSaved ? `Last auto-saved: ${lastSaved.toLocaleTimeString()}` : 'Auto-saved locally'}
            </span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm leading-relaxed font-mono text-slate-200"
          placeholder="Type operational notes, terminal snippets, or technician scratch data here..."
        />
        <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotepadModal;