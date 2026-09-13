import React from 'react';

interface ArrowUpIconProps {
  className?: string;
}

const ArrowUpIcon: React.FC<ArrowUpIconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 15l7-7 7 7"
    />
  </svg>
);

export default ArrowUpIcon;
