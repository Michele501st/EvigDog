/**
 * @file api.js
 * @description Modular API client for communicating with the EvigDog Studio Express Backend.
 * Supports both reverse-proxied Docker deployments (/api/*) and standalone local execution.
 */

const API_BASE = '/api';

/**
 * Performs an HTTP request against the Backend REST API and parses the JSON response.
 * @param {string} endpoint - API path starting with `/` (e.g. `/projects`).
 * @param {RequestInit} [options={}] - Fetch options (method, headers, body).
 * @returns {Promise<any>} Parsed JSON payload.
 */
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
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
  getHealth: () => apiRequest('/health'),
  getStatus: () => apiRequest('/status'),
  setMaintenanceStatus: (maintenanceMode, adminCode) =>
    apiRequest('/status', {
      method: 'POST',
      headers: { 'x-admin-code': adminCode },
      body: JSON.stringify({ maintenanceMode }),
    }),
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
  getContacts: (status, adminCode) => {
    const query = status && status !== 'tutti' ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/contacts${query}`, {
      headers: { 'x-admin-code': adminCode },
    });
  },
  updateContactStatus: (id, status, adminCode) =>
    apiRequest(`/contacts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'x-admin-code': adminCode },
      body: JSON.stringify({ status }),
    }),
  deleteContact: (id, adminCode) =>
    apiRequest(`/contacts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-code': adminCode },
    }),
  submitNewsletter: (email, source = 'Footer CTA') =>
    apiRequest('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),
  getNewsletterLeads: (adminCode) =>
    apiRequest('/newsletter', {
      headers: { 'x-admin-code': adminCode },
    }),
  deleteNewsletterLead: (id, adminCode) =>
    apiRequest(`/newsletter/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'x-admin-code': adminCode },
    }),
};

