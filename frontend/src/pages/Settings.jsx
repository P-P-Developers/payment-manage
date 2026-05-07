import { useState, useEffect } from 'react';
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
} from 'lucide-react';

export default function Settings() {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-indigo-400" />
          <span>System & Account Settings</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
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
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${
              activeSubTab === 'branding'
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Building2 className="h-4.5 w-4.5" />
            <span>Profile & Branding</span>
          </button>

          <button
            onClick={() => setActiveSubTab('billing')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${
              activeSubTab === 'billing'
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Receipt className="h-4.5 w-4.5" />
            <span>Billing Defaults</span>
          </button>

          <button
            onClick={() => setActiveSubTab('toggles')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 border ${
              activeSubTab === 'toggles'
                ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20'
                : 'text-slate-400 border-transparent hover:bg-slate-900 hover:text-white'
            }`}
          >
            {autoReminder || smsAlerts ? <ToggleRight className="h-4.5 w-4.5 text-indigo-400" /> : <ToggleLeft className="h-4.5 w-4.5" />}
            <span>Feature Toggles</span>
          </button>

          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-xs text-slate-500 mt-6">
            <div className="flex items-center gap-1.5 font-bold text-slate-400 mb-1">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Permission Notice</span>
            </div>
            This module is restricted to Admin role and permitted Staff users only. Altering settings updates globally.
          </div>
        </div>

        {/* Configurations Form Panel */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-3 bg-slate-900/30 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          
          {/* BRANDING SUBTAB */}
          {activeSubTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Organization Profile Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization / Brand Name</label>
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice Prefix</label>
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Email Address</label>
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
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Support Phone Number</label>
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
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Default Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white"
                >
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                </select>
              </div>

              {/* Logo & Stamp upload section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/60">
                {/* Logo Upload Card */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Company Logo</label>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Recommended: Square format (PNG/JPG), transparent background</span>
                  </div>

                  <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-300 min-h-[160px]">
                    {logo ? (
                      <div className="relative flex flex-col items-center gap-3">
                        <img src={logo} alt="Company Logo" className="max-h-24 max-w-full rounded-xl object-contain bg-slate-900/60 p-2 border border-slate-800" />
                        <button
                          type="button"
                          onClick={() => setLogo('')}
                          className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:border-rose-500 hover:text-white px-2.5 py-1.5 text-[10px] font-bold text-rose-400 transition-all"
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
                        <span className="text-xs font-bold text-slate-300 mt-3 block group-hover:text-white transition-colors">Upload Company Logo</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">Click to browse your files</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Stamp Upload Card */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Authorized Sign / Stamp</label>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Recommended: Transparent PNG, dark color (blue/black/green)</span>
                  </div>

                  <div className="relative group flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 bg-slate-950/20 hover:bg-slate-950/40 transition-all duration-300 min-h-[160px]">
                    {stamp ? (
                      <div className="relative flex flex-col items-center gap-3">
                        <img src={stamp} alt="Authorized Stamp" className="max-h-24 max-w-full rounded-xl object-contain bg-white/5 p-2 border border-slate-800" />
                        <button
                          type="button"
                          onClick={() => setStamp('')}
                          className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:border-rose-500 hover:text-white px-2.5 py-1.5 text-[10px] font-bold text-rose-400 transition-all"
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
                        <span className="text-xs font-bold text-slate-300 mt-3 block group-hover:text-white transition-colors">Upload Stamp / Signature</span>
                        <span className="text-[10px] text-slate-500 mt-1 block">Click to browse your files</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BILLING DEFAULTS SUBTAB */}
          {activeSubTab === 'billing' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Standard Base Charge Rates Defaults</h3>
              <p className="text-xs text-slate-400">
                These rates populate as defaults when onboarding new software panel clients into the ledger system.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default License Fee (₹)</label>
                  <input
                    type="number"
                    value={defaultLicense}
                    onChange={(e) => setDefaultLicense(e.target.value)}
                    placeholder="1000"
                    className="w-full glass-input font-mono"
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default IP Routing Fee (₹)</label>
                  <input
                    type="number"
                    value={defaultIp}
                    onChange={(e) => setDefaultIp(e.target.value)}
                    placeholder="500"
                    className="w-full glass-input font-mono"
                    min="0"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default Maintenance Fee (₹)</label>
                  <input
                    type="number"
                    value={defaultMaint}
                    onChange={(e) => setDefaultMaint(e.target.value)}
                    placeholder="10000"
                    className="w-full glass-input font-mono"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* FEATURE TOGGLES SUBTAB */}
          {activeSubTab === 'toggles' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Automated Actions & Services</h3>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-white">Daily Auto Database Backup</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Encrypts and stores transaction entries daily inside secure cloud vaults.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoBackup(!autoBackup)}
                    className="text-indigo-400 hover:text-white transition-all shrink-0"
                  >
                    {autoBackup ? <ToggleRight className="h-10 w-10 text-emerald-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-white">Send Email Reminders on Overdue Bills</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Sends automated notifications to client email when outstanding exceeds ₹0.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoReminder(!autoReminder)}
                    className="text-indigo-400 hover:text-white transition-all shrink-0"
                  >
                    {autoReminder ? <ToggleRight className="h-10 w-10 text-emerald-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-white">Enable Real-Time WhatsApp/SMS Receipts</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Dispatches SMS confirmation codes and receipt PDFs on payment collection.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmsAlerts(!smsAlerts)}
                    className="text-indigo-400 hover:text-white transition-all shrink-0"
                  >
                    {smsAlerts ? <ToggleRight className="h-10 w-10 text-emerald-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 text-white font-bold px-6 py-3 text-sm transition-all shadow-lg shadow-indigo-600/10"
            >
              <Save className="h-4.5 w-4.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
