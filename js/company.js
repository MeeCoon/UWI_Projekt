// js/company.js
// Firmenansicht mit Tabs, Firmenauswahl und Jahres-Buttons

const USER_KEY = 'uwi_user';
const COMPANIES_KEY = 'uwi_companies';
const CURRENT_COMPANY_KEY = 'uwi_currentCompany';

/* ------------------ Helper ------------------ */
function getCurrentUser() {
  return localStorage.getItem(USER_KEY);
}

function loadCompanies() {
  try {
    return JSON.parse(localStorage.getItem(COMPANIES_KEY)) || [];
  } catch {
    return [];
  }
}

function getCurrentCompany() {
  const id = localStorage.getItem(CURRENT_COMPANY_KEY);
  if (!id) return null;
  return loadCompanies().find(c => c.id === id) || null;
}

/* ------------------ Year Tabs ------------------ */
function renderYearTabs(container) {
  container.innerHTML = '';

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

  /* ---- Firma laden ---- */
  const company = getCurrentCompany();
  if (!company) {
    alert('Keine Firma ausgewählt. Zurück zur Übersicht.');
    window.location.href = 'overview.html';
    return;
  }

  const titleEl = document.getElementById('companyTitle');
  const metaEl = document.getElementById('companyMeta');

  if (titleEl) titleEl.textContent = company.name;
  if (metaEl) {
    metaEl.textContent =
      `${company.legal || ''} · ${company.industry || '–'} · ` +
      `Startkapital: ${company.capital || '-'} € · ` +
      `Mitarbeitende: ${company.size || '-'}`;
  }

  /* ---- Header Buttons ---- */
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userDisplay = document.getElementById('userDisplay');

  const user = getCurrentUser();
  if (user && userDisplay) {
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
      localStorage.removeItem(CURRENT_COMPANY_KEY);
      window.location.href = 'index.html';
    });
  }

  /* ---- Tabs ---- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {

      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach(c => c.classList.add('hidden'));

      const tab = btn.dataset.tab;
      const content = document.getElementById(tab);
      if (!content) return;

      content.classList.remove('hidden');

      // Jahres-Tabs nur bei Bilanz / Erfolgsrechnung / Buchungssätze
      const yearTabs = content.querySelector('.yearTabs');
      if (yearTabs) {
        renderYearTabs(yearTabs);
      }
    });
  });

  // Standard: Bilanz initial laden
  const initialTab = document.querySelector('.tab-btn.active');
  if (initialTab) initialTab.click();
});
