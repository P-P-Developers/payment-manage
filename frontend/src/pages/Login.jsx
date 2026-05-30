import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, setAuthToken, setLoggedUser, getAuthToken } from '@/utils/api';

/* ─── Animated Background Canvas ─── */
const AnimatedBackground = ({ isDark }) => {
  useEffect(() => {
    const canvas = document.getElementById('login-bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const onResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    const fov = 380, zOff = 580, gridSz = 700, step = 70;
    const cosR = Math.cos(0.32), sinR = Math.sin(0.32);
    let sweep = -gridSz, t = 0;

    const project = (x, y, z) => {
      const ry = y * cosR - z * sinR;
      const rz = z * cosR + y * sinR + zOff;
      const s = fov / Math.max(8, rz);
      return { x: w / 2 + x * s, y: h / 2.4 + ry * s, s, op: Math.max(0, 1 - (rz - 150) / 900) };
    };

    const gridC = isDark ? 'rgba(99,102,241,0.14)' : 'rgba(10,37,64,0.09)';
    const nodeC = isDark ? 'rgba(56,189,248,0.35)' : 'rgba(10,37,64,0.22)';

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      sweep += 3;
      if (sweep > gridSz) sweep = -gridSz;

      for (let z = -gridSz; z <= gridSz; z += step) {
        ctx.beginPath();
        let first = true;
        const sf = Math.max(0, 1 - Math.abs(z - sweep) / 170);
        for (let x = -gridSz; x <= gridSz; x += 35) {
          const y = Math.sin(x * 0.005 + t * 0.7) * 12 * Math.cos(z * 0.005 + t * 0.5);
          const p = project(x, y, z);
          if (p.op > 0.05) { first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false; }
        }
        ctx.lineWidth = sf > 0 ? 1.6 : 0.8;
        ctx.strokeStyle = sf > 0
          ? (isDark ? `rgba(56,189,248,${sf * 0.5 + 0.12})` : `rgba(10,37,64,${sf * 0.35 + 0.08})`)
          : gridC;
        ctx.stroke();
      }
      for (let x = -gridSz; x <= gridSz; x += step) {
        ctx.beginPath(); let first = true;
        for (let z = -gridSz; z <= gridSz; z += 35) {
          const y = Math.sin(x * 0.005 + t * 0.7) * 12 * Math.cos(z * 0.005 + t * 0.5);
          const p = project(x, y, z);
          if (p.op > 0.05) { first ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); first = false; }
        }
        ctx.lineWidth = 0.8; ctx.strokeStyle = gridC; ctx.stroke();
      }
      for (let x = -gridSz; x <= gridSz; x += step) {
        for (let z = -gridSz; z <= gridSz; z += step) {
          const y = Math.sin(x * 0.005 + t * 0.7) * 12 * Math.cos(z * 0.005 + t * 0.5);
          const p = project(x, y, z);
          if (p.op > 0.08) {
            const sf2 = Math.max(0, 1 - Math.abs(z - sweep) / 130);
            const r = Math.max(1.5, p.s * 0.9 * (sf2 > 0 ? 1.8 : 1));
            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = sf2 > 0.2
              ? (isDark ? `rgba(56,189,248,${sf2 * p.op * 0.9})` : `rgba(10,37,64,${sf2 * p.op * 0.7})`)
              : nodeC;
            ctx.fill();
          }
        }
      }
      t += 0.018;
      raf = requestAnimationFrame(render);
    };
    render();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, [isDark]);

  return (
    <canvas
      id="login-bg-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: isDark ? 0.7 : 0.55 }}
    />
  );
};

/* ─── Payment Card Component ─── */
const PayCard = ({ gradient, holderName, cardNum, expiry, brand, style, animClass }) => (
  <div
    className={`absolute rounded-2xl p-5 w-56 shadow-2xl overflow-hidden ${animClass}`}
    style={{ background: gradient, ...style }}
  >
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)' }} />
    {/* Chip */}
    <div className="w-8 h-5 rounded mb-4 grid grid-cols-2 grid-rows-2 gap-px p-0.5"
      style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}>
      {[...Array(4)].map((_, i) => <div key={i} className="rounded-sm" style={{ background: 'rgba(0,0,0,0.18)' }} />)}
    </div>
    <div className="text-xs font-mono tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>
      {cardNum}
    </div>
    <div className="flex justify-between items-end">
      <div>
        <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px' }}>{holderName}</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px' }}>{expiry}</div>
      </div>
      {brand === 'mastercard' && (
        <svg width="34" height="22" viewBox="0 0 36 22">
          <circle cx="13" cy="11" r="10" fill="#eb001b" opacity="0.9" />
          <circle cx="23" cy="11" r="10" fill="#f79e1b" opacity="0.9" />
          <path d="M18 4.8a10 10 0 0 1 0 12.4A10 10 0 0 1 18 4.8z" fill="#ff5f00" />
        </svg>
      )}
      {brand === 'visa' && (
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', fontStyle: 'italic' }}>VISA</span>
      )}
    </div>
  </div>
);

