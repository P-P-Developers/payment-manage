'use client';

import { useState, useEffect } from 'react';
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
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Other Bank / UPI'
];

export default function PaymentsManagement() {
  const [payments, setPayments] = useState([]);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [paymentType, setPaymentType] = useState('License');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [bankName, setBankName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState('');

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
    setQuantity(1);
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
      if (!amountReceived || Number(amountReceived) <= 0) {
        setError('Please enter a valid amount.');
        return;
      }
      if (paymentMode !== 'Cash' && !bankName) {
        setError('Please select a bank name.');
        return;
      }

      const payload = {
        panelId: selectedPanelId,
        paymentType,
        amountReceived: Number(amountReceived),
        paymentMode,
        bankName: paymentMode !== 'Cash' ? bankName : '',
        quantity: (paymentType === 'License' || paymentType === 'IP Charges') ? Number(quantity) : 1,
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

  // Export to Excel/CSV completely client side with beautiful encoding and download trigger
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch full un-paginated payments list for a complete ledger download
      const exportData = await apiRequest('/payments?limit=all');
      if (!exportData.success) {
        throw new Error('Could not sync complete database list for export.');
      }

      const headers = ['Transaction Date', 'Panel Client', 'Payment Type', 'Quantity', 'Payment Mode', 'Bank Name', 'Received Dues', 'Collected By', 'Remarks'];
      const rows = exportData.payments.map((p) => [
        new Date(p.timestamp).toLocaleDateString(),
        p.panelId?.panelName || 'Unknown Panel',
        p.paymentType,
        p.quantity || 1,
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
    return (
      panelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.paymentMode.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by panel name or payment mode..."
          className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input"
        />
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
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Panel Client</th>
                  <th className="px-6 py-4">Payment Type</th>
                  <th className="px-6 py-4">Dues Collected</th>
                  <th className="px-6 py-4">Collected By</th>
                  <th className="px-6 py-4">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/20 transition-colors">
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
                          className={`inline-flex px-2.5 py-0.5 rounded text-xs font-semibold ${
                            p.paymentType === 'License'
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
                        {(p.paymentType === 'License' || p.paymentType === 'IP Charges') && p.quantity && (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Qty: {p.quantity}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-base">₹{p.amountReceived?.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 uppercase">
                          <CreditCard className="h-3.5 w-3.5" />
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
                    <td colSpan="6" className="text-center py-8 text-slate-400">
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
                    <option value="" disabled>-- Select a Client --</option>
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
                    placeholder="e.g. 15000"
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold text-white text-base"
                    required
                    min="1"
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

              {/* Row 3: Bank Name & Quantity (Rendered side-by-side if either/both exist) */}
              {((paymentType === 'License' || paymentType === 'IP Charges') || paymentMode !== 'Cash') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMode !== 'Cash' ? (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Select Receiving Bank
                      </label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white cursor-pointer"
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
                  ) : (
                    <div className="hidden md:block"></div>
                  )}

                  {(paymentType === 'License' || paymentType === 'IP Charges') ? (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5 text-slate-500" />
                        <span>Purchase Quantity</span>
                      </label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="1"
                        className="w-full rounded-xl px-4 py-3 text-sm glass-input text-white"
                        required
                        min="1"
                      />
                    </div>
                  ) : (
                    <div className="hidden md:block"></div>
                  )}
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
