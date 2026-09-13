import { AppData, AdminUser, Notification, AuditLog } from './types';
import { cloudService } from './services/cloudService';
import { v4 as uuidv4 } from 'uuid';

class DatabaseService {
  async getAppData(): Promise<AppData> {
    return cloudService.fetchAppData();
  }

  async updateAppData(updates: Partial<AppData>, userId: string): Promise<void> {
    return cloudService.syncAppData(updates, userId);
  }

  async addAuditLog(log: Omit<AuditLog, 'id'>): Promise<void> {
    const current = await this.getAppData();
    const newLogs = [{ ...log, id: uuidv4() }, ...current.auditLogs].slice(0, 100);
    return this.updateAppData({ auditLogs: newLogs }, log.userId || 'System');
  }

  async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
    const current = await this.getAppData();
    const newNotif = {
      ...notif,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    const nextNotifs = [newNotif, ...current.notifications].slice(0, 50);
    return this.updateAppData({ notifications: nextNotifs }, notif.triggeredBy || 'System');
  }

  async markNotificationsRead(): Promise<void> {
    const current = await this.getAppData();
    const next = current.notifications.map(n => ({ ...n, isRead: true }));
    return this.updateAppData({ notifications: next }, 'System');
  }

  async login(username: string, password: string): Promise<AdminUser | null> {
    return cloudService.login(username, password);
  }
}

export const db = new DatabaseService();
export { cloudService };
