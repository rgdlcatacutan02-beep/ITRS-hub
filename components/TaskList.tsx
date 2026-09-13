import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskPriority } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import CircleIcon from './icons/CircleIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import PlusIcon from './icons/PlusIcon';
import SubdirectoryArrowRightIcon from './icons/SubdirectoryArrowRightIcon';
import RefreshIcon from './icons/RefreshIcon';
import ConfirmationModal from './ConfirmationModal';
import FlagIcon from './icons/FlagIcon';
import LocationMarkerIcon from './icons/LocationMarkerIcon';

const priorityCycle: TaskPriority[] = ['low', 'medium', 'high'];

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (task: Task) => void;
  onUpdateTask: (taskId: string, newText: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubTask: (parentTaskId: string, text: string) => void;
  onToggleTaskRepetitive: (taskId: string) => void;
  onUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  isSubList?: boolean;
  isReadOnly?: boolean;
}

const TaskItem: React.FC<{ task: Task } & Omit<TaskListProps, 'tasks' | 'isSubList'>> = ({
  task,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddSubTask,
  onToggleTaskRepetitive,
  onUpdateTaskPriority,
  isReadOnly,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskText, setSubtaskText] = useState('');
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const addSubtaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && !isReadOnly) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [isEditing, isReadOnly]);

  useEffect(() => {
    if (isAddingSubtask && !isReadOnly) {
      addSubtaskInputRef.current?.focus();
    }
  }, [isAddingSubtask, isReadOnly]);

  const handleEditBlur = () => {
    if (isReadOnly) return;
    if (editText.trim() && editText.trim() !== task.text) {
      onUpdateTask(task.id, editText.trim());
    } else {
      setEditText(task.text);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    if (e.key === 'Enter') handleEditBlur();
    if (e.key === 'Escape') {
      setEditText(task.text);
      setIsEditing(false);
    }
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (subtaskText.trim()) {
      onAddSubTask(task.id, subtaskText.trim());
      setSubtaskText('');
      setIsAddingSubtask(false);
    }
  };

  const handlePriorityCycle = () => {
    if (isReadOnly) return;
    const currentPriority = task.priority || 'medium';
    const currentIndex = priorityCycle.indexOf(currentPriority);
    const nextIndex = (currentIndex + 1) % priorityCycle.length;
    onUpdateTaskPriority(task.id, priorityCycle[nextIndex]);
  };
  
  const handleDoubleClick = () => {
      if (!isReadOnly) {
          setIsEditing(true);
      }
  }

  return (
    <div className={`group ${task.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700/50 transition-colors">
        <button onClick={() => !isReadOnly && onToggleTask(task)} disabled={isReadOnly} title={task.completed ? 'Mark as incomplete' : 'Mark as complete'} className={isReadOnly ? 'cursor-default' : ''}>
          {task.completed ? <CheckCircleIcon className="w-6 h-6 text-green-500" /> : <CircleIcon className="w-6 h-6 text-gray-500 group-hover:text-gray-300" />}
        </button>
        <div className="flex-1 flex items-center space-x-2">
            <button onClick={handlePriorityCycle} disabled={isReadOnly} title={`Priority: ${task.priority || 'medium'}. Click to change.`} className={isReadOnly ? 'cursor-default' : ''}>
                <FlagIcon className="w-4 h-4" priority={task.priority || 'medium'} />
            </button>
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEditBlur}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
            />
          ) : (
             <div onDoubleClick={handleDoubleClick} className={`flex-1 ${!isReadOnly ? 'cursor-pointer' : ''}`}>
                <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>{task.text}</span>
                 {task.location && (
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                        <LocationMarkerIcon className="w-3 h-3 mr-1.5 text-red-400" />
                        <span>{task.location}</span>
                    </div>
                )}
            </div>
          )}
        </div>
        {!isReadOnly && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.isRepetitive !== undefined && (
                <button onClick={() => onToggleTaskRepetitive(task.id)} className="p-1.5 text-gray-400 hover:text-white" title={task.isRepetitive ? 'Make one-time task' : 'Make repetitive task'}>
                    <RefreshIcon className={`w-4 h-4 ${task.isRepetitive ? 'text-blue-400' : ''}`} />
                </button>
            )}
            <button onClick={() => setIsAddingSubtask(v => !v)} className="p-1.5 text-gray-400 hover:text-white" title="Add sub-task">
                <PlusIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-white" title="Edit task">
                <PencilIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setDeletingTask(task)} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete task">
                <TrashIcon className="w-4 h-4" />
            </button>
            </div>
        )}
      </div>
      {(isAddingSubtask && !isReadOnly) && (
        <form onSubmit={handleAddSubtaskSubmit} className="ml-9 my-1 flex items-center space-x-2">
           <SubdirectoryArrowRightIcon className="w-5 h-5 text-gray-500" />
           <input
              ref={addSubtaskInputRef}
              type="text"
              placeholder="New sub-task..."
              value={subtaskText}
              onChange={(e) => setSubtaskText(e.target.value)}
              onBlur={() => { if(!subtaskText) setIsAddingSubtask(false); }}
              className="flex-1 bg-gray-600 text-white rounded px-2 py-1 text-sm"
            />
            <button type="submit" className="px-2 py-1 bg-red-600 text-xs rounded hover:bg-red-500">Add</button>
        </form>
      )}
      {task.subTasks && task.subTasks.length > 0 && (
        <div className="pl-6 border-l-2 border-gray-700 ml-3">
          <TaskList
            tasks={task.subTasks}
            onToggleTask={onToggleTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onAddSubTask={onAddSubTask}
            onToggleTaskRepetitive={onToggleTaskRepetitive}
            onUpdateTaskPriority={onUpdateTaskPriority}
            isSubList
            isReadOnly={isReadOnly}
          />
        </div>
      )}
      {deletingTask && <ConfirmationModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={() => {
          onDeleteTask(deletingTask.id);
          setDeletingTask(null);
        }}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${deletingTask.text}"? All sub-tasks will also be deleted.`}
        />}
    </div>
  );
};


const TaskList: React.FC<TaskListProps> = (props) => {
  return (
    <div className="space-y-1">
      {props.tasks.map(task => (
        <TaskItem key={task.id} task={task} {...props} />
      ))}
    </div>
  );
};

export default TaskList;