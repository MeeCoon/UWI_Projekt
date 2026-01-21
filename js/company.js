// js/company.js
// Firmenansicht (company.html) mit Bilanz-Generator
// - Lädt die aktuell ausgewählte Firma (per-user: uwi_currentCompany_<username>)
// - Lädt Buchungen aus LocalStorage: uwi_bookings_<username>
// - Berechnet Bilanz (Aktiven / Passiven) nach einem vereinfachten Kontenplan,
//   der auf dem bereitgestellten Bild basiert.
// - Zeigt Bilanz als Tabelle im "Bilanz"-Tab an.
//
// Hinweise:
// - Diese Implementierung arbeitet rein client-seitig und dient als Schul-Demo.
// - Buchungen müssen das Feld `companyId` enthalten, damit sie der richtigen Firma zugeordnet werden.

// ------------------------- Hilfs- / Storage-Funktionen -------------------------
const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_PREFIX = 'uwi_currentCompany_';
const BOOKINGS_PREFIX = 'uwi_bookings_'; // erwartet: uwi_bookings_<username>

// Liefert aktuellen User oder redirectet auf login
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

// Sicheres HTML-Escaping für Anzeige
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]);
}

// Formatierung Euro
function fmt(n){ return Number(n || 0).toFixed(2) + ' €'; }

// ------------------------- Kontenplan (vereinfachte Version) -------------------------
/*
  Jeder Eintrag:
  - code: Kontonummer als String (nur zur Anzeige/Sortierung)
  - name: Kontobezeichnung
  - side: 'Aktiv' oder 'Passiv'
  - keywords: Liste von Strings (kleingeschrieben) zur Zuordnung von Buchungstexten/Kontonamen
*/
const CHART_OF_ACCOUNTS = [
  // Aktiven (10 ...)
  { code: '1000', name: 'Kasse', side: 'Aktiv', keywords: ['1000','kasse','flüssige mittel','kassen'] },
  { code: '1020', name: 'Bankguthaben', side: 'Aktiv', keywords: ['1020','bank','bankguthaben'] },
  { code: '1100', name: 'Forderungen aus Lieferungen und Leistungen', side: 'Aktiv', keywords: ['1100','forderungen','debitor'] },
  { code: '1200', name: 'Vorräte / Warenbestand', side: 'Aktiv', keywords: ['1200','warenbestand','vorräte','waren'] },
  { code: '1300', name: 'Aktive Rechnungsabgrenzungen', side: 'Aktiv', keywords: ['1300','rechnungsabgrenzung','aktive rechnungsabgrenzungen'] },

  // Passiven (20 ...)
  { code: '2000', name: 'Verbindlichkeiten aus Lieferungen und Leistungen', side: 'Passiv', keywords: ['2000','verbindlichkeiten','kreditoren'] },
  { code: '2100', name: 'Kurzfristige verzinsliche Verbindlichkeiten', side: 'Passiv', keywords: ['2100','darlehen','kredit','verbindlichkeit bank'] },
  { code: '2400', name: 'Langfristige verzinsliche Verbindlichkeiten', side: 'Passiv', keywords: ['2400','hypothek','darlehen langfristig','obligation'] },
  { code: '2500', name: 'Übrige langfristige Verbindlichkeiten', side: 'Passiv', keywords: ['2500','langfristige verbindlichkeit','sonstige langfristig'] },
  { code: '2600', name: 'Rückstellungen', side: 'Passiv', keywords: ['2600','rückstellung','rückstellungen'] },

  // Eigenkapital (als Passiv)
  { code: '3000', name: 'Eigenkapital', side: 'Passiv', keywords: ['3000','eigenkapital','kapital'] },

  // Umsatzerlöse / sonstige Passiv- bzw. Erfolgskonten (vereinfachte Behandlung)
  { code: '4000', name: 'Umsatzerlöse', side: 'Passiv', keywords: ['4000','umsatz','erlös','umsatzerlöse'] },

  // Sonstige / Auffangkonto
  { code: '9999', name: 'Sonstige Konten', side: 'Aktiv', keywords: [] }
];

// Erzeuge Map von keyword -> kontocode (für schnelles Matching)
const KEYWORD_TO_ACCOUNT = (function buildKeywordMap(){
  const map = new Map();
  CHART_OF_ACCOUNTS.forEach(acc => {
    acc.keywords.forEach(kw => {
      map.set(kw.toLowerCase(), acc.code);
    });
    // auch mappe code itself (z.B. '1000')
    map.set(acc.code.toLowerCase(), acc.code);
  });
  return map;
})();

