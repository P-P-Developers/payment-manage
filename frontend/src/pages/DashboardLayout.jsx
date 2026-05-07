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
  Mail,
  Settings,
} from 'lucide-react';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
      <aside className={`hidden md:flex flex-col h-full glass-card border-r border-slate-800 shrink-0 transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}>
        <div className={`h-16 flex items-center border-b border-slate-800 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'
          }`}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              D
            </div>
            {!isSidebarCollapsed && (
              <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent animate-fadeIn">
                DEEP MIND
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
                className={`flex items-center gap-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isSidebarCollapsed ? 'justify-center px-0 h-11 w-11 mx-auto' : 'px-4'
                  } ${isActive
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

          <div className="flex items-center gap-4 relative">
      

            {/* User Profile Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all shadow-md focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-inner uppercase shrink-0">
                  {user?.name?.substring(0, 2)}
                </div>
                <div className="hidden md:block text-left pr-1.5 max-w-[120px]">
                  <p className="text-xs font-semibold truncate text-white leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-indigo-400 font-medium uppercase leading-tight mt-0.5">{user?.role}</p>
                </div>
              </button>

              {/* Glassmorphic Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    onClick={() => setIsProfileOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  ></div>
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-slate-900/95 border border-slate-800 p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200 backdrop-blur-md">
                    {/* User info header inside dropdown */}
                    <div className="px-3.5 py-3 border-b border-slate-800/80 mb-1.5 md:hidden">
                      <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
                      <p className="text-xs text-indigo-400 font-medium uppercase mt-0.5">{user?.role}</p>
                    </div>

                     <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all"
                    >
                      <Key className="h-4 w-4 text-slate-500" />
                      <span>Change Password</span>
                    </button>

                    {user?.role === 'Admin' && (
                      <>
                        <Link
                          to="/dashboard/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all mt-1"
                        >
                          <Settings className="h-4 w-4 text-slate-500" />
                          <span>System Settings</span>
                        </Link>
                        <Link
                          to="/dashboard/smtp"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/20 transition-all mt-1"
                        >
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span>SMTP Settings</span>
                        </Link>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
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
