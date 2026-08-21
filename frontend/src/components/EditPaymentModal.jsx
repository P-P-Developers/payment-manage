import React, { useState, useEffect } from 'react';
import { apiRequest, getLoggedUser } from '@/utils/api';
import { X } from 'lucide-react';

const FALLBACK_BANK_LIST = [
  'Union Bank',
  'Indian Bank'
];

export default function EditPaymentModal({ isOpen, onClose, onSuccess, paymentId, payment }) {
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    paymentType: '',
    amountReceived: '',
    paymentMode: '',
    bankName: '',
    quantity: '',
    unitPrice: '',
    billAmount: '',
    billDiscount: '',
    paymentDiscount: '',
    remark: '',
    timestamp: '',
    isGstApplied: false,
  });
  const [banks, setBanks] = useState(FALLBACK_BANK_LIST);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = getLoggedUser();
    if (user && user.email) {
      setUserEmail(user.email);
    }
    fetchBanks();
  }, []);

  useEffect(() => {
    if (isOpen && paymentId && !payment) {
      fetchPaymentData();
    } else if (isOpen && payment) {
      initForm(payment);
    }
  }, [isOpen, paymentId, payment]);

  const fetchBanks = async () => {
    try {
      const data = await apiRequest('/banks');
      if (data.success) {
        setBanks(data.banks.map(b => b.name));
      }
    } catch (err) {
      console.log('Failed to load banks list:', err);
    }
  };

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/payments/${paymentId}`);
      if (data.success) {
        initForm(data.payment);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to fetch payment details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const initForm = (p) => {
    setEditingPayment(p);
    const pDate = p.timestamp ? new Date(p.timestamp) : new Date();
    const user = getLoggedUser();
    const isSuperAdmin = user && user.email === 'admin@panel.com';
    let formattedDate = '';
    if (isSuperAdmin) {
      const year = pDate.getFullYear();
      const month = String(pDate.getMonth() + 1).padStart(2, '0');
      const day = String(pDate.getDate()).padStart(2, '0');
      const hours = String(pDate.getHours()).padStart(2, '0');
      const minutes = String(pDate.getMinutes()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      formattedDate = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;
    }
    
    setEditForm({
      paymentType: p.paymentType || '',
      amountReceived: p.amountReceived !== undefined ? p.amountReceived : '',
      paymentMode: p.paymentMode || '',
      bankName: p.bankName || '',
      quantity: p.quantity !== undefined ? p.quantity : '',
      unitPrice: p.unitPrice !== undefined ? p.unitPrice : '',
      billAmount: p.billAmount !== undefined ? p.billAmount : '',
      billDiscount: p.billDiscount !== undefined ? p.billDiscount : '',
      paymentDiscount: p.paymentDiscount !== undefined ? p.paymentDiscount : '',
      remark: p.remark || '',
      timestamp: formattedDate,
      isGstApplied: p.isGstApplied || false,
    });
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const combineDateWithCurrentTime = (dateStr) => {
        if (!dateStr) return new Date();
        if (dateStr.includes('T')) return new Date(dateStr);
        const [year, month, day] = dateStr.split('-').map(Number);
        const now = new Date();
        now.setFullYear(year);
        now.setMonth(month - 1);
        now.setDate(day);
        return now;
      };

      const finalTimestamp = combineDateWithCurrentTime(editForm.timestamp);

      const payload = {
        paymentType: editForm.paymentType,
        amountReceived: editForm.amountReceived === '' ? 0 : Number(editForm.amountReceived),
        paymentMode: editForm.paymentMode,
        bankName: editForm.bankName,
        quantity: editForm.quantity === '' ? 0 : Number(editForm.quantity),
        unitPrice: editForm.unitPrice === '' ? 0 : Number(editForm.unitPrice),
        billAmount: editForm.billAmount === '' ? 0 : Number(editForm.billAmount),
        billDiscount: editForm.billDiscount === '' ? 0 : Number(editForm.billDiscount),
        paymentDiscount: editForm.paymentDiscount === '' ? 0 : Number(editForm.paymentDiscount),
        remark: editForm.remark,
        timestamp: finalTimestamp.toISOString(),
        isGstApplied: editForm.isGstApplied,
      };

      if (editingPayment.billAmount > 0 && (editForm.paymentType === 'License' || editForm.paymentType === 'IP Charges')) {
        payload.billAmount = payload.quantity * payload.unitPrice;
      }

      if (editingPayment.billAmount > 0 && payload.isGstApplied) {
        payload.billAmount = payload.billAmount * 1.18;
      }

      const data = await apiRequest(`/payments/${editingPayment._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (data.success) {
        onSuccess && onSuccess(data.payment);
        onClose();
      }
    } catch (err) {
      alert(err.message || 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  if (loading || !editingPayment) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-hidden">
        <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-8 flex justify-center items-center">
            <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 overflow-hidden">
      <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin rounded-3xl bg-white dark:bg-slate-900 p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white tracking-wide">
            Edit Transaction Entry (Correction Desk)
          </h3>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            ⚠️ Modifying this entry will automatically log an audit trail for transparency.
          </p>
        </div>

        <form onSubmit={handleUpdatePayment} className="space-y-4">
          {/* Transaction Date Row */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Transaction Date {userEmail === 'admin@panel.com' && '& Time'}</label>
            <input
              type={userEmail === 'admin@panel.com' ? "datetime-local" : "date"}
              value={editForm.timestamp}
              onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
              className="w-full glass-input px-4 py-2.5 text-sm cursor-pointer font-semibold"
              required
            />
          </div>

          {/* Conditional Input Fields depending on whether it is a Bill or Payment */}
          {editingPayment.billAmount > 0 ? (
            /* It's a Bill Generated */
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Billing Type</label>
                  <select
                    value={editForm.paymentType}
                    onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm font-semibold"
                    required
                  >
                    <option value="License" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">License Charges</option>
                    <option value="IP Charges" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">IP Charges</option>
                    <option value="Maintenance" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Maintenance Charges</option>
                    <option value="Other" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Other Charges</option>
                  </select>
                </div>

                {(editForm.paymentType === 'License' || editForm.paymentType === 'IP Charges') ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Quantity</label>
                      <input
                        type="number" step="any"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        className="w-full glass-input px-4 py-2.5 text-sm font-mono font-semibold"
                        placeholder="e.g. 10"
                        required
                        min="1"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Total Bill Amount (₹)</label>
                    <input
                      type="number" step="any"
                      value={editForm.billAmount}
                      onChange={(e) => setEditForm({ ...editForm, billAmount: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 text-sm font-mono font-semibold"
                      placeholder="Amount in ₹"
                      required
                      min="1"
                    />
                  </div>
                )}
              </div>

              {(editForm.paymentType === 'License' || editForm.paymentType === 'IP Charges') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Unit Price (₹)</label>
                    <input
                      type="number" step="any"
                      value={editForm.unitPrice}
                      onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                      className="w-full glass-input px-4 py-2.5 text-sm font-mono font-semibold"
                      placeholder="Price per unit"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Auto Bill Total</label>
                    <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{((Number(editForm.quantity) || 0) * (Number(editForm.unitPrice) || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Bill Discount Applied (₹)</label>
                <input
                  type="number" step="any"
                  value={editForm.billDiscount}
                  onChange={(e) => setEditForm({ ...editForm, billDiscount: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 text-sm font-mono font-semibold text-rose-500"
                  placeholder="Discount Amount (₹)"
                  min="0"
                />
              </div>

              {(editForm.paymentType === 'License' && editingPayment.panelId?.category?.toUpperCase().includes('SOP')) && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, isGstApplied: !editForm.isGstApplied })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold shadow-sm ${editForm.isGstApplied
                      ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={editForm.isGstApplied}
                      onChange={() => { }} // handled by button click
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Apply SOP GST (18%)</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* It's a Direct Payment Collected */
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Amount Received (₹)</label>
                <input
                  type="number" step="any"
                  value={editForm.amountReceived}
                  onChange={(e) => setEditForm({ ...editForm, amountReceived: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 text-sm font-mono font-semibold"
                  placeholder="Amount in ₹"
                  required
                  min="1"
                />
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Payment Discount Given (₹)</label>
                <input
                  type="number" step="any"
                  value={editForm.paymentDiscount}
                  onChange={(e) => setEditForm({ ...editForm, paymentDiscount: e.target.value })}
                  className="w-full glass-input px-4 py-2.5 text-sm font-mono font-semibold text-rose-500"
                  placeholder="Discount Amount (₹)"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Payment Mode</label>
                  <select
                    value={editForm.paymentMode}
                    onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm font-semibold"
                    required
                  >
                    <option value="UPI" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">UPI / QR Code</option>
                    <option value="Cash" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Cash</option>
                    <option value="Bank Transfer" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Bank Transfer</option>
                    <option value="Online" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Bank Name</label>
                  <select
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    className="w-full glass-input px-4 py-2.5 text-sm font-semibold"
                  >
                    <option value="" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">N/A (Cash / None)</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">{bank}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">Correction Remarks / Reason for Change</label>
            <textarea
              value={editForm.remark}
              onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
              className="w-full rounded-xl px-4 py-3 text-sm glass-input h-24 resize-none leading-relaxed text-slate-900 dark:text-white"
              placeholder="Describe the reason for correcting this entry..."
              required
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-5 mt-6 border-t border-slate-200 dark:border-slate-800">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-all duration-200 active:scale-95 shadow-sm"
            >
              Cancel
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
