
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Folder, ResourceItem, AppTasks, TaskPriority, HistoryEntry, ResourceCategory, AdminUser, Task, BrandingConfig, UserRole } from '../types';
import LinkIcon from './icons/LinkIcon';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import ResourceModal from './ResourceModal';
import ConfirmationModal from './ConfirmationModal';
import GripVerticalIcon from './icons/GripVerticalIcon';
import BackToTopButton from './BackToTopButton';
import RefreshIcon from './icons/RefreshIcon';
import HomeDashboard from './HomeDashboard';
import DownloadIcon from './icons/DownloadIcon';
import FileIcon from './icons/FileIcon';


interface ContentDisplayProps {
  folder: Folder | null;
  isAdminMode: boolean;
  currentUserRole: UserRole | null;
  currentUsername: string | null;
  onAddResource: (folderId: string, item: Omit<ResourceItem, 'id' | 'owner'>) => void;
  onUpdateResource: (folderId: string, item: ResourceItem) => void;
  onDeleteResource: (folderId: string, itemId: string) => void;
  onReorderResources: (folderId: string, draggedItemId: string, targetItemId: string) => void;
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
  onUpdateFolder: (folderId: string, folderData: Partial<Omit<Folder, 'id' | 'items' | 'owner'>>) => void;
  onAddDayOffRequest: (request: any) => void;
  onUpdateDayOffStatus: (requestId: string, status: 'approved' | 'rejected') => void;
  userActivity: { [username: string]: string };
  onStartTour: () => void;
}

