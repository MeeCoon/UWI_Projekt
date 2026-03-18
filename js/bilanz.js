// js/bilanz.js
const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}_balance`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = "2024";

/* =========================
   AKTIVEN ALS BLÖCKE
========================= */
const ASSET_GROUPS = [
  {
    title: "1 – Umlaufvermögen",
    accounts: [
      ["1000", "Kasse"],
      ["1020", "Bankguthaben"],
      ["1060", "Wertschriften"],
      ["1100", "Forderungen"],
      ["1170", "Vorsteuer MWST"],
      ["1200", "Handelswaren"],
      ["1210", "Rohstoffe"],
      ["1300", "Aktive Rechnungsabgrenzung"]
    ]
  },
  {
    title: "14 – Anlagevermögen",
    accounts: [
      ["1400", "Wertschriften"],
      ["1480", "Beteiligungen"],
      ["1500", "Maschinen & Apparate"],
      ["1510", "Mobiliar"],
      ["1520", "Büromaschinen"],
      ["1530", "Fahrzeuge"],
      ["1600", "Geschäftsliegenschaften"],
      ["1700", "Immaterielle Werte"]
    ]
  }
];

/* =========================
   PASSIVEN ALS BLÖCKE
========================= */
function getLiabilityGroups(legal) {
  const baseShort = {
    title: "20 – Kurzfristiges Fremdkapital",
    accounts: [
      ["2000", "Verbindlichkeiten"],
      ["2030", "Erhaltene Anzahlungen"],
      ["2100", "Bankverbindlichkeiten"],
      ["2200", "Geschuldete MWST"],
      ["2300", "Passive Rechnungsabgrenzung"]
    ]
  };

  const baseLong = {
    title: "24 – Langfristiges Fremdkapital",
    accounts: [
      ["2450", "Darlehen"],
      ["2451", "Hypotheken"],
      ["2600", "Rückstellungen"]
    ]
  };

  if (legal === "Einzelunternehmen") {
    return [
      baseShort,
      baseLong,
      {
        title: "28 – Eigenkapital",
        accounts: [
          ["2800", "Eigenkapital"],
          ["2850", "Privat"],
          ["2891", "Jahresgewinn / Jahresverlust"]
        ]
      }
    ];
  }

  if (legal === "GmbH") {
    return [
      baseShort,
      baseLong,
      {
        title: "28 – Eigenkapital",
        accounts: [
          ["2800", "Stammkapital"],
          ["2970", "Gewinnvortrag"]
        ]
      }
    ];
  }

  if (legal === "AG") {
    return [
      baseShort,
      baseLong,
      {
        title: "28 – Eigenkapital",
        accounts: [
          ["2800", "Aktienkapital"],
          ["2950", "Gesetzliche Reserven"],
          ["2970", "Gewinnvortrag"]
        ]
      }
    ];
  }

  return [baseShort, baseLong];
}

/* =========================
   HELPER
========================= */
function getUserOrRedirect() {
  const u = localStorage.getItem(USER_KEY);
  if (!u) {
    window.location.href = "index.html";
    return null;
  }
  return u;
}

function loadCompanies(u) {
  try {
    return JSON.parse(localStorage.getItem(companiesKey(u)) || "[]");
  } catch {
    return [];
  }
}

function getSelectedCompany(u) {
  const id = localStorage.getItem(currentCompanyKey(u));
  if (!id) return null;
  return loadCompanies(u).find(c => c.id === id) || null;
}

function getYears(companyId) {
  try {
    const raw = localStorage.getItem(yearsKey(companyId));
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) {
      return arr.map(String);
    }
  } catch {}

  return [...DEFAULT_YEARS];
}

function saveYears(companyId, years) {
  localStorage.setItem(yearsKey(companyId), JSON.stringify(years));
}

function fmtCHF(n) {
  const num = Math.round(Number(n || 0));
  const s = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${s} CHF`;
}

function loadJournal(companyId, year) {
  try {
    return JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]");
  } catch {
    return [];
  }
}

/* =========================
   SALDO BERECHNEN
========================= */
function computeBalancesFromJournal(rows) {
  const bal = {};

  for (const r of rows) {
    const debit = String(r.debit || "").trim();
    const credit = String(r.credit || "").trim();
    const amt = Number(r.amount || 0);

    if (!debit || !credit || !(amt > 0)) continue;

    bal[debit] = (bal[debit] || 0) + amt;
    bal[credit] = (bal[credit] || 0) - amt;
  }

  return bal;
}

