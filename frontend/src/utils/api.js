const BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:8005/api' : 'https://payment.deepmindinfotech.com/backend/api')
  : 'http://localhost:8005/api';
// const BASE_URL = "https://payment.deepmindinfotech.com/backend/api";

// ─── Public IP cache ────────────────────────────────────────────────────────
// Fetched once from ipify, then reused for every API request.
// The server cannot see the real internet IP when client & server are on the
// same machine (localhost), so we send it ourselves in X-Client-IP header.
let cachedPublicIp = null;

const getPublicIp = async () => {
  if (cachedPublicIp) return cachedPublicIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'force-cache' });
    const data = await res.json();
    cachedPublicIp = data.ip || null;
  } catch {
    cachedPublicIp = null; // silently fail — server will fall back to req.ip
  }
  return cachedPublicIp;
};

// Kick off IP fetch immediately on page load (warm the cache)
if (typeof window !== 'undefined') {
  getPublicIp();
}
// ────────────────────────────────────────────────────────────────────────────

// Helper to set a cookie with a 7-day expiration by default
export const setCookie = (name, value, days = 7) => {
  if (typeof window !== 'undefined') {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${encodeURIComponent(value || "")}${expires}; path=/; SameSite=Lax`;
  }
};

// Helper to get a cookie value by name
export const getCookie = (name) => {
  if (typeof window === 'undefined' || !document.cookie) return null;

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
};

// Helper to erase/delete a cookie
export const eraseCookie = (name) => {
  if (typeof window !== 'undefined') {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`;
  }
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return getCookie('token') || window.localStorage.getItem('token');
};

export const setAuthToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) {
    setCookie('token', token, 8 / 24); // 8 hours = 8/24 days
    window.localStorage.setItem('token', token);
  } else {
    eraseCookie('token');
    window.localStorage.removeItem('token');
  }
};

export const getLoggedUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = getCookie('user') || window.localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

export const setLoggedUser = (user) => {
  if (typeof window === 'undefined') return;
  if (user) {
    const value = JSON.stringify(user);
    setCookie('user', value, 8 / 24); // 8 hours = 8/24 days
    window.localStorage.setItem('user', value);
  } else {
    eraseCookie('user');
    window.localStorage.removeItem('user');
  }
};

export const clearAuth = () => {
  eraseCookie('token');
  eraseCookie('user');
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user');
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  // Attach real public IP so server can log it accurately
  const publicIp = await getPublicIp();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(publicIp && { 'X-Client-IP': publicIp }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      if (typeof window !== 'undefined') {
        const msg = data?.message || '';
        if (msg.includes('another device') || msg.includes('Session expired')) {
          alert('⚠️ Your session has ended.\n\nThis account was logged in from another device. Please login again.');
        }
        window.location.href = '#/login';
      }
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};
