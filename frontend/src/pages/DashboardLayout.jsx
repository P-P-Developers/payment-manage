import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { getAuthToken, getLoggedUser, clearAuth, apiRequest } from '@/utils/api';
import {
  LayoutDashboard,
  Users,
  Layers,
  CircleDollarSign,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Key,
  Lock,
} from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  const [changeSubmitting, setChangeSubmitting] = useState(false);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setChangeError('Please fill out all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setChangeError('New password must be at least 6 characters.');
      return;
    }

    try {
      setChangeSubmitting(true);
      const res = await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.success) {
        setChangeSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setChangeSuccess('');
        }, 1500);
      } else {
        setChangeError(res.message || 'Failed to update password');
      }
    } catch (err) {
      setChangeError(err.message || 'Incorrect current password or server error');
    } finally {
      setChangeSubmitting(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    const loggedUser = getLoggedUser();

    if (!token || !loggedUser) {
      clearAuth();
      navigate('/login', { replace: true });
    } else {
      setUser(loggedUser);
      setLoading(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400 font-medium animate-pulse">Loading Secure Session...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'User Management',
      href: '/dashboard/users',
      icon: Users,
      isAdminOnly: true,
    },
    {
      name: 'Panels (Clients)',
      href: '/dashboard/panels',
      icon: Layers,
      permission: 'view_panels',
    },
    {
      name: 'Receive Payments',
      href: '/dashboard/payments',
      icon: CircleDollarSign,
      permission: 'add_payments',
    },
    {
      name: 'Activity Logs',
      href: '/dashboard/logs',
      icon: ClipboardList,
      isAdminOnly: true,
    },
  ];

  const filteredNav = navItems.filter((item) => {
    if (item.isAdminOnly && user?.role !== 'Admin') return false;
    if (item.permission && user?.role !== 'Admin' && !user?.permissions.includes(item.permission)) return false;
    return true;
  });

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`hidden md:flex flex-col h-full glass-card border-r border-slate-800 shrink-0 transition-all duration-300 overflow-hidden ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className={`h-16 flex items-center border-b border-slate-800 transition-all duration-300 ${
          isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'
        }`}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              P
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent animate-fadeIn">
                PANEL ACCT
              </span>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all duration-200"
              title="Collapse Sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="flex justify-center py-3 border-b border-slate-800/50">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all duration-200 shadow-md"
              title="Expand Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                title={isSidebarCollapsed ? item.name : ""}
                className={`flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isSidebarCollapsed ? 'justify-center px-0 h-11 w-11 mx-auto' : 'px-4'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/5'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isSidebarCollapsed && <span className="animate-fadeIn">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-900/60 border border-slate-800 mb-3 ${
            isSidebarCollapsed ? 'justify-center' : ''
          }`}>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-inner uppercase shrink-0">
              {user?.name?.substring(0, 2)}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden animate-fadeIn">
                <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-indigo-400 font-medium uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{user?.role}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsChangePasswordOpen(true)}
            title={isSidebarCollapsed ? "Change Password" : ""}
            className={`flex items-center justify-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-indigo-400 transition-all duration-300 shadow-sm mb-2 ${
              isSidebarCollapsed ? 'h-10 w-10 p-0 mx-auto' : 'w-full px-4 py-2.5'
            }`}
          >
            <Key className="h-3.5 w-3.5 shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Change Password</span>}
          </button>

          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Sign Out" : ""}
            className={`flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-sm font-semibold text-rose-400 transition-all duration-300 shadow-md shadow-rose-500/5 ${
              isSidebarCollapsed ? 'h-10 w-10 p-0 mx-auto' : 'w-full px-4 py-3'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && <span className="animate-fadeIn">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN SECTION */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-6 glass-card border-b border-slate-800 sticky top-0 z-40">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="hidden md:block font-bold text-xl text-white">
            {navItems.find((item) => pathname === item.href)?.name || 'Panel Accounting'}
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-indigo-400 font-medium">
              Sys Mode: Stable
            </span>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          ></div>

          <aside className="relative flex flex-col w-64 max-w-xs bg-slate-900 border-r border-slate-800 p-6 z-50">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2 mb-8">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                P
              </div>
              <span className="font-bold text-lg tracking-wider text-white">PANEL ACCT</span>
            </div>

            <nav className="flex-1 space-y-2">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-800 pt-6">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsChangePasswordOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-300 transition-all shadow-md mb-2"
              >
                <Key className="h-4 w-4" />
                <span>Change Password</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-rose-600/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}
      {/* Change Password Modal Overlay */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden">
            {/* Background glowing orb */}
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl"></div>

            <button
              onClick={() => {
                setIsChangePasswordOpen(false);
                setChangeError('');
                setChangeSuccess('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Change Secure Password</h3>
                <p className="text-xs text-slate-400 mt-0.5">Protect your account with a secure password</p>
              </div>
            </div>

            {changeError && (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400 flex items-center gap-2.5 animate-pulse-subtle">
                <X className="h-4 w-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{changeSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 characters)"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={changeSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm py-3 transition-colors shadow-lg shadow-indigo-600/10 mt-2"
              >
                {changeSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
