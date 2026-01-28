// js/company.js
// Firmenansicht – kompatibel mit overview.js (user-spezifische Speicherung)

const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_PREFIX = 'uwi_currentCompany_';

/* ------------------ Helper ------------------ */
function getCurrentUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function companiesKey(user) {
  return COMPANIES_PREFIX + user;
}

function selectedCompanyKey(user) {
  return SELECTED_COMPANY_PREFIX + user;
}

function loadCompaniesForUser(user) {
  try {
    return JSON.parse(localStorage.getItem(companiesKey(user))) || [];
  } catch {
    return [];
  }
}

/* ------------------ Year Tabs ------------------ */
function renderYearTabs(container) {
  container.innerHTML = '';

  // Startjahr
  const years = [2025];

  years.forEach(year => {
    const btn = document.createElement('button');
    btn.className = 'yearBtn active';
    btn.textContent = year;
    container.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'addYearBtn';
  addBtn.textContent = '+ Jahr hinzufügen';

  addBtn.addEventListener('click', () => {
    const input = prompt('Jahr eingeben (2026–2100)');
    const year = Number(input);

    if (!year || year < 2026 || year > 2100) {
      alert('Bitte ein gültiges Jahr zwischen 2026 und 2100 eingeben.');
      return;
    }

    const exists = [...container.querySelectorAll('.yearBtn')]
      .some(b => Number(b.textContent) === year);
    if (exists) return;

    const btn = document.createElement('button');
    btn.className = 'yearBtn';
    btn.textContent = year;

    container.insertBefore(btn, addBtn);
  });

  container.appendChild(addBtn);
}

/* ------------------ DOM Ready ------------------ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---- User & Firma laden ---- */
  const user = getCurrentUserOrRedirect();
  if (!user) return;

  const companyId = localStorage.getItem(selectedCompanyKey(user));
  if (!companyId) {
    alert('Keine Firma ausgewählt. Zurück zur Übersicht.');
    window.location.href = 'overview.html';
    return;
  }

  const companies = loadCompaniesForUser(user);
  const company = companies.find(c => c.id === companyId);

  if (!company) {
    alert('Firma nicht gefunden. Zurück zur Übersicht.');
    window.location.href = 'overview.html';
    return;
  }

  /* ---- Firmenkopf ---- */
  const titleEl = document.getElementById('companyTitle');
  const metaEl = document.getElementById('companyMeta');

  if (titleEl) titleEl.textContent = company.name;
  if (metaEl) {
    metaEl.textContent =
      `${company.legal} · ${company.industry || '–'} · ` +
      `Startkapital: ${company.capital} € · Mitarbeitende: ${company.size}`;
  }

  /* ---- Header Buttons ---- */
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userDisplay = document.getElementById('userDisplay');

  if (userDisplay) {
    userDisplay.textContent = `Angemeldet: ${user}`;
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'overview.html';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(selectedCompanyKey(user));
      window.location.href = 'index.html';
    });
  }

  /* ---- Tabs ---- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {

      // Active-State
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Inhalte wechseln
      tabContents.forEach(c => c.classList.add('hidden'));

      const tab = btn.dataset.tab;
      const content = document.getElementById(tab);
      if (!content) return;

      content.classList.remove('hidden');

      // Jahre nur bei bestimmten Reitern
      const yearTabs = content.querySelector('.yearTabs');
      if (yearTabs) {
        renderYearTabs(yearTabs);
      }
    });
  });

  // Standard: Bilanz anzeigen
  const initialTab = document.querySelector('.tab-btn.active');
  if (initialTab) initialTab.click();
});
