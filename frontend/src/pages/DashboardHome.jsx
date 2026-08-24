import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { apiRequest } from '@/utils/api';
import {
  CircleDollarSign,
  Layers,
  Wrench,
  AlertCircle,
  FileSpreadsheet,
  Landmark,
  Calendar,
  Filter,
  Award,
  Info,
  X,
  Search,
  Tag,
  BarChart3,
  Users,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Active filter badge pills used throughout the page
const ActivePill = ({ children, color = 'indigo' }) => {
  const clsMap = {
    indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${clsMap[color] || clsMap.indigo}`}>
      {children}
    </span>
  );
};

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Welcome Banner Skeleton */}
    <div className="rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-300/80 dark:border-slate-800/80 p-6 md:p-8 space-y-3">
      <div className="h-7 w-2/3 rounded bg-slate-200 dark:bg-slate-800"></div>
      <div className="h-4 w-1/2 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
    </div>

    {/* Filters Skeleton */}
    <div className="rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="h-6 w-1/4 rounded bg-slate-200 dark:bg-slate-800"></div>
      <div className="h-10 w-1/3 rounded bg-slate-200 dark:bg-slate-800"></div>
    </div>

    {/* Stats Cards Skeleton Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 p-6 flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-3 w-2/3 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0 ml-4"></div>
        </div>
      ))}
    </div>

    {/* Visual Analytics & Breakdown Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-3.5 w-64 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
        </div>
        <div className="h-64 rounded-xl bg-slate-200/40 dark:bg-slate-800/40"></div>
      </div>

      <div className="lg:col-span-1 rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-3.5 w-56 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border border-slate-300/80 dark:border-slate-800/80 p-4 rounded-xl">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
                <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const DonutChart = ({ data, size = 100, strokeWidth = 12 }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={(size - strokeWidth) / 2} fill="transparent" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      </svg>
    );
  }

  let currentOffset = 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          if (item.value === 0) return null;
          const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += (item.value / total) * circumference;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-500 ease-in-out hover:opacity-80"
            >
              <title>{`${item.label}: ${item.value}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-black text-slate-800 dark:text-slate-100 leading-none">{total}</span>
      </div>
    </div>
  );
};

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showInactive, setShowInactive] = useState(false);

  // Performance Table & Card States
  const [selectedCatFilter, setSelectedCatFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [perfSortField, setPerfSortField] = useState('totalBilled');
  const [perfSortOrder, setPerfSortOrder] = useState('desc');
  const [modalInfo, setModalInfo] = useState(null);
  const [tableSearch, setTableSearch] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [unpaidModal, setUnpaidModal] = useState({ isOpen: false, panelName: '', loading: false, bills: [] });

  const handleViewUnpaid = async (panelId, panelName, outstanding) => {
    if (outstanding <= 0) return;
    setUnpaidModal({ isOpen: true, panelName, loading: true, bills: [] });
    try {
      const data = await apiRequest(`/payments/unpaid/${panelId}`);
      if (data.success) {
        setUnpaidModal({ isOpen: true, panelName, loading: false, bills: data.bills || [] });
      }
    } catch (err) {
      setUnpaidModal({ isOpen: true, panelName, loading: false, bills: [] });
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Fetch lightweight metrics first (Fastest)
        const metricsRes = await apiRequest('/stats/metrics');
        if (metricsRes.success) {
          setStats({
            metrics: metricsRes.metrics,
            paymentBreakdown: metricsRes.paymentBreakdown,
            paymentModeBreakdown: metricsRes.paymentModeBreakdown,
            counts: metricsRes.counts,
            panels: [],
            payments: []
          });
          setLoading(false); // Stop loading screen immediately, show top cards
        }

        // 2. Fetch panels (Medium)
        const panelsRes = await apiRequest('/stats/panels');
        if (panelsRes.success) {
          setStats(prev => ({ ...prev, panels: panelsRes.panels }));
        }

        // 3. Fetch heavy payments (Slowest)
        const paymentsRes = await apiRequest('/stats/payments');
        if (paymentsRes.success) {
          setStats(prev => ({ ...prev, payments: paymentsRes.payments }));
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics');
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
    onlineCollections,
    panelStatsArray,
    recoveryRate,
    outstandingBalance,
    billDiscountTotal,
    paymentDiscountTotal,
    openingBalSum,
    salesBreakdown,
    revenueBreakdown,
    outstandingBreakdown,
  } = useMemo(() => {
    const rawPanels = stats?.panels || [];
    const rawPayments = stats?.payments || [];

    let panelsToUse = rawPanels;
    if (selectedCatFilter !== 'All') {
      panelsToUse = rawPanels.filter(p => (p.category || 'Algo') === selectedCatFilter);
    }
    const isMarch2026OrAll = filterType === 'all' || (filterType === 'monthly' && selectedMonth === '2026-03') || (filterType === 'quarterly' && selectedQuarter === '2026-Q1') || (filterType === 'daily' && selectedDate.startsWith('2026-03'));
    const openingBalSum = isMarch2026OrAll ? panelsToUse.reduce((sum, p) => sum + (p.openingBalance || 0), 0) : 0;
    const openingBalCount = isMarch2026OrAll ? panelsToUse.filter(p => (p.openingBalance || 0) > 0).length : 0;

    // Filter payments based on selection
    const filtered = rawPayments.filter((p) => {
      // Exclude auto-applied credit adjustments from all collection metrics/charts on dashboard
      const isSystemCredit = p.bankName === 'System Credit' ||
        (p.bankName && p.bankName.toLowerCase().trim() === 'system credit') ||
        (p.remark && p.remark.toLowerCase().includes('system credit'));
      if (isSystemCredit) {
        return false;
      }

      // Filter by Category
      if (selectedCatFilter !== 'All') {
        const pCat = p.panelId?.category || 'Algo';
        if (pCat !== selectedCatFilter) return false;
      }

      if (!p.timestamp) return false;
      const date = new Date(p.timestamp);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');

      if (filterType === 'monthly') {
        return `${y}-${m}` === selectedMonth;
      } else if (filterType === 'quarterly') {
        const q = Math.ceil((date.getMonth() + 1) / 3);
        return `${y}-Q${q}` === selectedQuarter;
      } else if (filterType === 'daily') {
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}` === selectedDate;
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
        openingBalance: p.openingBalance || 0,
        billDiscount: 0,
        paymentDiscount: 0,
      };
    });

    // Process filtered payments
    let totalBilled = 0;
    let totalPaid = 0;
    let billsCount = 0;
    let cash = 0;
    let online = 0;
    let billDiscountSum = 0;
    let paymentDiscountSum = 0;
    let totalGst = 0;

    const typeStats = {};

    filtered.forEach((p) => {
      if (p.bankName === 'System Credit') {
        return; // Exclude auto-applied credit adjustments from collection metrics
      }
      const pId = p.panelId?._id || p.panelId;
      totalPaid += p.amountReceived || 0;
      totalBilled += p.billAmount || 0;
      billDiscountSum += p.billDiscount || 0;
      paymentDiscountSum += p.paymentDiscount || 0;

      if (p.isGstApplied === true && p.billAmount > 0) {
        const base = p.billAmount / 1.18;
        totalGst += (p.billAmount - base);
      }

      if (p.billAmount > 0) billsCount += 1;

      if (p.paymentMode === 'Cash') {
        cash += p.amountReceived || 0;
      } else {
        online += p.amountReceived || 0;
      }

      let type = p.paymentType || 'Other';
      if (type === 'License Charges') type = 'License';
      if (type === 'Maintenance Charges') type = 'Maintenance';
      if (type === 'IP') type = 'IP Charges';
      if (!typeStats[type]) {
        typeStats[type] = {
          billed: 0,
          paid: 0,
          billDiscount: 0,
          paymentDiscount: 0,
          qty: 0,
        };
      }
      typeStats[type].billed += p.billAmount || 0;
      typeStats[type].paid += p.amountReceived || 0;
      typeStats[type].billDiscount += p.billDiscount || 0;
      typeStats[type].paymentDiscount += p.paymentDiscount || 0;
      typeStats[type].qty += p.quantity || 0;

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
            openingBalance: p.panelId?.openingBalance || 0,
            billDiscount: 0,
            paymentDiscount: 0,
          };
        }
        map[pId].totalPaid += p.amountReceived || 0;
        map[pId].totalBilled += p.billAmount || 0;
        map[pId].billDiscount += p.billDiscount || 0;
        map[pId].paymentDiscount += p.paymentDiscount || 0;
        if (p.billAmount > 0) {
          map[pId].billCount += 1;
        }
        if (type === 'License') {
          map[pId].licensePaid += p.amountReceived || 0;
          map[pId].licenseBilled += p.billAmount || 0;
          map[pId].licenseQty += p.quantity || 0;
        } else if (type === 'Maintenance') {
          map[pId].maintenancePaid += p.amountReceived || 0;
          map[pId].maintenanceBilled += p.billAmount || 0;
        }
      }
    });

    const standardTypes = ['Maintenance', 'License', 'IP Charges'];
    standardTypes.forEach((type) => {
      if (!typeStats[type]) {
        typeStats[type] = {
          billed: 0,
          paid: 0,
          billDiscount: 0,
          paymentDiscount: 0,
          qty: 0,
        };
      }
    });

    const getDotColor = (type) => {
      const colors = {
        'License': 'bg-cyan-500',
        'Maintenance': 'bg-amber-500',
        'IP Charges': 'bg-purple-500',
      };
      if (colors[type]) return colors[type];

      const hashes = [...type].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colorOptions = [
        'bg-indigo-500',
        'bg-emerald-500',
        'bg-pink-500',
        'bg-rose-500',
        'bg-blue-500',
        'bg-orange-500',
        'bg-teal-500',
      ];
      return colorOptions[hashes % colorOptions.length];
    };

    const salesBreakdown = [];
    Object.entries(typeStats).forEach(([type, stats]) => {
      if (stats.billed > 0 || standardTypes.includes(type)) {
        let label = `${type} Bills`;
        if ((type === 'License' || type === 'IP Charges') && stats.qty > 0) {
          label += ` (${stats.qty} Qty)`;
        }
        salesBreakdown.push({
          label,
          value: `₹${stats.billed.toLocaleString()}`,
          dotColor: getDotColor(type),
          link: `/dashboard/payments?transactionType=bill&type=${encodeURIComponent(type)}`
        });
      }
    });
    const typeOrder = { 'Maintenance': 1, 'License': 2, 'IP Charges': 3 };
    salesBreakdown.sort((a, b) => {
      const aType = a.label.replace(' Bills', '');
      const bType = b.label.replace(' Bills', '');
      const aOrd = typeOrder[aType] || 99;
      const bOrd = typeOrder[bType] || 99;
      return aOrd - bOrd;
    });

    if (totalGst > 0) {
      salesBreakdown.push({
        label: 'Total GST (18%)',
        value: `₹${Math.round(totalGst).toLocaleString()}`,
        dotColor: 'bg-fuchsia-500',
        link: '/dashboard/payments?transactionType=bill',
        textColor: 'text-fuchsia-600 dark:text-fuchsia-400 font-semibold'
      });
    }

    let hasBillDiscounts = false;
    Object.entries(typeStats).forEach(([type, stats]) => {
      if (stats.billDiscount > 0) {
        hasBillDiscounts = true;
        salesBreakdown.push({
          label: `${type} Bill Discounts`,
          value: `-₹${stats.billDiscount.toLocaleString()}`,
          dotColor: 'bg-orange-500',
          link: '/dashboard/payments?transactionType=bill',
          textColor: 'text-orange-600'
        });
      }
    });
    if (!hasBillDiscounts) {
      salesBreakdown.push({
        label: 'Bill Discounts Given',
        value: `-₹0`,
        dotColor: 'bg-orange-500',
        link: '/dashboard/payments?transactionType=bill',
        textColor: 'text-orange-600'
      });
    }

    if (openingBalSum > 0) {
      salesBreakdown.unshift({
        label: 'Opening Balance',
        value: `₹${openingBalSum.toLocaleString()}`,
        dotColor: 'bg-slate-500',
        link: '/dashboard/panels',
      });
    }

    const revenueBreakdown = [];
    Object.entries(typeStats).forEach(([type, stats]) => {
      if (stats.paid > 0 || standardTypes.includes(type)) {
        let label = `${type} Collections`;
        if ((type === 'License' || type === 'IP Charges') && stats.qty > 0) {
          label += ` (${stats.qty} Qty)`;
        }
        revenueBreakdown.push({
          label,
          value: `₹${stats.paid.toLocaleString()}`,
          dotColor: getDotColor(type),
          link: `/dashboard/payments?transactionType=received&type=${encodeURIComponent(type)}`
        });
      }
    });
    revenueBreakdown.sort((a, b) => {
      const aType = a.label.replace(' Collections', '');
      const bType = b.label.replace(' Collections', '');
      const aOrd = typeOrder[aType] || 99;
      const bOrd = typeOrder[bType] || 99;
      return aOrd - bOrd;
    });
    revenueBreakdown.push({
      label: 'Payment Discounts Given',
      value: `-₹${paymentDiscountSum.toLocaleString()}`,
      dotColor: 'bg-red-500',
      link: '/dashboard/payments?transactionType=received',
      textColor: 'text-rose-600 dark:text-rose-400 font-semibold'
    });

    const outstandingBreakdown = [];
    if (openingBalSum > 0) {
      outstandingBreakdown.push({
        label: 'Opening Balance Dues',
        value: `₹${openingBalSum.toLocaleString()}`,
        dotColor: 'bg-slate-500',
        link: '/dashboard/panels?balance=Outstanding',
        textColor: 'text-slate-800'
      });
    }
    Object.entries(typeStats).forEach(([type, stats]) => {
      const outstandingVal = stats.billed - stats.billDiscount - (stats.paid + stats.paymentDiscount);
      if (outstandingVal !== 0 || standardTypes.includes(type)) {
        outstandingBreakdown.push({
          label: outstandingVal < 0 ? `${type} Credit` : `${type} Dues`,
          value: outstandingVal < 0
            ? `₹${Math.abs(outstandingVal).toLocaleString()}`
            : `₹${outstandingVal.toLocaleString()}`,
          dotColor: getDotColor(type),
          link: '/dashboard/panels?balance=Outstanding',
          textColor: outstandingVal > 0
            ? 'text-rose-600 dark:text-rose-400 font-semibold'
            : outstandingVal < 0
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-800'
        });
      }
    });
    outstandingBreakdown.sort((a, b) => {
      if (a.label === 'Opening Balance Dues') return -1;
      if (b.label === 'Opening Balance Dues') return 1;
      const aType = a.label.replace(' Dues', '').replace(' Credit', '');
      const bType = b.label.replace(' Dues', '').replace(' Credit', '');
      const aOrd = typeOrder[aType] || 99;
      const bOrd = typeOrder[bType] || 99;
      return aOrd - bOrd;
    });

    const panelStats = Object.values(map).map((panel) => {
      const netBilled = panel.totalBilled - (panel.billDiscount || 0);
      const netPaid = panel.totalPaid + (panel.paymentDiscount || 0);
      const rate = netBilled > 0 ? Math.min(Math.round((netPaid / netBilled) * 100), 100) : 0;
      const outstanding = (panel.openingBalance || 0) + netBilled - netPaid;

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

    const recRate = (totalBilled - billDiscountSum) > 0 ? Math.round((totalPaid / (totalBilled - billDiscountSum)) * 100) : 0;
    const netBal = (totalBilled - billDiscountSum) - (totalPaid + paymentDiscountSum);

    const cumulativeOutstanding = filterType === 'all'
      ? openingBalSum + (totalBilled - billDiscountSum) - (totalPaid + paymentDiscountSum)
      : netBal;

    // --- SEQUENTIAL LOAD FALLBACK ---
    // While heavy payments are still loading in the background, we use the fast server-calculated metrics 
    // for the top 3 cards so they don't show "0" during the 1-2 second loading period.
    const useServerMetrics = stats?.metrics && rawPayments.length === 0;

    let finalTotalBilled = totalBilled;
    let finalTotalPaid = totalPaid;
    let finalBillsCount = billsCount + openingBalCount;
    let finalRecovery = recRate;
    let finalOutstanding = cumulativeOutstanding;

    let finalSalesBreakdown = salesBreakdown;
    let finalRevenueBreakdown = revenueBreakdown;
    let finalOutstandingBreakdown = outstandingBreakdown;

    if (useServerMetrics) {
      finalTotalPaid = stats.metrics.totalPaymentsReceived;
      finalOutstanding = stats.metrics.totalOutstanding;
      // Reverse engineer total billed from outstanding formula and INCLUDE opening balance
      finalTotalBilled = stats.metrics.totalOutstanding + stats.metrics.totalPaymentsReceived + stats.metrics.totalPaymentDiscount + stats.metrics.totalBillDiscount;
      finalRecovery = (finalTotalBilled - stats.metrics.totalBillDiscount) > 0 ? Math.round((finalTotalPaid / (finalTotalBilled - stats.metrics.totalBillDiscount)) * 100) : 0;
      finalBillsCount = stats.counts.totalPayments; // Approximation while loading

      finalSalesBreakdown = [
        { label: 'Opening Balance', value: `₹${(stats.metrics.totalOpeningBalance || 0).toLocaleString()}`, dotColor: 'bg-slate-500', link: '/dashboard/panels' },
        { label: 'License Charges Billed', value: `₹${(stats.metrics.totalLicenseCharges || 0).toLocaleString()}`, dotColor: 'bg-indigo-400', link: '/dashboard/panels' },
        { label: 'IP Charges Billed', value: `₹${(stats.metrics.totalIpCharges || 0).toLocaleString()}`, dotColor: 'bg-violet-400', link: '/dashboard/panels' },
        { label: 'Maintenance Billed', value: `₹${(stats.metrics.totalMaintenanceCharges || 0).toLocaleString()}`, dotColor: 'bg-fuchsia-400', link: '/dashboard/panels' },
        { label: 'Bill Discounts Given', value: `-₹${(stats.metrics.totalBillDiscount || 0).toLocaleString()}`, dotColor: 'bg-rose-500', link: '/dashboard/panels', textColor: 'text-rose-600 font-semibold' }
      ];

      finalRevenueBreakdown = [
        ...Object.entries(stats.paymentBreakdown || {}).map(([key, val]) => ({
          label: `${key} Collected`, value: `₹${val.toLocaleString()}`, dotColor: getDotColor(key), link: '/dashboard/payments?transactionType=received'
        })),
        { label: 'Payment Discounts Given', value: `-₹${(stats.metrics.totalPaymentDiscount || 0).toLocaleString()}`, dotColor: 'bg-red-500', link: '/dashboard/payments?transactionType=received', textColor: 'text-rose-600 font-semibold' }
      ];

      finalOutstandingBreakdown = [
        { label: 'Opening Balance Dues', value: `₹${(stats.metrics.totalOpeningBalance || 0).toLocaleString()}`, dotColor: 'bg-slate-500', link: '/dashboard/panels', textColor: 'text-slate-800' }
      ];
    }

    return {
      filteredPayments: filtered,
      totalBilledAmount: useServerMetrics ? finalTotalBilled : totalBilled + openingBalSum,
      totalPaymentsReceived: finalTotalPaid,
      totalBillsCount: finalBillsCount,
      cashCollections: cash,
      onlineCollections: online,
      panelStatsArray: panelStats,
      recoveryRate: finalRecovery,
      outstandingBalance: finalOutstanding,
      billDiscountTotal: billDiscountSum,
      paymentDiscountTotal: paymentDiscountSum,
      openingBalSum,
      salesBreakdown: finalSalesBreakdown,
      revenueBreakdown: finalRevenueBreakdown,
      outstandingBreakdown: finalOutstandingBreakdown,
    };
  }, [stats, filterType, selectedMonth, selectedQuarter, selectedDate, selectedCatFilter]);

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
    } else if (filterType === 'daily') {
      let paid = 0;
      let billed = 0;
      filteredPayments.forEach((p) => {
        paid += p.amountReceived || 0;
        billed += p.billAmount || 0;
      });
      return [{
        label: new Date(selectedDate).toLocaleDateString('default', { day: 'numeric', month: 'short' }),
        paid,
        billed
      }];
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
  }, [filteredPayments, filterType, selectedQuarter, selectedDate]);

  const uniqueCategories = useMemo(() => {
    const rawPanels = stats?.panels || [];
    const set = new Set(rawPanels.map((p) => p.category || 'Algo'));
    return Array.from(set);
  }, [stats]);

  const processedPerfPanels = useMemo(() => {
    let list = [...panelStatsArray];
    if (selectedCatFilter !== 'All') {
      list = list.filter((p) => p.category === selectedCatFilter);
    }
    if (selectedStatusFilter !== 'All') {
      list = list.filter((p) => p.status === selectedStatusFilter);
    }
    if (tableSearch.trim()) {
      const q = tableSearch.trim().toLowerCase();
      list = list.filter((p) => p.panelName.toLowerCase().includes(q) || (p.ownerName || '').toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let valA = a[perfSortField];
      let valB = b[perfSortField];
      if (typeof valA === 'string') {
        return perfSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return perfSortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return list;
  }, [panelStatsArray, selectedCatFilter, selectedStatusFilter, perfSortField, perfSortOrder, tableSearch]);

  // worstPerforming (recoveryRate < 50, billed > 0) or fallback to highest outstanding
  const worstPerforming = useMemo(() => {
    if (!stats?.panels || stats.panels.length === 0) return []; // Don't show skeleton while loading, just empty

    const attention = [...panelStatsArray]
      .filter((p) => p.totalBilled > 0 && p.recoveryRate < 50)
      .sort((a, b) => a.recoveryRate - b.recoveryRate);

    if (attention.length > 0) return attention.slice(0, 3);

    // fallback to highest outstanding
    return [...panelStatsArray]
      .filter((p) => p.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 3);
  }, [panelStatsArray, stats]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-6 text-red-500 flex items-start gap-4">
        <AlertCircle className="h-6 w-6 shrink-0" />
        <div>
          <h3 className="font-semibold text-lg">Metrics Synchronization Failed</h3>
          <p className="text-sm text-red-500/80 mt-1">{error}</p>
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

  const handleSort = (field) => {
    if (perfSortField === field) {
      setPerfSortOrder(perfSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPerfSortField(field);
      setPerfSortOrder('desc');
    }
  };

  // Active period label for display across all sections
  let activePeriodLabel = 'All Time';
  if (filterType === 'monthly') {
    const m = availableMonths.find(x => x.value === selectedMonth);
    activePeriodLabel = m ? m.label : selectedMonth;
  } else if (filterType === 'quarterly') {
    const q = availableQuarters.find(x => x.value === selectedQuarter);
    activePeriodLabel = q ? q.label : selectedQuarter;
  } else if (filterType === 'daily') {
    activePeriodLabel = new Date(selectedDate).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const medals = ['🥇', '🥈', '🥉', '4.', '5.'];

  const premiumCards = [
    {
      title: 'Sales & Billing Overview',
      value: `₹${totalBilledAmount.toLocaleString()}`,
      desc: `${totalBillsCount} Invoices generated`,
      icon: FileSpreadsheet,
      iconBg: 'from-indigo-500/20 to-blue-500/10 text-indigo-500 dark:text-indigo-400',
      iconBorder: 'border-indigo-500/20 dark:border-indigo-500/30',
      link: '/dashboard/payments?transactionType=bill',
      color: 'from-indigo-50/60 dark:from-indigo-950/20 via-white dark:via-slate-900 to-white dark:to-slate-900 border-indigo-100/80 dark:border-indigo-950/30 shadow-indigo-100/10 dark:shadow-none',
      topBorderColor: 'from-indigo-500 to-violet-500',
      formula: 'Total Billed = Sum of Billed Charges - Bill Discounts',
      breakdown: salesBreakdown,
    },
    {
      title: 'Revenue & Collections',
      value: `₹${totalPaymentsReceived.toLocaleString()}`,
      desc: `Recovery Rate: ${recoveryRate}%`,
      icon: CircleDollarSign,
      iconBg: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
      iconBorder: 'border-emerald-500/20 dark:border-emerald-500/30',
      link: '/dashboard/payments?transactionType=received',
      color: 'from-emerald-50/60 dark:from-emerald-950/20 via-white dark:via-slate-900 to-white dark:to-slate-900 border-emerald-100/80 dark:border-emerald-950/30 shadow-emerald-100/10 dark:shadow-none',
      topBorderColor: 'from-emerald-500 to-teal-500',
      formula: 'Total Received = Sum of Payments Paid - Payment Discounts',
      breakdown: revenueBreakdown,
    },
    {
      title: outstandingBalance > 0 ? 'Outstanding Dues (Dues)' : 'Advance Balance',
      value: outstandingBalance > 0
        ? `₹${outstandingBalance.toLocaleString()}`
        : `₹${Math.abs(outstandingBalance).toLocaleString()}`,
      valueColor: outstandingBalance > 0
        ? 'text-rose-600 dark:text-rose-500'
        : 'text-emerald-600 dark:text-emerald-400',
      desc: outstandingBalance > 0 ? 'Cumulative ledger balance (Dues)' : 'Cumulative ledger balance (Credit)',
      icon: Landmark,
      iconBg: outstandingBalance > 0 ? 'from-red-50/20 to-red-700/10 text-red-600 dark:text-red-400' : 'from-emerald-50/20 to-teal-500/10 text-emerald-500 dark:text-emerald-400',
      iconBorder: outstandingBalance > 0 ? 'border-red-500/20 dark:border-red-500/30' : 'border-emerald-500/20 dark:border-emerald-500/30',
      link: '/dashboard/panels?balance=Outstanding',
      color: outstandingBalance > 0
        ? 'from-red-50/40 dark:from-red-950/20 via-white dark:via-slate-900 to-white dark:to-slate-900 border-red-100/80 dark:border-red-950/30 shadow-red-100/10 dark:shadow-none'
        : 'from-emerald-50/60 dark:from-emerald-950/20 via-white dark:via-slate-900 to-white dark:to-slate-900 border-emerald-100/80 dark:border-emerald-950/30 shadow-emerald-100/10 dark:shadow-none',
      topBorderColor: outstandingBalance > 0 ? 'from-red-500 to-red-700' : 'from-emerald-500 to-teal-500',
      formula: 'Outstanding = Opening Balance + Net Period Billed - Net Period Collected',
      breakdown: outstandingBreakdown,
    },
  ];

  // Calculate SVG Max Value for Trend Chart
  const maxTrendVal = Math.max(...trendData.map(d => Math.max(d.paid, d.billed)), 1);

  return (
    <>
      <div className="space-y-6">

        {/* ── Filter Toolbar ── */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500"></div>
          <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-[15px] tracking-tight text-slate-900 dark:text-slate-100">Dashboard Filters</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Applies to ALL cards, charts &amp; tables below</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-400 transition-colors">
                <Layers className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <select value={selectedCatFilter} onChange={(e) => setSelectedCatFilter(e.target.value)} className="bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer">
                  <option value="All" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All Categories</option>
                  {uniqueCategories.map((c) => <option key={c} value={c} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{c}</option>)}
                </select>
              </div>
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {[{ id: "all", label: "All Time" }, { id: "daily", label: "Daily" }, { id: "monthly", label: "Monthly" }, { id: "quarterly", label: "Quarterly" }].map((t) => (
                  <button key={t.id} onClick={() => setFilterType(t.id)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${filterType === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>{t.label}</button>
                ))}
              </div>
              {filterType === "daily" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer" />
                </div>
              )}
              {filterType === "monthly" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer">
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{m.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {filterType === "quarterly" && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer">
                    {availableQuarters.map((q) => (
                      <option key={q.value} value={q.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{q.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          {/* Active filter strip */}
          <div className="px-4 pb-3 flex flex-wrap items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Showing:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Zap className="h-2.5 w-2.5" />{activePeriodLabel}
            </span>
            {selectedCatFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Tag className="h-2.5 w-2.5" />{selectedCatFilter}
              </span>
            )}

            {stats && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500">— {filteredPayments.length} transactions · {panelStatsArray.length} panels</span>
            )}
          </div>
        </div>

        {/* ── Section Label ── */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3" /> Financial Overview · {activePeriodLabel}{selectedCatFilter !== 'All' ? ` · ${selectedCatFilter}` : ''}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent"></div>
        </div>

        {/* ── 3 Premium Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {premiumCards.map((card, i) => {
            const Icon = card.icon;
            const accents = [
              {
                wrapper: 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/40 shadow-md hover:shadow-indigo-500/10',
                glow: 'bg-indigo-500/10 dark:bg-indigo-500/20',
                iconOuter: 'bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-500/20 dark:to-indigo-500/5 border-indigo-200/80 dark:border-indigo-500/30',
                iconInner: 'text-indigo-600 dark:text-indigo-400',
                topBar: 'from-indigo-500 to-violet-500'
              },
              {
                wrapper: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40 shadow-md hover:shadow-emerald-500/10',
                glow: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                iconOuter: 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/5 border-emerald-200/80 dark:border-emerald-500/30',
                iconInner: 'text-emerald-600 dark:text-emerald-400',
                topBar: 'from-emerald-500 to-teal-500'
              },
              {
                wrapper: card.title.includes('Outstanding') && outstandingBalance > 0
                  ? 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900/40 shadow-md hover:shadow-rose-500/10'
                  : 'bg-white dark:bg-slate-900 border-teal-200 dark:border-teal-900/40 shadow-md hover:shadow-teal-500/10',
                glow: card.title.includes('Outstanding') && outstandingBalance > 0 ? 'bg-rose-500/10 dark:bg-rose-500/20' : 'bg-teal-500/10 dark:bg-teal-500/20',
                iconOuter: card.title.includes('Outstanding') && outstandingBalance > 0
                  ? 'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/5 border-rose-200/80 dark:border-rose-500/30'
                  : 'bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-500/20 dark:to-teal-500/5 border-teal-200/80 dark:border-teal-500/30',
                iconInner: card.title.includes('Outstanding') && outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400',
                topBar: card.title.includes('Outstanding') && outstandingBalance > 0 ? 'from-rose-500 to-red-500' : 'from-teal-500 to-emerald-500'
              },
            ];
            const a = accents[i];

            return (
              <div key={i} className={`group relative rounded-2xl border ${a.wrapper} shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col`}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${a.topBar}`}></div>
                <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full ${a.glow} blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-70 opacity-40`}></div>

                {/* Header */}
                <div className="relative flex items-start justify-between p-5 pb-3">
                  <div className="flex items-center gap-3.5">
                    <div className={`h-12 w-12 rounded-xl ${a.iconOuter} flex items-center justify-center shrink-0 shadow-inner`}>
                      <Icon className={`h-5 w-5 ${a.iconInner}`} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide leading-tight">{card.title}</h4>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalInfo(card); }} className="h-8 w-8 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm transition-colors shrink-0" title="View calculation">
                    <Info className="h-4 w-4" />
                  </button>
                </div>

                {/* Value */}
                <div className="relative px-5 pb-2 flex items-center justify-between">
                  <Link to={card.link} className="inline-block">
                    <span className={`text-4xl md:text-[40px] leading-none font-black tracking-tighter tabular-nums ${card.valueColor || 'text-slate-900 dark:text-white'} hover:opacity-80 transition-opacity`}>{card.value}</span>
                  </Link>
                  {/* Recovery rate circle chart for revenue card */}
                  {i === 1 && (
                    <div className="relative h-14 w-14 shrink-0 flex items-center justify-center ml-4">
                      <svg className="w-full h-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 36 36">
                        <path className="text-slate-200 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                        <path className={`${recoveryRate >= 80 ? 'text-emerald-500' : recoveryRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`} strokeDasharray={`${Math.min(Math.max(recoveryRate, 0), 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                      </svg>
                      <div className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${recoveryRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : recoveryRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {recoveryRate}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Active filter pills on card */}
                <div className="relative px-5 pb-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-sm">
                    <Zap className="h-3 w-3 text-amber-500" />{activePeriodLabel}
                  </span>
                  {selectedCatFilter !== 'All' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/60 dark:bg-slate-800/60 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 shadow-sm">
                      <Tag className="h-3 w-3 text-emerald-500" />{selectedCatFilter}
                    </span>
                  )}
                </div>

                {/* Breakdown Section */}
                <div className="relative flex-1 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md border-t border-slate-200/70 dark:border-slate-700/70 p-4 pt-3 space-y-1.5 mt-auto">
                  <button
                    onClick={(e) => { e.preventDefault(); setShowBreakdown(!showBreakdown); }}
                    className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 hover:text-slate-800 dark:hover:text-slate-200 transition-colors group/btn"
                  >
                    <span>Breakdown</span>
                    <div className="h-5 w-5 rounded-md bg-slate-200/50 dark:bg-slate-800/50 group-hover/btn:bg-slate-300/50 dark:group-hover/btn:bg-slate-700/50 flex items-center justify-center transition-colors">
                      {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  </button>

                  {showBreakdown && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in duration-300 pt-1">
                      {card.breakdown.map((item, idx) => (
                        <Link key={idx} to={item.link} className="flex justify-between items-center py-1.5 px-3 rounded-lg hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors group/item">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`h-2 w-2 rounded-full ${item.dotColor || 'bg-slate-400'} shrink-0 shadow-sm`}></span>
                            <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 group-hover/item:text-slate-900 dark:group-hover/item:text-white truncate transition-colors">{item.label}</span>
                          </div>
                          <span className={`text-[12px] font-black font-mono shrink-0 ml-2 ${item.textColor || 'text-slate-800 dark:text-slate-100'}`}>{item.value}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Analytics Chart & Breakdown Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Payment & Billing Trend Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-md transition-all duration-300 flex flex-col min-h-[320px] relative overflow-hidden group">
            {/* Subtle background glow */}
            <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-all duration-700"></div>

            <div className="relative flex items-start justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                  Billing &amp; Collections Trend
                </h3>
                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">Billed vs Paid · {activePeriodLabel}{selectedCatFilter !== 'All' ? ` · ${selectedCatFilter}` : ''}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider bg-slate-100/50 dark:bg-slate-800/50 py-1.5 px-3 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/30"></span>
                  <span className="text-slate-600 dark:text-slate-300">Billed</span>
                </div>
                <div className="h-3 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></span>
                  <span className="text-slate-600 dark:text-slate-300">Collected</span>
                </div>
              </div>
            </div>

            <div className="relative flex-1 flex items-center justify-center py-4">
              {maxTrendVal <= 1 ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2 opacity-60">
                  <AlertCircle className="h-8 w-8 text-slate-500 dark:text-slate-500" />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">No transactions recorded in this period</span>
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
                      <g key={index} className="text-slate-200 dark:text-slate-800 opacity-60">
                        <line
                          x1="50"
                          y1={yVal}
                          x2="530"
                          y2={yVal}
                          stroke="currentColor"
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

          {/* Registry Overview */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-md transition-all duration-300 relative overflow-hidden flex flex-col gap-5 group">
            {/* Subtle glow */}
            <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-violet-500/5 dark:bg-violet-500/10 blur-3xl pointer-events-none group-hover:bg-violet-500/10 dark:group-hover:bg-violet-500/20 transition-all duration-700"></div>

            <div>
              <h3 className="font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-violet-500" />
                Ledger Overview
              </h3>
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-1">Clients and transactions summary</p>
            </div>

            <div className="space-y-4 relative">
              <div className="grid grid-cols-2 gap-3">
                <Link to="/dashboard/panels" className="flex flex-col gap-2 bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-500/10 dark:to-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:shadow-md transition-all group/stat">
                  <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm shadow-indigo-500/30 group-hover/stat:scale-110 transition-transform">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-0.5">Total Panels</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{processedPerfPanels.length}</p>
                  </div>
                </Link>

                <Link to="/dashboard/payments" className="flex flex-col gap-2 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-2xl hover:border-emerald-300 dark:hover:emerald-500/40 hover:shadow-md transition-all group/stat">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30 group-hover/stat:scale-110 transition-transform">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Transactions</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{filteredPayments.length}</p>
                  </div>
                </Link>
              </div>

              {/* Added Circle Chart for Client Status Count */}
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 backdrop-blur-sm shadow-inner">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 text-start">Client Status Distribution</p>
                <div className="flex items-start gap-5 justify-start">
                  <div className="shrink-0 relative">
                    <DonutChart
                      data={[
                        { label: 'Excellent', value: processedPerfPanels.filter(p => p.status === 'Excellent').length, color: '#10b981' },
                        { label: 'Healthy', value: processedPerfPanels.filter(p => p.status === 'Healthy').length, color: '#f59e0b' },
                        { label: 'Attention', value: processedPerfPanels.filter(p => p.status === 'Needs Attention').length, color: '#f43f5e' },
                        { label: 'Inactive', value: processedPerfPanels.filter(p => p.status === 'Critically Inactive').length, color: '#64748b' },
                      ]}
                      size={100}
                      strokeWidth={14}
                    />
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                      <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{processedPerfPanels.length}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { label: 'Excellent', key: 'Excellent', color: 'bg-emerald-500' },
                      { label: 'Healthy', key: 'Healthy', color: 'bg-amber-500' },
                      { label: 'Attention', key: 'Needs Attention', color: 'bg-rose-500' },
                      { label: 'Inactive', key: 'Critically Inactive', color: 'bg-slate-500' },
                    ].map((st) => {
                      const count = processedPerfPanels.filter(p => p.status === st.key).length;
                      return (
                        <div key={st.key} className="flex items-center justify-between gap-4 w-full">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${st.color} shadow-sm`}></span>
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-none">{st.label}</span>
                          </div>
                          <span className="text-[11px] font-black text-slate-900 dark:text-white">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {['Cash', 'UPI', 'Bank Transfer', 'Online'].map((mode) => {
                  const modeAmt = filteredPayments
                    .filter((p) => p.paymentMode === mode)
                    .reduce((sum, p) => sum + (p.amountReceived || 0), 0);
                  const modeColors = {
                    Cash: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 hover:border-amber-400',
                    UPI: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:border-emerald-400',
                    'Bank Transfer': 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border-indigo-200 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:border-indigo-400',
                    Online: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 border-violet-200 dark:border-violet-900/30 text-violet-700 dark:text-violet-400 hover:border-violet-400',
                  };
                  return (
                    <div key={mode} className={`p-2.5 rounded-xl border ${modeColors[mode]} transition-colors shadow-sm`}>
                      <span className="block text-[9px] uppercase font-bold tracking-wider mb-1 opacity-80">{mode}</span>
                      <span className="font-black text-sm tabular-nums">₹{modeAmt >= 100000 ? `${(modeAmt / 100000).toFixed(1)}L` : modeAmt >= 1000 ? `${(modeAmt / 1000).toFixed(1)}K` : modeAmt.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Leaderboard Section Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-[17px] tracking-tight text-slate-900 dark:text-white">Client Performance Leaderboards</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Top clients · {activePeriodLabel}{selectedCatFilter !== 'All' ? ` · ${selectedCatFilter}` : ''}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Zap className="h-2.5 w-2.5" />{activePeriodLabel}
            </span>
            {selectedCatFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Tag className="h-2.5 w-2.5" />{selectedCatFilter}
              </span>
            )}
            {inactivePanels.length > 0 && (
              <button onClick={() => setShowInactive(!showInactive)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:border-red-400 text-red-600 dark:text-red-400 transition-colors">
                <AlertCircle className="h-3.5 w-3.5" />{showInactive ? 'Hide' : 'Show'} Inactive ({inactivePanels.length})
              </button>
            )}
          </div>
        </div>

        {/* Inactive Panels Expandable drawer */}
        {showInactive && (
          <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-6 animate-pulse-subtle">
            <h4 className="font-bold text-sm text-red-700 mb-2 uppercase tracking-wide">Inactive Clients (No Bills/Payments in Period)</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">The following client panels recorded zero invoiced sales and zero payments collected during this selected period:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactivePanels.map((p) => (
                <div key={p._id} className="bg-slate-50/40 dark:bg-slate-950/40 border border-slate-900/60 rounded-xl p-3.5 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.panelName}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">Owner: {p.ownerName}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-red-700 px-2 py-0.5 rounded bg-red-500/5 border border-red-500/10">No Activity</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Rankings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Revenue Leaders */}
          <div className="group relative rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-emerald-900/40 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col p-5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-70 opacity-40"></div>

            <div className="relative flex items-center gap-3.5 mb-5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/20 dark:to-emerald-500/5 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-500/30 shadow-inner shrink-0">
                <CircleDollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-[14px] text-slate-800 dark:text-slate-200 tracking-wide uppercase">Revenue Leaders</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Most Paid</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {topPayingPanels.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-500 font-semibold text-center space-y-1">
                  <span>No Payments Registered</span>
                </div>
              ) : (
                topPayingPanels.map((item, idx) => {
                  const pct = totalPaymentsReceived > 0 ? (item.totalPaid / totalPaymentsReceived) * 100 : 0;
                  return (
                    <div key={item._id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <Link to={`/dashboard/panels?search=${encodeURIComponent(item.panelName)}`} className="text-slate-700 dark:text-slate-300 hover:text-indigo-400 transition-colors truncate max-w-[120px] cursor-pointer">
                          {idx + 1}. {item.panelName}
                        </Link>
                        <span className="text-emerald-700 font-bold">₹{item.totalPaid.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100/60 dark:bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-300 dark:border-slate-800">
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
          <div className="group relative rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-indigo-900/40 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col p-5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-70 opacity-40"></div>

            <div className="relative flex items-center gap-3.5 mb-5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-500/20 dark:to-indigo-500/5 flex items-center justify-center border border-indigo-200/80 dark:border-indigo-500/30 shadow-inner shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-[14px] text-slate-800 dark:text-slate-200 tracking-wide uppercase">Sales Invoiced</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Top Billed</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {topBilledPanels.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-500 font-semibold text-center space-y-1">
                  <span>No Sales Billed</span>
                </div>
              ) : (
                topBilledPanels.map((item, idx) => {
                  const pct = totalBilledAmount > 0 ? (item.totalBilled / totalBilledAmount) * 100 : 0;
                  return (
                    <div key={item._id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <Link to={`/dashboard/panels?search=${encodeURIComponent(item.panelName)}`} className="text-slate-700 dark:text-slate-300 hover:text-indigo-400 transition-colors truncate max-w-[120px] cursor-pointer">
                          {idx + 1}. {item.panelName}
                        </Link>
                        <span className="text-indigo-700 font-bold">₹{item.totalBilled.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100/60 dark:bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-300 dark:border-slate-800">
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
          <div className="group relative rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-cyan-900/40 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col p-5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-70 opacity-40"></div>

            <div className="relative flex items-center gap-3.5 mb-5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-50 dark:from-cyan-500/20 dark:to-cyan-500/5 flex items-center justify-center border border-cyan-200/80 dark:border-cyan-500/30 shadow-inner shrink-0">
                <Layers className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-[14px] text-slate-800 dark:text-slate-200 tracking-wide uppercase">License Intake</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider">Most Licenses</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {topLicensePanels.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-500 font-semibold text-center space-y-1">
                  <span>No Licenses Issued</span>
                </div>
              ) : (
                topLicensePanels.map((item, idx) => {
                  const maxLic = Math.max(...topLicensePanels.map(x => x.licenseQty), 1);
                  const pct = (item.licenseQty / maxLic) * 100;
                  return (
                    <div key={item._id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold col-span-2">
                        <Link to={`/dashboard/panels?search=${encodeURIComponent(item.panelName)}`} className="text-slate-700 dark:text-slate-300 hover:text-indigo-400 transition-colors truncate max-w-[110px] cursor-pointer">
                          {idx + 1}. {item.panelName}
                        </Link>
                        <span className="text-cyan-700 font-bold">{item.licenseQty} Qty <span className="text-[10px] text-slate-600 dark:text-slate-400 font-normal">(₹{(item.licenseBilled || item.licensePaid).toLocaleString()})</span></span>
                      </div>
                      <div className="w-full bg-slate-100/60 dark:bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-300 dark:border-slate-800">
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
          <div className="group relative rounded-3xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-amber-900/40 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col p-5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-amber-500/10 dark:bg-amber-500/20 blur-3xl pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-70 opacity-40"></div>

            <div className="relative flex items-center gap-3.5 mb-5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-500/20 dark:to-amber-500/5 flex items-center justify-center border border-amber-200/80 dark:border-amber-500/30 shadow-inner shrink-0">
                <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-[14px] text-slate-800 dark:text-slate-200 tracking-wide uppercase">Maintenance Dues</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider">SLA Payments</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {topMaintenancePanels.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-500 font-semibold text-center space-y-1">
                  <span>No SLA Payments</span>
                </div>
              ) : (
                topMaintenancePanels.map((item, idx) => {
                  const maxMaint = Math.max(...topMaintenancePanels.map(x => x.maintenanceBilled || x.maintenancePaid), 1);
                  const pct = ((item.maintenanceBilled || item.maintenancePaid) / maxMaint) * 100;
                  return (
                    <div key={item._id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <Link to={`/dashboard/panels?search=${encodeURIComponent(item.panelName)}`} className="text-slate-700 dark:text-slate-300 hover:text-indigo-400 transition-colors truncate max-w-[120px] cursor-pointer">
                          {idx + 1}. {item.panelName}
                        </Link>
                        <span className="text-amber-700 font-bold">₹{(item.maintenanceBilled || item.maintenancePaid).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100/60 dark:bg-slate-900/60 rounded-full h-2 p-[1px] border border-slate-300 dark:border-slate-800">
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

        {/* Performance Section */}
        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">

          {/* Performance Alerts */}
          {worstPerforming.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 p-5 shadow-sm">
              {/* Subtle background glow effect */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-rose-500/5 dark:bg-rose-500/10 blur-3xl pointer-events-none"></div>

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-500/20 dark:to-rose-500/5 flex items-center justify-center border border-rose-200/80 dark:border-rose-500/30 shadow-inner">
                    <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white dark:border-slate-900"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      Performance Alerts
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Critical attention needed · {activePeriodLabel}{selectedCatFilter !== 'All' ? ` · ${selectedCatFilter}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-sm">
                    <Zap className="h-3 w-3 text-amber-500" />{activePeriodLabel}
                  </span>
                  {inactivePanels.length > 0 && (
                    <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-rose-100/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 shadow-sm flex items-center gap-1">
                      ⚠️ Inactive: {inactivePanels.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
                {worstPerforming.map((item, idx) => (
                  <div key={item._id} className="group bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700/50 transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <Link
                          to={`/dashboard/panels?search=${encodeURIComponent(item.panelName)}`}
                          className="text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 font-bold text-sm block truncate transition-colors"
                          title={item.panelName}
                        >
                          {idx + 1}. {item.panelName}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">{item.category || 'Algo'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 shrink-0 shadow-sm">
                        {item.totalBilled > 0 ? `${item.recoveryRate}%` : 'No Bills'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-rose-900/30 text-xs">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Sales Billed</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">₹{item.totalBilled.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9px] uppercase font-bold tracking-wider mb-0.5">Outstanding</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">₹{item.outstanding.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Recovery progress bar */}
                    {item.totalBilled > 0 && (
                      <div className="w-full mt-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-900/80 rounded-full h-1.5 p-[1px] border border-slate-200 dark:border-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-red-500"
                            style={{ width: `${Math.max(Math.min(item.recoveryRate, 100), 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 2: Client Performance Ledger Grid Table & Side Card */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col">
                {/* Table Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-[15px] tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />Client Performance Table
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{activePeriodLabel}{selectedCatFilter !== 'All' ? ` · ${selectedCatFilter}` : ''} · {processedPerfPanels.length} clients shown</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      <Zap className="h-2.5 w-2.5" />{activePeriodLabel}
                    </span>
                    {selectedCatFilter !== 'All' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        <Tag className="h-2.5 w-2.5" />{selectedCatFilter}
                      </span>
                    )}
                    {/* Search */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus-within:border-indigo-400 transition-colors">
                      <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input type="text" value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search client..." className="bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none w-28" />
                      {tableSearch && <button onClick={() => setTableSearch('')} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>}
                    </div>
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status:</span>
                      <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="bg-transparent text-slate-900 dark:text-white font-semibold cursor-pointer outline-none text-xs">
                        <option value="All" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">All</option>
                        <option value="Excellent" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Excellent (90%+)</option>
                        <option value="Healthy" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Healthy (50-89%)</option>
                        <option value="Needs Attention" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Needs Attention</option>
                        <option value="Critically Inactive" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Performance Table */}
                <div className="overflow-x-auto overflow-y-auto max-h-[750px] custom-scrollbar relative">
                  <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-[0.06em] text-[10.5px]">
                        <th className="px-4 py-3 text-center w-10">#</th>
                        <th onClick={() => handleSort('panelName')} className="px-4 py-3 cursor-pointer transition-colors">
                          <div className="flex items-center gap-1">Client Panel {perfSortField === 'panelName' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}</div>
                        </th>
                        <th className="px-4 py-3">Category</th>
                        <th onClick={() => handleSort('totalBilled')} className="px-4 py-3 cursor-pointer transition-colors text-right">
                          <div className="flex items-center justify-end gap-1">Sales Billed {perfSortField === 'totalBilled' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}</div>
                        </th>
                        <th onClick={() => handleSort('totalPaid')} className="px-4 py-3 cursor-pointer transition-colors text-right">
                          <div className="flex items-center justify-end gap-1">Paid {perfSortField === 'totalPaid' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}</div>
                        </th>
                        <th onClick={() => handleSort('outstanding')} className="px-4 py-3 cursor-pointer transition-colors text-right">
                          <div className="flex items-center justify-end gap-1">Outstanding {perfSortField === 'outstanding' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}</div>
                        </th>
                        <th onClick={() => handleSort('recoveryRate')} className="px-4 py-3 cursor-pointer transition-colors text-center">
                          <div className="flex items-center justify-center gap-1">Recovery {perfSortField === 'recoveryRate' && <span>{perfSortOrder === 'asc' ? '▲' : '▼'}</span>}</div>
                        </th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {processedPerfPanels.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">
                            No client records match the criteria
                          </td>
                        </tr>
                      ) : (
                        processedPerfPanels.map((p, idx) => {
                          const statusCfg = {
                            Excellent: { bg: 'bg-emerald-100 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-500/30', dot: 'bg-emerald-500' },
                            Healthy: { bg: 'bg-indigo-100 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-300 dark:border-indigo-500/30', dot: 'bg-indigo-500' },
                            'Needs Attention': { bg: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-500/30', dot: 'bg-amber-500' },
                            'Critically Inactive': { bg: 'bg-red-100 dark:bg-red-500/15', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-500/30', dot: 'bg-red-500' },
                          };
                          const catCfg = {
                            Algo: 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/20',
                            Sop: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20',
                            crypto: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/20',
                          };
                          const s = statusCfg[p.status] || statusCfg['Critically Inactive'];
                          return (
                            <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 text-center font-mono text-slate-400 dark:text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                                <Link to={`/dashboard/panels?search=${encodeURIComponent(p.panelName)}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                  {p.panelName}
                                </Link>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide border ${catCfg[p.category || 'Algo'] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'}`}>
                                  {p.category || 'Algo'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">₹{p.totalBilled.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-green-500 dark:text-green-400">₹{p.totalPaid.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold">
                                {p.outstanding > 0 ? (
                                  <button onClick={() => handleViewUnpaid(p._id, p.panelName, p.outstanding)} className="text-red-500 dark:text-red-400 hover:underline hover:text-red-600 transition-colors">
                                    ₹{p.outstanding.toLocaleString()}
                                  </button>
                                ) : (
                                  <span className={p.outstanding < 0 ? 'text-green-500 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
                                    ₹{p.outstanding.toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{p.recoveryRate}%</span>
                                  <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${p.recoveryRate >= 90 ? 'bg-emerald-500' : p.recoveryRate >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(p.recoveryRate, 100)}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold border ${s.bg} ${s.text} ${s.border}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`}></span>{p.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Table Footer */}
                {processedPerfPanels.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">Showing {processedPerfPanels.length} of {panelStatsArray.length} total clients</span>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
                      <span className="text-slate-400">Billed: <span className="text-slate-900 dark:text-white font-mono">₹{processedPerfPanels.reduce((s, p) => s + p.totalBilled, 0).toLocaleString()}</span></span>
                      <span className="text-slate-400">Collected: <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{processedPerfPanels.reduce((s, p) => s + p.totalPaid, 0).toLocaleString()}</span></span>
                      <span className="text-slate-400">Outstanding: <span className="text-rose-600 dark:text-rose-400 font-mono">₹{processedPerfPanels.reduce((s, p) => s + p.outstanding, 0).toLocaleString()}</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side Card: Recent Transactions */}
            <div className="xl:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full flex flex-col max-h-[900px]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h3 className="font-extrabold text-[14px] tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" /> Recent Activity
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Latest collections recorded</p>
                </div>
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                  {filteredPayments
                    .filter(p => (p.amountReceived || 0) > 0)
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 10)
                    .map(p => {
                      const typeStyles = {
                        'License': 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
                        'IP Charges': 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
                        'Maintenance': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 dark:border-fuchsia-500/20',
                      };
                      const type = p.paymentType === 'IP' ? 'IP Charges' : (p.paymentType || 'Other');
                      const tStyle = typeStyles[type] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';

                      return (
                        <div key={p._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-colors bg-white dark:bg-slate-800/40 flex flex-col gap-2 shadow-sm group">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                              {p.panelId?.panelName || 'Unknown Panel'}
                            </div>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs shrink-0">+₹{p.amountReceived?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${tStyle}`}>{type}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(p.timestamp).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                      );
                    })}
                  {filteredPayments.filter(p => (p.amountReceived || 0) > 0).length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-slate-400 font-semibold">No recent transactions</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>



          {/* Transparency & Mathematical Breakdown Modal */}
          {modalInfo && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 !mt-0">
              {/* Backdrop */}
              <div
                onClick={() => setModalInfo(null)}
                className="fixed inset-0 bg-black/85 backdrop-blur-md"
              ></div>

              {/* Modal Container */}
              <div className="relative w-full max-w-md rounded-3xl glass-card border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Info className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">{modalInfo.title}</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 uppercase font-extrabold tracking-wider">Calculation Breakdown</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalInfo(null)}
                    className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Formula Block */}
                <div className="rounded-2xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-300/80 dark:border-slate-800/80 p-4 font-mono text-[10px] text-slate-700 dark:text-slate-300 space-y-2.5 shadow-inner">
                  <span className="text-[9px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Formula Model</span>
                  <div className="text-emerald-500 dark:text-emerald-400 font-bold text-xs select-all whitespace-pre-wrap leading-relaxed">
                    {modalInfo.formula || 'Value = Sum of Category Invoices'}
                  </div>
                </div>

                {/* Breakdown Content */}
                <div className="space-y-3.5">
                  <span className="text-[9px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-wider block">Itemized Values</span>
                  <div className="space-y-3">
                    {modalInfo.breakdown?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                        <span className={`font-mono font-bold ${item.color || 'text-slate-900 dark:text-white'}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2">
                  <button
                    onClick={() => setModalInfo(null)}
                    className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs py-3.5 transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
                  >
                    Close Breakdown
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Unpaid Bills Modal */}
          {unpaidModal.isOpen && createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 !mt-0">
              <div onClick={() => setUnpaidModal({ isOpen: false, panelName: '', loading: false, bills: [] })} className="fixed inset-0 bg-black/85 backdrop-blur-md"></div>
              <div className="relative w-full max-w-lg rounded-3xl glass-card border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[16px] font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-500" /> Pending Bills
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{unpaidModal.panelName}</p>
                  </div>
                  <button onClick={() => setUnpaidModal({ isOpen: false, panelName: '', loading: false, bills: [] })} className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                  {unpaidModal.loading ? (
                    <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold animate-pulse">Loading pending bills...</div>
                  ) : unpaidModal.bills.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">No pending bills found.</div>
                  ) : (
                    unpaidModal.bills.map(bill => {
                      const remaining = (bill.billAmount || 0) - (bill.billDiscount || 0) - (bill.paidAmount || 0);
                      if (remaining <= 0) return null;
                      return (
                        <div key={bill._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{bill.paymentType || 'Other'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(bill.timestamp).toLocaleDateString('en-GB')}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-bold text-red-500">₹{remaining.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">Total: ₹{(bill.billAmount || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>


    </>
  );
}