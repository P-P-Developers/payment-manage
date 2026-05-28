import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest, getLoggedUser } from '@/utils/api';
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
  Eye,
  Maximize2,
  Minimize2,
  Trash2,
} from 'lucide-react';
import ReceiptModal from '@/components/ReceiptModal';
import ConfirmModal from '@/components/ConfirmModal';

const FALLBACK_BANK_LIST = [
  'Union Bank',
  'Indian Bank'
];

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="py-3 px-4">
      <div className="h-4 w-6 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3 w-16 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3.5 w-24 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="h-4.5 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3.5 w-16 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="space-y-1.5">
        <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3 w-16 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="py-3 px-5">
      <div className="h-4 w-28 rounded bg-slate-200/50 dark:bg-slate-800/50"></div>
    </td>
    <td className="py-3 px-4">
      <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
  </tr>
);

const SkeletonSpreadsheetRow = () => (
  <tr className="animate-pulse border-b border-slate-300/80 dark:border-slate-800/80">
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 dark:text-slate-500 dark:text-slate-500 bg-slate-200/10 dark:bg-slate-800/10 py-2.5  w-12">
      <div className="h-3.5 w-4 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5">
      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5">
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 ml-auto"></div>
    </td>
    <td className="px-4 py-2.5 text-center">
      <div className="h-6 w-20 rounded bg-slate-200 dark:bg-slate-800 mx-auto"></div>
    </td>
  </tr>
);

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [banks, setBanks] = useState(FALLBACK_BANK_LIST);

  const fetchBanks = async () => {
    try {
      const data = await apiRequest('/banks');
      if (data.success) {
        setBanks(data.banks.map(b => b.name));
      }
    } catch (err) {
      console.error('Failed to load banks list:', err);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Dropdown Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'consolidated'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all'); // 'all', 'bill', 'received'

  // Debouncing Search Query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Go back to first page on search change
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPaymentsCount, setTotalPaymentsCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [expandedPanelId, setExpandedPanelId] = useState(null);
  const [expandedPanelPayments, setExpandedPanelPayments] = useState([]);
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({
    paymentType: '',
    amountReceived: '',
    paymentMode: '',
    bankName: '',
    quantity: '',
    unitPrice: '',
    billAmount: '',
    remark: '',
    timestamp: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingCell, setEditingCell] = useState(null); // { paymentId, field, value }
  const [showBillDiscount, setShowBillDiscount] = useState(false);
  const [showPaymentDiscount, setShowPaymentDiscount] = useState(false);

  // Deletion Desk states and handlers
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  const handleDeletePaymentClick = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    setError('');
    setSuccess('');
    try {
      const data = await apiRequest(`/payments/${paymentToDelete._id}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess('Transaction record deleted successfully and logged!');
        fetchPaymentsAndPanels(currentPage, true);
        if (expandedPanelId) {
          const refreshedData = await apiRequest(`/panels/${expandedPanelId}`);
          if (refreshedData.success) {
            setExpandedPanelPayments(refreshedData.payments || []);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete transaction record');
    } finally {
      setPaymentToDelete(null);
    }
  };

  const handleInlineCellSave = async (payment, field, newValue) => {
    if (newValue === '' || isNaN(newValue)) {
      setEditingCell(null);
      return;
    }
    const val = Number(newValue);
    let originalVal = 0;
    if (field === 'billAmount') originalVal = payment.billAmount || 0;
    else if (field === 'amountReceived') originalVal = payment.amountReceived || 0;
    else if (field === 'quantity') originalVal = payment.quantity || 0;

    if (val === originalVal) {
      setEditingCell(null);
      return;
    }

    try {
      const fieldNameForRemark = field === 'billAmount' ? 'Bill Amount' : field === 'amountReceived' ? 'Amount Paid' : 'Quantity';
      const formatVal = (v) => field === 'quantity' ? v : `₹${v.toLocaleString()}`;

      const payload = {
        paymentType: payment.paymentType,
        amountReceived: field === 'amountReceived' ? val : (payment.amountReceived || 0),
        paymentMode: payment.paymentMode,
        bankName: payment.bankName,
        quantity: field === 'quantity' ? val : (payment.quantity || 1),
        unitPrice: field === 'billAmount' ? val : (payment.unitPrice || val),
        billAmount: field === 'billAmount' ? val : (payment.billAmount || 0),
        remark: `Direct cell correction of ${fieldNameForRemark} (Value corrected from ${formatVal(originalVal)} to ${formatVal(val)})`,
      };

      const data = await apiRequest(`/payments/${payment._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (data.success) {
        const refreshedData = await apiRequest(`/panels/${payment.panelId._id || payment.panelId}`);
        if (refreshedData.success) {
          setExpandedPanelPayments(refreshedData.payments || []);
        }
        fetchPaymentsAndPanels(currentPage, true);
      }
    } catch (err) {
      console.error('Failed to update inline cell:', err);
    } finally {
      setEditingCell(null);
    }
  };

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
          setBankName('Union Bank');
          setPaymentType('License');
          setAmountReceived('');
          setRemark('');
          setIsModalOpen(true);
          setSearchParams({});
        }
      }
    }
  }, [panels, searchParams, setSearchParams]);

  useEffect(() => {
    const transactionTypeParam = searchParams.get('transactionType');
    const typeParam = searchParams.get('type');
    const modeParam = searchParams.get('mode');

    setTransactionTypeFilter(transactionTypeParam !== null ? transactionTypeParam : 'all');
    setTypeFilter(typeParam !== null ? typeParam : 'All');
    setModeFilter(modeParam !== null ? modeParam : 'All');
  }, [searchParams]);

  // Form Fields
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [paymentType, setPaymentType] = useState('License');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [bankName, setBankName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [remark, setRemark] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());

  // Dual Option States
  const [modalMode, setModalMode] = useState('receive'); // 'receive' or 'bill'
  const [billAmountInput, setBillAmountInput] = useState('');
  const [billDiscount, setBillDiscount] = useState('');
  const [paymentDiscount, setPaymentDiscount] = useState('');
  const [userRole, setUserRole] = useState('Staff');

  useEffect(() => {
    const user = getLoggedUser();
    if (user && user.role) {
      setUserRole(user.role);
    }
  }, []);

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

      let url = `/payments?page=${page}&limit=10`;
      if (debouncedSearchQuery) url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      if (typeFilter && typeFilter !== 'All') url += `&paymentType=${encodeURIComponent(typeFilter)}`;
      if (modeFilter && modeFilter !== 'All') url += `&paymentMode=${encodeURIComponent(modeFilter)}`;
      if (transactionTypeFilter && transactionTypeFilter !== 'all') url += `&transactionType=${encodeURIComponent(transactionTypeFilter)}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;

      const [paymentsData, panelsData] = await Promise.all([
        apiRequest(url),
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
  }, [currentPage, debouncedSearchQuery, typeFilter, modeFilter, transactionTypeFilter, startDate, endDate]);

  const handleOpenReceiveModal = () => {
    setModalMode('receive');
    setSelectedPanelId('');
    setPaymentType('Other');
    setAmountReceived('');
    setPaymentMode('UPI');
    setBankName('Union Bank');
    setQuantity(0);
    setUnitPrice(0);
    setBillAmountInput('');
    setBillDiscount('');
    setPaymentDiscount('');
    setRemark('');
    setPaymentDate(getTodayDateString());
    setShowBillDiscount(false);
    setShowPaymentDiscount(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (payment) => {
    const pDate = payment.timestamp ? new Date(payment.timestamp) : new Date();
    const formattedDate = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}`;
    setEditingPayment(payment);
    setEditForm({
      paymentType: payment.paymentType || '',
      amountReceived: payment.amountReceived !== undefined ? payment.amountReceived : '',
      paymentMode: payment.paymentMode || '',
      bankName: payment.bankName || '',
      quantity: payment.quantity !== undefined ? payment.quantity : '',
      unitPrice: payment.unitPrice !== undefined ? payment.unitPrice : '',
      billAmount: payment.billAmount !== undefined ? payment.billAmount : '',
      remark: payment.remark || '',
      timestamp: formattedDate,
    });
    setViewingPayment(null);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const combineDateWithCurrentTime = (dateStr) => {
        if (!dateStr) return new Date();
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
        remark: editForm.remark,
        timestamp: finalTimestamp.toISOString(),
      };

      if (editingPayment.billAmount > 0 && (editForm.paymentType === 'License' || editForm.paymentType === 'IP Charges')) {
        payload.billAmount = payload.quantity * payload.unitPrice;
      }

      const data = await apiRequest(`/payments/${editingPayment._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setSuccess('Transaction updated successfully and changes logged in audit ledger!');
        setEditingPayment(null);
        fetchPaymentsAndPanels(currentPage, true);
      }
    } catch (err) {
      setError(err.message || 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpandPanel = async (panelId) => {
    if (expandedPanelId === panelId) {
      setExpandedPanelId(null);
      setExpandedPanelPayments([]);
      return;
    }

    setExpandedPanelId(panelId);
    setExpandedLoading(true);
    try {
      const data = await apiRequest(`/panels/${panelId}`);
      if (data.success) {
        setExpandedPanelPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Failed to load panel ledger:', err);
    } finally {
      setExpandedLoading(false);
    }
  };

  const getLast30DaysData = (panelPayments) => {
    const data = [];
    const sortedPayments = [...(panelPayments || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
    setBillDiscount('');
    setPaymentDiscount('');
    setRemark('');
    setPaymentDate(getTodayDateString());
    setShowBillDiscount(false);
    setShowPaymentDiscount(false);
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

      // Validations for discounts
      const finalBillDiscount = modalMode === 'bill' ? (billDiscount === '' ? 0 : Number(billDiscount)) : 0;
      if (finalBillDiscount < 0) {
        setError('Bill discount cannot be negative.');
        setSubmitting(false);
        return;
      }
      if (finalBillDiscount > calculatedBillAmount) {
        setError('Bill discount cannot exceed bill amount.');
        setSubmitting(false);
        return;
      }

      const finalPaymentDiscount = modalMode === 'receive' ? (paymentDiscount === '' ? 0 : Number(paymentDiscount)) : 0;
      if (finalPaymentDiscount < 0) {
        setError('Payment discount cannot be negative.');
        setSubmitting(false);
        return;
      }
      const activeUser = getLoggedUser();
      const role = activeUser?.role || 'Staff';
      if (finalPaymentDiscount > 0 && role !== 'Admin') {
        setError('Only Admin users are permitted to apply payment discounts.');
        setSubmitting(false);
        return;
      }

      const combineDateWithCurrentTime = (dateStr) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        const now = new Date();
        now.setFullYear(year);
        now.setMonth(month - 1);
        now.setDate(day);
        return now;
      };

      const finalTimestamp = combineDateWithCurrentTime(paymentDate);

      const payload = {
        panelId: selectedPanelId,
        paymentType,
        amountReceived: finalAmountReceived,
        paymentMode: finalPaymentMode,
        bankName: finalBankName,
        quantity: finalQuantity,
        unitPrice: finalUnitPrice,
        billAmount: calculatedBillAmount,
        billDiscount: finalBillDiscount,
        paymentDiscount: finalPaymentDiscount,
        remark,
        timestamp: finalTimestamp.toISOString(),
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
        p.billDiscount || 0,
        p.amountReceived || 0,
        p.paymentDiscount || 0,
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
              <col width="130" />
              <col width="130" />
              <col width="150" />
              <col width="140" />
              <col width="280" />
            </colgroup>
            <thead>
              <tr style="height: 45px;">
                <th colspan="12" style="font-size: 14pt; font-weight: bold; background-color: #1e1b4b; color: #ffffff; text-align: center; border: 1px solid #cbd5e1;">
                  PANEL SALES & LEDGER TRANSACTION REPORT
                </th>
              </tr>
              <tr>
                <th>Transaction Date</th>
                <th>Panel Client</th>
                <th>Charge Type</th>
                <th>Quantity</th>
                <th>Bill Amount (₹)</th>
                <th>Bill Discount (₹)</th>
                <th>Amount Paid (₹)</th>
                <th>Payment Discount (₹)</th>
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
                  <td class="num-cell" style="color: #ea580c;">₹${Number(row[5]).toLocaleString()}</td>
                  <td class="num-cell" style="font-weight: bold; color: ${Number(row[6]) > 0 ? '#10b981' : '#ef4444'};">₹${Number(row[6]).toLocaleString()}</td>
                  <td class="num-cell" style="color: #e11d48;">₹${Number(row[7]).toLocaleString()}</td>
                  <td>${row[8]}</td>
                  <td>${row[9]}</td>
                  <td>${row[10]}</td>
                  <td style="color: #64748b; font-style: italic;">${row[11]}</td>
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

  const filteredPayments = payments;

  const selectedPanelDetails = panels.find((p) => p._id === selectedPanelId);

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        {/* Left Section */}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              Ledger Collections (Payments)
            </h2>

            {loading && payments.length > 0 && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Receive client subscription payments, issue receipt entries, and export transaction records.
          </p>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export */}
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg 
      bg-white dark:bg-gray-900 
      border border-gray-200 dark:border-gray-700 
      px-4 py-2.5 text-sm font-medium 
      text-gray-700 dark:text-gray-300 
      hover:bg-gray-50 dark:hover:bg-gray-800 
      transition-all duration-200 
      shadow-sm hover:shadow"
            title="Download CSV file for MS Excel"
          >
            <FileSpreadsheet className="h-4 w-4 text-gray-500" />
            Export
          </button>

          {/* Receive Payment (Primary CTA) */}
          <button
            onClick={handleOpenReceiveModal}
            className="flex items-center gap-2 rounded-lg 
      bg-blue-600 hover:bg-blue-700 
      px-4 py-2.5 text-sm font-semibold 
      text-white 
      transition-all duration-200 
      shadow-md hover:shadow-lg hover:-translate-y-[1px]"
          >
            <Plus className="h-4 w-4" />
            Receive Payment
          </button>

          {/* Create Bill (Secondary CTA) */}
          <button
            onClick={handleOpenBillModal}
            className="flex items-center gap-2 rounded-lg 
      bg-gray-900 hover:bg-black 
      px-4 py-2.5 text-sm font-semibold 
      text-white 
      transition-all duration-200 
      shadow-md hover:shadow-lg hover:-translate-y-[1px]"
          >
            <Plus className="h-4 w-4" />
            Create Bill
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
      <div className="flex items-center bgw justify-between bg-slate-100/60 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-300 dark:border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm  transition-all flex items-center gap-2 ${activeTab === 'list'
              ? 'bg-indigo-600 text-slate-900 dark:text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Transaction Ledger List</span>
          </button>
          <button
            onClick={() => setActiveTab('consolidated')}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm  transition-all flex items-center gap-2 ${activeTab === 'consolidated'
              ? 'bg-emerald-600 text-slate-900 dark:text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <FileSpreadsheet className="h-4 w-4" />
            <span>Consolidated Panels Ledger Sheet</span>
          </button>
        </div>
        <div className="hidden md:block text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-medium">
          {activeTab === 'list'
            ? 'Showing individual collections and bill issues'
            : 'Consolidated overview across all active clients'}
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-3 w-full bg-slate-100/10 dark:bg-slate-900/10 p-2.5 rounded-2xl border border-slate-900/40">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500 dark:text-slate-500 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search panel client..."
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500/40"
              />
            </div>

            {/* Transaction Type Filter */}
            <div className="shrink-0">
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all font-semibold"
              >
                <option value="all" className="bg-slate-100 dark:bg-slate-900">All Transactions</option>
                <option value="bill" className="bg-slate-100 dark:bg-slate-900">Bills Only</option>
                <option value="received" className="bg-slate-100 dark:bg-slate-900">Payments Only</option>
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 shrink-0">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => e.target.showPicker()} // 👈 important
                className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs font-semibold"
              />
              <span className="text-slate-600  text-[9px] uppercase">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => e.target.showPicker()}
                className="w-full bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs font-semibold"

              />
            </div>

            {/* Charge Type Filter */}
            <div className="shrink-0">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all font-medium"
              >
                <option value="All" className="bg-slate-100 dark:bg-slate-900">All Charges</option>
                <option value="License" className="bg-slate-100 dark:bg-slate-900">License</option>
                <option value="IP Charges" className="bg-slate-100 dark:bg-slate-900">IP Charges</option>
                <option value="Maintenance" className="bg-slate-100 dark:bg-slate-900">Maintenance</option>
                <option value="Other" className="bg-slate-100 dark:bg-slate-900">Other</option>
              </select>
            </div>

            <div className="shrink-0">
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-xs glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all font-medium"
              >
                <option value="All" className="bg-slate-100 dark:bg-slate-900">All Modes</option>
                <option value="UPI" className="bg-slate-100 dark:bg-slate-900">UPI</option>
                <option value="Cash" className="bg-slate-100 dark:bg-slate-900">Cash</option>
                <option value="Bank Transfer" className="bg-slate-100 dark:bg-slate-900">Bank Transfer</option>
                <option value="Online" className="bg-slate-100 dark:bg-slate-900">Online</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {(startDate || endDate || transactionTypeFilter !== 'all' || typeFilter !== 'All' || modeFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTransactionTypeFilter('all');
                  setTypeFilter('All');
                  setModeFilter('All');
                  setSearchQuery('');
                }}
                className="text-[10px] uppercase  tracking-wider text-rose-400 hover:text-rose-300 transition-all bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 px-3 py-2 rounded-xl shrink-0"
              >
                Reset
              </button>
            )}
          </div>

          {/* Payments table */}
          {/* Payments table */}
          <div className="rounded-2xl bg-slate-50/60 bgw light:bg-slate-950/60 border border-slate-300/80 dark:border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 text-center w-14">S.No</th>
                    <th className="py-3.5 px-5">Date & Time</th>
                    <th className="py-3.5 px-5">Panel Client</th>
                    <th className="py-3.5 px-5">Billing Type</th>
                    <th className="py-3.5 px-5">Financial Details</th>
                    {/* <th className="py-3.5 px-5">Payment Mode</th> */}
                    <th className="py-3.5 px-5">Collected By</th>
                    <th className="py-3.5 px-4 text-center w-28">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-700 dark:text-slate-300">
                  {loading && payments.length === 0 ? (
                    <>
                      <SkeletonRow />
                      <SkeletonRow />
                      <SkeletonRow />
                    </>
                  ) : filteredPayments.map((p, index) => (
                    <tr key={p._id} className="hover:bg-slate-100/40 dark:hover:bg-slate-900/40 transition-colors duration-150 group">

                      {/* S.No */}
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {(currentPage - 1) * 10 + index + 1}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {new Date(p.timestamp).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Panel Client */}
                      <td className="py-3 px-5">
                        <div className="flex items-start gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center text-[11px] capitalize shrink-0">
                            {p.panelId?.panelName?.substring(0, 2)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-wide max-w-[180px] break-words leading-snug">
                            {p.panelId?.panelName || 'Deleted Panel'}
                          </span>
                        </div>
                      </td>

                      {/* Billing Type */}
                      <td className="py-3 px-5">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${p.paymentType === 'License'
                              ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-800'
                              : p.paymentType === 'IP Charges'
                                ? 'bg-violet-500/10 text-violet-700 border border-violet-800'
                                : p.paymentType === 'Maintenance'
                                  ? 'bg-amber-500/10 text-amber-700 border border-amber-800'
                                  : 'bg-emerald-500/10 text-emerald-700 border border-emerald-800'
                              }`}
                          >
                            {p.paymentType}
                          </span>
                          {(p.paymentType === 'License' || p.paymentType === 'IP Charges') &&
                            p.quantity !== undefined && p.quantity !== null &&
                            p.amountReceived < (p.billAmount - p.billDiscount) && (
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase ml-0.5">
                                Qty: {p.quantity}
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Financial Details */}
                      <td className="py-3 px-5">
                        <div className="flex flex-col gap-1">

                          {/* Status badge */}
                          <div>
                            {p.amountReceived === 0 ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-rose-700/10 text-rose-700 border border-rose-700">
                                Unpaid
                              </span>
                            ) : p.amountReceived < (p.billAmount - p.billDiscount) ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-amber-700/10 text-amber-700 border border-amber-700">
                                Partial (₹{(p.billAmount - p.billDiscount - p.amountReceived).toLocaleString()} due)
                              </span>
                            ) : null}
                          </div>

                          {p.billAmount > 0 ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Bill:</span>
                                <span className="text-slate-700 dark:text-slate-300 font-mono">₹{p.billAmount?.toLocaleString()}</span>
                              </div>
                              {p.billDiscount > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Disc:</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-mono">₹{p.billDiscount?.toLocaleString()}</span>
                                </div>
                              )}
                              {p.amountReceived > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Paid:</span>
                                  <span className={`font-extrabold font-mono ${p.amountReceived < (p.billAmount - p.billDiscount)
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                    ₹{p.amountReceived?.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Paid:</span>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                  ₹{p.amountReceived?.toLocaleString()}
                                </span>
                              </div>
                              {p.paymentDiscount > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase w-8">Disc:</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-mono">₹{p.paymentDiscount?.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </td>

                      {/* Payment Mode */}
                      {/* <td className="py-3 px-5">
                        {p.amountReceived > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 shrink-0 text-slate-500 dark:text-slate-400" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wide">
                              {p.paymentMode}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 font-semibold font-mono">-</span>
                        )}
                      </td> */}

                      {/* Collected By */}
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                          <span className="font-medium truncate max-w-[110px]">
                            {p.addedBy?.name || 'Staff User'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingPayment(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 text-xs transition-all shadow-md active:scale-95"
                            title="View Full Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {userRole === 'Admin' && (
                            <button
                              onClick={() => handleDeletePaymentClick(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 hover:border-transparent text-xs transition-all shadow-md active:scale-95"
                              title="Delete Transaction Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                  {filteredPayments.length === 0 && !loading && (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-600 dark:text-slate-400">
                        No payments recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-100/40 dark:bg-slate-900/40 border-t border-slate-300 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Showing <span className="text-indigo-400">{filteredPayments.length}</span> of{' '}
                <span className="text-slate-900 dark:text-white">{totalPaymentsCount}</span> ledger entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || loading}
                  className="rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-800 dark:text-slate-200 px-3.5 py-2 font-semibold transition-colors border border-slate-300 dark:border-slate-700"
                >
                  Previous
                </button>
                <span className="text-slate-600 dark:text-slate-400 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || loading}
                  className="rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-800 dark:text-slate-200 px-3.5 py-2 font-semibold transition-colors border border-slate-300 dark:border-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={`overflow-x-auto p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] p-6 overflow-auto bg-slate-50 dark:bg-slate-950' : ''}`}>
          <div className="flex items-center justify-between mb-4 text-xs font-mono border-b border-slate-300 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400  rounded">Sheet1</span>
              <span className="text-slate-600 dark:text-slate-400 ">Consolidated Panels Ledger Sheet</span>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700  text-[11px] transition-all shadow-md active:scale-95"
                title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Exit Full Screen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Full Screen View</span>
                  </>
                )}
              </button>
            </div>
            <span className="text-slate-500 dark:text-slate-500 dark:text-slate-500 hidden sm:inline">Formula Bar: <span className="text-indigo-400 ">f(x)</span> = Outstanding = Opening Balance + Total Bill - Paid</span>
          </div>

          <table className="w-full text-left border border-slate-300/60 dark:border-slate-700/60 font-mono text-[13px] md:text-sm border-collapse bg-slate-100/40 dark:bg-slate-900/40">
            <thead>
              {/* <tr className="bg-slate-200/80 dark:bg-slate-800/80 border-b border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500 dark:text-slate-500 text-center text-[10px]">
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 w-12 bg-slate-100 dark:bg-slate-900"></th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">A</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">B</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">C</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">D</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">E</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">F</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">G</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 py-1 bg-slate-100 dark:bg-slate-900">H</th>
                <th className="py-1 bg-slate-100 dark:bg-slate-900">I</th>
              </tr> */}
              <tr className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-b border-slate-300 dark:border-slate-700 font-black uppercase tracking-wider text-[13px] md:text-sm">
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 text-center text-slate-600 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/50 py-2.5 w-12">#</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-black">Panel Client</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-black">Owner Name</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">Opening Bal (₹)</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">License charges (₹)</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">IP charges (₹)</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black">Maint. charges (₹)</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-emerald-300 font-black">Total Paid (₹)</th>
                <th className="border-r border-slate-300/60 dark:border-slate-700/60 px-4 py-2.5 text-right bg-slate-200 dark:bg-slate-800 text-rose-300 font-black">Outstanding (₹)</th>
                <th className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-center text-indigo-300 font-black">Quick Ledger Link</th>
              </tr>
            </thead>
            <tbody>
              {panels.map((p, idx) => (
                <tr key={p._id} className="contents">
                  <tr
                    className={`border-b border-slate-300/80 dark:border-slate-800/80 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors ${idx % 2 === 0 ? 'bg-slate-100/10 dark:bg-slate-900/10' : 'bg-slate-50/20 dark:bg-slate-950/20'
                      }`}
                  >
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 dark:text-slate-500 dark:text-slate-500 bg-slate-200/10 dark:bg-slate-800/10 py-2.5  w-12">
                      {idx + 1}
                    </td>
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-slate-900 dark:text-white ">
                      {p.panelName}
                    </td>
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-slate-800 dark:text-slate-200 ">
                      {p.ownerName}
                    </td>
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100 ">
                      ₹{p.openingBalance?.toLocaleString() || '0'}
                    </td>
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100 ">
                      ₹{p.licenseCharges?.toLocaleString() || '0'}
                    </td>
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100 ">
                      ₹{p.ipCharges?.toLocaleString() || '0'}
                    </td>
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right text-slate-800 dark:text-slate-100 ">
                      ₹{p.maintenanceCharges?.toLocaleString() || '0'}
                    </td>
                    <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right font-black text-emerald-300 bg-emerald-500/15">
                      ₹{p.totalPaid?.toLocaleString() || '0'}
                    </td>
                    <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-4 py-2.5 text-right font-black transition-all ${p.outstanding > 0
                      ? 'bg-rose-500/15 text-rose-300'
                      : p.outstanding < 0
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-slate-200/20 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400'
                      }`}>
                      {p.outstanding < 0
                        ? `₹${Math.abs(p.outstanding).toLocaleString()} (Adv)`
                        : `₹${(p.outstanding || 0).toLocaleString()}`
                      }
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => toggleExpandPanel(p._id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-[10px] uppercase font-extrabold tracking-wider transition-all shadow active:scale-95 border ${expandedPanelId === p._id
                          ? 'bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-slate-900 dark:hover:text-white border-rose-500/20'
                          : 'bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-900 dark:hover:text-white border-indigo-500/20'
                          }`}
                      >
                        {expandedPanelId === p._id ? 'Close Ledger' : 'View Ledger'}
                      </button>
                    </td>
                  </tr>

                  {expandedPanelId === p._id && (
                    <tr className="bg-slate-50/40 dark:bg-slate-950/40 border-b border-slate-300/80 dark:border-slate-800/80">
                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 dark:text-slate-500 dark:text-slate-500 bg-slate-50/20 dark:bg-slate-950/20 py-4 ">
                        ↳
                      </td>
                      <td colSpan="9" className="p-4 bg-slate-50/10 dark:bg-slate-950/10">
                        <div className="space-y-4 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800pb-3 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                                Chronological Ledger: <span className="text-indigo-400 font-black">{p.panelName}</span>
                              </h4>
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-slate-500 dark:text-slate-500 uppercase font-black tracking-widest">
                              {expandedPanelPayments.length} transaction entries found
                            </span>
                          </div>

                          {expandedLoading ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800 animate-pulse">
                              <div className="flex items-center justify-between mb-2 text-[10px] font-mono px-1 py-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded">Sheet2</span>
                                  <span className="text-slate-600 dark:text-slate-400">Syncing Chronological Ledger...</span>
                                </div>
                              </div>
                              <table className="w-full text-left border border-slate-300 dark:border-slate-800 font-mono text-xs md:text-[13px] border-collapse bg-slate-100/10 dark:bg-slate-900/10">
                                <thead>
                                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 text-slate-600 text-center text-[9px]">
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[4%] bg-slate-50 dark:bg-slate-950"></th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[12%] bg-slate-50 dark:bg-slate-950">A</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[12%] bg-slate-50 dark:bg-slate-950">B</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[6%] bg-slate-50 dark:bg-slate-950">C</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">D</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[12%] bg-slate-50 dark:bg-slate-950">E</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[12%] bg-slate-50 dark:bg-slate-950">F</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[12%] bg-slate-50 dark:bg-slate-950">G</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[22%] bg-slate-50 dark:bg-slate-950">H</th>
                                    <th className="py-1 w-[10%] bg-slate-50 dark:bg-slate-950">I</th>
                                  </tr>
                                  <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-800 uppercase tracking-wider text-xs md:text-[13px]">
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 text-center text-slate-600 bg-slate-100 dark:bg-slate-900 py-2">#</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2">Date</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2">Type</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-center">Qty</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right">Rate</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right">Bill Amount</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right">Amt Paid</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right">Net Due</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2">Remarks / Note</th>
                                    <th className="px-3 py-2 text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[1, 2, 3, 4].map((n) => (
                                    <tr key={n} className="border-b border-slate-300/80 dark:border-slate-800/80 bg-slate-50/10 dark:bg-slate-950/10">
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center py-3 bg-slate-200/10 dark:bg-slate-800/10 text-slate-700 font-bold">
                                        {n + 1}
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded w-16 animate-pulse"></div>
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-5 bg-indigo-500/10 border border-indigo-500/15 rounded w-14 animate-pulse"></div>
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded w-8 mx-auto animate-pulse"></div>
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded w-12 ml-auto animate-pulse"></div>
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-3.5 bg-amber-500/10 rounded w-14 ml-auto animate-pulse"></div>
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-3.5 bg-emerald-500/10 rounded w-14 ml-auto animate-pulse"></div>
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-3.5 bg-rose-500/10 rounded w-14 ml-auto animate-pulse"></div>
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-3">
                                        <div className="h-3.5 bg-slate-200/80 dark:bg-slate-800/80 rounded w-28 animate-pulse"></div>
                                      </td>
                                      <td className="px-3 py-3">
                                        <div className="flex gap-1.5 justify-center">
                                          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded animate-pulse"></div>
                                          <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded animate-pulse"></div>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-800">
                              <div className="flex items-center justify-between mb-2 text-[10px] font-mono px-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400  rounded">Sheet2</span>
                                  <span className="text-slate-600 dark:text-slate-400 ">Transaction Ledger</span>
                                </div>
                                <span className="text-slate-500 dark:text-slate-500 dark:text-slate-500 text-[9px] hidden sm:inline">Formula Bar: <span className="text-indigo-400 ">f(x)</span> = Outstanding = SUM(E - F) - SUM(G + H)</span>
                              </div>

                              <table className="w-full text-left border border-slate-300 dark:border-slate-800 font-mono text-xs md:text-[13px] border-collapse bg-slate-100/10 dark:bg-slate-900/10">
                                <thead>
                                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 text-slate-600 text-center text-[9px]">
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[4%] bg-slate-50 dark:bg-slate-950"></th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">A</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">B</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[5%] bg-slate-50 dark:bg-slate-950">C</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[8%] bg-slate-50 dark:bg-slate-950">D</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">E</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">F</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">G</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">H</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[10%] bg-slate-50 dark:bg-slate-950">I</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 py-1 w-[18%] bg-slate-50 dark:bg-slate-950">J</th>
                                    <th className="py-1 w-[8%] bg-slate-50 dark:bg-slate-950">K</th>
                                  </tr>
                                  <tr className="bg-slate-100/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-800  uppercase tracking-wider text-xs md:text-[13px]">
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 text-center text-slate-600 bg-slate-100 dark:bg-slate-900 py-2 w-[4%]">#</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Date</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Type</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-center w-[5%] bg-slate-100/50 dark:bg-slate-900/50">Qty</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[8%] bg-slate-100/50 dark:bg-slate-900/50">Rate</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Bill Amount</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Bill Discount</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Amt Paid</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Pay Discount</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 text-right w-[10%] bg-slate-100/50 dark:bg-slate-900/50">Net Due</th>
                                    <th className="border-r border-slate-300/60 dark:border-slate-800/60 px-3 py-2 bg-slate-100/50 dark:bg-slate-900/50 w-[18%]">Remarks / Note</th>
                                    <th className="px-3 py-2 text-center bg-slate-100/50 dark:bg-slate-900/50 w-[8%]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {getLast30DaysData(expandedPanelPayments).map((row, hIdx) => (
                                    <tr
                                      key={row.id}
                                      className={`border-b border-slate-300/80 dark:border-slate-800/80 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors ${row.hasData
                                        ? 'bg-indigo-500/5 font-semibold text-slate-900 dark:text-white'
                                        : hIdx % 2 === 0
                                          ? 'bg-slate-50/10 dark:bg-slate-950/10'
                                          : 'bg-slate-50/30 dark:bg-slate-950/30'
                                        }`}
                                    >
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 text-center text-slate-500 dark:text-slate-500 dark:text-slate-500 py-2">
                                        {hIdx + 2}
                                      </td>

                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-2 text-slate-700 dark:text-slate-300">
                                        {row.displayDate}
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-2">
                                        {row.paymentType !== "-" ? (
                                          <span
                                            className={`px-3 py-1 rounded text-sm md:text-base font-semibold uppercase tracking-wider ${row.paymentType === "License"
                                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/40"
                                              : row.paymentType === "IP Charges"
                                                ? "bg-violet-500/20 text-violet-300 border border-violet-400/40"
                                                : "bg-amber-400/20 text-amber-200 border border-amber-400/50"
                                              }`}
                                          >
                                            {row.paymentType}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                      <td
                                        className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-center ${row.hasData ? 'cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white group' : 'text-slate-600 dark:text-slate-400'}`}
                                        onClick={() => row.hasData && setEditingCell({ paymentId: row.originalPayment._id, field: 'quantity', value: row.quantity })}
                                      >
                                        {editingCell && editingCell.paymentId === row.originalPayment?._id && editingCell.field === 'quantity' ? (
                                          <input
                                            type="number"
                                            className="w-16 bg-slate-50 dark:bg-slate-950 border border-indigo-500 rounded px-1 text-center text-xs text-indigo-300 font-mono focus:outline-none"
                                            value={editingCell.value}
                                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                            onBlur={() => handleInlineCellSave(row.originalPayment, 'quantity', editingCell.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleInlineCellSave(row.originalPayment, 'quantity', editingCell.value);
                                              if (e.key === 'Escape') setEditingCell(null);
                                            }}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                                            <span>{row.quantity}</span>
                                            {row.hasData && <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>}
                                          </div>
                                        )}
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right text-slate-600 dark:text-slate-400">
                                        {row.unitPrice !== '-' ? `₹${row.unitPrice.toLocaleString()}` : '-'}
                                      </td>
                                      <td
                                        className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right  ${row.billAmount > 0 ? 'text-amber-400 bg-amber-400/5' : 'text-slate-500 dark:text-slate-500 dark:text-slate-500'} ${row.hasData ? 'cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white group' : ''}`}
                                        onClick={() => row.hasData && setEditingCell({ paymentId: row.originalPayment._id, field: 'billAmount', value: row.billAmount })}
                                      >
                                        {editingCell && editingCell.paymentId === row.originalPayment?._id && editingCell.field === 'billAmount' ? (
                                          <input
                                            type="number"
                                            className="w-20 bg-slate-50 dark:bg-slate-950 border border-indigo-500 rounded px-1 text-right text-xs text-indigo-300 font-mono  focus:outline-none"
                                            value={editingCell.value}
                                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                            onBlur={() => handleInlineCellSave(row.originalPayment, 'billAmount', editingCell.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleInlineCellSave(row.originalPayment, 'billAmount', editingCell.value);
                                              if (e.key === 'Escape') setEditingCell(null);
                                            }}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-end gap-1">
                                            <span>₹{row.billAmount.toLocaleString()}</span>
                                            {row.hasData && <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ">✏️</span>}
                                          </div>
                                        )}
                                      </td>
                                      <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right  ${row.billDiscount > 0 ? 'text-orange-400 bg-orange-400/5' : 'text-slate-500 dark:text-slate-500 dark:text-slate-500'}`}>
                                        ₹{row.billDiscount.toLocaleString()}
                                      </td>
                                      <td
                                        className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right  ${row.amountReceived > 0 ? 'text-emerald-400 bg-emerald-400/5' : 'text-slate-500 dark:text-slate-500 dark:text-slate-500'} ${row.hasData ? 'cursor-pointer hover:bg-slate-200/40 dark:hover:bg-slate-800/40 hover:text-emerald-300 group' : ''}`}
                                        onClick={() => row.hasData && setEditingCell({ paymentId: row.originalPayment._id, field: 'amountReceived', value: row.amountReceived })}
                                      >
                                        {editingCell && editingCell.paymentId === row.originalPayment?._id && editingCell.field === 'amountReceived' ? (
                                          <input
                                            type="number"
                                            className="w-20 bg-slate-50 dark:bg-slate-950 border border-emerald-500 rounded px-1 text-right text-xs text-emerald-300 font-mono  focus:outline-none"
                                            value={editingCell.value}
                                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                            onBlur={() => handleInlineCellSave(row.originalPayment, 'amountReceived', editingCell.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleInlineCellSave(row.originalPayment, 'amountReceived', editingCell.value);
                                              if (e.key === 'Escape') setEditingCell(null);
                                            }}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <div className="flex items-center justify-end gap-1">
                                            <span>₹{row.amountReceived.toLocaleString()}</span>
                                            {row.hasData && <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ">✏️</span>}
                                          </div>
                                        )}
                                      </td>
                                      <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right  ${row.paymentDiscount > 0 ? 'text-rose-400 bg-rose-400/5' : 'text-slate-500 dark:text-slate-500 dark:text-slate-500'}`}>
                                        ₹{row.paymentDiscount.toLocaleString()}
                                      </td>
                                      <td className={`border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-right  ${(row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount) > 0 ? 'text-rose-400 bg-rose-400/5' : 'text-slate-500 dark:text-slate-500 dark:text-slate-500'}`}>
                                        ₹{((row.billAmount - row.billDiscount) - (row.amountReceived + row.paymentDiscount)).toLocaleString()}
                                      </td>
                                      <td className="border-r border-slate-300/40 dark:border-slate-700/40 px-3 py-1.5 text-slate-600 dark:text-slate-400 truncate max-w-[200px] font-sans" title={row.remark}>
                                        {row.remark}
                                      </td>
                                      <td className="px-3 py-1.5 text-center">
                                        {row.hasData ? (
                                          <div className="flex items-center justify-center gap-1.5">
                                            <button
                                              onClick={() => setViewingPayment(row.originalPayment)}
                                              className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition-all shadow"
                                              title="View Full Details / Audit logs"
                                            >
                                              <Eye className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              onClick={() => setSelectedReceiptPayment(row.originalPayment)}
                                              className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-slate-900 dark:hover:text-white border border-indigo-500/10 hover:border-transparent transition-all shadow"
                                              title="Generate Print Receipt"
                                            >
                                              <Printer className="h-3.5 w-3.5" />
                                            </button>
                                            {userRole === 'Admin' && (
                                              <button
                                                onClick={() => handleDeletePaymentClick(row.originalPayment)}
                                                className="p-1 rounded bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 hover:border-transparent transition-all shadow active:scale-95"
                                                title="Delete Transaction Record"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-slate-600 font-semibold text-[10px]">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}

                                  {/* Sheet2 Summary Formula Row */}
                                  <tr className="bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800  text-slate-900 dark:text-white text-[11px]">
                                    <td className="border-r border-slate-300 dark:border-slate-800 text-center text-slate-500 dark:text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 py-2.5">
                                      {getLast30DaysData(expandedPanelPayments).length + 2}
                                    </td>
                                    <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 uppercase tracking-wider text-slate-600 dark:text-slate-400 text-[9px]" colSpan="5">
                                      =SUM(E2:E{getLast30DaysData(expandedPanelPayments).length + 1}) - SUM(F2:F{getLast30DaysData(expandedPanelPayments).length + 1}) - SUM(G2:G{getLast30DaysData(expandedPanelPayments).length + 1}) - SUM(H2:H{getLast30DaysData(expandedPanelPayments).length + 1})
                                    </td>
                                    <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-amber-400 bg-amber-500/5">
                                      ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.billAmount, 0).toLocaleString()}
                                    </td>
                                    <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-orange-400 bg-orange-500/5">
                                      ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.billDiscount, 0).toLocaleString()}
                                    </td>
                                    <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-emerald-400 bg-emerald-500/5">
                                      ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.amountReceived, 0).toLocaleString()}
                                    </td>
                                    <td className="border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right text-rose-400 bg-rose-500/5">
                                      ₹{getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + r.paymentDiscount, 0).toLocaleString()}
                                    </td>
                                    {(() => {
                                      const netVal = getLast30DaysData(expandedPanelPayments).reduce((sum, r) => sum + (r.billAmount - r.billDiscount) - (r.amountReceived + r.paymentDiscount), 0);
                                      return (
                                        <td className={`border-r border-slate-300 dark:border-slate-800 px-3 py-2.5 text-right  transition-all ${netVal > 0
                                          ? 'text-rose-400 bg-rose-500/5'
                                          : netVal < 0
                                            ? 'text-emerald-400 bg-emerald-500/5'
                                            : 'text-slate-500 dark:text-slate-500 dark:text-slate-500 bg-slate-200/10 dark:bg-slate-800/10'
                                          }`}>
                                          {netVal < 0 ? `₹${Math.abs(netVal).toLocaleString()}` : `₹${netVal.toLocaleString()}`}
                                        </td>
                                      );
                                    })()}
                                    <td className="px-3 py-2.5 text-indigo-400 font-semibold italic text-[10px]" colSpan="2">
                                      Total Ledger Activity Summary
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tr>
              ))}

              {/* Excel Summary Row */}
              <tr className="bg-slate-200/80 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700  text-slate-900 dark:text-white text-xs">
                <td className="border-r border-slate-300 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 py-3 w-12">
                  {panels.length + 1}
                </td>
                <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 uppercase tracking-wider text-slate-600 dark:text-slate-400 text-[10px]" colSpan="2">
                  =SUM(C2:C{panels.length + 1}) ...
                </td>
                <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                  ₹{panels.reduce((sum, p) => sum + (p.openingBalance || 0), 0).toLocaleString()}
                </td>
                <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-slate-600 dark:text-slate-400" colSpan="3">
                  Total Sheets Activity
                </td>
                <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-emerald-400 bg-emerald-500/5">
                  ₹{panels.reduce((sum, p) => sum + (p.totalPaid || 0), 0).toLocaleString()}
                </td>
                <td className="border-r border-slate-300 dark:border-slate-700 px-4 py-3 text-right text-rose-400 bg-rose-500/5">
                  ₹{panels.reduce((sum, p) => sum + (p.outstanding || 0), 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-indigo-400  text-center">
                  All Clients Active Summary
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* RECEIVE PAYMENT / GENERATE BILL FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-3xl rounded-2xl glass-card p-6 md:p-8 border border-slate-300 dark:border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
              <h3 className="text-xl  text-slate-900 dark:text-white">
                {modalMode === 'receive' ? 'Collect / Receive Client Payment' : 'Generate / Create Client Bill'}
              </h3>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              {/* Row 1: Select Panel & Transaction Date & Dues/Types depending on Mode */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Select Panel (Client)
                  </label>
                  <select
                    value={selectedPanelId}
                    onChange={(e) => setSelectedPanelId(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
                    required
                  >
                    <option className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white" value="">-- Select a Client --</option>
                    {panels.map((p) => (
                      <option key={p._id} value={p._id} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white py-2">
                        {p.panelName} ({p.ownerName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Transaction Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
                    required
                  />
                </div>

                {modalMode === 'receive' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full rounded-xl px-4 py-3 text-sm glass-input  text-slate-900 dark:text-white text-base"
                      min="1"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Bill / Charge Type
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
                      required
                    >
                      <option value="Maintenance" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Maintenance Support</option>
                      <option value="License" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">License Charges</option>
                      <option value="IP Charges" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">IP Charges</option>
                      <option value="Other" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Other Charges</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Outstanding dues info box */}
              {selectedPanelDetails && (
                <div className="rounded-xl bg-slate-100/60 dark:bg-slate-900/60 p-4 border border-slate-300 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Client Owner:</p>
                    <p className=" text-slate-900 dark:text-white text-sm mt-0.5">{selectedPanelDetails.ownerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-600 dark:text-slate-400">{(selectedPanelDetails?.outstanding || 0) < 0 ? 'Advance Credit Balance:' : 'Ledger Outstanding Dues:'}</p>
                    <p className={` text-sm mt-0.5 ${(selectedPanelDetails?.outstanding || 0) > 0
                      ? 'text-rose-400'
                      : (selectedPanelDetails?.outstanding || 0) < 0
                        ? 'text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400'
                      }`}>
                      {(selectedPanelDetails?.outstanding || 0) < 0
                        ? `₹${Math.abs(selectedPanelDetails.outstanding).toLocaleString()}`
                        : `₹${(selectedPanelDetails?.outstanding || 0).toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Receive Mode Specific fields */}
              {modalMode === 'receive' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
                      required
                    >
                      <option value="UPI" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">UPI Transfer</option>
                      <option value="Cash" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Cash Receipt</option>
                      <option value="Bank Transfer" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Bank Transfer</option>
                      <option value="Online" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Online Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Payment Category (Optional)
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer"
                      required
                    >
                      <option value="Other" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">General / Other Payment</option>
                      <option value="License" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">License Payment</option>
                      <option value="IP Charges" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">IP Charges Payment</option>
                      <option value="Maintenance" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">Maintenance Payment</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Payment Discount Toggle */}
              {modalMode === 'receive' && (
                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentDiscount(!showPaymentDiscount);
                      if (showPaymentDiscount) {
                        setPaymentDiscount('');
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold shadow-sm ${showPaymentDiscount
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={showPaymentDiscount}
                      onChange={() => { }} // handled by button click
                      className="rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Apply Payment Discount?</span>
                  </button>
                </div>
              )}

              {modalMode === 'receive' && showPaymentDiscount && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-in slide-in-from-top-1">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Payment Discount (₹) {userRole !== 'Admin' && <span className="text-rose-400 font-mono text-[9px] lowercase">(Admin Only)</span>}
                    </label>
                    <input
                      type="number"
                      value={paymentDiscount}
                      onChange={(e) => setPaymentDiscount(e.target.value)}
                      placeholder={userRole === 'Admin' ? "e.g. 1000" : "Requires Admin permissions"}
                      disabled={userRole !== 'Admin'}
                      className={`w-full rounded-xl px-4 py-3 text-sm glass-input text-rose-400 text-base font-mono ${userRole !== 'Admin' ? 'opacity-40 cursor-not-allowed bg-slate-50/60 dark:bg-slate-950/60' : ''
                        }`}
                      min="0"
                    />
                  </div>
                </div>
              )}

              {/* Bill Mode Specific fields */}
              {modalMode === 'bill' && (
                <>
                  {/* License or IP Charges: Quantity & Price Calculator */}
                  {(paymentType === 'License' || paymentType === 'IP Charges') ? (
                    <div className="rounded-xl bg-indigo-500/5 p-4 border border-indigo-500/10 space-y-3 animate-in slide-in-from-top-1">
                      <p className="text-xs  text-indigo-400 uppercase tracking-wider">Recharge Billing & Price Calculator</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            Unit Price (₹) (Editable)
                          </label>
                          <input
                            type="number"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value)}
                            className="w-full rounded-xl px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white "
                            required
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            Purchase Quantity
                          </label>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full rounded-xl px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white "
                            required
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                            Calculated Bill Amount (₹)
                          </label>
                          <div className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-emerald-400  flex items-center justify-between">
                            <span>₹</span>
                            <span>{(Number(unitPrice || 0) * (quantity === '' ? 0 : Number(quantity))).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Maintenance or Other: Direct Amount Entry */
                    <div className="animate-in slide-in-from-top-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                        Enter Bill Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={billAmountInput}
                        onChange={(e) => setBillAmountInput(e.target.value)}
                        placeholder="e.g. 10000 for maintenance charges"
                        className="w-full rounded-xl px-4 py-3 text-sm glass-input  text-emerald-400 text-base"
                        min="1"
                        required
                      />
                    </div>
                  )}
                  {/* Bill Discount Toggle */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBillDiscount(!showBillDiscount);
                        if (showBillDiscount) {
                          setBillDiscount('');
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold shadow-sm ${showBillDiscount
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={showBillDiscount}
                        onChange={() => { }} // handled by button click
                        className="rounded border-slate-300 dark:border-slate-700 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Apply Bill Discount?</span>
                    </button>
                  </div>

                  {showBillDiscount && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 animate-in slide-in-from-top-1">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                          Bill Discount (₹) (Optional)
                        </label>
                        <input
                          type="number"
                          value={billDiscount}
                          onChange={(e) => setBillDiscount(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full rounded-xl px-4 py-3 text-sm glass-input text-rose-450 text-rose-450 text-rose-400 text-base font-mono"
                          min="0"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Receiving Bank Row for Receive Mode */}
              {modalMode === 'receive' && paymentMode !== 'Cash' && Number(amountReceived || 0) > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Select Receiving Bank
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white cursor-pointer font-medium"
                    required
                  >
                    <option value="" className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white" >-- Select Receiving Bank --</option>
                    {banks.map((bank) => (
                      <option key={bank} value={bank} className="bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
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
                  className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`
    flex-1 flex items-center justify-center gap-2
    px-5 py-2.5
    rounded-lg
    bg-purple-600
    text-white
    text-sm font-semibold
    hover:bg-purple-700
    ${submitting ? "opacity-50 cursor-not-allowed" : ""}
  `}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>

                      {modalMode === "receive"
                        ? "Processing Payment..."
                        : "Generating Bill..."}
                    </>
                  ) : modalMode === "receive" ? (
                    "Confirm Payment Receipt"
                  ) : (
                    "Create & Save Bill"
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={handleConfirmDeletePayment}
        title="Delete Transaction Record?"
        message="Are you sure you want to delete this payment/billing entry? This action is permanent and will log an audit log for accountability."
        confirmText="Confirm Delete"
        cancelText="Cancel"
      />

      {/* View Full Transaction Details Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div onClick={() => setViewingPayment(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <button
              onClick={() => setViewingPayment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-6 border-b border-slate-100 pb-5">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center border shadow-inner ${viewingPayment.billAmount > 0
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-slate-900 tracking-wide">
                  {viewingPayment.billAmount > 0 ? 'Transaction Details (Bill Generated)' : 'Transaction Details (Payment Collected)'}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {viewingPayment._id}</p>
              </div>
            </div>

            {/* Content Details Grid */}
            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin">
              {/* Panel Client Info */}
              <div className="bg-white border border-slate-200/80 border-l-4 border-l-indigo-600 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Panel Client Details</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Panel Name</span>
                    <span className="text-slate-800 text-sm font-semibold">{viewingPayment.panelId?.panelName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Owner Name</span>
                    <span className="text-slate-800 text-sm font-semibold">{viewingPayment.panelId?.ownerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Owner Email</span>
                    <span className="font-semibold text-slate-800">{viewingPayment.panelId?.ownerEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Phone Number</span>
                    <span className="font-semibold text-slate-800">{viewingPayment.panelId?.phoneNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Transaction / Financial Details */}
              <div className="bg-white border border-slate-200/80 border-l-4 border-l-emerald-600 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">Financial Ledger Details</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Billing Type</span>
                    <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {viewingPayment.paymentType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Date & Time</span>
                    <span className="font-semibold text-slate-800">{new Date(viewingPayment.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Status</span>
                    {viewingPayment.billAmount > 0 ? (
                      viewingPayment.amountReceived === 0 ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          Unpaid
                        </span>
                      ) : viewingPayment.amountReceived < viewingPayment.billAmount ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Partially Paid
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Fully Paid
                        </span>
                      )
                    ) : (
                      <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Direct Payment
                      </span>
                    )}
                  </div>
                  {viewingPayment.billAmount > 0 && (
                    <>
                      <div>
                        <span className="text-slate-500 block mb-1 font-medium">Quantity</span>
                        <span className="text-slate-800 font-semibold font-mono">{viewingPayment.quantity !== undefined && viewingPayment.quantity !== null ? viewingPayment.quantity : 1}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1 font-medium">Unit Price</span>
                        <span className="text-slate-800 font-semibold font-mono">₹{viewingPayment.unitPrice?.toLocaleString() || '0'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1 font-medium">Total Bill Amount</span>
                        <span className="font-bold text-indigo-600 font-mono text-base">₹{viewingPayment.billAmount?.toLocaleString() || '0'}</span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-slate-500 block mb-1 font-medium">Amount Paid / Received</span>
                    <span className="font-bold text-emerald-600 font-mono text-base">₹{viewingPayment.amountReceived?.toLocaleString() || '0'}</span>
                  </div>
                  {viewingPayment.amountReceived > 0 && (
                    <div>
                      <span className="text-slate-500 block mb-1 font-medium">Payment Mode</span>
                      <span className="text-slate-800 font-semibold">{viewingPayment.paymentMode}</span>
                    </div>
                  )}
                  {viewingPayment.amountReceived > 0 && (
                    <div>
                      <span className="text-slate-500 block mb-1 font-medium">Bank Name</span>
                      <span className="font-semibold text-slate-800">{viewingPayment.bankName || 'N/A'}</span>
                    </div>
                  )}
                  {viewingPayment.billDiscount > 0 && (
                    <div>
                      <span className="text-slate-500 block mb-1 font-medium">Bill Discount Applied</span>
                      <span className="font-bold text-orange-600 font-mono text-base">-₹{viewingPayment.billDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {viewingPayment.paymentDiscount > 0 && (
                    <div>
                      <span className="text-slate-500 block mb-1 font-medium">Payment Discount Applied</span>
                      <span className="font-bold text-rose-500 font-mono text-base">-₹{viewingPayment.paymentDiscount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Added By & Remarks */}
              <div className="bg-white border border-slate-200/80 border-l-4 border-l-amber-500 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600">Audit & Comments</div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium w-24 block shrink-0">Recorded By:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[9px] uppercase border border-slate-300">
                        {viewingPayment.addedBy?.name?.substring(0, 2)}
                      </div>
                      <span className="text-slate-800 font-semibold">{viewingPayment.addedBy?.name || 'Staff User'}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({viewingPayment.addedBy?.email || 'System Staff'})</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block mb-1.5">Remarks / Remarks Description:</span>
                    <div className="bg-slate-50/60 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-4 text-slate-700 font-medium italic leading-relaxed">
                      {viewingPayment.remark ? (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{viewingPayment.remark}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">No remark provided for this transaction.</span>
                      )}
                    </div>
                  </div>
                  {viewingPayment.editHistory && viewingPayment.editHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <span className="text-slate-600 block mb-2 font-semibold">Previous Edit Logs (Transparency Tracker):</span>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                        {viewingPayment.editHistory.map((history, idx) => (
                          <div key={idx} className="bg-slate-50/60 dark:bg-slate-900 border border-slate-200/80 rounded-xl p-3.5 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-amber-700 font-semibold">Edited By: {history.editedBy?.name || 'Staff Admin'}</span>
                              <span className="text-slate-500 font-mono">{new Date(history.editedAt).toLocaleString()}</span>
                            </div>
                            <div className="text-slate-700 leading-normal font-medium">{history.changes}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-4 mt-6 pt-5 border-t border-slate-200">

              {/* Close Button */}
              <button
                onClick={() => setViewingPayment(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 active:scale-95 shadow-sm"
              >
                Close View
              </button>

              {/* Edit Button */}
              <button
                onClick={() => handleOpenEditModal(viewingPayment)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-500 hover:text-white hover:border-transparent transition-all duration-200 active:scale-95 shadow-sm"
                title="Edit this entry"
              >
                ✏️ <span>Edit Entry</span>
              </button>

              {/* Print Button */}
              <button
                onClick={() => {
                  setSelectedReceiptPayment(viewingPayment);
                  setViewingPayment(null);
                }}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 active:scale-95"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div onClick={() => setEditingPayment(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 md:p-8 border border-slate-200 shadow-2xl z-10 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setEditingPayment(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold font-display text-slate-900 tracking-wide">
                Edit Transaction Entry (Correction Desk)
              </h3>
              <p className="text-xs text-amber-600 mt-1 font-medium">
                ⚠️ Modifying this entry will automatically log an audit trail for transparency.
              </p>
            </div>

            <form onSubmit={handleUpdatePayment} className="space-y-4">
              {/* Transaction Date Row */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Transaction Date</label>
                <input
                  type="date"
                  value={editForm.timestamp}
                  onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                  className="w-full premium-input px-4 py-2.5 text-sm cursor-pointer font-semibold"
                  required
                />
              </div>

              {/* Conditional Input Fields depending on whether it is a Bill or Payment */}
              {editingPayment.billAmount > 0 ? (
                /* It's a Bill Generated */
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Billing Type</label>
                      <select
                        value={editForm.paymentType}
                        onChange={(e) => setEditForm({ ...editForm, paymentType: e.target.value })}
                        className="w-full premium-input px-4 py-2.5 text-sm font-semibold"
                        required
                      >
                        <option value="License">License Charges</option>
                        <option value="IP Charges">IP Charges</option>
                        <option value="Maintenance">Maintenance Charges</option>
                        <option value="Other">Other Charges</option>
                      </select>
                    </div>

                    {(editForm.paymentType === 'License' || editForm.paymentType === 'IP Charges') ? (
                      <>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Quantity</label>
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                            className="w-full premium-input px-4 py-2.5 text-sm font-mono font-semibold"
                            placeholder="e.g. 10"
                            required
                            min="1"
                          />
                        </div>
                      </>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Total Bill Amount (₹)</label>
                        <input
                          type="number"
                          value={editForm.billAmount}
                          onChange={(e) => setEditForm({ ...editForm, billAmount: e.target.value })}
                          className="w-full premium-input px-4 py-2.5 text-sm font-mono font-semibold"
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
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Unit Price (₹)</label>
                        <input
                          type="number"
                          value={editForm.unitPrice}
                          onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                          className="w-full premium-input px-4 py-2.5 text-sm font-mono font-semibold"
                          placeholder="Price per unit"
                          required
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Auto Bill Total</label>
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-indigo-600">
                          ₹{((Number(editForm.quantity) || 0) * (Number(editForm.unitPrice) || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* It's a Direct Payment Collected */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount Received (₹)</label>
                    <input
                      type="number"
                      value={editForm.amountReceived}
                      onChange={(e) => setEditForm({ ...editForm, amountReceived: e.target.value })}
                      className="w-full premium-input px-4 py-2.5 text-sm font-mono font-semibold"
                      placeholder="Amount in ₹"
                      required
                      min="1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Payment Mode</label>
                      <select
                        value={editForm.paymentMode}
                        onChange={(e) => setEditForm({ ...editForm, paymentMode: e.target.value })}
                        className="w-full premium-input px-4 py-2.5 text-sm font-semibold"
                        required
                      >
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Online">Online Payment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5">Bank Name</label>
                      <select
                        value={editForm.bankName}
                        onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                        className="w-full premium-input px-4 py-2.5 text-sm font-semibold"
                      >
                        <option value="">N/A (Cash / None)</option>
                        {banks.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Correction Remarks / Reason for Change</label>
                <textarea
                  value={editForm.remark}
                  onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                  className="w-full premium-input px-4 py-2.5 text-sm h-20 resize-none leading-relaxed font-semibold"
                  placeholder="Describe the reason for correcting this entry..."
                  required
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-5 mt-6 border-t border-slate-200">

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 active:scale-95 shadow-sm"
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
      )}
    </div>
  );
}
