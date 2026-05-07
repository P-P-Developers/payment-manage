'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function PanelDetails({ params }) {
  const router = useRouter();
  const panelId = params.id;

  const [panel, setPanel] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-400 font-medium">Fetching Client Ledger History...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
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

  const calculatedTotalCharges =
    (panel?.openingBalance || 0) +
    (panel?.licenseCharges || 0) +
    (panel?.ipCharges || 0) +
    (panel?.maintenanceCharges || 0);

  return (
    <div className="space-y-8">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/panels')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Panels List
        </button>
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Client Account Code: #{panel?._id?.substring(18)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Client Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl glass-card border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-500/5 blur-xl"></div>

            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800/80">
              <div className="h-12 w-12 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{panel?.panelName}</h3>
                <p className="text-xs text-slate-500 mt-1 uppercase font-medium">Software Panel Owner</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-300">
                <UserIcon className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-sm font-medium">{panel?.ownerName}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Mail className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-sm truncate">{panel?.ownerEmail}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="h-4.5 w-4.5 text-slate-500" />
                <span className="text-sm">{panel?.phoneNumber}</span>
              </div>
            </div>
          </div>

          {/* Dues Breakdown */}
          <div className="rounded-2xl glass-card border border-slate-800 p-6 shadow-xl">
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider text-slate-400">Dues Configuration</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-800/40 text-slate-300">
                <span>Opening Balance:</span>
                <span className="font-semibold text-white">₹{panel?.openingBalance?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40 text-slate-300">
                <span>License Charges:</span>
                <span className="font-semibold text-white">₹{panel?.licenseCharges?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40 text-slate-300">
                <span>IP Routing Charges:</span>
                <span className="font-semibold text-white">₹{panel?.ipCharges?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/40 text-slate-300">
                <span>Maintenance Charges:</span>
                <span className="font-semibold text-white">₹{panel?.maintenanceCharges?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 font-bold text-base text-white">
                <span>Total Charges:</span>
                <span>₹{calculatedTotalCharges?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Ledger history list & dynamic balance cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top balances row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 flex flex-col gap-1 shadow-inner">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Dues Collected</span>
              <span className="text-2xl font-bold text-emerald-400">₹{panel?.totalPaid?.toLocaleString()}</span>
            </div>

            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-5 flex flex-col gap-1 shadow-inner">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Dues Outstanding</span>
              <span className="text-2xl font-bold text-rose-400">₹{panel?.outstanding?.toLocaleString()}</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-white">Ledger Payment History</h3>
              <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
                {payments.length} Payments Collected
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4">Charges Type</th>
                    <th className="px-6 py-4">Mode</th>
                    <th className="px-6 py-4">Collected Amount</th>
                    <th className="px-6 py-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/15 transition-colors">
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-500" />
                          <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                          <span className="text-xs text-slate-500">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
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
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-slate-500" />
                          <span>{p.paymentMode}</span>
                          {p.bankName && <span className="text-xs text-slate-500">({p.bankName})</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-white">
                        ₹{p.amountReceived?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-slate-500" />
                          <span>{p.addedBy?.name || 'Staff User'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400">
                        No payments collected for this panel yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
