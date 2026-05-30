import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest, getLoggedUser } from '@/utils/api';
import ConfirmModal from '@/components/ConfirmModal';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  X,
  Check,
  AlertCircle,
  Hash,
  Globe,
  Wrench,
  DollarSign,
  Phone,
  Mail,
  User as UserIcon,
  Info,
} from 'lucide-react';

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 w-6 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-2">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3.5 w-24 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
        <div className="h-3 w-28 rounded bg-slate-200/40 dark:bg-slate-800/40"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
    </td>
    <td className="px-6 py-4">
      <div className="space-y-1.5">
        <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-3 w-24 rounded bg-slate-200/60 dark:bg-slate-800/60"></div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-center gap-2">
        <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-9 w-9 rounded bg-slate-200 dark:bg-slate-800"></div>
      </div>
    </td>
  </tr>
);

export default function Panels() {
  const location = useLocation();
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('Algo');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('All'); // 'All', 'Outstanding', 'Advance'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'name-asc', 'name-desc', 'balance-desc', 'balance-asc'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPanelId, setEditPanelId] = useState(null); // null = add, string = edit
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [panelToDelete, setPanelToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Dues Modal State
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);
  const [selectedDuesPanel, setSelectedDuesPanel] = useState(null);

  // Form Fields
  const [panelName, setPanelName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [licenseCharges, setLicenseCharges] = useState(0);
  const [ipCharges, setIpCharges] = useState(0);
  const [maintenanceCharges, setMaintenanceCharges] = useState(0);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [formErrors, setFormErrors] = useState({});

  const fetchPanels = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await apiRequest('/panels');
      if (data.success) {
        setPanels(data.panels);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch panels list');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories list:', err);
    }
  };

  useEffect(() => {
    fetchPanels();
    fetchCategories();
    setUser(getLoggedUser());
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchParam = queryParams.get('search');
    const categoryParam = queryParams.get('category');
    const balanceParam = queryParams.get('balance');

    setSearchQuery(searchParam !== null ? searchParam : '');
    setSelectedCategoryFilter(categoryParam !== null ? categoryParam : 'All');
    setBalanceFilter(balanceParam !== null ? balanceParam : 'All');
  }, [location.search]);

  const handleOpenAddModal = () => {
    setError('');
    setSuccess('');
    setEditPanelId(null);
    setPanelName('');
    setOwnerName('');
    setOwnerEmail('');
    setPhoneNumber('');
    setCategory('Algo');

    // Load Billing Defaults from system settings
    let defaultL = 0;
    let defaultI = 0;
    let defaultM = 0;
    try {
      const savedSettings = localStorage.getItem('app_system_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.defaultLicense) defaultL = Number(parsed.defaultLicense);
        if (parsed.defaultIp) defaultI = Number(parsed.defaultIp);
        if (parsed.defaultMaint) defaultM = Number(parsed.defaultMaint);
      }
    } catch (e) {
      console.error('Failed to load billing defaults', e);
    }

    setLicenseCharges(defaultL);
    setIpCharges(defaultI);
    setMaintenanceCharges(defaultM);
    setOpeningBalance(0);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (panel) => {
    setError('');
    setSuccess('');
    setEditPanelId(panel._id);
    setPanelName(panel.panelName);
    setOwnerName(panel.ownerName);
    setOwnerEmail(panel.ownerEmail);
    setPhoneNumber(panel.phoneNumber);
    setCategory(panel.category || 'Algo');
    setLicenseCharges(panel.licenseCharges);
    setIpCharges(panel.ipCharges);
    setMaintenanceCharges(panel.maintenanceCharges);
    setOpeningBalance(panel.openingBalance);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSavePanel = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormErrors({});
    setSubmitting(true);

    const errors = {};
    if (!panelName || panelName.trim().length < 3) {
      errors.panelName = 'Panel name must be at least 3 characters long.';
    }
    if (!ownerName || ownerName.trim().length < 3) {
      errors.ownerName = 'Owner name must be at least 3 characters long.';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!ownerEmail || !emailRegex.test(ownerEmail)) {
      errors.ownerEmail = 'Invalid email format (e.g. name@domain.com).';
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber) {
      errors.phoneNumber = 'Phone number is required.';
    } else if (cleanPhone.length !== 10) {
      errors.phoneNumber = 'Phone number must be exactly 10 digits.';
    }

    if (Number(licenseCharges) < 0) {
      errors.licenseCharges = 'License charges cannot be negative.';
    }
    if (Number(ipCharges) < 0) {
      errors.ipCharges = 'IP routing charges cannot be negative.';
    }
    if (Number(maintenanceCharges) < 0) {
      errors.maintenanceCharges = 'Maintenance support charges cannot be negative.';
    }
    if (Number(openingBalance) < 0) {
      errors.openingBalance = 'Opening balance cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setError('Please correct the validation errors below.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        panelName,
        ownerName,
        ownerEmail,
        phoneNumber,
        category,
        licenseCharges: Number(licenseCharges),
        ipCharges: Number(ipCharges),
        maintenanceCharges: Number(maintenanceCharges),
        openingBalance: Number(openingBalance),
      };

      if (editPanelId) {
        const data = await apiRequest(`/panels/${editPanelId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (data.success) {
          setSuccess(`Panel "${panelName}" updated successfully!`);
          fetchPanels(true);
          setIsModalOpen(false);
        }
      } else {
        const data = await apiRequest('/panels', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (data.success) {
          setSuccess(`Panel "${panelName}" added successfully!`);
          fetchPanels(true);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePanel = (panel) => {
    setPanelToDelete(panel);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeletePanel = async () => {
    if (!panelToDelete) return;
    setError('');
    setSuccess('');

    try {
      const data = await apiRequest(`/panels/${panelToDelete._id}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(`Panel "${panelToDelete.panelName}" and associated history deleted.`);
        fetchPanels(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to remove panel');
    }
  };

  const filteredPanels = panels
    .filter((p) => {
      const matchesSearch =
        p.panelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBalance =
        balanceFilter === 'All' ||
        (balanceFilter === 'Outstanding' && p.outstanding > 0) ||
        (balanceFilter === 'Advance' && p.outstanding <= 0);

      const matchesCategory =
        selectedCategoryFilter === 'All' ||
        (p.category || 'Algo').toLowerCase() === selectedCategoryFilter.toLowerCase();

      return matchesSearch && matchesBalance && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.panelName.localeCompare(b.panelName);
      } else if (sortBy === 'name-desc') {
        return b.panelName.localeCompare(a.panelName);
      } else if (sortBy === 'balance-desc') {
        return (b.outstanding || 0) - (a.outstanding || 0);
      } else if (sortBy === 'balance-asc') {
        return (a.outstanding || 0) - (b.outstanding || 0);
      }
      return 0;
    });

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">

        {/* Left Content */}
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Software Panels (Clients)
            </h2>

            {loading && panels.length > 0 && (
              <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage client software licenses, billing, and ledger balances.
          </p>
        </div>

        {/* Right Button */}
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg shadow-md hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Client</span>
          </button>
        )}

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="relative w-full lg:col-span-4">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by panel name or owner..."
            className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input"
          />
        </div>

        {/* Dropdowns Wrapper */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:col-span-8 w-full">
          {/* Category Filter */}
          <div className="flex items-center justify-between sm:justify-start gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
            <span className="font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wide shrink-0">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 font-semibold cursor-pointer outline-none w-full text-right sm:text-left"
            >
              <option value="All" className="bg-slate-100 dark:bg-slate-900">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name} className="bg-slate-100 dark:bg-slate-900">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Balance Status Filter */}
          <div className="flex items-center justify-between sm:justify-start gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
            <span className="font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wide shrink-0">Status:</span>
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 font-semibold cursor-pointer outline-none w-full text-right sm:text-left"
            >
              <option value="All" className="bg-slate-100 dark:bg-slate-900">All Balances</option>
              <option value="Outstanding" className="bg-slate-100 dark:bg-slate-900">Outstanding (&gt; ₹0)</option>
              <option value="Advance" className="bg-slate-100 dark:bg-slate-900">Nil / Advance (≤ ₹0)</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center justify-between sm:justify-start gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
            <span className="font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wide shrink-0">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 font-semibold cursor-pointer outline-none w-full text-right sm:text-left"
            >
              <option value="latest" className="bg-slate-100 dark:bg-slate-900">Latest Registered</option>
              <option value="name-asc" className="bg-slate-100 dark:bg-slate-900">Name (A - Z)</option>
              <option value="name-desc" className="bg-slate-100 dark:bg-slate-900">Name (Z - A)</option>
              <option value="balance-desc" className="bg-slate-100 dark:bg-slate-900">Outstanding (High to Low)</option>
              <option value="balance-asc" className="bg-slate-100 dark:bg-slate-900">Outstanding (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Panels Table */}
      <div className="rounded-2xl glass-card border border-slate-300 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">S No.</th>
                <th className="px-6 py-4">Panel Details</th>
                <th className="px-6 py-4">License Dues</th>
                <th className="px-6 py-4">IP Dues</th>
                <th className="px-6 py-4">Maint. Dues</th>
                <th className="px-6 py-4">Outstanding Bal</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {loading && panels.length === 0 ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filteredPanels.length > 0 ? (
                filteredPanels.map((panel, index) => (
                  <tr key={panel._id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="break-words whitespace-normal">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white text-base break-words">
                            {panel.panelName}
                          </p>

                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${panel.category === 'Algo'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : panel.category === 'Sop'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : panel.category === 'crypto' || panel.category === 'Crypto'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                              }`}
                          >
                            {panel.category || 'Algo'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex items-center gap-1 break-words">
                          <UserIcon className="h-3 w-3" /> {panel.ownerName}
                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 flex items-center gap-1 break-words">
                          <Phone className="h-3 w-3" /> {panel.phoneNumber}
                        </p>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-bold ${panel.licenseDues > 0 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      ₹{(panel.licenseDues || 0).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 font-bold ${panel.ipDues > 0 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      ₹{(panel.ipDues || 0).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 font-bold ${panel.maintenanceDues > 0 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      ₹{(panel.maintenanceDues || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold text-base ${panel.outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                          >
                            {panel.outstanding < 0
                              ? `₹${Math.abs(panel.outstanding).toLocaleString()} (Adv)`
                              : `₹${(panel.outstanding || 0).toLocaleString()}`
                            }
                          </span>
                          {panel.outstanding > 0 && (
                            <button
                              onClick={() => {
                                setSelectedDuesPanel(panel);
                                setIsDuesModalOpen(true);
                              }}
                              className="h-5 w-5 rounded-md bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-200 dark:border-rose-500/20 flex items-center justify-center transition-all duration-200 shadow-sm active:scale-90 shrink-0 cursor-pointer"
                              title="View Dues Breakdown"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium mt-0.5">
                          Paid: ₹{panel.totalPaid?.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">

                        {/* View Ledger - matches header bg, indigo icon */}
                        <Link
                          to={`/dashboard/panels/${panel._id}`}
                          className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-indigo-600 text-indigo-500 hover:text-white flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:border-indigo-600 transition-all duration-200 hover:shadow-md hover:shadow-indigo-500/40"
                          title="View Panel Ledger"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {/* Add Payment - emerald icon */}
                        <Link
                          to={`/dashboard/payments?panelId=${panel._id}&openModal=true`}
                          className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-emerald-600 text-emerald-500 hover:text-white flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:border-emerald-600 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/40"
                          title="Add Payment Receipt"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Link>

                        {isAdmin && (
                          <>
                            {/* Edit - amber icon */}
                            <button
                              onClick={() => handleOpenEditModal(panel)}
                              className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-amber-500 text-amber-500 hover:text-white flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:border-amber-500 transition-all duration-200 hover:shadow-md hover:shadow-amber-500/40"
                              title="Edit Panel Client"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {/* Delete - rose icon */}
                            <button
                              onClick={() => handleDeletePanel(panel)}
                              className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:border-rose-600 transition-all duration-200 hover:shadow-md hover:shadow-rose-500/40"
                              title="Delete Panel Client"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-600 dark:text-slate-400">
                    No matching software panels found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PANEL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-2xl rounded-2xl glass-card p-6 md:p-8 border border-slate-300 dark:border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editPanelId ? 'Modify Panel Client' : 'Add New Panel Client'}
            </h3>

            {error && (
              <div className="mb-5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400 flex items-start gap-2 text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSavePanel} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Panel (Client) Name
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                    <input
                      type="text"
                      value={panelName}
                      onChange={(e) => setPanelName(e.target.value)}
                      placeholder="Gold Trading Panel"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.panelName ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.panelName && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.panelName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Owner Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.ownerName ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.ownerName && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.ownerName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Owner Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="john@example.com"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.ownerEmail ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.ownerEmail && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.ownerEmail}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) {
                          setPhoneNumber(val);
                        }
                      }}
                      placeholder="9876543210"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.phoneNumber ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.phoneNumber && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                    Panel Category
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input focus:outline-none appearance-none cursor-pointer"
                    >
                      {categories.length === 0 ? (
                        <option value="Algo">Algo</option>
                      ) : (
                        categories.map((cat) => (
                          <option key={cat._id} value={cat.name} className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                            {cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-300/80 dark:border-slate-800/80 pt-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Financial & Billing Config</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      License Charges (₹)
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                      <input
                        type="number"
                        value={licenseCharges}
                        onChange={(e) => setLicenseCharges(e.target.value)}
                        className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.licenseCharges ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                        required
                        min="0"
                      />
                    </div>
                    {formErrors.licenseCharges && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.licenseCharges}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      IP Routing Charges (₹)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                      <input
                        type="number"
                        value={ipCharges}
                        onChange={(e) => setIpCharges(e.target.value)}
                        className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.ipCharges ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                        required
                        min="0"
                      />
                    </div>
                    {formErrors.ipCharges && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.ipCharges}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Maintenance support Charges (₹)
                    </label>
                    <div className="relative">
                      <Wrench className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                      <input
                        type="number"
                        value={maintenanceCharges}
                        onChange={(e) => setMaintenanceCharges(e.target.value)}
                        className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.maintenanceCharges ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                        required
                        min="0"
                      />
                    </div>
                    {formErrors.maintenanceCharges && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.maintenanceCharges}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Opening Balance (Previous Due Dues) (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                      <input
                        type="number"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.openingBalance ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                        required
                        min="0"
                      />
                    </div>
                    {formErrors.openingBalance && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.openingBalance}</p>}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
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
                  className={`flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-600 transition-all duration-300 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 " fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editPanelId ? 'Updating...' : 'Registering...'}
                    </span>
                  ) : (
                    editPanelId ? 'Update Client' : 'Register Client'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUES BREAKDOWN MODAL */}
      {isDuesModalOpen && selectedDuesPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setIsDuesModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-md rounded-2xl glass-card p-6 border border-slate-300 dark:border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsDuesModalOpen(false)}
              className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-inner">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  Dues Breakdown
                </h3>
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-rose-500 mt-0.5">
                  {selectedDuesPanel.panelName}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>Charge Type</span>
                <span className="text-right">Outstanding Dues</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                {Object.entries(selectedDuesPanel.duesBreakdown || {}).length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-4">
                    No active outstanding dues recorded.
                  </p>
                ) : (
                  Object.entries(selectedDuesPanel.duesBreakdown || {}).map(([type, due], idx) => (
                    <div key={type} className="flex items-center justify-between pt-3 first:pt-0">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                        {type} Dues
                      </span>
                      <span className="text-sm font-extrabold text-rose-500 font-mono">
                        ₹{(due || 0).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                  Total Outstanding
                </span>
                <span className="text-base font-black text-rose-600 font-mono">
                  ₹{(selectedDuesPanel.outstanding || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsDuesModalOpen(false)}
              className="w-full mt-6 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPanelToDelete(null);
        }}
        onConfirm={handleConfirmDeletePanel}
        title="Delete Panel Client"
        message={`Are you absolutely sure you want to delete panel: ${panelToDelete?.panelName}? This will ALSO delete all associated payments and transaction records!`}
      />
    </div>
  );
}
