'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken, getLoggedUser, clearAuth } from '@/utils/api';
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
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const loggedUser = getLoggedUser();

    if (!token || !loggedUser) {
      clearAuth();
      router.replace('/login');
    } else {
      setUser(loggedUser);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 glass-card border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md">
            P
          </div>
          <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            PANEL ACCT
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/5'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-slate-900/60 border border-slate-800 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-inner uppercase">
              {user?.name?.substring(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-indigo-400 font-medium uppercase">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{user?.role}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white px-4 py-3 text-sm font-semibold text-rose-400 transition-all duration-300 shadow-md shadow-rose-500/5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN SECTION */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
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
          {children}
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
                    href={item.href}
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
    </div>
  );
}
