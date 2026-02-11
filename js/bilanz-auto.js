const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = DEFAULT_YEARS[0];

// ===== ZENTRALER KONTENPLAN (für Bilanz) =====
const KONTENPLAN = [
  "1000","1020","1060","1100","1170","1200","1210","1300",
  "1400","1480","1500","1510","1520","1530","1600","1700",
  "2000","2030","2100","2200","2300",
  "2450","2451","2600",
  "2800","2950","2970"
];

function fmtCHF(n) {
  const num = Math.round(Number(n || 0));
  const s = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${s} CHF`;
}

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
  try {
    const arr = JSON.parse(localStorage.getItem(yearsKey(companyId)) || "null");
    if (Array.isArray(arr) && arr.length) return arr.map(String);
  } catch {}
  return [...DEFAULT_YEARS];
}

function saveYears(companyId, years) {
  localStorage.setItem(yearsKey(companyId), JSON.stringify(years.map(String)));
}

function loadJournal(companyId, year) {
  try { return JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]"); }
  catch { return []; }
}

// ===== SALDO AUS BUCHUNGEN =====
function computeSaldo(rows) {
  const saldo = {};

  for (const r of rows) {
    if (r && r.type === "split") {
      (r.debits || []).forEach(d => {
        const acct = String(d.accountNo || "").trim();
        const amt = Number(d.amount || 0);
        if (acct && amt > 0) saldo[acct] = (saldo[acct] || 0) + amt;
      });
      (r.credits || []).forEach(c => {
        const acct = String(c.accountNo || "").trim();
        const amt = Number(c.amount || 0);
        if (acct && amt > 0) saldo[acct] = (saldo[acct] || 0) - amt;
      });
    }
  }
  return saldo;
}

function isAsset(acct) { return String(acct).startsWith("1"); }
function isLiabEq(acct) { return String(acct).startsWith("2"); }

// ===== BILANZ ANWENDEN =====
function applyBalance(companyId, year) {
  const rows = loadJournal(companyId, year);
  const saldo = computeSaldo(rows);

  let totalAkt = 0;
  let totalPas = 0;

  document.querySelectorAll(".balanceRow").forEach(row => {
    const label = row.querySelector("span")?.textContent?.trim() || "";
    const input = row.querySelector("input.balanceInput");
    if (!input) return;

    const m = label.match(/^(\d{4})/);
    if (!m) return;
    const acct = m[1];

    const s = Number(saldo[acct] || 0);
    let shown = 0;

    if (isAsset(acct)) {
      shown = Math.max(s, 0);
      totalAkt += shown;
    } 
    else if (isLiabEq(acct)) {
      shown = Math.max(-s, 0);
      totalPas += shown;
    }

    input.value = String(Math.round(shown));
    input.readOnly = true;
    input.classList.add("input-readonly");
  });

  document.getElementById("totalAktiven").textContent = fmtCHF(totalAkt);
  document.getElementById("totalPassiven").textContent = fmtCHF(totalPas);
  document.getElementById("balanceTitle").textContent = `Bilanz ${year}`;
}

// ===== JAHRES-TABS =====
function renderYearTabs(companyId) {
  const el = document.getElementById("yearTabs");
  const years = getYears(companyId);
  if (!years.includes(currentYear)) currentYear = years[0];

  el.innerHTML =
    years.map(y => `<button type="button" class="yearBtn ${y===currentYear?"active":""}" data-year="${y}">${y}</button>`).join("") +
    `<button type="button" class="addYearBtn" id="addYearBtn">+ Jahr</button>` +
    `<button type="button" class="addYearBtn" id="delYearBtn">🗑 Jahr</button>`;

  el.onclick = (e) => {
    const b = e.target.closest(".yearBtn");
    if (!b) return;
    currentYear = b.dataset.year;
    renderYearTabs(companyId);
    applyBalance(companyId, currentYear);
  };

  document.getElementById("addYearBtn").onclick = () => {
    const y = prompt("Jahr eingeben (z.B. 2027):")?.trim();
    if (!/^\d{4}$/.test(y)) return alert("Ungültiges Jahr.");

    const next = getYears(companyId);
    if (next.includes(y)) return alert("Jahr existiert bereits.");
    next.push(y); next.sort();
    saveYears(companyId, next);
    currentYear = y;
    renderYearTabs(companyId);
    applyBalance(companyId, currentYear);
  };

  document.getElementById("delYearBtn").onclick = () => {
    const list = getYears(companyId);
    if (list.length <= 1) return alert("Letztes Jahr kann nicht gelöscht werden.");

    const y = prompt(`Welches Jahr löschen? (${list.join(", ")})`, currentYear);
    if (!list.includes(y)) return alert("Jahr existiert nicht.");

    if (!confirm(`Jahr ${y} löschen inkl. Buchungen?`)) return;

    const next = list.filter(v => v !== y);
    saveYears(companyId, next);
    localStorage.removeItem(journalKey(companyId, y));
    currentYear = next[0];
    renderYearTabs(companyId);
    applyBalance(companyId, currentYear);
  };
}

// ===== START =====
document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  const company = getSelectedCompany(user);
  if (!company) { window.location.href = "overview.html"; return; }

  currentYear = getYears(company.id)[0];
  renderYearTabs(company.id);
  applyBalance(company.id, currentYear);
});
