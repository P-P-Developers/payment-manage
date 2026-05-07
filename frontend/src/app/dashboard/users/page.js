'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
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
} from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null); // null = adding user, string = editing user
  
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/auth/users');
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users list');
    } finally {
      setLoading(false);
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
          fetchUsers();
          setIsModalOpen(false);
        }
      } else {
        // Add User
        if (!password) {
          setError('Password is required for new users.');
          return;
        }
        payload.password = password;
        const data = await apiRequest('/auth/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (data.success) {
          setSuccess(`User account "${name}" created successfully!`);
          fetchUsers();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you absolutely sure you want to delete user: ${user.name}?`)) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const data = await apiRequest(`/auth/users/${user._id}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(`User "${user.name}" removed successfully.`);
        fetchUsers();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Staff User accounts</h2>
          <p className="text-sm text-slate-400">Manage admin and limited staff users and configure system permissions.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 text-sm transition-all shadow-lg shadow-indigo-600/10"
        >
          <UserPlus className="h-4.5 w-4.5" />
          <span>Add Staff Account</span>
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

      {/* Users Table */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-slate-400 font-medium">Fetching User accounts...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                  <th className="px-6 py-4">User Info</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Enabled Permissions</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold border border-slate-700 uppercase shadow-inner">
                          {user.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'Admin'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {user.role}
                      </span>
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
                                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700/50 capitalize"
                              >
                                {p.replace('_', ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">No active permissions</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 flex items-center justify-center border border-slate-700 hover:border-rose-500/30 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">
                      No staff accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-lg rounded-2xl glass-card p-6 md:p-8 border border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">
              {editUserId ? 'Modify Staff Account' : 'Register New Staff Account'}
            </h3>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Password {editUserId && '(Leave blank to retain current)'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm glass-input appearance-none bg-slate-900 cursor-pointer"
                >
                  <option value="User">User (Staff Account)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
              </div>

              {role === 'User' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Assign Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                    {permissionList.map((p) => {
                      const checked = permissions.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2.5 text-sm font-medium text-slate-300 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleTogglePermission(p.id)}
                            className="hidden"
                          />
                          <div
                            className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                              checked
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-slate-700 bg-slate-950 text-transparent'
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
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-600 transition-all duration-300"
                >
                  {editUserId ? 'Update Account' : 'Register Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
