import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ApiError, configureApiBaseUrl, getConfiguredApiBaseUrl, getAccessToken, getCurrentPlayer,
  getPlayerCity, isApiConfigured, loginPlayer, logout, registerPlayer,
  upgradeBuilding, upgradeKeep
} from './backend-api.js';

const TOKEN_KEY = 'tvq_backend_access_token_v1';
function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}
function jsonResponse(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('API base URL validates protocol and removes trailing slash', () => {
  configureApiBaseUrl('https://example.test///');
  assert.equal(isApiConfigured(), true);
  assert.throws(() => configureApiBaseUrl('javascript:alert(1)'), TypeError);
  assert.throws(() => configureApiBaseUrl('http://example.test'), TypeError);
  assert.doesNotThrow(() => configureApiBaseUrl('http://localhost:8080'));
  assert.throws(() => configureApiBaseUrl('https://user:pass@example.test'), TypeError);
  assert.equal(getConfiguredApiBaseUrl(), 'http://localhost:8080');
  configureApiBaseUrl('');
  assert.equal(isApiConfigured(), false);
  assert.equal(getConfiguredApiBaseUrl(), '');
});

test('login stores access token in session storage and sends JSON credentials', async () => {
  const oldStorage = globalThis.sessionStorage;
  const oldFetch = globalThis.fetch;
  globalThis.sessionStorage = memoryStorage();
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return jsonResponse({ playerId: 'p1', nickname: 'Sərkərdə', accessToken: 'jwt-token', tokenType: 'Bearer' });
  };
  try {
    configureApiBaseUrl('https://api.example.test');
    const result = await loginPlayer({ email: 'p@example.test', password: 'password1234' });
    assert.equal(result.nickname, 'Sərkərdə');
    assert.equal(getAccessToken(), 'jwt-token');
    assert.equal(call.url, 'https://api.example.test/api/v1/auth/login');
    assert.equal(call.options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(call.options.body), { email: 'p@example.test', password: 'password1234' });
  } finally {
    configureApiBaseUrl('');
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = oldStorage;
  }
});

test('authenticated city requests attach bearer token', async () => {
  const oldStorage = globalThis.sessionStorage;
  const oldFetch = globalThis.fetch;
  globalThis.sessionStorage = memoryStorage();
  globalThis.sessionStorage.setItem(TOKEN_KEY, 'jwt-token');
  let call;
  globalThis.fetch = async (url, options) => {
    call = { url, options };
    return jsonResponse({ keepLevel: 1, gold: 1000 });
  };
  try {
    configureApiBaseUrl('https://api.example.test');
    await getPlayerCity();
    assert.equal(call.options.headers.Authorization, 'Bearer jwt-token');
    assert.equal(call.url, 'https://api.example.test/api/v1/city');
  } finally {
    configureApiBaseUrl('');
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = oldStorage;
  }
});

test('auth and city actions call the expected endpoints', async () => {
  const oldStorage = globalThis.sessionStorage;
  const oldFetch = globalThis.fetch;
  globalThis.sessionStorage = memoryStorage();
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse({ accessToken: 'test-token', keepLevel: 2 });
  };
  try {
    configureApiBaseUrl('https://api.example.test');
    await registerPlayer({ email: 'a@b.test', nickname: 'Aaa', password: 'password1234' });
    await getCurrentPlayer();
    await upgradeKeep();
    await upgradeBuilding('iron_mine');
    assert.deepEqual(calls.map(c => new URL(c.url).pathname), [
      '/api/v1/auth/register', '/api/v1/auth/me',
      '/api/v1/city/keep/upgrade', '/api/v1/city/buildings/IRON_MINE/upgrade'
    ]);
  } finally {
    configureApiBaseUrl('');
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = oldStorage;
  }
});

test('invalid building is rejected before a network request', () => {
  assert.throws(() => upgradeBuilding('castle_wall'), TypeError);
});

test('401 response clears expired session token and exposes server error', async () => {
  const oldStorage = globalThis.sessionStorage;
  const oldFetch = globalThis.fetch;
  globalThis.sessionStorage = memoryStorage();
  globalThis.sessionStorage.setItem(TOKEN_KEY, 'expired');
  globalThis.fetch = async () => jsonResponse({ error: 'Token vaxtı bitib' }, 401);
  try {
    configureApiBaseUrl('https://api.example.test');
    await assert.rejects(getCurrentPlayer(), error => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      assert.equal(error.message, 'Token vaxtı bitib');
      return true;
    });
    assert.equal(getAccessToken(), null);
  } finally {
    configureApiBaseUrl('');
    globalThis.fetch = oldFetch;
    if (oldStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = oldStorage;
  }
});

test('logout removes only the backend session token', () => {
  const oldStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = memoryStorage();
  globalThis.sessionStorage.setItem(TOKEN_KEY, 'token');
  try {
    logout();
    assert.equal(getAccessToken(), null);
  } finally {
    if (oldStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = oldStorage;
  }
});

test('backend URL is retained in tab session storage for the city page', () => {
  const oldStorage = globalThis.sessionStorage;
  const storage = memoryStorage();
  globalThis.sessionStorage = storage;
  try {
    configureApiBaseUrl('https://api.example.test/');
    assert.equal(storage.getItem('tvq_backend_api_url_v1'), 'https://api.example.test');
    assert.equal(getConfiguredApiBaseUrl(), 'https://api.example.test');
    configureApiBaseUrl('');
    assert.equal(storage.getItem('tvq_backend_api_url_v1'), null);
  } finally {
    if (oldStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = oldStorage;
  }
});
