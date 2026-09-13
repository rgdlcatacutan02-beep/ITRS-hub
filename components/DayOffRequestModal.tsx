
import React, { useState } from 'react';
import { DayOffRequest } from '../types';

interface DayOffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<DayOffRequest, 'id' | 'username'>) => void;
  approvedDays: string[];
}

const DayOffRequestModal: React.FC<DayOffRequestModalProps> = ({ isOpen, onClose, onSubmit, approvedDays }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [requestType, setRequestType] = useState<'fixed' | 'request'>('request');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
        alert('Please select a date.');
        return;
    }
    if (approvedDays.includes(selectedDate)) {
        alert('You already have an approved day off on this date.');
        return;
    }
    const isFixed = requestType === 'fixed';
    onSubmit({
        date: selectedDate,
        type: requestType,
        status: isFixed ? 'approved' : 'pending',
        reason: isFixed ? 'Fixed Day Off' : reason,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 text-white rounded-lg shadow-xl p-8 w-full max-w-md border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">
          Request a Day Off
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="dayoff-date" className="block text-sm font-medium text-gray-300 mb-1">Select Date</label>
            <input
                type="date"
                id="dayoff-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
            />
             {approvedDays.includes(selectedDate) && (
                <p className="text-xs text-yellow-400 mt-1">You already have an approved day off on this date.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Request Type</label>
            <div className="flex space-x-4">
                <label className="flex items-center">
                    <input type="radio" value="request" checked={requestType === 'request'} onChange={() => setRequestType('request')} className="mr-2 bg-gray-700 text-red-500 focus:ring-red-500"/>
                    Request Day Off (Requires Super Admin approval)
                </label>
            </div>
             <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                    <input type="radio" value="fixed" checked={requestType === 'fixed'} onChange={() => setRequestType('fixed')} className="mr-2 bg-gray-700 text-red-500 focus:ring-red-500"/>
                    Fixed Day Off (Auto-approved)
                </label>
            </div>
          </div>
          {requestType === 'request' && (
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-1">Reason (Optional)</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Doctor's appointment"
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={approvedDays.includes(selectedDate)}
              className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DayOffRequestModal;
