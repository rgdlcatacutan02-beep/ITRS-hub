import React from 'react';
import { AppTasks, daysOfWeek, CustomTaskGroup, WeeklyTaskGroup } from '../types';
import TaskList from './TaskList';

interface AdminTaskViewerProps {
    tasks: AppTasks;
}

const formatMonthKey = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const AdminTaskViewer: React.FC<AdminTaskViewerProps> = ({ tasks }) => {
    
    const emptyHandlers = {
        onToggleTask: () => {},
        onUpdateTask: () => {},
        onDeleteTask: () => {},
        onAddSubTask: () => {},
        onToggleTaskRepetitive: () => {},
        onUpdateTaskPriority: () => {},
    };

    const sortedMonthKeys = Object.keys(tasks.monthly).sort((a, b) => b.localeCompare(a));

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-300 border-b border-gray-600 pb-2">Daily Tasks</h3>
                {tasks.daily.length > 0 ? (
                    <TaskList {...emptyHandlers} tasks={tasks.daily} isReadOnly />
                ) : (
                    <p className="text-sm text-gray-500">No daily tasks.</p>
                )}
            </div>
            
            <div>
                 <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">Monthly Tasks</h3>
                 {sortedMonthKeys.length > 0 ? (
                    <div className="space-y-4 mt-2">
                        {sortedMonthKeys.map(monthKey => {
                            const monthData = tasks.monthly[monthKey];
                            return (
                                <details key={monthKey} className="bg-gray-700/30 p-3 rounded-md" open={new Date().toISOString().slice(0, 7) === monthKey}>
                                    <summary className="font-semibold text-md text-white cursor-pointer">{formatMonthKey(monthKey)}</summary>
                                    <div className="mt-4 pl-2 space-y-4">
                                        <div>
                                            <h4 className="text-md font-semibold text-gray-400">General Tasks</h4>
                                            {monthData.generalTasks.length > 0 ? <TaskList {...emptyHandlers} tasks={monthData.generalTasks} isReadOnly /> : <p className="text-sm text-gray-500 mt-1">None</p>}
                                        </div>
                                        {monthData.groups.map(group => (
                                            <div key={group.id}>
                                                <h4 className="text-md font-semibold text-gray-400">{group.name} <span className="text-xs uppercase">({group.type})</span></h4>
                                                {group.type === 'custom' ? (
                                                     (group as CustomTaskGroup).tasks?.length > 0 ? <TaskList {...emptyHandlers} tasks={(group as CustomTaskGroup).tasks} isReadOnly /> : <p className="text-sm text-gray-500 mt-1">None</p>
                                                ) : (
                                                    <div className="pl-2 space-y-2 mt-1">
                                                        {daysOfWeek.map(day => {
                                                            const dayTasks = (group as WeeklyTaskGroup).days?.[day] ?? [];
                                                            return (
                                                                <div key={day}>
                                                                    <h5 className="text-sm font-bold capitalize text-gray-500">{day}</h5>
                                                                    {dayTasks.length > 0 ? <TaskList {...emptyHandlers} tasks={dayTasks} isReadOnly /> : <p className="text-xs text-gray-600 mt-1">None</p>}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )
                        })}
                    </div>
                 ) : (
                    <p className="text-sm text-gray-500 mt-2">No monthly tasks recorded.</p>
                 )}
            </div>
        </div>
    );
}

export default AdminTaskViewer;