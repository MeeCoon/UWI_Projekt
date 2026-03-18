// js/erfolgsrechnung.js
const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}_balance`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = "2024";

function getSuccessGroups(legal, industry) {
  const groups = [];

  if (industry === "Handel") {
    groups.push(
      {
        title: "Betrieblicher Ertrag aus Lieferungen und Leistungen",
        accounts: [
          ["3200", "Warenertrag"]
        ]
      },
      {
        title: "Warenaufwand",
        accounts: [
          ["4200", "Warenaufwand"]
        ]
      }
    );
  }

  if (industry === "Produktion") {
    groups.push(
      {
        title: "Betrieblicher Ertrag aus Lieferungen und Leistungen",
        accounts: [
          ["3400", "Produktionsertrag"]
        ]
      },
      {
        title: "Material- und Produktionsaufwand",
        accounts: [
          ["4000", "Materialaufwand"],
          ["4100", "Fertigungsaufwand"]
        ]
      }
    );
  }

  if (industry === "Dienstleistung") {
    groups.push(
      {
        title: "Betrieblicher Ertrag aus Lieferungen und Leistungen",
        accounts: [
          ["3600", "Dienstleistungsertrag"]
        ]
      },
      {
        title: "Dienstleistungsaufwand",
        accounts: [
          ["4900", "Büroaufwand"]
        ]
      }
    );
  }

  groups.push(
    {
      title: "Personalaufwand",
      accounts: [
        ["5000", "Lohnaufwand"]
      ]
    },
    {
      title: "Übriger Betriebsaufwand",
      accounts: [
        ["6000", "Raumaufwand"],
        ["6300", "Versicherungsaufwand"],
        ["6600", "Werbeaufwand"],
        ["6800", "Abschreibungen"]
      ]
    },
    {
      title: "Finanzaufwand und Finanzertrag",
      accounts: [
        ["6950", "Finanzertrag"],
        ["6900", "Finanzaufwand"]
      ]
    }
  );

  if (legal === "AG") {
    groups.push({
      title: "Rechtsformbezogene Konten",
      accounts: [
        ["6960", "Kapitalaufwand AG"]
      ]
    });
  }

  if (legal === "GmbH") {
    groups.push({
      title: "Rechtsformbezogene Konten",
      accounts: [
        ["6955", "Kapitalaufwand GmbH"]
      ]
    });
  }

  return groups;
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
      <button class="yearBtn ${y === currentYear ? "active" : ""}" data-year="${y}" type="button">
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
      renderSuccess(companyId, currentYear);
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
      renderSuccess(companyId, currentYear);
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
      renderSuccess(companyId, currentYear);
    }
  };
}

/* =========================
   HTML
========================= */
function renderAccountRow(no, name, value) {
  return `
    <div class="balanceRow">
      <span>${no} ${name}</span>
      <input
        class="balanceInput input-readonly"
        type="number"
        value="${value}"
        readonly
      >
    </div>
  `;
}

function isRevenueAccount(no) {
  return no.startsWith("3");
}

function isExpenseAccount(no) {
  return no.startsWith("4") || no.startsWith("5") || no.startsWith("6");
}

function renderGroup(group, saldo) {
  const rowsHtml = group.accounts.map(([no, name]) => {
    const raw = Number(saldo[no] || 0);
    let shown = 0;

    if (isRevenueAccount(no)) shown = Math.max(-raw, 0);
    else if (isExpenseAccount(no)) shown = Math.max(raw, 0);

    return renderAccountRow(no, name, shown);
  }).join("");

  return `
    <div class="balanceBlockTitle">${group.title}</div>
    ${rowsHtml}
  `;
}

/* =========================
   ERFOLGSRECHNUNG
========================= */
function renderSuccess(companyId, year) {
  const root = document.getElementById("successRoot") || document.getElementById("erRoot") || document.getElementById("balanceRoot");
  if (!root) return;

  const rows = loadJournal(companyId, year);
  const saldo = computeBalancesFromJournal(rows);

  const user = localStorage.getItem(USER_KEY);
  const company = getSelectedCompany(user);
  if (!company) return;

  const groups = getSuccessGroups(company.legal, company.industry);
  const groupsHtml = groups.map(group => renderGroup(group, saldo)).join("");

  const allAccounts = groups.flatMap(g => g.accounts);

  const totalRevenue = allAccounts.reduce((sum, [no]) => {
    if (!isRevenueAccount(no)) return sum;
    return sum + Math.max(-Number(saldo[no] || 0), 0);
  }, 0);

  const totalExpense = allAccounts.reduce((sum, [no]) => {
    if (!isExpenseAccount(no)) return sum;
    return sum + Math.max(Number(saldo[no] || 0), 0);
  }, 0);

  const profit = totalRevenue - totalExpense;

  root.innerHTML = `
    <div class="balanceHeaderBlue">
      <div class="balanceTitle">Erfolgsrechnung ${year}</div>
      <div class="balanceSub">Beträge werden aus Buchungen berechnet (Start = 0)</div>
    </div>

    <div class="balanceSheet">
      <div class="balanceCol">
        <div class="balanceColTitle">Ertrag / Aufwand</div>
        ${groupsHtml}

        <div class="balanceTotal">
          <span>Total Ertrag</span>
          <span>${fmtCHF(totalRevenue)}</span>
        </div>

        <div class="balanceTotal">
          <span>Total Aufwand</span>
          <span>${fmtCHF(totalExpense)}</span>
        </div>

        <div class="balanceTotal">
          <span>Gewinn / Verlust</span>
          <span>${fmtCHF(profit)}</span>
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

  const years = getYears(company.id);
  currentYear = years[0];

  renderYearTabs(company.id);
  renderSuccess(company.id, currentYear);
});
