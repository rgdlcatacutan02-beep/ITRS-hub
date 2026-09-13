import React from 'react';

interface SubdirectoryArrowRightIconProps {
  className?: string;
}

const SubdirectoryArrowRightIcon: React.FC<SubdirectoryArrowRightIconProps> = ({ className = "w-6 h-6" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M19 15l-6 6-1.42-1.42L15.17 16H4V4h2v10h9.17l-3.59-3.58L13 9l6 6z" />
  </svg>
);

export default SubdirectoryArrowRightIcon;
