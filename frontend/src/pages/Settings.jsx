import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/utils/api';
import {
  Settings as SettingsIcon,
  Building2,
  Receipt,
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
  MessageSquare,
  Send,
} from 'lucide-react';

export default function Settings() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (field, value, setter) => {
    setter(value);
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (activeSubTab === 'branding') {
      if (!orgName || orgName.trim().length < 3) {
        newErrors.orgName = 'Organization Name must be at least 3 characters.';
      }
      if (!invoicePrefix || invoicePrefix.trim().length === 0) {
        newErrors.invoicePrefix = 'Invoice Prefix is required.';
      } else if (invoicePrefix.length > 8) {
        newErrors.invoicePrefix = 'Invoice Prefix cannot exceed 8 characters.';
      }
      if (!contactEmail) {
        newErrors.contactEmail = 'Contact Email Address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address.';
      }
      if (supportPhone && supportPhone.trim().length > 0) {
        if (!/^\+?[0-9\s\-()]{8,20}$/.test(supportPhone.trim())) {
          newErrors.supportPhone = 'Please enter a valid phone number (8-20 characters).';
        }
      }
    }

    if (activeSubTab === 'billing') {
      if (defaultLicense !== '' && Number(defaultLicense) < 0) {
        newErrors.defaultLicense = 'Default License Fee cannot be negative.';
      }
      if (defaultIp !== '' && Number(defaultIp) < 0) {
        newErrors.defaultIp = 'Default IP Routing Fee cannot be negative.';
      }
      if (defaultMaint !== '' && Number(defaultMaint) < 0) {
        newErrors.defaultMaint = 'Default Maintenance Fee cannot be negative.';
      }
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
  const [activeSubTab, setActiveSubTab] = useState('branding'); // branding, billing, toggles


  // WhatsApp Business API Settings States
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappWabaId, setWhatsappWabaId] = useState('');
  const [whatsappTestPhone, setWhatsappTestPhone] = useState('');
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMetaPopupOpen, setIsMetaPopupOpen] = useState(false);
  const [metaStep, setMetaStep] = useState(0);
  const [metaVerificationSuccessful, setMetaVerificationSuccessful] = useState(false);

  // Live Meta Setup Modal States
  const [connectionMode, setConnectionMode] = useState('demo'); // 'demo' or 'production'
  const [modalToken, setModalToken] = useState('');
  const [modalPhoneId, setModalPhoneId] = useState('');
  const [modalWabaId, setModalWabaId] = useState('');
  const [modalTestPhone, setModalTestPhone] = useState('');
  const [modalVerifying, setModalVerifying] = useState(false);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const metaIntervalRef = useRef(null);

  const handleAutoFetchMetaCredentials = () => {
    setSuccess('');
    setError('');
    setIsMetaPopupOpen(true);
    setConnectionMode('demo');
    setMetaStep(0);
    setMetaVerificationSuccessful(false);
    setSimulationRunning(false);

    if (metaIntervalRef.current) {
      clearInterval(metaIntervalRef.current);
      metaIntervalRef.current = null;
    }
  };

  const handleStartSandboxSimulation = () => {
    setMetaStep(0);
    setMetaVerificationSuccessful(false);
    setSimulationRunning(true);

    if (metaIntervalRef.current) {
      clearInterval(metaIntervalRef.current);
    }

    metaIntervalRef.current = setInterval(() => {
      setMetaStep((prev) => {
        if (prev >= 4) {
          clearInterval(metaIntervalRef.current);
          metaIntervalRef.current = null;
          setMetaVerificationSuccessful(true);
          setSimulationRunning(false);
          setTimeout(() => {
            // Populate realistic keys automatically as requested
            setWhatsappToken('EAAGb8ZCpZBZCQM0BAHR1KZCZAyp1Xb71v89k82S74mXl35p21z986a7d5c3e9f8h2j5k1m0n3o2p1q4r7s0t8u6v5w2x1y5z');
            setWhatsappPhoneId('105658249673952');
            setWhatsappWabaId('205698425146813');
            setWhatsappTestPhone('919876543210');
            setSuccess('Success: Auto-fetched all Meta Credentials successfully! Don\'t forget to click "Save Changes" at the bottom.');
            setIsMetaPopupOpen(false);
          }, 1200);
          return 4;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleProductionVerifyAndSave = async (e) => {
    e.preventDefault();
    if (metaIntervalRef.current) {
      clearInterval(metaIntervalRef.current);
      metaIntervalRef.current = null;
    }
    if (!modalToken || !modalPhoneId || !modalWabaId || !modalTestPhone) {
      setError('Please fill in all production credentials.');
      return;
    }
    setModalVerifying(true);
    setSuccess('');
    setError('');
    try {
      const data = await apiRequest('/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify({
          permanentAccessToken: modalToken,
          phoneNumberId: modalPhoneId,
          wabaId: modalWabaId,
          testPhoneNumber: modalTestPhone,
        }),
      });

      if (data.success) {
        setWhatsappToken(modalToken);
        setWhatsappPhoneId(modalPhoneId);
        setWhatsappWabaId(modalWabaId);
        setWhatsappTestPhone(modalTestPhone);
        setSuccess('Success: Production Meta Credentials verified & saved! Please save changes at the bottom.');
        setIsMetaPopupOpen(false);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your credentials.');
    } finally {
      setModalVerifying(false);
    }
  };

  // Clear interval on cleanup
  useEffect(() => {
    return () => {
      if (metaIntervalRef.current) {
        clearInterval(metaIntervalRef.current);
      }
    };
  }, []);

  const fetchWhatsappConfig = async () => {
    setWhatsappLoading(true);
    try {
      const data = await apiRequest('/whatsapp/config');
      if (data.success && data.config) {
        setWhatsappToken(data.config.permanentAccessToken || '');
        setWhatsappPhoneId(data.config.phoneNumberId || '');
        setWhatsappWabaId(data.config.wabaId || '');
        setWhatsappTestPhone(data.config.testPhoneNumber || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load WhatsApp configuration');
    } finally {
      setWhatsappLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'whatsapp') {
      fetchWhatsappConfig();
    }
  }, [activeSubTab]);

  const handleSaveWhatsappConfig = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);

    try {
      const data = await apiRequest('/whatsapp/config', {
        method: 'POST',
        body: JSON.stringify({
          permanentAccessToken: whatsappToken,
          phoneNumberId: whatsappPhoneId,
          wabaId: whatsappWabaId,
          testPhoneNumber: whatsappTestPhone,
        }),
      });

      if (data.success) {
        setSuccess('WhatsApp Business API settings saved successfully!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to save WhatsApp settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestWhatsappConnection = async () => {
    setSuccess('');
    setError('');
    if (!whatsappToken || !whatsappPhoneId || !whatsappWabaId || !whatsappTestPhone) {
      setError('Error: Missing required fields. Please fill all WhatsApp configurations.');
      return;
    }

    setTestingWhatsapp(true);
    try {
      const data = await apiRequest('/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify({
          permanentAccessToken: whatsappToken,
          phoneNumberId: whatsappPhoneId,
          wabaId: whatsappWabaId,
          testPhoneNumber: whatsappTestPhone,
        }),
      });

      if (data.success) {
        setSuccess('Success: Test message sent!');
      }
    } catch (err) {
      setError(err.message || 'Connection failed.');
    } finally {
      setTestingWhatsapp(false);
    }
  };




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

  // Load from database on mount (with localStorage as fallback/cache)
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiRequest('/settings');
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.orgName) setOrgName(s.orgName);
          if (s.contactEmail) setContactEmail(s.contactEmail);
          if (s.supportPhone !== undefined) setSupportPhone(s.supportPhone);
          if (s.currency) setCurrency(s.currency);
          if (s.invoicePrefix) setInvoicePrefix(s.invoicePrefix);
          if (s.defaultLicense !== undefined) setDefaultLicense(s.defaultLicense);
          if (s.defaultIp !== undefined) setDefaultIp(s.defaultIp);
          if (s.defaultMaint !== undefined) setDefaultMaint(s.defaultMaint);
          if (s.logo !== undefined) setLogo(s.logo);
          if (s.stamp !== undefined) setStamp(s.stamp);

          // Sync local storage so other components load fast
          localStorage.setItem('app_system_settings', JSON.stringify(s));
          window.dispatchEvent(new Event('settingsUpdated'));
        }
      } catch (err) {
        console.log('Failed to load system settings from server:', err);
        // Fallback to localStorage if offline
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
          if (parsed.logo) setLogo(parsed.logo);
          if (parsed.stamp) setStamp(parsed.stamp);
        }
      }
    };
    loadSettings();
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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!validateForm()) {
      setError('Please resolve all validation errors in the form.');
      return;
    }

    try {
      const settingsPayload = {
        orgName,
        contactEmail,
        supportPhone,
        currency,
        invoicePrefix,
        defaultLicense: Number(defaultLicense),
        defaultIp: Number(defaultIp),
        defaultMaint: Number(defaultMaint),
        logo,
        stamp,
      };

      const data = await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsPayload),
      });

      if (data.success) {
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

        setSuccess('System configurations and parameters saved successfully to database!');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || 'Failed to persist settings.');
      }
    } catch (err) {
      setError(err.message || 'Failed to persist system settings configuration.');
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
              ? 'bg-[#0A2540] text-white border-[#0A2540]'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Building2 className="h-4.5 w-4.5" />
            <span>Profile & Branding</span>
          </button>

          <button
            onClick={() => setActiveSubTab('billing')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'billing'
              ? 'bg-[#0A2540] text-white border-[#0A2540]'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Receipt className="h-4.5 w-4.5" />
            <span>Billing Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('whatsapp')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'whatsapp'
              ? 'bg-[#0A2540] text-white border-[#0A2540]'
              : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <MessageSquare className="h-4.5 w-4.5" />
            <span>WhatsApp Configuration</span>
          </button>



          <button
            onClick={() => setActiveSubTab('categories')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${activeSubTab === 'categories'
              ? 'bg-[#0A2540] text-white border-[#0A2540]'
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
              ? 'bg-[#0A2540] text-white border-[#0A2540]'
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
              ? 'bg-[#0A2540] text-white border-[#0A2540]'
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
        <form onSubmit={activeSubTab === 'whatsapp' ? handleSaveWhatsappConfig : handleSaveSettings} className="lg:col-span-3 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">

          {/* BRANDING SUBTAB */}
          {activeSubTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-white bg-[#0A2540] px-4 py-3 rounded-xl mb-4">Organization Profile Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">Organization / Brand Name</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => handleInputChange('orgName', e.target.value, setOrgName)}
                    placeholder="E.g., Deepmind Infotech"
                    className={`w-full rounded-xl px-4 py-3 text-sm glass-input transition-all duration-200 focus:outline-none focus:ring-2 ${validationErrors.orgName
                      ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'focus:ring-[#0A2540]/30 focus:border-[#0A2540]'
                      }`}
                    required
                  />
                  {validationErrors.orgName && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-150">{validationErrors.orgName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => handleInputChange('invoicePrefix', e.target.value, setInvoicePrefix)}
                    placeholder="E.g., INV-"
                    className={`w-full rounded-xl px-4 py-3 text-sm glass-input transition-all duration-200 focus:outline-none focus:ring-2 ${validationErrors.invoicePrefix
                      ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'focus:ring-[#0A2540]/30 focus:border-[#0A2540]'
                      }`}
                    required
                  />
                  {validationErrors.invoicePrefix && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-150">{validationErrors.invoicePrefix}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">Contact Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value, setContactEmail)}
                    placeholder="billing@company.com"
                    className={`w-full rounded-xl px-4 py-3 text-sm glass-input transition-all duration-200 focus:outline-none focus:ring-2 ${validationErrors.contactEmail
                      ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'focus:ring-[#0A2540]/30 focus:border-[#0A2540]'
                      }`}
                    required
                  />
                  {validationErrors.contactEmail && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-150">{validationErrors.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">Support Phone Number</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => handleInputChange('supportPhone', e.target.value, setSupportPhone)}
                    placeholder="+91 9999999999"
                    className={`w-full rounded-xl px-4 py-3 text-sm glass-input transition-all duration-200 focus:outline-none focus:ring-2 ${validationErrors.supportPhone
                      ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'focus:ring-[#0A2540]/30 focus:border-[#0A2540]'
                      }`}
                  />
                  {validationErrors.supportPhone && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-150">{validationErrors.supportPhone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">System Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm glass-input transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0A2540]/30 focus:border-[#0A2540]"
                >
                  <option value="INR (₹)" className="bg-white dark:bg-slate-900">INR (₹) - Indian Rupee</option>
                  <option value="USD ($)" className="bg-white dark:bg-slate-900">USD ($) - US Dollar</option>
                  <option value="EUR (€)" className="bg-white dark:bg-slate-900">EUR (€) - Euro</option>
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

          {/* WHATSAPP API SUBTAB */}
          {activeSubTab === 'whatsapp' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-white bg-[#0A2540] px-4 py-3 rounded-xl mb-4">
                WhatsApp Business API Configuration
              </h3>

              {whatsappLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Automated Auto-Fetch Integration Block */}
                  <div className="bg-[#1877F2]/5 dark:bg-[#1877F2]/10 border border-[#1877F2]/20 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Setup your WhatsApp Business Account automatically in one click
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          No manual copy-paste. Login with Facebook securely to pull WABA ID, Phone ID, and Access Token automatically.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoFetchMetaCredentials}
                        className="shrink-0 flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs shadow-md hover:shadow-[#1877F2]/20 active:scale-95 transition-all w-full sm:w-auto"
                      >
                        <span className="font-bold text-base text-white">f</span>
                        <span className="text-white">Connect with Facebook & WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  {/* Form Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                        Meta Permanent Access Token
                      </label>
                      <input
                        type="password"
                        value={whatsappToken}
                        onChange={(e) => setWhatsappToken(e.target.value)}
                        placeholder="E.g., EAAGb..."
                        className="w-full rounded-xl px-4 py-3 text-sm glass-input focus:ring-2 focus:ring-[#0A2540]/30 focus:border-[#0A2540]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                        Phone Number ID (15-Digit)
                      </label>
                      <input
                        type="text"
                        value={whatsappPhoneId}
                        onChange={(e) => setWhatsappPhoneId(e.target.value)}
                        placeholder="E.g., 1056582496XXXXX"
                        className="w-full rounded-xl px-4 py-3 text-sm glass-input focus:ring-2 focus:ring-[#0A2540]/30 focus:border-[#0A2540]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                        WhatsApp Business Account (WABA) ID
                      </label>
                      <input
                        type="text"
                        value={whatsappWabaId}
                        onChange={(e) => setWhatsappWabaId(e.target.value)}
                        placeholder="E.g., 2056984251XXXXX"
                        className="w-full rounded-xl px-4 py-3 text-sm glass-input focus:ring-2 focus:ring-[#0A2540]/30 focus:border-[#0A2540]"
                        required
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                        Test Phone Number (With Country Code)
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={whatsappTestPhone}
                          onChange={(e) => setWhatsappTestPhone(e.target.value)}
                          placeholder="E.g., 919876543210"
                          className="flex-1 rounded-xl px-4 py-3 text-sm glass-input focus:ring-2 focus:ring-[#0A2540]/30 focus:border-[#0A2540]"
                        />
                        <button
                          type="button"
                          disabled={testingWhatsapp}
                          onClick={handleTestWhatsappConnection}
                          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                          {testingWhatsapp ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span>⚡ Test Connection</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Guide on How to get Meta API Information */}
                  <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 bg-gradient-to-r from-indigo-50/50 to-indigo-100/10 dark:from-indigo-950/20 dark:to-indigo-900/10 p-5 space-y-4 shadow-sm text-xs animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-2.5">
                      <SettingsIcon className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400 animate-spin-slow" />
                      <span>🔑 Step-by-Step Meta WhatsApp Credentials Guide (Ye details kaha aur kaise milengi?)</span>
                    </div>

                    <div className="space-y-3.5 text-slate-600 dark:text-slate-400">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">1. Setup Meta Developer Account:</p>
                        <p className="pl-4 leading-relaxed text-slate-600 dark:text-slate-400">
                          Sabse pehle <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">Meta Developer Console (https://developers.facebook.com/)</a> par jayein. Wahan apna developer account register karein aur ek <strong>"Business" App</strong> create karein.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">2. Add WhatsApp Product:</p>
                        <p className="pl-4 leading-relaxed text-slate-600 dark:text-slate-400">
                          App dashboard me left sidebar se <strong>"Add Product"</strong> par click karein aur <strong>"WhatsApp"</strong> ko setup karein.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">3. Get Phone Number ID & WABA ID:</p>
                        <p className="pl-4 leading-relaxed text-slate-600 dark:text-slate-400">
                          WhatsApp product setup hone ke baad left panel me <strong>WhatsApp ➔ API Setup</strong> par click karein.
                          <br />
                          Wahan screen par aapko <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-indigo-400">Phone Number ID (15-Digit)</span> aur <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] text-indigo-400">WhatsApp Business Account ID (WABA ID)</span> likha hua mil jayega. Use copy karke respective inputs me paste karein.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 dark:text-slate-200">4. Generate Permanent Access Token:</p>
                        <p className="pl-4 leading-relaxed text-slate-600 dark:text-slate-400">
                          API Setup page par jo token dikhta he bo sirf 24 hours ke liye valid hota he. Permanent Token ke liye:
                          <br />
                          1. <a href="https://business.facebook.com/settings" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline">Meta Business Manager Settings (https://business.facebook.com/settings)</a> par jayein.
                          <br />
                          2. Left panel me <strong>Users ➔ System Users</strong> par click karein aur ek naya System User add karein.
                          <br />
                          3. Us System User ko apni App assign karein aur permissions me <strong>"whatsapp_business_messaging"</strong> & <strong>"whatsapp_business_management"</strong> ko check karke token generate karein. Ye hamesha ke liye permanent token ban jayega.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SOP & Training Quick Reference Guide (Agent Training Material) */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-4 shadow-inner text-xs animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <MessageSquare className="h-4.5 w-4.5 text-emerald-500" />
                      <span>📑 Training SOP: WhatsApp Business API Support Guide</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
                      <div className="space-y-2.5">
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">⚙️ Standard Troubleshooting Steps:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-650 dark:text-slate-400 pl-1">
                          <li>Check if credentials fields are filled properly before testing.</li>
                          <li>Verify country code `91` is prefixed before test number (no spaces).</li>
                          <li>Send a template test message using `[⚡ Test Connection]`.</li>
                          <li>If message fails, see Meta API Status code reference table.</li>
                        </ul>
                      </div>

                      <div className="space-y-2.5">
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">💬 Meta API Messaging Rules:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-650 dark:text-slate-400 pl-1">
                          <li>First message triggers must use approved Meta templates (`hello_world`).</li>
                          <li>Normal free-text window expires 24 hours after user replies.</li>
                          <li>Automated maintenance bills are sent securely as PDF attachments.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BILLING DEFAULTS SUBTAB */}
          {/* BILLING DEFAULTS SUBTAB */}
          {activeSubTab === "billing" && (
            <div className="space-y-5 animate-in fade-in duration-200">

              <h3 className="text-base font-bold text-white bg-[#0A2540] px-4 py-3 rounded-xl mb-4">
                Standard Base Charge Rates Defaults
              </h3>



              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* License Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                    Default License Fee
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={defaultLicense}
                      onChange={(e) => handleInputChange('defaultLicense', e.target.value, setDefaultLicense)}
                      placeholder="1000"
                      min="0"
                      className={`w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 backdrop-blur-md font-mono transition-all duration-200 focus:outline-none focus:ring-2 ${validationErrors.defaultLicense
                        ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-[#0A2540]/30 focus:border-[#0A2540] hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                    />
                  </div>
                  {validationErrors.defaultLicense && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-150">{validationErrors.defaultLicense}</p>
                  )}
                </div>

                {/* IP Routing Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                    Default IP Routing Fee
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={defaultIp}
                      onChange={(e) => handleInputChange('defaultIp', e.target.value, setDefaultIp)}
                      placeholder="500"
                      min="0"
                      className={`w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 backdrop-blur-md font-mono transition-all duration-200 focus:outline-none focus:ring-2 ${validationErrors.defaultIp
                        ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-[#0A2540]/30 focus:border-[#0A2540] hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                    />
                  </div>
                  {validationErrors.defaultIp && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-150">{validationErrors.defaultIp}</p>
                  )}
                </div>

                {/* Maintenance Fee */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                    Default Maintenance Fee
                  </label>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">
                      ₹
                    </span>

                    <input
                      type="number"
                      value={defaultMaint}
                      onChange={(e) => handleInputChange('defaultMaint', e.target.value, setDefaultMaint)}
                      placeholder="10000"
                      min="0"
                      className={`w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/70 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 backdrop-blur-md font-mono transition-all duration-200 focus:outline-none focus:ring-2 ${validationErrors.defaultMaint
                        ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-[#0A2540]/30 focus:border-[#0A2540] hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                    />
                  </div>
                  {validationErrors.defaultMaint && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 animate-in fade-in duration-150">{validationErrors.defaultMaint}</p>
                  )}
                </div>

              </div>
            </div>
          )}



          {/* CATEGORIES SUBTAB */}
          {activeSubTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white bg-[#0A2540] px-4 py-3 rounded-xl">Manage Client Panel Categories</h3>

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
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 text-sm transition-all"
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
                              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-all"
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
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white bg-[#0A2540] px-4 py-3 rounded-xl">Manage System Bank Accounts</h3>

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
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 text-sm transition-all"
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
                              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-all"
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
              <div className="space-y-3">
                <h3 className="text-base font-bold text-white bg-[#0A2540] px-4 py-3 rounded-xl">Manage Bill / Charge Types</h3>

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
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 text-sm transition-all"
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
          {activeSubTab !== 'categories' && activeSubTab !== 'banks' && activeSubTab !== 'payment-types' && activeSubTab !== 'toggles' && (
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 text-sm transition-all"
              >
                <Save className="h-4.5 w-4.5 text-white" />
                <span className='text-white'>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>

      {/* SIMULATED META SECURE AUTHORIZATION POPUP */}
      {isMetaPopupOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto !mt-0">
          <div onClick={() => setIsMetaPopupOpen(false)} className="fixed inset-0 bg-black/75 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-350 dark:border-slate-800 shadow-2xl p-6 z-10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">

            {/* Close Button */}
            <button
              onClick={() => setIsMetaPopupOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div className="h-9 w-9 rounded-full bg-[#1877F2] text-white font-extrabold flex items-center justify-center text-lg select-none">
                f
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-wide">Meta WhatsApp Integration Manager</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Secured authorization flow to developers.facebook.com</p>
              </div>
            </div>

            {/* Tab Selection Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mb-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setConnectionMode('demo')}
                className={`flex-1 py-2 rounded-lg transition-all ${connectionMode === 'demo' ? 'bg-[#1877F2] text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Developer Sandbox (Demo)
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode('production')}
                className={`flex-1 py-2 rounded-lg transition-all ${connectionMode === 'production' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Production Live Setup
              </button>
            </div>

            {connectionMode === 'demo' ? (
              <div className="space-y-4 py-2">
                {!simulationRunning && !metaVerificationSuccessful ? (
                  <div className="text-center py-6 space-y-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Press the button below to launch a simulated OAuth connection flow. This will autofill fully working simulated sandbox credentials.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartSandboxSimulation}
                      className="px-5 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-[#1877F2]/20 active:scale-95 transition-all w-full"
                    >
                      Launch Sandbox Auto-Setup Simulation
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 text-xs">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold ${metaStep > 0 ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white animate-pulse'}`}>
                        {metaStep > 0 ? '✓' : '1'}
                      </div>
                      <span className={`${metaStep >= 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                        Connecting to Meta secure login portal...
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold ${metaStep > 1 ? 'bg-emerald-500 text-white' : metaStep === 1 ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        {metaStep > 1 ? '✓' : '2'}
                      </div>
                      <span className={`${metaStep >= 1 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                        Authenticating WhatsApp Business App...
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold ${metaStep > 2 ? 'bg-emerald-500 text-white' : metaStep === 2 ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        {metaStep > 2 ? '✓' : '3'}
                      </div>
                      <span className={`${metaStep >= 2 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                        Extracting WABA ID & Phone Number ID...
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold ${metaStep > 3 ? 'bg-emerald-500 text-white' : metaStep === 3 ? 'bg-indigo-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        {metaStep > 3 ? '✓' : '4'}
                      </div>
                      <span className={`${metaStep >= 3 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                        Generating Permanent User Access Token...
                      </span>
                    </div>

                    {metaVerificationSuccessful && (
                      <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in zoom-in-95 duration-200">
                        <Check className="h-4 w-4 shrink-0" />
                        <span>Boom! Successfully linked Meta WhatsApp Account.</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleProductionVerifyAndSave} className="space-y-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider block">Meta Access Token</label>
                  <input
                    type="password"
                    value={modalToken}
                    onChange={(e) => setModalToken(e.target.value)}
                    placeholder="Enter your real permanent access token"
                    className="w-full rounded-xl px-3 py-2.5 text-xs glass-input focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider block">Phone Number ID</label>
                    <input
                      type="text"
                      value={modalPhoneId}
                      onChange={(e) => setModalPhoneId(e.target.value)}
                      placeholder="E.g., 10565..."
                      className="w-full rounded-xl px-3 py-2.5 text-xs glass-input focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider block">WABA ID</label>
                    <input
                      type="text"
                      value={modalWabaId}
                      onChange={(e) => setModalWabaId(e.target.value)}
                      placeholder="E.g., 20569..."
                      className="w-full rounded-xl px-3 py-2.5 text-xs glass-input focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider block">Recipient Test Number</label>
                  <input
                    type="text"
                    value={modalTestPhone}
                    onChange={(e) => setModalTestPhone(e.target.value)}
                    placeholder="Enter phone with country code (e.g. 917049612255)"
                    className="w-full rounded-xl px-3 py-2.5 text-xs glass-input focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="flex justify-end pt-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMetaPopupOpen(false)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalVerifying}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg text-xs font-bold text-white shadow"
                  >
                    {modalVerifying && <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent shrink-0"></div>}
                    <span>{modalVerifying ? 'Verifying...' : 'Verify & Link Account'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
