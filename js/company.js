// js/company.js
// Firmenansicht (company.html)
// - Lädt die aktuell ausgewählte Firma (ID in LocalStorage)
// - Zeigt Basisdaten der Firma an
// - Implementiert Tab-Navigation (Bilanz, Erfolgsrechnung, Buchungssätze, Wirtschaft, Recht)
// - Platzhalterinhalte werden angezeigt
//
// LocalStorage keys:
// - uwi_user
// - uwi_currentCompany
// - uwi_companies_<user>

const USER_KEY = 'uwi_user';
const SELECTED_COMPANY_KEY = 'uwi_currentCompany';
const COMPANY_KEY_PREFIX = 'uwi_companies_';

function getCurrentUser(){ return localStorage.getItem(USER_KEY); }
function requireLogin(){ const u = getCurrentUser(); if(!u){ window.location.href = 'index.html'; return null;} return u; }
function companiesKey(user){ return COMPANY_KEY_PREFIX + user; }

function loadCompanies(user){
  const raw = localStorage.getItem(companiesKey(user));
  try{ return raw ? JSON.parse(raw) : []; } catch(e){ console.error(e); return []; }
}

function getSelectedCompanyId(){
  return localStorage.getItem(SELECTED_COMPANY_KEY);
}

document.addEventListener('DOMContentLoaded', () => {
  const user = requireLogin();
  if(!user) return;

  // Buttons
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
  });
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'overview.html';
  });

  // Anzeige Username
  const userDisplay = document.getElementById('userDisplay');
  if(userDisplay) userDisplay.textContent = `Angemeldet: ${user}`;

  // Firma laden
  const selectedId = getSelectedCompanyId();
  if(!selectedId){
    alert('Keine Firma ausgewählt. Zur Übersicht weiterleiten.');
    window.location.href = 'overview.html';
    return;
  }
  const companies = loadCompanies(user);
  const company = companies.find(c => c.id === selectedId);
  if(!company){
    alert('Firma nicht gefunden. Zur Übersicht weiterleiten.');
    window.location.href = 'overview.html';
    return;
  }

  // Titel & Metadaten anzeigen
  document.getElementById('companyTitle').textContent = company.name;
  document.getElementById('companyMeta').textContent = `${company.legal} · ${company.industry || '—'} · Startkapital: ${company.capital} € · Mitarbeitende: ${company.size}`;

  // Tabs: einfache Implementation
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // active class für buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      // content anzeigen / verbergen
      tabContents.forEach(c => {
        if(c.id === tab) c.classList.remove('hidden');
        else c.classList.add('hidden');
      });
    });
  });

  // Platzhalterinhalte pro Tab (kann später erweitert werden)
  document.getElementById('balance').textContent =
    'Hier kommt die Bilanz für ' + company.name + '. (Platzhalter)\n' +
    'Erstellt am: ' + new Date(company.createdAt).toLocaleString();

  document.getElementById('income').textContent = 'Hier kommt die Erfolgsrechnung (Platzhalter).';

  document.getElementById('bookings').innerHTML =
    '<p>Hier können Buchungssätze gelistet werden. (Platzhalter)</p>' +
    `<p class="small muted">Bisher keine Buchungen in dieser Demo.</p>`;

  document.getElementById('economy').textContent =
    'Wirtschaftliche Informationen zur Firma (Platzhalter). Branche: ' + (company.industry || '—');

  document.getElementById('law').innerHTML =
    '<h3>Rechtliche Hinweise (Kurz)</h3>' +
    '<p class="small">Diese Inhalte sind schulische Platzhalter. Beispiele:</p>' +
    '<ul class="small"><li>Einzelunternehmen: unbeschränkte Haftung.</li><li>GmbH: Haftungsbeschränkung, Stammkapital erforderlich.</li></ul>';
});
