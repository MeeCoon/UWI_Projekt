// UWI Unternehmenssimulation - script.js
// Alle Daten werden im localStorage gespeichert, pro Benutzer.
// Struktur (localStorage keys):
// - uwi_currentUser : aktueller Benutzername (string)
// - uwi_users : JSON array von Benutzern (optional; nicht zwingend notwendig)
// - uwi_companies_<user> : JSON array [{id, name, form}]
// - uwi_bookings_<user> : JSON array [{id, companyId, debit, credit, amount, text, date}]

// ------------------------- Hilfsfunktionen -------------------------
function qs(id){ return document.getElementById(id); }
function nowIso(){ return new Date().toISOString(); }
function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }
function toCurrency(n){ return Number(n).toFixed(2); }

// ------------------------- State & Storage -------------------------
const STORAGE = {
  currentUserKey: 'uwi_currentUser',
  usersKey: 'uwi_users',
  companiesKey: (user)=>`uwi_companies_${user}`,
  bookingsKey: (user)=>`uwi_bookings_${user}`,
};

function saveCurrentUser(user){
  localStorage.setItem(STORAGE.currentUserKey, user);
}

function getCurrentUser(){
  return localStorage.getItem(STORAGE.currentUserKey) || null;
}

function getCompanies(user){
  const key = STORAGE.companiesKey(user);
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveCompanies(user, companies){
  localStorage.setItem(STORAGE.companiesKey(user), JSON.stringify(companies));
}

function getBookings(user){
  const key = STORAGE.bookingsKey(user);
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function saveBookings(user, bookings){
  localStorage.setItem(STORAGE.bookingsKey(user), JSON.stringify(bookings));
}

// ------------------------- Navigation & UI -------------------------
const sections = {
  login: qs('loginSection'),
  dashboard: qs('dashboard'),
  bookings: qs('bookings'),
  balance: qs('balance'),
  ki: qs('ki'),
  recht: qs('recht'),
  documentation: qs('documentation'),
};

function showSection(name){
  // hide all
  Object.values(sections).forEach(s=>s.classList.add('hidden'));
  // show selected
  if(sections[name]) sections[name].classList.remove('hidden');
  // update nav active
  updateNavActive(name);
}

function updateNavActive(name){
  const nav = qs('mainNav');
  if(!getCurrentUser()){
    nav.innerHTML = '';
    qs('userArea').innerHTML = '';
    return;
  }

  // Build nav
  const items = [
    {id:'dashboard', label:'Dashboard'},
    {id:'bookings', label:'Buchungen'},
    {id:'balance', label:'Bilanz'},
    {id:'ki', label:'KI‑Prüfung'},
    {id:'recht', label:'Recht'},
    {id:'documentation', label:'Dokumentation'},
  ];
  nav.innerHTML = '';
  items.forEach(it=>{
    const a = document.createElement('button');
    a.textContent = it.label;
    a.className = 'btn';
    if(it.id === name) a.classList.add('primary');
    a.onclick = ()=>{ renderForCurrentUser(); showSection(it.id); };
    nav.appendChild(a);
  });

  // user area
  const user = getCurrentUser();
  qs('userArea').innerHTML = '';
  const span = document.createElement('span');
  span.textContent = user;
  span.style.marginRight = '12px';
  qs('userArea').appendChild(span);
  const outBtn = document.createElement('button');
  outBtn.className = 'btn';
  outBtn.textContent = 'Abmelden';
  outBtn.onclick = ()=>{ logout(); };
  qs('userArea').appendChild(outBtn);
}

// ------------------------- Login / Logout -------------------------
qs('loginForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = qs('username').value.trim();
  if(!name) return alert('Bitte Benutzernamen eingeben.');
  login(name);
});

function login(name){
  // Set current user in storage
  saveCurrentUser(name);
  // ensure arrays exist
  const usersRaw = localStorage.getItem(STORAGE.usersKey);
  const users = usersRaw ? JSON.parse(usersRaw) : [];
  if(!users.includes(name)){
    users.push(name);
    localStorage.setItem(STORAGE.usersKey, JSON.stringify(users));
  }
  // Initialize empty lists if not present
  if(!localStorage.getItem(STORAGE.companiesKey(name))) saveCompanies(name, []);
  if(!localStorage.getItem(STORAGE.bookingsKey(name))) saveBookings(name, []);
  // Render UI
  renderForCurrentUser();
  showSection('dashboard');
}

function logout(){
  localStorage.removeItem(STORAGE.currentUserKey);
  // show login
  showSection('login');
  updateNavActive(null);
}

// ------------------------- Companies -------------------------
qs('companyForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = qs('companyName').value.trim();
  const form = qs('companyFormSelect').value;
  if(!name) return alert('Bitte einen Firmennamen eingeben.');
  const user = getCurrentUser();
  if(!user) return alert('Nicht angemeldet.');
  const companies = getCompanies(user);
  companies.push({id: uid('comp'), name, form});
  saveCompanies(user, companies);
  qs('companyName').value = '';
  renderCompanyList();
  renderCompanySelectForBookings();
});

