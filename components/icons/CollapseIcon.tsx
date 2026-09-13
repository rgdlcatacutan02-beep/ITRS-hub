import React from 'react';

const CollapseIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 4v4H4m12-4v4h4M8 20v-4H4m12 4v-4h4"
    />
  </svg>
);

export default CollapseIcon;