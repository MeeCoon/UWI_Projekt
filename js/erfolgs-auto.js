console.log("✅ erfolgsrechnung-auto.js läuft");

const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKeyForCompany = (companyId) => `uwi_years_${companyId}_income`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = DEFAULT_YEARS[0];

function fmtCHF(n) {
  const num = Math.round(Number(n || 0));
  const s = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${s} CHF`;
}

function getUser() {
  return localStorage.getItem(USER_KEY);
}

function loadCompanies(user) {
  try { return JSON.parse(localStorage.getItem(companiesKey(user)) || "[]"); }
  catch { return []; }
}

function getSelectedCompany(user) {
  const id = localStorage.getItem(currentCompanyKey(user));
  if (!id) return null;
  return loadCompanies(user).find(c => c.id === id) || null;
}

function getYears(companyIdOrNull) {
  if (!companyIdOrNull) return [...DEFAULT_YEARS];
  try {
    const arr = JSON.parse(localStorage.getItem(yearsKeyForCompany(companyIdOrNull)) || "null");
    if (Array.isArray(arr) && arr.length) return arr.map(String);
  } catch {}
  return [...DEFAULT_YEARS];
}

function saveYears(companyIdOrNull, years) {
  if (!companyIdOrNull) return; // ohne Firma speichern wir keine Jahre
  localStorage.setItem(yearsKeyForCompany(companyIdOrNull), JSON.stringify(years));
}

function loadJournal(companyIdOrNull, year) {
  if (!companyIdOrNull) return [];
  try { return JSON.parse(localStorage.getItem(journalKey(companyIdOrNull, year)) || "[]"); }
  catch { return []; }
}

// Soll +, Haben -
function computeSaldo(rows) {
  const saldo = {};
  for (const r of rows) {
    const debit  = String(r.debit || r.soll  || "").trim();
    const credit = String(r.credit || r.haben || "").trim();
    const amt = Number(r.amount ?? r.betrag ?? 0);
    if (!debit || !credit || !(amt > 0)) continue;

    saldo[debit]  = (saldo[debit]  || 0) + amt;
    saldo[credit] = (saldo[credit] || 0) - amt;
  }
  return saldo;
}

function isExpense(acct) {
  const first = String(acct)[0];
  return ["4","5","6"].includes(first) || acct === "8000" || acct === "8500";
}
function isRevenue(acct) {
  const first = String(acct)[0];
  return ["3","7","8"].includes(first) || acct === "8100" || acct === "8510";
}

function applyER(companyIdOrNull, year) {
  document.getElementById("erTitle")?.replaceChildren(document.createTextNode(`Erfolgsrechnung ${year}`));
  document.getElementById("erSub")?.replaceChildren(document.createTextNode(`Beträge werden aus Buchungen berechnet (Start = 0)`));

  const rows = loadJournal(companyIdOrNull, year);
  const saldo = computeSaldo(rows);

  let totalA = 0;
  let totalE = 0;

  document.querySelectorAll(".balanceRow").forEach(row => {
    const label = row.querySelector("span")?.textContent?.trim() || "";
    const input = row.querySelector("input.balanceInput");
    if (!input) return;

    const m = label.match(/^(\d+)/);
    if (!m) return;
    const acct = m[1];
    const s = Number(saldo[acct] || 0);

    let shown = 0;
    if (isExpense(acct)) { shown = Math.max(s, 0); totalA += shown; }
    else if (isRevenue(acct)) { shown = Math.max(-s, 0); totalE += shown; }
    else shown = 0;

    input.value = String(Math.round(shown));
    input.readOnly = true;
    input.style.background = "#f8fafc";
  });

  document.getElementById("totalAufwand")?.replaceChildren(document.createTextNode(fmtCHF(totalA)));
  document.getElementById("totalErtrag")?.replaceChildren(document.createTextNode(fmtCHF(totalE)));
  document.getElementById("jahresErgebnis")?.replaceChildren(document.createTextNode(fmtCHF(totalE - totalA)));
  document.getElementById("countBookings")?.replaceChildren(document.createTextNode(String(rows.length)));
}

function renderYearTabs(companyIdOrNull) {
  const el = document.getElementById("yearTabs");
  if (!el) return;

  const years = getYears(companyIdOrNull);
  if (!years.includes(currentYear)) currentYear = years[0];

  el.innerHTML =
    years.map(y => `<button type="button" class="yearBtn ${y===currentYear?"active":""}" data-year="${y}">${y}</button>`).join("") +
    `<button type="button" class="addYearBtn" id="addYearBtn">+ Jahr hinzufügen</button>`;

  el.onclick = (e) => {
    const b = e.target.closest(".yearBtn");
    if (!b) return;
    currentYear = b.dataset.year;
    renderYearTabs(companyIdOrNull);
    applyER(companyIdOrNull, currentYear);
  };

  document.getElementById("addYearBtn").onclick = () => {
    const input = prompt("Jahr eingeben (z.B. 2027):");
    if (!input) return;
    const y = input.trim();
    if (!/^\d{4}$/.test(y) || +y < 2000 || +y > 2100) return alert("Ungültiges Jahr (2000–2100).");

    const next = getYears(companyIdOrNull);
    if (next.includes(y)) return alert("Dieses Jahr gibt es schon.");

    next.push(y); next.sort();
    saveYears(companyIdOrNull, next);

    currentYear = y;
    renderYearTabs(companyIdOrNull);
    applyER(companyIdOrNull, currentYear);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();

  // Buttons funktionieren immer (auch wenn user fehlt)
  document.getElementById("backBtn")?.addEventListener("click", () => {
    window.location.href = "company.html";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    const u = localStorage.getItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    if (u) localStorage.removeItem(currentCompanyKey(u));
    window.location.href = "index.html";
  });

  if (user) document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;
  const company = user ? getSelectedCompany(user) : null;
  const companyId = company?.id || null;

  currentYear = getYears(companyId)[0];
  renderYearTabs(companyId);
  applyER(companyId, currentYear);
});
