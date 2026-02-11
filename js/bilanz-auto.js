// js/bilanz-auto.js  (mit Jahren + Auto aus Buchungen + Split-Buchungen)

const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

// Journal pro Firma + Jahr
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;

// ✅ Ein gemeinsamer Years-Key (empfohlen für Bilanz/ER/Bookings)
const yearsKey = (companyId) => `uwi_years_${companyId}`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = DEFAULT_YEARS[0];

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

// ---------- Saldo aus Journal (ALT + SPLIT) ----------
function computeSaldo(rows) {
  const saldo = {};

  for (const r of rows) {
    // ✅ Splittbuchung
    if (r && r.type === "split") {
      (r.debits || []).forEach(d => {
        const acct = String(d.accountNo || "").trim();
        const amt = Number(d.amount || 0);
        if (acct && amt > 0) saldo[acct] = (saldo[acct] || 0) + amt; // Soll +
      });
      (r.credits || []).forEach(c => {
        const acct = String(c.accountNo || "").trim();
        const amt = Number(c.amount || 0);
        if (acct && amt > 0) saldo[acct] = (saldo[acct] || 0) - amt; // Haben -
      });
      continue;
    }

    // ✅ Normale Buchung (1 Soll / 1 Haben)
    const debit = String(r.debit || r.soll || "").trim();
    const credit = String(r.credit || r.haben || "").trim();
    const amt = Number(r.amount ?? r.betrag ?? 0);
    if (!debit || !credit || !(amt > 0)) continue;

    saldo[debit] = (saldo[debit] || 0) + amt;
    saldo[credit] = (saldo[credit] || 0) - amt;
  }

  return saldo;
}

// Bilanz-Regel (vereinfachte Schule-Variante):
// Aktivkonten: 1xxx und 14xx (bei euch beginnt Anlagevermögen auch mit 14)
// Passiven/EK: 2xxx und 28xx
function isAsset(acct) {
  const a = String(acct);
  return a.startsWith("1"); // (deckt 1xxx & 14xx ab)
}
function isLiabEq(acct) {
  const a = String(acct);
  return a.startsWith("2"); // (deckt 2xxx & 28xx ab)
}

// Inputs füllen + Totale berechnen
function applyBalance(companyId, year) {
  const rows = loadJournal(companyId, year);
  const saldo = computeSaldo(rows);

  let totalAkt = 0;
  let totalPas = 0;

  document.querySelectorAll(".balanceRow").forEach((row, i) => {
    const label = row.querySelector("span")?.textContent?.trim() || "";
    const input = row.querySelector("input.balanceInput");
    if (!input) return;

    // Kontonummer aus Label holen (z.B. "1020 Bankguthaben")
    const m = label.match(/^(\d+)/);
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
      shown = 0;
    }

    input.value = String(Math.round(shown));
    input.readOnly = true;
    input.classList.add("input-readonly"); // CSS: .input-readonly { background:#f8fafc; }

    // Accessibility (Webhint Warnung weg)
    if (!input.name) input.name = `bal_${acct}_${i}`;
    if (!input.id) input.id = `bal_${acct}_${i}`;
    if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", `${label} Betrag`);
  });

  document.getElementById("totalAktiven")?.replaceChildren(document.createTextNode(fmtCHF(totalAkt)));
  document.getElementById("totalPassiven")?.replaceChildren(document.createTextNode(fmtCHF(totalPas)));
  document.getElementById("balanceTitle")?.replaceChildren(document.createTextNode(`Bilanz ${year}`));
}

// ---------- Jahre Tabs ----------
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
    if (!/^\d{4}$/.test(y) || +y < 2000 || +y > 2100) {
      return alert("Ungültiges Jahr (2000–2100).");
    }
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

// ---------- Start ----------
document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  document.getElementById("userDisplay")?.replaceChildren(document.createTextNode(`Angemeldet: ${user}`));

  // Buttons
  document.getElementById("backBtn")?.addEventListener("click", () => window.location.href = "company.html");
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    const u = localStorage.getItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    if (u) localStorage.removeItem(currentCompanyKey(u));
    window.location.href = "index.html";
  });

  const company = getSelectedCompany(user);
  if (!company) { window.location.href = "overview.html"; return; }

  const years = getYears(company.id);
  currentYear = years[0];

  renderYearTabs(company.id);
  applyBalance(company.id, currentYear);
});