// Hilfsfunktionen zum Finden des Kontocodes anhand eines Account-Strings
function findAccountCodeFromString(s){
  if(!s) return null;
  const t = String(s).toLowerCase();
  // 1) Suche nach exakter Kontonummer im String
  for(const code of CHART_OF_ACCOUNTS.map(a=>a.code)){
    if(t.includes(code.toLowerCase())) return code;
  }
  // 2) Suche nach Keyword
  for(const [kw, code] of KEYWORD_TO_ACCOUNT.entries()){
    if(t.includes(kw)) return code;
  }
  // 3) kein Treffer
  return null;
}

// ------------------------- Bilanz-Berechnung -------------------------
/*
  Logik:
  - Für alle Buchungen des Benutzers, die zur aktuellen Firma gehören:
      balances[accountCode] += amount  (wenn Konto im Soll genannt)
      balances[accountCode] -= amount  (wenn Konto im Haben genannt)
  - Konten, die nicht gemappt werden konnten, sammeln wir unter '9999' (Sonstige)
  - Für Aktiven: wir zeigen positive Salden als Aktivposten
    Für Passiven: wir zeigen positive Beträge als Passivposten (Saldo in umgekehrter Richtung)
  - Gesamtaktiven und Gesamtpassiven werden berechnet und verglichen
*/

function computeBalancesForCompany(user, companyId) {
  const bookings = loadBookingsForUser(user);
  const balances = {}; // kontoCode -> saldo (Soll - Haben)

  // initialisiere alle konten auf 0
  CHART_OF_ACCOUNTS.forEach(acc => balances[acc.code] = 0);

  bookings.forEach(b => {
    if(!b || b.companyId !== companyId) return; // nur Buchungen zur Firma
    const amount = Number(b.amount) || 0;
    // bestimme konto codes
    const debitCode = findAccountCodeFromString(b.debit) || '9999';
    const creditCode = findAccountCodeFromString(b.credit) || '9999';
    // Soll erhöht Saldo
    balances[debitCode] = (balances[debitCode] || 0) + amount;
    // Haben verringert Saldo
    balances[creditCode] = (balances[creditCode] || 0) - amount;
  });

  return balances;
}

