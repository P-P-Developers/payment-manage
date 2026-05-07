import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '@/utils/api';
import {
  CircleDollarSign,
  Plus,
  Search,
  FileSpreadsheet,
  X,
  Check,
  AlertCircle,
  Calendar,
  Layers,
  CreditCard,
  User,
  MessageSquare,
  Hash,
} from 'lucide-react';

const BANK_LIST = [
  'HDFC Bank',
  'Indian Bank'
];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Dropdown Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (panels.length > 0) {
      const panelId = searchParams.get('panelId');
      const openModal = searchParams.get('openModal');
      if (panelId) {
        setSelectedPanelId(panelId);
        const panel = panels.find((p) => p._id === panelId);
        if (panel) {
          setUnitPrice(panel.licenseCharges || 0);
        }
        if (openModal === 'true') {
          setQuantity(0);
          setPaymentMode('UPI');
          setBankName('HDFC Bank');
          setPaymentType('License');
          setAmountReceived('');
          setRemark('');
          setIsModalOpen(true);
          setSearchParams({});
        }
      }
    }
  }, [panels, searchParams, setSearchParams]);

  // Form Fields
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [paymentType, setPaymentType] = useState('License');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [bankName, setBankName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (selectedPanelId) {
      const panel = panels.find((p) => p._id === selectedPanelId);
      if (panel) {
        if (paymentType === 'License') {
          setUnitPrice(panel.licenseCharges || 0);
        } else if (paymentType === 'IP Charges') {
          setUnitPrice(panel.ipCharges || 0);
        } else if (paymentType === 'Maintenance') {
          setUnitPrice(panel.maintenanceCharges || 0);
        } else {
          setUnitPrice(0);
        }
      }
    } else {
      setUnitPrice(0);
    }
  }, [selectedPanelId, paymentType, panels]);

  const fetchPaymentsAndPanels = async (page = currentPage) => {
    try {
      setLoading(true);
      const [paymentsData, panelsData] = await Promise.all([
        apiRequest(`/payments?page=${page}&limit=10`),
        apiRequest('/panels'),
      ]);

      if (paymentsData.success) {
        setPayments(paymentsData.payments);
        setTotalPages(paymentsData.pages || 1);
        setTotalPaymentsCount(paymentsData.total || 0);
      }
      if (panelsData.success) setPanels(panelsData.panels);
    } catch (err) {
      setError(err.message || 'Failed to fetch transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndPanels(currentPage);
  }, [currentPage]);

  const handleOpenAddModal = () => {
    setSelectedPanelId(''); // Default to empty to force user selection
    setPaymentType('License');
    setAmountReceived('');
    setPaymentMode('UPI');
    setBankName('HDFC Bank'); // Set a sensible default bank
    setQuantity(0);
    setUnitPrice(0);
    setRemark('');
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!selectedPanelId) {
        setError('Please select a panel.');
        return;
      }
      const finalAmountReceived = amountReceived !== '' && amountReceived !== undefined ? Number(amountReceived) : 0;
      if (finalAmountReceived < 0) {
        setError('Amount received cannot be negative.');
        return;
      }
      if (paymentMode !== 'Cash' && finalAmountReceived > 0 && !bankName) {
        setError('Please select a bank name.');
        return;
      }

      const isRechargeType = paymentType === 'License' || paymentType === 'IP Charges';
      const finalQuantity = isRechargeType ? (quantity === '' ? 0 : Number(quantity)) : 0;
      const finalUnitPrice = isRechargeType ? (Number(unitPrice) || 0) : 0;
      const calculatedBillAmount = isRechargeType ? (finalUnitPrice * finalQuantity) : 0;

      const payload = {
        panelId: selectedPanelId,
        paymentType,
        amountReceived: finalAmountReceived,
        paymentMode,
        bankName: (paymentMode !== 'Cash' && finalAmountReceived > 0) ? bankName : '',
        quantity: finalQuantity,
        unitPrice: finalUnitPrice,
        billAmount: calculatedBillAmount,
        remark,
      };

      const data = await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setSuccess('Payment collected successfully and saved in ledger!');
        setCurrentPage(1); // Reset to page 1 to see the newest payment
        fetchPaymentsAndPanels(1);
        setIsModalOpen(false);
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      setError('');

      const exportData = await apiRequest('/payments?limit=all');
      if (!exportData.success) {
        throw new Error('Could not sync complete database list for export.');
      }

      const headers = ['Transaction Date', 'Panel Client', 'Payment Type', 'Quantity', 'Payment Mode', 'Bank Name', 'Received Dues', 'Collected By', 'Remarks'];
      const rows = exportData.payments.map((p) => [
        new Date(p.timestamp).toLocaleDateString(),
        p.panelId?.panelName || 'Unknown Panel',
        p.paymentType,
        p.quantity !== undefined && p.quantity !== null ? p.quantity : 1,
        p.paymentMode,
        p.bankName || 'N/A',
        p.amountReceived,
        p.addedBy?.name || 'Staff User',
        p.remark || 'N/A',
      ]);

      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += [headers.join(','), ...rows.map((e) => e.map(val => `"${val}"`).join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Panel_Sales_Ledger_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to generate excel file.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const panelName = p.panelId?.panelName || '';
    const matchesSearch = panelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || p.paymentType === typeFilter;
    const matchesMode = modeFilter === 'All' || p.paymentMode === modeFilter;
    return matchesSearch && matchesType && matchesMode;
  });

  const selectedPanelDetails = panels.find((p) => p._id === selectedPanelId);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Ledger Collections (Payments)</h2>
          <p className="text-sm text-slate-400">Receive client subscription payments, issue receipt entries, and export transaction records.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white font-semibold px-4 py-3 text-sm border border-slate-700 transition-all shadow-md"
            title="Download CSV file for MS Excel"
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            <span>Export to Excel</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 text-sm transition-all shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Receive Payment</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 flex items-start gap-2 text-sm">
          <Check className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400 flex items-start gap-2 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by panel client name..."
            className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          {/* Payment Type Filter */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-all"
            >
              <option value="All" className="bg-slate-900">All Charges Types</option>
              <option value="License" className="bg-slate-900">License Charges</option>
              <option value="IP Charges" className="bg-slate-900">IP Charges</option>
              <option value="Maintenance" className="bg-slate-900">Maintenance Support</option>
              <option value="Other" className="bg-slate-900">Other Charges</option>
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div className="flex-1 sm:flex-initial">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-all"
            >
              <option value="All" className="bg-slate-900">All Modes</option>
              <option value="UPI" className="bg-slate-900">UPI Transfer</option>
              <option value="Cash" className="bg-slate-900">Cash Receipt</option>
              <option value="Bank Transfer" className="bg-slate-900">Bank Transfer</option>
              <option value="Online" className="bg-slate-900">Online Gateway</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments table */}
      {loading && payments.length === 0 ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-slate-400 font-medium">Loading ledger transactions...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                  <th className="px-4 py-4 text-center">S.No</th>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Panel Client</th>
                  <th className="px-6 py-4">Payment Type</th>
                  <th className="px-6 py-4">Billing & Payment</th>
                  <th className="px-6 py-4">Collected By</th>
                  <th className="px-6 py-4">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredPayments.map((p, index) => (
                  <tr key={p._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold text-slate-400">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-500">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <Layers className="h-4 w-4 text-slate-500" />
                        <span>{p.panelId?.panelName || 'Deleted Panel'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded text-xs font-semibold ${p.paymentType === 'License'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : p.paymentType === 'IP Charges'
                              ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                              : p.paymentType === 'Maintenance'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                        >
                          {p.paymentType}
                        </span>
                        {(p.paymentType === 'License' || p.paymentType === 'IP Charges') && (p.quantity !== undefined && p.quantity !== null) && (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Qty: {p.quantity}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {p.billAmount > 0 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Bill:</span>
                              <span className="font-semibold text-slate-300">₹{p.billAmount?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Paid:</span>
                              <span className={`font-bold text-base ${p.amountReceived === 0
                                ? 'text-rose-400'
                                : p.amountReceived < p.billAmount
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                                }`}>
                                ₹{p.amountReceived?.toLocaleString()}
                              </span>
                            </div>
                            {p.amountReceived === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                                Outstanding / Credit Only
                              </span>
                            ) : p.amountReceived < p.billAmount ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
                                Partially Paid (₹{(p.billAmount - p.amountReceived).toLocaleString()} due)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                                Fully Paid
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 font-medium">Paid:</span>
                              <span className="font-bold text-white text-base">₹{p.amountReceived?.toLocaleString()}</span>
                            </div>
                            {p.amountReceived > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                                Direct Payment
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20 w-fit">
                                No Amount
                              </span>
                            )}
                          </>
                        )}
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                          <CreditCard className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                          {p.paymentMode} {p.bankName && `(${p.bankName})`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{p.addedBy?.name || 'Staff User'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">
                      {p.remark ? (
                        <div className="flex items-center gap-1.5" title={p.remark}>
                          <MessageSquare className="h-4 w-4 text-slate-500 shrink-0" />
                          <span>{p.remark}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-slate-400 font-medium">
              Showing <span className="font-bold text-indigo-400">{filteredPayments.length}</span> of{' '}
              <span className="font-bold text-white">{totalPaymentsCount}</span> ledger entries
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 px-3.5 py-2 font-semibold transition-colors border border-slate-700"
              >
                Previous
              </button>
              <span className="text-slate-400 font-bold px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 px-3.5 py-2 font-semibold transition-colors border border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIVE PAYMENT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-3xl rounded-2xl glass-card p-6 md:p-8 border border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Receive Panel Payment</h3>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              {/* Row 1: Select Panel & Amount Received */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Panel (Client)
                  </label>
                  <select
                    value={selectedPanelId}
                    onChange={(e) => setSelectedPanelId(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white cursor-pointer"
                    required
                  >
                    <option className="bg-slate-900 text-white py-2" value="" disabled>-- Select a Client --</option>
                    {panels.map((p) => (
                      <option key={p._id} value={p._id} className="bg-slate-900 text-white py-2">
                        {p.panelName} ({p.ownerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="e.g. 15000 (Leave empty or 0 if credit)"
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold text-white text-base"
                    min="0"
                  />
                </div>
              </div>

              {/* Outstanding dues alert box */}
              {selectedPanelDetails && (
                <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-400">Client Owner:</p>
                    <p className="font-bold text-white text-sm mt-0.5">{selectedPanelDetails.ownerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400">Ledger Outstanding Dues:</p>
                    <p className="font-bold text-rose-400 text-sm mt-0.5">₹{selectedPanelDetails.outstanding?.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Row 2: Payment Type & Payment Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Payment Type
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white cursor-pointer"
                    required
                  >
                    <option value="License" className="bg-slate-900 text-white">License Charges</option>
                    <option value="IP Charges" className="bg-slate-900 text-white">IP Charges</option>
                    <option value="Maintenance" className="bg-slate-900 text-white">Maintenance Support</option>
                    <option value="Other" className="bg-slate-900 text-white">Other Charges</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white cursor-pointer"
                    required
                  >
                    <option value="UPI" className="bg-slate-900 text-white">UPI Transfer</option>
                    <option value="Cash" className="bg-slate-900 text-white">Cash Receipt</option>
                    <option value="Bank Transfer" className="bg-slate-900 text-white">Bank Transfer</option>
                    <option value="Online" className="bg-slate-900 text-white">Online Gateway</option>
                  </select>
                </div>
              </div>

              {/* Recharge Billing & Price Calculator */}
              {(paymentType === 'License' || paymentType === 'IP Charges') && (
                <div className="rounded-xl bg-indigo-500/5 p-4 border border-indigo-500/10 space-y-3">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Recharge Billing & Price Calculator</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Unit Price (₹) (Editable)
                      </label>
                      <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="w-full rounded-xl px-3.5 py-2.5 text-xs glass-input text-white font-bold"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Purchase Quantity
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full rounded-xl px-3.5 py-2.5 text-xs glass-input text-white font-bold"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                        Calculated Bill Amount (₹)
                      </label>
                      <div className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-900 border border-slate-800 text-emerald-400 font-bold flex items-center justify-between">
                        <span>₹</span>
                        <span>{(Number(unitPrice || 0) * (quantity === '' ? 0 : Number(quantity))).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Receiving Bank Row */}
              {paymentMode !== 'Cash' && Number(amountReceived || 0) > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Select Receiving Bank
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white cursor-pointer font-medium"
                    required
                  >
                    <option value="" disabled>-- Select Receiving Bank --</option>
                    {BANK_LIST.map((bank) => (
                      <option key={bank} value={bank} className="bg-slate-900 text-white">
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row 4: Remarks */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Remarks / Description
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Insert payment notes..."
                  className="w-full rounded-xl px-4 py-3 text-sm glass-input h-14 resize-none"
                />
              </div>

              {/* Row 5: Action buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-600 transition-all duration-300"
                >
                  Confirm Payment Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
