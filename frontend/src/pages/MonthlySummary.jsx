import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/utils/api';
import {
  Search, Calendar, RefreshCw, ChevronDown, ChevronRight, ChevronLeft, FileText,
  IndianRupee, TrendingUp, TrendingDown, Wallet, Download, ArrowUpDown, PieChart,
  Layers, KeyRound, Wrench, SlidersHorizontal, CheckCircle2, CircleDollarSign, Landmark
} from 'lucide-react';

export default function MonthlySummary() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // all | dues | paid
  const [metricFilter, setMetricFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name | due_desc | due_asc | bill_desc
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [expandedMonths, setExpandedMonths] = useState(new Set()); // mobile: "<rowId>-<month>"
  const [txTypeFilter, setTxTypeFilter] = useState('All'); // display-only filter for the transaction cards inside expanded rows

  // Presentational helper: visual identity (icon/color) + display filter matching for a single
  // transaction card. Purely cosmetic — does not touch bill/received/due calculations.
  const getTxMeta = (t) => {
    const pType = t.paymentType ? t.paymentType.toLowerCase() : 'other';
    if (t.paymentType === 'Opening Balance') {
      return { key: 'Opening', label: 'Opening Balance', icon: Landmark, color: '#64748b', bg: 'bg-slate-50 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-300', ring: 'border-slate-200 dark:border-slate-700' };
    }
    if (pType.includes('ip')) {
      return { key: 'IP', label: t.paymentType || 'IP Charges', icon: Layers, color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-300', ring: 'border-indigo-100 dark:border-indigo-900/40' };
    }
    if (pType.includes('license')) {
      return { key: 'License', label: t.paymentType || 'License', icon: KeyRound, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-300', ring: 'border-emerald-100 dark:border-emerald-900/40' };
    }
    if (pType.includes('maintenance')) {
      return { key: 'Maintenance', label: t.paymentType || 'Maintenance', icon: Wrench, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-300', ring: 'border-amber-100 dark:border-amber-900/40' };
    }
    return { key: 'Other', label: t.paymentType || 'Payment', icon: CircleDollarSign, color: '#94a3b8', bg: 'bg-slate-50 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-300', ring: 'border-slate-200 dark:border-slate-700' };
  };

  const txMatchesFilter = (t) => {
    if (txTypeFilter === 'All') return true;
    return getTxMeta(t).key === txTypeFilter;
  };

  const TX_FILTER_OPTIONS = ['All', 'Opening', 'IP', 'License', 'Maintenance', 'Other'];

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleMonth = (key) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) newSet.delete(key);
      else newSet.add(key);
      return newSet;
    });
  };

  const fetchSummary = async (selectedYear) => {
    try {
      setLoading(true);
      const res = await apiRequest(`/payments/monthly-summary?year=${selectedYear}`);
      if (res.success) {
        setData(res.data);
      } else {
        alert(res.message || 'Failed to fetch monthly summary');
      }
    } catch (err) {
      alert('Error fetching monthly summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(year);
  }, [year]);

  const ALL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Dynamically determine the starting and ending month
  const dynamicMonthsInfo = useMemo(() => {
    let minMonth = 12;
    if (data && data.length > 0) {
      data.forEach(item => {
        item.months?.forEach(m => {
          if (m.month < minMonth) minMonth = m.month;
        });
      });
      if (minMonth === 12 && data.every(i => !i.months || i.months.length === 0)) minMonth = 1;
    } else {
      minMonth = 1;
    }

    const startIdx = minMonth - 1;
    let endIdx = 11; // Dec

    const currentYear = new Date().getFullYear();
    if (year === currentYear) {
      endIdx = Math.min(11, new Date().getMonth() + 1);
    }

    const finalStartIdx = Math.min(startIdx, endIdx);

    return { startIdx: finalStartIdx, months: ALL_MONTHS.slice(finalStartIdx, endIdx + 1) };
  }, [data, year]);

  const { startIdx, months } = dynamicMonthsInfo;

  // Extract unique categories for the filter
  const categories = useMemo(() => {
    const cats = new Set(data.filter(item => item._id && item._id.category).map(item => item._id.category));
    return ['All', ...Array.from(cats)].sort();
  }, [data]);

  // Process data for rendering: attach per-panel totals, then filter, then sort
  const processedData = useMemo(() => {
    let filtered = data.filter((item) => item._id && item._id.panelName);

    if (categoryFilter !== 'All') {
      filtered = filtered.filter((item) => item._id.category === categoryFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((item) =>
        item._id.panelName.toLowerCase().includes(s)
      );
    }

    let rows = filtered.map((item) => {
      const monthDataMap = {};
      item.months.forEach((m) => {
        monthDataMap[m.month] = {
          bill: m.bill || 0,
          received: m.received || 0,
          discount: m.discount || 0,
          transactions: m.transactions || []
        };
      });

      const row = {
        panelName: item._id.panelName,
        category: item._id.category || 'Uncategorized',
        openingBalance: item._id.openingBalance || 0,
        createdAt: item._id.createdAt,
        _id: item._id._id
      };

      // Hardcode opening balance injection to March 2026
      const openingBalanceMonth = 3;
      const openingBalanceYear = 2026;
      const openingBalanceDate = '2026-03-31T09:00:00.000Z';

      let totalBill = 0, totalReceived = 0, totalDue = 0;
      let injectedInMonth = false;

      months.forEach((_, relativeIdx) => {
        const m = startIdx + relativeIdx + 1; // 1-indexed month
        let mData = monthDataMap[m] || { bill: 0, received: 0, discount: 0, transactions: [] };

        if (metricFilter !== 'All') {
          let customBill = 0;
          let customReceived = 0;
          let customCount = 0;

          mData.transactions.forEach(t => {
            const pType = t.paymentType ? t.paymentType.toLowerCase() : 'other';
            let isMatch = false;

            if (metricFilter === 'IP' && pType.includes('ip')) {
              isMatch = true;
            } else if (metricFilter === 'License' && pType.includes('license')) {
              isMatch = true;
            } else if (metricFilter === 'Maintenance' && pType.includes('maintenance')) {
              isMatch = true;
            } else if (metricFilter === 'Other') {
              if (!pType.includes('ip') && !pType.includes('license') && !pType.includes('maintenance')) {
                isMatch = true;
              }
            }

            if (isMatch) {
              customBill += t.billAmount || 0;
              customReceived += t.amountReceived || 0;
              customCount += 1;
            }
          });

          mData = { ...mData, bill: customBill, received: customReceived, discount: 0, metricCount: customCount };
        }

        if (openingBalanceYear === year && openingBalanceMonth === m && row.openingBalance > 0 && (metricFilter === 'All' || metricFilter === 'Opening')) {
          mData = { ...mData, bill: mData.bill + row.openingBalance };

          if (metricFilter === 'Opening') {
            mData.metricCount = (mData.metricCount || 0) + 1;
          }

          const openingTx = {
            paymentType: 'Opening Balance',
            billAmount: row.openingBalance,
            amountReceived: 0,
            date: openingBalanceDate,
            remark: 'Initial Opening Balance'
          };

          mData.transactions = [openingTx, ...mData.transactions];

          injectedInMonth = true;
        }

        const balance = mData.bill - mData.received - mData.discount;
        totalBill += mData.bill;
        totalReceived += mData.received;
        totalDue += balance;
        row[m] = { ...mData, due: balance, cumulativeDue: totalDue };
      });

      if (!injectedInMonth && (metricFilter === 'All' || metricFilter === 'Opening')) {
        totalDue += row.openingBalance;
      }

      row.totalBill = totalBill;
      row.totalReceived = totalReceived;
      row.totalDue = totalDue;

      return row;
    });

    if (statusFilter === 'dues') {
      rows = rows.filter((r) => r.totalDue > 0);
    } else if (statusFilter === 'paid') {
      rows = rows.filter((r) => r.totalDue === 0);
    }

    rows.sort((a, b) => {
      if (sortBy === 'due_desc') return b.totalDue - a.totalDue;
      if (sortBy === 'due_asc') return a.totalDue - b.totalDue;
      if (sortBy === 'bill_desc') return b.totalBill - a.totalBill;
      return a.panelName.localeCompare(b.panelName);
    });

    return rows;
  }, [data, search, categoryFilter, statusFilter, metricFilter, sortBy, startIdx, months]);

  // Quick-glance totals across whatever is currently filtered/visible
  const summaryTotals = useMemo(() => {
    return processedData.reduce((acc, row) => {
      acc.bill += row.totalBill;
      acc.received += row.totalReceived;
      acc.due += row.totalDue;
      return acc;
    }, { bill: 0, received: 0, due: 0 });
  }, [processedData]);

  const panelsWithDues = useMemo(
    () => processedData.filter((r) => r.totalDue > 0).length,
    [processedData]
  );

  // --- Presentational-only derived stats for the KPI cards (no business logic changes) ---

  // Per-month bill/received trend, purely for the sparkline visual.
  const monthlyTrend = useMemo(() => {
    return months.map((_, relativeIdx) => {
      const m = startIdx + relativeIdx + 1;
      return processedData.reduce((acc, row) => {
        const mData = row[m];
        if (mData) {
          acc.bill += mData.bill || 0;
          acc.received += mData.received || 0;
        }
        return acc;
      }, { bill: 0, received: 0 });
    });
  }, [processedData, months, startIdx]);

  // Collection efficiency, purely a display ratio of totals already computed above.
  const collectionEfficiency = summaryTotals.bill > 0
    ? Math.round((summaryTotals.received / summaryTotals.bill) * 100)
    : 0;

  // Service-type breakdown (IP / License / Maintenance / Other) for the donut visual.
  // Reads the same transaction records already present in processedData; does not
  // alter due/received/bill calculations anywhere else in the app.
  const serviceBreakdown = useMemo(() => {
    const totals = { IP: 0, License: 0, Maintenance: 0, Other: 0 };
    processedData.forEach((row) => {
      months.forEach((_, relativeIdx) => {
        const m = startIdx + relativeIdx + 1;
        const mData = row[m];
        if (!mData || !mData.transactions) return;
        mData.transactions.forEach((t) => {
          const amt = t.billAmount || 0;
          const pType = t.paymentType ? t.paymentType.toLowerCase() : 'other';
          if (pType.includes('ip')) totals.IP += amt;
          else if (pType.includes('license')) totals.License += amt;
          else if (pType.includes('maintenance')) totals.Maintenance += amt;
          else totals.Other += amt;
        });
      });
    });
    const sum = totals.IP + totals.License + totals.Maintenance + totals.Other;
    const pct = (v) => (sum > 0 ? Math.round((v / sum) * 100) : 0);
    return {
      sum,
      segments: [
        { label: 'IP Charges', value: totals.IP, pct: pct(totals.IP), color: '#6366f1' },      // indigo
        { label: 'License', value: totals.License, pct: pct(totals.License), color: '#10b981' }, // emerald
        { label: 'Maintenance', value: totals.Maintenance, pct: pct(totals.Maintenance), color: '#f59e0b' }, // amber
        { label: 'Other', value: totals.Other, pct: pct(totals.Other), color: '#94a3b8' },      // slate
      ]
    };
  }, [processedData, months, startIdx]);

  const years = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 = Jan, 11 = Dec

  const startYear = 2025;
  const endYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const exportCsv = () => {
    const header = ['Panel Name', 'Category', ...months.map((mn) => `${mn} Bill`), ...months.map((mn) => `${mn} Paid`), ...months.map((mn) => `${mn} Due`), 'Total Bill', 'Total Paid', 'Total Due'];
    const lines = [header.join(',')];
    processedData.forEach((row) => {
      const billCells = months.map((_, ri) => row[startIdx + ri + 1].bill);
      const paidCells = months.map((_, ri) => row[startIdx + ri + 1].received);
      const dueCells = months.map((_, ri) => row[startIdx + ri + 1].due);
      lines.push([
        `"${row.panelName}"`, row.category,
        ...billCells, ...paidCells, ...dueCells,
        row.totalBill, row.totalReceived, row.totalDue
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `monthly-summary-${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Sparkline path builder (pure presentation, SVG only) ---
  const buildSparklinePath = (series, w = 100, h = 32) => {
    if (!series || series.length === 0) return '';
    const max = Math.max(...series, 1);
    const min = Math.min(...series, 0);
    const range = max - min || 1;
    const stepX = series.length > 1 ? w / (series.length - 1) : w;
    return series
      .map((v, i) => {
        const x = i * stepX;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const billSeries = monthlyTrend.map((m) => m.bill);
  const sparklinePath = buildSparklinePath(billSeries);

  // Donut chart geometry (pure presentation)
  const donutRadius = 34;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let donutOffsetAcc = 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500 shrink-0" />
            Monthly Summary
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm">
            Month-wise billing, received payments, and outstanding balances per panel.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={exportCsv}
            disabled={loading || processedData.length === 0}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 py-2 px-3 bg-white dark:bg-surface border border-border-primary text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export current view as CSV"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="flex-1 sm:flex-none py-2 pl-3 pr-8 bg-white dark:bg-surface border border-border-primary rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => fetchSummary(year)}
            className="p-2 bg-white dark:bg-surface border border-border-primary text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick-glance KPI cards: redesigned visuals only — all values come from summaryTotals /
          panelsWithDues / processedData, computed exactly as before. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">

        {/* Card 1 — Total Billed: dark teal gradient + sparkline */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 shadow-lg shadow-teal-900/20">
          <div className="flex items-start justify-between">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-teal-200">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
            <svg width="96" height="32" viewBox="0 0 100 32" className="opacity-90 shrink-0" preserveAspectRatio="none">
              <path d={sparklinePath} fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mt-3">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-teal-200/80 font-semibold">Total Billed</div>
            <div className="text-xl sm:text-2xl font-bold text-white truncate mt-0.5">{fmt(summaryTotals.bill)}</div>
            <div className="text-[10px] sm:text-[11px] text-teal-200/70 mt-1">Month-on-month billing trend</div>
          </div>
        </div>

        {/* Card 2 — Total Received: royal blue gradient + radial efficiency gauge */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-blue-700 via-indigo-700 to-indigo-900 shadow-lg shadow-indigo-900/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
                <TrendingUp className="h-4.5 w-4.5" />
              </div>
              <div className="mt-3">
                <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-blue-200/80 font-semibold">Total Received</div>
                <div className="text-xl sm:text-2xl font-bold text-white truncate mt-0.5">{fmt(summaryTotals.received)}</div>
                <div className="text-[10px] sm:text-[11px] text-blue-200/70 mt-1">Collection efficiency: {collectionEfficiency}%</div>
              </div>
            </div>
            <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0 -rotate-90">
              <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
              <circle
                cx="26" cy="26" r="21" fill="none" stroke="#93c5fd" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 21}
                strokeDashoffset={2 * Math.PI * 21 * (1 - collectionEfficiency / 100)}
              />
            </svg>
          </div>
        </div>

        {/* Card 3 — Service breakdown donut */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-300 shrink-0">
              <PieChart className="h-4.5 w-4.5" />
            </div>
            <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Service Breakdown</div>
          </div>
          <div className="flex items-center gap-4">
            <svg width="72" height="72" viewBox="0 0 84 84" className="-rotate-90 shrink-0">
              <circle cx="42" cy="42" r={donutRadius} fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="12" />
              {serviceBreakdown.segments.filter(s => s.pct > 0).map((seg) => {
                const dash = (seg.pct / 100) * donutCircumference;
                const el = (
                  <circle
                    key={seg.label}
                    cx="42" cy="42" r={donutRadius} fill="none" stroke={seg.color} strokeWidth="12"
                    strokeDasharray={`${dash} ${donutCircumference - dash}`}
                    strokeDashoffset={-donutOffsetAcc}
                  />
                );
                donutOffsetAcc += dash;
                return el;
              })}
            </svg>
            <div className="space-y-1 min-w-0">
              {serviceBreakdown.segments.filter(s => s.value > 0).map((seg) => (
                <div key={seg.label} className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-slate-500 dark:text-slate-400 truncate">{seg.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 ml-auto">{seg.pct}%</span>
                </div>
              ))}
              {serviceBreakdown.sum === 0 && (
                <div className="text-[11px] text-slate-400 italic">No transactions yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Card 4 — Total Due + Panels with dues */}
        <div className="grid grid-rows-2 gap-3 sm:gap-4">
          <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 flex items-center gap-3 ${summaryTotals.due < 0 ? 'ring-1 ring-indigo-200 dark:ring-indigo-900/40' : ''}`}>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${summaryTotals.due < 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300'}`}>
              {summaryTotals.due < 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold truncate">{summaryTotals.due < 0 ? 'Total Advance' : 'Total Due'}</div>
              <div className={`text-base sm:text-lg font-bold truncate ${summaryTotals.due < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(Math.abs(summaryTotals.due))}</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90 shrink-0">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - (processedData.length > 0 ? panelsWithDues / processedData.length : 0))}
              />
            </svg>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold truncate">Panels with Dues</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-white truncate">{panelsWithDues} <span className="text-xs font-medium text-slate-400">/ {processedData.length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters: category as pills (fast to scan for sales), status + sort as dropdowns (accounts-focused) */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex overflow-x-auto whitespace-nowrap custom-scrollbar items-center gap-2 pb-1 lg:pb-0 w-full lg:w-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors shrink-0 ${categoryFilter === cat
                ? 'bg-primary-500 border-primary-500 '
                : 'bg-white dark:bg-surface border-border-primary text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:ml-auto w-full lg:w-auto">
          <div className="relative w-full sm:w-56 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Panel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface border border-border-primary rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm outline-none"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none py-2 pl-3 pr-8 bg-white dark:bg-surface border border-border-primary rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm outline-none"
              title="Filter by payment status"
            >
              <option value="all">All Panels</option>
              <option value="dues">Has Dues</option>
              <option value="paid">Fully Paid</option>
            </select>
            <select
              value={metricFilter}
              onChange={(e) => setMetricFilter(e.target.value)}
              className="flex-1 sm:flex-none py-2 pl-3 pr-8 bg-white dark:bg-surface border border-border-primary rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm outline-none font-semibold text-indigo-700 dark:text-indigo-400"
              title="Filter by payment type (IP, License, Maintenance)"
            >
              <option value="All">Overall Totals</option>
              <option value="Opening">Opening Balance Only</option>
              <option value="IP">IP Only</option>
              <option value="License">License Only</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto py-2 pl-8 pr-8 bg-white dark:bg-surface border border-border-primary rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm outline-none"
              title="Sort"
            >
              <option value="name">Sort: Panel Name</option>
              <option value="due_desc">Sort: Highest Due</option>
              <option value="due_asc">Sort: Lowest Due</option>
              <option value="bill_desc">Sort: Highest Bill</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Phone & tablet-portrait view: stacked cards, month accordion instead of a wide table */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              Loading summary data...
            </div>
          </div>
        ) : processedData.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700">
            No panels match the current filters for {year}.
          </div>
        ) : (
          <>
            {processedData.map((row, idx) => {
              const isExpanded = expandedRows.has(row._id);
              const hasDue = row.totalDue > 0;
              const hasAdv = row.totalDue < 0;
              return (
                <div
                  key={row._id}
                  className={`bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${hasDue ? 'border-l-4 border-l-rose-400 dark:border-l-rose-500' : hasAdv ? 'border-l-4 border-l-indigo-400 dark:border-l-indigo-500' : ''}`}
                >
                  <button
                    onClick={() => toggleRow(row._id)}
                    className="w-full flex items-center justify-between gap-2 p-3.5 sm:p-4 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-slate-400 shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{row.panelName}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-slate-400">{row.category}</span>
                          {hasDue ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300">
                              Due {fmt(row.totalDue)}
                            </span>
                          ) : hasAdv ? (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                              Adv {fmt(Math.abs(row.totalDue))}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300">
                              Settled
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/50">
                      {/* Transaction-type filter for the cards below — display only */}
                      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto custom-scrollbar bg-slate-50/60 dark:bg-slate-800/20">
                        <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {TX_FILTER_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setTxTypeFilter(opt)}
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border shrink-0 transition-colors ${txTypeFilter === opt
                              ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                              }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {months.map((monthName, relativeIdx) => {
                        const m = startIdx + relativeIdx + 1;
                        const mData = row[m];
                        const monthKey = `${row._id}-${m}`;
                        const isMonthOpen = expandedMonths.has(monthKey);
                        const visibleTx = (mData.transactions || []).filter(txMatchesFilter);
                        const hasTx = visibleTx.length > 0;
                        return (
                          <div key={m}>
                            <button
                              onClick={() => hasTx && toggleMonth(monthKey)}
                              className={`w-full flex items-center gap-2 sm:gap-3 p-3 text-left ${hasTx ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer' : 'cursor-default opacity-60'}`}
                            >
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-9 sm:w-10 shrink-0">{monthName}</span>
                              <div className="flex-1 grid grid-cols-3 gap-1 text-[10px] min-w-0">
                                <div className="text-blue-600 dark:text-blue-400 min-w-0">
                                  <div className="opacity-70">Bill</div>
                                  <div className="font-semibold truncate">{fmt(mData.bill)}</div>
                                </div>
                                <div className="text-emerald-600 dark:text-emerald-400 min-w-0">
                                  <div className="opacity-70">Paid</div>
                                  <div className="font-semibold truncate">{fmt(mData.received)}</div>
                                </div>
                                <div className={`min-w-0 ${mData.due > 0 ? 'text-rose-600 dark:text-rose-400' : mData.due < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                  <div className="opacity-70">{mData.due < 0 ? 'Adv' : 'Due'}</div>
                                  <div className="font-semibold truncate">{fmt(Math.abs(mData.due))}</div>
                                </div>
                              </div>
                              {hasTx && (
                                isMonthOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              )}
                            </button>
                            {isMonthOpen && hasTx && (
                              <div className="px-3 pb-3 space-y-2">
                                {visibleTx.map((t, tidx) => {
                                  const meta = getTxMeta(t);
                                  const Icon = meta.icon;
                                  const isSettled = (t.billAmount || 0) > 0 && (t.amountReceived || 0) >= (t.billAmount || 0);
                                  return (
                                    <div key={tidx} className={`relative overflow-hidden rounded-xl bg-white dark:bg-slate-800/60 border ${meta.ring} shadow-sm`}>
                                      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: meta.color }} />
                                      <div className="pl-3.5 pr-3 py-2.5">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
                                              <Icon className="h-3 w-3" />
                                            </span>
                                            <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200 truncate">{meta.label}</span>
                                          </div>
                                          <span className="text-[9.5px] text-slate-400 shrink-0">
                                            {t.date ? new Date(t.date).toLocaleDateString('en-GB') : '-'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] font-mono">
                                          {t.billAmount > 0 && (
                                            <span className="text-blue-600 dark:text-blue-400">Bill {fmt(t.billAmount)}</span>
                                          )}
                                          {t.amountReceived > 0 && (
                                            <span className="text-emerald-600 dark:text-emerald-400">Paid {fmt(t.amountReceived)}</span>
                                          )}
                                          {isSettled && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto shrink-0" />}
                                        </div>
                                        {(t.paymentMode || t.remark) && (
                                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50 space-y-0.5">
                                            {t.paymentMode && (
                                              <div className="text-[10px] text-slate-500">
                                                Mode: <span className="font-medium text-slate-600 dark:text-slate-300">{t.paymentMode}</span>
                                              </div>
                                            )}
                                            {t.remark && (
                                              <div className="text-[10px] text-slate-500 flex items-start gap-1">
                                                <FileText className="h-3 w-3 inline shrink-0 mt-0.5" />
                                                <span className="break-words">{t.remark}</span>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-slate-500">Total ({months.length}mo)</span>
                        <div className="flex gap-3">
                          <span className="text-blue-600 dark:text-blue-400">{fmt(row.totalBill)}</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{fmt(row.totalReceived)}</span>
                          <span className={row.totalDue < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}>
                            {fmt(Math.abs(row.totalDue))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile totals summary */}
            <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-3.5 sm:p-4">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Totals ({processedData.length} panels)</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-blue-700 dark:text-blue-300 min-w-0">
                  <div className="opacity-70">Bill</div>
                  <div className="font-bold truncate">{fmt(summaryTotals.bill)}</div>
                </div>
                <div className="text-emerald-700 dark:text-emerald-300 min-w-0">
                  <div className="opacity-70">Paid</div>
                  <div className="font-bold truncate">{fmt(summaryTotals.received)}</div>
                </div>
                <div className={`min-w-0 ${summaryTotals.due < 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  <div className="opacity-70">{summaryTotals.due < 0 ? 'Adv' : 'Due'}</div>
                  <div className="font-bold truncate">{fmt(Math.abs(summaryTotals.due))}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Laptop / desktop view: full table, only rendered from lg breakpoint up */}
      <div className="hidden lg:flex lg:flex-col bg-white dark:bg-[#0f172a] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar pb-1">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-[0.06em] text-[10.5px]">
                <th className="p-4 text-center w-12 sticky left-0 z-20  dark:bg-[#1e293b] backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                  #
                </th>
                <th className="p-4 sticky left-12 z-20  dark:bg-[#1e293b] backdrop-blur-sm w-44 max-w-[160px] shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                  Panel Name
                </th>
                {months.map((month) => (
                  <th key={month} className="p-4 text-center min-w-[120px]">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={months.length + 2} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                      Loading summary data...
                    </div>
                  </td>
                </tr>
              ) : processedData.length === 0 ? (
                <tr>
                  <td colSpan={months.length + 2} className="p-8 text-center text-slate-500">
                    No panels match the current filters for {year}.
                  </td>
                </tr>
              ) : (
                processedData.map((row, idx) => {
                  const isExpanded = expandedRows.has(row._id);
                  const hasDue = row.totalDue > 0;
                  const hasAdv = row.totalDue < 0;
                  return (
                    <React.Fragment key={row._id}>
                      <tr
                        onClick={() => toggleRow(row._id)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''} ${hasDue ? 'border-l-2 border-l-rose-400 dark:border-l-rose-500' : hasAdv ? 'border-l-2 border-l-indigo-400 dark:border-l-indigo-500' : ''}`}
                      >
                        <td className="p-4 text-sm font-medium text-slate-500 dark:text-slate-400 text-center sticky left-0 z-10 bg-white dark:bg-[#0f172a] shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)]">
                          {idx + 1}
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-900 dark:text-slate-100 sticky left-12 z-10 bg-white dark:bg-[#0f172a] shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.05)] w-44 max-w-[160px]">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                            <div className="min-w-0">
                              <div className="truncate">{row.panelName}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-normal text-slate-400">{row.category}</span>
                                {hasDue ? (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300">
                                    Due {fmt(row.totalDue)}
                                  </span>
                                ) : hasAdv ? (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                                    Adv {fmt(Math.abs(row.totalDue))}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300">
                                    Settled
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        {months.map((_, relativeIdx) => {
                          const m = startIdx + relativeIdx + 1;
                          const mData = row[m];
                          return (
                            <td key={m} className="p-3 align-top border-l border-slate-100 dark:border-slate-700/50">
                              <div className="flex flex-col gap-1 text-[11px]">
                                {metricFilter !== 'All' && (
                                  <div className="flex justify-between items-center px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                                    <span>Count:</span>
                                    <span className="font-bold">{mData.metricCount || 0}</span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                  <span className="truncate pr-1">{metricFilter !== 'All' ? `${metricFilter} Bill:` : 'Bill:'}</span>
                                  <span className="font-semibold">{fmt(mData.bill)}</span>
                                </div>
                                <div className="flex justify-between items-center px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                                  <span className="truncate pr-1">{metricFilter !== 'All' ? `${metricFilter} Paid:` : 'Paid:'}</span>
                                  <span className="font-semibold">{fmt(mData.received)}</span>
                                </div>
                                <div className={`flex justify-between items-center px-1.5 py-0.5 rounded ${mData.due > 0 ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300' : mData.due < 0 ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-500'}`}>
                                  <span className="truncate pr-1">{metricFilter !== 'All' ? `${metricFilter} ${mData.due < 0 ? 'Adv:' : 'Due:'}` : mData.due < 0 ? 'Month Adv:' : 'Month Due:'}</span>
                                  <span className={`font-semibold ${mData.due !== 0 ? '' : 'opacity-50'}`}>
                                    {fmt(Math.abs(mData.due))}
                                  </span>
                                </div>
                                <div className={`flex justify-between items-center px-1.5 py-1 rounded ${mData.cumulativeDue > 0 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200' : mData.cumulativeDue < 0 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200' : 'bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'} mt-1 border border-transparent ${mData.cumulativeDue !== 0 ? 'dark:border-opacity-20 shadow-sm' : ''}`}>
                                  <span className="truncate pr-1 text-[10px] font-bold uppercase tracking-wider">{mData.cumulativeDue < 0 ? 'Total Adv:' : 'Total Due:'}</span>
                                  <span className={`font-bold ${mData.cumulativeDue !== 0 ? '' : 'opacity-50'}`}>
                                    {fmt(Math.abs(mData.cumulativeDue))}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-[#151f32]">
                          <td colSpan={months.length + 2} className="p-0 border-b border-slate-200 dark:border-slate-700">
                            {/* Transaction-type filter for the month cards below — display only */}
                            <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              {TX_FILTER_OPTIONS.map((opt) => (
                                <button
                                  key={opt}
                                  onClick={(e) => { e.stopPropagation(); setTxTypeFilter(opt); }}
                                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold border shrink-0 transition-colors ${txTypeFilter === opt
                                    ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            <div className="flex relative items-center w-full">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const el = document.getElementById(`scroll-container-${row._id}`);
                                  if (el) el.scroll({ left: el.scrollLeft - 300, behavior: 'smooth' });
                                }}
                                className="sticky left-2 z-20 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 focus:outline-none ml-2"
                              >
                                <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                              </button>

                              <div id={`scroll-container-${row._id}`} className="p-4 overflow-x-auto custom-scrollbar scroll-smooth flex-1 w-0">
                                <div className="flex gap-4 min-w-max pb-2">
                                  {months.map((monthName, relativeIdx) => {
                                    const m = startIdx + relativeIdx + 1;
                                    const mData = row[m];
                                    if (!mData || (!mData.bill && !mData.received && (!mData.transactions || mData.transactions.length === 0))) return null;
                                    const visibleTx = (mData.transactions || []).filter(txMatchesFilter);

                                    return (
                                      <div key={monthName} className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl w-72 shadow-sm shrink-0 overflow-hidden">
                                        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                                          <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary-500 shrink-0" />
                                            {monthName} {year}
                                          </h3>
                                          <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
                                            {visibleTx.length} {visibleTx.length === 1 ? 'entry' : 'entries'}
                                          </span>
                                        </div>
                                        <div className="space-y-2 p-3 max-h-64 overflow-y-auto custom-scrollbar">
                                          {visibleTx.length === 0 ? (
                                            <p className="text-xs text-slate-500 italic py-2 text-center">
                                              {mData.transactions && mData.transactions.length > 0 ? 'No entries match this filter.' : 'No detailed transactions found.'}
                                            </p>
                                          ) : (
                                            visibleTx.map((t, tidx) => {
                                              const meta = getTxMeta(t);
                                              const Icon = meta.icon;
                                              const isSettled = (t.billAmount || 0) > 0 && (t.amountReceived || 0) >= (t.billAmount || 0);
                                              return (
                                                <div key={tidx} className={`relative overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-800/50 border ${meta.ring}`}>
                                                  <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: meta.color }} />
                                                  <div className="pl-3 pr-2.5 py-2 text-xs">
                                                    <div className="flex justify-between items-center gap-2 mb-1">
                                                      <span className="flex items-center gap-1.5 min-w-0 font-medium text-slate-700 dark:text-slate-300">
                                                        <span className={`h-4.5 w-4.5 rounded-md flex items-center justify-center shrink-0 ${meta.bg} ${meta.text}`}>
                                                          <Icon className="h-3 w-3" />
                                                        </span>
                                                        <span className="truncate">{meta.label}</span>
                                                      </span>
                                                      {isSettled && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mb-1">
                                                      {t.date ? new Date(t.date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                                                      {t.billAmount > 0 && (
                                                        <div className="text-blue-600 dark:text-blue-400">Bill: {fmt(t.billAmount)}</div>
                                                      )}
                                                      {t.amountReceived > 0 && (
                                                        <div className="text-emerald-600 dark:text-emerald-400">Paid: {fmt(t.amountReceived)}</div>
                                                      )}
                                                    </div>
                                                    {t.paymentMode && (
                                                      <div className="text-slate-500 mt-1 text-[10px] flex items-center gap-1">
                                                        Mode: <span className="font-medium text-slate-600 dark:text-slate-300">{t.paymentMode}</span>
                                                      </div>
                                                    )}
                                                    {t.remark && (
                                                      <div className="text-slate-500 truncate flex items-center gap-1 mt-0.5 text-[10px]" title={t.remark}>
                                                        <FileText className="h-3 w-3 inline shrink-0" />
                                                        <span className="truncate">{t.remark}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const el = document.getElementById(`scroll-container-${row._id}`);
                                  if (el) el.scroll({ left: el.scrollLeft + 300, behavior: 'smooth' });
                                }}
                                className="sticky right-2 z-20 flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 focus:outline-none mr-2"
                              >
                                <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {!loading && processedData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 font-semibold text-sm">
                  <td className="p-4 sticky left-0 z-10 bg-slate-100 dark:bg-[#1e293b]" colSpan={2}>
                    Totals ({processedData.length} panels)
                  </td>
                  {months.map((_, relativeIdx) => {
                    const m = startIdx + relativeIdx + 1;
                    const colTotals = processedData.reduce((acc, row) => {
                      acc.bill += row[m].bill;
                      acc.received += row[m].received;
                      acc.due += row[m].due;
                      return acc;
                    }, { bill: 0, received: 0, due: 0 });
                    return (
                      <td key={m} className="p-3 border-l border-slate-200 dark:border-slate-700 text-[11px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-blue-700 dark:text-blue-300"><span>Bill:</span><span>{fmt(colTotals.bill)}</span></div>
                          <div className="flex justify-between text-emerald-700 dark:text-emerald-300"><span>Paid:</span><span>{fmt(colTotals.received)}</span></div>
                          <div className={`flex justify-between ${colTotals.due < 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-700 dark:text-rose-300'}`}>
                            <span>{colTotals.due < 0 ? 'Adv:' : 'Due:'}</span>
                            <span>{fmt(Math.abs(colTotals.due))}</span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}