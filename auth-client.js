// ---- Config ----
// Change this when you deploy the backend (e.g. to your Render/Railway/Fly URL).
const API_BASE = window.MISHAH_API_BASE || 'http://localhost:4000/api';

// ---- Session storage ----
// Note: uses localStorage so a login persists across page loads on a real
// multi-page site. If you're previewing this inside a sandboxed artifact
// viewer rather than a real browser tab, storage may not persist there —
// it works normally once deployed or opened directly in a browser.
function saveSession(token, user) {
  localStorage.setItem('mishah_token', token);
  localStorage.setItem('mishah_user', JSON.stringify(user));
}
function getToken() { return localStorage.getItem('mishah_token'); }
function getUser() {
  const raw = localStorage.getItem('mishah_user');
  return raw ? JSON.parse(raw) : null;
}
function clearSession() {
  localStorage.removeItem('mishah_token');
  localStorage.removeItem('mishah_user');
}

// ---- API helper ----
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// ---- Route guard: call at top of a dashboard page ----
// Redirects to login if not signed in, or to the correct dashboard if role doesn't match.
function requireRole(role) {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
    return null;
  }
  if (user.role !== role) {
    window.location.href = dashboardUrlForRole(user.role);
    return null;
  }
  return user;
}

function dashboardUrlForRole(role) {
  if (role === 'employer') return 'dashboard-employer.html';
  if (role === 'seeker') return 'dashboard-seeker.html';
  if (role === 'admin') return 'dashboard-admin.html';
  return 'index.html';
}

// ---- Nav account slot: shown on every page ----
function renderNavAuth() {
  const slot = document.getElementById('nav-account-slot');
  if (!slot) return;
  const user = getUser();

  if (!user) {
    slot.innerHTML = `
      <a href="login.html">Log in</a>
      <a href="register.html" class="nav-cta">Get started</a>
    `;
    return;
  }

  slot.innerHTML = `
    <span class="greet">Hi, <strong>${escapeHtml(user.name.split(' ')[0])}</strong></span>
    <a href="${dashboardUrlForRole(user.role)}">Dashboard</a>
    <button class="link-btn" id="logout-btn">Log out</button>
  `;
  document.getElementById('logout-btn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

document.addEventListener('DOMContentLoaded', renderNavAuth);
