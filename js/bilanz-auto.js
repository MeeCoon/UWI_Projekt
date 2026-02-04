// js/bilanz-auto.js
const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = "2024";

function getUserOrRedirect() {
  const u = localStorage.getItem(USER_KEY);
  if (!u) { window.location.href = "index.html"; return null; }
  return u;
}
function loadCompanies(u) {
  try { return JSON.parse(localStorage.getItem(companiesKey(u)) || "[]"); }
  catch { return []; }
}
function getSelectedCompany(u) {
  const id = localStorage.getItem(currentCompanyKey(u));
  if (!id) return null;
  return loadCompanies(u).find(c => c.id === id) || null;
}

function getYears(companyId) {
  const key = `uwi_years_${companyId}_balance`;
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "null");
    if (Array.isArray(arr) && arr.length) return arr.map(String);
  } catch {}
  return [...DEFAULT_YEARS];
}
function saveYears(companyId, years) {
  const key = `uwi_years_${companyId}_balance`;
  localStorage.setItem(key, JSON.stringify(years));
}

function loadJournal(companyId, year) {
  try { return JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]"); }
  catch { return []; }
}

function fmtCHF(n) {
  const num = Math.round(Number(n || 0));
  const s = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${s} CHF`;
}

// Soll +, Haben -
function computeSaldo(rows) {
  const saldo = {};
  for (const r of rows) {
    const debit = String(r.debit || r.soll || "").trim();
    const credit = String(r.credit || r.haben || "").trim();
    const amt = Number(r.amount ?? r.betrag ?? 0);
    if (!debit || !credit || !(amt > 0)) continue;

    saldo[debit] = (saldo[debit] || 0) + amt;
    saldo[credit] = (saldo[credit] || 0) - amt;
  }
  return saldo;
}

function isAsset(acct) { return String(acct).startsWith("1"); }
function isLiabEq(acct) { return String(acct).startsWith("2"); }

function applyBalance(companyId, year) {
  const title = document.getElementById("balanceTitle");
  const sub = document.getElementById("balanceSub");
  if (title) title.textContent = `Bilanz ${year}`;
  if (sub) sub.textContent = `Beträge werden aus Buchungen berechnet (Start = 0)`;

  const rows = loadJournal(companyId, year);
  const saldo = computeSaldo(rows);

  let totalAkt = 0;
  let totalPas = 0;

  document.querySelectorAll(".balanceRow").forEach(row => {
    const label = row.querySelector("span")?.textContent?.trim() || "";
    const input = row.querySelector("input.balanceInput");
    if (!input) return;

    const m = label.match(/^(\d+)/); // "1020 Bank..." -> 1020
    if (!m) return;
    const acct = m[1];

    const s = Number(saldo[acct] || 0);

    let shown = 0;
    if (isAsset(acct)) {
      shown = Math.max(s, 0);
      totalAkt += shown;
    } else if (isLiabEq(acct)) {
      shown = Math.max(-s, 0);
      totalPas += shown;
    } else {
      shown = Math.max(s, 0);
    }

    input.value = String(Math.round(shown));
    input.readOnly = true;
    input.style.background = "#f8fafc";
  });

  document.getElementById("totalAktiven")?.replaceChildren(document.createTextNode(fmtCHF(totalAkt)));
  document.getElementById("totalPassiven")?.replaceChildren(document.createTextNode(fmtCHF(totalPas)));
}

function renderYearTabs(companyId) {
  const el = document.getElementById("yearTabs");
  if (!el) return;

  const years = getYears(companyId);
  if (!years.includes(currentYear)) currentYear = years[0];

  el.innerHTML =
    years.map(y => `<button type="button" class="yearBtn ${y===currentYear?"active":""}" data-year="${y}">${y}</button>`).join("") +
    `<button type="button" class="addYearBtn" id="addYearBtn">+ Jahr hinzufügen</button>`;

  el.onclick = (e) => {
    const b = e.target.closest(".yearBtn");
    if (!b) return;
    currentYear = b.dataset.year;
    renderYearTabs(companyId);
    applyBalance(companyId, currentYear);
  };

  document.getElementById("addYearBtn").onclick = () => {
    const input = prompt("Jahr eingeben (z.B. 2027):");
    if (!input) return;
    const y = input.trim();
    if (!/^\d{4}$/.test(y) || +y < 2000 || +y > 2100) return alert("Ungültiges Jahr (2000–2100).");

    const next = getYears(companyId);
    if (next.includes(y)) return alert("Dieses Jahr gibt es schon.");

    next.push(y);
    next.sort();
    saveYears(companyId, next);

    currentYear = y;
    renderYearTabs(companyId);
    applyBalance(companyId, currentYear);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;
  document.getElementById("backBtn").onclick = () => window.location.href = "company.html";
  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  };

  const company = getSelectedCompany(user);
  if (!company) { window.location.href = "overview.html"; return; }

  const years = getYears(company.id);
  currentYear = years[0];

  renderYearTabs(company.id);
  applyBalance(company.id, currentYear);
});