function renderCompanyList(){
  const user = getCurrentUser();
  const container = qs('companyList');
  container.innerHTML = '';
  if(!user) return;
  const companies = getCompanies(user);
  if(companies.length === 0){
    container.innerHTML = '<div class="muted">Keine Firmen angelegt. Lege zuerst eine Firma an.</div>';
    return;
  }
  companies.forEach(c=>{
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `<div>
      <div style="font-weight:600">${escapeHtml(c.name)}</div>
      <small>${escapeHtml(c.form)}</small>
    </div>`;
    const actions = document.createElement('div');
    const del = document.createElement('button');
    del.className = 'btn';
    del.textContent = 'Löschen';
    del.onclick = ()=>{ if(confirm('Firma löschen? Alle zugehörigen Buchungen bleiben erhalten.')){ deleteCompany(c.id); } };
    actions.appendChild(del);
    el.appendChild(actions);
    container.appendChild(el);
  });
}

function deleteCompany(id){
  const user = getCurrentUser();
  if(!user) return;
  const companies = getCompanies(user).filter(c=>c.id !== id);
  saveCompanies(user, companies);
  renderCompanyList();
  renderCompanySelectForBookings();
}

function renderCompanySelectForBookings(){
  const sel = qs('bookingCompany');
  sel.innerHTML = '';
  const user = getCurrentUser();
  if(!user) return;
  const companies = getCompanies(user);
  companies.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name + ' — ' + c.form;
    sel.appendChild(opt);
  });
  if(companies.length === 0){
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Keine Firma (bitte zuerst anlegen)';
    sel.appendChild(opt);
  }
}

// ------------------------- Bookings -------------------------
qs('bookingForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const user = getCurrentUser();
  if(!user) return alert('Nicht angemeldet.');
  const companyId = qs('bookingCompany').value;
  if(!companyId) return alert('Bitte Firma wählen.');
  const debit = qs('debitAccount').value.trim();
  const credit = qs('creditAccount').value.trim();
  const amount = Number(qs('amount').value);
  const text = qs('bookingText').value.trim();
  if(!debit || !credit || !amount || amount <= 0) return alert('Bitte gültige Buchungsdaten eingeben.');
  const bookings = getBookings(user);
  bookings.push({
    id: uid('b'),
    companyId, debit, credit, amount: Number(amount), text, date: nowIso()
  });
  saveBookings(user, bookings);
  qs('debitAccount').value=''; qs('creditAccount').value=''; qs('amount').value=''; qs('bookingText').value='';
  renderBookingList();
  renderMiniAccounts();
  renderBalance(); // update bilanz
});

