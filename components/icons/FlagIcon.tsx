import React from 'react';
import { TaskPriority } from '../../types';

interface FlagIconProps {
  className?: string;
  priority: TaskPriority;
}

const priorityColors: { [key in TaskPriority]: string } = {
  high: 'text-red-500',
  medium: 'text-yellow-400',
  low: 'text-green-500',
};

const FlagIcon: React.FC<FlagIconProps> = ({ className = "w-6 h-6", priority }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={`${className} ${priorityColors[priority]}`}
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
  </svg>
);

export default FlagIcon;