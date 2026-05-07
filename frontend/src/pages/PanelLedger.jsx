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
          onClick={() => navigate(-1)}
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

  const calculatedTotalBill = payments.reduce((sum, p) => sum + (p.billAmount || 0), 0);

  const getLast30DaysData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toLocaleDateString();
      
      const dayPayments = payments.filter(p => {
        const pDate = new Date(p.timestamp).toLocaleDateString();
        return pDate === dateStr;
      });
      
      if (dayPayments.length > 0) {
        dayPayments.forEach((p, pIndex) => {
          data.push({
            id: `${p._id || dateStr}-${pIndex}`,
            date: dateStr,
            displayDate: pIndex === 0 ? dateStr : '',
            paymentType: p.paymentType,
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            billAmount: p.billAmount || 0,
            amountReceived: p.amountReceived || 0,
            remark: p.remark || '-',
            addedBy: p.addedBy?.name || 'Staff User',
            hasData: true,
          });
        });
      } else {
        data.push({
          id: `${dateStr}-empty`,
          date: dateStr,
          displayDate: dateStr,
          paymentType: '-',
          quantity: '-',
          unitPrice: '-',
          billAmount: 0,
          amountReceived: 0,
          remark: '-',
          addedBy: '-',
          hasData: false,
        });
      }
    }
    return data;
  };

  return (
    <div className="space-y-8">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard/panels')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Panels List
        </button>
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Client Account Code: #{panel?._id?.substring(18)}</span>
      </div>

      {/* Top Balances & Client Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Client Info */}
        <div className="rounded-2xl glass-card border border-slate-800 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-500/5 blur-xl"></div>
          <div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800/80">
              <div className="h-10 w-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-base leading-tight truncate">{panel?.panelName}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-medium">Panel Client</p>
              </div>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <UserIcon className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="truncate">{panel?.ownerName}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="truncate" title={panel?.ownerEmail}>{panel?.ownerEmail}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="h-4 w-4 text-slate-500 shrink-0" />
                <span>{panel?.phoneNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Default Client Rates */}
        <div className="rounded-2xl glass-card border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider text-slate-400">Default Client Rates</h4>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>Opening Balance:</span>
                <span className="font-semibold text-white">₹{panel?.openingBalance?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>License Rate:</span>
                <span className="font-semibold text-slate-400">₹{panel?.licenseCharges?.toLocaleString()} / unit</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/40">
                <span>IP routing Rate:</span>
                <span className="font-semibold text-slate-400">₹{panel?.ipCharges?.toLocaleString()} / unit</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Maintenance Rate:</span>
                <span className="font-semibold text-slate-400">₹{panel?.maintenanceCharges?.toLocaleString()} / unit</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-2.5 font-bold text-sm text-white border-t border-slate-800 mt-2">
            <span>Total Generated Bills:</span>
            <span className="text-emerald-400">₹{calculatedTotalBill?.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 3: Total Collected */}
        <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl"></div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Total Dues Collected</span>
            <p className="text-[10px] text-slate-400 mt-1">Sum of all successfully received payments</p>
          </div>
          <div className="mt-6 sm:mt-8">
            <span className="text-3xl font-extrabold text-emerald-400">₹{panel?.totalPaid?.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 4: Total Outstanding */}
        <div className="rounded-2xl bg-rose-500/5 border border-rose-500/10 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-rose-500/5 blur-xl"></div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Total Dues Outstanding</span>
            <p className="text-[10px] text-slate-400 mt-1">Net pending dues across generated bills</p>
          </div>
          <div className="mt-6 sm:mt-8">
            <span className="text-3xl font-extrabold text-rose-400">₹{panel?.outstanding?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Full Width Ledger Transactions Table Card */}
      <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden shadow-xl w-full">
            <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Ledger Transactions</h3>
                <p className="text-xs text-slate-400 mt-0.5">Toggle between standard list and date-wise Excel-sheet view</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'list'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Standard List
                  </button>
                  <button
                    onClick={() => setActiveTab('excel')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'excel'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Excel Sheet View
                  </button>
                </div>

                {activeTab === 'excel' && (
                  <button
                    onClick={() => setIsFullscreen(true)}
                    title="View Fullscreen Spreadsheet"
                    className="p-2 bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 rounded-xl transition-all shadow-md flex items-center gap-1 text-xs font-bold"
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span>Fullscreen</span>
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                      <th className="px-4 py-4 text-center">S.No</th>
                      <th className="px-6 py-4">Transaction Date</th>
                      <th className="px-6 py-4">Charges Type</th>
                      <th className="px-6 py-4">Mode</th>
                      <th className="px-6 py-4">Billing & Payment</th>
                      <th className="px-6 py-4">Received By</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {payments.map((p, index) => (
                      <tr key={p._id} className="hover:bg-slate-800/15 transition-colors">
                        <td className="px-4 py-4 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
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
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {p.billAmount > 0 ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 font-medium">Bill:</span>
                                  <span className="font-semibold text-slate-300">₹{p.billAmount?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 font-medium">Paid:</span>
                                  <span className={`font-bold text-base ${
                                    p.amountReceived === 0 
                                      ? 'text-rose-400' 
                                      : p.amountReceived < p.billAmount 
                                        ? 'text-amber-400' 
                                        : 'text-emerald-400'
                                  }`}>
                                    ₹{p.amountReceived?.toLocaleString()}
                                  </span>
                                </div>
                                {p.amountReceived === 0 ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                                    Outstanding / Credit Only
                                  </span>
                                ) : p.amountReceived < p.billAmount ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
                                    Partially Paid (₹{(p.billAmount - p.amountReceived).toLocaleString()} due)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
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
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                                    Direct Payment
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20 w-fit">
                                    No Amount
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-slate-500" />
                            <span>{p.addedBy?.name || 'Staff User'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedReceiptPayment({ ...p, panelId: { panelName: panel?.panelName, ownerName: panel?.ownerName } })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/10 hover:border-indigo-500 text-xs font-bold transition-all shadow-md"
                            title="Generate Receipt"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-slate-400">
                          No payments collected for this panel yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto p-4 bg-slate-950">
                <div className="flex items-center justify-between mb-3 text-[11px] font-mono">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded">Sheet1</span>
                    <span className="text-slate-500">Continuous 30-Day Ledger</span>
                  </div>
                  <span className="text-slate-500">Formula Bar: <span className="text-indigo-400 font-bold">f(x)</span> = SUM(F2:F31) - SUM(G2:G31)</span>
                </div>
                
                <table className="w-full text-left border border-slate-700/60 font-mono text-[11px] border-collapse bg-slate-900/40">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-500 text-center text-[10px]">
                      <th className="border-r border-slate-700/60 py-1 w-10"></th>
                      <th className="border-r border-slate-700/60 py-1 w-24">A</th>
                      <th className="border-r border-slate-700/60 py-1 w-24">B</th>
                      <th className="border-r border-slate-700/60 py-1 w-16">C</th>
                      <th className="border-r border-slate-700/60 py-1 w-20">D</th>
                      <th className="border-r border-slate-700/60 py-1 w-28">E</th>
                      <th className="border-r border-slate-700/60 py-1 w-28">F</th>
                      <th className="border-r border-slate-700/60 py-1 w-24">G</th>
                      <th className="py-1">H</th>
                    </tr>
                    <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 text-[11px] font-bold uppercase tracking-wider">
                      <th className="border-r border-slate-700/60 text-center text-slate-500 bg-slate-800/50 py-2 w-10">#</th>
                      <th className="border-r border-slate-700/60 px-3 py-2 w-24">Date</th>
                      <th className="border-r border-slate-700/60 px-3 py-2 w-24">Type</th>
                      <th className="border-r border-slate-700/60 px-3 py-2 text-center w-16">Qty</th>
                      <th className="border-r border-slate-700/60 px-3 py-2 text-right w-20">Rate</th>
                      <th className="border-r border-slate-700/60 px-3 py-2 text-right w-28">Bill Amount</th>
                      <th className="border-r border-slate-700/60 px-3 py-2 text-right w-24">Amt Paid</th>
                      <th className="border-r border-slate-700/60 px-3 py-2 text-right w-24">Net Due</th>
                      <th className="px-3 py-2">Remarks / Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getLast30DaysData().map((row, idx) => (
                      <tr 
                        key={row.id} 
                        className={`border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors ${
                          row.hasData 
                            ? 'bg-indigo-500/5 font-semibold text-white' 
                            : idx % 2 === 0 
                              ? 'bg-slate-900/20' 
                              : 'bg-slate-950/20'
                        }`}
                      >
                        <td className="border-r border-slate-700/40 text-center text-slate-500 bg-slate-800/10 py-1.5 font-bold w-10">
                          {idx + 2}
                        </td>
                        <td className="border-r border-slate-700/40 px-3 py-1.5 text-slate-400 w-24">
                          {row.displayDate}
                        </td>
                        <td className="border-r border-slate-700/40 px-3 py-1.5 w-24">
                          {row.paymentType !== '-' ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              row.paymentType === 'License'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : row.paymentType === 'IP Charges'
                                ? 'bg-violet-500/10 text-violet-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {row.paymentType}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="border-r border-slate-700/40 px-3 py-1.5 text-center w-16 text-slate-400">
                          {row.quantity}
                        </td>
                        <td className="border-r border-slate-700/40 px-3 py-1.5 text-right w-20 text-slate-400">
                          {row.unitPrice !== '-' ? `₹${row.unitPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className={`border-r border-slate-700/40 px-3 py-1.5 text-right font-bold w-28 ${row.billAmount > 0 ? 'text-amber-400 bg-amber-400/5' : 'text-slate-500'}`}>
                          ₹{row.billAmount.toLocaleString()}
                        </td>
                        <td className={`border-r border-slate-700/40 px-3 py-1.5 text-right font-bold w-24 ${row.amountReceived > 0 ? 'text-emerald-400 bg-emerald-400/5' : 'text-slate-500'}`}>
                          ₹{row.amountReceived.toLocaleString()}
                        </td>
                        <td className={`border-r border-slate-700/40 px-3 py-1.5 text-right font-bold w-24 ${row.billAmount - row.amountReceived > 0 ? 'text-rose-400 bg-rose-400/5' : 'text-slate-500'}`}>
                          ₹{(row.billAmount - row.amountReceived).toLocaleString()}
                        </td>
                        <td className="px-3 py-1.5 text-slate-400 truncate max-w-xs" title={`${row.remark} (by ${row.addedBy})`}>
                          {row.remark !== '-' ? (
                            <span className="flex items-center gap-1">
                              <span className="text-white">{row.remark}</span>
                              <span className="text-[10px] text-slate-500">({row.addedBy})</span>
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Excel Sheet Summary Row (Formulas) */}
                    <tr className="bg-slate-800/60 border-t-2 border-slate-700 font-bold text-white text-xs">
                      <td className="border-r border-slate-700 text-center text-slate-400 bg-slate-800 py-2.5">
                        32
                      </td>
                      <td className="border-r border-slate-700 px-3 py-2.5 uppercase tracking-wider text-slate-400 text-[10px]" colSpan="4">
                        =SUM(F2:F31) / SUM(G2:G31)
                      </td>
                      <td className="border-r border-slate-700 px-3 py-2.5 text-right text-amber-400 bg-amber-500/5">
                        ₹{getLast30DaysData().reduce((sum, r) => sum + r.billAmount, 0).toLocaleString()}
                      </td>
                      <td className="border-r border-slate-700 px-3 py-2.5 text-right text-emerald-400 bg-emerald-500/5">
                        ₹{getLast30DaysData().reduce((sum, r) => sum + r.amountReceived, 0).toLocaleString()}
                      </td>
                      <td className="border-r border-slate-700 px-3 py-2.5 text-right text-rose-400 bg-rose-500/5">
                        ₹{getLast30DaysData().reduce((sum, r) => sum + (r.billAmount - r.amountReceived), 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-indigo-400 font-semibold italic text-[11px]">
                        Last 30 Days Net Activity
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

      {/* Fullscreen Spreadsheet Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-6 overflow-hidden">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg flex items-center gap-2">
                  <span>{panel?.panelName}</span>
                  <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono uppercase">Spreadsheet Mode</span>
                </h2>
                <p className="text-xs text-slate-400 font-mono">Date-wise Ledger Account • Today to Last 30 Days (Press Esc to close)</p>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Minimize2 className="h-4 w-4" />
              <span>Exit Fullscreen</span>
            </button>
          </div>

          {/* Formula bar in Fullscreen */}
          <div className="flex items-center justify-between mb-3 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded">Sheet1</span>
              <span className="text-slate-400">Continuous 30-Day Ledger</span>
            </div>
            <span className="text-slate-400">Formula Bar: <span className="text-indigo-400 font-bold">f(x)</span> = SUM(F2:F31) - SUM(G2:G31)</span>
          </div>

          {/* Table Container wrapped in scrollable flex-1 */}
          <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-slate-900/10">
            <table className="w-full text-left border border-slate-700/60 font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-500 text-center text-[10px] sticky top-0">
                  <th className="border-r border-slate-700/60 py-1 w-12 bg-slate-900"></th>
                  <th className="border-r border-slate-700/60 py-1 w-28 bg-slate-900">A</th>
                  <th className="border-r border-slate-700/60 py-1 w-32 bg-slate-900">B</th>
                  <th className="border-r border-slate-700/60 py-1 w-20 bg-slate-900">C</th>
                  <th className="border-r border-slate-700/60 py-1 w-24 bg-slate-900">D</th>
                  <th className="border-r border-slate-700/60 py-1 w-36 bg-slate-900">E</th>
                  <th className="border-r border-slate-700/60 py-1 w-36 bg-slate-900">F</th>
                  <th className="border-r border-slate-700/60 py-1 w-32 bg-slate-900">G</th>
                  <th className="py-1 bg-slate-900">H</th>
                </tr>
                <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 font-bold uppercase tracking-wider text-xs sticky top-[22px]">
                  <th className="border-r border-slate-700/60 text-center text-slate-500 bg-slate-800/50 py-2 w-12">#</th>
                  <th className="border-r border-slate-700/60 px-4 py-2 w-28 bg-slate-800">Date</th>
                  <th className="border-r border-slate-700/60 px-4 py-2 w-32 bg-slate-800">Type</th>
                  <th className="border-r border-slate-700/60 px-4 py-2 text-center w-20 bg-slate-800">Qty</th>
                  <th className="border-r border-slate-700/60 px-4 py-2 text-right w-24 bg-slate-800">Rate</th>
                  <th className="border-r border-slate-700/60 px-4 py-2 text-right w-36 bg-slate-800">Bill Amount</th>
                  <th className="border-r border-slate-700/60 px-4 py-2 text-right w-32 bg-slate-800">Amt Paid</th>
                  <th className="border-r border-slate-700/60 px-4 py-2 text-right w-32 bg-slate-800">Net Due</th>
                  <th className="px-4 py-2 bg-slate-800">Remarks / Note</th>
                </tr>
              </thead>
              <tbody>
                {getLast30DaysData().map((row, idx) => (
                  <tr 
                    key={`fs-${row.id}`} 
                    className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${
                      row.hasData 
                        ? 'bg-indigo-500/5 font-semibold text-white' 
                        : idx % 2 === 0 
                          ? 'bg-slate-900/20' 
                          : 'bg-slate-950/20'
                    }`}
                  >
                    <td className="border-r border-slate-700/40 text-center text-slate-500 bg-slate-800/10 py-2 font-bold w-12">
                      {idx + 2}
                    </td>
                    <td className="border-r border-slate-700/40 px-4 py-2 text-slate-400 w-28">
                      {row.displayDate}
                    </td>
                    <td className="border-r border-slate-700/40 px-4 py-2 w-32">
                      {row.paymentType !== '-' ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          row.paymentType === 'License'
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : row.paymentType === 'IP Charges'
                            ? 'bg-violet-500/10 text-violet-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {row.paymentType}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="border-r border-slate-700/40 px-4 py-2 text-center w-20 text-slate-400">
                      {row.quantity}
                    </td>
                    <td className="border-r border-slate-700/40 px-4 py-2 text-right w-24 text-slate-400">
                      {row.unitPrice !== '-' ? `₹${row.unitPrice.toLocaleString()}` : '-'}
                    </td>
                    <td className={`border-r border-slate-700/40 px-4 py-2 text-right font-bold w-36 ${row.billAmount > 0 ? 'text-amber-400 bg-amber-400/5' : 'text-slate-500'}`}>
                      ₹{row.billAmount.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-700/40 px-4 py-2 text-right font-bold w-32 ${row.amountReceived > 0 ? 'text-emerald-400 bg-emerald-400/5' : 'text-slate-500'}`}>
                      ₹{row.amountReceived.toLocaleString()}
                    </td>
                    <td className={`border-r border-slate-700/40 px-4 py-2 text-right font-bold w-32 ${row.billAmount - row.amountReceived > 0 ? 'text-rose-400 bg-rose-400/5' : 'text-slate-500'}`}>
                      ₹{(row.billAmount - row.amountReceived).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-slate-400 truncate max-w-sm" title={`${row.remark} (by ${row.addedBy})`}>
                      {row.remark !== '-' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-white font-medium">{row.remark}</span>
                          <span className="text-xs text-slate-500">({row.addedBy})</span>
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
                
                {/* Excel Summary row in Fullscreen */}
                <tr className="bg-slate-800/80 border-t-2 border-slate-700 font-bold text-white text-xs sticky bottom-0">
                  <td className="border-r border-slate-700 text-center text-slate-400 bg-slate-800 py-3 w-12">
                    32
                  </td>
                  <td className="border-r border-slate-700 px-4 py-3 uppercase tracking-wider text-slate-400 text-xs bg-slate-800" colSpan="4">
                    =SUM(E2:E31) / SUM(G2:G31)
                  </td>
                  <td className="border-r border-slate-700 px-4 py-3 text-right text-amber-400 bg-amber-500/10">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.billAmount, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-700 px-4 py-3 text-right text-emerald-400 bg-emerald-500/10">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + r.amountReceived, 0).toLocaleString()}
                  </td>
                  <td className="border-r border-slate-700 px-4 py-3 text-right text-rose-400 bg-rose-500/10">
                    ₹{getLast30DaysData().reduce((sum, r) => sum + (r.billAmount - r.amountReceived), 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-indigo-400 font-semibold italic text-xs bg-slate-800">
                    Last 30 Days Net Activity Summary
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
