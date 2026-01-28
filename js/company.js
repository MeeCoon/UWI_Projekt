// js/company.js
// Erweiterte Firmenansicht mit tab-gesteuerter Anzeige (Bilanz / Erfolgsrechnung / Buchungssätze / Wirtschaft / Recht)
// Verhalten gemäß Anforderung:

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
    const input = prompt('Jahr eingeben (2026–2100):');
    const year = Number(input);

    if (!year || year < 2026 || year > 2100) {
      alert('Bitte ein gültiges Jahr zwischen 2026 und 2100 eingeben.');
      return;
    }

    // Prüfen ob Jahr schon existiert
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


// ------------------------- Bilanzdarstellung -------------------------

// Diese Funktion zeigt die Bilanz direkt im bestehenden Tab an
function showBalanceTab(contentEl) {
  const header = createHeaderTrigger('Bilanz 2024', () => {
    contentEl.innerHTML = ''; // Inhalt vorher löschen

    // Dynamische Bilanz-Struktur erstellen
    const bilanzContainer = document.createElement('div');
    bilanzContainer.classList.add('bilanz-container');

    // Linke Spalte: Aktiva
    const aktivaColumn = document.createElement('div');
    aktivaColumn.classList.add('column', 'column-left');
    aktivaColumn.setAttribute('aria-label', 'Aktiva');
    
    // Umlaufvermögen
    const umlaufvermoegenBlock = document.createElement('div');
    umlaufvermoegenBlock.classList.add('block');
    umlaufvermoegenBlock.innerHTML = `
      <div class="block-title">Umlaufvermögen</div>
      <div class="row"><div class="label">Kasse</div><div class="amount">2</div></div>
      <div class="row"><div class="label">Bank</div><div class="amount">20</div></div>
      <div class="row"><div class="label">Forderungen aus Lieferungen und Leistungen</div><div class="amount">35</div></div>
      <div class="row"><div class="label">Vorräte Rohstoffe</div><div class="amount">40</div></div>
      <div class="row"><div class="label">Vorräte Handelswaren</div><div class="amount">55</div></div>
    `;
    aktivaColumn.appendChild(umlaufvermoegenBlock);

    // Anlagevermögen
    const anlagevermoegenBlock = document.createElement('div');
    anlagevermoegenBlock.classList.add('block');
    anlagevermoegenBlock.innerHTML = `
      <div class="block-title">Anlagevermögen</div>
      <div class="row"><div class="label">Informatik</div><div class="amount">5</div></div>
      <div class="row"><div class="label">Fahrzeuge</div><div class="amount">23</div></div>
      <div class="row"><div class="label">Mobiliar und Einrichtungen</div><div class="amount">30</div></div>
    `;
    aktivaColumn.appendChild(anlagevermoegenBlock);

    // Total Aktiven
    const totalAktiven = document.createElement('div');
    totalAktiven.classList.add('total-row');
    totalAktiven.innerHTML = `<div class="total-label">Total Aktiven</div><div class="total-value">210</div>`;
    aktivaColumn.appendChild(totalAktiven);

    bilanzContainer.appendChild(aktivaColumn);

    // Rechte Spalte: Passiva
    const passivaColumn = document.createElement('div');
    passivaColumn.classList.add('column', 'column-right');
    passivaColumn.setAttribute('aria-label', 'Passiva');

    // Fremdkapital
    const fremdkapitalBlock = document.createElement('div');
    fremdkapitalBlock.classList.add('block');
    fremdkapitalBlock.innerHTML = `
      <div class="block-title">Fremdkapital</div>
      <div class="row"><div class="label">Verbindlichkeiten aus Lieferungen und Leistungen</div><div class="amount">15</div></div>
      <div class="row"><div class="label">Bankverbindlichkeiten</div><div class="amount">25</div></div>
    `;
    passivaColumn.appendChild(fremdkapitalBlock);

    // Eigenkapital
    const eigenkapitalBlock = document.createElement('div');
    eigenkapitalBlock.classList.add('block');
    eigenkapitalBlock.innerHTML = `
      <div class="block-title">Eigenkapital</div>
      <div class="row"><div class="label">Aktienkapital</div><div class="amount">100</div></div>
      <div class="row"><div class="label">Gesetzliche Gewinnreserve</div><div class="amount">50</div></div>
      <div class="row"><div class="label">Jahresgewinn</div><div class="amount">20</div></div>
    `;
    passivaColumn.appendChild(eigenkapitalBlock);

    // Total Passiven
    const totalPassiven = document.createElement('div');
    totalPassiven.classList.add('total-row');
    totalPassiven.innerHTML = `<div class="total-label">Total Passiven</div><div class="total-value">210</div>`;
    passivaColumn.appendChild(totalPassiven);

    bilanzContainer.appendChild(passivaColumn);

    contentEl.appendChild(bilanzContainer);
  });

  contentEl.appendChild(header);
}

