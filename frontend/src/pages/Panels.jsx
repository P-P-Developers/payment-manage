import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, getLoggedUser } from '@/utils/api';
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
} from 'lucide-react';

export default function Panels() {
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPanelId, setEditPanelId] = useState(null); // null = add, string = edit

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

  const fetchPanels = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/panels');
      if (data.success) {
        setPanels(data.panels);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch panels list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanels();
    setUser(getLoggedUser());
  }, []);

  const handleOpenAddModal = () => {
    setEditPanelId(null);
    setPanelName('');
    setOwnerName('');
    setOwnerEmail('');
    setPhoneNumber('');
    
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
    setEditPanelId(panel._id);
    setPanelName(panel.panelName);
    setOwnerName(panel.ownerName);
    setOwnerEmail(panel.ownerEmail);
    setPhoneNumber(panel.phoneNumber);
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

    const errors = {};
    if (!panelName || panelName.trim().length < 3) {
      errors.panelName = 'Panel name must be at least 3 characters long.';
    }
    if (!ownerName || ownerName.trim().length < 3) {
      errors.ownerName = 'Owner name must be at least 3 characters long.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!ownerEmail || !emailRegex.test(ownerEmail)) {
      errors.ownerEmail = 'Please provide a valid email address.';
    }
    const cleanPhone = phoneNumber.replace(/[\s\-+]/g, '');
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      errors.phoneNumber = 'Phone number must be at least 10 digits.';
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
      return;
    }

    try {
      const payload = {
        panelName,
        ownerName,
        ownerEmail,
        phoneNumber,
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
          fetchPanels();
          setIsModalOpen(false);
        }
      } else {
        const data = await apiRequest('/panels', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (data.success) {
          setSuccess(`Panel "${panelName}" added successfully!`);
          fetchPanels();
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Action failed');
    }
  };

  const handleDeletePanel = async (panel) => {
    if (
      !confirm(
        `Are you absolutely sure you want to delete panel: ${panel.panelName}?\nThis will ALSO delete all associated payments and transaction records!`
      )
    ) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const data = await apiRequest(`/panels/${panel._id}`, {
        method: 'DELETE',
      });
      if (data.success) {
        setSuccess(`Panel "${panel.panelName}" and associated history deleted.`);
        fetchPanels();
      }
    } catch (err) {
      setError(err.message || 'Failed to remove panel');
    }
  };

  const filteredPanels = panels.filter(
    (p) =>
      p.panelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = user?.role === 'Admin';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Software Panels (Clients)</h2>
          <p className="text-sm text-slate-400">View and manage client software licenses, charges, and current ledger balances.</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 text-sm transition-all shadow-lg shadow-indigo-600/10"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Panel Client</span>
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
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by panel name or owner..."
          className="w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input"
        />
      </div>

      {/* Panels Table */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-slate-400 font-medium">Fetching registered panels...</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold tracking-wider">
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
                {filteredPanels.map((panel, index) => (
                  <tr key={panel._id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-white text-base">{panel.panelName}</p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <UserIcon className="h-3 w-3" /> {panel.ownerName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {panel.phoneNumber}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-300">
                      ₹{panel.licenseCharges?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-300">
                      ₹{panel.ipCharges?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-300">
                      ₹{panel.maintenanceCharges?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span
                          className={`font-bold text-base ${panel.outstanding > 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                        >
                          ₹{panel.outstanding?.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-medium mt-0.5">
                          Paid: ₹{panel.totalPaid?.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/dashboard/panels/${panel._id}`}
                          className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
                          title="View Panel Ledger History"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/dashboard/payments?panelId=${panel._id}&openModal=true`}
                          className="h-9 w-9 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white flex items-center justify-center border border-emerald-500/20 hover:border-emerald-500 transition-colors"
                          title="Add Payment Receipt"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(panel)}
                              className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
                              title="Edit Panel Client"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePanel(panel)}
                              className="h-9 w-9 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 flex items-center justify-center border border-slate-700 hover:border-rose-500/30 transition-colors"
                              title="Delete Panel Client"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPanels.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400">
                      No matching software panels found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PANEL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>

          <div className="relative w-full max-w-2xl rounded-2xl glass-card p-6 md:p-8 border border-slate-800 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[85vh] md:max-h-[90vh]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">
              {editPanelId ? 'Modify Panel Client' : 'Add New Panel Client'}
            </h3>

            <form onSubmit={handleSavePanel} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Panel (Client) Name
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Owner Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Owner Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 9876543210"
                      className={`w-full rounded-xl pl-11 pr-4 py-3 text-sm glass-input ${formErrors.phoneNumber ? 'border-rose-500/50 focus:border-rose-500' : ''}`}
                      required
                    />
                  </div>
                  {formErrors.phoneNumber && <p className="text-xs text-rose-400 mt-1 font-medium">{formErrors.phoneNumber}</p>}
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4">
                <h4 className="text-sm font-bold text-white mb-4">Financial & Billing Config</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      License Charges (₹)
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      IP Routing Charges (₹)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Maintenance support Charges (₹)
                    </label>
                    <div className="relative">
                      <Wrench className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Opening Balance (Previous Due Dues) (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
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
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-600 transition-all duration-300"
                >
                  {editPanelId ? 'Update Client' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
