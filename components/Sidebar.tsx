import React, { useState, useMemo } from 'react';
import { ResourceCategory, Folder, UserRole } from '../types';
import FolderIcon from './icons/FolderIcon';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import CategoryModal from './CategoryModal';
import FolderModal from './FolderModal';
import ConfirmationModal from './ConfirmationModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';
import GripVerticalIcon from './icons/GripVerticalIcon';
import CloseIcon from './icons/CloseIcon';
import DashboardIcon from './icons/DashboardIcon';

type DraggedItem = { id: string; type: 'category' | 'folder' | 'resource', sourceFolderId?: string };
type DropTarget = { id: string; type: 'category' | 'folder'; position: 'before' | 'after' };

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ResourceCategory[];
  activeFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  isAdminMode: boolean;
  currentUserRole: UserRole | null;
  onAddCategory: (title: string) => void;
  onUpdateCategory: (categoryId: string, newTitle: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddFolder: (categoryId: string, folderData: Omit<Folder, 'id' | 'items' | 'owner'>) => void;
  onUpdateFolder: (folderId: string, folderData: Omit<Folder, 'id' | 'items' | 'owner'>) => void;
  onDeleteFolder: (folderId: string) => void;
  onReorderItems: (draggedId: string, targetId: string, type: 'category' | 'folder', position: 'before' | 'after') => void;
  onMoveResource: (resourceId: string, sourceFolderId: string, destinationFolderId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { isOpen, onClose, categories, activeFolderId, onSelectFolder, isAdminMode, currentUserRole } = props;
  const { onAddCategory, onUpdateCategory, onDeleteCategory } = props;
  const { onAddFolder, onUpdateFolder, onDeleteFolder, onReorderItems, onMoveResource } = props;

  const canManageStructure = currentUserRole === 'superadmin' || currentUserRole === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => {
    return categories.length > 0 ? new Set([categories[0].id]) : new Set();
  });

  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  
  const [isFolderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);

  const [deletingItem, setDeletingItem] = useState<{type: 'category' | 'folder', id: string, name: string} | null>(null);

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [dropHighlightFolderId, setDropHighlightFolderId] = useState<string | null>(null);


  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const lowerCaseQuery = searchQuery.toLowerCase();
    const result: ResourceCategory[] = [];
    for (const category of categories) {
      const categoryTitleMatches = category.title.toLowerCase().includes(lowerCaseQuery);
      const matchingFolders = category.folders.filter(folder => {
        const folderNameMatches = folder.name.toLowerCase().includes(lowerCaseQuery);
        const hasMatchingResource = folder.items.some(item =>
          item.name.toLowerCase().includes(lowerCaseQuery) ||
          item.description.toLowerCase().includes(lowerCaseQuery)
        );
        return folderNameMatches || hasMatchingResource;
      });
      if (categoryTitleMatches || matchingFolders.length > 0) {
        result.push({ ...category, folders: categoryTitleMatches ? category.folders : matchingFolders });
      }
    }
    return result;
  }, [searchQuery, categories]);

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) newSet.delete(categoryId);
      else newSet.add(categoryId);
      return newSet;
    });
  };

  const handleOpenAddCategory = () => { setEditingCategory(null); setCategoryModalOpen(true); };
  const handleOpenEditCategory = (category: ResourceCategory) => { setEditingCategory(category); setCategoryModalOpen(true); };
  const handleSaveCategory = (title: string) => {
    if (editingCategory) onUpdateCategory(editingCategory.id, title);
    else onAddCategory(title);
    setCategoryModalOpen(false);
  };
  
  const handleOpenAddFolder = (categoryId: string) => { setEditingFolder(null); setCurrentCategoryId(categoryId); setFolderModalOpen(true); };
  const handleOpenEditFolder = (folder: Folder) => { setEditingFolder(folder); setFolderModalOpen(true); };
  const handleSaveFolder = (folderData: Omit<Folder, 'id' | 'items' | 'owner'>) => {
    if (editingFolder) onUpdateFolder(editingFolder.id, folderData);
    else if (currentCategoryId) onAddFolder(currentCategoryId, folderData);
    setFolderModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    if (deletingItem.type === 'category') onDeleteCategory(deletingItem.id);
    else onDeleteFolder(deletingItem.id);
    setDeletingItem(null);
  }

  // --- Drag and Drop Handlers ---
  const handleGlobalDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
    setDropHighlightFolderId(null);
  };
  
  // Dragging items within the sidebar
  const handleSidebarItemDragStart = (e: React.DragEvent<HTMLDivElement>, id: string, type: 'category' | 'folder') => {
    if (!isAdminMode) return;
    const item = { id, type };
    setDraggedItem(item);
e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleSidebarItemDragOver = (e: React.DragEvent<HTMLDivElement>, id: string, type: 'category' | 'folder') => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type || draggedItem.id === id) {
      setDropTarget(null);
      return;
    };
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    if (dropTarget?.id !== id || dropTarget?.position !== position) {
      setDropTarget({ id, type, position });
    }
  };

  const handleSidebarItemDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent parent drop handlers from firing
    if (!draggedItem || !dropTarget || draggedItem.id === dropTarget.id || draggedItem.type === 'resource') return;
    onReorderItems(draggedItem.id, dropTarget.id, draggedItem.type, dropTarget.position);
    handleGlobalDragEnd();
  };
  
  // Handling drops from the content area (moving resources)
  const handleFolderDropTargetDragOver = (e: React.DragEvent<HTMLDivElement>, folderId: string) => {
    e.preventDefault();
    if (currentUserRole !== 'superadmin') return;

    try {
        const payload = JSON.parse(e.dataTransfer.types.includes('application/json') ? e.dataTransfer.getData('application/json') : '{}');
        if (payload.type === 'resource' && payload.sourceFolderId !== folderId) {
            e.dataTransfer.dropEffect = 'move';
            setDropHighlightFolderId(folderId);
        } else {
            e.dataTransfer.dropEffect = 'none';
            setDropHighlightFolderId(null);
        }
    } catch {
        // Ignore parsing errors
    }
  };

  const handleFolderDrop = (e: React.DragEvent<HTMLDivElement>, destinationFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUserRole !== 'superadmin') return;

    try {
        const payload = JSON.parse(e.dataTransfer.getData('application/json'));
        if (payload.type === 'resource') {
            onMoveResource(payload.resourceId, payload.sourceFolderId, destinationFolderId);
        }
    } catch (err) {
        console.error("Drop failed:", err);
    }
    handleGlobalDragEnd();
  };

  const handleFolderDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropHighlightFolderId(null);
  };


  const DropIndicator: React.FC<{ target: DropTarget; id: string; type: 'category' | 'folder' }> = ({ target, id, type }) => {
    if (target.id !== id || target.type !== type) return null;
    return (
      <div className={`absolute left-0 right-0 h-0.5 bg-indigo-500 rounded-full ${target.position === 'before' ? '-top-px' : '-bottom-px'}`} />
    );
  };
  
  return (
    <aside 
      id="sidebar-nav"
      className={`fixed inset-y-0 left-0 z-30 w-80 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`} 
      onDragEnd={handleGlobalDragEnd}
      aria-hidden={!isOpen}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{categories.length} Hubs</span>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors" aria-label="Close sidebar">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

       <div className="mb-4 relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Filter resources..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all" 
        />
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1" onDrop={handleSidebarItemDrop} >
        <nav className="mb-3">
            <button
                onClick={() => onSelectFolder(null)}
                className={`flex items-center w-full px-3 py-2 text-xs font-medium rounded-xl transition-all duration-150 ${
                    activeFolderId === null
                    ? 'bg-indigo-600/15 text-indigo-300 font-semibold border-l-2 border-indigo-500'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
            >
                <DashboardIcon className={`w-4 h-4 mr-2.5 flex-shrink-0 ${activeFolderId === null ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="truncate">Hub Overview & Tasks</span>
            </button>
        </nav>
        {filteredCategories.map((category) => {
          const isExpanded = searchQuery.trim().length > 0 || expandedCategories.has(category.id);
          const isDragging = draggedItem?.id === category.id;
          return (
            <div key={category.id} className={`py-1 relative transition-opacity ${isDragging ? 'opacity-40' : 'opacity-100'}`} onDragOver={(e) => handleSidebarItemDragOver(e, category.id, 'category')}>
              {dropTarget && <DropIndicator target={dropTarget} id={category.id} type="category" />}
              <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-900/60 group">
                {canManageStructure && <div draggable onDragStart={(e) => handleSidebarItemDragStart(e, category.id, 'category')} className="cursor-move p-0.5 text-slate-600 hover:text-slate-300"><GripVerticalIcon className="w-3.5 h-3.5" /></div>}
                <button onClick={() => handleToggleCategory(category.id)} className="flex-1 flex items-center text-left" aria-expanded={isExpanded}>
                  <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-200 transition-colors">{category.title}</h2>
                </button>
                <div className="flex items-center space-x-1">
                  {canManageStructure && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenAddFolder(category.id)} className="p-1 text-slate-500 hover:text-slate-200" title="Add Folder"><PlusIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleOpenEditCategory(category)} className="p-1 text-slate-500 hover:text-slate-200" title="Edit Category"><PencilIcon className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingItem({ type: 'category', id: category.id, name: category.title })} className="p-1 text-slate-500 hover:text-rose-400" title="Delete Category"><TrashIcon className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  <button onClick={() => handleToggleCategory(category.id)} className="p-1 text-slate-500 group-hover:text-slate-300" aria-label={isExpanded ? 'Collapse category' : 'Expand category'}>
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen mt-1' : 'max-h-0'}`}>
                <nav className="flex flex-col space-y-0.5 border-l border-slate-800/80 ml-3 pl-2.5">
                  {category.folders.map((folder) => {
                    const isActive = folder.id === activeFolderId;
                    const isFolderDragging = draggedItem?.id === folder.id;
                    const isDropTarget = dropHighlightFolderId === folder.id;
                    return (
                      <div 
                        key={folder.id} 
                        className={`flex items-center relative transition-all rounded-lg group/folder ${isFolderDragging ? 'opacity-40' : 'opacity-100'} ${isDropTarget ? 'bg-indigo-500/20 ring-1 ring-indigo-500' : ''}`} 
                        onDragOver={(e) => {
                           handleFolderDropTargetDragOver(e, folder.id);
                           handleSidebarItemDragOver(e, folder.id, 'folder');
                        }}
                        onDrop={(e) => handleFolderDrop(e, folder.id)}
                        onDragLeave={handleFolderDragLeave}
                      >
                        {dropTarget && <DropIndicator target={dropTarget} id={folder.id} type="folder" />}
                        {canManageStructure && <div draggable onDragStart={(e) => handleSidebarItemDragStart(e, folder.id, 'folder')} className="cursor-move p-0.5 text-slate-600 hover:text-slate-300 opacity-0 group-hover/folder:opacity-100 transition-opacity"><GripVerticalIcon className="w-3 h-3" /></div>}
                        <button onClick={() => onSelectFolder(folder.id)} className={`flex-1 flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all text-left ${ isActive ? 'bg-indigo-600/15 text-indigo-300 font-semibold border-l-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' }`}>
                          <FolderIcon className={`w-4 h-4 mr-2 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-600'}`} />
                          <span className="truncate">{folder.name}</span>
                          <span className="ml-auto text-[10px] text-slate-600 font-mono">{folder.items?.length || 0}</span>
                        </button>
                        {canManageStructure && (
                          <div className="flex items-center space-x-0.5 ml-1 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenEditFolder(folder)} className="p-1 text-slate-500 hover:text-slate-300" title="Edit Folder"><PencilIcon className="w-3 h-3" /></button>
                            <button onClick={() => setDeletingItem({ type: 'folder', id: folder.id, name: folder.name })} className="p-1 text-slate-500 hover:text-rose-400" title="Delete Folder"><TrashIcon className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                   {category.folders.length === 0 && !canManageStructure && (<div className="px-3 py-1.5 text-[11px] text-slate-600">No folders in this setup.</div>)}
                   {category.folders.length === 0 && canManageStructure && (<div className="px-3 py-1.5 text-[11px] text-slate-600">Empty setup. Add a folder.</div>)}
                </nav>
              </div>
            </div>
          )
        })}
        {filteredCategories.length === 0 && searchQuery && (<div className="text-center text-slate-500 py-6 text-xs">No matching setups found.</div>)}
      </div>
      {canManageStructure && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
           <button onClick={handleOpenAddCategory} className="w-full inline-flex items-center justify-center px-4 py-2 border border-dashed border-slate-700/80 hover:border-indigo-500/80 text-slate-300 hover:text-indigo-300 hover:bg-indigo-950/20 text-xs font-semibold rounded-xl transition-all">
            <PlusIcon className="w-4 h-4 mr-2" /> Add New Setup Group
          </button>
        </div>
      )}
      {isCategoryModalOpen && <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} onSave={handleSaveCategory} category={editingCategory} />}
      {isFolderModalOpen && <FolderModal isOpen={isFolderModalOpen} onClose={() => setFolderModalOpen(false)} onSave={handleSaveFolder} folder={editingFolder} categoryName={categories.find(c => c.id === currentCategoryId)?.title || ''} />}
      {deletingItem && <ConfirmationModal isOpen={!!deletingItem} onClose={() => setDeletingItem(null)} onConfirm={handleConfirmDelete} title={`Delete ${deletingItem.type}`} message={`Are you sure you want to permanently delete the ${deletingItem.type} "${deletingItem.name}"?` + (deletingItem.type === 'category' ? ' All folders and resources within it will also be deleted.' : '')} />}
    </aside>
  );
};

export default Sidebar;
