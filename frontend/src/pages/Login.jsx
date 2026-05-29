import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, setAuthToken, setLoggedUser, getAuthToken } from '@/utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState('');
  const [orgName, setOrgName] = useState('Panel Accounting');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  // 2FA Integration State
  const [step, setStep] = useState('login'); // 'login' | 'setup' | 'verify'
  const [tempToken, setTempToken] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    const token = getAuthToken();
    if (token) navigate('/dashboard', { replace: true });
    try {
      const savedSettings = localStorage.getItem('app_system_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.logo) setLogo(parsed.logo);
        if (parsed.orgName) setOrgName(parsed.orgName);
      }
    } catch (e) {
      console.error('Failed to parse saved settings', e);
    }
  }, [navigate]);

  const validateEmail = (val) => {
    if (!val) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    if (field === 'password') setFieldErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  };

  const handleChange = (field, val) => {
    if (field === 'email') {
      setEmail(val);
      if (touched.email) setFieldErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    } else {
      setPassword(val);
      if (touched.password) setFieldErrors((prev) => ({ ...prev, password: validatePassword(val) }));
    }
  };

  const fetchGenerate2FA = async (token) => {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/generate-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate 2FA credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input field
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailErr, password: passErr });
    if (emailErr || passErr) return;
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data.success) {
        if (data.twoFactorRequired) {
          setTempToken(data.tempToken);
          setOtp(['', '', '', '', '', '']);
          if (data.twoFactorEnabled) {
            setStep('verify');
          } else {
            setStep('setup');
            await fetchGenerate2FA(data.tempToken);
          }
        } else {
          // Fallback if 2FA is somehow bypassed or disabled
          setAuthToken(data.token);
          setLoggedUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            permissions: data.permissions,
          });
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ code }),
      });
      if (data.success) {
        setAuthToken(data.token);
        setLoggedUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          permissions: data.permissions,
        });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ open }) => open ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative font-sans overflow-hidden bg-slate-50">

      {/* Animated gradient orbs */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orb1 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(60px,-40px) scale(1.1); } 66% { transform: translate(-30px,50px) scale(0.95); } }
        @keyframes orb2 { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(-50px,60px) scale(1.08); } 66% { transform: translate(40px,-30px) scale(0.92); } }
        @keyframes orb3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,40px) scale(1.12); } }
        @keyframes floatUp { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes gridMove { from { transform: translateY(0); } to { transform: translateY(60px); } }
        @keyframes particle { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-10vh) rotate(720deg); opacity: 0; } }
        .stat-card { animation: floatUp 3s ease-in-out infinite; }
        .stat-card:nth-child(2) { animation-delay: 1s; }
        .stat-card:nth-child(3) { animation-delay: 2s; }
        .login-card { animation: floatUp 6s ease-in-out infinite; }
        .orb-1 { position: absolute; top: -15%; left: -10%; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(10,37,64,0.08) 0%, transparent 70%); animation: orb1 12s ease-in-out infinite; }
        .orb-2 { position: absolute; bottom: -20%; right: -10%; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%); animation: orb2 15s ease-in-out infinite; }
        .orb-3 { position: absolute; top: 40%; left: 40%; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(10,37,64,0.04) 0%, transparent 70%); animation: orb3 10s ease-in-out infinite; }
        .grid-bg { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.02; }
      `}</style>

      {/* Background animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orb-1" />
        <div className="orb-2" />
        <div className="orb-3" />

        {/* Animated grid */}
        <svg className="grid-bg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#0a2540" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            bottom: '-20px',
            left: `${10 + i * 12}%`,
            width: `${4 + (i % 3) * 3}px`,
            height: `${4 + (i % 3) * 3}px`,
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(10,37,64,0.15)' : 'rgba(99,102,241,0.12)',
            animation: `particle ${8 + i * 2}s linear infinite`,
            animationDelay: `${i * 1.5}s`,
          }} />
        ))}
      </div>

      {/* Main Login Card */}
      <div className="login-card w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 shadow-2xl relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          {logo ? (
            <img src={logo} alt="Logo" className="h-14 max-w-full object-contain mx-auto mb-2" />
          ) : (
            <div className="flex items-center justify-center gap-3 mb-2.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0A2540] flex items-center justify-center shadow-md">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-display">{orgName}</h1>
            </div>
          )}
          <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Digitized Ledger &amp; Accounting</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6" />

        {step === 'login' && (
          <>
            <h2 className="text-lg font-bold text-slate-900 font-display">Welcome Back</h2>
            <p className="text-xs text-slate-500 mb-6 mt-1">Sign in to manage client software sales &amp; ledgers</p>
          </>
        )}

        {step === 'setup' && (
          <>
            <h2 className="text-lg font-bold text-slate-900 font-display">Setup Two-Factor (2FA)</h2>
            <p className="text-xs text-slate-500 mb-5 mt-1">Scan this QR code using Google Authenticator application to register your profile.</p>
          </>
        )}

        {step === 'verify' && (
          <>
            <h2 className="text-lg font-bold text-slate-900 font-display">Two-Factor Authentication</h2>
            <p className="text-xs text-slate-500 mb-6 mt-1">Provide the 6-digit OTP code from Google Authenticator to access your dashboard.</p>
          </>
        )}

        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 flex items-start gap-3 animate-pulse-subtle">
            <svg width="18" height="18" fill="none" viewBox="0 0 20 20" className="shrink-0 mt-0.5">
              <path fill="currentColor" fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Step 1: Standard Username/Password Login */}
        {step === 'login' && (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="name@company.com"
                className={`w-full premium-input px-4 py-3 text-sm ${touched.email && fieldErrors.email ? 'border-rose-400 bg-rose-50/30' : ''}`}
              />
              {touched.email && fieldErrors.email && (
                <div className="text-xs text-rose-600 mt-1.5 flex items-center gap-1.5 font-semibold">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Password with eye toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={`w-full premium-input pl-4 pr-12 py-3 text-sm ${touched.password && fieldErrors.password ? 'border-rose-450 bg-rose-50/30' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <div className="text-xs text-rose-600 mt-1.5 flex items-center gap-1.5 font-semibold">
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0A2540]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: First-Time 2FA Setup */}
        {step === 'setup' && (
          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl p-4">
              {qrCode ? (
                <img src={qrCode} alt="2FA QR Code" className="w-44 h-44 object-contain shadow-inner rounded-lg bg-white p-2 border border-slate-200" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 border-dashed animate-pulse">
                  <span className="text-xs text-slate-400 font-bold">Generating QR Code...</span>
                </div>
              )}
              {secret && (
                <div className="mt-3.5 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secret Key</p>
                  <p className="text-xs font-mono font-bold text-[#0A2540] bg-white border border-slate-200 px-3 py-1.5 rounded-lg mt-1 select-all shadow-sm tracking-wide">
                    {secret}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-3 text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:border-[#0A2540] focus:ring-1 focus:ring-[#0A2540] outline-none shadow-sm transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(d => !d)}
              className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0A2540]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying 2FA...' : 'Complete Registration & Login'}
            </button>

            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors text-center block mt-2"
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Step 3: Regular 2FA Verification */}
        {step === 'verify' && (
          <form onSubmit={handleVerify2FA} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-3 text-center">
                Enter 6-Digit Authenticator Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-12 text-center text-lg font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:border-[#0A2540] focus:ring-1 focus:ring-[#0A2540] outline-none shadow-sm transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.some(d => !d)}
              className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0A2540]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors text-center block mt-2"
            >
              Back to Login
            </button>
          </form>
        )}

        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Secured Connection</span>
          <span>•</span>
          <span>PCI Compliant</span>
        </div>
      </div>
    </div>
  );
}