// ------------------------- Tab-Rendering-Logik -------------------------
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUserOrRedirect();
  if(!user) return;

  const logoutBtn = document.getElementById('logoutBtn');
  const backBtn = document.getElementById('backBtn');
  const userDisplay = document.getElementById('userDisplay');

  if(userDisplay) userDisplay.textContent = `Angemeldet: ${user}`;
  if(backBtn) backBtn.addEventListener('click', ()=> window.location.href = 'overview.html');
  if(logoutBtn) logoutBtn.addEventListener('click', ()=>{
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(selectedCompanyKey(user));
    window.location.href = 'index.html';
  });

  const selId = localStorage.getItem(selectedCompanyKey(user));
  if(!selId){
    alert('Keine Firma ausgewählt. Zurück zur Übersicht.');
    window.location.href = 'overview.html';
    return;
  }
  const companies = loadCompaniesForUser(user);
  const company = companies.find(c => c.id === selId);
  if(!company){
    alert('Firma nicht gefunden. Zurück zur Übersicht.');
    window.location.href = 'overview.html';
    return;
  }

  const titleEl = document.getElementById('companyTitle');
  const metaEl = document.getElementById('companyMeta');
  if(titleEl) titleEl.textContent = company.name;
  if(metaEl) metaEl.textContent = `${company.legal} · ${company.industry || '–'} · Startkapital: ${company.capital} € · Mitarbeitende: ${company.size}`;

  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));

  tabButtons.forEach(b => b.classList.remove('active'));
  tabContents.forEach(c => { c.classList.add('hidden'); c.innerHTML = ''; });

  function clearAllContentAreas(){
    tabContents.forEach(c => { c.classList.add('hidden'); c.innerHTML = ''; });
  }

  function createHeaderTrigger(text, onClick){
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '10px';

    const headerBtn = document.createElement('button');
    headerBtn.className = 'btn';
    headerBtn.style.alignSelf = 'flex-start';
    headerBtn.textContent = text;
    headerBtn.addEventListener('click', onClick);

    const hint = document.createElement('div');
    hint.className = 'small muted';
    hint.textContent = 'Klicke die Überschrift, um Inhalte zu laden.';

    wrapper.appendChild(headerBtn);
    wrapper.appendChild(hint);
    return wrapper;
  }

  function showBalanceTab(contentEl){
    const header = createHeaderTrigger('Bilanz 2024', () => {
      contentEl.innerHTML = '';
      renderDetailedBalance(contentEl, user, company.id);
    });
    contentEl.appendChild(header);
  }

  const TAB_RENDERERS = {
    'balance': showBalanceTab,
    'income': showIncomeTab,
    'bookings': showBookingsTab,
    'economy': showEconomyTab,
    'law': showLawTab
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tabContents.forEach(c => { c.classList.add('hidden'); c.innerHTML = ''; });

      const tab = btn.dataset.tab;
      const contentEl = document.getElementById(tab);
      if(!contentEl) return;
      contentEl.classList.remove('hidden');

      const renderer = TAB_RENDERERS[tab];
      if(renderer) renderer(contentEl);
      else {
        contentEl.innerHTML = `<div class="small muted">Keine Darstellung für diesen Reiter hinterlegt.</div>`;
      }
    });
  });
});
