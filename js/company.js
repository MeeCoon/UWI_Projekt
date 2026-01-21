// js/company.js
// Erweiterte Firmenansicht mit tab-gesteuerter Anzeige (Bilanz / Erfolgsrechnung / Buchungssätze / Wirtschaft / Recht)
// Verhalten gemäß Anforderung:
// - Beim Laden steht unten (im Inhaltsbereich) nichts, solange kein Reiter angeklickt wurde.
// - Default-Reiter ist "Bilanz" (als erste Option vorhanden), aber es wird erst Inhalt angezeigt,
//   wenn der Benutzer aktiv auf den Reiter klickt.
// - Wenn der Benutzer auf den Reiter "Bilanz" klickt, erscheint zunächst ein klickbarer Header
//   "Bilanz 2024". Erst wenn dieser Header angeklickt wird, wird die Bilanz inklusive Zahlen angezeigt.
// - Beim Wechsel auf einen anderen Reiter (z.B. "Erfolgsrechnung") zeigt die Seite analog
//   zunächst "Erfolgsrechnung 2024" als klickbare Überschrift; ein Klick darauf erzeugt die Inhalte.
// - Alle Inhalte werden pro Benutzer und pro Firma aus dem LocalStorage verwaltet.
// - Buchungen werden erwartet unter dem Key: uwi_bookings_<username>, jedes Booking-Objekt enthält:
//   { id, companyId, debit, credit, amount, text, date }
// - Firmen sind gespeichert unter: uwi_companies_<username>
// - Ausgewählte Firma pro Benutzer: uwi_currentCompany_<username>

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

// ------------------------- Kleiner Kontenplan & Matching -------------------------
// Vereinfachte Kontenliste, erweiterbar
const CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Kasse', side: 'Aktiv', keywords: ['1000','kasse','flüssige mittel'] },
  { code: '1020', name: 'Bankguthaben', side: 'Aktiv', keywords: ['1020','bank','bankguthaben'] },
  { code: '1100', name: 'Forderungen aLuL', side: 'Aktiv', keywords: ['1100','forderung','forderungen','debitor'] },
  { code: '1200', name: 'Warenbestand', side: 'Aktiv', keywords: ['1200','warenbestand','waren','vorrat'] },
  { code: '1300', name: 'Aktive Rechnungsabgrenzungen', side: 'Aktiv', keywords: ['1300','rechnungsabgrenzung'] },

  { code: '2000', name: 'Verbindlichkeiten aLuL', side: 'Passiv', keywords: ['2000','verbindlichkeit','verbindlichkeiten','kreditor'] },
  { code: '2100', name: 'Kurzfristige verzinsliche Verbindlichkeiten', side: 'Passiv', keywords: ['2100','darlehen','kredit'] },
  { code: '2400', name: 'Langfristige verzinsliche Verbindlichkeiten', side: 'Passiv', keywords: ['2400','hypothek','obligation'] },
  { code: '2600', name: 'Rückstellungen', side: 'Passiv', keywords: ['2600','rückstell'] },

  { code: '3000', name: 'Eigenkapital', side: 'Passiv', keywords: ['3000','eigenkapital','kapital'] },
  { code: '4000', name: 'Umsatzerlöse', side: 'Passiv', keywords: ['4000','umsatz','erlös','umsatzerlöse'] },

  // Auffangkonto
  { code: '9999', name: 'Sonstige Konten', side: 'Aktiv', keywords: [] }
];

// Build keyword map for faster matching
const KEYWORD_TO_ACCOUNT = (function(){
  const map = new Map();
  CHART_OF_ACCOUNTS.forEach(acc => {
    acc.keywords.forEach(kw => map.set(kw.toLowerCase(), acc.code));
    map.set(acc.code.toLowerCase(), acc.code);
  });
  return map;
})();

function findAccountCodeFromString(s){
  if(!s) return null;
  const t = String(s).toLowerCase();
  // try explicit code matches first
  for(const acc of CHART_OF_ACCOUNTS){
    if(t.includes(acc.code.toLowerCase())) return acc.code;
  }
  // then keyword matches
  for(const [kw, code] of KEYWORD_TO_ACCOUNT.entries()){
    if(kw && t.includes(kw)) return code;
  }
  return null;
}

