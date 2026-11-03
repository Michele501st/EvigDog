/**
 * @file api.js
 * @description Modular API client for communicating with the EvigDog Studio Express Backend.
 * Supports both reverse-proxied Docker deployments (/api/*), standalone local execution,
 * and Bearer token session authentication with RBAC.
 */

const API_BASE = '/api';
const TOKEN_STORAGE_KEY = 'evigdog_session_token';

/**
 * Retrieves the currently active session token from sessionStorage.
 * @returns {string|null}
 */
function getActiveToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (_e) {
    return null;
  }
}

/**
 * Saves or clears the active session token in sessionStorage.
 * @param {string|null} token
 */
function setActiveToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (_e) {
    // Ignore storage errors in restrictive environments
  }
}

/**
 * Performs an HTTP request against the Backend REST API and parses the JSON response.
 * Automatically injects the active Bearer session token if present.
 * @param {string} endpoint - API path starting with `/` (e.g. `/projects`).
 * @param {RequestInit} [options={}] - Fetch options (method, headers, body).
 * @returns {Promise<any>} Parsed JSON payload.
 */
async function apiRequest(endpoint, options = {}) {
  const token = getActiveToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Errore HTTP ${response.status}`);
  }
  return data;
}

window.EvigApi = {
  // Public Data
  getHealth: () => apiRequest('/health'),
  getStatus: () => apiRequest('/status'),
  getProjects: (category) => {
    const query =
      category && category !== 'Tutti' ? `?category=${encodeURIComponent(category)}` : '';
    return apiRequest(`/projects${query}`);
  },
  getServices: () => apiRequest('/services'),
  getTeam: () => apiRequest('/team'),
  getFaqs: () => apiRequest('/faqs'),
  submitContact: (payload) =>
    apiRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  submitNewsletter: (email, source = 'Footer CTA') =>
    apiRequest('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),

  // Authentication & Session
  getActiveToken,
  setActiveToken,
  login: async (username, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      setActiveToken(res.token);
    }
    return res;
  },
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (_e) {
      // Ignore network errors on logout
    }
    setActiveToken(null);
  },
  getMe: () => apiRequest('/auth/me'),
  updateProfile: (profileData) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  // SuperAdmin User Management
  getUsers: () => apiRequest('/admin/users'),
  createUser: (userData) =>
    apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  deleteUser: (id) =>
    apiRequest(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  // Admin Operational Endpoints
  setMaintenanceStatus: (maintenanceMode) =>
    apiRequest('/status', {
      method: 'POST',
      body: JSON.stringify({ maintenanceMode }),
    }),
  getContacts: (status) => {
    const query = status && status !== 'tutti' ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/contacts${query}`);
  },
  updateContactStatus: (id, status) =>
    apiRequest(`/contacts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteContact: (id) =>
    apiRequest(`/contacts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  getNewsletterLeads: () => apiRequest('/newsletter'),
  deleteNewsletterLead: (id) =>
    apiRequest(`/newsletter/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
