const TOKEN_KEY = 'tvq_backend_access_token_v1';
const API_URL_KEY = 'tvq_backend_api_url_v1';
function sessionStore() { try { return globalThis.sessionStorage || null; } catch { return null; } }
let apiBaseUrl = (() => { try { return sessionStore()?.getItem(API_URL_KEY) || ''; } catch { return ''; } })();

export class ApiError extends Error {
  constructor(status, message, payload = null) {
    super(message || `Server xətası (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function configureApiBaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) {
    apiBaseUrl = '';
    sessionStore()?.removeItem(API_URL_KEY);
    return;
  }
  let parsed;
  try { parsed = new URL(raw); } catch { throw new TypeError('API ünvanı düzgün URL olmalıdır.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new TypeError('API ünvanı yalnız təhlükəsiz HTTP(S) ünvanı ola bilər.');
  }
  apiBaseUrl = raw;
  sessionStore()?.setItem(API_URL_KEY, raw);
}

export function getConfiguredApiBaseUrl() { return apiBaseUrl; }

export function isApiConfigured() {
  return Boolean(apiBaseUrl);
}

function tokenStore() {
  try { return globalThis.sessionStorage || null; } catch { return null; }
}

export function getAccessToken() {
  return tokenStore()?.getItem(TOKEN_KEY) || null;
}

export function logout() {
  tokenStore()?.removeItem(TOKEN_KEY);
}

function saveAccessToken(token) {
  if (!token || typeof token !== 'string') throw new ApiError(502, 'Server giriş tokeni qaytarmadı.');
  const storage = tokenStore();
  if (!storage) throw new ApiError(500, 'Bu brauzerdə təhlükəsiz sessiya yaddaşı əlçatan deyil.');
  storage.setItem(TOKEN_KEY, token);
}

async function request(path, { method = 'GET', body, authenticated = true } = {}) {
  if (!apiBaseUrl) throw new Error('Backend API ünvanı hələ konfiqurasiya edilməyib.');
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = authenticated ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await globalThis.fetch(`${apiBaseUrl}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(0, 'Serverə qoşulmaq mümkün olmadı. İnternet və server ünvanını yoxla.');
  }

  let payload = null;
  try { payload = await response.json(); } catch { /* Empty or non-JSON response. */ }
  if (!response.ok) {
    const message = payload?.error || payload?.message ||
      (response.status === 401 ? 'Sessiya bitib və ya giriş məlumatları yanlışdır.' :
       response.status === 409 ? 'Sorğu mövcud oyun vəziyyəti ilə uyğun gəlmir.' :
       `Server xətası (${response.status})`);
    if (response.status === 401 && authenticated) logout();
    throw new ApiError(response.status, message, payload);
  }
  return payload;
}

async function authenticate(path, credentials) {
  const result = await request(path, { method: 'POST', body: credentials, authenticated: false });
  saveAccessToken(result?.accessToken);
  return result;
}

export const registerPlayer = (credentials) =>
  authenticate('/api/v1/auth/register', credentials);

export const loginPlayer = (credentials) =>
  authenticate('/api/v1/auth/login', credentials);

export const getCurrentPlayer = () => request('/api/v1/auth/me');
export const getPlayerCity = () => request('/api/v1/city');
export const upgradeKeep = () => request('/api/v1/city/keep/upgrade', { method: 'POST' });

export function upgradeBuilding(building) {
  const allowed = new Set(['WOODCUTTER', 'QUARRY', 'FARM', 'IRON_MINE']);
  const key = String(building || '').toUpperCase();
  if (!allowed.has(key)) throw new TypeError('Naməlum istehsal binası.');
  return request(`/api/v1/city/buildings/${encodeURIComponent(key)}/upgrade`, { method: 'POST' });
}