// ------------------------- Bilanz-Berechnung -------------------------
function computeBalancesForCompany(user, companyId) {
  const bookings = loadBookingsForUser(user) || [];
  const balances = {};
  CHART_OF_ACCOUNTS.forEach(a => balances[a.code] = 0);

  bookings.forEach(b => {
    if(!b || b.companyId !== companyId) return;
    const amount = Number(b.amount) || 0;
    const debitCode = findAccountCodeFromString(b.debit) || '9999';
    const creditCode = findAccountCodeFromString(b.credit) || '9999';
    balances[debitCode] = (balances[debitCode] || 0) + amount;
    balances[creditCode] = (balances[creditCode] || 0) - amount;
  });

  return balances;
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

  function showIncomeTab(contentEl){
    const header = createHeaderTrigger('Erfolgsrechnung 2024', () => {
      contentEl.innerHTML = '';
      const ph = document.createElement('div');
      ph.className = 'card small';
      ph.style.padding = '12px';
      ph.innerHTML = `<strong>Erfolgsrechnung 2024 — ${escapeHtml(company.name)}</strong>
        <p class="small muted">Hier werden Umsatzerlöse, Aufwände und Ergebnis angezeigt (Platzhalter).</p>
        <table class="table"><tbody>
          <tr><td>Umsatzerlöse</td><td style="text-align:right">${fmt(12500)}</td></tr>
          <tr><td>Materialaufwand</td><td style="text-align:right">${fmt(4200)}</td></tr>
          <tr><td>Personalaufwand</td><td style="text-align:right">${fmt(3500)}</td></tr>
          <tr><th>Jahresergebnis</th><th style="text-align:right">${fmt(4800)}</th></tr>
        </tbody></table>`;
      contentEl.appendChild(ph);
    });
    contentEl.appendChild(header);
  }

  function showBookingsTab(contentEl){
    const header = createHeaderTrigger('Buchungssätze 2024', () => {
      contentEl.innerHTML = '';
      const bookings = loadBookingsForUser(user).filter(b => b.companyId === company.id);
      if(bookings.length === 0){
        const m = document.createElement('div'); m.className = 'small muted'; m.textContent = 'Noch keine Buchungen vorhanden.';
        contentEl.appendChild(m); return;
      }
      const tbl = document.createElement('table'); tbl.className = 'table';
      const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>Datum</th><th>Buchung</th><th style="text-align:right">Betrag</th></tr>';
      const tbody = document.createElement('tbody');
      bookings.slice().reverse().forEach(b => {
        const tr = document.createElement('tr');
        const date = b.date ? new Date(b.date).toLocaleString() : '-';
        tr.innerHTML = `<td>${escapeHtml(date)}</td><td>${escapeHtml(b.debit)} an ${escapeHtml(b.credit)} ${b.text? ' — '+escapeHtml(b.text):''}</td><td style="text-align:right">${fmt(b.amount)}</td>`;
        tbody.appendChild(tr);
      });
      tbl.appendChild(thead); tbl.appendChild(tbody); contentEl.appendChild(tbl);
    });
    contentEl.appendChild(header);
  }

  function showEconomyTab(contentEl){
    const header = createHeaderTrigger('Wirtschaft 2024', () => {
      contentEl.innerHTML = '';
      const p = document.createElement('div');
      p.innerHTML = `<h4>Wirtschaftliche Übersicht — ${escapeHtml(company.name)}</h4>
        <p class="small muted">Placeholder: Kennzahlen, Marktinformationen und Prognosen werden hier angezeigt.</p>`;
      contentEl.appendChild(p);
    });
    contentEl.appendChild(header);
  }

  function showLawTab(contentEl){
    const header = createHeaderTrigger('Recht 2024', () => {
      contentEl.innerHTML = '';
      const p = document.createElement('div');
      p.innerHTML = `<h4>Rechtliche Hinweise — ${escapeHtml(company.name)}</h4>
        <p class="small muted">Placeholder: Haftung, Kapitalanforderungen und Kurzinfos zu Rechtsform.</p>`;
      contentEl.appendChild(p);
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
