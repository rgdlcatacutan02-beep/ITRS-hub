
import React, { useState, useMemo } from 'react';
import { AppTasks, HistoryEntry, ResourceCategory, TaskPriority, Folder, ResourceItem, DayOffRequest, MonthlyTasks, AdminUser, daysOfWeek, Task, BrandingConfig, UserRole } from '../types';
import TaskDashboard from './TaskDashboard';
import ITRSHubLogo from './icons/ITRSHubLogo';
import DashboardIcon from './icons/DashboardIcon';
import ClockIcon from './icons/ClockIcon';
import StarIcon from './icons/StarIcon';
import LinkIcon from './icons/LinkIcon';
import GripVerticalIcon from './icons/GripVerticalIcon';
import CloseIcon from './icons/CloseIcon';
import SuperAdminDashboard from './SuperAdminDashboard';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ExpandIcon from './icons/ExpandIcon';
import CollapseIcon from './icons/CollapseIcon';

type DashboardItem = (Folder & { itemType: 'folder' }) | (ResourceItem & { itemType: 'resource' });

interface HomeDashboardProps {
  appTitle: string;
  categories: ResourceCategory[];
  resourceCount: number;
  tasks: AppTasks; 
  userTasks: { [username: string]: AppTasks }; 
  admins: Omit<AdminUser, 'password'>[];
  history: HistoryEntry[];
  dashboardWidgetOrder?: string[];
  branding?: BrandingConfig;
  onAddTask: (text: string, isRepetitive: boolean | undefined, monthKey: string | null, groupId: string | null, dayOfWeek?: any, location?: string) => void;
  onAddSubTask: (parentTaskId: string, text: string) => void;
  onToggleTask: (task: Task) => void;
  onUpdateTask: (taskId: string, newText: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskRepetitive: (taskId: string) => void;
  onAddGroup: (monthKey: string, name: string, type: 'custom' | 'weekly') => void;
  onUpdateGroup: (monthKey: string, groupId: string, newName: string) => void;
  onDeleteGroup: (monthKey: string, groupId: string) => void;
  onUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  onClearHistoryForMonth: (monthKey: string) => void;
  onReorderDashboardWidgets: (draggedId: string, targetId: string) => void;
  onUpdateResource: (folderId: string, item: ResourceItem) => void;
  onUpdateFolder: (folderId: string, folderData: Partial<Omit<Folder, 'id' | 'items' | 'owner'>>) => void;
  isAdminMode: boolean;
  currentUserRole: UserRole | null;
  currentUsername: string | null;
  onAddDayOffRequest: (request: any) => void;
  onUpdateDayOffStatus: (requestId: string, status: 'approved' | 'rejected') => void;
  userActivity: { [username: string]: string };
  onStartTour: () => void;
}

const IframeWidget: React.FC<{
    item: DashboardItem,
    isEditing: boolean,
    onRemove: () => void,
    onFocus: (id: string) => void,
    onDragStart: (e: React.DragEvent) => void,
    onDragOver: (e: React.DragEvent) => void,
    onDrop: (e: React.DragEvent) => void
}> =
  ({ item, isEditing, onRemove, onFocus, ...dragProps }) => {
  
  // FIX: If it's a resource with fileContent, use the base64 data URI
  const url = item.itemType === 'folder' 
    ? item.iframeUrl 
    : (item.link || item.fileContent);

  if (!url) return null;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full relative" {...dragProps} draggable={isEditing}>
      <div className="p-3 bg-gray-700/50 flex items-center justify-between text-white font-semibold">
        <span className="truncate">{item.name}</span>
         <div className="flex items-center space-x-1">
            {!isEditing && (
                <button onClick={() => onFocus(item.id)} className="p-1 text-gray-400 hover:text-white hover:bg-blue-500 rounded-full" title="Expand Widget">
                    <ExpandIcon className="w-4 h-4" />
                </button>
            )}
            {isEditing && (
                <>
                    <button onClick={onRemove} className="p-1 text-gray-400 hover:text-white hover:bg-red-500 rounded-full" title="Remove from dashboard">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                    <div className="cursor-move p-1 text-gray-400 hover:text-white" title="Drag to reorder">
                        <GripVerticalIcon className="w-5 h-5" />
                    </div>
                </>
            )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-white">
        <iframe src={url} className="w-full h-full border-0" title={item.name} />
      </div>
    </div>
  );
};

const DayOffManagementWidget: React.FC<{
    dayOffs: DayOffRequest[];
    onUpdateDayOffStatus: (id: string, status: 'approved' | 'rejected') => void;
}> = ({ dayOffs, onUpdateDayOffStatus }) => {
    const pendingRequests = dayOffs.filter(r => r.status === 'pending');

    if (pendingRequests.length === 0) {
        return (
             <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-2">Leave Requests</h2>
                <p className="text-gray-400">No pending requests to review.</p>
             </div>
        )
    }

    return (
        <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Leave Requests ({pendingRequests.length})</h2>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {pendingRequests.map(req => (
                    <div key={req.id} className="bg-gray-700/50 p-3 rounded-md">
                        <div className="flex justify-between items-start">
                           <div>
                                <p><span className="font-bold text-white">{req.username}</span> requested a day off.</p>
                                <p className="text-sm text-gray-300">Date: <span className="font-mono">{req.date}</span></p>
                                {req.reason && <p className="text-xs text-gray-400 mt-1">Reason: {req.reason}</p>}
                           </div>
                            <div className="flex space-x-2 flex-shrink-0 ml-4">
                                <button onClick={() => onUpdateDayOffStatus(req.id, 'approved')} className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-md hover:bg-green-500">Approve</button>
                                <button onClick={() => onUpdateDayOffStatus(req.id, 'rejected')} className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-500">Reject</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

const HomeDashboard: React.FC<HomeDashboardProps> = (props) => {
  const { appTitle, categories, resourceCount, isAdminMode, currentUserRole, currentUsername, branding } = props;
  const { onUpdateFolder, onUpdateResource, onReorderDashboardWidgets, dashboardWidgetOrder = [], onStartTour } = props;

  const [isEditingWidgets, setIsEditingWidgets] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);


  const dashboardItems = useMemo((): DashboardItem[] => {
    const items: DashboardItem[] = [];
    if (!currentUsername) return [];

    const isSuperAdmin = currentUserRole === 'superadmin';

    for (const category of categories) {
        for (const folder of category.folders) {
            if (folder.displayOnDashboard) {
                const isOwner = folder.owner === currentUsername;
                const noOwner = !folder.owner;
                if (isSuperAdmin || isOwner || noOwner) {
                    items.push({ ...folder, itemType: 'folder' });
                }
            }
            for (const resource of folder.items) {
                if (resource.displayOnDashboard) {
                    const isOwner = resource.owner === currentUsername;
                    if (isSuperAdmin || isOwner) {
                        items.push({ ...resource, itemType: 'resource' });
                    }
                }
            }
        }
    }

    const orderedItems = [...items].sort((a, b) => {
        const indexA = dashboardWidgetOrder.indexOf(a.id);
        const indexB = dashboardWidgetOrder.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return orderedItems;
  }, [categories, dashboardWidgetOrder, currentUsername, currentUserRole]);
  
  const focusedItem = useMemo(() => {
    if (!focusedWidgetId) return null;
    return dashboardItems.find(item => item.id === focusedWidgetId);
  }, [focusedWidgetId, dashboardItems]);


  const findResourceFolder = (resourceId: string): { folder?: Folder } => {
    for (const category of categories) {
        for (const folder of category.folders) {
            if (folder.items.some(item => item.id === resourceId)) {
                return { folder };
            }
        }
    }
    return {};
  };

  const handleRemoveWidget = (item: DashboardItem) => {
    if (item.itemType === 'folder') {
        onUpdateFolder(item.id, { displayOnDashboard: false, iframeUrl: '' });
    } else {
        const { folder } = findResourceFolder(item.id);
        if(folder) {
            const { itemType, ...resourceItem } = item;
            onUpdateResource(folder.id, { ...resourceItem, displayOnDashboard: false });
        }
    }
  };

  const handleWidgetDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleWidgetDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedWidgetId && draggedWidgetId !== targetId) {
        onReorderDashboardWidgets(draggedWidgetId, targetId);
    }
    setDraggedWidgetId(null);
  };

  const totalTasks = useMemo(() => {
    const userTaskData = props.tasks;
    let count = userTaskData.daily.length;
    // FIX: Cast Object.values result to MonthlyTasks[] to avoid 'unknown' type error during property access
    (Object.values(userTaskData.monthly) as MonthlyTasks[]).forEach(month => {
      count += month.generalTasks.length;
      month.groups.forEach(group => {
        if (group.type === 'custom') count += group.tasks.length;
        // FIX: Cast Object.values result to Task[][] to avoid 'unknown' type error during property access
        else (Object.values(group.days) as Task[][]).forEach(d => count += d.length);
      });
    });
    return count;
  }, [props.tasks]);

  const allDayOffs = useMemo(() => {
    // FIX: Cast Object.values result to AppTasks[] to avoid 'unknown' type error during property access
    return (Object.values(props.userTasks) as AppTasks[]).flatMap(t => t.dayOffs);
  }, [props.userTasks]);

  const { featuredResources, recentResources } = useMemo(() => {
    const allItems = categories.flatMap(c => c.folders.flatMap(f => f.items));
    const featured = allItems.filter(item => ["brw_chrome", "sec_malwarebytes", "prod_7zip", "it_vscode"].includes(item.id));
    const recent = [...allItems].slice(-4).reverse();
    return { featuredResources: featured, recentResources: recent };
  }, [categories]);


  return (
    <div className="p-4 sm:p-8 h-full overflow-y-auto space-y-6">
      {isAdminMode ? (
        <>
            <div className="p-6 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl shadow-black/20 animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <ITRSHubLogo className="w-12 h-12 flex-shrink-0" customLogo={branding?.logo} />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          Welcome back, <span className="text-indigo-400">{currentUsername}</span>!
                        </h1>
                        <p className="text-slate-400 text-xs sm:text-sm">Manage enterprise resources, track daily maintenance, and review system logs.</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2 self-start sm:self-center">
                    <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Cloud Database Live</span>
                    </div>
                </div>
            </div>

            {/* 4 Modern KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex items-center space-x-4 hover:border-slate-700/80 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center flex-shrink-0">
                        <DashboardIcon className="w-6 h-6 text-blue-400"/>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">{resourceCount}</div>
                        <div className="text-slate-400 text-xs font-medium">Active Resources</div>
                    </div>
                </div>

                <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex items-center space-x-4 hover:border-slate-700/80 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center flex-shrink-0">
                        <ClockIcon className="w-6 h-6 text-emerald-400"/>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">{totalTasks}</div>
                        <div className="text-slate-400 text-xs font-medium">Assigned Tasks</div>
                    </div>
                </div>

                <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex items-center space-x-4 hover:border-slate-700/80 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-800/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">99.9%</div>
                        <div className="text-slate-400 text-xs font-medium">Cloud Health</div>
                    </div>
                </div>

                <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex items-center space-x-4 hover:border-slate-700/80 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-white">{props.admins.length}</div>
                        <div className="text-slate-400 text-xs font-medium">IT Personnel</div>
                    </div>
                </div>
            </div>

            {(currentUserRole === 'superadmin' || currentUserRole === 'admin') && (
                <DayOffManagementWidget dayOffs={allDayOffs} onUpdateDayOffStatus={props.onUpdateDayOffStatus} />
            )}

            {currentUserRole === 'superadmin' && (
                <SuperAdminDashboard 
                    admins={props.admins}
                    userTasks={props.userTasks}
                    currentUserUsername={props.currentUsername || ''}
                    userActivity={props.userActivity}
                />
            )}
            
            {dashboardItems.length > 0 && (
                <div className="mb-4">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                            <DashboardIcon className="w-5 h-5 mr-2 text-slate-400"/>
                            <h2 className="text-lg font-bold text-white">Dashboard Widgets</h2>
                        </div>
                        <button onClick={() => setIsEditingWidgets(v => !v)} className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all">
                            {isEditingWidgets ? 'Save Layout' : 'Edit Widgets'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
                        {dashboardItems.map(item => (
                            <IframeWidget 
                                key={item.id} 
                                item={item} 
                                isEditing={isEditingWidgets}
                                onRemove={() => handleRemoveWidget(item)}
                                onFocus={setFocusedWidgetId}
                                onDragStart={(e) => handleWidgetDragStart(e, item.id)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleWidgetDrop(e, item.id)}
                            />
                        ))}
                    </div>
                </div>
            )}

          <TaskDashboard {...props} />
        </>
      ) : (
        <div className="animate-fade-in">
            <div className="mb-8 p-6 bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl shadow-black/20">
                <div className="flex items-center">
                    <ITRSHubLogo className="w-12 h-12 flex-shrink-0 mr-4" customLogo={branding?.logo} />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">{appTitle}</h1>
                        <p className="text-slate-400 text-xs sm:text-sm">Centralized cloud workspace for IT setups, operational resources, and standard tools.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center mb-4">
                         <StarIcon className="w-5 h-5 mr-3 text-amber-400"/>
                        <h2 className="text-lg font-bold text-white">Getting Started</h2>
                    </div>
                     <div className="space-y-3">
                        <p className="text-slate-400 text-xs mb-4">Explore our library of essential applications and department software configurations.</p>
                        <button onClick={onStartTour} className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all">
                            Launch Hub Tour
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </button>
                         <h3 className="text-md font-semibold text-gray-300 pt-4">Featured Essentials</h3>
                         {featuredResources.slice(0, 3).map(item => (
                             <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors">
                                <div>
                                    <p className="font-semibold text-white">{item.name}</p>
                                </div>
                                <LinkIcon className="w-5 h-5 text-gray-400"/>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center mb-4">
                        <ClockIcon className="w-6 h-6 mr-3 text-green-400"/>
                        <h2 className="text-xl font-bold">Latest Additions</h2>
                    </div>
                     <div className="space-y-3">
                        {recentResources.map(item => (
                             <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors">
                                <div>
                                    <p className="font-semibold text-white">{item.name}</p>
                                    <p className="text-xs text-gray-400">Location: {findResourceFolder(item.id)?.folder?.name || 'Root'}</p>
                                </div>
                                <LinkIcon className="w-5 h-5 text-gray-400"/>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
        {focusedItem && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-[60] flex flex-col p-4 sm:p-8 animate-fade-in">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">{focusedItem.name}</h2>
                    <button onClick={() => setFocusedWidgetId(null)} className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-md shadow-lg">
                        <CollapseIcon className="w-5 h-5 mr-2" />
                        Close Preview
                    </button>
                </div>
                <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-2xl">
                    <iframe
                        src={focusedItem.itemType === 'folder' ? focusedItem.iframeUrl : (focusedItem.link || focusedItem.fileContent)}
                        className="w-full h-full border-0"
                        title={focusedItem.name}
                    />
                </div>
            </div>
        )}
    </div>
  );
};

export default HomeDashboard;
