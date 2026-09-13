// Centralized API client and formatters for Maridimamba

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

export const formatRupees = (val) => {
  if (val === null || val === undefined || val === '') return '₹0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '₹0';

  // Indian Number Format (e.g. ₹64,500 or ₹1,50,000)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

// Token management
export const getToken = () => localStorage.getItem('maridimamba_token');
export const setToken = (token) => localStorage.setItem('maridimamba_token', token);
export const removeToken = () => localStorage.removeItem('maridimamba_token');

export const getUser = () => {
  const u = localStorage.getItem('maridimamba_user');
  return u ? JSON.parse(u) : null;
};
export const setUser = (user) => localStorage.setItem('maridimamba_user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('maridimamba_user');

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Session expired
    removeToken();
    removeUser();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errJson = await response.json();
      errorMsg = errJson.message || errJson.error || errorMsg;
    } catch (e) {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username, password) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  getMe: () => apiFetch('/auth/me'),

  // Dashboard
  getDashboard: () => apiFetch('/dashboard'),

  // Members
  getMembers: () => apiFetch('/members'),
  getActiveMembers: () => apiFetch('/members/active'),
  getMemberById: (id) => apiFetch(`/members/${id}`),
  getMemberDetails: (id) => apiFetch(`/members/${id}/details`),
  createMember: (data) => apiFetch('/members', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateMember: (id, data) => apiFetch(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  toggleMemberStatus: (id, active) => apiFetch(`/members/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ active })
  }),

  // Cycles
  getCycles: () => apiFetch('/cycles'),
  getActiveCycle: () => apiFetch('/cycles/active'),
  getAvailableBalance: () => apiFetch('/cycles/available-balance'),
  getCycleById: (id) => apiFetch(`/cycles/${id}`),
  getCycleLoans: (id) => apiFetch(`/cycles/${id}/loans`),
  getCycleSummary: (id) => apiFetch(`/cycles/${id}/summary`),
  createCycle: (data) => apiFetch('/cycles', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  assignChunks: (cycleId, chunks) => apiFetch(`/cycles/${cycleId}/chunks`, {
    method: 'POST',
    body: JSON.stringify({ chunks })
  }),
  closeCycle: (cycleId, confirmWithUnpaidLoans, notes) => apiFetch(`/cycles/${cycleId}/close`, {
    method: 'POST',
    body: JSON.stringify({ confirmWithUnpaidLoans, notes })
  }),

  // Loans
  getLoans: (status) => apiFetch(`/loans${status ? `?status=${status}` : ''}`),
  getLoanById: (id) => apiFetch(`/loans/${id}`),
  getLoanPayments: (id) => apiFetch(`/loans/${id}/payments`),
  recordPayment: (loanId, data) => apiFetch(`/loans/${loanId}/payments`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Ledger
  getLedger: () => apiFetch('/ledger'),
  getCycleLedger: (cycleId) => apiFetch(`/ledger/cycle/${cycleId}`),
  recordDeduction: (data) => apiFetch('/ledger/deduction', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Reports
  getMonthlyReport: (cycleId) => apiFetch(`/reports/monthly/${cycleId}`),
  exportReportCsv: (cycleId) => `/api/reports/monthly/${cycleId}/export`,

  // Audit
  getAuditLogs: () => apiFetch('/audit-logs')
};
