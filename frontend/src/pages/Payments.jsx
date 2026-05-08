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
  Printer,
} from 'lucide-react';
import ReceiptModal from '@/components/ReceiptModal';

const BANK_LIST = [
  'HDFC Bank',
  'Indian Bank'
];

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-3 px-4">
      <div className="h-4 w-6 rounded bg-slate-800 mx-auto"></div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-4 w-24 rounded bg-slate-800"></div>
        <div className="h-3 w-16 rounded bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-5 w-32 rounded bg-slate-800"></div>
        <div className="h-3.5 w-24 rounded bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="h-4.5 w-20 rounded bg-slate-800"></div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-5 w-24 rounded bg-slate-800"></div>
        <div className="h-3.5 w-16 rounded bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-4 w-20 rounded bg-slate-800"></div>
        <div className="h-3 w-16 rounded bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="h-4 w-28 rounded bg-slate-800/50"></div>
    </td>
    <td className="py-3 px-4">
      <div className="h-8 w-20 rounded bg-slate-800 mx-auto"></div>
    </td>
  </tr>
);

const SkeletonSpreadsheetRow = () => (
  <tr className="animate-pulse border-b border-slate-800/80">
    <td className="border-r border-slate-700/40 text-center text-slate-500 bg-slate-800/10 py-2.5 font-bold w-12">
      <div className="h-3.5 w-4 rounded bg-slate-800 mx-auto"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5">
      <div className="h-4 w-32 rounded bg-slate-800"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5">
      <div className="h-4 w-24 rounded bg-slate-800"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-800 ml-auto"></div>
    </td>
    <td className="px-4 py-2.5 text-center">
      <div className="h-6 w-20 rounded bg-slate-800 mx-auto"></div>
    </td>
  </tr>
);

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
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'consolidated'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
          setModalMode('receive');
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

  // Dual Option States
  const [modalMode, setModalMode] = useState('receive'); // 'receive' or 'bill'
  const [billAmountInput, setBillAmountInput] = useState('');

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
          setBillAmountInput(panel.maintenanceCharges || '');
        } else {
          setUnitPrice(0);
        }
      }
    } else {
      setUnitPrice(0);
    }
  }, [selectedPanelId, paymentType, panels]);

  const fetchPaymentsAndPanels = async (page = currentPage, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
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
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndPanels(currentPage);
  }, [currentPage]);

  const handleOpenReceiveModal = () => {
    setModalMode('receive');
    setSelectedPanelId('');
    setPaymentType('Other');
    setAmountReceived('');
    setPaymentMode('UPI');
    setBankName('HDFC Bank');
    setQuantity(0);
    setUnitPrice(0);
    setBillAmountInput('');
    setRemark('');
    setIsModalOpen(true);
  };

  const handleOpenBillModal = () => {
    setModalMode('bill');
    setSelectedPanelId('');
    setPaymentType('Maintenance');
    setAmountReceived('0');
    setPaymentMode('UPI');
    setBankName('');
    setQuantity(1);
    setUnitPrice(0);
    setBillAmountInput('');
    setRemark('');
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!selectedPanelId) {
        setError('Please select a panel.');
        setSubmitting(false);
        return;
      }

      let finalAmountReceived = 0;
      let finalQuantity = 0;
      let finalUnitPrice = 0;
      let calculatedBillAmount = 0;
      let finalPaymentMode = paymentMode;
      let finalBankName = bankName;

      if (modalMode === 'receive') {
        finalAmountReceived = amountReceived !== '' && amountReceived !== undefined ? Number(amountReceived) : 0;
        if (finalAmountReceived < 0) {
          setError('Amount received cannot be negative.');
          setSubmitting(false);
          return;
        }
        if (finalPaymentMode !== 'Cash' && finalAmountReceived > 0 && !bankName) {
          setError('Please select a bank name.');
          setSubmitting(false);
          return;
        }
        finalBankName = (finalPaymentMode !== 'Cash' && finalAmountReceived > 0) ? bankName : '';
      } else {
        // 'bill' mode
        finalAmountReceived = 0; // Bills generate debt, amount received is 0
        finalPaymentMode = 'UPI'; // Default placeholder for backend
        finalBankName = '';

        const isRechargeType = paymentType === 'License' || paymentType === 'IP Charges';
        if (isRechargeType) {
          finalQuantity = quantity === '' ? 0 : Number(quantity);
          finalUnitPrice = Number(unitPrice) || 0;
          calculatedBillAmount = finalUnitPrice * finalQuantity;
        } else {
          // Maintenance or Other
          calculatedBillAmount = billAmountInput === '' ? 0 : Number(billAmountInput);
          finalQuantity = 1;
          finalUnitPrice = calculatedBillAmount;
        }

        if (calculatedBillAmount <= 0) {
          setError('Bill amount must be greater than 0.');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        panelId: selectedPanelId,
        paymentType,
        amountReceived: finalAmountReceived,
        paymentMode: finalPaymentMode,
        bankName: finalBankName,
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
        setSuccess(modalMode === 'receive' ? 'Payment collected successfully and saved in ledger!' : 'Bill generated successfully and added to ledger!');
        setCurrentPage(1); // Reset to page 1 to see the newest payment
        fetchPaymentsAndPanels(1, true);
        setIsModalOpen(false);
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
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

      const rows = exportData.payments.map((p) => [
        new Date(p.timestamp).toLocaleDateString(),
        p.panelId?.panelName || 'Unknown Panel',
        p.paymentType,
        p.quantity !== undefined && p.quantity !== null ? p.quantity : 1,
        p.billAmount || 0,
        p.amountReceived || 0,
        p.paymentMode,
        p.bankName || 'N/A',
        p.addedBy?.name || 'Staff User',
        p.remark || 'N/A',
      ]);

      const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Ledger Report</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            table { border-collapse: collapse; margin-top: 10px; }
            th { 
              background-color: #4f46e5; 
              color: #ffffff; 
              font-family: Arial, sans-serif; 
              font-size: 11pt; 
              font-weight: bold; 
              text-align: center; 
              border: 1px solid #cbd5e1;
              height: 35px;
            }
            td { 
              font-family: Arial, sans-serif; 
              font-size: 10pt; 
              text-align: left; 
              border: 1px solid #cbd5e1;
              height: 28px;
              padding: 6px 10px;
            }
            .zebra {
              background-color: #f8fafc;
            }
            .num-cell {
              text-align: right;
            }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col width="140" />
              <col width="180" />
              <col width="130" />
              <col width="90" />
              <col width="130" />
              <col width="130" />
              <col width="130" />
              <col width="150" />
              <col width="140" />
              <col width="280" />
            </colgroup>
            <thead>
              <tr style="height: 45px;">
                <th colspan="10" style="font-size: 14pt; font-weight: bold; background-color: #1e1b4b; color: #ffffff; text-align: center; border: 1px solid #cbd5e1;">
                  PANEL SALES & LEDGER TRANSACTION REPORT
                </th>
              </tr>
              <tr>
                <th>Transaction Date</th>
                <th>Panel Client</th>
                <th>Charge Type</th>
                <th>Quantity</th>
                <th>Bill Amount (₹)</th>
                <th>Amount Paid (₹)</th>
                <th>Payment Mode</th>
                <th>Bank Name</th>
                <th>Collected By</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row, index) => `
                <tr class="${index % 2 === 1 ? 'zebra' : ''}">
                  <td>${row[0]}</td>
                  <td style="font-weight: bold;">${row[1]}</td>
                  <td>${row[2]}</td>
                  <td class="num-cell">${row[3]}</td>
                  <td class="num-cell" style="color: #475569;">₹${Number(row[4]).toLocaleString()}</td>
                  <td class="num-cell" style="font-weight: bold; color: ${Number(row[5]) > 0 ? '#10b981' : '#ef4444'};">₹${Number(row[5]).toLocaleString()}</td>
                  <td>${row[6]}</td>
                  <td>${row[7]}</td>
                  <td>${row[8]}</td>
                  <td style="color: #64748b; font-style: italic;">${row[9]}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Panel_Sales_Ledger_${new Date().toISOString().substring(0, 10)}.xls`);
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
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Ledger Collections (Payments)</h2>
            {loading && payments.length > 0 && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent shrink-0"></div>
            )}
          </div>
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
            onClick={handleOpenReceiveModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3 text-sm transition-all shadow-lg shadow-emerald-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Receive Payment</span>
          </button>

          <button
            onClick={handleOpenBillModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 text-sm transition-all shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Bill</span>
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

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'list'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Transaction Ledger List</span>
          </button>
          <button
            onClick={() => setActiveTab('consolidated')}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'consolidated'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <FileSpreadsheet className="h-4 w-4" />
            <span>Consolidated Panels Ledger Sheet</span>
          </button>
        </div>
        <div className="hidden md:block text-xs text-slate-500 font-medium">
          {activeTab === 'list'
            ? 'Showing individual collections and bill issues'
            : 'Consolidated overview across all active clients'}
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
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
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 text-center w-14">S.No</th>
                    <th className="py-3.5 px-5">Date & Time</th>
                    <th className="py-3.5 px-5">Panel Client</th>
                    <th className="py-3.5 px-5">Billing Type</th>
                    <th className="py-3.5 px-5">Financial Details</th>
                    <th className="py-3.5 px-5">Payment Mode</th>
                    <th className="py-3.5 px-5">Collected By</th>
                    {/* <th className="py-3.5 px-5">Remarks</th> */}
                    <th className="py-3.5 px-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {loading && payments.length === 0 ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : filteredPayments.map((p, index) => (
                    <tr key={p._id} className="hover:bg-slate-900/40 transition-colors duration-150 group">
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500 group-hover:text-slate-400">
                        {(currentPage - 1) * 10 + index + 1}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{new Date(p.timestamp).toLocaleDateString()}</span>
                          <span className="text-[10px] text-slate-500 font-medium mt-0.5">{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 flex items-center justify-center font-bold text-[11px] capitalize shrink-0 shadow-sm">
                            {p.panelId?.panelName?.substring(0, 2)}
                          </div>
                          <span className="font-bold text-white tracking-wide">{p.panelId?.panelName || 'Deleted Panel'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${p.paymentType === 'License'
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
                            <span className="text-[9px] text-slate-500 font-bold uppercase ml-0.5">Qty: {p.quantity}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-col gap-1">
                          {p.billAmount > 0 ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-semibold uppercase w-8">Bill:</span>
                                <span className="font-bold text-slate-400 font-mono">₹{p.billAmount?.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-semibold uppercase w-8">Paid:</span>
                                <span className={`font-extrabold font-mono ${p.amountReceived === 0
                                  ? 'text-rose-400'
                                  : p.amountReceived < p.billAmount
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                  }`}>
                                  ₹{p.amountReceived?.toLocaleString()}
                                </span>
                              </div>
                              <div className="mt-1">
                                {p.amountReceived === 0 ? (
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/15">
                                    Unpaid
                                  </span>
                                ) : p.amountReceived < p.billAmount ? (
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/15">
                                    Partial (₹{(p.billAmount - p.amountReceived).toLocaleString()} due)
                                  </span>
                                ) : (
                                  <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                                    Fully Paid
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-semibold uppercase w-8">Paid:</span>
                                <span className="font-extrabold text-white font-mono">₹{p.amountReceived?.toLocaleString()}</span>
                              </div>
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 w-fit">
                                Direct Payment
                              </span>
                            </div>
                          )}

                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <div className="text-[9px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                            <CreditCard className="h-3 w-3 shrink-0 text-slate-600" />
                            <span>{p.paymentMode} {p.bankName && `(${p.bankName})`}</span>
                          </div>
                        </div>
                      </td>




                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <div className="h-5 w-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[9px] uppercase border border-slate-700">
                            {p.addedBy?.name?.substring(0, 2)}
                          </div>
                          <span className="font-medium truncate max-w-[110px]">{p.addedBy?.name || 'Staff User'}</span>
                        </div>
                      </td>
                      {/* <td className="py-3 px-5 text-slate-400 max-w-[140px] truncate" title={p.remark || ''}>
                        {p.remark ? (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{p.remark}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-semibold">-</span>
                        )}
                      </td> */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedReceiptPayment(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/10 hover:border-transparent text-xs font-bold transition-all shadow-md active:scale-95"
                          title="Generate Receipt"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          {/* <span>Receipt</span> */}
                        </button>
                      </td>
                    </tr>
                  ))
                  }
                  {filteredPayments.length === 0 && !loading && (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
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
        </>
      ) : (
        <div className="overflow-x-auto p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded">Sheet1</span>
              <span className="text-slate-400 font-bold">Consolidated Panels Ledger Sheet</span>
            </div>
            <span className="text-slate-500 hidden sm:inline">Formula Bar: <span className="text-indigo-400 font-bold">f(x)</span> = Outstanding = Opening Balance + Total Bill - Paid</span>
          </div>

          <table className="w-full text-left border border-slate-700/60 font-mono text-xs border-collapse bg-slate-900/40">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-500 text-center text-[10px]">
                <th className="border-r border-slate-700/60 py-1 w-12 bg-slate-900"></th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">A</th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">B</th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">C</th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">D</th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">E</th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">F</th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">G</th>
                <th className="border-r border-slate-700/60 py-1 bg-slate-900">H</th>
                <th className="py-1 bg-slate-900">I</th>
              </tr>
              <tr className="bg-slate-800 text-slate-300 border-b border-slate-700 font-bold uppercase tracking-wider text-xs">
                <th className="border-r border-slate-700/60 text-center text-slate-500 bg-slate-800/50 py-2.5 w-12">#</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 bg-slate-800">Panel Client</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 bg-slate-800">Owner Name</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 text-right bg-slate-800">Opening Bal (₹)</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 text-right bg-slate-800">License charges (₹)</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 text-right bg-slate-800">IP charges (₹)</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 text-right bg-slate-800">Maint. charges (₹)</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 text-right bg-slate-800">Total Paid (₹)</th>
                <th className="border-r border-slate-700/60 px-4 py-2.5 text-right bg-slate-800">Outstanding (₹)</th>
                <th className="px-4 py-2.5 bg-slate-800 text-center">Quick Ledger Link</th>
              </tr>
            </thead>
            <tbody>
              {panels.map((p, idx) => (
                <tr
                  key={p._id}
                  className={`border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? 'bg-slate-900/10' : 'bg-slate-950/20'
                    }`}
                >
                  <td className="border-r border-slate-700/40 text-center text-slate-500 bg-slate-800/10 py-2.5 font-bold w-12">
                    {idx + 1}
                  </td>
                  <td className="border-r border-slate-700/40 px-4 py-2.5 text-white font-bold">
                    {p.panelName}
                  </td>
                  <td className="border-r border-slate-700/40 px-4 py-2.5 text-slate-400">
                    {p.ownerName}
                  </td>
                  <td className="border-r border-slate-700/40 px-4 py-2.5 text-right text-slate-300">
                    ₹{p.openingBalance?.toLocaleString() || '0'}
                  </td>
                  <td className="border-r border-slate-700/40 px-4 py-2.5 text-right text-slate-400">
                    ₹{p.licenseCharges?.toLocaleString() || '0'}
                  </td>
                  <td className="border-r border-slate-700/40 px-4 py-2.5 text-right text-slate-400">
                    ₹{p.ipCharges?.toLocaleString() || '0'}
                  </td>
                  <td className="border-r border-slate-700/40 px-4 py-2.5 text-right text-slate-400">
                    ₹{p.maintenanceCharges?.toLocaleString() || '0'}
                  </td>
                  <td className="border-r border-slate-700/40 px-4 py-2.5 text-right font-bold text-emerald-400 bg-emerald-500/5">
                    ₹{p.totalPaid?.toLocaleString() || '0'}
                  </td>
                  <td className={`border-r border-slate-700/40 px-4 py-2.5 text-right font-bold bg-rose-500/5 ${p.outstanding > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{p.outstanding?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <a
                      href={`#/dashboard/panels/${p._id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow"
                    >
                      <span>View Ledger</span>
                    </a>
                  </td>
                </tr>
              ))}

              {/* Excel Summary Row */}
              <tr className="bg-slate-800/80 border-t-2 border-slate-700 font-bold text-white text-xs">
                <td className="border-r border-slate-700 text-center text-slate-400 bg-slate-800 py-3 w-12">
                  {panels.length + 1}
                </td>
                <td className="border-r border-slate-700 px-4 py-3 uppercase tracking-wider text-slate-400 text-[10px]" colSpan="2">
                  =SUM(C2:C{panels.length + 1}) ...
                </td>
                <td className="border-r border-slate-700 px-4 py-3 text-right text-slate-300">
                  ₹{panels.reduce((sum, p) => sum + (p.openingBalance || 0), 0).toLocaleString()}
                </td>
                <td className="border-r border-slate-700 px-4 py-3 text-right text-slate-400" colSpan="3">
                  Total Sheets Activity
                </td>
                <td className="border-r border-slate-700 px-4 py-3 text-right text-emerald-400 bg-emerald-500/5">
                  ₹{panels.reduce((sum, p) => sum + (p.totalPaid || 0), 0).toLocaleString()}
                </td>
                <td className="border-r border-slate-700 px-4 py-3 text-right text-rose-400 bg-rose-500/5">
                  ₹{panels.reduce((sum, p) => sum + (p.outstanding || 0), 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-indigo-400 font-bold text-center">
                  All Clients Active Summary
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* RECEIVE PAYMENT / GENERATE BILL FORM MODAL */}
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
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shadow-inner ${modalMode === 'receive'
                ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20'
                : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                }`}>
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {modalMode === 'receive' ? 'Collect / Receive Client Payment' : 'Generate / Create Client Bill'}
              </h3>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              {/* Row 1: Select Panel & Dues/Types depending on Mode */}
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
                    <option className="bg-slate-900 text-white" value="">-- Select a Client --</option>
                    {panels.map((p) => (
                      <option key={p._id} value={p._id} className="bg-slate-900 text-white py-2">
                        {p.panelName} ({p.ownerName})
                      </option>
                    ))}
                  </select>
                </div>

                {modalMode === 'receive' ? (
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
                      min="1"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Bill / Charge Type
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white cursor-pointer"
                      required
                    >
                      <option value="Maintenance" className="bg-slate-900 text-white">Maintenance Support</option>
                      <option value="License" className="bg-slate-900 text-white">License Charges</option>
                      <option value="IP Charges" className="bg-slate-900 text-white">IP Charges</option>
                      <option value="Other" className="bg-slate-900 text-white">Other Charges</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Outstanding dues info box */}
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

              {/* Receive Mode Specific fields */}
              {modalMode === 'receive' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Payment Category (Optional)
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-950 border border-slate-800 text-white cursor-pointer"
                      required
                    >
                      <option value="Other" className="bg-slate-900 text-white">General / Other Payment</option>
                      <option value="License" className="bg-slate-900 text-white">License Payment</option>
                      <option value="IP Charges" className="bg-slate-900 text-white">IP Charges Payment</option>
                      <option value="Maintenance" className="bg-slate-900 text-white">Maintenance Payment</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Bill Mode Specific fields */}
              {modalMode === 'bill' && (
                <>
                  {/* License or IP Charges: Quantity & Price Calculator */}
                  {(paymentType === 'License' || paymentType === 'IP Charges') ? (
                    <div className="rounded-xl bg-indigo-500/5 p-4 border border-indigo-500/10 space-y-3 animate-in slide-in-from-top-1">
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
                            min="1"
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
                  ) : (
                    /* Maintenance or Other: Direct Amount Entry */
                    <div className="animate-in slide-in-from-top-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Enter Bill Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={billAmountInput}
                        onChange={(e) => setBillAmountInput(e.target.value)}
                        placeholder="e.g. 10000 for maintenance charges"
                        className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold text-emerald-400 text-base"
                        min="1"
                        required
                      />
                    </div>
                  )}
                </>
              )}

              {/* Receiving Bank Row for Receive Mode */}
              {modalMode === 'receive' && paymentMode !== 'Cash' && Number(amountReceived || 0) > 0 && (
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

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Remarks / Description
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={modalMode === 'receive' ? "Insert payment remarks..." : "Insert bill descriptions (e.g. Server maintenance charges)..."}
                  className="w-full rounded-xl px-4 py-3 text-sm glass-input h-14 resize-none"
                />
              </div>

              {/* Action buttons */}
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
                  disabled={submitting}
                  className={`flex-1 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 ${submitting ? 'opacity-50 cursor-not-allowed' : ''} ${modalMode === 'receive'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/10'
                    : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-indigo-500/10'
                    }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {modalMode === 'receive' ? 'Processing Payment...' : 'Generating Bill...'}
                    </span>
                  ) : (
                    modalMode === 'receive' ? 'Confirm Payment Receipt' : 'Create & Save Bill'
                  )}
                </button>
              </div>
            </form>
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
