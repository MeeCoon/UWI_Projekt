// js/overview.js
// Firmenübersicht (overview.html)
// - Verwaltet Firmen pro angemeldetem Benutzer.
// - Setzt die ausgewählte Firma pro Benutzer (uwi_currentCompany_<username>).
// - Logout entfernt nur die Anmeldung und die Auswahl, nicht die Firmen-Daten.

// LocalStorage keys / Prefixes
const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_PREFIX = 'uwi_currentCompany_';

// Helper: get current username or redirect to login
function getCurrentUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    // nicht angemeldet → Login
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// Helper: key builders
function companiesKey(user) { return COMPANIES_PREFIX + user; }
function selectedCompanyKey(user) { return SELECTED_COMPANY_PREFIX + user; }

// Lade Firmenliste für user
function loadCompaniesForUser(user) {
  const raw = localStorage.getItem(companiesKey(user));
  try {
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Fehler beim Parsen der Firmenliste aus LocalStorage:', err);
    return [];
  }
}

// Escape HTML (einfacher Schutz vor XSS)
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUserOrRedirect();
  if (!user) return;

  // UI-Elemente
  const userDisplay = document.getElementById('userDisplay');
  const createBtn = document.getElementById('createBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const listEl = document.getElementById('companiesList');

  // Anzeigen wer eingeloggt ist
  if (userDisplay) userDisplay.textContent = `Angemeldet: ${user}`;

  // Neuer Firma-Button
  createBtn.addEventListener('click', () => {
    window.location.href = 'create.html';
  });

  // Logout: Entfernt nur Anmeldung und Auswahl, nicht Firmen
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(selectedCompanyKey(user)); // Auswahl des Benutzers löschen
    window.location.href = 'index.html';
  });

  // Render-Funktion
  function renderList() {
    const companies = loadCompaniesForUser(user);
    listEl.innerHTML = '';

    if (!companies || companies.length === 0) {
      listEl.innerHTML = '<div class="small muted">Keine Firmen vorhanden. Erstellen Sie eine neue Firma.</div>';
      return;
    }

    companies.forEach(c => {
      const item = document.createElement('div');
      item.className = 'company-item';
      item.innerHTML = `
        <div>
          <div style="font-weight:600">${escapeHtml(c.name)}</div>
          <div class="small muted">${escapeHtml(c.legal)} · ${escapeHtml(c.industry || '')}</div>
        </div>
        <div class="small muted">Mitarb.: ${escapeHtml(String(c.size || '–'))}</div>
      `;

      // Klick auf Firma: speichere Auswahl pro-user und weiterleiten
      item.addEventListener('click', () => {
        localStorage.setItem(selectedCompanyKey(user), c.id);
        window.location.href = 'company.html';
      });

      listEl.appendChild(item);
    });
  }

  // initial render
  renderList();
});
