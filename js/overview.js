// js/overview.js
// Firmenübersicht (overview.html)
// - Liest angemeldeten Benutzer aus LocalStorage
// - Lädt die Firmenliste des Benutzers und zeigt sie an
// - Klick auf Firma: Firma-ID in LocalStorage speichern und zu company.html weiterleiten
// - Button "Neue Firma erstellen" → create.html
// - Logout-Funktion

const USER_KEY = 'uwi_user';
const COMPANY_KEY_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_KEY = 'uwi_currentCompany';

// Hilfsfunktionen
function getCurrentUser(){
  return localStorage.getItem(USER_KEY);
}
function requireLogin(){
  const user = getCurrentUser();
  if(!user){
    // nicht angemeldet → zur Login-Seite
    window.location.href = 'index.html';
    return null;
  }
  return user;
}
function companiesKey(user){ return COMPANY_KEY_PREFIX + user; }
function loadCompanies(user){
  const raw = localStorage.getItem(companiesKey(user));
  try{
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Fehler beim Parsen der Firmenliste:', e);
    return [];
  }
}

// Rendering
document.addEventListener('DOMContentLoaded', () => {
  const user = requireLogin();
  if(!user) return;

  // Anzeige Benutzername
  const userDisplay = document.getElementById('userDisplay');
  userDisplay.textContent = `Angemeldet: ${user}`;

  // Buttons
  document.getElementById('createBtn').addEventListener('click', () => {
    window.location.href = 'create.html';
  });
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(USER_KEY);
    // optional: auch Auswahl löschen
    localStorage.removeItem(SELECTED_COMPANY_KEY);
    window.location.href = 'index.html';
  });

  // List anzeigen
  const listEl = document.getElementById('companiesList');
  function renderList(){
    const companies = loadCompanies(user);
    listEl.innerHTML = '';
    if(companies.length === 0){
      listEl.innerHTML = '<div class="small muted">Keine Firmen vorhanden. Erstelle eine neue Firma.</div>';
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
        <div class="small muted">Mitarb.: ${escapeHtml(String(c.size || '‑'))}</div>
      `;
      // Wenn Item geklickt: speichern und weiterleiten
      item.addEventListener('click', () => {
        localStorage.setItem(SELECTED_COMPANY_KEY, c.id);
        window.location.href = 'company.html';
      });
      listEl.appendChild(item);
    });
  }

  // helper: escapeHtml to avoid XSS
  function escapeHtml(str){
    if(str === undefined || str === null) return '';
    return String(str).replace(/[&<>"']/g, function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  renderList();
});
