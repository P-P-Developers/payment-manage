import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/utils/api';
import {
  Landmark,
  Search,
  Calendar,
  ArrowUpDown,
  Printer,
  Download,
  FileText,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

// Helper to format date and time beautifully
const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `${month}/${day}/${year}, ${hoursStr}:${minutes} ${ampm}`;
};

export default function Statement() {
  const [panels, setPanels] = useState([]);
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [panelData, setPanelData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [panelsLoading, setPanelsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters and Sorting
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // default chronological oldest-first
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const data = await apiRequest('/panels');
        if (data.success) {
          setPanels(data.panels || []);
          if (data.panels && data.panels.length > 0) {
            setSelectedPanelId(data.panels[0]._id);
          }
        }
      } catch (err) {
        setError('Failed to fetch panel clients');
      } finally {
        setPanelsLoading(false);
      }
    };
    fetchPanels();
  }, []);

  useEffect(() => {
    if (!selectedPanelId) return;

    const fetchStatement = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest(`/panels/${selectedPanelId}`);
        if (data.success) {
          setPanelData(data);
        } else {
          setError(data.message || 'Failed to fetch statement data');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch statement data');
      } finally {
        setLoading(false);
      }
    };

    fetchStatement();
  }, [selectedPanelId]);

  // Compute the bank-style statement list with running balance
  const statementRows = useMemo(() => {
    if (!panelData || !panelData.panel) return [];

    const panel = panelData.panel;
    const payments = panelData.payments || [];

    // Sort payments oldest first to compute running balance correctly
    const chronologicalPayments = [...payments].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const rows = [];
    let runningBalance = -(panel.openingBalance || 0); // negative means outstanding, positive means credit

    // 1. Add Opening Balance Row if present
    if (panel.openingBalance !== undefined) {
      rows.push({
        id: 'opening-bal',
        date: formatDateTime(panel.createdAt || Date.now()),
        timestamp: new Date(panel.createdAt || Date.now()),
        description: 'Opening Balance Account Setup',
        type: 'Info',
        debit: panel.openingBalance > 0 ? panel.openingBalance : 0,
        credit: panel.openingBalance < 0 ? Math.abs(panel.openingBalance) : 0,
        balance: runningBalance,
        remark: panel.openingBalance > 0 ? 'Dues Outstanding at Setup' : 'Credit Balance at Setup',
      });
    }

    // 2. Add transaction records
    chronologicalPayments.forEach((p) => {
      const isSystemCredit = p.bankName === 'System Credit' ||
        (p.bankName && p.bankName.toLowerCase().trim() === 'system credit') ||
        (p.remark && p.remark.toLowerCase().includes('system credit'));

      const dateStr = formatDateTime(p.timestamp);

      if (p.billAmount > 0) {
        // It's a bill (Debit / Invoice)
        const netBill = p.billAmount - (p.billDiscount || 0);
        runningBalance -= netBill;

        rows.push({
          id: p._id,
          date: dateStr,
          timestamp: new Date(p.timestamp),
          description: `${p.paymentType} Bill Generated`,
          type: 'Debit',
          debit: netBill,
          credit: 0,
          balance: runningBalance,
          remark: p.billDiscount > 0 ? `Discount: ₹${p.billDiscount} | Status: ${p.status}` : `Status: ${p.status}`,
          paymentMode: p.paymentMode,
        });
      } else if (p.amountReceived > 0 && !isSystemCredit) {
        // It's a real cash/online deposit (Credit)
        const netDeposit = p.amountReceived + (p.paymentDiscount || 0);
        runningBalance += netDeposit;

        rows.push({
          id: p._id,
          date: dateStr,
          timestamp: new Date(p.timestamp),
          description: p.paymentType === 'Advance' ? 'Advance Credit Deposit' : `${p.paymentType} Payment Received`,
          type: 'Credit',
          debit: 0,
          credit: netDeposit,
          balance: runningBalance,
          remark: p.paymentDiscount > 0 ? `Discount: ₹${p.paymentDiscount} | Via ${p.paymentMode}` : `Via ${p.paymentMode} ${p.bankName ? `(${p.bankName})` : ''}`,
          paymentMode: p.paymentMode,
          bankName: p.bankName,
        });
      }
    });

    return rows;
  }, [panelData]);

  // Apply filters and sort order to statement rows
  const filteredAndSortedRows = useMemo(() => {
    let result = [...statementRows];

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.description.toLowerCase().includes(q) ||
          (row.remark && row.remark.toLowerCase().includes(q))
      );
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter((row) => new Date(row.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((row) => new Date(row.timestamp) <= end);
    }

    // Sort order (default ascending chronological, optionally descending)
    if (sortOrder === 'desc') {
      result.reverse();
    }

    return result;
  }, [statementRows, searchQuery, startDate, endDate, sortOrder]);

  const handlePrint = () => {
    window.print();
  };

  const selectedPanel = panels.find((p) => p._id === selectedPanelId);

  // Compute total aggregates of filtered results
  const aggregates = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    // Filtered statement rows (excluding Opening Balance for deposits/withdrawals sum)
    filteredAndSortedRows.forEach((r) => {
      if (r.id === 'opening-bal') return;
      totalDebit += r.debit;
      totalCredit += r.credit;
    });

    return { totalDebit, totalCredit };
  }, [filteredAndSortedRows]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-500/20 shadow-sm">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">Statement Passbook</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Real-time ledger bank statement of deposits, debits, and credit balances.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            disabled={!panelData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-500" />
            <span>Print Passbook</span>
          </button>
        </div>
      </div>

      {/* Selector and Filter Horizontal Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-lg">

        {/* Left Side: Selectors & Dates */}
        <div className="flex flex-wrap items-center gap-4">

          {/* Panel Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Client:</span>
            {panelsLoading ? (
              <div className="h-9 w-40 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
            ) : (
              <select
                value={selectedPanelId}
                onChange={(e) => setSelectedPanelId(e.target.value)}
                className="rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer shadow-sm"
              >
                {panels.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.panelName} ({p.ownerName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date filters */}
          <div className="flex items-center gap-2 border border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="text-slate-550 dark:text-slate-400 text-[10px] uppercase font-extrabold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 font-bold w-[110px] scheme-dark"
            />
          </div>

          <div className="flex items-center gap-2 border border-slate-150 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span className="text-slate-550 dark:text-slate-400 text-[10px] uppercase font-extrabold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 font-bold w-[110px] scheme-dark"
            />
          </div>

        </div>

        {/* Right Side: Search and Sort */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search particulars..."
              className="rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-8 pr-3 py-1.5 text-xs font-semibold focus:border-indigo-500 focus:outline-none transition-all shadow-inner w-[160px]"
            />
          </div>

          {/* Sort button */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all shadow-sm active:scale-[0.98]"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
            <span>{sortOrder === 'asc' ? 'Oldest' : 'Newest'}</span>
          </button>

          {(startDate || endDate || searchQuery) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-1"
            >
              Reset
            </button>
          )}
        </div>

      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-slate-600 dark:text-slate-400 font-semibold animate-pulse">Syncing Bank Statement...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-6 text-rose-600 flex items-start gap-4 shadow-md">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Ledger Synchronization Failed</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : panelData ? (
        <>
          {/* Statement Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Aggregate Credit (Jama) */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-emerald-50/50 dark:from-emerald-950/20 via-white dark:via-slate-900 to-white dark:to-slate-900 p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Deposits (Jama)</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Total fresh funds deposited</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">₹{aggregates.totalCredit.toLocaleString()}</p>
            </div>

            {/* Aggregate Debit (Kharch) */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-red-50/30 dark:from-red-950/20 via-white dark:via-slate-900 to-white dark:to-slate-900 p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">Total Invoices (Debits)</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Total period billed charges</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">₹{aggregates.totalDebit.toLocaleString()}</p>
            </div>

            {/* Net Running Account Balance */}
            {(() => {
              const currentBal = statementRows[statementRows.length - 1]?.balance || 0;
              const isCredit = currentBal >= 0;
              return (
                <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b ${isCredit ? 'from-emerald-50/50 dark:from-emerald-950/20' : 'from-rose-50/40 dark:from-rose-950/20'} via-white dark:via-slate-900 to-white dark:to-slate-900 p-6 shadow-md relative overflow-hidden`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 ${isCredit ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {isCredit ? 'Net Account Credit (Jama)' : 'Net Outstanding Balance (Lena Baki)'}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Current passbook net balance</p>
                    </div>
                    <div className={`h-9 w-9 rounded-xl ${isCredit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'} flex items-center justify-center`}>
                      <Landmark className="h-5 w-5" />
                    </div>
                  </div>
                  <p className={`text-2xl font-black ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} tracking-tight`}>
                    ₹{Math.abs(currentBal).toLocaleString()}
                  </p>
                </div>
              );
            })()}
          </div>

          {/* Statement passbook list table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden print:border-none print:shadow-none">

            {/* Statement Header for Print */}
            <div className="hidden print:block p-6 border-b border-slate-300 space-y-3 font-mono">
              <h2 className="text-center text-xl font-bold uppercase tracking-widest">Bank Statement Passbook Ledger</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p><strong>Client Panel:</strong> {selectedPanel?.panelName}</p>
                  <p><strong>Owner Name:</strong> {selectedPanel?.ownerName}</p>
                  <p><strong>Phone Number:</strong> {selectedPanel?.phoneNumber || '-'}</p>
                </div>
                <div className="text-right">
                  <p><strong>Date Printed:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Net Balance:</strong> ₹{Math.abs(statementRows[statementRows.length - 1]?.balance || 0).toLocaleString()} {(statementRows[statementRows.length - 1]?.balance || 0) >= 0 ? 'Credit (Jama)' : 'Debit (Dues)'}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left font-mono">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-350 text-slate-700 uppercase font-black tracking-wider select-none text-[11px]">
                    <th className="px-5 py-3.5 w-14 text-center">S.No.</th>
                    <th className="px-5 py-3.5 w-44">Date</th>
                    <th className="px-5 py-3.5">Transaction Details</th>
                    <th className="px-5 py-3.5 text-right w-36 text-rose-750 dark:text-rose-300 bg-rose-50/40 dark:bg-rose-950/30">Debit (Bills)</th>
                    <th className="px-5 py-3.5 text-right w-36 text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/30">Credit (Deposit)</th>
                    <th className="px-5 py-3.5 text-right w-44 text-slate-800 dark:text-slate-200 bg-slate-100/60 dark:bg-slate-900/60">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAndSortedRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/50">
                        No passbook entries match the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedRows.map((row, idx) => {
                      const isOpening = row.id === 'opening-bal';
                      const displayIdx = sortOrder === 'asc' ? idx + 1 : filteredAndSortedRows.length - idx;

                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-slate-50/50 transition-colors ${isOpening ? 'bg-slate-50 font-bold' : ''
                            }`}
                        >
                          <td className="px-5 py-4 text-center font-bold text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-950/20 w-14">{displayIdx}</td>
                          <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.date}</td>

                          <td className="px-5 py-4 space-y-1 max-w-sm">
                            <span className={`font-bold block text-sm ${row.type === 'Credit'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : row.type === 'Debit'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-800 dark:text-slate-200'
                              }`}>
                              {row.description}
                            </span>
                            {row.remark && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">{row.remark}</span>
                            )}
                          </td>

                          {/* Debit (Bill) */}
                          <td className={`px-5 py-4 text-right font-bold text-sm whitespace-nowrap ${row.debit > 0 ? 'text-red-600 bg-red-50/50 dark:text-rose-400 dark:bg-rose-950/20' : 'text-slate-350 dark:text-slate-600'}`}>
                            {row.debit > 0 ? `-₹${row.debit.toLocaleString()}` : '-'}
                          </td>

                          {/* Credit (Deposit) */}
                          <td className={`px-5 py-4 text-right font-bold text-sm whitespace-nowrap ${row.credit > 0 ? 'text-emerald-600 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-950/20' : 'text-slate-350 dark:text-slate-600'}`}>
                            {row.credit > 0 ? `+₹${row.credit.toLocaleString()}` : '-'}
                          </td>

                          {/* Running Balance */}
                          <td className={`px-5 py-4 text-right font-bold text-sm whitespace-nowrap ${row.balance >= 0 ? 'text-emerald-600 bg-emerald-50/30 dark:text-emerald-400 dark:bg-emerald-950/10' : 'text-red-600 bg-red-50/30 dark:text-rose-400 dark:bg-rose-950/10'
                            }`}>
                            ₹{Math.abs(row.balance).toLocaleString()}{' '}
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ml-1 ${row.balance >= 0 ? 'bg-emerald-500/20 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-red-500/20 text-red-800 dark:bg-rose-500/20 dark:text-rose-350'
                              }`}>
                              {row.balance >= 0 ? 'Cr (Jama)' : 'Dr (Dues)'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand Aggregates Footer */}
            <div className="bg-slate-100 dark:bg-slate-950 border-t border-slate-350 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold select-none">
              <span>Grand Totals (Statement Actions):</span>
              <div className="flex flex-wrap items-center gap-6">
                <span>Total Bills: <span className="text-rose-600 dark:text-rose-400 font-black">₹{aggregates.totalDebit.toLocaleString()}</span></span>
                <span>Total Cash Deposits: <span className="text-emerald-700 dark:text-emerald-450 font-black">₹{aggregates.totalCredit.toLocaleString()}</span></span>
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="h-64 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-6 space-y-2 opacity-70">
          <FileText className="h-10 w-10 text-slate-400" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Please select a panel to view statement passbook</p>
        </div>
      )}

    </div>
  );
}
