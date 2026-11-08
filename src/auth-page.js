import {
  configureApiBaseUrl, isApiConfigured, loginPlayer, registerPlayer,
  getCurrentPlayer, ApiError
} from './backend-api.js';

const $ = (selector) => document.querySelector(selector);
const form = $('#authForm');
const loginTab = $('#loginTab');
const registerTab = $('#registerTab');
const nicknameWrap = $('#nicknameWrap');
const nickname = $('#nickname');
const email = $('#email');
const password = $('#password');
const submitButton = $('#submitButton');
const notice = $('#notice');
const apiUrl = $('#apiUrl');
let mode = 'login';

function showNotice(message, kind = '') {
  notice.textContent = message;
  notice.className = kind;
}
function setMode(next) {
  mode = next;
  const registering = mode === 'register';
  loginTab.setAttribute('aria-pressed', String(!registering));
  registerTab.setAttribute('aria-pressed', String(registering));
  nicknameWrap.classList.toggle('hidden', !registering);
  nickname.required = registering;
  password.autocomplete = registering ? 'new-password' : 'current-password';
  submitButton.textContent = registering ? 'Hesab yarat' : 'Daxil ol';
  showNotice(registering
    ? 'E-poçt, oyunçu adı və ən azı 10 simvolluq şifrə daxil et.'
    : 'Hesabına daxil olmaq üçün e-poçt və şifrəni yaz.');
}
function configureFromField() {
  const value = apiUrl.value.trim();
  if (!value) {
    configureApiBaseUrl('');
    return false;
  }
  configureApiBaseUrl(value);
  return isApiConfigured();
}

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  try {
    if (!configureFromField()) {
      showNotice('Backend server hələ yerləşdirilməyib. Server ünvanı hazır olanda burada qeydiyyat və giriş işləyəcək.', 'error');
      return;
    }
  } catch (error) {
    showNotice(error.message, 'error');
    return;
  }

  const credentials = {
    email: email.value.trim(),
    password: password.value
  };
  if (mode === 'register') credentials.nickname = nickname.value.trim();
  submitButton.disabled = true;
  submitButton.textContent = 'Gözlə…';
  try {
    const result = mode === 'register'
      ? await registerPlayer(credentials)
      : await loginPlayer(credentials);
    showNotice('Xoş gəldin, ' + result.nickname + '! Şəhər açılır…', 'ok');
    location.assign('./city.html');
  } catch (error) {
    const message = error instanceof ApiError
      ? error.message
      : 'Sorğu tamamlanmadı. Məlumatları və serveri yoxla.';
    showNotice(message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = mode === 'register' ? 'Hesab yarat' : 'Daxil ol';
  }
});

async function checkExistingSession() {
  const token = (() => { try { return sessionStorage.getItem('tvq_backend_access_token_v1'); } catch { return null; } })();
  if (!token) return;
  try {
    const savedUrl = apiUrl.value.trim();
    if (!savedUrl) return;
    configureApiBaseUrl(savedUrl);
    const player = await getCurrentPlayer();
    showNotice('Artıq ' + player.nickname + ' hesabı ilə daxil olmusan.', 'ok');
  } catch {
    // An expired token is cleared by the API helper on a 401 response.
  }
}

setMode('login');
