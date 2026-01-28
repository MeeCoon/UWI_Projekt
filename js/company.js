// company.js

// -----------------------------
// Konstanten & lokale Speicherung
// -----------------------------
const USER_KEY = "uwi_user";
const SELECTED_COMPANY_KEY = "uwi_selected_company";

// -----------------------------
// Helper: ausgewählte Firma
// -----------------------------
function getSelectedCompany() {
  const raw = localStorage.getItem(SELECTED_COMPANY_KEY);
  return raw ? JSON.parse(raw) : null;
}

// -----------------------------
// Navigation
// -----------------------------
document.getElementById("backBtn")?.addEventListener("click", () => {
  window.location.href = "overview.html";
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SELECTED_COMPANY_KEY);
  window.location.href = "login.html";
});

// -----------------------------
// Firmenname oben setzen
// -----------------------------
function renderCompanyHeader() {
  const company = getSelectedCompany();
  if (!company) return;
  const titleEl = document.getElementById("companyTitle");
  const metaEl = document.getElementById("companyMeta");
  if (titleEl) titleEl.textContent = company.name;
  if (metaEl) metaEl.textContent = `ID: ${company.id} — Branche: ${company.industry || "–"}`;
}
renderCompanyHeader();

// -----------------------------
// Tabs
// -----------------------------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(tc => {
      tc.classList.toggle("hidden", tc.id !== tab);
    });
  });
});

// -----------------------------
// Bilanz Datenmanagement
// -----------------------------
function balanceKey(companyId, year) {
  return `uwi_balance_${companyId}_${year}`;
}

function defaultBalanceData() {
  return {
    // Aktiven
    kasse: 0, bank: 0, fll: 0, vorr_roh: 0, vorr_handels: 0, informatik: 0, fahrzeuge: 0, mobiliar: 0,
    // Passiven
    vll: 0, bankverbind: 0, aktienkapital: 0, gewinnreserve: 0, jahresgewinn: 0
  };
}

function loadBalance(companyId, year) {
  const raw = localStorage.getItem(balanceKey(companyId, year));
  if (!raw) return defaultBalanceData();
  try {
    const obj = JSON.parse(raw);
    return { ...defaultBalanceData(), ...obj };
  } catch {
    return defaultBalanceData();
  }
}

function saveBalance(companyId, year, data) {
  localStorage.setItem(balanceKey(companyId, year), JSON.stringify(data));
}

function sumAktiven(d) {
  return (d.kasse||0)+(d.bank||0)+(d.fll||0)+(d.vorr_roh||0)+(d.vorr_handels||0)+(d.informatik||0)+(d.fahrzeuge||0)+(d.mobiliar||0);
}
function sumPassiven(d) {
  return (d.vll||0)+(d.bankverbind||0)+(d.aktienkapital||0)+(d.gewinnreserve||0)+(d.jahresgewinn||0);
}

function fmtCHF(n) {
  const num = Number(n || 0);
  const s = Math.round(num).toString();
  const withApos = s.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${withApos} CHF`;
}

// -----------------------------
// Bilanz rendern
// -----------------------------
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

    <div class="balanceTotal">
      <span>Total Aktiven</span>
      <span id="totalAktiven">${fmtCHF(sumAktiven(d))}</span>
    </div>
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

    <div class="balanceTotal">
      <span>Total Passiven</span>
      <span id="totalPassiven">${fmtCHF(sumPassiven(d))}</span>
    </div>
  </div>
</div>

<div class="balanceActions">
  <button type="button" class="btn" id="saveBalanceBtn" data-year="${year}">Speichern</button>
  <span class="muted small" id="saveInfo"></span>
</div>
  `;

  function row(label,key,val){
    return `<div class="balanceRow">
      <span>${label}</span>
      <input class="balanceInput" type="number" min="0" step="1" value="${Number(val||0)}" data-bkey="${key}" />
    </div>`;
  }

  // Live totals update
  area.querySelectorAll(".balanceInput").forEach(inp=>{
    inp.addEventListener("input",()=>{
      const data = collectBalanceFromUI(area);
      area.querySelector("#totalAktiven").textContent = fmtCHF(sumAktiven(data));
      area.querySelector("#totalPassiven").textContent = fmtCHF(sumPassiven(data));
    });
  });

  // Save button
  area.querySelector("#saveBalanceBtn")?.addEventListener("click",()=>{
    const data = collectBalanceFromUI(area);
    saveBalance(company.id, year, data);
    area.querySelector("#saveInfo").textContent = `Gespeichert für ${year}.`;
  });
}

function collectBalanceFromUI(areaEl){
  const data = defaultBalanceData();
  areaEl.querySelectorAll(".balanceInput").forEach(inp=>{
    const k = inp.dataset.bkey;
    data[k] = Number(inp.value || 0);
  });
  return data;
}

// -----------------------------
// Beispiel: Jahr auswählen
// Ruft renderBalance auf, wenn "balance" Tab aktiv ist
// -----------------------------
document.querySelectorAll(".yearBtn")?.forEach(btn=>{
  btn.addEventListener("click",()=>{
    const year = btn.dataset.year;
    const section = document.querySelector(".tab-content:not(.hidden)")?.id;
    if(section === "balance") renderBalance(year);
  });
});

// Optional: auto-render aktuelles Jahr beim Laden
document.addEventListener("DOMContentLoaded",()=>{
  const currentYear = new Date().getFullYear();
  renderBalance(currentYear);
});
