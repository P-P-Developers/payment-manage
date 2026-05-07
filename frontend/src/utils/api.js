const BASE_URL = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' ? 'http://localhost:8005/api' : 'https://payment.deepmindinfotech.com/backend/api')
  : 'http://localhost:8005/api';

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
  if (typeof window !== 'undefined') {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
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
  return getCookie('token');
};

export const setAuthToken = (token) => {
  if (token) {
    setCookie('token', token, 7);
  } else {
    eraseCookie('token');
  }
};

export const getLoggedUser = () => {
  const userStr = getCookie('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    return null;
  }
};

export const setLoggedUser = (user) => {
  if (user) {
    setCookie('user', JSON.stringify(user), 7);
  } else {
    eraseCookie('user');
  }
};

export const clearAuth = () => {
  eraseCookie('token');
  eraseCookie('user');
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};
