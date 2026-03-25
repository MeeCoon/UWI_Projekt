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

/* =========================
   GRUPPEN JE NACH BRANCHE / RECHTSFORM
========================= */
function getSuccessLayout(legal, industryRaw) {
  const industry = (industryRaw || "").toLowerCase().trim();

  const expenseGroups = [];
  const revenueGroups = [];

  if (industry.includes("handel")) {
    expenseGroups.push({
      title: "Material & Handelswarenaufwand",
      accounts: [
        ["4200", "Handelswarenaufwand (Warenaufwand)"]
      ]
    });

    revenueGroups.push({
      title: "Betriebsertrag",
      accounts: [
        ["3200", "Handelserlöse (Warenertrag)"]
      ]
    });
  }

  if (industry.includes("produktion")) {
    expenseGroups.push({
      title: "Materialaufwand",
      accounts: [
        ["4000", "Materialaufwand"]
      ]
    });

    revenueGroups.push({
      title: "Betriebsertrag",
      accounts: [
        ["3000", "Produktionserlöse"]
      ]
    });
  }

  if (industry.includes("dienst")) {
    revenueGroups.push({
      title: "Betriebsertrag",
      accounts: [
        ["3400", "Dienstleistungserlöse"]
      ]
    });
  }

  expenseGroups.push(
    {
      title: "Personalaufwand",
      accounts: [
        ["5000", "Lohnaufwand"],
        ["5700", "Sozialversicherungsaufwand"],
        ["5800", "Übriger Personalaufwand"]
      ]
    },
    {
      title: "Übriger betrieblicher Aufwand",
      accounts: [
        ["6000", "Raumaufwand"],
        ["6100", "Unterhalt, Reparaturen, Ersatz (URE)"],
        ["6200", "Fahrzeugaufwand"],
        ["6300", "Versicherungsaufwand"],
        ["6400", "Energie- & Entsorgungsaufwand"],
        ["6500", "Verwaltungsaufwand"],
        ["6600", "Werbeaufwand"],
        ["6700", "Sonstiger Betriebsaufwand"],
        ["6800", "Abschreibungen"],
        ["6900", "Finanzaufwand"]
      ]
    },
    {
      title: "Nebenaufwand",
      accounts: [
        ["7510", "Aufwand betriebliche Liegenschaft"],
        ["8500", "Ausserordentlicher Aufwand"]
      ]
    }
  );

  revenueGroups.push(
    {
      title: "Andere Erträge",
      accounts: [
        ["3805", "Verluste aus Forderungen"],
        ["6950", "Finanzertrag"]
      ]
    },
    {
      title: "Nebenertrag",
      accounts: [
        ["7500", "Ertrag betriebliche Liegenschaft"],
        ["8510", "Ausserordentlicher Ertrag"]
      ]
    }
  );

  if (legal === "AG") {
    expenseGroups.push({
      title: "Rechtsformbezogene Konten",
      accounts: [
        ["6960", "Kapitalaufwand AG"]
      ]
    });
  }

  if (legal === "GmbH") {
    expenseGroups.push({
      title: "Rechtsformbezogene Konten",
      accounts: [
        ["6955", "Kapitalaufwand GmbH"]
      ]
    });
  }

  return { expenseGroups, revenueGroups };
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
      <span class="balanceValue">${value}</span>
    </div>
  `;
}

function renderGroup(group, saldo, type) {
  const rowsHtml = group.accounts.map(([no, name]) => {
    const raw = Number(saldo[no] || 0);
    let shown = 0;

    if (type === "revenue") {
      shown = Math.max(-raw, 0);
    } else {
      shown = Math.max(raw, 0);
    }

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
  const root =
    document.getElementById("successRoot") ||
    document.getElementById("erRoot") ||
    document.getElementById("balanceRoot");

  if (!root) return;

  const rows = loadJournal(companyId, year);
  const saldo = computeBalancesFromJournal(rows);

  const user = localStorage.getItem(USER_KEY);
  const company = getSelectedCompany(user);
  if (!company) return;

  const { expenseGroups, revenueGroups } = getSuccessLayout(company.legal, company.industry);

  const expenseHtml = expenseGroups.map(group => renderGroup(group, saldo, "expense")).join("");
  const revenueHtml = revenueGroups.map(group => renderGroup(group, saldo, "revenue")).join("");

  const allExpenseAccounts = expenseGroups.flatMap(g => g.accounts);
  const allRevenueAccounts = revenueGroups.flatMap(g => g.accounts);

  const totalExpense = allExpenseAccounts.reduce((sum, [no]) => {
    return sum + Math.max(Number(saldo[no] || 0), 0);
  }, 0);

  const totalRevenue = allRevenueAccounts.reduce((sum, [no]) => {
    return sum + Math.max(-Number(saldo[no] || 0), 0);
  }, 0);

  const profit = totalRevenue - totalExpense;

  root.innerHTML = `
    <div class="balanceHeaderBlue">
      <div class="balanceTitle">Erfolgsrechnung ${year}</div>
      <div class="balanceSub">Beträge werden aus Buchungen berechnet (Start = 0)</div>
    </div>

    <div class="balanceSheet">
      <div class="balanceCol">
        <div class="balanceColTitle">Aufwand</div>
        ${expenseHtml}
        <div class="balanceTotal">
          <span>Total Aufwand</span>
          <span>${fmtCHF(totalExpense)}</span>
        </div>
      </div>

      <div class="balanceDivider"></div>

      <div class="balanceCol">
        <div class="balanceColTitle">Ertrag</div>
        ${revenueHtml}
        <div class="balanceTotal">
          <span>Total Ertrag</span>
          <span>${fmtCHF(totalRevenue)}</span>
        </div>
      </div>
    </div>

    <div class="muted small" style="margin-top:12px; display:flex; justify-content:space-between;">
      <span>Jahresergebnis: ${fmtCHF(profit)}</span>
      <span>Buchungen im Jahr: ${rows.length}</span>
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
