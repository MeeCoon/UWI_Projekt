// Firmenansicht – inkl. Bilanz, Jahr-Wechsel & User-Handling

const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_PREFIX = 'uwi_currentCompany_';
const SELECTED_COMPANY_KEY = SELECTED_COMPANY_PREFIX; // Shortcut

/* ------------------ Helper ------------------ */
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
  try {
    return JSON.parse(localStorage.getItem(companiesKey(user))) || [];
  } catch {
    return [];
  }
}

/* ------------------ Bilanz ------------------ */
function getSelectedCompany() {
  const raw = localStorage.getItem(SELECTED_COMPANY_KEY);
  return raw ? JSON.parse(raw) : null;
}

function balanceKey(companyId, year) {
  return `uwi_balance_${companyId}_${year}`;
}

function defaultBalanceData() {
  return {
    kasse: 0, bank: 0, fll: 0, vorr_roh: 0, vorr_handels: 0,
    informatik: 0, fahrzeuge: 0, mobiliar: 0,
    vll: 0, bankverbind: 0, aktienkapital: 0, gewinnreserve: 0, jahresgewinn: 0
  };
}

function loadBalance(companyId, year) {
  const raw = localStorage.getItem(balanceKey(companyId, year));
  if (!raw) return defaultBalanceData();
  try { return { ...defaultBalanceData(), ...JSON.parse(raw) }; } catch { return defaultBalanceData(); }
}

function saveBalance(companyId, year, data) {
  localStorage.setItem(balanceKey(companyId, year), JSON.stringify(data));
}

function sumAktiven(d) { return (d.kasse||0)+(d.bank||0)+(d.fll||0)+(d.vorr_roh||0)+(d.vorr_handels||0)+(d.informatik||0)+(d.fahrzeuge||0)+(d.mobiliar||0); }
function sumPassiven(d) { return (d.vll||0)+(d.bankverbind||0)+(d.aktienkapital||0)+(d.gewinnreserve||0)+(d.jahresgewinn||0); }

function fmtCHF(n) {
  const s = Math.round(Number(n||0)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, "'") + ' CHF';
}

function collectBalanceFromUI(areaEl) {
  const data = defaultBalanceData();
  areaEl.querySelectorAll(".balanceInput").forEach(inp => { data[inp.dataset.bkey] = Number(inp.value||0); });
  return data;
}

function renderBalance(year) {
  const company = getSelectedCompany();
  if (!company) return;
  const area = document.getElementById("balanceArea");
  if (!area) return;

  const d = loadBalance(company.id, year);

  area.innerHTML = `
<div class="balanceHeaderBlue">
  <div class="balanceTitle">Bilanz ${year}</div>
  <div class="balanceSub">alle Beträge in CHF (Start: 0)</div>
</div>
<div class="balanceSheet">
  <div class="balanceCol">
    <div class="balanceColTitle">Aktiven</div>
    <div class="balanceBlockTitle">Umlaufvermögen</div>
    ${row("Kasse","kasse",d.kasse)}
    ${row("Bank","bank",d.bank)}
    ${row("FLL","fll",d.fll)}
    ${row("Vorräte Rohstoffe","vorr_roh",d.vorr_roh)}
    ${row("Vorräte Handelswaren","vorr_handels",d.vorr_handels)}
    <div class="balanceBlockTitle">Anlagevermögen</div>
    ${row("Informatik","informatik",d.informatik)}
    ${row("Fahrzeuge","fahrzeuge",d.fahrzeuge)}
    ${row("Mobiliar & Einrichtungen","mobiliar",d.mobiliar)}
    <div class="balanceTotal"><span>Total Aktiven</span><span id="totalAktiven">${fmtCHF(sumAktiven(d))}</span></div>
  </div>
  <div class="balanceDivider"></div>
  <div class="balanceCol">
    <div class="balanceColTitle">Passiven</div>
    <div class="balanceBlockTitle">Fremdkapital</div>
    ${row("VLL","vll",d.vll)}
    ${row("Bankverbindlichkeiten","bankverbind",d.bankverbind)}
    <div class="balanceBlockTitle">Eigenkapital</div>
    ${row("Aktienkapital","aktienkapital",d.aktienkapital)}
    ${row("Gesetzliche Gewinnreserve","gewinnreserve",d.gewinnreserve)}
    ${row("Jahresgewinn","jahresgewinn",d.jahresgewinn)}
    <div class="balanceTotal"><span>Total Passiven</span><span id="totalPassiven">${fmtCHF(sumPassiven(d))}</span></div>
  </div>
</div>
<div class="balanceActions">
  <button type="button" class="btn" id="saveBalanceBtn" data-year="${year}">Speichern</button>
  <span class="muted small" id="saveInfo"></span>
</div>`;

  function row(label,key,val){ return `<div class="balanceRow"><span>${label}</span><input class="balanceInput" type="number" min="0" step="1" value="${Number(val||0)}" data-bkey="${key}" /></div>`; }

  area.querySelectorAll(".balanceInput").forEach(inp => {
    inp.addEventListener("input",()=>{ 
      const data = collectBalanceFromUI(area);
      area.querySelector("#totalAktiven").textContent = fmtCHF(sumAktiven(data));
      area.querySelector("#totalPassiven").textContent = fmtCHF(sumPassiven(data));
    });
  });

  const saveBtn = area.querySelector("#saveBalanceBtn");
  saveBtn.addEventListener("click",()=>{
    const data = collectBalanceFromUI(area);
    saveBalance(company.id, year, data);
    const info = area.querySelector("#saveInfo");
    if(info) info.textContent = `Gespeichert für ${year}.`;
  });
}

