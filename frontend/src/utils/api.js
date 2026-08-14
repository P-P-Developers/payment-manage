const BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:8005/api' : 'https://payment.deepmindinfotech.com/backend/api')
  : 'http://localhost:8005/api';
// const BASE_URL = "https://payment.deepmindinfotech.com/backend/api";

// ─── Public IP cache ────────────────────────────────────────────────────────
// Fetched once from ipify, then reused for every API request.
// The server cannot see the real internet IP when client & server are on the
// same machine (localhost), so we send it ourselves in X-Client-IP header.
let ipFetchPromise = null;

const getPublicIp = async () => {
  if (ipFetchPromise) return ipFetchPromise;

  ipFetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      const res = await fetch('https://api.ipify.org?format=json', { 
        cache: 'force-cache',
        signal: controller.signal
      });
      clearTimeout(id);
      const data = await res.json();
      return data.ip || null;
    } catch {
      return null; // silently fail — server will fall back to req.ip
    }
  })();

  return ipFetchPromise;
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
          // Check if modal already exists to prevent duplicates
          if (!document.getElementById('session-expired-modal')) {
            const overlay = document.createElement('div');
            overlay.id = 'session-expired-modal';
            overlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300';
            
            const modal = document.createElement('div');
            modal.className = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center mx-4 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95';
            
            modal.innerHTML = `
              <div class="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-900/20 mb-5 border border-rose-100 dark:border-rose-800">
                <svg class="h-7 w-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Session Expired</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">This account was logged in from another device. For your security, your current session has been ended.</p>
              <button id="session-expired-btn" class="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow-md outline-none focus:ring-2 focus:ring-rose-500/50">
                Login Again
              </button>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            document.getElementById('session-expired-btn').addEventListener('click', () => {
              overlay.style.opacity = '0';
              setTimeout(() => {
                if (document.body.contains(overlay)) {
                  document.body.removeChild(overlay);
                }
                window.location.href = '#/login';
              }, 200);
            });
          }
        } else {
          window.location.href = '#/login';
        }
      }
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};
