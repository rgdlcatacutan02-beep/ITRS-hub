import React, { useState, useEffect, useRef } from 'react';
import { AdminUser, BrandingConfig, AuditLog, UserRole } from '../types';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import UserIcon from './icons/UserIcon';
import RefreshIcon from './icons/RefreshIcon';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  admins: AdminUser[];
  currentUsername: string;
  currentUserRole: UserRole | null;
  onAddAdmin: (newUser: { username: string; password?: string; role: UserRole; displayName?: string }) => { success: boolean; message: string };
  onDeleteAdmin: (username: string) => void;
  onUpdateUserRole?: (username: string, role: UserRole) => void;
  onToggleUserStatus?: (username: string, status: 'active' | 'inactive') => void;
  onChangePassword: (username: string, oldPassword: string, newPassword: string) => { success: boolean; message: string };
  onChangeUsername: (oldUsername: string, newUsername: string) => { success: boolean; message: string };
  onChangeProfilePicture: (username: string, picture: string | null) => void;
  branding?: BrandingConfig;
  onUpdateBranding: (branding: BrandingConfig) => void;
  auditLogs?: AuditLog[];
}

const getRoleBadgeStyle = (role: UserRole) => {
  switch (role) {
    case 'superadmin':
      return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
    case 'admin':
      return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
    case 'staff':
      return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
    case 'viewer':
    default:
      return 'bg-gray-800 text-gray-400 border-gray-700';
  }
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'superadmin': return 'Super Admin';
    case 'admin': return 'Admin';
    case 'staff': return 'Staff / Tech';
    case 'viewer': return 'Viewer (Read-Only)';
  }
};

