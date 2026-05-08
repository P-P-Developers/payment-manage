import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import {
  TrendingUp,
  CircleDollarSign,
  Layers,
  Wrench,
  Globe,
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  Landmark,
} from 'lucide-react';

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Welcome Banner Skeleton */}
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 space-y-3">
      <div className="h-7 w-2/3 rounded bg-slate-800"></div>
      <div className="h-4 w-1/2 rounded bg-slate-800/60"></div>
    </div>

    {/* Stats Cards Skeleton Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-1/2 rounded bg-slate-800"></div>
            <div className="h-6 w-3/4 rounded bg-slate-800"></div>
            <div className="h-3 w-2/3 rounded bg-slate-800/60"></div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 shrink-0 ml-4"></div>
        </div>
      ))}
    </div>

    {/* Visual Analytics & Breakdown Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Category Share Spans 2 cols */}
      <div className="lg:col-span-2 rounded-2xl bg-slate-900/40 border border-slate-800 p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-slate-800"></div>
          <div className="h-3.5 w-64 rounded bg-slate-800/60"></div>
        </div>
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-20 rounded bg-slate-800"></div>
                <div className="h-4 w-24 rounded bg-slate-800"></div>
              </div>
              <div className="h-4 w-full rounded bg-slate-800"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Registry Overview Spans 1 col */}
      <div className="lg:col-span-1 rounded-2xl bg-slate-900/40 border border-slate-800 p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-800"></div>
          <div className="h-3.5 w-56 rounded bg-slate-800/60"></div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 border border-slate-800/80 p-4 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-slate-800 shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 rounded bg-slate-800"></div>
              <div className="h-5 w-24 rounded bg-slate-800"></div>
            </div>
          </div>
          <div className="flex items-center gap-4 border border-slate-800/80 p-4 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-slate-800 shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 rounded bg-slate-800"></div>
              <div className="h-5 w-24 rounded bg-slate-800"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest('/stats');
        if (data.success) {
          setStats(data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-6 text-rose-400 flex items-start gap-4">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Metrics Synchronization Failed</h3>
          <p className="text-sm text-rose-400/80 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const paymentBreakdown = stats?.paymentBreakdown || {};
  const paymentModeBreakdown = stats?.paymentModeBreakdown || {};

  const cards = [
    {
      title: 'Total Payments Received',
      value: `₹${metrics.totalPaymentsReceived?.toLocaleString() || 0}`,
      desc: 'Sum of all collected dues',
      icon: CircleDollarSign,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Cash Collections',
      value: `₹${(paymentModeBreakdown.Cash || 0).toLocaleString()}`,
      desc: 'Payments collected in physical cash',
      icon: Wallet,
      color: 'from-amber-500/20 to-lime-500/10 text-amber-400 border-amber-500/30',
    },
    {
      title: 'Bank & UPI Collections',
      value: `₹${((paymentModeBreakdown.UPI || 0) + (paymentModeBreakdown['Bank Transfer'] || 0) + (paymentModeBreakdown.Online || 0)).toLocaleString()}`,
      desc: 'Collected via UPI, IMPS, or Bank',
      icon: Landmark,
      color: 'from-indigo-500/20 to-sky-500/10 text-indigo-400 border-indigo-500/30',
    },
    {
      title: 'Total License Payments',
      value: `₹${(paymentBreakdown.License || 0).toLocaleString()}`,
      desc: 'SaaS licensing dues collected',
      icon: Layers,
      color: 'from-indigo-500/20 to-blue-500/10 text-indigo-400 border-indigo-500/30',
    },
    {
      title: 'Total IP Charges Payments',
      value: `₹${(paymentBreakdown['IP Charges'] || 0).toLocaleString()}`,
      desc: 'IP routing dues collected',
      icon: Globe,
      color: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/30',
    },
    {
      title: 'Total Maintenance Payments',
      value: `₹${(paymentBreakdown.Maintenance || 0).toLocaleString()}`,
      desc: 'Annual SLA support dues collected',
      icon: Wrench,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    },
  ];

  const maxBreakdownVal = Math.max(...Object.values(paymentBreakdown), 1);

  return (
    <div className="space-y-8 animate-pulse-subtle">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl glass-card overflow-hidden p-6 md:p-8 border border-slate-800">
        <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Financial Summary Dashboard</h2>
            <p className="text-slate-400 text-sm mt-1">Real-time ledger overview for Software Panel Sales, billing tracking, and collected dues.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl self-start md:self-auto">
            <TrendingUp className="h-4 w-4" />
            <span>Last Updated: Real-time Live</span>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl bg-gradient-to-br ${card.color} border p-6 flex items-start justify-between shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</p>
                <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
                <p className="text-xs text-slate-400">{card.desc}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-slate-900/60 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment Category Breakdown Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 rounded-2xl glass-card border border-slate-800 p-6 md:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-white">Payment Collections Share</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sum of received payments categorized by billing type</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">Type Distribution</span>
          </div>

          <div className="space-y-5">
            {Object.entries(paymentBreakdown).map(([key, value]) => {
              const pct = maxBreakdownVal > 0 ? (value / maxBreakdownVal) * 100 : 0;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-300">{key}</span>
                    <span className="font-bold text-white">₹{value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-800/60 rounded-full h-3.5 p-[2px] border border-slate-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${key === 'License'
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                          : key === 'IP Charges'
                            ? 'bg-gradient-to-r from-violet-500 to-violet-600'
                            : key === 'Maintenance'
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Registered Panels & Receipts Summary Box (Spans 1 column) */}
        <div className="lg:col-span-1 rounded-2xl glass-card border border-slate-800 p-6 md:p-8 shadow-xl flex flex-col justify-center gap-6">
          <div>
            <h3 className="font-bold text-lg text-white mb-2">Ledger Registry Overview</h3>
            <p className="text-xs text-slate-400">General breakdown of system clients and generated receipts.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Active Panels</p>
                <p className="text-lg font-bold text-white mt-0.5">{stats?.counts?.totalPanels || 0} Clients</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Paid Receipts</p>
                <p className="text-lg font-bold text-white mt-0.5">{stats?.counts?.totalPayments || 0} Transactions</p>
              </div>
            </div>

            {/* Payment Mode Micro-Breakdown */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Breakdown by Payment Mode</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 hover:border-amber-500/20 transition-all">
                  <span className="text-slate-500 block mb-0.5">Cash</span>
                  <span className="text-amber-400 font-bold">₹{(paymentModeBreakdown.Cash || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 hover:border-emerald-500/20 transition-all">
                  <span className="text-slate-500 block mb-0.5">UPI</span>
                  <span className="text-emerald-400 font-bold">₹{(paymentModeBreakdown.UPI || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 hover:border-indigo-500/20 transition-all">
                  <span className="text-slate-500 block mb-0.5">Bank Transfer</span>
                  <span className="text-indigo-400 font-bold">₹{(paymentModeBreakdown['Bank Transfer'] || 0).toLocaleString()}</span>
                </div>
                <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 hover:border-violet-500/20 transition-all">
                  <span className="text-slate-500 block mb-0.5">Online</span>
                  <span className="text-violet-400 font-bold">₹{(paymentModeBreakdown.Online || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
