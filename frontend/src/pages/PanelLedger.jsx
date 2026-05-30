import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '@/utils/api';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Layers,
  Phone,
  Mail,
  User as UserIcon,
  AlertCircle,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Printer,
} from 'lucide-react';
import ReceiptModal from '@/components/ReceiptModal';

/* ─── Charge Type Badge ─────────────────────────────────────────────────── */
const CHARGE_TYPE_STYLES = {
  License: {
    dot: 'bg-indigo-500',
    badge: 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-800 border-indigo-300',
    badgeSm: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  'IP Charges': {
    dot: 'bg-violet-500',
    badge: 'bg-gradient-to-br from-violet-50 to-violet-100 text-violet-800 border-violet-300',
    badgeSm: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  Maintenance: {
    dot: 'bg-amber-500',
    badge: 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 border-amber-300',
    badgeSm: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'Setup Cost': {
    dot: 'bg-teal-500',
    badge: 'bg-gradient-to-br from-teal-50 to-teal-100 text-teal-800 border-teal-300',
    badgeSm: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

const ChargeTypeBadge = ({ type, size = 'md' }) => {
  const style = CHARGE_TYPE_STYLES[type] || {
    dot: 'bg-emerald-500',
    badge: 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-300',
    badgeSm: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border font-bold ${style.badgeSm}`}>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`}></span>
        {type}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${style.badge}`}>
      <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`}></span>
      {type}
    </span>
  );
};
/* ─────────────────────────────────────────────────────────────────────────── */

const PanelLedgerSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {/* Top action header skeleton */}
    <div className="flex items-center justify-between pb-2">
      <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    </div>

    {/* Top Balances & Client Info Grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Client Info */}
      <div className="rounded-2xl glass-card border border-slate-300 dark:border-slate-800 p-6 flex flex-col justify-between h-48">
        <div>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-300/80 dark:border-slate-800/80">
            <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-44 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>

      {/* Card 2: Default Client Rates */}
      <div className="rounded-2xl glass-card border border-slate-300 dark:border-slate-800 p-6 flex flex-col justify-between h-48">
        <div className="space-y-3">
          <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="space-y-2 pt-1">
            <div className="flex justify-between"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div></div>
            <div className="flex justify-between"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div><div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div></div>
            <div className="flex justify-between"><div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div><div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div></div>
          </div>
        </div>
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded mt-2"></div>
      </div>

      {/* Card 3: Total Collected */}
      <div className="rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 p-6 flex flex-col justify-between h-48">
        <div className="space-y-2">
          <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>

      {/* Card 4: Total Outstanding */}
      <div className="rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 p-6 flex flex-col justify-between h-48">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>
    </div>

    {/* Full Width Ledger Transactions Table Card skeleton */}
    <div className="rounded-2xl glass-card border border-slate-300 dark:border-slate-800 overflow-hidden">
      <div className="p-5 border-b border-slate-300/80 dark:border-slate-800/80 flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
          <div className="h-3.5 w-72 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-7 gap-4 pb-3 border-b border-slate-300 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-500 font-bold uppercase">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1"></div>
        </div>
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className="grid grid-cols-7 gap-4 items-center py-2">
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded col-span-1 w-8 mx-auto"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1"></div>
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg col-span-1 w-20"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1"></div>
            <div className="space-y-1.5 col-span-2">
              <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded col-span-1 w-24"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function PanelLedger() {
  const navigate = useNavigate();
  const { id: panelId } = useParams();

  const [panel, setPanel] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'excel'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  const [filterType, setFilterType] = useState('all'); // 'all', 'bill', 'received'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredPayments = payments.filter((p) => {
    // Filter by Type
    if (filterType === 'bill' && !(p.billAmount > 0)) return false;
    if (filterType === 'received' && !(p.amountReceived > 0)) return false;

    // Filter by Date
    if (startDate) {
      const pDate = new Date(p.timestamp);
      const [year, month, day] = startDate.split('-').map(Number);
      const sDate = new Date(year, month - 1, day);
      sDate.setHours(0, 0, 0, 0);
      if (pDate < sDate) return false;
    }
    if (endDate) {
      const pDate = new Date(p.timestamp);
      const [year, month, day] = endDate.split('-').map(Number);
      const eDate = new Date(year, month - 1, day);
      eDate.setHours(23, 59, 59, 999);
      if (pDate > eDate) return false;
    }

    return true;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchPanelDetails = async () => {
      try {
        setLoading(true);
        const data = await apiRequest(`/panels/${panelId}`);
        if (data.success) {
          setPanel(data.panel);
          setPayments(data.payments);
        }
      } catch (err) {
        setError(err.message || 'Failed to load panel details');
      } finally {
        setLoading(false);
      }
    };

    if (panelId) {
      fetchPanelDetails();
    }
  }, [panelId]);

  if (loading) {
    return <PanelLedgerSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Panels
        </button>
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-6 text-rose-400 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">Failed to Sync Ledger</h3>
            <p className="text-sm text-rose-400/80 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const calculatedTotalBill = payments.reduce((sum, p) => sum + (p.billAmount || 0), 0);

  const getLast30DaysData = () => {
    const data = [];
    const sortedPayments = [...(payments || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedPayments.forEach((p, pIndex) => {
      const dateStr = new Date(p.timestamp).toLocaleDateString();
      data.push({
        id: p._id || `${dateStr}-${pIndex}`,
        date: dateStr,
        displayDate: dateStr,
        paymentType: p.paymentType,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        billAmount: p.billAmount || 0,
        billDiscount: p.billDiscount || 0,
        amountReceived: p.amountReceived || 0,
        paymentDiscount: p.paymentDiscount || 0,
        remark: p.remark || '-',
        addedBy: p.addedBy?.name || 'Staff User',
        hasData: true,
        originalPayment: p,
      });
    });
    return data;
  };

  return (
    <div className="space-y-8">
      {/* Top action header / Breadcrumbs and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/dashboard/panels')}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-350 text-slate-600 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Panels</span>
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight flex flex-wrap items-center gap-2.5 mt-1">
            <span>Client Ledger Account</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200 font-bold">
              ID: #{panel?._id?.substring(18).toUpperCase()}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200 px-3 py-2 rounded-xl w-fit sm:self-end">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-bold">Verified Account Status</span>
        </div>
      </div>

      {/* Top Balances & Client Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Client Info */}
        <div className="rounded-2xl bg-white border border-slate-200 border-l-4 border-l-slate-400 p-5 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-indigo-500/5 blur-xl"></div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-150 shrink-0">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{panel?.panelName}</h3>
                <p className="text-[9px] text-indigo-600 uppercase font-extrabold tracking-wider mt-0.5">Panel Client</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-semibold">{panel?.ownerName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium text-slate-600 dark:text-slate-400" title={panel?.ownerEmail}>{panel?.ownerEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-600 dark:text-slate-400">{panel?.phoneNumber}</span>
              </div>
            </div>
          </div>
          {panel?.openingBalance > 0 && (
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Opening Bal:</span>
              <span className="font-extrabold text-amber-700 font-mono">₹{panel?.openingBalance?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Card 2: Total Generated Bills */}
        <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 border-l-4 border-l-indigo-500 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-indigo-500/5 blur-xl"></div>
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-700">Total Bill Amount</span>
            <p className="text-[10px] text-indigo-500/80 mt-0.5 font-medium leading-normal">Sum of all bills generated for this client</p>
          </div>
          <div className="mt-5">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-display tracking-tight">₹{calculatedTotalBill?.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Total Received */}
        <div className="rounded-2xl bg-emerald-50/40 border border-emerald-100 border-l-4 border-l-emerald-500 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-emerald-500/5 blur-xl"></div>
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-700">Total Amount Received</span>
            <p className="text-[10px] text-emerald-500/80 mt-0.5 font-medium leading-normal">Total payments successfully collected</p>
          </div>
          <div className="mt-5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-display tracking-tight">₹{panel?.totalPaid?.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 4: Remaining Balance */}
        <div className={`rounded-2xl border p-5 flex flex-col justify-between shadow-sm relative overflow-hidden hover:shadow-md transition-all duration-300 ${(panel?.outstanding || 0) > 0
          ? 'bg-rose-50/40 border-rose-100 border-l-4 border-l-rose-500'
          : (panel?.outstanding || 0) < 0
            ? 'bg-emerald-50/40 border-emerald-100 border-l-4 border-l-emerald-500'
            : 'bg-slate-50 border-slate-200 border-l-4 border-l-slate-400'
          }`}>
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-slate-500/5 blur-xl"></div>
          <div>
            <span className={`text-xs uppercase tracking-wider font-extrabold ${(panel?.outstanding || 0) > 0
              ? 'text-rose-700'
              : (panel?.outstanding || 0) < 0
                ? 'text-emerald-700'
                : 'text-slate-700'
              }`}>
              {(panel?.outstanding || 0) < 0 ? 'Advance Credit Balance' : 'Remaining Balance Due'}
            </span>
            <p className={`text-[10px] mt-0.5 font-medium leading-normal ${(panel?.outstanding || 0) > 0
              ? 'text-rose-500'
              : (panel?.outstanding || 0) < 0
                ? 'text-emerald-500'
                : 'text-slate-500'
              }`}>
              {(panel?.outstanding || 0) < 0 ? 'Extra amount paid by client in advance' : 'Remaining outstanding dues pending collection'}
            </p>
          </div>
          <div className="mt-5">
            <span className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight ${(panel?.outstanding || 0) > 0
              ? 'text-rose-600'
              : (panel?.outstanding || 0) < 0
                ? 'text-emerald-600'
                : 'text-slate-700'
              }`}>
              {(panel?.outstanding || 0) < 0
                ? `₹${Math.abs(panel.outstanding).toLocaleString()} `
                : `₹${(panel?.outstanding || 0).toLocaleString()}`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Full Width Ledger Transactions Table Card */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 w-full">
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="shrink-0">
            <h3 className="font-extrabold text-slate-900 text-base font-display">Ledger Transactions</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-relaxed">Toggle between standard list and date-wise Excel view</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:justify-end flex-1">
            {/* Standard vs Excel Tab Switcher */}
            <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === 'list'
                  ? 'bg-[#0A2540] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Standard List
              </button>
              <button
                onClick={() => setActiveTab('excel')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${activeTab === 'excel'
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Excel View
              </button>
            </div>

            {/* Filters (Only visible when activeTab === 'list') */}
            {activeTab === 'list' && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Transaction Type Dropdown Filter */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Type:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="premium-input px-3 py-1.5 text-xs font-semibold cursor-pointer border-slate-200 rounded-lg focus:ring-indigo-500"
                  >
                    <option value="all">All Transactions</option>
                    <option value="bill">Bills Only</option>
                    <option value="received">Payments Only</option>
                  </select>
                </div>

                {/* Date Range Inputs */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shrink-0 shadow-sm">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-slate-800 focus:outline-none cursor-pointer text-xs font-semibold [color-scheme:light]"
                  />
                  <span className="text-slate-400 font-bold text-[10px] uppercase">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-slate-800 focus:outline-none cursor-pointer text-xs font-semibold [color-scheme:light]"
                  />
                </div>

                {/* Reset Filters Button */}
                {(startDate || endDate || filterType !== 'all') && (
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[10px] uppercase font-bold tracking-wider text-rose-600 hover:text-white transition-all bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-transparent px-3.5 py-1.5 rounded-xl shrink-0 shadow-sm"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            {activeTab === 'excel' && (
              <button
                onClick={() => setIsFullscreen(true)}
                title="View Fullscreen Spreadsheet"
                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-250 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5 text-xs font-bold shrink-0"
              >
                <Maximize2 className="h-4 w-4" />
                <span>Fullscreen</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] sm:text-xs uppercase font-bold tracking-wider">
                  <th className="px-2 sm:px-4 py-3 sm:py-4 text-center w-10 sm:w-14">S.No</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Transaction Date</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Charges Type</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Mode</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Billing & Payment</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredPayments.map((p, index) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-2 sm:px-4 py-3 sm:py-4 text-center font-bold text-slate-400 text-xs">
                      {index + 1}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-800">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 whitespace-nowrap">{new Date(p.timestamp).toLocaleDateString()}</span>
                        <span className="hidden sm:inline text-xs text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <ChargeTypeBadge type={p.paymentType} size="md" />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-700">
                      {p.amountReceived > 0 ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
                          <span className="whitespace-nowrap">{p.paymentMode}</span>
                          {p.bankName && <span className="hidden sm:inline text-xs text-slate-400 font-bold bg-slate-50 border border-slate-150 px-1 py-0.5 rounded">({p.bankName})</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold font-mono">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-col gap-1.5">
                        {p.billAmount > 0 ? (
                          <>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-500 font-medium">Bill:</span>
                              <span className="font-bold text-slate-800">₹{p.billAmount?.toLocaleString()}</span>
                            </div>
                            {p.amountReceived > 0 && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-medium text-xs">Paid:</span>
                                <span className={`font-extrabold text-xs sm:text-sm ${p.amountReceived < p.billAmount
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                                  }`}>
                                  ₹{p.amountReceived?.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {p.amountReceived === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 w-fit whitespace-nowrap">
                                Outstanding / Credit Only
                              </span>
                            ) : p.amountReceived < p.billAmount ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 w-fit whitespace-nowrap">
                                Partial (₹{(p.billAmount - p.amountReceived).toLocaleString()} due)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 w-fit">
                                Fully Paid
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 font-medium text-xs">Paid:</span>
                              <span className="font-extrabold text-slate-800 text-xs sm:text-sm">₹{p.amountReceived?.toLocaleString()}</span>
                            </div>
                            {p.amountReceived > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 w-fit">
                                Direct Payment
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 w-fit">
                                No Amount
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-700 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400 shrink-0" />
                        <span className="text-xs sm:text-sm">{p.addedBy?.name || 'Staff User'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400 font-medium">
                      No transactions found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 text-[11px] font-mono">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded">Sheet1</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold">Transaction Ledger</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400">Formula Bar: <span className="text-indigo-600 dark:text-indigo-400 font-bold">f(x)</span> = Outstanding = SUM(E - F) - SUM(G + H)</span>
            </div>

            <table className="w-full text-left border border-slate-200 dark:border-slate-800 font-mono text-[11px] md:text-[13px] border-collapse bg-white dark:bg-slate-900 min-w-[760px]">
              <thead>
                <tr className="text-white border-b-2 border-slate-300 dark:border-slate-800 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-[#0A2540] dark:bg-indigo-950">
                  <th className="border-r border-slate-300 dark:border-slate-800 text-center bg-[#071e33] dark:bg-slate-900 py-2.5 w-10">#</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 w-24">Date</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 w-28">Type</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-center w-14">Qty</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right w-20">Rate</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right w-28">Bill Amount</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right w-24">Bill Disc.</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right w-24">Amt Paid</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right w-24">Pay Disc.</th>
                  <th className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right w-24">Net Due</th>
                  <th className="px-3 py-2.5">Remarks / Note</th>
                </tr>
              </thead>
              <tbody>
                {getLast30DaysData().map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-200 dark:border-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors ${row.hasData
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold text-slate-900 dark:text-slate-100'
                      : idx % 2 === 0
                        ? 'bg-slate-50/50 dark:bg-slate-900/30'
                        : 'bg-white dark:bg-slate-900/20'
                      }`}
                  >
                    <td className="border-r border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 py-2 font-bold w-10">
                      {idx + 2}
                    </td>
                    <td className="border-r border-slate-200 dark:border-slate-800 px-3 py-2 text-slate-700 dark:text-slate-300 w-24 font-medium whitespace-nowrap">
                      {row.displayDate}
                    </td>
                    <td className="border-r border-slate-200 px-2 py-2 w-28">
                      {row.paymentType !== '-' ? (
                        <ChargeTypeBadge type={row.paymentType} size="sm" />
                      ) : '-'}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-1.5 text-center w-16 text-slate-600 font-medium">
                      {row.quantity}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-1.5 text-right w-20 text-slate-600 font-mono font-medium">
                      {row.unitPrice !== '-' ? `₹${row.unitPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-bold w-28 ${row.billAmount > 0 ? 'text-amber-700 bg-amber-50/50' : 'text-slate-400'}`}>
                      ₹{row.billAmount.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-bold w-28 ${row.billDiscount > 0 ? 'text-orange-700 bg-orange-50/50' : 'text-slate-400'}`}>
                      ₹{row.billDiscount.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-bold w-24 ${row.amountReceived > 0 ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-400'}`}>
                      ₹{row.amountReceived.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-bold w-24 ${row.paymentDiscount > 0 ? 'text-rose-700 bg-rose-50/50' : 'text-slate-400'}`}>
                      ₹{row.paymentDiscount.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-3 py-1.5 text-right font-bold w-24 ${(row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount) > 0 ? 'text-rose-700 bg-rose-50/50' : 'text-slate-400'}`}>
                      ₹{((row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount)).toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400 text-slate-700 truncate max-w-xs font-semibold" title={`${row.remark} (by ${row.addedBy})`}>
                      {row.remark !== '-' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-800 dark:text-slate-200">{row.remark}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.2 rounded shrink-0">({row.addedBy})</span>
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}

                {/* Excel Sheet Summary Row (Formulas) */}
                <tr className="bg-slate-150 bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs">
                  <td className="border-r border-slate-200 text-center text-slate-400 bg-slate-100 py-2.5 font-bold">
                    {getLast30DaysData().length + 2}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2.5 uppercase tracking-wider text-slate-500 text-[9px] font-bold" colSpan="5">
                    =SUM(E2:E{getLast30DaysData().length + 1}) - SUM(F2:F{getLast30DaysData().length + 1}) - SUM(G2:G{getLast30DaysData().length + 1}) - SUM(H2:H{getLast30DaysData().length + 1})
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2.5 text-right text-amber-700 bg-amber-50">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.billAmount, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2.5 text-right text-orange-700 bg-orange-50">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.billDiscount, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2.5 text-right text-emerald-700 bg-emerald-50">
                    ₹{getLast30DaysData().reduce((sum, r) => r.originalPayment?.bankName === 'System Credit' ? sum : sum + r.amountReceived, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-200 px-3 py-2.5 text-right text-rose-700 bg-rose-50">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.paymentDiscount, 0).toLocaleString()}
                  </td>
                  {(() => {
                    const netVal = getLast30DaysData().reduce((sum, r) => sum + (r.billAmount - r.billDiscount) - (r.originalPayment?.bankName === 'System Credit' ? 0 : r.amountReceived) - r.paymentDiscount, 0);
                    return (
                      <td className={`border-r border-slate-200 px-3 py-2.5 text-right font-bold transition-all ${netVal > 0
                        ? 'text-rose-700 bg-rose-50'
                        : netVal < 0
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-slate-500 bg-slate-50'
                        }`}>
                        {netVal < 0 ? `₹${Math.abs(netVal).toLocaleString()}` : `₹${netVal.toLocaleString()}`}
                      </td>
                    );
                  })()}
                  <td className="px-3 py-2.5 text-indigo-700 font-bold italic text-[11px]">
                    Total Ledger Activity Summary
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fullscreen Spreadsheet Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col p-6 overflow-hidden">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <span>{panel?.panelName}</span>
                  <span className="text-[10px] bg-emerald-55 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full font-mono uppercase font-extrabold tracking-wider">Spreadsheet Mode</span>
                </h2>
                <p className="text-xs text-slate-500 font-mono font-medium">Date-wise Ledger Account • Today to Last 30 Days (Press Esc to close)</p>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-rose-600 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 duration-200"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Exit Fullscreen</span>
            </button>
          </div>

          {/* Formula bar in Fullscreen */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded">Sheet1</span>
              <span className="text-slate-550 text-slate-600 font-semibold">Transaction Ledger</span>
            </div>
            <span className="text-slate-500">Formula Bar: <span className="text-indigo-600 font-bold">f(x)</span> = Outstanding = SUM(E - F) - SUM(G + H)</span>
          </div>

          {/* Table Container wrapped in scrollable flex-1 */}
          <div className="flex-1 overflow-auto border border-slate-200 rounded-xl bg-white shadow-inner">
            <table className="w-full text-left border border-slate-200 font-mono text-xs md:text-[13px] border-collapse">
              <thead>
                {/* <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 text-center text-[10px] sticky top-0 z-10">
                  <th className="border-r border-slate-200 py-1 w-12 bg-slate-50"></th>
                  <th className="border-r border-slate-200 py-1 w-28 bg-slate-50">A</th>
                  <th className="border-r border-slate-200 py-1 w-32 bg-slate-50">B</th>
                  <th className="border-r border-slate-200 py-1 w-20 bg-slate-50">C</th>
                  <th className="border-r border-slate-200 py-1 w-24 bg-slate-50">D</th>
                  <th className="border-r border-slate-200 py-1 w-36 bg-slate-50">E</th>
                  <th className="border-r border-slate-200 py-1 w-36 bg-slate-50">F</th>
                  <th className="border-r border-slate-200 py-1 w-32 bg-slate-50">G</th>
                  <th className="border-r border-slate-200 py-1 w-32 bg-slate-50">H</th>
                  <th className="border-r border-slate-200 py-1 w-32 bg-slate-50">I</th>
                  <th className="py-1 bg-slate-50">J</th>
                </tr> */}
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-xs md:text-[13px] sticky top-[22px] z-10">
                  <th className="border-r border-slate-200 text-center text-slate-500 bg-slate-100 py-2 w-12">#</th>
                  <th className="border-r border-slate-200 px-4 py-2 w-28 bg-slate-100">Date</th>
                  <th className="border-r border-slate-200 px-4 py-2 w-32 bg-slate-100">Type</th>
                  <th className="border-r border-slate-200 px-4 py-2 text-center w-20 bg-slate-100">Qty</th>
                  <th className="border-r border-slate-200 px-4 py-2 text-right w-24 bg-slate-100">Rate</th>
                  <th className="border-r border-slate-200 px-4 py-2 text-right w-36 bg-slate-100">Bill Amount</th>
                  <th className="border-r border-slate-200 px-4 py-2 text-right w-32 bg-slate-100">Bill Discount</th>
                  <th className="border-r border-slate-200 px-4 py-2 text-right w-32 bg-slate-100">Amt Paid</th>
                  <th className="border-r border-slate-200 px-4 py-2 text-right w-32 bg-slate-100">Pay Discount</th>
                  <th className="border-r border-slate-200 px-4 py-2 text-right w-32 bg-slate-100">Net Due</th>
                  <th className="px-4 py-2 bg-slate-100">Remarks / Note</th>
                </tr>
              </thead>
              <tbody>
                {getLast30DaysData().map((row, idx) => (
                  <tr
                    key={`fs-${row.id}`}
                    className={`border-b border-slate-200 hover:bg-slate-50/80 transition-colors ${row.hasData
                      ? 'bg-indigo-50/30 font-semibold text-slate-900'
                      : idx % 2 === 0
                        ? 'bg-slate-50/40'
                        : 'bg-white'
                      }`}
                  >
                    <td className="border-r border-slate-200 text-center text-slate-400 bg-slate-50 py-2 font-bold w-12">
                      {idx + 2}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-2 text-slate-600 dark:text-slate-400 w-28 font-medium">
                      {row.displayDate}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-2 w-32">
                      {row.paymentType !== '-' ? (
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${row.paymentType === 'License'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : row.paymentType === 'IP Charges'
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                          {row.paymentType}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-2 text-center w-20 text-slate-600 font-medium">
                      {row.quantity}
                    </td>
                    <td className="border-r border-slate-200 px-4 py-2 text-right w-24 text-slate-600 font-mono font-medium">
                      {row.unitPrice !== '-' ? `₹${row.unitPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className={`border-r border-slate-200 px-4 py-2 text-right font-bold w-36 ${row.billAmount > 0 ? 'text-amber-700 bg-amber-50/50' : 'text-slate-400'}`}>
                      ₹{row.billAmount.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-4 py-2 text-right font-bold w-36 ${row.billDiscount > 0 ? 'text-orange-700 bg-orange-50/50' : 'text-slate-400'}`}>
                      ₹{row.billDiscount.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-4 py-2 text-right font-bold w-32 ${row.amountReceived > 0 ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-400'}`}>
                      ₹{row.amountReceived.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-4 py-2 text-right font-bold w-32 ${row.paymentDiscount > 0 ? 'text-rose-700 bg-rose-50/50' : 'text-slate-400'}`}>
                      ₹{row.paymentDiscount.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-200 px-4 py-2 text-right font-bold w-32 ${(row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount) > 0 ? 'text-rose-700 bg-rose-50/50' : 'text-slate-400'}`}>
                      ₹{((row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount)).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400 truncate max-w-sm font-semibold" title={`${row.remark} (by ${row.addedBy})`}>
                      {row.remark !== '-' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-800 dark:text-slate-200">{row.remark}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.2 rounded shrink-0">({row.addedBy})</span>
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}

                {/* Excel Summary row in Fullscreen */}
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900 text-xs sticky bottom-0 z-20">
                  <td className="border-r border-slate-200 text-center text-slate-400 bg-slate-100 py-3 w-12 font-bold">
                    {getLast30DaysData().length + 2}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 uppercase tracking-wider text-slate-500 text-xs bg-slate-100 font-bold" colSpan="5">
                    =SUM(E2:E{getLast30DaysData().length + 1}) - SUM(F2:F{getLast30DaysData().length + 1}) - SUM(G2:G{getLast30DaysData().length + 1}) - SUM(H2:H{getLast30DaysData().length + 1})
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 text-right text-amber-700 bg-amber-50">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.billAmount, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 text-right text-orange-700 bg-orange-50">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.billDiscount, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 text-right text-emerald-700 bg-emerald-50">
                    ₹{getLast30DaysData().reduce((sum, r) => r.originalPayment?.bankName === 'System Credit' ? sum : sum + r.amountReceived, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-200 px-4 py-3 text-right text-rose-700 bg-rose-50">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.paymentDiscount, 0).toLocaleString()}
                  </td>
                  {(() => {
                    const netVal = getLast30DaysData().reduce((sum, r) => sum + (r.billAmount - r.billDiscount) - (r.originalPayment?.bankName === 'System Credit' ? 0 : r.amountReceived) - r.paymentDiscount, 0);
                    return (
                      <td className={`border-r border-slate-200 px-4 py-3 text-right font-bold transition-all ${netVal > 0
                        ? 'text-rose-700 bg-rose-50'
                        : netVal < 0
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-slate-500 bg-slate-50'
                        }`}>
                        {netVal < 0 ? `₹${Math.abs(netVal).toLocaleString()}` : `₹${netVal.toLocaleString()}`}
                      </td>
                    );
                  })()}
                  <td className="px-4 py-3 text-indigo-700 font-bold italic text-xs bg-slate-100">
                    Total Ledger Activity Summary
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reusable Receipt Preview Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptPayment}
        onClose={() => setSelectedReceiptPayment(null)}
        payment={selectedReceiptPayment}
      />
    </div>
  );
}