qs('clearBookingsBtn').addEventListener('click', ()=>{
  const user = getCurrentUser();
  if(!user) return;
  if(!confirm('Alle Buchungen löschen?')) return;
  saveBookings(user, []);
  renderBookingList();
  renderMiniAccounts();
  renderBalance();
});

function renderBookingList(){
  const user = getCurrentUser();
  const container = qs('bookingList');
  container.innerHTML = '';
  if(!user) return;
  const bookings = getBookings(user);
  if(bookings.length === 0){
    container.innerHTML = '<div class="muted">Noch keine Buchungen.</div>';
    return;
  }
  // sort by date desc
  bookings.slice().reverse().forEach(b=>{
    const el = document.createElement('div');
    el.className = 'item';
    const date = new Date(b.date).toLocaleString();
    el.innerHTML = `<div>
      <div style="font-weight:600">${escapeHtml(b.debit)} an ${escapeHtml(b.credit)} — ${toCurrency(b.amount)} €</div>
      <small>${escapeHtml(b.text)} • ${date}</small>
    </div>`;
    const actions = document.createElement('div');
    const del = document.createElement('button');
    del.className = 'btn';
    del.textContent = 'Löschen';
    del.onclick = ()=>{ deleteBooking(b.id); };
    actions.appendChild(del);
    el.appendChild(actions);
    container.appendChild(el);
  });
}

function deleteBooking(id){
  const user = getCurrentUser();
  if(!user) return;
  let bookings = getBookings(user);
  bookings = bookings.filter(b=>b.id !== id);
  saveBookings(user, bookings);
  renderBookingList();
  renderMiniAccounts();
  renderBalance();
}

// ------------------------- Bilanz / Kontenlogik -------------------------
/*
  Kontensystem (vereinfachte Klassifikation):
  - Aktiva (Assets): Kasse, Bank, Forderungen, Warenbestand, Anlagevermögen
  - Passiva (Liabilities & Equity): Verbindlichkeiten, Darlehen, Eigenkapital, Umsatzerlöse

  Bilanzlogik:
  Für jedes Konto berechnen wir Saldo = Summe Soll - Summe Haben
  Für Aktivkonten ist Saldo positiv = Aktivwert
  Für Passivkonten ist Normalbalance credit => passivwert = -Saldo (wenn Saldo negativ)
*/
const ACCOUNT_CLASS = {
  // lowercased keys for matching
  'kasse':'asset',
  'bank':'asset',
  'forderungen':'asset',
  'forderung':'asset',
  'forderungen aus liq':'asset',
  'warenbestand':'asset',
  'waren':'asset',
  'anlagevermögen':'asset',
  'anlage':'asset',

  'verbindlichkeiten':'liability',
  'verbindlichkeit':'liability',
  'darlehen':'liability',
  'eigenkapital':'liability',
  'umsatzerlöse':'liability',
  'umsatz':'liability',
  'erlös':'liability',
  'umsatzerloese':'liability',
  'aufwand':'asset' // aufwände wirken aktiv vermindernd, hier einfache Zuordnung
};

function classifyAccount(name){
  const key = name.trim().toLowerCase();
  for(const k in ACCOUNT_CLASS){
    if(key.includes(k)) return ACCOUNT_CLASS[k];
  }
  // default: asset (sichere Annahme für Übung)
  return 'asset';
}

function computeAccountBalances(bookings){
  // returns map: accountName -> saldo (debits - credits)
  const balances = {};
  bookings.forEach(b=>{
    const debit = b.debit.trim();
    const credit = b.credit.trim();
    const amount = Number(b.amount) || 0;
    if(!balances[debit]) balances[debit]=0;
    if(!balances[credit]) balances[credit]=0;
    balances[debit] += amount;   // Soll erhöht
    balances[credit] -= amount;  // Haben verringert Saldo (debit - credit)
  });
  return balances;
}

