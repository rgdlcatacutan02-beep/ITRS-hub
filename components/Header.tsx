import React, { useState, useEffect, useRef } from 'react';
import PencilIcon from './icons/PencilIcon';
import MenuIcon from './icons/MenuIcon';
import ITRSHubLogo from './icons/ITRSHubLogo';
import KeyIcon from './icons/KeyIcon';
import BellIcon from './icons/BellIcon';
import { Notification, BrandingConfig, UserRole } from '../types';
import UserIcon from './icons/UserIcon';
import CalendarIcon from './icons/CalendarIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';

interface NotificationDropdownProps {
    notifications: Notification[];
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const getIconForType = (type: Notification['type']) => {
        switch (type) {
            case 'leave_request': return <CalendarIcon className="w-4 h-4 text-blue-400" />;
            case 'admin_update': return <UserIcon className="w-4 h-4 text-purple-400" />;
            case 'security_alert': return <AlertTriangleIcon className="w-4 h-4 text-amber-400" />;
            default: return <BellIcon className="w-4 h-4 text-indigo-400" />;
        }
    };

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div ref={dropdownRef} className="absolute top-14 right-4 w-80 max-w-sm bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            <div className="px-4 py-3 font-semibold text-white border-b border-slate-800/80 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Cloud Notifications</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/50">{notifications.length} Total</span>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-8">No unread notifications.</p>
                ) : (
                    notifications.map(n => (
                        <div key={n.id} className="p-3.5 hover:bg-slate-800/50 transition-colors flex items-start space-x-3">
                            <div className="p-2 bg-slate-800/80 rounded-xl mt-0.5 border border-slate-700/50">
                                {getIconForType(n.type)}
                            </div>
                            <div className="flex-1 text-xs">
                                <p className="text-slate-200 font-medium leading-snug">{n.message}</p>
                                <div className="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-500">
                                    <span>{n.triggeredBy}</span>
                                    <span>•</span>
                                    <span>{timeSince(n.timestamp)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

interface HeaderProps {
    appTitle: string;
    branding?: BrandingConfig;
    isAuthenticated: boolean;
    currentUserRole: UserRole | null;
    currentUsername?: string | null;
    currentUserProfilePicture: string | null;
    onAdminAction: () => void;
    onManageAdminsClick: () => void;
    onImportExportClick: () => void;
    onUpdateAppTitle: (newTitle: string) => void;
    onToggleSidebar: () => void;
    onGoHome: () => void;
    onPasswordManagerClick: () => void;
    onNotepadClick?: () => void;
    notifications: Notification[];
    onMarkNotificationsAsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    appTitle, 
    branding, 
    isAuthenticated, 
    currentUserRole, 
    currentUsername,
    currentUserProfilePicture, 
    onAdminAction, 
    onManageAdminsClick, 
    onImportExportClick, 
    onUpdateAppTitle, 
    onToggleSidebar, 
    onGoHome, 
    onPasswordManagerClick, 
    onNotepadClick,
    notifications, 
    onMarkNotificationsAsRead 
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableTitle, setEditableTitle] = useState(appTitle);
  const [isNotificationOpen, setNotificationOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    setEditableTitle(appTitle);
  }, [appTitle]);
  
  const handleToggleNotifications = () => {
    if (!isNotificationOpen) {
        onMarkNotificationsAsRead();
    }
    setNotificationOpen(prev => !prev);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (editableTitle.trim()) {
        onUpdateAppTitle(editableTitle.trim());
    } else {
        setEditableTitle(appTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleTitleBlur();
    } else if (e.key === 'Escape') {
        setIsEditingTitle(false);
        setEditableTitle(appTitle);
    }
  };

  const getRoleBadge = () => {
    switch (currentUserRole) {
        case 'superadmin':
            return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60 tracking-wider">Super Admin</span>;
        case 'admin':
            return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/60 tracking-wider">Admin</span>;
        case 'staff':
            return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 tracking-wider">Staff</span>;
        case 'viewer':
            return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 tracking-wider">Viewer</span>;
        default:
            return null;
    }
  };

  return (
    <header id="app-header" className="bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-800/80 z-40 relative">
      <div className="flex items-center space-x-3 group">
        <button 
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors" 
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
            <MenuIcon className="w-5 h-5" />
        </button>
        
        <button onClick={onGoHome} className="flex items-center space-x-2.5 rounded-xl p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <ITRSHubLogo className="w-8 h-8 flex-shrink-0" customLogo={branding?.logo} />
            <div className="flex flex-col text-left">
                {isEditingTitle ? (
                    <input 
                        type="text"
                        value={editableTitle}
                        onChange={(e) => setEditableTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="bg-slate-800 text-base font-bold text-white tracking-wide rounded px-2 -ml-2 border border-indigo-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-white tracking-tight">
                            {appTitle || 'ITRS HUB'}
                        </span>
                        <span className="text-[10px] font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-800/50 px-2 py-0.2 rounded-full hidden sm:inline-block">
                            Cloud
                        </span>
                    </div>
                )}
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">IT Operations & Resource Portal</span>
            </div>
        </button>

        {currentUserRole === 'superadmin' && !isEditingTitle && (
            <button onClick={() => setIsEditingTitle(true)} className="p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Edit App Title">
                <PencilIcon className="w-3.5 h-3.5" />
            </button>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Role Badge */}
        {isAuthenticated && (
            <div className="hidden md:flex items-center">
                {getRoleBadge()}
            </div>
        )}

        {/* Notifications (Superadmin & Admin) */}
        {isAuthenticated && (currentUserRole === 'superadmin' || currentUserRole === 'admin') && (
             <button
                onClick={handleToggleNotifications}
                className="relative p-2 text-slate-300 bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 rounded-xl transition-all"
                title={`${unreadCount} unread notifications`}
            >
                <BellIcon className="w-4 h-4" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>
        )}
        {isNotificationOpen && <NotificationDropdown notifications={notifications} onClose={() => setNotificationOpen(false)} />}

        {/* Quick Notepad Button */}
        {isAuthenticated && onNotepadClick && (
            <button
                onClick={onNotepadClick}
                className="p-2 text-slate-300 bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 rounded-xl transition-all"
                title="Quick IT Scratchpad"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            </button>
        )}

        {/* Password Manager (Superadmin, Admin, Staff) */}
        {isAuthenticated && currentUserRole !== 'viewer' && (
            <button
                onClick={onPasswordManagerClick}
                className="p-2 text-slate-300 bg-slate-800/60 hover:bg-slate-700/70 border border-slate-700/50 rounded-xl transition-all"
                title="Password Vault"
            >
                <KeyIcon className="w-4 h-4" />
            </button>
        )}

        {/* Import/Export (Superadmin only) */}
        {isAuthenticated && currentUserRole === 'superadmin' && (
            <button
                onClick={onImportExportClick}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all hidden md:block"
                aria-label="Backup and restore application data"
            >
                Backup / Sync
            </button>
        )}

        {/* Manage Admins / My Account button */}
        {isAuthenticated && (
            <button
                onClick={onManageAdminsClick}
                className="flex items-center space-x-2 pl-1.5 pr-2.5 py-1 text-xs font-semibold text-slate-200 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all"
                aria-label="Manage account"
            >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {currentUserProfilePicture ? (
                        <img src={currentUserProfilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-3.5 h-3.5 text-white" />
                    )}
                </div>
                <span className="hidden sm:inline font-bold">
                    {currentUserRole === 'superadmin' ? 'Directory' : (currentUsername || 'Account')}
                </span>
            </button>
        )}

        {/* Log Out */}
        <button
          id="admin-login-button"
          onClick={onAdminAction}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700/60 rounded-xl transition-all"
          aria-label="Log out"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Header;
