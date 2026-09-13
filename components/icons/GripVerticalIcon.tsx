import React from 'react';

interface GripVerticalIconProps {
  className?: string;
}

const GripVerticalIcon: React.FC<GripVerticalIconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6m-6 4h6m-6 4h6m-6 4h6" transform="translate(-3, 2) rotate(90 12 12)" />
  </svg>
);

export default GripVerticalIcon;