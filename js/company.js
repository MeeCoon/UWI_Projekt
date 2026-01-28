// js/company.js
// Tab- & Jahres-Logik (ohne Blockade durch fehlenden User)

const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_PREFIX = 'uwi_currentCompany_';
const BOOKINGS_PREFIX = 'uwi_bookings_';

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
function bookingsKey(user) { return BOOKINGS_PREFIX + user; }

function loadCompaniesForUser(user) {
  const raw = localStorage.getItem(companiesKey(user));
  try { return raw ? JSON.parse(raw) : []; } catch(e){ console.error(e); return []; }
}

function loadBookingsForUser(user) {
  const raw = localStorage.getItem(bookingsKey(user));
  try { return raw ? JSON.parse(raw) : []; } catch(e){ console.error(e); return []; }
}

// Escape helper for safe HTML output
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

function fmt(n){ return Number(n || 0).toFixed(2) + ' €'; }

/* --------- Year Tabs Logic --------- */
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

/* --------- Tabs --------- */
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {

      // Active-Status
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Inhalte umschalten
      tabContents.forEach(c => c.classList.add('hidden'));
      const tab = btn.dataset.tab;
      const content = document.getElementById(tab);
      if (!content) return;

      content.classList.remove('hidden');

      // Jahres-Tabs nur für bestimmte Reiter
      const yearTabs = content.querySelector('.yearTabs');
      if (yearTabs) {
        renderYearTabs(yearTabs);
      }
    });
  });
});
