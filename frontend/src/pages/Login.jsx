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
      setError(err.message || 'Invalid email or password');
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      fontFamily: "'Inter','Segoe UI',sans-serif",
      overflow: 'hidden',
      background: '#f0f2ff',
    }}>

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
        input:focus { outline: none !important; border-color: #6366f1 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
      `}</style>

      {/* Background animated orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'orb1 12s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', animation: 'orb2 15s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '40%', left: '40%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', animation: 'orb3 10s ease-in-out infinite' }} />

        {/* Animated grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.035 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6366f1" strokeWidth="1" />
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
            background: i % 2 === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(168,85,247,0.25)',
            animation: `particle ${8 + i * 2}s linear infinite`,
            animationDelay: `${i * 1.5}s`,
          }} />
        ))}
      </div>






      {/* Main Login Card */}
      <div className="login-card" style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(24px)',
        borderRadius: '24px',
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(99,102,241,0.14), 0 4px 16px rgba(0,0,0,0.06)',
        border: '1px solid rgba(255,255,255,0.95)',
        position: 'relative', zIndex: 10,
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          {logo ? (
            <img src={logo} alt="Logo" style={{ height: '60px', maxWidth: '100%', objectFit: 'contain', marginBottom: '8px' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#1e1b4b', margin: 0, letterSpacing: '-0.5px' }}>{orgName}</h1>
            </div>
          )}
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Digitized ledger &amp; software sales manager</p>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg,transparent,#e5e7eb,transparent)', margin: '0 0 24px' }} />

        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>Welcome back</h2>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 22px' }}>Sign in to access your dashboard</p>

        {error && (
          <div style={{ marginBottom: '18px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', fontSize: '13px', color: '#dc2626', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path fill="#dc2626" fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#374151', marginBottom: '8px' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="name@company.com"
              style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', border: `1.5px solid ${touched.email && fieldErrors.email ? '#f87171' : '#e5e7eb'}`, background: touched.email && fieldErrors.email ? '#fff5f5' : '#f9fafb', color: '#111827', boxSizing: 'border-box', transition: 'all 0.2s' }}
            />
            {touched.email && fieldErrors.email && (
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" fill="#dc2626" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password with eye toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#374151', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                style={{ width: '100%', borderRadius: '12px', padding: '12px 48px 12px 16px', fontSize: '14px', border: `1.5px solid ${touched.password && fieldErrors.password ? '#f87171' : '#e5e7eb'}`, background: touched.password && fieldErrors.password ? '#fff5f5' : '#f9fafb', color: '#111827', boxSizing: 'border-box', transition: 'all 0.2s' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'background 0.15s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" fill="#dc2626" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {fieldErrors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', borderRadius: '12px', background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '14px', fontSize: '14px', fontWeight: '600', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: loading ? 'none' : '0 4px 16px rgba(99,102,241,0.35)', transition: 'all 0.2s', letterSpacing: '0.2px' }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? (
              <>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Verifying Credentials...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>Secured &amp; Encrypted</span>
          <span style={{ color: '#d1d5db', fontSize: '11px' }}>•</span>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>256-bit SSL</span>
          <span style={{ color: '#d1d5db', fontSize: '11px' }}>•</span>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>PCI Compliant</span>
        </div>
      </div>
    </div>
  );
}