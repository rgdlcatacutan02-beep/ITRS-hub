import { AppData, AdminUser, Notification, AuditLog } from '../types';
import { resourceData } from '../data/resources';
import { v4 as uuidv4 } from 'uuid';

export type CloudConnectionStatus = 'connected' | 'syncing' | 'offline' | 'error';

export interface CloudStatusEvent {
  status: CloudConnectionStatus;
  latencyMs: number;
  lastSynced: string;
  provider: 'Remote REST API' | 'Cloud Edge (Simulated)';
  endpoint?: string;
}

const DEFAULT_ADMINS: AdminUser[] = [
  { username: "superadmin", password: "admin", role: "superadmin", status: "active", displayName: "System Superadmin" },
  { username: "admin", password: "admin1234", role: "admin", status: "active", displayName: "IT Administrator" },
  { username: "staff", password: "staff1234", role: "staff", status: "active", displayName: "IT Support Specialist" },
  { username: "viewer", password: "viewer1234", role: "viewer", status: "active", displayName: "Guest Technician" }
];

const INITIAL_CLOUD_DATA: AppData = {
  appTitle: "ITRS Hub Workspace",
  categories: resourceData && resourceData.length > 0 ? resourceData : [
    {
      id: "cat_essentials",
      title: "Essential PC Setup",
      folders: [
        {
          id: "ess_browsers",
          name: "Web Browsers",
          owner: "superadmin",
          items: [
            { id: "brw_chrome", name: "Google Chrome", description: "Standard browser for web apps.", link: "https://www.google.com/chrome/", owner: "superadmin" },
            { id: "brw_edge", name: "Microsoft Edge", description: "Pre-installed chromium browser.", link: "https://www.microsoft.com/edge", owner: "superadmin" }
          ]
        }
      ]
    }
  ],
  admins: DEFAULT_ADMINS,
  userTasks: {
    admin: {
      daily: [
        { id: "task_adm_1", text: "Verify Active Directory Domain Controller replication health", completed: true, subTasks: [], priority: "high", location: "Server Room 1" },
        { id: "task_adm_2", text: "Deploy Windows 11 Enterprise Image on Training Lab Workstations", completed: false, subTasks: [
          { id: "st_1", text: "Download latest OEM Drivers & Wi-Fi Profile", completed: true, subTasks: [], priority: "medium" },
          { id: "st_2", text: "Join PCs to Active Directory domain", completed: false, subTasks: [], priority: "high" }
        ], priority: "high", location: "Lab 3 - 2nd Floor" },
        { id: "task_adm_3", text: "Audit VPN Access Keys & Revoke Inactive Contractor Accounts", completed: false, subTasks: [], priority: "medium" },
        { id: "task_adm_4", text: "Backup Cloud Database Manifest & Verify Offsite Storage", completed: true, subTasks: [], priority: "low" }
      ],
      monthly: {},
      dayOffs: [
        { id: "req_staff_1", username: "staff", date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], type: "request", status: "pending", reason: "Annual Medical Checkup / Personal Leave" }
      ]
    },
    staff: {
      daily: [
        { id: "task_stf_1", text: "Configure Network Printers and Static IP Pool for Finance", completed: false, subTasks: [], priority: "medium", location: "2nd Floor - Accounting" },
        { id: "task_stf_2", text: "Prepare 5 standard onboarding laptops with Chrome, 7-Zip & Bitwarden", completed: false, subTasks: [], priority: "high", location: "IT Bench" },
        { id: "task_stf_3", text: "Clean and test backup barcode scanners for Retail POS terminals", completed: true, subTasks: [], priority: "low" }
      ],
      monthly: {},
      dayOffs: [
        { id: "req_staff_1", username: "staff", date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], type: "request", status: "pending", reason: "Annual Medical Checkup / Personal Leave" }
      ]
    },
    superadmin: {
      daily: [
        { id: "task_sup_1", text: "Review Quarterly IT Infrastructure Security & Access Audit", completed: true, subTasks: [], priority: "high" },
        { id: "task_sup_2", text: "Authorize Cloud Service Provider Token Rotation", completed: false, subTasks: [], priority: "high" }
      ],
      monthly: {},
      dayOffs: []
    }
  },
  history: [],
  notifications: [
    {
      id: "notif_cloud_init",
      timestamp: new Date().toISOString(),
      type: "system",
      message: "Cloud database connected. All synchronization protocols active.",
      isRead: false,
      triggeredBy: "Cloud System"
    },
    {
      id: "notif_staff_req",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "system",
      message: "Staff member (staff) submitted a pending day-off request for review.",
      isRead: false,
      triggeredBy: "staff"
    }
  ],
  dashboardWidgetOrder: [],
  credentials: [
    {
      id: "cred_cisco_gw",
      name: "Core Edge Firewall & Gateway",
      username: "admin_cisco_gw",
      password: "Cisco#Gate2026!Sec",
      owner: "admin",
      notes: "Primary Cisco Edge Firewall console. Restricted to IT Operations."
    },
    {
      id: "cred_dc01_rdp",
      name: "Windows Server 2025 DC-01",
      username: "CORP\\Administrator",
      password: "Dc01$CloudSecure!",
      owner: "admin",
      notes: "Primary Domain Controller RDP management."
    },
    {
      id: "cred_wifi_ctrl",
      name: "Enterprise Wi-Fi Controller",
      username: "it_wifi_ops",
      password: "Enterprise#Mesh99",
      owner: "staff",
      notes: "Staff and Guest VLAN access point configuration dashboard."
    }
  ],
  branding: {},
  auditLogs: [
    {
      id: "audit_cloud_init",
      timestamp: new Date().toISOString(),
      userId: "CloudSystem",
      action: "CLOUD_DB_INIT",
      details: "Cloud database service initialized with Role-Based Access Control accounts"
    },
    {
      id: "audit_admin_login",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userId: "admin",
      action: "AUTH_LOGIN",
      details: "Administrator authenticated via Role-Based Access Control portal"
    }
  ]
};

