import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import ConfirmModal from '@/components/ConfirmModal';
import {
  UserPlus,
  Edit2,
  Trash2,
  Lock,
  Mail,
  User as UserIcon,
  Check,
  X,
  AlertCircle,
  ShieldAlert,
  History,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Server,
  LogIn,
  LogOut,
  PlusCircle,
  Edit,
  Calendar,
} from 'lucide-react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-3 w-40 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="px-6 py-4">
      <div className="flex gap-1.5">
        <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </td>
  </tr>
);

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null); // null = adding user, string = editing user
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isReset2faModalOpen, setIsReset2faModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Activity Log Modal State
  const [selectedLogUser, setSelectedLogUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleViewUserLogs = async (userObj) => {
    try {
      setSelectedLogUser(userObj);
      setLoadingLogs(true);
      setUserLogs([]);
      const data = await apiRequest(`/logs?userId=${userObj._id}`);
      if (data.success) {
        setUserLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load user logs', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [permissions, setPermissions] = useState([]);

  const permissionList = [
    { id: 'view_panels', label: 'View Panels' },
    { id: 'add_payments', label: 'Add Payments' },
    { id: 'view_reports', label: 'View Reports' },
    { id: 'edit_payments', label: 'Edit Payments' },
  ];

  const fetchUsers = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await apiRequest('/auth/users');
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users list');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('User');
    setPermissions(['view_panels']); // Default permission
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditUserId(user._id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // Don't show password
    setRole(user.role);
    setPermissions(user.permissions || []);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (pId) => {
    if (permissions.includes(pId)) {
      setPermissions(permissions.filter((p) => p !== pId));
    } else {
      setPermissions([...permissions, pId]);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        name,
        email,
        role,
        permissions: role === 'Admin' ? ['view_panels', 'add_payments', 'view_reports', 'edit_payments'] : permissions,
      };

      if (password) {
        payload.password = password;
      }

      if (editUserId) {
        // Edit User
        const data = await apiRequest(`/auth/users/${editUserId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (data.success) {
          setSuccess(`User account "${name}" updated successfully!`);
          fetchUsers(true);
          setIsModalOpen(false);
        }
      } else {
        // Add User
        if (!password) {
          setError('Password is required for new users.');
          setSubmitting(false);
          return;
        }
        payload.password = password;
        const data = await apiRequest('/auth/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (data.success) {
          setSuccess(`User account "${name}" created successfully!`);
          fetchUsers(true);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setError('');
    setSuccess('');

    try {
      const data = await apiRequest(`/auth/users/${userToDelete._id}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(`User "${userToDelete.name}" removed successfully.`);
        fetchUsers(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const handleReset2FA = (user) => {
    setUserToReset(user);
    setIsReset2faModalOpen(true);
  };

  const handleConfirmReset2FA = async () => {
    if (!userToReset) return;
    setError('');
    setSuccess('');

    try {
      const data = await apiRequest(`/auth/users/${userToReset._id}/reset-2fa`, {
        method: 'POST',
      });
      if (data.success) {
        setSuccess(`Successfully reset 2FA protection settings for "${userToReset.name}".`);
        fetchUsers(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset 2FA');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

        {/* Left Content */}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Staff User Accounts
            </h2>

            {loading && users.length > 0 && (
              <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage admin and staff users, roles, and permissions.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Staff</span>
        </button>

      </div>

      {/* Success/Error Banners */}
      {success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 flex items-start gap-2 text-sm">
          <Check className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400 flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table - Desktop View */}
      <div className="hidden md:block rounded-2xl glass-card border border-slate-300 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">User Info</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4">2FA Protection</th>
                <th className="px-6 py-4">Enabled Permissions</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {loading && users.length === 0 ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-300 dark:border-slate-700 uppercase shadow-inner">
                          {user.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${user.role === 'Admin'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          <ShieldX className="h-3.5 w-3.5" />
                          <span>Not Setup</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'Admin' ? (
                        <span className="text-xs text-indigo-400 font-semibold italic">Full System Access</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {user.permissions && user.permissions.length > 0 ? (
                            user.permissions.map((p) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs border border-slate-300/50 dark:border-slate-700/50 capitalize"
                              >
                                {p.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 dark:text-slate-500">No active permissions</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewUserLogs(user)}
                          className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 flex items-center justify-center border border-slate-300 dark:border-slate-700 transition-colors"
                          title="View User Activity Logs"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        {user.twoFactorEnabled && (
                          <button
                            onClick={() => handleReset2FA(user)}
                            className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-amber-600/20 hover:border-amber-500/30 text-amber-500 flex items-center justify-center border border-slate-300 dark:border-slate-700 transition-colors"
                            title="Reset 2FA Protection"
                          >
                            <RefreshCw className="h-4 w-4 animate-spin-hover" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-300 dark:border-slate-700 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-600/20 text-slate-700 dark:text-slate-300 hover:text-rose-400 flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:border-rose-500/30 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-600 dark:text-slate-400">
                    No staff accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Card List - Mobile View */}
      <div className="block md:hidden space-y-4">
        {loading && users.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-2xl glass-card border border-slate-300 dark:border-slate-800 p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
                    <div className="h-3 w-36 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
                  </div>
                </div>
                <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
                  <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length > 0 ? (
          users.map((user) => (
            <div key={user._id} className="rounded-2xl glass-card border border-slate-300 dark:border-slate-800 p-5 space-y-4 shadow-md bg-slate-50/40 dark:bg-slate-950/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-300 dark:border-slate-700 uppercase shadow-inner shrink-0 animate-in fade-in zoom-in duration-200">
                    {user.name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{user.name}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${user.role === 'Admin'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                  >
                    {user.role}
                  </span>
                  {user.twoFactorEnabled ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      <span>2FA</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      <ShieldX className="h-2.5 w-2.5" />
                      <span>No 2FA</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1.5">Permissions</p>
                {user.role === 'Admin' ? (
                  <span className="text-xs text-indigo-400 font-semibold italic">Full System Access</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.permissions && user.permissions.length > 0 ? (
                      user.permissions.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-300 dark:border-slate-800 capitalize font-medium"
                        >
                          {p.replace('_', ' ')}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-500">No active permissions</span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-300/60 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-500 font-semibold uppercase">Quick Actions</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewUserLogs(user)}
                    className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-indigo-400 flex items-center justify-center border border-slate-300 dark:border-slate-700 transition-colors"
                    title="View Logs"
                  >
                    <History className="h-3.5 w-3.5" />
                  </button>
                  {user.twoFactorEnabled && (
                    <button
                      onClick={() => handleReset2FA(user)}
                      className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-amber-600/20 text-amber-500 flex items-center justify-center border border-slate-300 dark:border-slate-700 transition-colors"
                      title="Reset 2FA"
                    >
                      <RefreshCw className="h-3.5 w-3.5 animate-spin-hover" />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-300 dark:border-slate-700 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-600/20 text-rose-450 flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:border-rose-500/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl glass-card border border-slate-300 dark:border-slate-800 p-8 text-center text-slate-600 dark:text-slate-400 text-sm">
            No staff accounts found.
          </div>
        )}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-lg rounded-2xl glass-card p-6 md:p-8 border border-slate-300 dark:border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editUserId ? 'Modify Staff Account' : 'Register New Staff Account'}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Password {editUserId && '(Leave blank to retain current)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editUserId ? '••••••••' : 'Password (min 6 characters)'}
                    className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input"
                    required={!editUserId}
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm glass-input appearance-none bg-slate-100 dark:bg-slate-900 cursor-pointer"
                >
                  <option value="User">User (Staff Account)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
              </div>

              {role === 'User' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                    Assign Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-slate-100/60 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-300 dark:border-slate-800">
                    {permissionList.map((p) => {
                      const checked = permissions.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleTogglePermission(p.id)}
                            className="hidden"
                          />
                          <div
                            className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${checked
                              ? 'bg-indigo-600 border-indigo-500 text-slate-900 dark:text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-transparent'
                              }`}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                          <span>{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {role === 'Admin' && (
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <span>Admins automatically receive full system credentials and bypass all standard permission limits.</span>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white hover:from-indigo-600 transition-all duration-300 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editUserId ? 'Updating...' : 'Registering...'}
                    </span>
                  ) : (
                    editUserId ? 'Update Account' : 'Register Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* USER ACTIVITY LOGS MODAL */}
      {selectedLogUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div onClick={() => setSelectedLogUser(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden bg-white dark:bg-slate-900">
            {/* ── Modal Header ── */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 shrink-0">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold uppercase shadow-lg shrink-0">
                {selectedLogUser.name.substring(0, 2)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Activity History</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{selectedLogUser.name} · {selectedLogUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedLogUser(null)}
                className="ml-auto shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Log List ── */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
              {loadingLogs ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-indigo-500 border-t-transparent" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Loading activity logs…</p>
                </div>
              ) : userLogs.length > 0 ? (
                userLogs.map((log) => {
                  /* ── per-action colour tokens ── */
                  const actionMeta = {
                    ADD:    { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25', dot: 'bg-emerald-400', Icon: PlusCircle },
                    EDIT:   { badge: 'bg-amber-500/10  text-amber-500  border-amber-500/25',   dot: 'bg-amber-400',   Icon: Edit },
                    DELETE: { badge: 'bg-rose-500/10   text-rose-500   border-rose-500/25',    dot: 'bg-rose-400',    Icon: Trash2 },
                    LOGIN:  { badge: 'bg-teal-500/10   text-teal-500   border-teal-500/25',    dot: 'bg-teal-400',    Icon: LogIn },
                    LOGOUT: { badge: 'bg-orange-500/10 text-orange-500 border-orange-500/25', dot: 'bg-orange-400',  Icon: LogOut },
                  };
                  const meta = actionMeta[log.actionType] || actionMeta.EDIT;
                  const ActionIcon = meta.Icon;

                  return (
                    <div
                      key={log._id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-colors"
                    >
                      {/* top row: badge + module + timestamp */}
                      <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${meta.badge}`}>
                          <ActionIcon className="h-3 w-3" />
                          {log.actionType}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                          {log.module}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
                          })}
                        </span>
                      </div>

                      {/* details text */}
                      <p className="px-4 pb-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed break-words">
                        {log.details}
                      </p>

                      {/* footer: IP address */}
                      {log.ipAddress && (
                        <div className="flex items-center gap-1.5 px-4 py-2 border-t border-slate-200 dark:border-slate-700/60 bg-slate-100/50 dark:bg-slate-900/30 rounded-b-xl">
                          <Server className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">IP:</span>
                          <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-1.5 py-0.5 rounded">
                            {log.ipAddress}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
                  <History className="h-10 w-10 opacity-40" />
                  <p className="text-sm font-medium">No activity history found.</p>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-between items-center shrink-0">
              <span className="text-xs text-slate-400 dark:text-slate-500">{userLogs.length} event{userLogs.length !== 1 ? 's' : ''} found</span>
              <button
                onClick={() => setSelectedLogUser(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDeleteUser}
        title="Delete Staff Account"
        message={`Are you absolutely sure you want to delete staff account: ${userToDelete?.name}? This action cannot be undone!`}
      />
      <ConfirmModal
        isOpen={isReset2faModalOpen}
        onClose={() => {
          setIsReset2faModalOpen(false);
          setUserToReset(null);
        }}
        onConfirm={handleConfirmReset2FA}
        title="Reset 2FA Protection"
        message={`Are you absolutely sure you want to reset 2FA protection settings for staff account: ${userToReset?.name}? This will force them to re-configure their Google Authenticator app on next login.`}
      />
    </div>
  );
}
