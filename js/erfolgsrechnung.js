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
   NORMALISIERUNG
========================= */
function normalizeIndustry(industryRaw) {
  const industry = String(industryRaw || "").trim().toLowerCase();

  if (industry.includes("handel")) return "Handel";
  if (industry.includes("produktion")) return "Produktion";
  if (industry.includes("dienst")) return "Dienstleistung";

  return String(industryRaw || "").trim();
}

function normalizeLegal(legalRaw) {
  const legal = String(legalRaw || "").trim().toLowerCase();

  if (legal.includes("einzel")) return "Einzelunternehmen";
  if (legal.includes("gmbh")) return "GmbH";
  if (legal === "ag" || legal.includes("aktien")) return "AG";

  return String(legalRaw || "").trim();
}

/* =========================
   LAYOUT JE NACH BRANCHE / RECHTSFORM
========================= */
function getSuccessLayout(legalRaw, industryRaw) {
  const legal = normalizeLegal(legalRaw);
  const industry = normalizeIndustry(industryRaw);

  const expenseGroups = [];
  const revenueGroups = [];

  if (industry === "Handel") {
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

  if (industry === "Produktion") {
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

  if (industry === "Dienstleistung") {
    expenseGroups.push({
      title: "Dienstleistungsaufwand",
      accounts: [
        ["4900", "Büroaufwand"]
      ]
    });

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

  if (legal === "GmbH") {
    expenseGroups.push({
      title: "Rechtsformbezogene Konten",
      accounts: [
        ["6955", "Kapitalaufwand GmbH"]
      ]
    });
  }

  if (legal === "AG") {
    expenseGroups.push({
      title: "Rechtsformbezogene Konten",
      accounts: [
        ["6960", "Kapitalaufwand AG"]
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

const ACCOUNT_TYPES = {
  "1000":"asset","1020":"asset","1060":"asset","1100":"asset","1170":"asset","1200":"asset","1210":"asset","1300":"asset",
  "1400":"asset","1480":"asset","1500":"asset","1510":"asset","1520":"asset","1530":"asset","1600":"asset","1700":"asset",

  "2000":"liability","2100":"liability","2200":"liability","2300":"liability",
  "2450":"liability","2451":"liability","2600":"liability",

  "2800":"equity","2850":"equity","2950":"equity","2970":"equity","2979":"equity",

  "4000":"expense","4200":"expense","5000":"expense","5700":"expense","5800":"expense",
  "6000":"expense","6100":"expense","6200":"expense","6300":"expense","6400":"expense",
  "6500":"expense","6600":"expense","6700":"expense","6800":"expense","6900":"expense",
  "7510":"expense","8500":"expense",

  "3000":"revenue","3200":"revenue","3400":"revenue","3805":"revenue",
  "6950":"revenue","7500":"revenue","8510":"revenue"
};

function applyBooking(balance, account, amount, isDebit) {
  const type = ACCOUNT_TYPES[account] || "asset";

  if (type === "asset" || type === "expense") {
    balance[account] = (balance[account] || 0) + (isDebit ? amount : -amount);
  } else {
    balance[account] = (balance[account] || 0) + (isDebit ? -amount : amount);
  }
}

function computeBalancesFromJournal(rows) {
  const bal = {};

  for (const r of rows) {

    if (r.type === "split") {

      for (const d of r.debits || []) {
        const acc = String(d.accountNo);
        const amt = Number(d.amount || 0);
        if (!acc || !(amt > 0)) continue;

        applyBooking(bal, acc, amt, true);
      }

      for (const c of r.credits || []) {
        const acc = String(c.accountNo);
        const amt = Number(c.amount || 0);
        if (!acc || !(amt > 0)) continue;

        applyBooking(bal, acc, amt, false);
      }

      continue;
    }
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
        disabled
        tabindex="-1"
      >
    </div>
  `;
}

function renderGroup(group, saldo, type) {
  const rowsHtml = group.accounts.map(([no, name]) => {
    const raw = Number(saldo[no] || 0);
    const shown = raw;

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
    return sum + Number(saldo[no] || 0);
  }, 0);

  const totalRevenue = allRevenueAccounts.reduce((sum, [no]) => {
    return sum + Number(saldo[no] || 0);
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

    <div class="balanceActions">
      <span class="muted">
        <strong>Jahresergebnis:</strong>
        <span>${fmtCHF(profit)}</span>
      </span>
      <span class="muted small" style="margin-left:auto;">
        Buchungen im Jahr: <b>${rows.length}</b>
      </span>
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
      window.location.href = "overview.html";
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