// Rendert die Bilanz in den vorhandenen #balance Bereich
function renderBalanceTable(user, companyId, companyName) {
  const container = document.getElementById('balance');
  if(!container) return;

  // Berechnen
  const balances = computeBalancesForCompany(user, companyId);

  // Prepare rows per side
  const aktivenRows = [];
  const passivenRows = [];
  let assetsTotal = 0;
  let liabilitiesTotal = 0;

  // Durchlaufe Konten in definierter Reihenfolge
  CHART_OF_ACCOUNTS.forEach(acc => {
    const saldo = balances[acc.code] || 0;
    if(acc.side === 'Aktiv') {
      const val = saldo > 0 ? saldo : 0;
      if(val !== 0) {
        aktivenRows.push({code: acc.code, name: acc.name, value: val});
        assetsTotal += val;
      }
    } else { // Passiv
      // Für Passiv-Konto interpretieren wir negativen Saldo als Passivbetrag
      // (weil saldo = soll - haben). Für einfache Fälle: passivwert = -saldo wenn negative.
      const val = (-saldo) > 0 ? -saldo : 0;
      if(val !== 0) {
        passivenRows.push({code: acc.code, name: acc.name, value: val});
        liabilitiesTotal += val;
      }
    }
  });

  // Wenn keine Werte vorhanden, zeige Hinweis
  if(aktivenRows.length === 0 && passivenRows.length === 0) {
    container.innerHTML = `<div class="small muted">Keine Buchungen für diese Firma vorhanden — Bilanz ist leer.</div>`;
    return;
  }

  // Erzeuge HTML-Tabelle: zwei Spalten (Aktiven / Passiven)
  const tableHtml = document.createElement('div');
  tableHtml.className = 'balance-table';
  tableHtml.style.display = 'flex';
  tableHtml.style.gap = '20px';
  tableHtml.style.alignItems = 'flex-start';

  // Helper zum Erstellen einer Spalte
  function createCol(title, rows, total) {
    const col = document.createElement('div');
    col.style.flex = '1';
    col.innerHTML = `<h3>${escapeHtml(title)}</h3>`;
    const tbl = document.createElement('table');
    tbl.className = 'table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Konto</th><th>Wert</th></tr>';
    const tbody = document.createElement('tbody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(r.code)} — ${escapeHtml(r.name)}</td><td style="width:130px;text-align:right">${fmt(r.value)}</td>`;
      tbody.appendChild(tr);
    });
    tbl.appendChild(thead);
    tbl.appendChild(tbody);

    const totalDiv = document.createElement('div');
    totalDiv.className = 'total';
    totalDiv.style.marginTop = '8px';
    totalDiv.textContent = `Summe ${title}: ${fmt(total)}`;

    col.appendChild(tbl);
    col.appendChild(totalDiv);
    return col;
  }

  const left = createCol('Aktiven', aktivenRows, assetsTotal);
  const right = createCol('Passiven', passivenRows, liabilitiesTotal);

  tableHtml.appendChild(left);
  tableHtml.appendChild(right);

  // Bilanzausgleich Hinweis
  const note = document.createElement('div');
  note.style.marginTop = '12px';
  note.style.padding = '10px';
  note.style.borderRadius = '8px';
  note.style.fontWeight = '600';

  if (Math.abs(assetsTotal - liabilitiesTotal) < 0.005) {
    note.style.background = '#ecfdf5';
    note.style.border = '1px solid rgba(16,185,129,0.12)';
    note.textContent = 'Die Bilanz stimmt: Gesamtaktiven = Gesamtpassiven.';
  } else {
    note.style.background = '#fff5f5';
    note.style.border = '1px solid rgba(239,68,68,0.12)';
    note.textContent = `Achtung: Bilanz ungleich (Aktiven ${fmt(assetsTotal)} ≠ Passiven ${fmt(liabilitiesTotal)}). Prüfe Buchungen.`;
  }

  // Ersetze Inhalt des Containers
  container.innerHTML = ''; // clear
  const heading = document.createElement('div');
  heading.innerHTML = `<strong>Bilanz für: ${escapeHtml(companyName)}</strong>`;
  heading.style.marginBottom = '8px';
  container.appendChild(heading);
  container.appendChild(tableHtml);
  container.appendChild(note);
}

// ------------------------- Integration in Page (Tabs etc.) -------------------------
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUserOrRedirect();
  if(!user) return;

  // Buttons und Navigation
  const logoutBtn = document.getElementById('logoutBtn');
  const backBtn = document.getElementById('backBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(selectedCompanyKey(user));
    window.location.href = 'index.html';
  });
  if(backBtn) backBtn.addEventListener('click', () => window.location.href = 'overview.html');

  const userDisplay = document.getElementById('userDisplay');
  if(userDisplay) userDisplay.textContent = `Angemeldet: ${user}`;

  // Ermittle ausgewählte Firma (pro user)
  const selId = localStorage.getItem(selectedCompanyKey(user));
  if(!selId) {
    alert('Keine Firma ausgewählt. Zur Übersicht weitergeleitet.');
    window.location.href = 'overview.html';
    return;
  }
  const companies = loadCompaniesForUser(user);
  const company = companies.find(c => c.id === selId);
  if(!company) {
    alert('Ausgewählte Firma nicht gefunden. Zur Übersicht weitergeleitet.');
    window.location.href = 'overview.html';
    return;
  }

  // Titel & Meta anzeigen
  const titleEl = document.getElementById('companyTitle');
  const metaEl  = document.getElementById('companyMeta');
  if(titleEl) titleEl.textContent = company.name;
  if(metaEl) metaEl.textContent = `${company.legal} · ${company.industry || '–'} · Startkapital: ${company.capital} € · Mitarbeitende: ${company.size}`;

  // Tab-Logik
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      tabContents.forEach(c => {
        if(c.id === tab) c.classList.remove('hidden'); else c.classList.add('hidden');
      });

      // Wenn Bilanz-Tab aktiv wird: rendere Bilanz
      if(tab === 'balance') {
        renderBalanceTable(user, company.id, company.name);
      }
    });
  });

  // Falls Bilanz-Tab standardmäßig sichtbar ist (z.B. beim Laden), rendern
  const activeBtn = document.querySelector('.tab-btn.active');
  if(activeBtn && activeBtn.dataset.tab === 'balance') {
    renderBalanceTable(user, company.id, company.name);
  }
});
