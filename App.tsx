
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './db';
import { 
  ResourceCategory, Folder, ResourceItem, AdminUser, AppTasks, Task, 
  TaskPriority, BrandingConfig, AuditLog, 
  Notification, Credential, AppData, DayOfWeek, HistoryEntry, UserRole
} from './types';
import Sidebar from './components/Sidebar';
import ContentDisplay from './components/ContentDisplay';
import Header from './components/Header';
import ITRSHubLogo from './components/icons/ITRSHubLogo';
import AdminManagementModal from './components/AdminManagementModal';
import ImportExportModal from './components/ImportExportModal';
import PasswordManagerModal from './components/PasswordManagerModal';
import CheckCircleIcon from './components/icons/CheckCircleIcon';
import EyeIcon from './components/icons/EyeIcon';
import EyeOffIcon from './components/icons/EyeOffIcon';
import NotepadModal from './components/NotepadModal';
import GuidedTour, { TourStep } from './components/GuidedTour';
import { cloudService, CloudStatusEvent } from './services/cloudService';
import { v4 as uuidv4 } from 'uuid';

const LoginPage: React.FC<{
  onLogin: (user: string, pass: string) => Promise<boolean>;
  appTitle: string;
  branding?: BrandingConfig;
}> = ({ onLogin, appTitle, branding }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const demoAccounts = [
    { label: 'Admin', role: 'admin', user: 'admin', pass: 'admin1234', badgeClass: 'bg-blue-950/40 text-blue-300 border-blue-800/60 hover:bg-blue-900/40' },
    { label: 'Super Admin', role: 'superadmin', user: 'superadmin', pass: 'admin', badgeClass: 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/40' },
    { label: 'Staff / Tech', role: 'staff', user: 'staff', pass: 'staff1234', badgeClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40' },
    { label: 'Viewer', role: 'viewer', user: 'viewer', pass: 'viewer1234', badgeClass: 'bg-slate-900/60 text-slate-300 border-slate-700/60 hover:bg-slate-800/60' },
  ];

  const handleSelectDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    const success = await onLogin(username, password);
    if (!success) {
        setError('Invalid username or password.');
        setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#070b14] text-gray-100 font-sans p-4 relative overflow-hidden">
      {/* Subtle ambient lighting glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-900/70 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/60 p-8 sm:p-10 w-full max-w-md border border-slate-800/80 animate-fade-in relative z-10">
        <div className="text-center mb-8">
            <ITRSHubLogo className="w-16 h-16 mx-auto mb-4" customLogo={branding?.logo} />
            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-1.5">
              ITRS <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-300 bg-clip-text text-transparent">HUB</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">Cloud IT Operations & Knowledge Hub</p>
        </div>

        {/* Demo Quick Select */}
        <div className="mb-6 bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            Quick Test Accounts (Click to Fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map(account => (
              <button
                key={account.user}
                type="button"
                onClick={() => handleSelectDemo(account.user, account.pass)}
                className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all text-xs font-semibold ${account.badgeClass} active:scale-95`}
              >
                <span className="font-bold">{account.label}</span>
                <span className="text-[10px] opacity-70 font-mono">{account.user} / {account.pass}</span>
              </button>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Username</label>
            <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder-slate-500"
                placeholder="Enter username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5 pr-11 text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder-slate-500"
                  placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl py-2 px-3 text-rose-300 text-xs text-center font-semibold">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50 uppercase tracking-wider mt-3"
          >
            {isLoggingIn ? 'Connecting to Cloud...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [appTitle, setAppTitle] = useState('Hub Workspace');
    const [categories, setCategories] = useState<ResourceCategory[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [userTasks, setUserTasks] = useState<{ [username: string]: AppTasks }>({});
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [branding, setBranding] = useState<BrandingConfig>({});
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [dashboardWidgetOrder, setDashboardWidgetOrder] = useState<string[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [userActivity, setUserActivity] = useState<{ [username: string]: string }>({});
    const [cloudStatus, setCloudStatus] = useState<CloudStatusEvent>(cloudService.getStatus());

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<{ username: string; role: UserRole } | null>(null);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isImportExportModalOpen, setImportExportModalOpen] = useState(false);
    const [isPasswordManagerModalOpen, setPasswordManagerModalOpen] = useState(false);
    const [isNotepadOpen, setIsNotepadOpen] = useState(false);
    const [notepadContent, setNotepadContent] = useState<string>('');
    const [isTourOpen, setIsTourOpen] = useState(false);

    // Subscribe to cloud sync events
    useEffect(() => {
        return cloudService.onStatusChange(setCloudStatus);
    }, []);

    const tourSteps: TourStep[] = [
        {
            selector: '#app-header',
            title: 'ITRS Hub Header',
            content: 'Access navigation controls, search, quick password vault, scratchpad, notifications, and your role profile.',
            position: 'bottom'
        },
        {
            selector: '#sidebar-nav',
            title: 'Knowledge Categories & Setups',
            content: 'Browse standardized systems, department setups, and PC templates. Admins can organize categories and folders.',
            position: 'right'
        },
        {
            selector: '#main-content',
            title: 'Workspace Dashboard & Content',
            content: 'View operational resources, manage daily tasks, track day-off requests, and monitor system activities.',
            position: 'top'
        }
    ];

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const data = await db.getAppData();
        setAppTitle(data.appTitle);
        setCategories(data.categories);
        setAdmins(data.admins);
        setUserTasks(data.userTasks);
        setCredentials(data.credentials);
        setBranding(data.branding);
        setAuditLogs(data.auditLogs);
        setNotifications(data.notifications);
        setDashboardWidgetOrder(data.dashboardWidgetOrder);
        setHistory(data.history || []);
        setIsLoading(false);
    }, []);

    // Session restoration
    useEffect(() => {
        const savedSession = sessionStorage.getItem('itrs_active_user');
        if (savedSession) {
            try {
                const parsed = JSON.parse(savedSession);
                if (parsed && parsed.username && parsed.role) {
                    setCurrentUser(parsed);
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.warn('Failed to restore session:', e);
            }
        }
    }, []);

    // Notepad per user
    useEffect(() => {
        if (currentUser) {
            const savedNote = localStorage.getItem(`itrs_notes_${currentUser.username}`) || '';
            setNotepadContent(savedNote);
        }
    }, [currentUser]);

    const handleSaveNotepad = (content: string) => {
        setNotepadContent(content);
        if (currentUser) {
            localStorage.setItem(`itrs_notes_${currentUser.username}`, content);
        }
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    const updateActivity = useCallback(() => {
        if (currentUser) {
            setUserActivity(prev => ({
                ...prev,
                [currentUser.username]: new Date().toISOString()
            }));
        }
    }, [currentUser]);

    // Heartbeat for active users
    useEffect(() => {
        if (isAuthenticated && currentUser) {
            updateActivity();
            const interval = setInterval(updateActivity, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, currentUser, updateActivity]);

    const sync = useCallback(async (updates: Partial<AppData>) => {
        if (!currentUser) return;
        await db.updateAppData(updates, currentUser.username);
        updateActivity();
    }, [currentUser, updateActivity]);

    const handleLogin = async (user: string, pass: string): Promise<boolean> => {
        const admin = await db.login(user, pass);
        if (admin) {
            await loadData();
            setIsAuthenticated(true);
            const userObj = { username: admin.username, role: admin.role };
            setCurrentUser(userObj);
            sessionStorage.setItem('itrs_active_user', JSON.stringify(userObj));
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setActiveFolderId(null);
        sessionStorage.removeItem('itrs_active_user');
    };

    const updateCategories = useCallback((newCategories: ResourceCategory[]) => {
        setCategories(newCategories);
        sync({ categories: newCategories });
    }, [sync]);

    const handleAddCategory = (title: string) => {
        const newCategory: ResourceCategory = {
            id: uuidv4(),
            title,
            folders: []
        };
        updateCategories([...categories, newCategory]);
    };

    const handleUpdateCategory = (categoryId: string, newTitle: string) => {
        const newCategories = categories.map(c => c.id === categoryId ? { ...c, title: newTitle } : c);
        updateCategories(newCategories);
    };

    const handleDeleteCategory = (categoryId: string) => {
        const newCategories = categories.filter(c => c.id !== categoryId);
        updateCategories(newCategories);
    };

    const handleAddFolder = (categoryId: string, folderData: Omit<Folder, 'id' | 'items' | 'owner'>) => {
        if (!currentUser) return;
        const newFolder: Folder = {
            ...folderData,
            id: uuidv4(),
            items: [],
            owner: currentUser.username
        };
        const newCategories = categories.map(c => 
            c.id === categoryId ? { ...c, folders: [...c.folders, newFolder] } : c
        );
        updateCategories(newCategories);
    };

    const handleUpdateFolder = (folderId: string, folderData: Partial<Omit<Folder, 'id' | 'items' | 'owner'>>) => {
        const newCategories = categories.map(cat => ({
            ...cat,
            folders: cat.folders.map(f => f.id === folderId ? { ...f, ...folderData } : f)
        }));
        updateCategories(newCategories);
    };

    const handleDeleteFolder = (folderId: string) => {
        const newCategories = categories.map(cat => ({
            ...cat,
            folders: cat.folders.filter(f => f.id !== folderId)
        }));
        updateCategories(newCategories);
    };

    const handleAddResource = (folderId: string, item: Omit<ResourceItem, 'id' | 'owner'>) => {
        if (!currentUser) return;
        const newItem: ResourceItem = {
            ...item,
            id: uuidv4(),
            owner: currentUser.username
        };
        const newCategories = categories.map(cat => ({
            ...cat,
            folders: cat.folders.map(f => {
                if (f.id === folderId) {
                    return { ...f, items: [...f.items, newItem] };
                }
                return f;
            })
        }));
        updateCategories(newCategories);
    };

    const handleUpdateResource = (folderId: string, item: ResourceItem) => {
        const newCategories = categories.map(cat => ({
            ...cat,
            folders: cat.folders.map(f => {
                if (f.id === folderId) {
                    return { ...f, items: f.items.map(i => i.id === item.id ? item : i) };
                }
                return f;
            })
        }));
        updateCategories(newCategories);
    };

    const handleDeleteResource = (folderId: string, itemId: string) => {
        const newCategories = categories.map(cat => ({
            ...cat,
            folders: cat.folders.map(f => {
                if (f.id === folderId) {
                    return { ...f, items: f.items.filter(i => i.id !== itemId) };
                }
                return f;
            })
        }));
        updateCategories(newCategories);
    };

    const updateTasks = useCallback((username: string, newTasks: AppTasks) => {
        const updatedUserTasks = { ...userTasks, [username]: newTasks };
        setUserTasks(updatedUserTasks);
        sync({ userTasks: updatedUserTasks });
    }, [userTasks, sync]);

    const logHistory = useCallback((action: string, taskText: string, details: string, monthKey: string) => {
        if (!currentUser) return;
        const entry: HistoryEntry = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            user: currentUser.username,
            action,
            taskText,
            details,
            monthKey
        };
        const newHistory = [entry, ...history];
        setHistory(newHistory);
        sync({ history: newHistory });
    }, [currentUser, history, sync]);

    const handleAddTask = (text: string, isRepetitive: boolean | undefined, monthKey: string | null, groupId: string | null, dayOfWeek?: DayOfWeek, location?: string) => {
        if (!currentUser) return;
        const username = currentUser.username;
        const currentTasks = userTasks[username] || { daily: [], monthly: {}, dayOffs: [] };
        const newTask: Task = {
            id: uuidv4(),
            text,
            completed: false,
            subTasks: [],
            isRepetitive,
            priority: 'medium',
            location,
            assignedTo: username
        };

        let updatedTasks = { ...currentTasks };
        if (!monthKey) {
            updatedTasks.daily = [...updatedTasks.daily, newTask];
            logHistory('added', text, 'Daily task created', 'N/A');
        } else {
            if (!updatedTasks.monthly[monthKey]) {
                updatedTasks.monthly[monthKey] = { id: monthKey, generalTasks: [], groups: [] };
            }
            const monthData = updatedTasks.monthly[monthKey];
            if (groupId) {
                updatedTasks.monthly[monthKey].groups = monthData.groups.map(g => {
                    if (g.id === groupId) {
                        if (g.type === 'custom') {
                            return { ...g, tasks: [...g.tasks, newTask] };
                        } else if (dayOfWeek) {
                            return { ...g, days: { ...g.days, [dayOfWeek]: [...(g.days[dayOfWeek] || []), newTask] } };
                        }
                    }
                    return g;
                });
            } else {
                updatedTasks.monthly[monthKey].generalTasks = [...monthData.generalTasks, newTask];
            }
            logHistory('added', text, `Task added to month`, monthKey);
        }
        updateTasks(username, updatedTasks);
    };

    const findAndModifyTask = (tasks: Task[], taskId: string, modifier: (t: Task) => Task | null): Task[] => {
        return tasks.reduce((acc, task) => {
            if (task.id === taskId) {
                const modified = modifier(task);
                if (modified) acc.push(modified);
            } else {
                const updatedSubTasks = findAndModifyTask(task.subTasks, taskId, modifier);
                acc.push({ ...task, subTasks: updatedSubTasks });
            }
            return acc;
        }, [] as Task[]);
    };

    const handleToggleTask = (task: Task) => {
        if (!currentUser) return;
        const username = currentUser.username;
        const currentTasks = userTasks[username];
        const modifier = (t: Task) => ({ ...t, completed: !t.completed });

        const updatedTasks = { ...currentTasks };
        updatedTasks.daily = findAndModifyTask(updatedTasks.daily, task.id, modifier);
        Object.keys(updatedTasks.monthly).forEach(m => {
            updatedTasks.monthly[m].generalTasks = findAndModifyTask(updatedTasks.monthly[m].generalTasks, task.id, modifier);
            updatedTasks.monthly[m].groups = updatedTasks.monthly[m].groups.map(g => {
                if (g.type === 'custom') return { ...g, tasks: findAndModifyTask(g.tasks, task.id, modifier) };
                const updatedDays = { ...g.days };
                Object.keys(updatedDays).forEach(d => {
                    updatedDays[d as DayOfWeek] = findAndModifyTask(updatedDays[d as DayOfWeek], task.id, modifier);
                });
                return { ...g, days: updatedDays };
            });
        });
        
        logHistory(task.completed ? 'uncompleted' : 'completed', task.text, `Status toggled`, 'N/A');
        updateTasks(username, updatedTasks);
    };

    const handleUpdateTask = (taskId: string, newText: string) => {
        if (!currentUser) return;
        const modifier = (t: Task) => ({ ...t, text: newText });
        const updatedTasks = { ...userTasks[currentUser.username] };
        updatedTasks.daily = findAndModifyTask(updatedTasks.daily, taskId, modifier);
        Object.keys(updatedTasks.monthly).forEach(m => {
            updatedTasks.monthly[m].generalTasks = findAndModifyTask(updatedTasks.monthly[m].generalTasks, taskId, modifier);
            updatedTasks.monthly[m].groups = updatedTasks.monthly[m].groups.map(g => {
                if (g.type === 'custom') return { ...g, tasks: findAndModifyTask(g.tasks, taskId, modifier) };
                const updatedDays = { ...g.days };
                Object.keys(updatedDays).forEach(d => {
                    updatedDays[d as DayOfWeek] = findAndModifyTask(updatedDays[d as DayOfWeek], taskId, modifier);
                });
                return { ...g, days: updatedDays };
            });
        });
        updateTasks(currentUser.username, updatedTasks);
    };

    const handleDeleteTask = (taskId: string) => {
        if (!currentUser) return;
        const modifier = () => null;
        const updatedTasks = { ...userTasks[currentUser.username] };
        updatedTasks.daily = findAndModifyTask(updatedTasks.daily, taskId, modifier);
        Object.keys(updatedTasks.monthly).forEach(m => {
            updatedTasks.monthly[m].generalTasks = findAndModifyTask(updatedTasks.monthly[m].generalTasks, taskId, modifier);
            updatedTasks.monthly[m].groups = updatedTasks.monthly[m].groups.map(g => {
                if (g.type === 'custom') return { ...g, tasks: findAndModifyTask(g.tasks, taskId, modifier) };
                const updatedDays = { ...g.days };
                Object.keys(updatedDays).forEach(d => {
                    updatedDays[d as DayOfWeek] = findAndModifyTask(updatedDays[d as DayOfWeek], taskId, modifier);
                });
                return { ...g, days: updatedDays };
            });
        });
        updateTasks(currentUser.username, updatedTasks);
    };

    const handleAddSubTask = (parentTaskId: string, text: string) => {
        if (!currentUser) return;
        const modifier = (t: Task): Task => ({
            ...t,
            subTasks: [...t.subTasks, {
                id: uuidv4(),
                text,
                completed: false,
                subTasks: [],
                priority: 'medium' as TaskPriority,
                assignedTo: currentUser.username
            }]
        });
        const updatedTasks = { ...userTasks[currentUser.username] };
        updatedTasks.daily = findAndModifyTask(updatedTasks.daily, parentTaskId, modifier);
        Object.keys(updatedTasks.monthly).forEach(m => {
            updatedTasks.monthly[m].generalTasks = findAndModifyTask(updatedTasks.monthly[m].generalTasks, parentTaskId, modifier);
            updatedTasks.monthly[m].groups = updatedTasks.monthly[m].groups.map(g => {
                if (g.type === 'custom') return { ...g, tasks: findAndModifyTask(g.tasks, parentTaskId, modifier) };
                const updatedDays = { ...g.days };
                Object.keys(updatedDays).forEach(d => {
                    updatedDays[d as DayOfWeek] = findAndModifyTask(updatedDays[d as DayOfWeek], parentTaskId, modifier);
                });
                return { ...g, days: updatedDays };
            });
        });
        updateTasks(currentUser.username, updatedTasks);
    };

    const handleUpdateTaskPriority = (taskId: string, priority: TaskPriority) => {
        if (!currentUser) return;
        const modifier = (t: Task) => ({ ...t, priority });
        const updatedTasks = { ...userTasks[currentUser.username] };
        updatedTasks.daily = findAndModifyTask(updatedTasks.daily, taskId, modifier);
        Object.keys(updatedTasks.monthly).forEach(m => {
            updatedTasks.monthly[m].generalTasks = findAndModifyTask(updatedTasks.monthly[m].generalTasks, taskId, modifier);
            updatedTasks.monthly[m].groups = updatedTasks.monthly[m].groups.map(g => {
                if (g.type === 'custom') return { ...g, tasks: findAndModifyTask(g.tasks, taskId, modifier) };
                const updatedDays = { ...g.days };
                Object.keys(updatedDays).forEach(d => {
                    updatedDays[d as DayOfWeek] = findAndModifyTask(updatedDays[d as DayOfWeek], taskId, modifier);
                });
                return { ...g, days: updatedDays };
            });
        });
        updateTasks(currentUser.username, updatedTasks);
    };

    const handleAddGroup = (monthKey: string, name: string, type: 'custom' | 'weekly') => {
        if (!currentUser) return;
        const updatedTasks = { ...userTasks[currentUser.username] };
        if (!updatedTasks.monthly[monthKey]) updatedTasks.monthly[monthKey] = { id: monthKey, generalTasks: [], groups: [] };
        
        const newGroup = type === 'custom' 
            ? { id: `grp_${uuidv4()}`, name, type: 'custom' as const, tasks: [] }
            : { id: `grp_${uuidv4()}`, name, type: 'weekly' as const, days: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] } };
            
        updatedTasks.monthly[monthKey].groups.push(newGroup);
        updateTasks(currentUser.username, updatedTasks);
    };

    const handleDeleteGroup = (monthKey: string, groupId: string) => {
        if (!currentUser) return;
        const updatedTasks = { ...userTasks[currentUser.username] };
        if (updatedTasks.monthly[monthKey]) {
            updatedTasks.monthly[monthKey].groups = updatedTasks.monthly[monthKey].groups.filter(g => g.id !== groupId);
        }
        updateTasks(currentUser.username, updatedTasks);
    };

    const handleAddDayOffRequest = (req: any) => {
        if (!currentUser) return;
        const updatedTasks = { ...userTasks[currentUser.username] };
        updatedTasks.dayOffs.push({ ...req, id: uuidv4(), username: currentUser.username });
        updateTasks(currentUser.username, updatedTasks);
        
        if (req.type === 'request') {
            const newNotif: Omit<Notification, 'id' | 'timestamp' | 'isRead'> = {
                type: 'leave_request',
                message: `requested a day off for ${req.date}`,
                triggeredBy: currentUser.username
            };
            db.addNotification(newNotif);
        }
    };

    const handleUpdateDayOffStatus = (requestId: string, status: 'approved' | 'rejected') => {
        if (!currentUser) return;
        const updatedUserTasks = { ...userTasks };
        Object.keys(updatedUserTasks).forEach(user => {
            updatedUserTasks[user].dayOffs = updatedUserTasks[user].dayOffs.map(d => 
                d.id === requestId ? { ...d, status, reviewedBy: currentUser.username } : d
            );
        });
        setUserTasks(updatedUserTasks);
        sync({ userTasks: updatedUserTasks });
    };

    const handleClearHistoryForMonth = (monthKey: string) => {
        const newHistory = history.filter(h => h.monthKey !== monthKey);
        setHistory(newHistory);
        sync({ history: newHistory });
    };

    const handleReorderItems = (draggedId: string, targetId: string, type: 'category' | 'folder', position: 'before' | 'after') => {
        if (type === 'category') {
            const newCategories = [...categories];
            const draggedIdx = newCategories.findIndex(c => c.id === draggedId);
            const targetIdx = newCategories.findIndex(c => c.id === targetId);
            const [dragged] = newCategories.splice(draggedIdx, 1);
            const insertionIdx = position === 'before' ? targetIdx : targetIdx + 1;
            newCategories.splice(insertionIdx, 0, dragged);
            updateCategories(newCategories);
        } else {
            const newCategories = categories.map(cat => {
                const folderIdx = cat.folders.findIndex(f => f.id === draggedId);
                if (folderIdx === -1) return cat;
                const newFolders = [...cat.folders];
                const [dragged] = newFolders.splice(folderIdx, 1);
                const targetIdx = newFolders.findIndex(f => f.id === targetId);
                const insertionIdx = position === 'before' ? targetIdx : targetIdx + 1;
                newFolders.splice(insertionIdx, 0, dragged);
                return { ...cat, folders: newFolders };
            });
            updateCategories(newCategories);
        }
    };

    const handleMoveResource = (resourceId: string, sourceFolderId: string, destinationFolderId: string) => {
        let resourceToMove: ResourceItem | null = null;
        const newCategories = categories.map(cat => ({
            ...cat,
            folders: cat.folders.map(f => {
                if (f.id === sourceFolderId) {
                    resourceToMove = f.items.find(i => i.id === resourceId) || null;
                    return { ...f, items: f.items.filter(i => i.id !== resourceId) };
                }
                return f;
            })
        }));

        if (resourceToMove) {
            const updatedCategories = newCategories.map(cat => ({
                ...cat,
                folders: cat.folders.map(f => {
                    if (f.id === destinationFolderId) {
                        return { ...f, items: [...f.items, resourceToMove!] };
                    }
                    return f;
                })
            }));
            updateCategories(updatedCategories);
        }
    };

    const handleReorderResources = (folderId: string, draggedItemId: string, targetItemId: string) => {
        const newCategories = categories.map(cat => ({
            ...cat,
            folders: cat.folders.map(f => {
                if (f.id === folderId) {
                    const newItems = [...f.items];
                    const draggedIdx = newItems.findIndex(i => i.id === draggedItemId);
                    const targetIdx = newItems.findIndex(i => i.id === targetItemId);
                    const [dragged] = newItems.splice(draggedIdx, 1);
                    newItems.splice(targetIdx, 0, dragged);
                    return { ...f, items: newItems };
                }
                return f;
            })
        }));
        updateCategories(newCategories);
    };

    const handleReorderDashboardWidgets = (draggedId: string, targetId: string) => {
        const newOrder = [...dashboardWidgetOrder];
        const draggedIdx = newOrder.indexOf(draggedId);
        const targetIdx = newOrder.indexOf(targetId);
        if (draggedIdx > -1) newOrder.splice(draggedIdx, 1);
        const insertionIdx = targetIdx > -1 ? targetIdx : newOrder.length;
        newOrder.splice(insertionIdx, 0, draggedId);
        setDashboardWidgetOrder(newOrder);
        sync({ dashboardWidgetOrder: newOrder });
    };

    const handleUpdateAppTitle = (newTitle: string) => {
        setAppTitle(newTitle);
        sync({ appTitle: newTitle });
    };

    const handleUpdateBranding = (newBranding: BrandingConfig) => {
        setBranding(newBranding);
        sync({ branding: newBranding });
    };

    const handleMarkNotificationsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        db.markNotificationsRead();
    };

    const handleToggleTaskRepetitive = (taskId: string) => {
        if (!currentUser) return;
        const username = currentUser.username;
        const modifier = (t: Task) => ({ ...t, isRepetitive: !t.isRepetitive });
        const updatedTasks = { ...userTasks[username] };
        updatedTasks.daily = findAndModifyTask(updatedTasks.daily, taskId, modifier);
        Object.keys(updatedTasks.monthly).forEach(m => {
            updatedTasks.monthly[m].generalTasks = findAndModifyTask(updatedTasks.monthly[m].generalTasks, taskId, modifier);
            updatedTasks.monthly[m].groups = updatedTasks.monthly[m].groups.map(g => {
                if (g.type === 'custom') return { ...g, tasks: findAndModifyTask(g.tasks, taskId, modifier) };
                const updatedDays = { ...g.days };
                Object.keys(updatedDays).forEach(d => {
                    updatedDays[d as DayOfWeek] = findAndModifyTask(updatedDays[d as DayOfWeek], taskId, modifier);
                });
                return { ...g, days: updatedDays };
            });
        });
        updateTasks(username, updatedTasks);
    };

    const handleUpdateUserRole = (targetUsername: string, newRole: UserRole) => {
        const updatedAdmins = admins.map(a => a.username === targetUsername ? { ...a, role: newRole } : a);
        setAdmins(updatedAdmins);
        sync({ admins: updatedAdmins });
    };

    const handleToggleUserStatus = (targetUsername: string, newStatus: 'active' | 'inactive') => {
        const updatedAdmins = admins.map(a => a.username === targetUsername ? { ...a, status: newStatus } : a);
        setAdmins(updatedAdmins);
        sync({ admins: updatedAdmins });
    };

    const handleExport = async () => {
        try {
            const data = await db.getAppData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', jsonString);
            downloadAnchor.setAttribute('download', `itrs-hub-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export system backup.');
        }
    };

    const handleImport = async (fileContent: string) => {
        try {
            const parsed = JSON.parse(fileContent) as AppData;
            if (!parsed || !Array.isArray(parsed.categories)) {
                alert('Invalid backup file format. Expected categories array.');
                return;
            }
            await db.updateAppData(parsed, currentUser?.username || 'admin');
            await loadData();
            setImportExportModalOpen(false);
            alert('System data restored successfully!');
        } catch (err) {
            console.error('Import error:', err);
            alert('Invalid JSON file format. Please choose a valid ITRS Hub backup.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#070b14] text-white space-y-6 relative overflow-hidden">
                <div className="absolute w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="w-20 h-20 relative z-10 animate-pulse">
                    <ITRSHubLogo className="w-full h-full" />
                </div>
                <div className="flex flex-col items-center space-y-2.5 text-center px-4 relative z-10">
                    <p className="text-sm font-bold tracking-widest uppercase text-slate-300">Connecting to Cloud Database</p>
                    <div className="w-56 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-cyan-400 animate-loading-bar origin-left"></div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Initializing secure handshake...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] font-sans" onMouseMove={updateActivity} onKeyDown={updateActivity}>
            {!isAuthenticated ? (
                <LoginPage onLogin={handleLogin} appTitle={appTitle} branding={branding} />
            ) : (
                <>
                    <Sidebar 
                        isOpen={isSidebarOpen}
                        onClose={() => setSidebarOpen(false)}
                        categories={categories}
                        activeFolderId={activeFolderId}
                        onSelectFolder={setActiveFolderId}
                        isAdminMode={true}
                        currentUserRole={currentUser?.role || 'admin'}
                        onAddCategory={handleAddCategory}
                        onUpdateCategory={handleUpdateCategory}
                        onDeleteCategory={handleDeleteCategory}
                        onAddFolder={handleAddFolder}
                        onUpdateFolder={handleUpdateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        onReorderItems={handleReorderItems}
                        onMoveResource={handleMoveResource}
                    />
                    <div className={`flex flex-col flex-1 transition-all duration-300 ${isSidebarOpen && window.innerWidth > 1024 ? 'ml-80' : 'ml-0'}`}>
                        <Header
                            appTitle={appTitle}
                            branding={branding}
                            isAuthenticated={true}
                            currentUserRole={currentUser?.role || 'admin'}
                            currentUsername={currentUser?.username || null}
                            currentUserProfilePicture={admins.find(a => a.username === currentUser?.username)?.profilePicture || null}
                            onAdminAction={handleLogout}
                            onManageAdminsClick={() => setSettingsModalOpen(true)}
                            onImportExportClick={() => setImportExportModalOpen(true)}
                            onUpdateAppTitle={handleUpdateAppTitle}
                            onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                            onGoHome={() => setActiveFolderId(null)}
                            onPasswordManagerClick={() => setPasswordManagerModalOpen(true)}
                            onNotepadClick={() => setIsNotepadOpen(true)}
                            notifications={notifications}
                            onMarkNotificationsAsRead={handleMarkNotificationsRead}
                        />
                        <div className="flex items-center justify-between px-6 py-2 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md text-xs">
                           <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
                               <span className="font-semibold text-slate-300">ITRS Cloud Environment</span>
                               <span className="text-slate-600">•</span>
                               <span className="text-slate-400 font-mono text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">{cloudStatus.provider}</span>
                           </div>
                           <div className="flex items-center space-x-3">
                               <div className="flex items-center space-x-2 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40">
                                   <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                   <span className="font-semibold">Cloud Synced</span>
                                   <span className="text-[10px] text-emerald-400/70 font-mono font-normal">({cloudStatus.latencyMs}ms)</span>
                               </div>
                           </div>
                        </div>
                        <ContentDisplay
                            folder={activeFolderId ? categories.flatMap(c => c.folders).find(f => f.id === activeFolderId) || null : null}
                            isAdminMode={true}
                            currentUserRole={currentUser?.role || 'admin'}
                            currentUsername={currentUser?.username || null}
                            appTitle={appTitle}
                            categories={categories}
                            resourceCount={categories.reduce((acc, cat) => acc + cat.folders.reduce((fAcc, f) => fAcc + f.items.length, 0), 0)}
                            tasks={userTasks[currentUser?.username || ''] || { daily: [], monthly: {}, dayOffs: [] }}
                            userTasks={userTasks}
                            admins={admins}
                            history={history}
                            userActivity={userActivity}
                            onAddResource={handleAddResource}
                            onUpdateResource={handleUpdateResource}
                            onDeleteResource={handleDeleteResource}
                            onReorderResources={handleReorderResources}
                            onAddTask={handleAddTask}
                            onAddSubTask={handleAddSubTask}
                            onToggleTask={handleToggleTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onToggleTaskRepetitive={handleToggleTaskRepetitive} 
                            onAddGroup={handleAddGroup}
                            onUpdateGroup={(m, id, name) => {
                                const updated = { ...userTasks[currentUser!.username] };
                                updated.monthly[m].groups = updated.monthly[m].groups.map(g => g.id === id ? { ...g, name } : g);
                                updateTasks(currentUser!.username, updated);
                            }}
                            onDeleteGroup={handleDeleteGroup}
                            onUpdateTaskPriority={handleUpdateTaskPriority}
                            onClearHistoryForMonth={handleClearHistoryForMonth}
                            onReorderDashboardWidgets={handleReorderDashboardWidgets}
                            onUpdateFolder={handleUpdateFolder}
                            onAddDayOffRequest={handleAddDayOffRequest}
                            onUpdateDayOffStatus={handleUpdateDayOffStatus}
                            onStartTour={() => setIsTourOpen(true)}
                            branding={branding}
                        />
                    </div>

                    <AdminManagementModal
                        isOpen={isSettingsModalOpen}
                        onClose={() => setSettingsModalOpen(false)}
                        admins={admins}
                        currentUsername={currentUser?.username || ''}
                        currentUserRole={currentUser?.role || 'admin'}
                        onAddAdmin={(newUser) => {
                            const exists = admins.find(a => a.username === newUser.username);
                            if (exists) return { success: false, message: 'Username already taken' };
                            const updatedAdmins = [...admins, {
                                ...newUser,
                                password: newUser.password || 'password123',
                                role: newUser.role || 'staff',
                                status: 'active'
                            } as AdminUser];
                            setAdmins(updatedAdmins);
                            sync({ admins: updatedAdmins });
                            return { success: true, message: 'User account created' };
                        }}
                        onDeleteAdmin={(username) => {
                            const updatedAdmins = admins.filter(a => a.username !== username);
                            setAdmins(updatedAdmins);
                            sync({ admins: updatedAdmins });
                        }}
                        onUpdateUserRole={handleUpdateUserRole}
                        onToggleUserStatus={handleToggleUserStatus}
                        onChangePassword={(user, old, pass) => {
                            const admin = admins.find(a => a.username === user);
                            if (admin?.password !== old) return { success: false, message: 'Current password incorrect' };
                            const updatedAdmins = admins.map(a => a.username === user ? { ...a, password: pass } : a);
                            setAdmins(updatedAdmins);
                            sync({ admins: updatedAdmins });
                            return { success: true, message: 'Password updated' };
                        }}
                        onChangeUsername={(old, next) => {
                            const updatedAdmins = admins.map(a => a.username === old ? { ...a, username: next } : a);
                            setAdmins(updatedAdmins);
                            sync({ admins: updatedAdmins });
                            return { success: true, message: 'Username updated' };
                        }}
                        onChangeProfilePicture={(user, pic) => {
                            const updatedAdmins = admins.map(a => a.username === user ? { ...a, profilePicture: pic } : a);
                            setAdmins(updatedAdmins);
                            sync({ admins: updatedAdmins });
                        }}
                        branding={branding}
                        onUpdateBranding={handleUpdateBranding}
                        auditLogs={auditLogs}
                    />

                    <ImportExportModal
                        isOpen={isImportExportModalOpen}
                        onClose={() => setImportExportModalOpen(false)}
                        onExport={handleExport}
                        onImport={handleImport}
                    />

                    <PasswordManagerModal
                        isOpen={isPasswordManagerModalOpen}
                        onClose={() => setPasswordManagerModalOpen(false)}
                        credentials={credentials}
                        onAdd={(c) => {
                            const next = [...credentials, { ...c, id: uuidv4(), owner: currentUser!.username }];
                            setCredentials(next);
                            sync({ credentials: next });
                        }}
                        onUpdate={(c) => {
                            const next = credentials.map(item => item.id === c.id ? c : item);
                            setCredentials(next);
                            sync({ credentials: next });
                        }}
                        onDelete={(id) => {
                            const next = credentials.filter(item => item.id !== id);
                            setCredentials(next);
                            sync({ credentials: next });
                        }}
                        currentUser={currentUser ? { username: currentUser.username, permissions: { canViewFullAudit: currentUser.role === 'superadmin' } } : { username: '', permissions: { canViewFullAudit: false } }}
                    />

                    <NotepadModal
                        isOpen={isNotepadOpen}
                        onClose={() => setIsNotepadOpen(false)}
                        initialContent={notepadContent}
                        onSave={handleSaveNotepad}
                    />

                    <GuidedTour
                        steps={tourSteps}
                        isOpen={isTourOpen}
                        onClose={() => setIsTourOpen(false)}
                    />
                </>
            )}
            <style>{`
                @keyframes loading-bar {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.7); }
                    100% { transform: scaleX(1); }
                }
                .animate-loading-bar {
                    animation: loading-bar 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default App;
