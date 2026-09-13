
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  subTasks: Task[];
  isRepetitive?: boolean;
  priority: TaskPriority;
  location?: string;
  assignedTo?: string; // Username
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export interface CustomTaskGroup {
    id: string;
    name: string;
    type: 'custom';
    tasks: Task[];
}

export interface WeeklyTaskGroup {
    id:string;
    name: string;
    type: 'weekly';
    days: { [key in DayOfWeek]: Task[] };
}

export type TaskGroup = CustomTaskGroup | WeeklyTaskGroup;

export interface MonthlyTasks {
  id: string; // YYYY-MM
  generalTasks: Task[];
  groups: TaskGroup[];
}

export interface DayOffRequest {
  id: string;
  username: string;
  date: string;
  type: 'fixed' | 'request';
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  reviewedBy?: string;
}

export interface AppTasks {
  daily: Task[];
  monthly: {
    [monthKey: string]: MonthlyTasks;
  };
  dayOffs: DayOffRequest[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  taskText: string;
  details: string;
  monthKey: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  ip?: string;
}

export interface BrandingConfig {
  logo?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface Credential {
  id: string;
  name: string;
  username: string;
  password?: string;
  notes?: string;
  owner: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  description: string;
  link?: string;
  fileContent?: string;
  fileName?: string;
  fileType?: string;
  owner: string;
  displayOnDashboard?: boolean;
  tags?: string[];
}

export interface Folder {
  id: string;
  name: string;
  items: ResourceItem[];
  displayOnDashboard?: boolean;
  iframeUrl?: string;
  owner?: string;
}

export interface ResourceCategory {
  id: string;
  title: string;
  folders: Folder[];
}

export type UserRole = 'superadmin' | 'admin' | 'staff' | 'viewer';

export interface AdminUser {
    username: string;
    password?: string;
    role: UserRole;
    status: 'active' | 'inactive';
    profilePicture?: string | null;
    lastActive?: string;
    displayName?: string;
}

export interface UserPermissions {
    canManageUsers: boolean;
    canEditBranding: boolean;
    canViewAuditLogs: boolean;
    canManageCategories: boolean;
    canManageFolders: boolean;
    canManageResources: boolean;
    canManageAllTasks: boolean;
    canApproveLeave: boolean;
    canAccessPasswordManager: boolean;
    canViewAllPasswords: boolean;
    canImportExport: boolean;
    isReadOnly: boolean;
}

export const getRolePermissions = (role: UserRole | null | undefined): UserPermissions => {
    switch (role) {
        case 'superadmin':
            return {
                canManageUsers: true,
                canEditBranding: true,
                canViewAuditLogs: true,
                canManageCategories: true,
                canManageFolders: true,
                canManageResources: true,
                canManageAllTasks: true,
                canApproveLeave: true,
                canAccessPasswordManager: true,
                canViewAllPasswords: true,
                canImportExport: true,
                isReadOnly: false,
            };
        case 'admin':
            return {
                canManageUsers: false,
                canEditBranding: false,
                canViewAuditLogs: false,
                canManageCategories: true,
                canManageFolders: true,
                canManageResources: true,
                canManageAllTasks: true,
                canApproveLeave: true,
                canAccessPasswordManager: true,
                canViewAllPasswords: false,
                canImportExport: false,
                isReadOnly: false,
            };
        case 'staff':
            return {
                canManageUsers: false,
                canEditBranding: false,
                canViewAuditLogs: false,
                canManageCategories: false,
                canManageFolders: false,
                canManageResources: true,
                canManageAllTasks: false,
                canApproveLeave: false,
                canAccessPasswordManager: true,
                canViewAllPasswords: false,
                canImportExport: false,
                isReadOnly: false,
            };
        case 'viewer':
        default:
            return {
                canManageUsers: false,
                canEditBranding: false,
                canViewAuditLogs: false,
                canManageCategories: false,
                canManageFolders: false,
                canManageResources: false,
                canManageAllTasks: false,
                canApproveLeave: false,
                canAccessPasswordManager: false,
                canViewAllPasswords: false,
                canImportExport: false,
                isReadOnly: true,
            };
    }
};

export interface Notification {
  id: string;
  timestamp: string;
  type: 'leave_request' | 'task_update' | 'admin_update' | 'resource_update' | 'security_alert' | 'system';
  message: string;
  isRead: boolean;
  triggeredBy: string;
}

export interface AppData {
    appTitle: string;
    categories: ResourceCategory[];
    admins: AdminUser[];
    userTasks: { [username: string]: AppTasks };
    history: HistoryEntry[];
    notifications: Notification[];
    dashboardWidgetOrder: string[];
    credentials: Credential[];
    branding: BrandingConfig;
    auditLogs: AuditLog[];
}
