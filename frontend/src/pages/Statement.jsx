import { useState, useEffect, useMemo, useRef } from 'react';
import { apiRequest } from '@/utils/api';
import {
  Landmark,
  Search,
  Calendar,
  ArrowUpDown,
  Printer,
  FileText,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  Check,
  BadgeCheck,
} from 'lucide-react';

// Helper to format date and time beautifully
const formatDateTime = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, '0');

  return `${day}/${month}/${year}, ${hoursStr}:${minutes} ${ampm}`;
};

// ---------------------------------------------------------------------------
// Searchable client combobox — replaces the native <select>
// Styled to match the app's existing filter inputs (see Payments page)
// ---------------------------------------------------------------------------
function ClientCombobox({ panels, panelsLoading, selectedPanelId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selectedPanel = panels.find((p) => p._id === selectedPanelId);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return panels;
    const q = query.toLowerCase();
    return panels.filter(
      (p) =>
        p.panelName?.toLowerCase().includes(q) ||
        p.ownerName?.toLowerCase().includes(q)
    );
  }, [panels, query]);

  return (
    <div className="relative" ref={wrapRef}>
      <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
        Client
      </span>
      <button
        type="button"
        disabled={panelsLoading}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 min-w-[220px] max-w-[280px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-left disabled:opacity-50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      >
        {panelsLoading ? (
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ) : (
          <>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                {selectedPanel ? selectedPanel.panelName : 'Select client'}
              </span>
              {selectedPanel && (
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedPanel.ownerName}
                  {selectedPanel.status === 'Stopped' ? ' · Stopped' : ''}
                </span>
              )}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && !panelsLoading && (
        <div className="absolute z-30 mt-2 w-80 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client or owner name..."
              className="flex-1 bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching clients
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected = p._id === selectedPanelId;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      onSelect(p._id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                      }`}
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                        {p.panelName}
                        {p.status === 'Stopped' && (
                          <span className="ml-1.5 text-[9px] font-semibold text-rose-500 uppercase">(stopped)</span>
                        )}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">{p.ownerName}</span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

    const chronologicalPayments = [...payments].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const rows = [];
    let runningBalance = -(panel.openingBalance || 0);

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

    chronologicalPayments.forEach((p) => {
      const isSystemCredit = p.bankName === 'System Credit' ||
        (p.bankName && p.bankName.toLowerCase().trim() === 'system credit') ||
        (p.remark && p.remark.toLowerCase().includes('system credit'));

      const dateStr = formatDateTime(p.timestamp);

      if (p.billAmount > 0) {
        const netBill = p.billAmount - (p.billDiscount || 0);
        runningBalance -= netBill;
        rows.push({
          id: p._id,
          date: dateStr,
          timestamp: new Date(p.timestamp),
          description: ` ${p?.quantity ? p.quantity : ""} ${p.paymentType} Bill Generated`,
          type: 'Debit',
          debit: netBill,
          credit: 0,
          balance: runningBalance,
          remark: p.billDiscount > 0 ? `Discount: ₹${p.billDiscount}` : ``,
          paymentMode: p.paymentMode,
        });
      } else if (p.amountReceived > 0 && !isSystemCredit) {
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

  const filteredAndSortedRows = useMemo(() => {
    let result = [...statementRows];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (row) =>
          row.description.toLowerCase().includes(q) ||
          (row.remark && row.remark.toLowerCase().includes(q))
      );
    }

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

    if (sortOrder === 'desc') {
      result.reverse();
    }

    return result;
  }, [statementRows, searchQuery, startDate, endDate, sortOrder]);

  const selectedPanel = panels.find((p) => p._id === selectedPanelId);

  const aggregates = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    filteredAndSortedRows.forEach((r) => {
      if (r.id === 'opening-bal') return;
      totalDebit += r.debit;
      totalCredit += r.credit;
    });

    return { totalDebit, totalCredit };
  }, [filteredAndSortedRows]);

  const currentBal = statementRows[statementRows.length - 1]?.balance || 0;
  const isOverallCredit = currentBal >= 0;

  const handlePrint = () => {
    let settings = {
      orgName: 'Deepmind Infotech',
      contactEmail: 'billing@deepmindinfotech.com',
      supportPhone: '+91 9876543210',
    };
    try {
      const saved = localStorage.getItem('app_system_settings');
      if (saved) settings = JSON.parse(saved);
    } catch (e) {

    }

    const oldFrame = document.getElementById('passbook-print-iframe');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'passbook-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;

    const rowsHtml = filteredAndSortedRows.map((r, idx) => {
      const displayIdx = sortOrder === 'asc' ? idx + 1 : filteredAndSortedRows.length - idx;
      return `
        <tr>
          <td style="text-align: center; border-bottom: 1px dashed #e2e8f0; padding: 8px;">${displayIdx}</td>
          <td style="border-bottom: 1px dashed #e2e8f0; padding: 8px; white-space: nowrap;">${r.date}</td>
          <td style="border-bottom: 1px dashed #e2e8f0; padding: 8px;">
            <strong style="color: #1e293b;">${r.description}</strong>
            ${r.remark ? `<br/><span style="font-size: 9px; color: #64748b;">${r.remark}</span>` : ''}
          </td>
          <td style="text-align: right; color: #b91c1c; font-weight: bold; border-bottom: 1px dashed #e2e8f0; padding: 8px;">
            ${r.debit > 0 ? `-₹${r.debit.toLocaleString()}` : '-'}
          </td>
          <td style="text-align: right; color: #15803d; font-weight: bold; border-bottom: 1px dashed #e2e8f0; padding: 8px;">
            ${r.credit > 0 ? `+₹${r.credit.toLocaleString()}` : '-'}
          </td>
          <td style="text-align: right; font-weight: bold; border-bottom: 1px dashed #e2e8f0; padding: 8px;">
            ₹${Math.abs(r.balance).toLocaleString()}
            <span style="font-size: 8px; font-weight: bold; color: ${r.balance >= 0 ? '#15803d' : '#b91c1c'}">
              ${r.balance >= 0 ? 'CR' : 'DR'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const statementPeriod = (startDate || endDate)
      ? `${startDate ? new Date(startDate).toLocaleDateString() : 'Beginning'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'Present'}`
      : 'All Time';

    const netBalance = Math.abs(currentBal).toLocaleString();
    const balanceSign = currentBal >= 0 ? 'Credit (Jama)' : 'Debit (Dues)';

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Bank Statement - ${selectedPanel?.panelName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; font-size: 11px; background: #fff; }
            .header-bar { height: 8px; background-color: #4f46e5; margin-bottom: 20px; border-radius: 4px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #0f172a; }
            .header .subtitle { font-size: 9px; font-weight: 800; color: #4f46e5; margin-top: 6px; letter-spacing: 2px; text-transform: uppercase; }
            table.summary-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
            table.summary-table td { border: none; padding: 0; vertical-align: top; }
            table.statement-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            table.statement-table th { background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #475569; font-weight: 700; font-size: 9px; padding: 10px 8px; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
            table.statement-table td { padding: 10px 8px; border-bottom: 1px dashed #e2e8f0; vertical-align: top; }
            .totals-row { background-color: #f8fafc; border-top: 2px solid #cbd5e1; font-weight: 800; font-size: 11px; }
            .footer { text-align: center; margin-top: 50px; font-size: 9px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 20px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="header-bar"></div>
          <div class="header">
            <h1>${settings.orgName.toUpperCase()}</h1>
            <div class="subtitle">Official Account Statement Passbook</div>
          </div>

          <table class="summary-table">
            <tr>
              <td style="width: 50%; line-height: 1.7;">
                <span style="font-size: 10px; font-weight: 800; color: #4f46e5; display: block; margin-bottom: 5px; text-transform: uppercase;">Client Details</span>
                <span style="font-size: 13px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 3px;">${selectedPanel?.panelName}</span>
                <strong>Owner:</strong> ${selectedPanel?.ownerName}<br/>
                <strong>Phone:</strong> +${selectedPanel?.phoneNumber || '-'}<br/>
                <strong>Email:</strong> ${selectedPanel?.ownerEmail || '-'}
                ${selectedPanel?.gstNumber ? `<br/><strong>GSTIN:</strong> ${selectedPanel.gstNumber}` : ''}
              </td>
              <td style="width: 50%; text-align: right; line-height: 1.7;">
                <span style="font-size: 10px; font-weight: 800; color: #4f46e5; display: block; margin-bottom: 5px; text-transform: uppercase;">Statement Summary</span>
                <strong>Period:</strong> ${statementPeriod}<br/>
                <strong>Date Printed:</strong> ${new Date().toLocaleString('en-IN')}<br/>
                <strong>Total Debits (Bills):</strong> ₹${aggregates.totalDebit.toLocaleString()}<br/>
                <strong>Total Credits (Deposits):</strong> ₹${aggregates.totalCredit.toLocaleString()}<br/>
                <span style="font-size: 12px; font-weight: 800; color: ${currentBal >= 0 ? '#15803d' : '#b91c1c'}">
                  Net Balance: ₹${netBalance} ${balanceSign}
                </span>
              </td>
            </tr>
          </table>

          <table class="statement-table">
            <thead>
              <tr>
                <th style="width: 6%; text-align: center;">S.No.</th>
                <th style="width: 22%;">Transaction Date</th>
                <th style="width: 36%;">Transaction Particulars</th>
                <th style="width: 12%; text-align: right;">Debit (Bills)</th>
                <th style="width: 12%; text-align: right;">Credit (Deposit)</th>
                <th style="width: 12%; text-align: right;">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="totals-row">
                <td colspan="3" style="border: none; padding: 12px 8px;">STATEMENT PERIOD TOTALS:</td>
                <td style="text-align: right; border: none; padding: 12px 8px; color: #b91c1c;">-₹${aggregates.totalDebit.toLocaleString()}</td>
                <td style="text-align: right; border: none; padding: 12px 8px; color: #15803d;">+₹${aggregates.totalCredit.toLocaleString()}</td>
                <td style="text-align: right; border: none; padding: 12px 8px; color: ${currentBal >= 0 ? '#15803d' : '#b91c1c'}">₹${netBalance}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            This is an official system-generated transaction passbook ledger statement for panel software licenses and services.
            <br/>Verified by Deepmind Infotech Systems &bull; Page 1 of 1 &bull; Thank you for your business!
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 400);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header — matches the plain title-left / actions-right pattern used on Payments */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">Passbook</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Statement ledger of deposits, bills, and running balance.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {panelData && (
            <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${isOverallCredit
              ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'
              }`}>
              <BadgeCheck className="h-3.5 w-3.5" />
              {isOverallCredit ? 'Account in Credit' : 'Dues Outstanding'}
            </span>
          )}
          <button
            onClick={handlePrint}
            disabled={!panelData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-500" />
            <span>Print Passbook</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <ClientCombobox
            panels={panels}
            panelsLoading={panelsLoading}
            selectedPanelId={selectedPanelId}
            onSelect={setSelectedPanelId}
          />

          <div>
            <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Statement Period
            </span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 text-xs font-semibold w-[105px] scheme-dark cursor-pointer"
              />
              <span className="text-slate-400 text-xs font-bold px-1">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 text-xs font-semibold w-[105px] scheme-dark cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Search Entries
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search particulars..."
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 pl-8 pr-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none transition-all shadow-sm w-[190px]"
              />
            </div>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-sm"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-500" />
            <span>{sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}</span>
          </button>

          {(startDate || endDate || searchQuery) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-2 py-2"
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
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-6 text-rose-600 dark:text-rose-400 flex items-start gap-4 shadow-sm">
          <AlertCircle className="h-6 w-6 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Ledger Synchronization Failed</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : panelData ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-emerald-500 shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Deposits (Jama)</h4>
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">₹{aggregates.totalCredit.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-rose-500 shadow-sm p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-500/20 shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Bills (Debits)</h4>
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">₹{aggregates.totalDebit.toLocaleString()}</p>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 shadow-sm p-4 flex items-center gap-3 ${isOverallCredit ? 'border-l-indigo-500' : 'border-l-amber-500'
              }`}>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center border shrink-0 ${isOverallCredit
                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                }`}>
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ledger Balance</h4>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">₹{Math.abs(currentBal).toLocaleString()}</p>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${isOverallCredit
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                    {isOverallCredit ? 'CR (Advance)' : 'DR (Dues)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statement ledger table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden print:border-none print:shadow-none">

            {/* Print-only header */}
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
                  <p><strong>Net Balance:</strong> ₹{Math.abs(currentBal).toLocaleString()} {isOverallCredit ? 'Credit (Jama)' : 'Debit (Dues)'}</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left font-mono min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider select-none text-[10px]">
                    <th className="px-5 py-3.5 w-14 text-center">S.No.</th>
                    <th className="px-5 py-3.5 w-44">Date</th>
                    <th className="px-5 py-3.5">Transaction Particulars</th>
                    <th className="px-5 py-3.5 text-right w-36">Debit (Bills)</th>
                    <th className="px-5 py-3.5 text-right w-36">Credit (Deposit)</th>
                    <th className="px-5 py-3.5 text-right w-44">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-slate-200 dark:divide-slate-800">
                  {filteredAndSortedRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
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
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isOpening ? 'bg-slate-50/70 dark:bg-slate-800/30' : ''
                            }`}
                        >
                          <td className="px-5 py-3.5 text-center font-bold text-slate-400 dark:text-slate-500">{displayIdx}</td>
                          <td className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{row.date}</td>

                          <td className="px-5 py-3.5 space-y-1 max-w-sm font-sans">
                            <span className={`font-bold block text-[13px] ${row.type === 'Credit'
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

                          <td className={`px-5 py-3.5 text-right font-bold text-[12px] whitespace-nowrap ${row.debit > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-300 dark:text-slate-700'
                            }`}>
                            {row.debit > 0 ? `-₹${row.debit.toLocaleString()}` : '-'}
                          </td>

                          <td className={`px-5 py-3.5 text-right font-bold text-[12px] whitespace-nowrap ${row.credit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-700'
                            }`}>
                            {row.credit > 0 ? `+₹${row.credit.toLocaleString()}` : '-'}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <span className={`font-bold text-[12px] ${row.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              ₹{Math.abs(row.balance).toLocaleString()}
                            </span>
                            <span className={`ml-1.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${row.balance >= 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                              }`}>
                              {row.balance >= 0 ? 'Cr' : 'Dr'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand totals footer */}
            <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold select-none">
              <span className="font-sans">Grand Totals (Statement Actions):</span>
              <div className="flex flex-wrap items-center gap-6">
                <span>Total Bills: <span className="text-rose-600 dark:text-rose-400 font-black">₹{aggregates.totalDebit.toLocaleString()}</span></span>
                <span>Total Cash Deposits: <span className="text-emerald-700 dark:text-emerald-400 font-black">₹{aggregates.totalCredit.toLocaleString()}</span></span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="h-64 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-center p-6 space-y-2 opacity-70">
          <FileText className="h-10 w-10 text-slate-400" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Please select a client to view their passbook</p>
        </div>
      )}
    </div>
  );
}