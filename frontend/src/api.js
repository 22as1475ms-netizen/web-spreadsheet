const sessionStorageKey = 'web-spreadsheet-auth';
const fallbackTokenKey = 'token';

function readStoredSession() {
  try {
    const raw = localStorage.getItem(sessionStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readToken() {
  return (
    readStoredSession()?.token ||
    localStorage.getItem(fallbackTokenKey) ||
    ''
  );
}

function getDefaultBaseUrl() {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  return 'http://localhost:4000';
}

function buildUrl(path) {
  const baseUrl = (import.meta.env.VITE_API_URL || getDefaultBaseUrl()).replace(/\/+$/, '');
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function request(path, options = {}) {
  const token = readToken();
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers
    });
  } catch {
    throw new Error('Unable to reach the backend. Make sure the API server is running on port 4000.');
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const responseText =
      typeof payload === 'string'
        ? payload
        : '';
    const looksLikeProxyFailure =
      response.status >= 500 &&
      /ECONNREFUSED|proxy error|socket hang up|fetch failed/i.test(responseText);
    const error = new Error(
      looksLikeProxyFailure
        ? 'Unable to reach the backend. Make sure the API server is running on port 4000.'
        : typeof payload === 'object' && payload?.message
        ? payload.message
        : `Request failed with status ${response.status}.`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

const API = {
  get(path, options = {}) {
    return request(path, {
      ...options,
      method: 'GET'
    });
  },
  post(path, body, options = {}) {
    return request(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body ?? {})
    });
  },
  patch(path, body, options = {}) {
    return request(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body ?? {})
    });
  },
  delete(path, options = {}) {
    return request(path, {
      ...options,
      method: 'DELETE'
    });
  },
  healthcheck() {
    return request('/test', {
      method: 'GET'
    });
  }
};

export default API;
