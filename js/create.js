// js/create.js
// Neue Firma erstellen (create.html)
// - Speichert Firma unter 'uwi_companies_<username>'
// - Jede Firma bleibt nach Logout erhalten (da nur LocalStorage genutzt wird)
// - Nach Erstellung Weiterleitung zu overview.html

const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';

// Helfer
function getCurrentUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}
function companiesKey(user) { return COMPANIES_PREFIX + user; }
function loadCompaniesForUser(user) {
  const raw = localStorage.getItem(companiesKey(user));
  try { return raw ? JSON.parse(raw) : []; } catch(err) { console.error(err); return []; }
}

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUserOrRedirect();
  if (!user) return;

  // Benutzeranzeige und Buttons
  const userDisplay = document.getElementById('userDisplay');
  if (userDisplay) userDisplay.textContent = `Angemeldet: ${user}`;

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(USER_KEY);
    // optional: Auswahl löschen
    localStorage.removeItem('uwi_currentCompany_' + user);
    window.location.href = 'index.html';
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = 'overview.html';
  });

  // Formularverarbeitung
  const form = document.getElementById('createForm');
  form.addEventListener('submit', ev => {
    ev.preventDefault();

    // Werte lesen
    const name = document.getElementById('name').value.trim();
    const legal = document.getElementById('legal').value;
    const capital = parseFloat(document.getElementById('capital').value) || 0;
    const industry = document.getElementById('industry').value.trim();
    const purpose = document.getElementById('purpose').value.trim();
    const size = parseInt(document.getElementById('size').value) || 0;

    if (!name) {
      alert('Bitte einen Firmennamen eingeben.');
      return;
    }

    // Firma-Objekt
    const company = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      name,
      legal,
      capital,
      industry,
      purpose,
      size,
      createdAt: new Date().toISOString()
    };

    // Speichern unter user-spezifischem Schlüssel
    const companies = loadCompaniesForUser(user);
    companies.push(company);
    localStorage.setItem(companiesKey(user), JSON.stringify(companies));

    // Zur Ansicht: zurück zur Übersicht
    window.location.href = 'overview.html';
  });
});