const ContentDisplay: React.FC<ContentDisplayProps> = (props) => {
  const { folder, isAdminMode, currentUserRole, currentUsername, onAddResource, onUpdateResource, onDeleteResource, onReorderResources, branding } = props;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [deletingResourceId, setDeletingResourceId] = useState<string | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const mainContentRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const [isScrollButtonVisible, setIsScrollButtonVisible] = useState(false);

  // This effect preserves scroll position across re-renders.
  useLayoutEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = scrollPositionRef.current;
    }
  });

  const handleScroll = useCallback(() => {
    if (mainContentRef.current) {
      scrollPositionRef.current = mainContentRef.current.scrollTop;
      setIsScrollButtonVisible(mainContentRef.current.scrollTop > 300);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      scrollPositionRef.current = 0;
    }
  }, []);
  
  useEffect(() => {
    if (folder) {
        setLastUpdated(new Date());
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
        scrollPositionRef.current = 0;
    }
  }, [folder]);


  const handleOpenAddModal = () => {
    setEditingResource(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ResourceItem) => {
    setEditingResource(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
  };
  
  const handleSaveResource = (resourceData: Omit<ResourceItem, 'id' | 'owner'> | ResourceItem) => {
    if (!folder) return;
    if ('id' in resourceData) {
      onUpdateResource(folder.id, resourceData);
    } else {
      onAddResource(folder.id, resourceData);
    }
    setLastUpdated(new Date());
    handleCloseModal();
  };

  const handleConfirmDelete = () => {
    if (deletingResourceId && folder) {
      onDeleteResource(folder.id, deletingResourceId);
    }
    setLastUpdated(new Date());
    setDeletingResourceId(null);
  };
  
  const resourceToDelete = folder?.items.find(item => item.id === deletingResourceId);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, itemId: string) => {
    if (!isAdminMode || !folder) return;
    const payload = {
        type: 'resource',
        resourceId: itemId,
        sourceFolderId: folder.id,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isAdminMode) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetItemId: string) => {
    if (!isAdminMode || !folder) return;
    e.preventDefault();
    try {
        const payload = JSON.parse(e.dataTransfer.getData('application/json'));
        if (payload.type === 'resource' && payload.sourceFolderId === folder.id) {
            onReorderResources(folder.id, payload.resourceId, targetItemId);
             setLastUpdated(new Date());
        }
    } catch(e) {
      console.error("Drop failed", e);
    }
    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    if (!isAdminMode) return;
    setDraggedItemId(null);
  };

  const handleDownload = (fileContent: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileContent;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main 
      ref={mainContentRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto bg-slate-950"
      id="main-content"
    >
      {!folder ? (
        <HomeDashboard
          appTitle={props.appTitle}
          categories={props.categories}
          resourceCount={props.resourceCount}
          tasks={props.tasks}
          userTasks={props.userTasks}
          admins={props.admins}
          history={props.history}
          dashboardWidgetOrder={props.dashboardWidgetOrder}
          branding={branding}
          onAddTask={props.onAddTask}
          onAddSubTask={props.onAddSubTask}
          onToggleTask={props.onToggleTask}
          onUpdateTask={props.onUpdateTask}
          onDeleteTask={props.onDeleteTask}
          onToggleTaskRepetitive={props.onToggleTaskRepetitive}
          onAddGroup={props.onAddGroup}
          onUpdateGroup={props.onUpdateGroup}
          onDeleteGroup={props.onDeleteGroup}
          onUpdateTaskPriority={props.onUpdateTaskPriority}
          onClearHistoryForMonth={props.onClearHistoryForMonth}
          onReorderDashboardWidgets={props.onReorderDashboardWidgets}
          onUpdateResource={props.onUpdateResource}
          onUpdateFolder={props.onUpdateFolder}
          isAdminMode={props.isAdminMode}
          currentUserRole={props.currentUserRole}
          currentUsername={props.currentUsername}
          onAddDayOffRequest={props.onAddDayOffRequest}
          onUpdateDayOffStatus={props.onUpdateDayOffStatus}
          userActivity={props.userActivity}
          onStartTour={props.onStartTour}
        />
      ) : (
        <div className="p-4 sm:p-8">
          <div className="flex justify-between items-start mb-6 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {folder.name}
              </h1>
              <div className="flex items-center mt-2 text-xs text-slate-400">
                <button onClick={() => setLastUpdated(new Date())} className="flex items-center hover:text-white transition-colors" title="Refresh view">
                  <RefreshIcon className="w-3 h-3 mr-1.5 text-indigo-400" />
                  <span>Last updated at {lastUpdated.toLocaleTimeString()}</span>
                </button>
              </div>
            </div>
            {isAdminMode && currentUserRole !== 'viewer' && (
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Add Resource</span>
              </button>
            )}
          </div>

          {folder.items.length === 0 ? (
            <div className="text-center text-slate-500 mt-16 py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <p className="text-base font-medium text-slate-400">This folder is currently empty.</p>
              {isAdminMode && currentUserRole !== 'viewer' ? (
                <p className="text-xs text-slate-500 mt-2">Click "Add Resource" above to populate applications or links.</p>
              ) : (
                <p className="text-xs text-slate-500 mt-2">Resources for this category will be added soon.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folder.items.map((item) => {
                const canModify = isAdminMode && currentUserRole !== 'viewer' && (currentUserRole === 'superadmin' || currentUserRole === 'admin' || item.owner === currentUsername);
                return (
                  <div 
                    key={item.id} 
                    draggable={isAdminMode && currentUserRole !== 'viewer'}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-slate-800/80 border border-slate-700/60 rounded-2xl shadow-lg flex flex-col justify-between transition-all transform hover:-translate-y-1 hover:border-slate-600 hover:shadow-indigo-500/10 ${draggedItemId === item.id ? 'opacity-40 ring-2 ring-indigo-500' : 'opacity-100'}`}
                  >
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white tracking-tight">{item.name}</h3>
                        {item.fileName && (
                          <p className="text-xs text-slate-400 mt-1 font-mono flex items-center" title={item.fileName}>
                            <FileIcon className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0"/> <span className="truncate">{item.fileName}</span>
                          </p>
                        )}
                        <p className="text-slate-400 mt-2 text-sm leading-relaxed">{item.description}</p>
                      </div>
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 self-start"
                        >
                          Access Resource
                          <LinkIcon className="w-3.5 h-3.5 ml-2" />
                        </a>
                      ) : (item.fileContent && item.fileName) ? (
                        <button
                          onClick={() => handleDownload(item.fileContent!, item.fileName!)}
                          className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-600/20 transition-all active:scale-95 self-start"
                        >
                          Download
                          <DownloadIcon className="w-3.5 h-3.5 ml-2" />
                        </button>
                      ) : null}
                    </div>
                    
                    {isAdminMode && currentUserRole !== 'viewer' && (
                      <div className="bg-slate-900/60 px-4 py-2.5 rounded-b-2xl flex items-center justify-between border-t border-slate-700/50 text-xs">
                          <div className="cursor-move text-slate-400 hover:text-white p-1" title="Drag to reorder">
                              <GripVerticalIcon className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]" title={`Owner: ${item.owner}`}>
                              Owner: {item.owner}
                          </span>
                          <div className="flex items-center space-x-1.5">
                              {canModify ? (
                                <button onClick={() => handleOpenEditModal(item)} className="p-1.5 bg-slate-800 rounded-lg text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors" title="Edit Resource">
                                  <PencilIcon className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div className="relative group">
                                  <button className="p-1.5 bg-slate-800/40 rounded-lg text-slate-600 cursor-not-allowed" disabled>
                                    <PencilIcon className="w-3.5 h-3.5" />
                                  </button>
                                  <div className="absolute bottom-full mb-2 -right-2 w-max max-w-xs bg-slate-950 text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    Only the owner or Super Admin can edit.
                                  </div>
                                </div>
                              )}
                              {canModify ? (
                                <button onClick={() => setDeletingResourceId(item.id)} className="p-1.5 bg-slate-800 rounded-lg text-slate-300 hover:bg-rose-600 hover:text-white transition-colors" title="Delete Resource">
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div className="relative group">
                                    <button className="p-1.5 bg-slate-800/40 rounded-lg text-slate-600 cursor-not-allowed" disabled>
                                        <TrashIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute bottom-full mb-2 -right-2 w-max max-w-xs bg-slate-950 text-slate-200 text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        Only the owner or Super Admin can delete.
                                    </div>
                                </div>
                              )}
                          </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {isModalOpen && folder && (
        <ResourceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveResource}
          resource={editingResource}
          folderName={folder.name}
        />
      )}
      {deletingResourceId && (
        <ConfirmationModal
            isOpen={!!deletingResourceId}
            onClose={() => setDeletingResourceId(null)}
            onConfirm={handleConfirmDelete}
            title="Delete Resource"
            message={`Are you sure you want to delete the resource "${resourceToDelete?.name}"? This action cannot be undone.`}
        />
      )}
      <BackToTopButton isVisible={isScrollButtonVisible} onClick={scrollToTop} />
    </main>
  );
};

export default ContentDisplay;