function renderBalance(){
  const user = getCurrentUser();
  if(!user) return;
  const companies = getCompanies(user);
  // If a company is selected in booking form, we might want bilanz per company later.
  // For now: bilanz aus allen Buchungen des Benutzers (bei Bedarf: per company)
  const bookings = getBookings(user);
  const balances = computeAccountBalances(bookings);

  const assetsTableBody = qs('assetsTable').querySelector('tbody');
  const liabilitiesTableBody = qs('liabilitiesTable').querySelector('tbody');
  assetsTableBody.innerHTML = '';
  liabilitiesTableBody.innerHTML = '';

  let assetsTotal = 0;
  let liabilitiesTotal = 0;

  // Aggregate by classification
  // Create object arrays for sorted display
  const assetRows = [];
  const liabilityRows = [];

  Object.keys(balances).forEach(acc=>{
    const saldo = balances[acc];
    const cls = classifyAccount(acc);
    if(cls === 'asset'){
      const val = saldo > 0 ? saldo : 0;
      if(val !== 0) assetRows.push({acc, val});
      assetsTotal += val;
    } else {
      // liability: normalbalance credit -> if saldo negative, liability positive
      const val = (-saldo) > 0 ? -saldo : 0;
      if(val !== 0) liabilityRows.push({acc, val});
      liabilitiesTotal += val;
    }
  });

  // Sort alphabetically
  assetRows.sort((a,b)=>a.acc.localeCompare(b.acc));
  liabilityRows.sort((a,b)=>a.acc.localeCompare(b.acc));

  assetRows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.acc)}</td><td>${toCurrency(r.val)} €</td>`;
    assetsTableBody.appendChild(tr);
  });
  liabilityRows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.acc)}</td><td>${toCurrency(r.val)} €</td>`;
    liabilitiesTableBody.appendChild(tr);
  });

  qs('assetsTotal').textContent = toCurrency(assetsTotal);
  qs('liabilitiesTotal').textContent = toCurrency(liabilitiesTotal);

  const note = qs('balanceNote');
  if(Math.abs(assetsTotal - liabilitiesTotal) < 0.005){
    note.textContent = 'Die Bilanz stimmt: Gesamtaktiven = Gesamtpassiven.';
    note.style.background = '#ecfdf5';
    note.style.border = '1px solid rgba(16,185,129,0.12)';
  } else {
    note.textContent = 'Achtung: Bilanz ungleich. Prüfe Buchungen (Tipp: Soll/Haben vertauscht?).';
    note.style.background = '#fff5f5';
    note.style.border = '1px solid rgba(239,68,68,0.12)';
  }
}

// ------------------------- Mini Accounts (Dashboard) -------------------------
function renderMiniAccounts(){
  const user = getCurrentUser();
  const el = qs('miniAccounts');
  if(!user){ el.innerHTML = ''; return; }
  const bookings = getBookings(user);
  const balances = computeAccountBalances(bookings);
  const keys = Object.keys(balances);
  if(keys.length === 0){ el.innerHTML = '<div class="muted">Noch keine Buchungen.</div>'; return; }
  el.innerHTML = '';
  const list = document.createElement('div');
  list.style.display='flex'; list.style.gap='8px'; list.style.flexWrap='wrap';
  keys.slice(0,6).forEach(k=>{
    const v = balances[k];
    const box = document.createElement('div');
    box.style.padding='8px 10px';
    box.style.background='white';
    box.style.borderRadius='8px';
    box.style.boxShadow='var(--shadow)';
    box.innerHTML = `<div style="font-weight:600">${escapeHtml(k)}</div><div class="muted">${toCurrency(Math.abs(v))} €</div>`;
    list.appendChild(box);
  });
  el.appendChild(list);
}

