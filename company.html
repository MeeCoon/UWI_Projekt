// js/company.js
// Firmenansicht (company.html)
// - Liest die ausgewählte Firma, die pro Benutzer gespeichert ist unter:
//     uwi_currentCompany_<username>
// - Zeigt Platzhalterinhalte für Tabs (Bilanz, Erfolgsrechnung, Buchungen, Wirtschaft, Recht)
// - Logout entfernt nur Anmeldung und die Auswahl des aktuellen Benutzers

const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_PREFIX = 'uwi_currentCompany_';

function getCurrentUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}
function companiesKey(user) { return COMPANIES_PREFIX + user; }
function selectedCompanyKey(user) { return SELECTED_COMPANY_PREFIX + user; }

function loadCompaniesForUser(user) {
  const raw = localStorage.getItem(companiesKey(user));
  try { return raw ? JSON.parse(raw) : []; } catch(err) { console.error(err); return []; }
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUserOrRedirect();
  if (!user) return;

  // Buttons
  const logoutBtn = document.getElementById('logoutBtn');
  const backBtn = document.getElementById('backBtn');

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(selectedCompanyKey(user));
    window.location.href = 'index.html';
  });
  backBtn.addEventListener('click', () => {
    window.location.href = 'overview.html';
  });

  // Anzeige User
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay) userDisplay.textContent = `Angemeldet: ${user}`;

  // geladene Firma ermitteln (per-user)
  const selId = localStorage.getItem(selectedCompanyKey(user));
  if (!selId) {
    alert('Keine Firma ausgewählt. Zur Übersicht weitergeleitet.');
    window.location.href = 'overview.html';
    return;
  }

  const companies = loadCompaniesForUser(user);
  const company = companies.find(c => c.id === selId);
  if (!company) {
    alert('Ausgewählte Firma nicht gefunden. Zur Übersicht weitergeleitet.');
    window.location.href = 'overview.html';
    return;
  }

  // Anzeige Titel & Metadaten
  const titleEl = document.getElementById('companyTitle');
  const metaEl = document.getElementById('companyMeta');
  if (titleEl) titleEl.textContent = company.name;
  if (metaEl) metaEl.textContent = `${company.legal} · ${company.industry || '–'} · Startkapital: ${company.capital} € · Mitarbeitende: ${company.size}`;

  // Tabs: einfache Umschaltung
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      tabContents.forEach(c => {
        if (c.id === tab) c.classList.remove('hidden'); else c.classList.add('hidden');
      });
    });
  });

  // Platzhalterinhalte (können erweitert werden)
  const created = new Date(company.createdAt).toLocaleString();
  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('income');
  const bookingsEl = document.getElementById('bookings');
  const economyEl = document.getElementById('economy');
  const lawEl = document.getElementById('law');

  if (balanceEl) balanceEl.textContent = `Hier kommt die Bilanz für ${escapeHtml(company.name)}. (Erstellt: ${created})`;
  if (incomeEl) incomeEl.textContent = 'Hier kommt die Erfolgsrechnung (Platzhalter).';
  if (bookingsEl) bookingsEl.innerHTML = '<p>Hier können Buchungssätze gelistet werden. (Platzhalter)</p><p class="small muted">Noch keine Buchungen vorhanden.</p>';
  if (economyEl) economyEl.textContent = `Wirtschaftliche Informationen zur Firma (Platzhalter). Branche: ${escapeHtml(company.industry || '–')}`;
  if (lawEl) lawEl.innerHTML = '<h3>Rechtliche Hinweise (Kurz)</h3><p class="small">Diese Inhalte sind schulische Platzhalter.</p>';
});
