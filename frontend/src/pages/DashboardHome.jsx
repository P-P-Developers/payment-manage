import { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  Filter,
  Award,
} from 'lucide-react';

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Welcome Banner Skeleton */}
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 md:p-8 space-y-3">
      <div className="h-7 w-2/3 rounded bg-slate-800"></div>
      <div className="h-4 w-1/2 rounded bg-slate-800/60"></div>
    </div>

    {/* Filters Skeleton */}
    <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="h-6 w-1/4 rounded bg-slate-800"></div>
      <div className="h-10 w-1/3 rounded bg-slate-800"></div>
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
      <div className="lg:col-span-2 rounded-2xl bg-slate-900/40 border border-slate-800 p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-slate-800"></div>
          <div className="h-3.5 w-64 rounded bg-slate-800/60"></div>
        </div>
        <div className="h-64 rounded-xl bg-slate-800/40"></div>
      </div>

      <div className="lg:col-span-1 rounded-2xl bg-slate-900/40 border border-slate-800 p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-800"></div>
          <div className="h-3.5 w-56 rounded bg-slate-800/60"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border border-slate-800/80 p-4 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-slate-800 shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 rounded bg-slate-800"></div>
                <div className="h-5 w-24 rounded bg-slate-800"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = String(now.getMonth() + 1).padStart(2, '0');
  const curQ = Math.ceil((now.getMonth() + 1) / 3);

  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(`${curYear}-${curMonth}`);
  const [selectedQuarter, setSelectedQuarter] = useState(`${curYear}-Q${curQ}`);
  const [showInactive, setShowInactive] = useState(false);

  // Performance Table & Card States
  const [selectedCatFilter, setSelectedCatFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [perfSortField, setPerfSortField] = useState('totalBilled'); // default sort by billed
  const [perfSortOrder, setPerfSortOrder] = useState('desc'); // default descending order

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

  // Compute unique months and quarters in available data
  const { availableMonths, availableQuarters } = useMemo(() => {
    const rawPayments = stats?.payments || [];
    const monthsSet = new Set();
    const quartersSet = new Set();

    // Ensure current month/quarter are present by default
    monthsSet.add(`${curYear}-${curMonth}`);
    quartersSet.add(`${curYear}-Q${curQ}`);

    rawPayments.forEach((p) => {
      if (!p.timestamp) return;
      const date = new Date(p.timestamp);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const q = Math.ceil((date.getMonth() + 1) / 3);

      monthsSet.add(`${y}-${m}`);
      quartersSet.add(`${y}-Q${q}`);
    });

    const monthsArr = Array.from(monthsSet).sort().reverse().map((mVal) => {
      const [year, month] = mVal.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        value: mVal,
        label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
      };
    });

    const quartersArr = Array.from(quartersSet).sort().reverse().map((qVal) => {
      const [year, qStr] = qVal.split('-Q');
      const q = parseInt(qStr);
      const qLabels = {
        1: 'Q1 (Jan-Mar)',
        2: 'Q2 (Apr-Jun)',
        3: 'Q3 (Jul-Sep)',
        4: 'Q4 (Oct-Dec)',
      };
      return {
        value: qVal,
        label: `${qLabels[q]} ${year}`,
      };
    });

    return { availableMonths: monthsArr, availableQuarters: quartersArr };
  }, [stats, curYear, curMonth, curQ]);

  // Aggregate panel stats and filter payments in real time
  const {
    filteredPayments,
    totalBilledAmount,
    totalPaymentsReceived,
    totalBillsCount,
    cashCollections,
    onlineCollections,
    licensePayments,
    licenseQtyTotal,
    maintenancePayments,
    panelStatsArray,
    recoveryRate,
    outstandingBalance,
  } = useMemo(() => {
    const rawPanels = stats?.panels || [];
    const rawPayments = stats?.payments || [];

    // Filter payments based on selection
    const filtered = rawPayments.filter((p) => {
      if (!p.timestamp) return false;
      const date = new Date(p.timestamp);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');

      if (filterType === 'monthly') {
        return `${y}-${m}` === selectedMonth;
      } else if (filterType === 'quarterly') {
        const q = Math.ceil((date.getMonth() + 1) / 3);
        return `${y}-Q${q}` === selectedQuarter;
      }
      return true;
    });

    // Initialize panel map for aggregation
    const map = {};
    rawPanels.forEach((p) => {
      map[p._id] = {
        _id: p._id,
        panelName: p.panelName,
        ownerName: p.ownerName,
        category: p.category || 'Algo',
        totalPaid: 0,
        totalBilled: 0,
        billCount: 0,
        licensePaid: 0,
        licenseBilled: 0,
        licenseQty: 0,
        maintenancePaid: 0,
        maintenanceBilled: 0,
      };
    });

    // Process filtered payments
    let totalBilled = 0;
    let totalPaid = 0;
    let billsCount = 0;
    let cash = 0;
    let online = 0;
    let licPaid = 0;
    let licQty = 0;
    let maintPaid = 0;

    filtered.forEach((p) => {
      const pId = p.panelId?._id || p.panelId;
      totalPaid += p.amountReceived || 0;
      totalBilled += p.billAmount || 0;

      if (p.billAmount > 0) billsCount += 1;

      if (p.paymentMode === 'Cash') {
        cash += p.amountReceived || 0;
      } else {
        online += p.amountReceived || 0;
      }

      if (p.paymentType === 'License') {
        licPaid += p.amountReceived || 0;
        licQty += p.quantity || 0;
      } else if (p.paymentType === 'Maintenance') {
        maintPaid += p.amountReceived || 0;
      }

      if (pId) {
        if (!map[pId]) {
          map[pId] = {
            _id: pId,
            panelName: p.panelId?.panelName || 'Deleted Panel',
            ownerName: 'N/A',
            category: p.panelId?.category || 'Algo',
            totalPaid: 0,
            totalBilled: 0,
            billCount: 0,
            licensePaid: 0,
            licenseBilled: 0,
            licenseQty: 0,
            maintenancePaid: 0,
            maintenanceBilled: 0,
          };
        }
        map[pId].totalPaid += p.amountReceived || 0;
        map[pId].totalBilled += p.billAmount || 0;
        if (p.billAmount > 0) {
          map[pId].billCount += 1;
        }
        if (p.paymentType === 'License') {
          map[pId].licensePaid += p.amountReceived || 0;
          map[pId].licenseBilled += p.billAmount || 0;
          map[pId].licenseQty += p.quantity || 0;
        } else if (p.paymentType === 'Maintenance') {
          map[pId].maintenancePaid += p.amountReceived || 0;
          map[pId].maintenanceBilled += p.billAmount || 0;
        }
      }
    });

    const panelStats = Object.values(map).map((panel) => {
      const rate = panel.totalBilled > 0 ? Math.round((panel.totalPaid / panel.totalBilled) * 100) : 0;
      const outstanding = panel.totalBilled - panel.totalPaid;
      
      let status = 'Critically Inactive';
      if (panel.totalBilled > 0 || panel.totalPaid > 0) {
        if (rate >= 90) {
          status = 'Excellent';
        } else if (rate >= 50) {
          status = 'Healthy';
        } else {
          status = 'Needs Attention';
        }
      }
      
      return {
        ...panel,
        recoveryRate: rate,
        outstanding,
        status,
      };
    });
    
    const recRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    const netBal = totalBilled - totalPaid;

    // Cumulative outstanding helper
    const openingBalSum = rawPanels.reduce((sum, p) => sum + (p.openingBalance || 0), 0);
    const cumulativeOutstanding = filterType === 'all'
      ? openingBalSum + totalBilled - totalPaid
      : netBal; // Show net period balance for monthly/quarterly filters

    return {
      filteredPayments: filtered,
      totalBilledAmount: totalBilled,
      totalPaymentsReceived: totalPaid,
      totalBillsCount: billsCount,
      cashCollections: cash,
      onlineCollections: online,
      licensePayments: licPaid,
      licenseQtyTotal: licQty,
      maintenancePayments: maintPaid,
      panelStatsArray: panelStats,
      recoveryRate: recRate,
      outstandingBalance: cumulativeOutstanding,
    };
  }, [stats, filterType, selectedMonth, selectedQuarter]);

  // Compute trend data for SVG Chart
  const trendData = useMemo(() => {
    if (filterType === 'monthly') {
      // Group by 5-day intervals
      const intervals = [
        { label: 'Day 1-5', start: 1, end: 5, paid: 0, billed: 0 },
        { label: 'Day 6-10', start: 6, end: 10, paid: 0, billed: 0 },
        { label: 'Day 11-15', start: 11, end: 15, paid: 0, billed: 0 },
        { label: 'Day 16-20', start: 16, end: 20, paid: 0, billed: 0 },
        { label: 'Day 21-25', start: 21, end: 25, paid: 0, billed: 0 },
        { label: 'Day 26+', start: 26, end: 31, paid: 0, billed: 0 },
      ];

      filteredPayments.forEach((p) => {
        const dVal = new Date(p.timestamp).getDate();
        const interval = intervals.find((int) => dVal >= int.start && dVal <= int.end);
        if (interval) {
          interval.paid += p.amountReceived || 0;
          interval.billed += p.billAmount || 0;
        }
      });

      return intervals;
    } else if (filterType === 'quarterly') {
      // Group by 3 months of selected quarter
      const [year, qStr] = selectedQuarter.split('-Q');
      const q = parseInt(qStr);
      const startMonth = (q - 1) * 3; // 0-indexed

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const months = [
        { label: monthNames[startMonth].substring(0, 3), monthIndex: startMonth, paid: 0, billed: 0 },
        { label: monthNames[startMonth + 1].substring(0, 3), monthIndex: startMonth + 1, paid: 0, billed: 0 },
        { label: monthNames[startMonth + 2].substring(0, 3), monthIndex: startMonth + 2, paid: 0, billed: 0 },
      ];

      filteredPayments.forEach((p) => {
        const date = new Date(p.timestamp);
        const mIdx = date.getMonth();
        const monthObj = months.find((m) => m.monthIndex === mIdx);
        if (monthObj) {
          monthObj.paid += p.amountReceived || 0;
          monthObj.billed += p.billAmount || 0;
        }
      });

      return months;
    } else {
      // Group by last 6 months
      const trendMap = {};
      const today = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short' });
        trendMap[key] = { label, paid: 0, billed: 0 };
      }

      filteredPayments.forEach((p) => {
        const date = new Date(p.timestamp);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (trendMap[key]) {
          trendMap[key].paid += p.amountReceived || 0;
          trendMap[key].billed += p.billAmount || 0;
        }
      });

      return Object.values(trendMap);
    }
  }, [filteredPayments, filterType, selectedQuarter]);

  const uniqueCategories = useMemo(() => {
    const rawPanels = stats?.panels || [];
    const set = new Set(rawPanels.map((p) => p.category || 'Algo'));
    return Array.from(set);
  }, [stats]);

  const processedPerfPanels = useMemo(() => {
    let list = [...panelStatsArray];

    // Filter by Category
    if (selectedCatFilter !== 'All') {
      list = list.filter((p) => p.category === selectedCatFilter);
    }

    // Filter by Status
    if (selectedStatusFilter !== 'All') {
      list = list.filter((p) => p.status === selectedStatusFilter);
    }

    // Sort list
    list.sort((a, b) => {
      let valA = a[perfSortField];
      let valB = b[perfSortField];

      if (typeof valA === 'string') {
        return perfSortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return perfSortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [panelStatsArray, selectedCatFilter, selectedStatusFilter, perfSortField, perfSortOrder]);

  // worstPerforming (recoveryRate < 50, billed > 0) or fallback to highest outstanding
  const worstPerforming = useMemo(() => {
    const attention = [...panelStatsArray]
      .filter((p) => p.totalBilled > 0 && p.recoveryRate < 50)
      .sort((a, b) => a.recoveryRate - b.recoveryRate);

    if (attention.length > 0) return attention.slice(0, 3);

    // fallback to highest outstanding
    return [...panelStatsArray]
      .filter((p) => p.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 3);
  }, [panelStatsArray]);

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

  // Rank panel stats
  const topPayingPanels = [...panelStatsArray]
    .filter(p => p.totalPaid > 0)
    .sort((a, b) => b.totalPaid - a.totalPaid)
    .slice(0, 5);

  const topBilledPanels = [...panelStatsArray]
    .filter(p => p.totalBilled > 0)
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 5);

  const topLicensePanels = [...panelStatsArray]
    .filter(p => p.licenseQty > 0 || p.licensePaid > 0 || p.licenseBilled > 0)
    .sort((a, b) => b.licenseQty - a.licenseQty || (b.licenseBilled || b.licensePaid) - (a.licenseBilled || a.licensePaid))
    .slice(0, 5);

  const topMaintenancePanels = [...panelStatsArray]
    .filter(p => p.maintenancePaid > 0 || p.maintenanceBilled > 0)
    .sort((a, b) => (b.maintenanceBilled || b.maintenancePaid) - (a.maintenanceBilled || a.maintenancePaid))
    .slice(0, 5);

  const inactivePanels = panelStatsArray.filter(p => p.totalBilled === 0 && p.totalPaid === 0);

  // Sorting & Filtering for Client Performance Grid Table
  const handleSort = (field) => {
    if (perfSortField === field) {
      setPerfSortOrder(perfSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPerfSortField(field);
      setPerfSortOrder('desc'); // Default sort descending
    }
  };

  const cards = [
    {
      title: 'Sales Invoiced (Billed)',
      value: `₹${totalBilledAmount.toLocaleString()}`,
      desc: `${totalBillsCount} Bills Generated`,
      icon: FileSpreadsheet,
      color: 'from-indigo-500/20 to-blue-500/10 text-indigo-400 border-indigo-500/30',
    },
    {
      title: 'Revenue Collected',
      value: `₹${totalPaymentsReceived.toLocaleString()}`,
      desc: `Recovery Rate: ${recoveryRate}%`,
      icon: CircleDollarSign,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    },
    {
      title: 'Cash Collections',
      value: `₹${cashCollections.toLocaleString()}`,
      desc: `Online/UPI: ₹${onlineCollections.toLocaleString()}`,
      icon: Wallet,
      color: 'from-amber-500/20 to-lime-500/10 text-amber-400 border-amber-500/30',
    },
    {
      title: 'SaaS License Sales',
      value: `₹${licensePayments.toLocaleString()}`,
      desc: `${licenseQtyTotal} Licenses Issued`,
      icon: Layers,
      color: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
    },
    {
      title: 'SLA Maintenance',
      value: `₹${maintenancePayments.toLocaleString()}`,
      desc: 'Annual Support SLA fees',
      icon: Wrench,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
    },
    {
      title: filterType === 'all' ? 'Cumulative Outstanding' : 'Period Net Outstanding',
      value: `₹${outstandingBalance.toLocaleString()}`,
      desc: filterType === 'all' ? 'Ledger opening + new billing' : 'Billed minus collected',
      icon: Landmark,
      color: outstandingBalance > 0
        ? 'from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30'
        : 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    },
  ];

  // Calculate SVG Max Value for Trend Chart
  const maxTrendVal = Math.max(...trendData.map(d => Math.max(d.paid, d.billed)), 1);

  return (
    <div className="space-y-8 animate-pulse-subtle">
      {/* Welcome Banner */}


      {/* Filter Toolbar Card */}
      <div className="rounded-2xl glass-card border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Period Filtering</h3>
            <p className="text-xs text-slate-400">View stats for a custom month, quarter, or overall</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Type Toggle Button Grid */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-1 flex">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'quarterly', label: 'Quarterly' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${filterType === t.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sub-selector drop-down menu */}
          {filterType === 'monthly' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
              >
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'quarterly' && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-white text-xs font-semibold rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
              >
                {availableQuarters.map((q) => (
                  <option key={q.value} value={q.value}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>
          )}
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
              <div className="h-12 w-12 rounded-xl bg-slate-900/60 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 border border-slate-800/80">
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart & Breakdown Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment & Billing Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl glass-card border border-slate-800 p-6 md:p-8 shadow-xl relative flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-white">Billing & Collections Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparison of sales generated (billed) against revenue collected (paid)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-300">Billed Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Paid Revenue</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex-1 flex items-center justify-center py-4">
            {maxTrendVal <= 1 ? (
              <div className="flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                <AlertCircle className="h-8 w-8 text-slate-500" />
                <span className="text-sm font-semibold text-slate-400">No transactions recorded in this period</span>
              </div>
            ) : (
              <svg viewBox="0 0 540 210" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="barBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="barPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Y Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const yVal = 20 + 160 * (1 - ratio);
                  const gridAmount = maxTrendVal * ratio;
                  return (
                    <g key={index} className="opacity-45">
                      <line
                        x1="50"
                        y1={yVal}
                        x2="530"
                        y2={yVal}
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="42"
                        y={yVal + 3}
                        fill="#94a3b8"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="end"
                      >
                        ₹{gridAmount >= 100000 ? `${(gridAmount / 100000).toFixed(1)}L` : gridAmount >= 1000 ? `${(gridAmount / 1000).toFixed(0)}K` : gridAmount.toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {trendData.map((d, i) => {
                  const segWidth = 480 / trendData.length;
                  const barW = Math.min(segWidth * 0.28, 20);

                  const xBilled = 50 + i * segWidth + (segWidth - barW * 2 - 4) / 2;
                  const hBilled = maxTrendVal > 0 ? (d.billed / maxTrendVal) * 160 : 0;
                  const yBilled = 20 + 160 - hBilled;

                  const xPaid = xBilled + barW + 4;
                  const hPaid = maxTrendVal > 0 ? (d.paid / maxTrendVal) * 160 : 0;
                  const yPaid = 20 + 160 - hPaid;

                  return (
                    <g key={i} className="group">
                      {/* Billed Bar */}
                      {hBilled > 0 && (
                        <rect
                          x={xBilled}
                          y={yBilled}
                          width={barW}
                          height={hBilled}
                          rx="4"
                          fill="url(#barBilled)"
                          className="transition-all duration-500 hover:brightness-125 cursor-pointer"
                        >
                          <title>{`Sales Billed: ₹${d.billed.toLocaleString()}`}</title>
                        </rect>
                      )}

                      {/* Paid Bar */}
                      {hPaid > 0 && (
                        <rect
                          x={xPaid}
                          y={yPaid}
                          width={barW}
                          height={hPaid}
                          rx="4"
                          fill="url(#barPaid)"
                          className="transition-all duration-500 hover:brightness-125 cursor-pointer"
                        >
                          <title>{`Received Paid: ₹${d.paid.toLocaleString()}`}</title>
                        </rect>
                      )}

                      {/* Labels */}
                      <text
                        x={50 + i * segWidth + segWidth / 2}
                        y="198"
                        fill="#94a3b8"
                        fontSize="10"
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}

                {/* X Line */}
                <line x1="50" y1="180" x2="530" y2="180" stroke="#334155" strokeWidth="1" />
              </svg>
            )}
          </div>
        </div>

        {/* Ledger Registry Overview */}
        <div className="lg:col-span-1 rounded-2xl glass-card border border-slate-800 p-6 md:p-8 shadow-xl flex flex-col justify-center gap-6">
          <div>
            <h3 className="font-bold text-lg text-white mb-2">Ledger Registry Overview</h3>
            <p className="text-xs text-slate-400">General breakdown of system clients and generated receipts in this period.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Total Registered Panels</p>
                <p className="text-lg font-bold text-white mt-0.5">{stats?.counts?.totalPanels || 0} Clients</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl hover:border-slate-700 transition-colors">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Active Transactions</p>
                <p className="text-lg font-bold text-white mt-0.5">{filteredPayments.length} Actions</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Payments Mode Distribution</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {['Cash', 'UPI', 'Bank Transfer', 'Online'].map((mode) => {
                  const modeAmt = filteredPayments
                    .filter((p) => p.paymentMode === mode)
                    .reduce((sum, p) => sum + (p.amountReceived || 0), 0);
                  const colors = {
                    Cash: 'text-amber-400 hover:border-amber-500/20',
                    UPI: 'text-emerald-400 hover:border-emerald-500/20',
                    'Bank Transfer': 'text-indigo-400 hover:border-indigo-500/20',
                    Online: 'text-violet-400 hover:border-violet-500/20',
                  };
                  return (
                    <div key={mode} className={`bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 hover:scale-102 transition-all duration-300 ${colors[mode]}`}>
                      <span className="text-slate-500 block mb-0.5 text-[10px] uppercase font-bold">{mode}</span>
                      <span className="font-bold">₹{modeAmt.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Rankings Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-800/60">
        <div>
          <h3 className="font-bold text-xl text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-indigo-400" />
            Client Rankings & Performance Leaderboards
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Top performing clients by invoiced sales, revenue collected, licenses issued, and SLAs
          </p>
        </div>

        {inactivePanels.length > 0 && (
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 transition-all duration-200"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{showInactive ? 'Hide' : 'Show'} Inactive Clients ({inactivePanels.length})</span>
          </button>
        )}
      </div>

      {/* Inactive Panels Expandable drawer */}
      {showInactive && (
        <div className="rounded-2xl bg-rose-500/5 border border-rose-500/15 p-6 animate-pulse-subtle">
          <h4 className="font-bold text-sm text-rose-400 mb-2 uppercase tracking-wide">Inactive Clients (No Bills/Payments in Period)</h4>
          <p className="text-xs text-slate-400 mb-4">The following client panels recorded zero invoiced sales and zero payments collected during this selected period:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactivePanels.map((p) => (
              <div key={p._id} className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-3.5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">{p.panelName}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Owner: {p.ownerName}</p>
                </div>
                <span className="text-[10px] font-semibold text-rose-400/80 px-2 py-0.5 rounded bg-rose-500/5 border border-rose-500/10">No Activity</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Rankings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Revenue Leaders */}
        <div className="rounded-2xl glass-card border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col h-full hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Revenue Leaders</h4>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Top Payments Paid</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {topPayingPanels.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 font-semibold text-center space-y-1">
                <span>No Payments Registered</span>
              </div>
            ) : (
              topPayingPanels.map((item, idx) => {
                const pct = totalPaymentsReceived > 0 ? (item.totalPaid / totalPaymentsReceived) * 100 : 0;
                return (
                  <div key={item._id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 truncate max-w-[120px]">{idx + 1}. {item.panelName}</span>
                      <span className="text-emerald-400 font-bold">₹{item.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Billing Leaders */}
        <div className="rounded-2xl glass-card border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col h-full hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Sales Invoiced</h4>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Top Sales Billed</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {topBilledPanels.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 font-semibold text-center space-y-1">
                <span>No Sales Billed</span>
              </div>
            ) : (
              topBilledPanels.map((item, idx) => {
                const pct = totalBilledAmount > 0 ? (item.totalBilled / totalBilledAmount) * 100 : 0;
                return (
                  <div key={item._id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 truncate max-w-[120px]">{idx + 1}. {item.panelName}</span>
                      <span className="text-indigo-400 font-bold">₹{item.totalBilled.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. License Leaders */}
        <div className="rounded-2xl glass-card border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col h-full hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">License Intake</h4>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Most Licenses Taken</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {topLicensePanels.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 font-semibold text-center space-y-1">
                <span>No Licenses Issued</span>
              </div>
            ) : (
              topLicensePanels.map((item, idx) => {
                const maxLic = Math.max(...topLicensePanels.map(x => x.licenseQty), 1);
                const pct = (item.licenseQty / maxLic) * 100;
                return (
                  <div key={item._id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold col-span-2">
                      <span className="text-slate-300 truncate max-w-[110px]">{idx + 1}. {item.panelName}</span>
                      <span className="text-cyan-400 font-bold">{item.licenseQty} Qty <span className="text-[10px] text-slate-400 font-normal">(₹{(item.licenseBilled || item.licensePaid).toLocaleString()})</span></span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. Maintenance SLA Tracker */}
        <div className="rounded-2xl glass-card border border-slate-800 p-5 md:p-6 shadow-xl flex flex-col h-full hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Maintenance Dues</h4>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">SLA Support Payments</p>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {topMaintenancePanels.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 font-semibold text-center space-y-1">
                <span>No SLA Payments</span>
              </div>
            ) : (
              topMaintenancePanels.map((item, idx) => {
                const maxMaint = Math.max(...topMaintenancePanels.map(x => x.maintenanceBilled || x.maintenancePaid), 1);
                const pct = ((item.maintenanceBilled || item.maintenancePaid) / maxMaint) * 100;
                return (
                  <div key={item._id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 truncate max-w-[120px]">{idx + 1}. {item.panelName}</span>
                      <span className="text-amber-400 font-bold">₹{(item.maintenanceBilled || item.maintenancePaid).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stacked Full-Width Section for Performance Alerts & Client Performance Grid Table */}
      <div className="space-y-8 pt-4 border-t border-slate-800/60">
        
        {/* Row 1: Worst Performing Clients Alerts (Full-Width Card with 3-Column horizontal grid) */}
        {worstPerforming.length > 0 && (
          <div className="rounded-2xl bg-rose-500/5 border border-rose-500/10 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Performance Alerts</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Clients with lowest recovery rates or critical dues in this period</p>
                </div>
              </div>
              <div className="text-[10px] font-bold px-3 py-1 rounded uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 tracking-wider text-center sm:text-right shrink-0">
                ⚠️ Critically Inactive: {inactivePanels.length} Panels
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {worstPerforming.map((item, idx) => (
                <div key={item._id} className="bg-slate-950/60 border border-slate-900/80 p-5 md:p-6 rounded-xl hover:border-slate-800 transition-all duration-300 relative overflow-hidden group hover:-translate-y-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-slate-200 font-bold text-sm block truncate max-w-[190px]">{idx + 1}. {item.panelName}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block font-semibold uppercase">{item.category} Category</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                      {item.totalBilled > 0 ? `Recovery: ${item.recoveryRate}%` : 'Outstanding'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3.5 border-t border-slate-900/60 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Billed</span>
                      <span className="text-slate-300 font-bold">₹{item.totalBilled.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Dues Pending</span>
                      <span className="text-rose-400 font-bold">₹{item.outstanding.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Row 2: Client Performance Ledger Grid Table (Full Width) */}
        <div className="rounded-2xl glass-card border border-slate-800 p-6 md:p-8 shadow-xl flex flex-col justify-between">
          {/* Table Header with Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-white">Client Performance Ledger Grid</h3>
              <p className="text-xs text-slate-400 mt-0.5">Click column headers to toggle ascending/descending sorting</p>
            </div>

            {/* Grid Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 px-3.5 py-2 text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Category:</span>
                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="bg-transparent border-none text-white font-bold cursor-pointer outline-none text-xs"
                >
                  <option value="All" className="bg-slate-950 text-white">All Categories</option>
                  {uniqueCategories.map((c) => (
                    <option key={c} value={c} className="bg-slate-950 text-white">{c}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 px-3.5 py-2 text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent border-none text-white font-bold cursor-pointer outline-none text-xs"
                >
                  <option value="All" className="bg-slate-950 text-white">All Statuses</option>
                  <option value="Excellent" className="bg-slate-950 text-emerald-400">Excellent (≥90%)</option>
                  <option value="Healthy" className="bg-slate-950 text-indigo-400">Healthy (50-89%)</option>
                  <option value="Needs Attention" className="bg-slate-950 text-amber-400">Needs Attention (&lt;50%)</option>
                  <option value="Critically Inactive" className="bg-slate-950 text-rose-400">Inactive (₹0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20 max-h-[550px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[850px]">
              <thead>
                <tr className="bg-slate-900/95 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider select-none sticky top-0 z-10 backdrop-blur-md">
                  <th className="px-4 py-3.5 text-center w-14">S.No.</th>
                  <th onClick={() => handleSort('panelName')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>Client Panel</span>
                      {perfSortField === 'panelName' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th className="px-5 py-3.5">Category</th>
                  <th onClick={() => handleSort('totalBilled')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Sales Billed</span>
                      {perfSortField === 'totalBilled' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('totalPaid')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Payments Paid</span>
                      {perfSortField === 'totalPaid' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('outstanding')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Outstanding</span>
                      {perfSortField === 'outstanding' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th onClick={() => handleSort('recoveryRate')} className="px-5 py-3.5 cursor-pointer hover:bg-slate-900 transition-colors text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Recovery</span>
                      {perfSortField === 'recoveryRate' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-center">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {processedPerfPanels.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-slate-500 font-semibold uppercase">
                      No client records match the criteria
                    </td>
                  </tr>
                ) : (
                  processedPerfPanels.map((p, idx) => {
                    const statusColors = {
                      Excellent: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                      Healthy: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
                      'Needs Attention': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                      'Critically Inactive': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                    };
                    const categoryColors = {
                      Algo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
                      Sop: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                      crypto: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                    };

                    return (
                      <tr key={p._id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-3.5 text-center font-bold text-slate-500 w-14">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-200 whitespace-nowrap">{p.panelName}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${categoryColors[p.category] || 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-right text-slate-300 whitespace-nowrap">₹{p.totalBilled.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-bold text-right text-emerald-400 whitespace-nowrap">₹{p.totalPaid.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-bold text-right text-rose-400 whitespace-nowrap">₹{p.outstanding.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-bold text-center text-slate-300">{p.recoveryRate}%</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider inline-block min-w-[90px] text-center ${statusColors[p.status]}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