/* ─── OTP Input ─── */
const OtpInput = ({ otp, onChange, onKeyDown, onPaste }) => (
  <div className="flex justify-center gap-2" onPaste={onPaste}>
    {otp.map((digit, idx) => (
      <input
        key={idx}
        id={`otp-${idx}`}
        type="text"
        maxLength={1}
        value={digit}
        onChange={(e) => onChange(idx, e.target.value)}
        onKeyDown={(e) => onKeyDown(idx, e)}
        className="w-11 h-12 text-center text-lg font-bold rounded-xl border outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: digit ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.12)',
          color: '#fff',
          boxShadow: digit ? '0 0 0 3px rgba(99,102,241,0.18)' : 'none',
        }}
      />
    ))}
  </div>
);

/* ═══════════════ MAIN LOGIN PAGE ═══════════════ */
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
  const [step, setStep] = useState('login');
  const [tempToken, setTempToken] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const [isDark, setIsDark] = useState(() => {
    const s = localStorage.getItem('app_theme');
    if (s) return s === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (getAuthToken()) navigate('/dashboard', { replace: true });
    try {
      const s = localStorage.getItem('app_system_settings');
      if (s) {
        const p = JSON.parse(s);
        if (p.logo) setLogo(p.logo);
        if (p.orgName) setOrgName(p.orgName);
      }
    } catch { }
  }, [navigate]);

  const validateEmail = (v) => {
    if (!v) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email';
    return '';
  };
  const validatePassword = (v) => {
    if (!v) return 'Password is required';
    if (v.length < 6) return 'At least 6 characters required';
    return '';
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    if (field === 'email') setFieldErrors((p) => ({ ...p, email: validateEmail(email) }));
    if (field === 'password') setFieldErrors((p) => ({ ...p, password: validatePassword(password) }));
  };

  const handleChange = (field, val) => {
    if (field === 'email') {
      setEmail(val);
      if (touched.email) setFieldErrors((p) => ({ ...p, email: validateEmail(val) }));
    } else {
      setPassword(val);
      if (touched.password) setFieldErrors((p) => ({ ...p, password: validatePassword(val) }));
    }
  };

  const fetchGenerate2FA = async (token) => {
    setLoading(true);
    try {
      const data = await apiRequest('/auth/generate-2fa', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) { setQrCode(data.qrCode); setSecret(data.secret); }
    } catch (err) {
      setError(err.message || 'Failed to generate 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (isNaN(val)) return;
    const n = [...otp]; n[idx] = val.slice(-1); setOtp(n);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
      const n = [...otp]; n[idx - 1] = ''; setOtp(n);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const d = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(d)) { setOtp(d.split('')); document.getElementById('otp-5')?.focus(); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const eErr = validateEmail(email), pErr = validatePassword(password);
    setTouched({ email: true, password: true });
    setFieldErrors({ email: eErr, password: pErr });
    if (eErr || pErr) return;
    setError(''); setLoading(true);
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
          setAuthToken(data.token);
          setLoggedUser({ _id: data._id, name: data.name, email: data.email, role: data.role, permissions: data.permissions });
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
    if (code.length !== 6) { setError('Enter a valid 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const data = await apiRequest('/auth/verify-2fa', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tempToken}` },
        body: JSON.stringify({ code }),
      });
      if (data.success) {
        setAuthToken(data.token);
        setLoggedUser({ _id: data._id, name: data.name, email: data.email, role: data.role, permissions: data.permissions });
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared input class ── */
  const inputCls = (hasErr) =>
    `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200 border bg-white/5 dark:bg-white/5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 ${hasErr
      ? 'border-rose-400 dark:border-rose-600 focus:ring-2 focus:ring-rose-400/20'
      : 'border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/15'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 dark:bg-[#060c18] transition-colors duration-300">

      {/* ── Floating orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full"
          style={{ width: 480, height: 480, top: -100, right: -80, background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(10,37,64,0.06)', filter: 'blur(80px)', animation: 'orb1 9s ease-in-out infinite' }} />
        <div className="absolute rounded-full"
          style={{ width: 360, height: 360, bottom: -60, left: -60, background: isDark ? 'rgba(16,185,129,0.09)' : 'rgba(16,185,129,0.07)', filter: 'blur(70px)', animation: 'orb2 11s ease-in-out infinite' }} />
      </div>

      {/* ── Canvas background ── */}
      <AnimatedBackground isDark={isDark} />

      {/* ── Dark mode toggle ── */}
      <button
        onClick={() => {
          const next = !isDark;
          setIsDark(next);
          localStorage.setItem('app_theme', next ? 'dark' : 'light');
        }}
        className="absolute top-5 right-5 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110 border"
        style={{
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,37,64,0.07)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(10,37,64,0.1)',
          color: isDark ? '#fff' : '#0A2540',
        }}
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        ) : (
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* ════ MAIN CARD ════ */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        style={{
          background: isDark ? 'rgba(8,15,32,0.75)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '0.5px solid rgba(255,255,255,0.08)' : '0.5px solid rgba(10,37,64,0.12)',
        }}>

        {/* ── LEFT PANEL: Payment illustration ── */}
        <div className="hidden md:flex flex-col relative overflow-hidden"
          style={{ flex: '1.15', background: 'linear-gradient(145deg, #0A2540 0%, #112e50 60%, #0e2847 100%)', padding: '48px 36px' }}>

          {/* Subtle grid overlay */}
          <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lgrid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lgrid)" />
          </svg>

          {/* Orbs */}
          <div className="absolute rounded-full pointer-events-none"
            style={{ width: 280, height: 280, top: -60, right: -60, background: 'rgba(99,102,241,0.2)', filter: 'blur(60px)' }} />
          <div className="absolute rounded-full pointer-events-none"
            style={{ width: 200, height: 200, bottom: -40, left: -30, background: 'rgba(16,185,129,0.15)', filter: 'blur(50px)' }} />

          {/* Heading */}
          <div className="relative z-10 mb-8">
            <h2 className="text-xl font-semibold text-white leading-snug">
              Digitized Ledger &amp;<br />Payment Management
            </h2>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Manage accounts, invoices &amp; transactions
            </p>
          </div>

          {/* Cards scene */}
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <div className="relative" style={{ width: 260, height: 260 }}>
              <PayCard
                gradient="linear-gradient(135deg,#1a56db 0%,#0c3483 100%)"
                holderName="Rohan Mehta" cardNum="4785 •••• •••• 2341" expiry="12 / 27" brand="mastercard"
                style={{ top: 0, left: 0, animationDelay: '0s' }}
                animClass="float-card-1"
              />
              <PayCard
                gradient="linear-gradient(135deg,#7c3aed 0%,#4c1d95 100%)"
                holderName="Priya Sharma" cardNum="5274 •••• •••• 8812" expiry="08 / 26" brand="visa"
                style={{ top: 50, right: -10, animationDelay: '1s' }}
                animClass="float-card-2"
              />
              <PayCard
                gradient="linear-gradient(135deg,#0f766e 0%,#134e4a 100%)"
                holderName="Panel Corp" cardNum="3782 •••• •••• 1005" expiry="03 / 28"
                style={{ bottom: 0, left: 20, width: '200px', animationDelay: '2s' }}
                animClass="float-card-3"
              />

              {/* TX badges */}
              <div className="absolute -right-12 top-4 rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', animation: 'floatBadge1 5s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.2)' }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7l7-7 7 7" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>Received</div>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>+₹48,200</div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-14 bottom-8 rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', animation: 'floatBadge2 6s ease-in-out infinite' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(99,102,241,0.25)' }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>Monthly Revenue</div>
                    <div style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>₹3.4L</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="relative z-10 flex gap-3 mt-6">
            {[['2,841', 'Transactions'], ['₹12.8L', 'Total Ledger'], ['99.9%', 'Uptime']].map(([n, l]) => (
              <div key={l} className="flex-1 rounded-xl py-2 px-3 text-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{n}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL: Login form ── */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-10 bg-transparent">

          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            {logo ? (
              <img src={logo} alt="Logo" className="h-10 object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#0A2540' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-base text-slate-900 dark:text-white leading-tight">{orgName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Secure &amp; Compliant Platform</div>
                </div>
              </>
            )}
          </div>

          <div className="h-px mb-6" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(10,37,64,0.08)' }} />

          {/* Step headings */}
          {step === 'login' && (
            <>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Welcome back</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sign in to manage client ledgers &amp; accounts</p>
            </>
          )}
          {step === 'setup' && (
            <>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Setup Two-Factor Auth</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Scan this QR using Google Authenticator to register your profile.</p>
            </>
          )}
          {step === 'verify' && (
            <>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Two-Factor Authentication</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter the 6-digit code from Google Authenticator.</p>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl p-3.5 text-sm"
              style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,242,242,1)', border: isDark ? '0.5px solid rgba(239,68,68,0.25)' : '0.5px solid rgba(252,165,165,1)', color: isDark ? '#fca5a5' : '#dc2626' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="flex-shrink-0 mt-0.5" style={{ color: 'inherit' }}>
                <path fill="currentColor" fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* ── STEP: login ── */}
          {step === 'login' && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest text-slate-500 dark:text-slate-400">Email Address</label>
                <input
                  type="email" value={email} placeholder="name@company.com"
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={inputCls(touched.email && fieldErrors.email)}
                />
                {touched.email && fieldErrors.email && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} placeholder="••••••••"
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    className={`${inputCls(touched.password && fieldErrors.password)} pr-11`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {showPassword ? (
                      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <svg width="11" height="11" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <a href="#" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Forgot password?</a>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#0A2540 0%,#1a56db 100%)', boxShadow: '0 4px 20px rgba(10,37,64,0.25)' }}>
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying session...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign in to dashboard
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP: 2FA setup ── */}
          {step === 'setup' && (
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div className="flex flex-col items-center rounded-2xl p-5 border"
                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,1)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,1)' }}>
                {qrCode ? (
                  <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 object-contain rounded-xl bg-white p-2 border border-slate-200" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center rounded-xl border border-dashed border-slate-300 animate-pulse">
                    <span className="text-xs text-slate-400 font-semibold">Generating...</span>
                  </div>
                )}
                {secret && (
                  <div className="mt-4 text-center">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Secret Key</p>
                    <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg tracking-wide select-all">{secret}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-3 uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Enter 6-Digit Verification Code</label>
                <OtpInput otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} />
              </div>

              <button type="submit" disabled={loading || otp.some(d => !d)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#0A2540 0%,#1a56db 100%)' }}>
                {loading ? 'Verifying 2FA...' : 'Complete Registration & Login'}
              </button>

              <button type="button" onClick={() => setStep('login')}
                className="w-full text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-center">
                ← Back to login
              </button>
            </form>
          )}

          {/* ── STEP: 2FA verify ── */}
          {step === 'verify' && (
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold mb-3 uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Enter 6-Digit Authenticator Code</label>
                <OtpInput otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} />
              </div>

              <button type="submit" disabled={loading || otp.some(d => !d)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#0A2540 0%,#1a56db 100%)' }}>
                {loading ? 'Verifying...' : 'Verify Code & Sign In'}
              </button>

              <button type="button" onClick={() => setStep('login')}
                className="w-full text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors text-center">
                ← Back to login
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-7 pt-5 flex items-center justify-center gap-2 border-t"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(10,37,64,0.08)' }}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Secured Connection &nbsp;•&nbsp; PCI Compliant &nbsp;•&nbsp; 256-bit SSL</span>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes orb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-15px)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,12px)} }
        @keyframes floatBadge1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes floatBadge2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float-card-1 { animation: fc1 5s ease-in-out infinite; }
        .float-card-2 { animation: fc2 6.5s ease-in-out infinite; }
        .float-card-3 { animation: fc3 4.5s ease-in-out infinite; }
        @keyframes fc1 { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(-2deg)} }
        @keyframes fc2 { 0%,100%{transform:translateY(0) rotate(2deg)} 50%{transform:translateY(-14px) rotate(2deg)} }
        @keyframes fc3 { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-7px) rotate(-1deg)} }
      `}</style>
    </div>
  );
}