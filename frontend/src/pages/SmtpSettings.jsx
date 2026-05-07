import { useState, useEffect } from 'react';
import { apiRequest } from '@/utils/api';
import { Mail, Server, Shield, Send, CheckCircle, AlertCircle, Eye, EyeOff, Play, Save, Loader2 } from 'lucide-react';

export default function SmtpSettings() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState(587);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [senderName, setSenderName] = useState('Deepmind Infotech');
  const [senderEmail, setSenderEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [encryption, setEncryption] = useState('STARTTLS');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Testing modal/inline state
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testError, setTestError] = useState('');
  const [testSuccess, setTestSuccess] = useState('');

  const fetchSmtpConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/smtp/config');
      if (data.success && data.config) {
        setHost(data.config.host || '');
        setPort(data.config.port || 587);
        setUser(data.config.user || '');
        setPassword(data.config.password || '');
        setSenderEmail(data.config.senderEmail || '');
        setCcEmail(data.config.ccEmail || '');
        setEncryption(data.config.encryption || 'STARTTLS');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch SMTP configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmtpConfig();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        host,
        port: Number(port),
        user,
        password,
        senderName,
        senderEmail: user,
        ccEmail,
        encryption,
      };

      const data = await apiRequest('/smtp/config', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.success) {
        setSuccess('SMTP Configuration saved successfully!');
      } else {
        setError(data.message || 'Failed to save configuration.');
      }
    } catch (err) {
      setError(err.message || 'Error occurred while saving SMTP server settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (e) => {
    e.preventDefault();
    if (!testRecipient) {
      setTestError('Please provide a valid recipient email address.');
      return;
    }

    setTesting(true);
    setTestError('');
    setTestSuccess('');

    try {
      const payload = {
        host,
        port: Number(port),
        user,
        password,
        senderName,
        senderEmail: user,
        ccEmail,
        encryption,
        testRecipient,
      };

      const data = await apiRequest('/smtp/test', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.success) {
        setTestSuccess(data.message || 'SMTP test email sent successfully!');
      } else {
        setTestError(data.message || 'Testing connection failed.');
      }
    } catch (err) {
      setTestError(err.message || 'Failed to establish connection to SMTP server.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <Server className="h-8 w-8 text-indigo-400" />
          <span>SMTP Configuration</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1.5 max-w-2xl leading-relaxed">
          Configure outgoing SMTP mail server credentials. The system will use these parameters to automatically deliver transaction receipts, bill reminders, and notifications to your clients.
        </p>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-slate-400 font-medium">Loading server configuration...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form Card */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {error && (
              <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-start gap-3 text-rose-400 text-xs font-semibold">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3 text-emerald-400 text-xs font-semibold">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* SMTP Host */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    SMTP Host / Server
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="e.g. smtp.gmail.com"
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold"
                    required
                  />
                </div>

                {/* SMTP Port */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="e.g. 587 or 465"
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold font-mono text-indigo-300"
                    required
                  />
                </div>

                {/* SMTP Username */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    SMTP User / Account Address
                  </label>
                  <input
                    type="email"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="e.g. contact@deepmindinfotech.com"
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold text-slate-200"
                    required
                  />
                </div>

                {/* SMTP Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    SMTP Password / App Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full rounded-xl pl-4 pr-11 py-3 text-sm glass-input font-bold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Mail Sender Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Deepmind Invoice"
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold"
                  />
                </div>



                {/* CC Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Automatic CC Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="e.g. archive@deepmindinfotech.com"
                    className="w-full rounded-xl px-4 py-3 text-sm glass-input font-bold"
                  />
                </div>

                {/* Encryption Selector */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Encryption Protocol / Security
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['STARTTLS', 'SSL/TLS', 'None'].map((enc) => (
                      <button
                        key={enc}
                        type="button"
                        onClick={() => setEncryption(enc)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                          encryption === enc
                            ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {enc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Trigger */}
              <div className="pt-4 border-t border-slate-900 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-indigo-600/15 disabled:opacity-40 transition-all"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Save Mail Settings</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info & Test Side panel */}
          <div className="space-y-6">
            {/* Quick Testing Card */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800/80 p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-900">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Send className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-white text-sm">Test SMTP Gateway</h4>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed mb-5">
                Verify your SMTP credentials by dispatching a real connection test email to any inbox instantly.
              </p>

              {testError && (
                <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 flex items-start gap-2.5 text-rose-400 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-tight">{testError}</p>
                </div>
              )}

              {testSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-start gap-2.5 text-emerald-400 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="leading-tight">{testSuccess}</p>
                </div>
              )}

              <form onSubmit={handleTestConnection} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Test Recipient Email
                  </label>
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="e.g. testing@gmail.com"
                    className="w-full rounded-xl px-3.5 py-2.5 text-xs glass-input font-bold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={testing || !host || !user || !password}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-2.5 text-xs shadow-lg shadow-emerald-600/10 disabled:opacity-40 transition-all"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  <span>Trigger Connection Test</span>
                </button>
              </form>
            </div>

            {/* Quick Guidelines */}
            <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/10 p-6 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Shield className="h-4.5 w-4.5" />
                <span>Security Guidelines</span>
              </div>
              <ul className="space-y-2.5 text-[11px] text-slate-400 leading-relaxed list-disc list-inside">
                <li>For <strong>Gmail</strong>, use a secure 16-digit App Password, not your account master password.</li>
                <li>Ensure Port <strong>587</strong> is configured for STARTTLS or Port <strong>465</strong> for SSL/TLS encryption.</li>
                <li>Check your server firewall policies to permit outgoing mail delivery on these ports.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
