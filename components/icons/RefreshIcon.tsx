import React from 'react';

interface RefreshIconProps {
  className?: string;
}

const RefreshIcon: React.FC<RefreshIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 19.5L20 20" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 4h-5v5M4 20h5v-5M20 4l-1.5 1.5A9 9 0 003.5 19.5L4 20" />
  </svg>
);

export default RefreshIcon;