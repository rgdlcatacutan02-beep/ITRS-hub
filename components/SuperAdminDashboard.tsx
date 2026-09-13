import React from 'react';
import { AdminUser, AppTasks } from '../types';
import AdminTaskViewer from './AdminTaskViewer';
import UserIcon from './icons/UserIcon';

interface SuperAdminDashboardProps {
    admins: Omit<AdminUser, 'password'>[];
    userTasks: { [username: string]: AppTasks };
    currentUserUsername: string;
    userActivity: { [username: string]: string };
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ admins, userTasks, currentUserUsername, userActivity }) => {
    
    const today = new Date().toISOString().slice(0, 10);
    const adminsOnLeaveToday = new Set(
        (Object.values(userTasks) as AppTasks[])
            .flatMap(t => t.dayOffs)
            .filter(d => d.status === 'approved' && d.date === today)
            .map(d => d.username)
    );

    const otherAdmins = admins.filter(a => a.username !== currentUserUsername);
    const now = new Date().getTime();

    return (
        <div className="space-y-8 mb-8">
            {/* Admin Status Overview */}
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">IT Specialist Status - Today</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {admins.map(admin => {
                        const isOnLeave = adminsOnLeaveToday.has(admin.username);
                        let statusText = 'Inactive';
                        let statusColor = 'bg-gray-500 text-gray-200';

                        if (isOnLeave) {
                            statusText = 'On Leave';
                            statusColor = 'bg-yellow-500 text-gray-900';
                        } else {
                            const lastActivity = userActivity[admin.username];
                            if (lastActivity) {
                                const lastActivityTime = new Date(lastActivity).getTime();
                                // If active in the last 5 minutes (300,000 ms)
                                if (now - lastActivityTime < 300000) {
                                    statusText = 'Active';
                                    statusColor = 'bg-green-500 text-white';
                                }
                            }
                        }

                        return (
                            <div key={admin.username} className="flex items-center p-3 bg-gray-700/50 rounded-md">
                                <UserIcon className="w-5 h-5 mr-3 text-gray-400"/>
                                <div className="flex-1">
                                   <p className="text-sm font-semibold text-white truncate">{admin.username}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
                                    {statusText}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Admin Task Viewer */}
            <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Admin Task Viewer</h2>
                <div className="space-y-2">
                    {otherAdmins.length > 0 ? otherAdmins.map(admin => {
                         const tasksForAdmin = userTasks[admin.username] || { daily: [], monthly: {}, dayOffs: [] };
                         return (
                            <details key={admin.username} className="bg-gray-900/50 rounded-lg border border-gray-700">
                                <summary className="p-4 cursor-pointer text-white font-semibold flex justify-between items-center hover:bg-gray-700/50 rounded-t-lg">
                                    <span>{admin.username}'s Tasks</span>
                                    <span className="text-xs text-gray-400 group-open:hidden">Click to expand</span>
                                </summary>
                                <div className="p-4 border-t border-gray-700">
                                    <AdminTaskViewer tasks={tasksForAdmin} />
                                </div>
                            </details>
                         )
                    }) : <p className="text-gray-400">There are no other admins to display.</p>}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;