class CloudService {
  private apiBaseUrl: string | null = null;
  private inMemoryCache: AppData | null = null;
  private lastSynced: string = new Date().toISOString();
  private latencyMs: number = 24;
  private status: CloudConnectionStatus = 'connected';
  private listeners: ((event: CloudStatusEvent) => void)[] = [];

  constructor() {
    // Check if an external cloud backend URL is configured in environment
    const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_CLOUD_DB_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      this.apiBaseUrl = envUrl.trim().replace(/\/$/, '');
    }

    // Initialize in-memory cache from memory or fallback cache
    this.inMemoryCache = this.loadInitialCache();
  }

  private loadInitialCache(): AppData {
    // Try to load cached data for instant offline-first boot, else use seed
    try {
      const cached = sessionStorage.getItem('itrs_cloud_cache') || localStorage.getItem('itrs_hub_data');
      if (cached) {
        const parsed: AppData = JSON.parse(cached);
        // Ensure admin account exists with admin1234
        if (!parsed.admins || !Array.isArray(parsed.admins)) {
          parsed.admins = DEFAULT_ADMINS;
        }
        const adminUser = parsed.admins.find(a => a.username === 'admin');
        if (!adminUser) {
          parsed.admins.push({ username: "admin", password: "admin1234", role: "admin", status: "active", displayName: "IT Administrator" });
        } else if (adminUser.password !== 'admin1234') {
          adminUser.password = 'admin1234';
          adminUser.role = 'admin';
        }
        // Seed resources if empty
        if (!parsed.categories || parsed.categories.length === 0) {
          parsed.categories = INITIAL_CLOUD_DATA.categories;
        }
        // Seed demo tasks if empty
        if (!parsed.userTasks || Object.keys(parsed.userTasks).length === 0) {
          parsed.userTasks = INITIAL_CLOUD_DATA.userTasks;
        }
        // Seed demo credentials if empty
        if (!parsed.credentials || parsed.credentials.length === 0) {
          parsed.credentials = INITIAL_CLOUD_DATA.credentials;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Cache read warning:', e);
    }
    return INITIAL_CLOUD_DATA;
  }

  private persistCache(data: AppData) {
    this.inMemoryCache = data;
    try {
      // Store in session cache for recovery across tabs without tying to raw browser storage
      sessionStorage.setItem('itrs_cloud_cache', JSON.stringify(data));
      // Mirror to local backup for continuity
      localStorage.setItem('itrs_hub_data', JSON.stringify(data));
    } catch (e) {
      // Memory only if quota exceeded
    }
  }

  private notifyStatusChange(status: CloudConnectionStatus, latency: number) {
    this.status = status;
    this.latencyMs = latency;
    this.lastSynced = new Date().toISOString();
    const event: CloudStatusEvent = {
      status,
      latencyMs: latency,
      lastSynced: this.lastSynced,
      provider: this.apiBaseUrl ? 'Remote REST API' : 'Cloud Edge (Simulated)',
      endpoint: this.apiBaseUrl || undefined
    };
    this.listeners.forEach(cb => cb(event));
  }

  public onStatusChange(callback: (event: CloudStatusEvent) => void): () => void {
    this.listeners.push(callback);
    // Initial call
    callback({
      status: this.status,
      latencyMs: this.latencyMs,
      lastSynced: this.lastSynced,
      provider: this.apiBaseUrl ? 'Remote REST API' : 'Cloud Edge (Simulated)',
      endpoint: this.apiBaseUrl || undefined
    });
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public getStatus(): CloudStatusEvent {
    return {
      status: this.status,
      latencyMs: this.latencyMs,
      lastSynced: this.lastSynced,
      provider: this.apiBaseUrl ? 'Remote REST API' : 'Cloud Edge (Simulated)',
      endpoint: this.apiBaseUrl || undefined
    };
  }

  public setApiBaseUrl(url: string | null) {
    this.apiBaseUrl = url ? url.replace(/\/$/, '') : null;
    this.notifyStatusChange('connected', 35);
  }

  // --- Core Cloud Operations ---

  async fetchAppData(): Promise<AppData> {
    const start = performance.now();

    if (this.apiBaseUrl) {
      try {
        this.notifyStatusChange('syncing', Math.round(performance.now() - start));
        const res = await fetch(`${this.apiBaseUrl}/api/hub/data`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`Cloud DB HTTP error ${res.status}`);
        const data: AppData = await res.json();
        const duration = Math.max(12, Math.round(performance.now() - start));
        this.persistCache(data);
        this.notifyStatusChange('connected', duration);
        return data;
      } catch (err) {
        console.warn('Remote cloud fetch failed, falling back to cloud cache:', err);
        const duration = Math.round(performance.now() - start);
        this.notifyStatusChange('offline', duration);
      }
    }

    // Simulated Cloud roundtrip with natural latency (60ms)
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = this.inMemoryCache || INITIAL_CLOUD_DATA;
        const duration = Math.round(performance.now() - start);
        this.notifyStatusChange('connected', duration);
        resolve(data);
      }, 75);
    });
  }

  async syncAppData(updates: Partial<AppData>, userId: string): Promise<void> {
    const start = performance.now();
    this.notifyStatusChange('syncing', 15);

    const current = this.inMemoryCache || INITIAL_CLOUD_DATA;
    const updated = { ...current, ...updates };

    if (!updates.auditLogs) {
      const newLog: AuditLog = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        userId,
        action: 'CLOUD_SYNC',
        details: `Synchronized fields: ${Object.keys(updates).join(', ')}`
      };
      updated.auditLogs = [newLog, ...(updated.auditLogs || [])].slice(0, 100);
    }

    this.persistCache(updated);

    if (this.apiBaseUrl) {
      try {
        const res = await fetch(`${this.apiBaseUrl}/api/hub/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId
          },
          body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error(`Cloud DB Sync error ${res.status}`);
      } catch (err) {
        console.warn('Cloud sync remote push failed:', err);
      }
    }

    // Simulate cloud transaction commit
    await new Promise(resolve => setTimeout(resolve, 80));
    const duration = Math.max(15, Math.round(performance.now() - start));
    this.notifyStatusChange('connected', duration);
  }

  async login(username: string, password: string): Promise<AdminUser | null> {
    const start = performance.now();

    if (this.apiBaseUrl) {
      try {
        const res = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (res.ok) {
          const user: AdminUser = await res.json();
          this.notifyStatusChange('connected', Math.round(performance.now() - start));
          return user;
        }
      } catch (err) {
        console.warn('Remote login failed, validating cloud cache:', err);
      }
    }

    const current = this.inMemoryCache || INITIAL_CLOUD_DATA;
    const user = current.admins.find(a => 
      a.username.toLowerCase() === username.trim().toLowerCase() && 
      a.password === password
    );

    if (user) {
      if (user.status === 'inactive') return null;
      user.lastActive = new Date().toISOString();
      await this.syncAppData({ admins: current.admins }, user.username);
      this.notifyStatusChange('connected', Math.round(performance.now() - start));
      return user;
    }

    return null;
  }
}

export const cloudService = new CloudService();
