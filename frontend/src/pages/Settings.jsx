import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import {
  Settings as SettingsIcon,
  Building2,
  Receipt,
  ToggleLeft,
  ToggleRight,
  Save,
  Check,
  AlertCircle,
  ShieldCheck,
  Upload,
  Trash2,
  Layers,
  Plus,
  Edit2,
  X,
  Landmark,
  Tag,
} from 'lucide-react';

export default function Settings() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Categories CRUD States
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState('');
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [loadingCats, setLoadingCats] = useState(false);

  // Banks CRUD States
  const [banks, setBanks] = useState([]);
  const [bankNameInput, setBankNameInput] = useState('');
  const [editBankId, setEditBankId] = useState(null);
  const [editBankName, setEditBankName] = useState('');
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Payment Types CRUD States
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [ptNameInput, setPtNameInput] = useState('');
  const [editPtId, setEditPtId] = useState(null);
  const [editPtName, setEditPtName] = useState('');
  const [loadingPt, setLoadingPt] = useState(false);

  // Settings State with default values
  const [orgName, setOrgName] = useState('Deepmind Infotech');
  const [contactEmail, setContactEmail] = useState('billing@deepmindinfotech.com');
  const [supportPhone, setSupportPhone] = useState('+91 9876543210');
  const [currency, setCurrency] = useState('INR (₹)');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');

  const [defaultLicense, setDefaultLicense] = useState('1000');
  const [defaultIp, setDefaultIp] = useState('500');
  const [defaultMaint, setDefaultMaint] = useState('10000');

  const [autoReminder, setAutoReminder] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const [activeSubTab, setActiveSubTab] = useState('branding'); // branding, billing, toggles

  const [logo, setLogo] = useState('');
  const [stamp, setStamp] = useState('');

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo image must be smaller than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStampChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Stamp image must be smaller than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setStamp(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app_system_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.orgName) setOrgName(parsed.orgName);
        if (parsed.contactEmail) setContactEmail(parsed.contactEmail);
        if (parsed.supportPhone) setSupportPhone(parsed.supportPhone);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.invoicePrefix) setInvoicePrefix(parsed.invoicePrefix);
        if (parsed.defaultLicense) setDefaultLicense(parsed.defaultLicense);
        if (parsed.defaultIp) setDefaultIp(parsed.defaultIp);
        if (parsed.defaultMaint) setDefaultMaint(parsed.defaultMaint);
        if (parsed.autoReminder !== undefined) setAutoReminder(parsed.autoReminder);
        if (parsed.smsAlerts !== undefined) setSmsAlerts(parsed.smsAlerts);
        if (parsed.autoBackup !== undefined) setAutoBackup(parsed.autoBackup);
        if (parsed.logo) setLogo(parsed.logo);
        if (parsed.stamp) setStamp(parsed.stamp);
      }
    } catch (e) {
      console.error('Failed to parse saved settings', e);
    }
  }, []);

  const fetchCategories = async () => {
    setLoadingCats(true);
    try {
      const data = await apiRequest('/categories');
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoadingCats(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'categories') {
      fetchCategories();
    }
  }, [activeSubTab]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName || catName.trim() === '') return;
    setSuccess('');
    setError('');

    try {
      const data = await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName }),
      });
      if (data.success) {
        setSuccess(`Category "${catName}" created successfully!`);
        setCatName('');
        fetchCategories();
      }
    } catch (err) {
      setError(err.message || 'Failed to create category');
    }
  };

  const handleEditCategory = async (catId) => {
    if (!editCatName || editCatName.trim() === '') return;
    setSuccess('');
    setError('');

    try {
      const data = await apiRequest(`/categories/${catId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editCatName }),
      });
      if (data.success) {
        setSuccess('Category renamed successfully!');
        setEditCatId(null);
        setEditCatName('');
        fetchCategories();
      }
    } catch (err) {
      setError(err.message || 'Failed to rename category');
    }
  };

  const handleDeleteCategory = async (catId, name) => {
    setSuccess('');
    setError('');

    try {
      const data = await apiRequest(`/categories/${catId}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(`Category "${name}" deleted successfully.`);
        fetchCategories();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete category');
    }
  };

  // Banks CRUD functions
  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const data = await apiRequest('/banks');
      if (data.success) {
        setBanks(data.banks);
      }
    } catch (err) {
      setError(err.message || 'Failed to load banks');
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'banks') {
      fetchBanks();
    }
  }, [activeSubTab]);

  const fetchPaymentTypes = async () => {
    setLoadingPt(true);
    try {
      const data = await apiRequest('/payment-types');
      if (data.success) {
        setPaymentTypes(data.paymentTypes);
      }
    } catch (err) {
      setError(err.message || 'Failed to load payment types');
    } finally {
      setLoadingPt(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'payment-types') {
      fetchPaymentTypes();
    }
  }, [activeSubTab]);

  const handleAddPaymentType = async (e) => {
    e.preventDefault();
    if (!ptNameInput || ptNameInput.trim() === '') return;
    setSuccess('');
    setError('');
    try {
      const data = await apiRequest('/payment-types', {
        method: 'POST',
        body: JSON.stringify({ name: ptNameInput }),
      });
      if (data.success) {
        setSuccess(`Payment type "${ptNameInput}" added successfully!`);
        setPtNameInput('');
        fetchPaymentTypes();
      }
    } catch (err) {
      setError(err.message || 'Failed to add payment type');
    }
  };

  const handleEditPaymentType = async (ptId) => {
    if (!editPtName || editPtName.trim() === '') return;
    setSuccess('');
    setError('');
    try {
      const data = await apiRequest(`/payment-types/${ptId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editPtName }),
      });
      if (data.success) {
        setSuccess('Payment type renamed successfully!');
        setEditPtId(null);
        setEditPtName('');
        fetchPaymentTypes();
      }
    } catch (err) {
      setError(err.message || 'Failed to rename payment type');
    }
  };

  const handleDeletePaymentType = async (ptId, name) => {
    setSuccess('');
    setError('');
    try {
      const data = await apiRequest(`/payment-types/${ptId}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(`Payment type "${name}" deleted successfully.`);
        fetchPaymentTypes();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete payment type');
    }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    if (!bankNameInput || bankNameInput.trim() === '') return;
    setSuccess('');
    setError('');

    try {
      const data = await apiRequest('/banks', {
        method: 'POST',
        body: JSON.stringify({ name: bankNameInput }),
      });
      if (data.success) {
        setSuccess(`Bank "${bankNameInput}" added successfully!`);
        setBankNameInput('');
        fetchBanks();
      }
    } catch (err) {
      setError(err.message || 'Failed to add bank');
    }
  };

  const handleEditBank = async (bankId) => {
    if (!editBankName || editBankName.trim() === '') return;
    setSuccess('');
    setError('');

    try {
      const data = await apiRequest(`/banks/${bankId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editBankName }),
      });
      if (data.success) {
        setSuccess('Bank renamed successfully!');
        setEditBankId(null);
        setEditBankName('');
        fetchBanks();
      }
    } catch (err) {
      setError(err.message || 'Failed to rename bank');
    }
  };

  const handleDeleteBank = async (bankId, name) => {
    setSuccess('');
    setError('');

    try {
      const data = await apiRequest(`/banks/${bankId}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(`Bank "${name}" deleted successfully.`);
        fetchBanks();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete bank');
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      const settingsPayload = {
        orgName,
        contactEmail,
        supportPhone,
        currency,
        invoicePrefix,
        defaultLicense,
        defaultIp,
        defaultMaint,
        autoReminder,
        smsAlerts,
        autoBackup,
        logo,
        stamp,
      };

      localStorage.setItem('app_system_settings', JSON.stringify(settingsPayload));

      if (logo) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = logo;
      }

      window.dispatchEvent(new Event('settingsUpdated'));

      setSuccess('System configurations and parameters saved successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to persist system settings configuration.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-indigo-400" />
          <span>System & Account Settings</span>
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure default client billing rates, system-wide transaction configurations, and support details.
        </p>
      </div>

      {/* Success/Error Banner */}
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

      {/* Main Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation Menu */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveSubTab('branding')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'branding'
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Building2 className="h-4.5 w-4.5" />
            <span>Profile & Branding</span>
          </button>

          <button
            onClick={() => setActiveSubTab('billing')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'billing'
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Receipt className="h-4.5 w-4.5" />
            <span>Billing Defaults</span>
          </button>

          <button
            onClick={() => setActiveSubTab('toggles')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'toggles'
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            type="button"
          >
            {autoReminder || smsAlerts ? <ToggleRight className="h-4.5 w-4.5 text-indigo-400" /> : <ToggleLeft className="h-4.5 w-4.5" />}
            <span>Feature Toggles</span>
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'categories'
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            type="button"
          >
            <Layers className="h-4.5 w-4.5" />
            <span>Manage Categories</span>
          </button>

          <button
            onClick={() => setActiveSubTab('banks')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'banks'
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            type="button"
          >
            <Landmark className="h-4.5 w-4.5" />
            <span>Manage Banks</span>
          </button>

          <button
            onClick={() => setActiveSubTab('payment-types')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'payment-types'
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
            type="button"
          >
            <Tag className="h-4.5 w-4.5" />
            <span>Manage Charge Types</span>
          </button>

          <div className="p-4 bg-slate-100/40 dark:bg-slate-900/40 rounded-xl border border-slate-300 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-500 mt-6">
            <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400 mb-1">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Permission Notice</span>
            </div>
            This module is restricted to Admin role and permitted Staff users only. Altering settings updates globally.
          </div>
        </div>

        {/* Configurations Form Panel */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-3 bg-slate-100/30 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">

          {/* BRANDING SUBTAB */}
          {activeSubTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-800 pb-3">Organization Profile Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Organization / Brand Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="E.g., Deepmind Infotech"
                    className="w-full glass-input"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="E.g., INV-"
                    className="w-full glass-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contact Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full glass-input"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Support Phone Number</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    placeholder="+91 9999999999"
                    className="w-full glass-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">System Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
                >
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                </select>
              </div>

              {/* Logo & Stamp upload section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-300/60 dark:border-slate-800/60">
                {/* Logo Upload Card */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Company Logo</label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 block">Recommended: Square format (PNG/JPG), transparent background</span>
                  </div>

                  <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 bg-slate-50/20 dark:bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-300 min-h-[160px]">
                    {logo ? (
                      <div className="relative flex flex-col items-center gap-3">
                        <img src={logo} alt="Company Logo" className="max-h-24 max-w-full rounded-xl object-contain bg-slate-100/60 dark:bg-slate-900/60 p-2 border border-slate-300 dark:border-slate-800" />
                        <button
                          type="button"
                          onClick={() => setLogo('')}
                          className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:border-rose-500 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 text-[10px] font-bold text-rose-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove Logo</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center text-center p-4 h-full w-full">
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-3 block group-hover:text-white transition-colors">Upload Company Logo</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 block">Click to browse your files</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Stamp Upload Card */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Authorized Sign / Stamp</label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 block">Recommended: Transparent PNG, dark color (blue/black/green)</span>
                  </div>

                  <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 bg-slate-50/20 dark:bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-300 min-h-[160px]">
                    {stamp ? (
                      <div className="relative flex flex-col items-center gap-3">
                        <img src={stamp} alt="Authorized Stamp" className="max-h-24 max-w-full rounded-xl object-contain bg-white/5 p-2 border border-slate-300 dark:border-slate-800" />
                        <button
                          type="button"
                          onClick={() => setStamp('')}
                          className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:border-rose-500 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 text-[10px] font-bold text-rose-400 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove Stamp</span>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center text-center p-4 h-full w-full">
                        <input type="file" accept="image/*" onChange={handleStampChange} className="hidden" />
                        <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-3 block group-hover:text-white transition-colors">Upload Stamp / Signature</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 block">Click to browse your files</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BILLING DEFAULTS SUBTAB */}
          {/* BILLING DEFAULTS SUBTAB */}
          {activeSubTab === "billing" && (
            <div className="space-y-5 animate-in fade-in duration-200">

              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-800 pb-3">
                Standard Base Charge Rates Defaults
              </h3>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                These rates populate as defaults when onboarding new software panel clients into the ledger system.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* License Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Default License Fee
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={defaultLicense}
                      onChange={(e) => setDefaultLicense(e.target.value)}
                      placeholder="1000"
                      min="0"
                      className="
              w-full pl-7 pr-3 py-2.5 rounded-xl
              bg-white/70 dark:bg-slate-900/70
              border border-slate-300 dark:border-slate-700
              text-sm text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              backdrop-blur-md
              font-mono
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
              hover:border-slate-400 dark:hover:border-slate-600
            "
                    />
                  </div>
                </div>

                {/* IP Routing Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Default IP Routing Fee
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={defaultIp}
                      onChange={(e) => setDefaultIp(e.target.value)}
                      placeholder="500"
                      min="0"
                      className="
              w-full pl-7 pr-3 py-2.5 rounded-xl
              bg-white/70 dark:bg-slate-900/70
              border border-slate-300 dark:border-slate-700
              text-sm text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              backdrop-blur-md
              font-mono
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
              hover:border-slate-400 dark:hover:border-slate-600
            "
                    />
                  </div>
                </div>

                {/* Maintenance Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Default Maintenance Fee
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={defaultMaint}
                      onChange={(e) => setDefaultMaint(e.target.value)}
                      placeholder="10000"
                      min="0"
                      className="
              w-full pl-7 pr-3 py-2.5 rounded-xl
              bg-white/70 dark:bg-slate-900/70
              border border-slate-300 dark:border-slate-700
              text-sm text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              backdrop-blur-md
              font-mono
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
              hover:border-slate-400 dark:hover:border-slate-600
            "
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* FEATURE TOGGLES SUBTAB */}
          {activeSubTab === 'toggles' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-800 pb-3">Automated Actions & Services</h3>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-4 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Daily Auto Database Backup</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Encrypts and stores transaction entries daily inside secure cloud vaults.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoBackup(!autoBackup)}
                    className="text-indigo-400 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                  >
                    {autoBackup ? <ToggleRight className="h-10 w-10 text-emerald-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Send Email Reminders on Overdue Bills</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Sends automated notifications to client email when outstanding exceeds ₹0.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoReminder(!autoReminder)}
                    className="text-indigo-400 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                  >
                    {autoReminder ? <ToggleRight className="h-10 w-10 text-emerald-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Enable Real-Time WhatsApp/SMS Receipts</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Dispatches SMS confirmation codes and receipt PDFs on payment collection.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmsAlerts(!smsAlerts)}
                    className="text-indigo-400 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
                  >
                    {smsAlerts ? <ToggleRight className="h-10 w-10 text-emerald-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIES SUBTAB */}
          {activeSubTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage Client Panel Categories</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Add, edit, or delete categories used to classify software panel clients.
                </p>
              </div>

              {/* Add Category Form */}
              <div className="bg-slate-50/40 dark:bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Create New Category</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                    <input
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      placeholder="E.g., Forex, Binary, Crypto..."
                      className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <button
                    onClick={handleAddCategory}
                    type="button"
                    className="
    flex items-center gap-2
    px-5 py-2.5
    rounded-lg
    bg-purple-600
    text-white
    hover:bg-purple-700
  "
                  >
                    <Plus className="h-4 w-4" />
                    Add Category
                  </button>
                </div>
              </div>

              {/* Categories list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Active System Categories</h4>

                {loadingCats ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/20 dark:bg-slate-950/20 border border-slate-300/50 dark:border-slate-800/50 rounded-2xl text-slate-500 dark:text-slate-500 text-sm">
                    No categories registered. Click above to add!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div
                        key={cat._id}
                        className="flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30 border border-slate-900/60 p-4 rounded-xl hover:border-slate-800 transition-colors"
                      >
                        {editCatId === cat._id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editCatName}
                              onChange={(e) => setEditCatName(e.target.value)}
                              className="flex-1 rounded-lg px-3 py-2 text-xs glass-input focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              placeholder="New name..."
                              required
                            />
                            <button
                              type="button"
                              onClick={() => handleEditCategory(cat._id)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditCatId(null);
                                setEditCatName('');
                              }}
                              className="p-2 bg-slate-850 hover:bg-slate-750 text-slate-600 dark:text-slate-400 rounded-lg transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span className={`h-2.5 w-2.5 rounded-full ${cat.name === 'Algo'
                                ? 'bg-indigo-500'
                                : cat.name === 'Sop'
                                  ? 'bg-emerald-500'
                                  : cat.name === 'crypto' || cat.name === 'Crypto'
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-500/80'
                                }`}></span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditCatId(cat._id);
                                  setEditCatName(cat.name);
                                }}
                                className="h-8 w-8 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-300/80 dark:border-slate-800/80 transition-colors"
                                title="Rename Category"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                                    handleDeleteCategory(cat._id, cat.name);
                                  }
                                }}
                                className="h-8 w-8 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-400 flex items-center justify-center border border-slate-300/80 dark:border-slate-800/80 transition-colors"
                                title="Delete Category"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BANKS SUBTAB */}
          {activeSubTab === 'banks' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage System Bank Accounts</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Add, edit, or delete bank options used to select receiving banks when collecting subscription payments.
                </p>
              </div>

              {/* Add Bank Form */}
              <div className="bg-slate-50/40 dark:bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Add New Receiving Bank</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 dark:text-slate-500" />
                    <input
                      type="text"
                      value={bankNameInput}
                      onChange={(e) => setBankNameInput(e.target.value)}
                      placeholder="E.g., Union Bank, State Bank of India, Axis Bank..."
                      className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <button
                    onClick={handleAddBank}
                    type="button"
                    className="
    flex items-center justify-center gap-2
    px-5 py-2.5
    rounded-lg
    bg-purple-600
    text-white
    text-sm font-semibold
    hover:bg-purple-700
  "
                  >
                    <Plus className="h-4 w-4" />
                    Add Bank
                  </button>
                </div>
              </div>

              {/* Banks list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Active System Banks</h4>

                {loadingBanks ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : banks.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/20 dark:bg-slate-950/20 border border-slate-300/50 dark:border-slate-800/50 rounded-2xl text-slate-500 dark:text-slate-500 text-sm">
                    No banks registered. Add a receiving bank above!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {banks.map((b) => (
                      <div
                        key={b._id}
                        className="flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30 border border-slate-900/60 p-4 rounded-xl hover:border-slate-800 transition-colors"
                      >
                        {editBankId === b._id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editBankName}
                              onChange={(e) => setEditBankName(e.target.value)}
                              className="flex-1 rounded-lg px-3 py-2 text-xs glass-input focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              placeholder="New name..."
                              required
                            />
                            <button
                              type="button"
                              onClick={() => handleEditBank(b._id)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditBankId(null);
                                setEditBankName('');
                              }}
                              className="p-2 bg-slate-850 hover:bg-slate-750 text-slate-600 dark:text-slate-400 rounded-lg transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{b.name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditBankId(b._id);
                                  setEditBankName(b.name);
                                }}
                                className="h-8 w-8 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-300/80 dark:border-slate-800/80 transition-colors"
                                title="Rename Bank"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete bank "${b.name}"?`)) {
                                    handleDeleteBank(b._id, b.name);
                                  }
                                }}
                                className="h-8 w-8 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-400 flex items-center justify-center border border-slate-300/80 dark:border-slate-800/80 transition-colors"
                                title="Delete Bank"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAYMENT TYPES SUBTAB */}
          {activeSubTab === 'payment-types' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-300 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage Bill / Charge Types</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Add custom charge types used in bills and payment receipts. The 4 default types (License, IP Charges, Maintenance, Other) cannot be deleted.
                </p>
              </div>

              {/* Add Payment Type Form */}
              <div className="bg-slate-50/40 dark:bg-slate-950/40 border border-slate-900/60 p-5 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Add New Charge Type</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-500" />
                    <input
                      type="text"
                      value={ptNameInput}
                      onChange={(e) => setPtNameInput(e.target.value)}
                      placeholder="E.g., Server Rental, Data Charges, AMC..."
                      className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                  <button
                    onClick={handleAddPaymentType}
                    type="button"
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Type
                  </button>
                </div>
              </div>

              {/* Payment Types list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Active Charge Types</h4>

                {loadingPt ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                ) : paymentTypes.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50/20 dark:bg-slate-950/20 border border-slate-300/50 dark:border-slate-800/50 rounded-2xl text-slate-500 dark:text-slate-500 text-sm">
                    No charge types found. Add one above!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentTypes.map((pt) => (
                      <div
                        key={pt._id}
                        className="flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30 border border-slate-900/60 p-4 rounded-xl hover:border-slate-800 transition-colors"
                      >
                        {editPtId === pt._id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editPtName}
                              onChange={(e) => setEditPtName(e.target.value)}
                              className="flex-1 rounded-lg px-3 py-2 text-xs glass-input focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                              placeholder="New name..."
                            />
                            <button
                              type="button"
                              onClick={() => handleEditPaymentType(pt._id)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditPtId(null); setEditPtName(''); }}
                              className="p-2 text-slate-600 dark:text-slate-400 rounded-lg transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span className={`h-2.5 w-2.5 rounded-full ${pt.isDefault ? 'bg-indigo-500' : 'bg-violet-400'}`}></span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{pt.name}</span>
                              {pt.isDefault && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">Default</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {!pt.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => { setEditPtId(pt._id); setEditPtName(pt.name); }}
                                  className="h-8 w-8 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-300/80 dark:border-slate-800/80 transition-colors"
                                  title="Rename Type"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {!pt.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete charge type "${pt.name}"?\n\nNote: If this type is used in any payment records, deletion will be blocked.`)) {
                                      handleDeletePaymentType(pt._id, pt.name);
                                    }
                                  }}
                                  className="h-8 w-8 rounded-lg bg-slate-100/60 dark:bg-slate-900/60 hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-400 flex items-center justify-center border border-slate-300/80 dark:border-slate-800/80 transition-colors"
                                  title="Delete Type"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          {activeSubTab !== 'categories' && activeSubTab !== 'banks' && activeSubTab !== 'payment-types' && (
            <div className="flex justify-end pt-4 border-t border-slate-300 dark:border-slate-800">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 text-slate-900 dark:text-white font-bold px-6 py-3 text-sm transition-all shadow-lg shadow-indigo-600/10"
              >
                <Save className="h-4.5 w-4.5 text-white" />
                <span className='text-white'>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
