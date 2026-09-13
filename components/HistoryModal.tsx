import React, { useState } from 'react';
import { HistoryEntry } from '../types';
import ConfirmationModal from './ConfirmationModal';
import DownloadIcon from './icons/DownloadIcon';
import TrashIcon from './icons/TrashIcon';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyForMonth: HistoryEntry[];
  monthKey: string;
  onClearHistory: () => void;
  onDownloadPdf: () => void;
}

const formatMonthKey = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, historyForMonth, monthKey, onClearHistory, onDownloadPdf }) => {
  const [isConfirmingClear, setConfirmingClear] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirmClear = () => {
    onClearHistory();
    setConfirmingClear(false);
  };
  
  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-gray-800 text-white rounded-lg shadow-xl p-8 w-full max-w-4xl border border-gray-700 flex flex-col"
          style={{ maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">History for {formatMonthKey(monthKey)}</h2>
            <div className="flex items-center space-x-2">
                <button onClick={onDownloadPdf} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 text-sm">
                    <DownloadIcon className="w-4 h-4 mr-2"/>
                    Download PDF
                </button>
                 <button onClick={() => setConfirmingClear(true)} className="inline-flex items-center px-3 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 text-sm">
                    <TrashIcon className="w-4 h-4 mr-2"/>
                    Clear History
                </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {historyForMonth.length === 0 ? (
                <div className="text-center text-gray-500 py-16">No history recorded for this month.</div>
            ) : (
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-4 py-3">Date</th>
                            <th scope="col" className="px-4 py-3">User</th>
                            <th scope="col" className="px-4 py-3">Action</th>
                            <th scope="col" className="px-4 py-3">Task</th>
                            <th scope="col" className="px-4 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyForMonth.map(entry => (
                            <tr key={entry.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                <td className="px-4 py-2 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-2 font-mono">{entry.user}</td>
                                <td className="px-4 py-2 capitalize font-semibold">{entry.action}</td>
                                <td className="px-4 py-2 break-all">{entry.taskText}</td>
                                <td className="px-4 py-2">{entry.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
          

          <div className="flex justify-end pt-6 mt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      <ConfirmationModal 
        isOpen={isConfirmingClear}
        onClose={() => setConfirmingClear(false)}
        onConfirm={handleConfirmClear}
        title="Clear History"
        message={`Are you sure you want to permanently delete all history entries for ${formatMonthKey(monthKey)}? This action cannot be undone.`}
      />
    </>
  );
};

export default HistoryModal;