/* =========================
   JAHR TABS
========================= */
function renderYearTabs(companyId) {
  const el = document.getElementById("yearTabs");
  if (!el) return;

  const years = getYears(companyId);

  if (!years.includes(currentYear)) {
    currentYear = years[0];
  }

  el.innerHTML =
    years.map(y => `
      <button
        class="yearBtn ${y === currentYear ? "active" : ""}"
        data-year="${y}"
        type="button">
        ${y}
      </button>
    `).join("") +
    `
      <button class="addYearBtn" id="addYearBtn" type="button">+ Jahr hinzufügen</button>
      <button class="addYearBtn" id="deleteYearBtn" type="button">🗑 Jahr löschen</button>
    `;

  el.onclick = (e) => {
    const yearBtn = e.target.closest(".yearBtn");
    if (yearBtn) {
      currentYear = yearBtn.dataset.year;
      renderYearTabs(companyId);
      renderBalance(companyId, currentYear);
      return;
    }

    const addBtn = e.target.closest("#addYearBtn");
    if (addBtn) {
      const y = prompt("Jahr eingeben (z.B. 2027)");
      if (!y) return;

      const year = y.trim();

      if (!/^\d{4}$/.test(year)) {
        alert("Ungültiges Jahr");
        return;
      }

      const list = getYears(companyId);

      if (list.includes(year)) {
        alert("Jahr existiert bereits");
        return;
      }

      list.push(year);
      list.sort();
      saveYears(companyId, list);

      currentYear = year;
      renderYearTabs(companyId);
      renderBalance(companyId, currentYear);
      return;
    }

    const deleteBtn = e.target.closest("#deleteYearBtn");
    if (deleteBtn) {
      const list = getYears(companyId);

      if (list.length <= 1) {
        alert("Mindestens ein Jahr muss bleiben.");
        return;
      }

      if (!confirm(`Jahr ${currentYear} wirklich löschen?`)) {
        return;
      }

      const next = list.filter(y => y !== currentYear);
      saveYears(companyId, next);

      localStorage.removeItem(journalKey(companyId, currentYear));

      currentYear = next[0];
      renderYearTabs(companyId);
      renderBalance(companyId, currentYear);
    }
  };
}

/* =========================
   HTML HILFSFUNKTIONEN
========================= */
function renderAccountRow(no, name, value) {
  return `
    <div class="balanceRow">
      <span>${no} ${name}</span>
      <span style="font-weight:600;">${value}</span>
    </div>
  `;
}

function renderGroup(group, saldo, isAssetSide) {
  const rowsHtml = group.accounts.map(([no, name]) => {
    const raw = Number(saldo[no] || 0);
    const shown = isAssetSide ? Math.max(raw, 0) : Math.max(-raw, 0);
    return renderAccountRow(no, name, fmtCHF(shown));
  }).join("");

  return `
    <div class="balanceBlockTitle">${group.title}</div>
    ${rowsHtml}
  `;
}

/* =========================
   BILANZ RENDER
========================= */
function renderBalance(companyId, year) {
  const root = document.getElementById("balanceRoot");
  if (!root) return;

  const rows = loadJournal(companyId, year);
  const saldo = computeBalancesFromJournal(rows);

  const user = localStorage.getItem(USER_KEY);
  const company = getSelectedCompany(user);
  if (!company) return;

  const liabilityGroups = getLiabilityGroups(company.legal);

  const assetHtml = ASSET_GROUPS.map(group =>
    renderGroup(group, saldo, true)
  ).join("");

  const liabilityHtml = liabilityGroups.map(group =>
    renderGroup(group, saldo, false)
  ).join("");

  const totalAssets = ASSET_GROUPS.flatMap(g => g.accounts).reduce((sum, [no]) => {
    return sum + Math.max(Number(saldo[no] || 0), 0);
  }, 0);

  const totalLiabilities = liabilityGroups.flatMap(g => g.accounts).reduce((sum, [no]) => {
    return sum + Math.max(-Number(saldo[no] || 0), 0);
  }, 0);

  root.innerHTML = `
    <div class="balanceSheet">
      <div class="balanceCol">
        <div class="balanceColTitle">Aktiven</div>
        ${assetHtml}
        <div class="balanceTotal">
          <span>Total Aktiven</span>
          <span>${fmtCHF(totalAssets)}</span>
        </div>
      </div>

      <div class="balanceDivider"></div>

      <div class="balanceCol">
        <div class="balanceColTitle">Passiven</div>
        ${liabilityHtml}
        <div class="balanceTotal">
          <span>Total Passiven</span>
          <span>${fmtCHF(totalLiabilities)}</span>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay) {
    userDisplay.textContent = `Angemeldet: ${user}`;
  }

  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.onclick = () => {
      window.location.href = "company.html";
    };
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(currentCompanyKey(user));
      window.location.href = "index.html";
    };
  }

  const company = getSelectedCompany(user);
  if (!company) {
    window.location.href = "overview.html";
    return;
  }

  const companyInfo = document.getElementById("companyInfo");
  if (companyInfo) {
    companyInfo.textContent = `Firma: ${company.name}`;
  }

  const years = getYears(company.id);
  currentYear = years[0];

  renderYearTabs(company.id);
  renderBalance(company.id, currentYear);
});