const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  admins,
  currentUsername,
  currentUserRole,
  onAddAdmin,
  onDeleteAdmin,
  onUpdateUserRole,
  onToggleUserStatus,
  onChangePassword,
  onChangeUsername,
  onChangeProfilePicture,
  branding,
  onUpdateBranding,
  auditLogs = []
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'directory' | 'branding' | 'audit'>('users');
  const [activeSection, setActiveSection] = useState<'changePassword' | 'addAdmin' | 'changeUsername' | null>(null);

  // Form states
  const [addAdminForm, setAddAdminForm] = useState<{ username: string; password: string; role: UserRole; displayName: string; error: string }>({
    username: '',
    password: '',
    role: 'admin',
    displayName: '',
    error: ''
  });
  const [changePasswordForm, setChangePasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', error: '', success: '' });
  const [changeUsernameForm, setChangeUsernameForm] = useState({ newUsername: '', error: '', success: '' });
  
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  
  const isSuperAdmin = currentUserRole === 'superadmin';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const currentUserData = admins.find(a => a.username === currentUsername);

  useEffect(() => {
    if (!isOpen) {
        setActiveSection(null);
        setActiveTab('users');
        setAddAdminForm({ username: '', password: '', role: 'admin', displayName: '', error: '' });
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '', error: '', success: '' });
        setChangeUsernameForm({ newUsername: '', error: '', success: '' });
    }
  }, [isOpen]);

  const handleAddAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAdminForm.username || !addAdminForm.password) {
      setAddAdminForm(prev => ({ ...prev, error: 'Username and password are required.' }));
      return;
    }
    const result = onAddAdmin({
      username: addAdminForm.username.trim(),
      password: addAdminForm.password,
      role: addAdminForm.role,
      displayName: addAdminForm.displayName.trim() || undefined
    });
    if (result.success) {
      setAddAdminForm({ username: '', password: '', role: 'admin', displayName: '', error: '' });
      setActiveSection(null);
    } else {
      setAddAdminForm(prev => ({ ...prev, error: result.message as any }));
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordForm(prev => ({...prev, error: '', success: ''}));

    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
        setChangePasswordForm(prev => ({...prev, error: 'All password fields are required.'}));
        return;
    }
    
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
        setChangePasswordForm(prev => ({...prev, error: 'New passwords do not match.'}));
        return;
    }

    const result = onChangePassword(currentUsername, changePasswordForm.currentPassword, changePasswordForm.newPassword);
    if (result.success) {
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '', error: '', success: result.message });
        setTimeout(() => onClose(), 1500);
    } else {
        setChangePasswordForm(prev => ({...prev, error: result.message}));
    }
  };

  const handleChangeUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeUsernameForm(prev => ({...prev, error: '', success: ''}));
    const result = onChangeUsername(currentUsername, changeUsernameForm.newUsername);
    if (result.success) {
        setChangeUsernameForm({ newUsername: '', error: '', success: result.message });
    } else {
        setChangeUsernameForm(prev => ({...prev, error: result.message}));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateBranding({ ...branding, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              onChangeProfilePicture(currentUsername, reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const toggleSection = (section: 'changePassword' | 'addAdmin' | 'changeUsername') => {
    setActiveSection(prev => (prev === section ? null : section));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 text-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col border border-gray-700 overflow-hidden" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
          
          <div className="flex bg-gray-900 border-b border-gray-700 overflow-x-auto">
            <button onClick={() => setActiveTab('users')} className={`px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'users' ? 'border-red-500 text-white bg-gray-800/80' : 'border-transparent text-gray-400 hover:text-white'}`}>
              My Account
            </button>
            {isSuperAdmin && (
              <>
                <button onClick={() => setActiveTab('directory')} className={`px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'directory' ? 'border-red-500 text-white bg-gray-800/80' : 'border-transparent text-gray-400 hover:text-white'}`}>
                  User Accounts Directory ({admins.length})
                </button>
                <button onClick={() => setActiveTab('branding')} className={`px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'branding' ? 'border-red-500 text-white bg-gray-800/80' : 'border-transparent text-gray-400 hover:text-white'}`}>
                  System Branding
                </button>
                <button onClick={() => setActiveTab('audit')} className={`px-5 py-3.5 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'audit' ? 'border-red-500 text-white bg-gray-800/80' : 'border-transparent text-gray-400 hover:text-white'}`}>
                  Audit Logs
                </button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* My Account Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {currentUserData?.profilePicture ? (
                            <img src={currentUserData.profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-gray-600" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                                <UserIcon className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-bold text-white">{currentUsername}</h3>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getRoleBadgeStyle(currentUserRole || 'viewer')}`}>
                                    {getRoleLabel(currentUserRole || 'viewer')}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Logged in as {currentUserData?.displayName || currentUsername}</p>
                        </div>
                    </div>
                    <div>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors">
                            Upload Avatar
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handlePictureChange} />
                    </div>
                </div>

                <div className="space-y-3">
                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('changeUsername')} className="w-full flex justify-between items-center p-4 bg-gray-700/40 hover:bg-gray-700/60 transition-colors">
                      <span className="font-semibold text-sm">Change Username</span>
                      <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === 'changeUsername' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeSection === 'changeUsername' && (
                      <div className="p-4 bg-gray-900/30 border-t border-gray-700">
                        <form onSubmit={handleChangeUsernameSubmit} className="space-y-3">
                          <input type="text" value={changeUsernameForm.newUsername} onChange={(e) => setChangeUsernameForm(prev => ({...prev, newUsername: e.target.value}))} placeholder="New username" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" />
                          {changeUsernameForm.error && <p className="text-red-400 text-xs">{changeUsernameForm.error}</p>}
                          {changeUsernameForm.success && <p className="text-green-400 text-xs">{changeUsernameForm.success}</p>}
                          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-semibold rounded-md">Update Username</button>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="border border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => toggleSection('changePassword')} className="w-full flex justify-between items-center p-4 bg-gray-700/40 hover:bg-gray-700/60 transition-colors">
                      <span className="font-semibold text-sm">Change Password</span>
                      <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === 'changePassword' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeSection === 'changePassword' && (
                      <div className="p-4 bg-gray-900/30 border-t border-gray-700">
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                          <input type="password" value={changePasswordForm.currentPassword} onChange={(e) => setChangePasswordForm(prev => ({...prev, currentPassword: e.target.value}))} placeholder="Current password" required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" />
                          <input type="password" value={changePasswordForm.newPassword} onChange={(e) => setChangePasswordForm(prev => ({...prev, newPassword: e.target.value}))} placeholder="New password" required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" />
                          <input type="password" value={changePasswordForm.confirmPassword} onChange={(e) => setChangePasswordForm(prev => ({...prev, confirmPassword: e.target.value}))} placeholder="Confirm new password" required className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" />
                          {changePasswordForm.error && <p className="text-red-400 text-xs">{changePasswordForm.error}</p>}
                          {changePasswordForm.success && <p className="text-green-400 text-xs">{changePasswordForm.success}</p>}
                          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white transition-colors">Update Password</button>
                        </form>
                      </div>
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div className="border border-gray-700 rounded-lg overflow-hidden">
                      <button onClick={() => toggleSection('addAdmin')} className="w-full flex justify-between items-center p-4 bg-gray-700/40 hover:bg-gray-700/60 transition-colors">
                        <span className="font-semibold text-sm text-indigo-400">+ Register New User Account</span>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${activeSection === 'addAdmin' ? 'rotate-180' : ''}`} />
                      </button>
                      {activeSection === 'addAdmin' && (
                        <div className="p-4 bg-gray-900/30 border-t border-gray-700">
                          <form onSubmit={handleAddAdminSubmit} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Username *</label>
                                <input type="text" value={addAdminForm.username} onChange={(e) => setAddAdminForm(prev => ({...prev, username: e.target.value}))} placeholder="e.g. john_doe" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" required />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Initial Password *</label>
                                <input type="password" value={addAdminForm.password} onChange={(e) => setAddAdminForm(prev => ({...prev, password: e.target.value}))} placeholder="Temporary password" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" required />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Display Name (Optional)</label>
                                <input type="text" value={addAdminForm.displayName} onChange={(e) => setAddAdminForm(prev => ({...prev, displayName: e.target.value}))} placeholder="e.g. John Doe" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-400 mb-1">Assigned Role *</label>
                                <select value={addAdminForm.role} onChange={(e) => setAddAdminForm(prev => ({...prev, role: e.target.value as UserRole}))} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white">
                                  <option value="admin">Admin (Full Management)</option>
                                  <option value="staff">Staff / Technician (Personal Tasks & Resources)</option>
                                  <option value="viewer">Viewer (Read-Only)</option>
                                  <option value="superadmin">Super Admin (System Owner)</option>
                                </select>
                              </div>
                            </div>
                            {addAdminForm.error && <p className="text-red-400 text-xs">{addAdminForm.error}</p>}
                            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold uppercase tracking-wider rounded-lg text-white shadow-md shadow-indigo-600/20 transition-all active:scale-95">Create Account</button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Directory Tab (Superadmin only) */}
            {activeTab === 'directory' && isSuperAdmin && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">System User Accounts</h3>
                    <p className="text-xs text-gray-400">Manage user roles, permissions, and active statuses across the hub.</p>
                  </div>
                </div>

                <div className="bg-gray-900/60 border border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {admins.map(user => {
                        const isSelf = user.username === currentUsername;
                        return (
                          <tr key={user.username} className="hover:bg-gray-800/40 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {user.profilePicture ? (
                                    <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-white flex items-center gap-1.5">
                                    {user.username}
                                    {isSelf && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-bold">YOU</span>}
                                  </p>
                                  {user.displayName && <p className="text-xs text-gray-400">{user.displayName}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={user.role}
                                disabled={isSelf}
                                onChange={(e) => onUpdateUserRole && onUpdateUserRole(user.username, e.target.value as UserRole)}
                                className={`text-xs px-2 py-1 rounded-md border bg-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-red-500 ${getRoleBadgeStyle(user.role)} ${isSelf ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <option value="superadmin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="staff">Staff / Tech</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                disabled={isSelf}
                                onClick={() => onToggleUserStatus && onToggleUserStatus(user.username, user.status === 'active' ? 'inactive' : 'active')}
                                className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors ${user.status === 'active' ? 'bg-green-900/40 text-green-400 border border-green-700/50' : 'bg-red-900/40 text-red-400 border border-red-700/50'} ${isSelf ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                              >
                                {user.status === 'active' ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {!isSelf && (
                                <button
                                  onClick={() => setDeletingUser(user)}
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                  title={`Delete ${user.username}`}
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* System Branding Tab */}
            {activeTab === 'branding' && isSuperAdmin && (
              <div className="space-y-6 animate-fade-in">
                <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h3 className="text-xl font-bold mb-2 text-white">Application Branding</h3>
                  <p className="text-sm text-gray-400 mb-6">Modify the visual identity of the hub. Changes apply globally in real-time.</p>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-28 h-28 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {branding?.logo ? (
                        <img src={branding.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <RefreshIcon className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-xs font-semibold transition-colors">
                        Upload Custom Logo
                      </button>
                      <button onClick={() => onUpdateBranding({ ...branding, logo: undefined })} className="block px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-red-500 hover:text-white text-xs font-semibold transition-colors">
                        Reset to Default Logo
                      </button>
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && isSuperAdmin && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold">System Audit Logs</h3>
                   <span className="text-xs text-gray-500">Tracking {auditLogs.length} events</span>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-800 text-gray-400 text-xs sticky top-0 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Timestamp</th>
                          <th className="px-4 py-2.5">User</th>
                          <th className="px-4 py-2.5">Action</th>
                          <th className="px-4 py-2.5">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 font-mono text-xs">
                        {auditLogs.length > 0 ? (
                          auditLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-800/50">
                              <td className="px-4 py-2 text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="px-4 py-2 font-semibold text-white">{log.userId}</td>
                              <td className="px-4 py-2 text-blue-400 font-bold">{log.action}</td>
                              <td className="px-4 py-2 text-gray-300 font-sans">{log.details}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic font-sans">No audit events recorded yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-semibold transition-colors">Close</button>
          </div>
        </div>
      </div>

      {deletingUser && (
        <ConfirmationModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => { onDeleteAdmin(deletingUser.username); setDeletingUser(null); }}
          title="Remove User Account"
          message={`Are you sure you want to permanently delete user "${deletingUser.username}"? They will lose access to all tasks and credentials.`}
        />
      )}
    </>
  );
};

export default AdminManagementModal;
