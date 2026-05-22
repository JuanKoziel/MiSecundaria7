const API_BASE = '/api';

function parseApiError(data) {
  if (!data) return 'Error en la solicitud';
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return String(data.non_field_errors[0]);
  }
  if (typeof data === 'object') {
    const parts = [];
    for (const [field, value] of Object.entries(data)) {
      const msg = Array.isArray(value) ? value[0] : value;
      if (msg != null && msg !== '') {
        parts.push(`${field}: ${msg}`);
      }
    }
    if (parts.length > 0) return parts.join(' · ');
  }
  return 'Error en la solicitud';
}

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Token ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    throw new Error(parseApiError(data));
  }

  return data;
}