/* ------------------ Year Tabs ------------------ */
function attachYearButtonEvents(container){
  container.querySelectorAll('.yearBtn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      container.querySelectorAll('.yearBtn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const year = Number(btn.textContent);
      renderBalance(year);
    });
  });
}

function renderYearTabs(container){
  container.innerHTML = '';
  const years = [2025];
  years.forEach(year=>{
    const btn = document.createElement('button');
    btn.className='yearBtn';
    btn.textContent=year;
    container.appendChild(btn);
  });
  const addBtn=document.createElement('button');
  addBtn.className='addYearBtn';
  addBtn.textContent='+ Jahr hinzufügen';
  container.appendChild(addBtn);

  attachYearButtonEvents(container);

  addBtn.addEventListener('click',()=>{
    const input=prompt('Jahr eingeben (2026–2100)');
    const year=Number(input);
    if(!year||year<2026||year>2100){alert('Bitte ein gültiges Jahr zwischen 2026 und 2100 eingeben.'); return;}
    const exists=[...container.querySelectorAll('.yearBtn')].some(b=>Number(b.textContent)===year);
    if(exists) return;
    const btn=document.createElement('button');
    btn.className='yearBtn';
    btn.textContent=year;
    container.insertBefore(btn,addBtn);
    attachYearButtonEvents(container);
  });
}

/* ------------------ DOM Ready ------------------ */
document.addEventListener('DOMContentLoaded',()=>{
  const user=getCurrentUserOrRedirect();
  if(!user) return;

  const companyId=localStorage.getItem(selectedCompanyKey(user));
  if(!companyId){ alert('Keine Firma ausgewählt. Zurück zur Übersicht.'); window.location.href='overview.html'; return; }

  const companies=loadCompaniesForUser(user);
  const company=companies.find(c=>c.id===companyId);
  if(!company){ alert('Firma nicht gefunden. Zurück zur Übersicht.'); window.location.href='overview.html'; return; }

  const titleEl=document.getElementById('companyTitle');
  const metaEl=document.getElementById('companyMeta');
  if(titleEl) titleEl.textContent=company.name;
  if(metaEl) metaEl.textContent=`${company.legal} · ${company.industry||'–'} · Startkapital: ${company.capital} € · Mitarbeitende: ${company.size}`;

  const backBtn=document.getElementById('backBtn');
  const logoutBtn=document.getElementById('logoutBtn');
  const userDisplay=document.getElementById('userDisplay');

  if(userDisplay) userDisplay.textContent=`Angemeldet: ${user}`;

  if(backBtn) backBtn.addEventListener('click',()=>{ window.location.href='overview.html'; });
  if(logoutBtn) logoutBtn.addEventListener('click',()=>{
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(selectedCompanyKey(user));
    window.location.href='index.html';
  })
