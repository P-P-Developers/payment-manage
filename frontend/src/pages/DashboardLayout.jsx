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
  const [logo, setLogo] = useState('');
  const [orgName, setOrgName] = useState('DEEP MIND');

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

    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('app_system_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.logo) setLogo(parsed.logo);
          if (parsed.orgName) setOrgName(parsed.orgName);
        }
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    };

    loadSettings();
    window.addEventListener('settingsUpdated', loadSettings);

    // Enforce active session checking every 10 seconds
    const checkSession = async () => {
      if (getAuthToken()) {
        try {
          await apiRequest('/auth/me');
        } catch (err) {
          // apiRequest automatically catches 401, clears cookies, alerts user, and redirects
        }
      }
    };
    const sessionInterval = setInterval(checkSession, 10000);

    return () => {
      window.removeEventListener('settingsUpdated', loadSettings);
      clearInterval(sessionInterval);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div>
          <p className="text-slate-600 font-medium animate-pulse">Loading Secure Session...</p>
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
    <div className="flex h-screen w-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className={`hidden md:flex flex-col h-full bg-white border-r border-slate-200 shrink-0 transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}>
        <div className={`h-16 flex items-center border-b border-slate-200 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-between px-6'
          }`}>
          <div className="flex items-center gap-2">
            {logo ? (
              <img src={logo} alt="Logo" className={`object-contain shrink-0 ${isSidebarCollapsed ? 'h-8 w-8' : 'h-10 max-w-full'}`} />
            ) : (
              <>
                <div className="h-8 w-8 rounded-lg bg-[#0A2540] flex items-center justify-center text-white font-bold shadow-md shrink-0">
                  {orgName ? orgName.substring(0, 1).toUpperCase() : 'D'}
                </div>
                {!isSidebarCollapsed && (
                  <span className="font-extrabold text-lg tracking-wider text-[#0A2540] animate-fadeIn truncate max-w-[140px]" title={orgName}>
                    {orgName || 'DEEP MIND'}
                  </span>
                )}
              </>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all duration-200"
              title="Collapse Sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>

        {isSidebarCollapsed && (
          <div className="flex justify-center py-3 border-b border-slate-100">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all duration-200 shadow-sm"
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
                    ? 'bg-[#0A2540] text-white shadow-md shadow-[#0a2540]/15'
                    : 'text-[#4E5E7A] hover:bg-slate-50 hover:text-slate-900 border border-transparent'
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
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-40">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="hidden md:block font-bold text-xl text-slate-900 font-display">
            {navItems.find((item) => pathname === item.href)?.name || 'Panel Accounting'}
          </h1>

          <div className="flex items-center gap-4 relative">

            {/* User Profile Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 transition-all shadow-sm"
              >
                <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-900 flex items-center justify-center font-bold text-xs shadow-inner uppercase shrink-0">
                  {user?.name?.substring(0, 2)}
                </div>
                <div className="hidden md:block text-left pr-1.5 max-w-[120px]">
                  <p className="text-xs font-semibold truncate text-slate-900 leading-tight">{user?.name}</p>
                  {/* <p className="text-[10px] text-indigo-650 font-bold uppercase leading-tight mt-0.5">{user?.role}</p> */}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <>
                  <div
                    onClick={() => setIsProfileOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  ></div>
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-white border border-slate-200 p-2.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    {/* User info header inside dropdown */}
                    <div className="px-3.5 py-3 border-b border-slate-100 mb-1.5 md:hidden">
                      <p className="text-sm font-semibold truncate text-slate-900">{user?.name}</p>
                      <p className="text-xs text-indigo-650 font-bold uppercase mt-0.5">{user?.role}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setIsChangePasswordOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0A2540] hover:bg-[#0A2540]/5 border border-transparent hover:border-[#0A2540]/10 transition-all"
                    >
                      <Key className="h-4 w-4 text-slate-400" />
                      <span>Change Password</span>
                    </button>

                    {user?.role === 'Admin' && (
                      <>
                        <Link
                          to="/dashboard/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0A2540] hover:bg-[#0A2540]/5 border border-transparent hover:border-[#0A2540]/10 transition-all mt-1"
                        >
                          <Settings className="h-4 w-4 text-slate-400" />
                          <span>System Settings</span>
                        </Link>
                        <Link
                          to="/dashboard/smtp"
                          onClick={() => setIsProfileOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0A2540] hover:bg-[#0A2540]/5 border border-transparent hover:border-[#0A2540]/10 transition-all mt-1"
                        >
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span>SMTP Settings</span>
                        </Link>
                      </>
                    )}

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all mt-1"
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
        <main className="p-6 md:p-8 w-full flex-1">
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

          <aside className="relative flex flex-col w-64 max-w-xs bg-white border-r border-slate-200 p-6 z-50">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2 mb-8">
              {logo ? (
                <img src={logo} alt="Logo" className="h-12 max-w-full object-contain shrink-0" />
              ) : (
                <>
                  <div className="h-8 w-8 rounded-lg bg-[#0A2540] flex items-center justify-center text-white font-bold shrink-0">
                    {orgName ? orgName.substring(0, 1).toUpperCase() : 'P'}
                  </div>
                  <span className="font-bold text-lg tracking-wider text-slate-900 truncate" title={orgName}>
                    {orgName || 'PANEL ACCT'}
                  </span>
                </>
              )}
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
                      ? 'bg-[#0A2540] text-white shadow-md shadow-[#0a2540]/15'
                      : 'text-[#4E5E7A] hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-100 pt-6">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsChangePasswordOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-all shadow-sm mb-2"
              >
                <Key className="h-4 w-4" />
                <span>Change Password</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl btn-danger py-3 text-sm font-semibold transition-all shadow-md"
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
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-8 overflow-hidden">
            {/* Background glowing orb */}
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-[#0A2540]/5 blur-2xl"></div>

            <button
              onClick={() => {
                setIsChangePasswordOpen(false);
                setChangeError('');
                setChangeSuccess('');
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-[#0A2540]/5 border border-[#0A2540]/10 text-[#0A2540] flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 font-display text-base">Change Secure Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">Protect your account with a secure password</p>
              </div>
            </div>

            {changeError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs text-rose-600 flex items-center gap-2.5 animate-pulse-subtle">
                <X className="h-4 w-4 shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            {changeSuccess && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-xs text-emerald-600 flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{changeSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full premium-input px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 characters)"
                  className="w-full premium-input px-4 py-3 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full premium-input px-4 py-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={changeSubmitting}
                className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#0A2540]/10 disabled:opacity-50"
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