// ------------------------- KI‑Prüfung (Simuliert) -------------------------
const KI_RULES = [
  // Simple keyword-based rules. The system will try to infer expected debit/credit.
  {keywords:['kunde','verkauf','erlös','umsatz'], debit:'Forderungen', credit:'Umsatzerlöse'},
  {keywords:['bar','kasse bezahlt','kassenzahlung','bezahlt bar'], debit:'Kasse', credit:'Forderungen'},
  {keywords:['banküberweisung','bankt','überweisung','bank'], debit:'Bank', credit:'Forderungen'},
  {keywords:['einkauf','waren einkauf','waren'], debit:'Warenbestand', credit:'Verbindlichkeiten'},
  {keywords:['gehalt','löhne','personalaufwand'], debit:'Aufwand', credit:'Bank'},
  {keywords:['darlehen','kredit','aufnahme kredit'], debit:'Bank', credit:'Darlehen'},
  {keywords:['investition','anlage kauf','maschinerie','anlagevermögen'], debit:'Anlagevermögen', credit:'Bank'},
];

qs('kiCheckBtn').addEventListener('click', (e)=>{
  e.preventDefault();
  kiCheck();
});

qs('kiHintBtn').addEventListener('click', (e)=>{
  e.preventDefault();
  showKiHint();
});

function kiInfer(text){
  const t = (text||'').toLowerCase();
  for(const rule of KI_RULES){
    for(const kw of rule.keywords){
      if(t.includes(kw)) return {debit:rule.debit, credit:rule.credit, reason:`Schlüsselwort: ${kw}`};
    }
  }
  return null;
}

function kiCheck(){
  const text = qs('kiText').value.trim();
  const debit = qs('kiDebit').value.trim();
  const credit = qs('kiCredit').value.trim();
  const amount = qs('kiAmount').value.trim();

  if(!text) return alert('Bitte Geschäftsvorfall eingeben.');
  if(!debit || !credit || !amount) return alert('Bitte deinen Buchungssatz angeben.');

  const inferred = kiInfer(text);
  const resultEl = qs('kiResult');
  resultEl.className = 'result';
  if(!inferred){
    resultEl.classList.add('error');
    resultEl.innerHTML = `<strong>Keine sichere Zuordnung möglich.</strong><div class="muted">Tipp: Beschreibe den Vorgang mit Stichwörtern wie "Kunde", "bar", "Waren", "Bank", "Darlehen".</div>`;
    return;
  }

  // Vergleich: wir vergleichen Konten (case-insensitive, trimmed)
  const okDebit = debit.trim().toLowerCase() === inferred.debit.trim().toLowerCase();
  const okCredit = credit.trim().toLowerCase() === inferred.credit.trim().toLowerCase();
  if(okDebit && okCredit){
    resultEl.classList.add('ok');
    resultEl.innerHTML = `<strong>Korrekt.</strong> Erwartet: <em>${escapeHtml(inferred.debit)} an ${escapeHtml(inferred.credit)}</em><div class="muted">Grund: ${escapeHtml(inferred.reason)}</div>`;
  } else {
    resultEl.classList.add('error');
    let hint = `Erwartet: <em>${escapeHtml(inferred.debit)} an ${escapeHtml(inferred.credit)}</em>`;
    let advice = '';
    if(!okDebit) advice += `Soll sollte ${escapeHtml(inferred.debit)} sein. `;
    if(!okCredit) advice += `Haben sollte ${escapeHtml(inferred.credit)} sein.`;
    resultEl.innerHTML = `<strong>Falsch.</strong> ${hint}<div class="muted">${advice}</div>`;
  }
}

function showKiHint(){
  const resultEl = qs('kiResult');
  resultEl.className = 'result';
  resultEl.innerHTML = `<strong>Hinweise</strong>
    <ul>
      <li>Nenne wer zahlt/wer bekommt (Kunde, Lieferant).</li>
      <li>Unterscheide Zahlungsmittel (Kasse, Bank) und Waren/Leistungen.</li>
      <li>Wenn Debitor zahlt: Soll = Kasse/Bank, Haben = Forderungen.</li>
    </ul>`;
}

