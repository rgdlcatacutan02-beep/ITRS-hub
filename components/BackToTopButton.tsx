import React from 'react';
import ArrowUpIcon from './icons/ArrowUpIcon';

interface BackToTopButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

const BackToTopButton: React.FC<BackToTopButtonProps> = ({ isVisible, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-8 right-8 bg-indigo-600 text-white rounded-2xl p-3.5 shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 z-30 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUpIcon className="w-6 h-6" />
    </button>
  );
};

export default BackToTopButton;