// ------------------------- Recht (Inhalte) -------------------------
const RECHT_CONTENT = {
  'Einzelunternehmen': {
    haftung:'Unbeschränkte Haftung mit dem gesamten privaten und beruflichen Vermögen.',
    kapital:'Kein Mindestkapital erforderlich.',
    pros:'Einfache Gründung, volle Kontrolle, geringere Formalia.',
    cons:'Hohe persönliche Haftung, schwierige Kapitalbeschaffung.'
  },
  'GbR': {
    haftung:'Gesellschafter haften persönlich und gesamtschuldnerisch.',
    kapital:'Kein Mindestkapital erforderlich.',
    pros:'Einfach für mehrere Gründer, kostengünstig.',
    cons:'Gemeinsame Haftung, weniger geeignet für große Projekte.'
  },
  'GmbH': {
    haftung:'Beschränkte Haftung: Gesellschaft haftet mit Gesellschaftsvermögen.',
    kapital:'Mindeststammkapital (in vielen Ländern z.B. 25.000 €), in Deutschland 25.000 €.',
    pros:'Haftungsbeschränkung, Ansehen, gute Struktur für Unternehmen.',
    cons:'Formalien bei Gründung, Buchführungspflicht, Kosten.'
  },
  'UG (haftungsbeschränkt)': {
    haftung:'Beschränkte Haftung wie GmbH, jedoch vereinfachte Gründung.',
    kapital:'Sehr niedriges Mindestkapital (oft ab 1 €), Teilgewinnthesaurierung vorgeschrieben.',
    pros:'Günstiger Einstieg mit Haftungsbeschränkung.',
    cons:'Weniger Kreditwürdigkeit, Rücklagenbildung nötig.'
  },
  'AG': {
    haftung:'Haftung beschränkt auf das Gesellschaftsvermögen.',
    kapital:'Höheres Mindestkapital (z.B. 50.000 € in vielen Ländern).',
    pros:'Geeignet für große Kapitalbeschaffung, klare Eigentümerstruktur.',
    cons:'Hohe Formalitäten, teure Gründung und Verwaltung.'
  }
};

qs('rechtSelect').addEventListener('change', ()=>{
  renderRechtInfo();
});

function renderRechtInfo(){
  const sel = qs('rechtSelect').value;
  const infoDiv = qs('rechtInfo');
  const c = RECHT_CONTENT[sel];
  if(!c) { infoDiv.innerHTML = '<p class="muted">Keine Informationen.</p>'; return; }
  infoDiv.innerHTML = `<h3>${escapeHtml(sel)}</h3>
    <p><strong>Haftung:</strong> ${escapeHtml(c.haftung)}</p>
    <p><strong>Kapital:</strong> ${escapeHtml(c.kapital)}</p>
    <p><strong>Vorteile:</strong> ${escapeHtml(c.pros)}</p>
    <p><strong>Nachteile:</strong> ${escapeHtml(c.cons)}</p>`;
}

// ------------------------- Utility: safe HTML escape -------------------------
function escapeHtml(str){
  if(!str && str !== 0) return '';
  return String(str).replace(/[&<>"']/g, function(m){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
  });
}

// ------------------------- Initial Rendering -------------------------
function renderForCurrentUser(){
  const user = getCurrentUser();
  if(!user){
    showSection('login');
    return;
  }
  // Show main nav & user area
  updateNavActive('dashboard');

  // render companies
  renderCompanyList();
  renderCompanySelectForBookings();

  // render bookings
  renderBookingList();

  // render balance
  renderBalance();

  // mini accounts
  renderMiniAccounts();

  // recht info
  renderRechtInfo();

  // navigation handlers for quick buttons in dashboard
  document.querySelectorAll('[data-nav]').forEach(b=>{
    b.onclick = ()=>{ showSection(b.dataset.nav); };
  });
}

// On load: check if logged in
(function init(){
  const current = getCurrentUser();
  if(current){
    renderForCurrentUser();
    showSection('dashboard');
  } else {
    showSection('login');
  }
})();
