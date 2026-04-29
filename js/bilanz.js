// js/bilanz.js
const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${cid}_balance`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = "2024";

/* =========================
   AKTIVEN JE NACH BRANCHE
========================= */
function getAssetGroups(industry) {
  const commonCurrentAssets = [
    ["1000", "Kasse"],
    ["1020", "Bankguthaben"],
    ["1170", "Vorsteuer MWST"],
    ["1300", "Aktive Rechnungsabgrenzung"],
    ["1060", "Wertschriften (Aktien)"],
    ["1100", "Forderungen aus Lieferungen und Leistungen"]
  ];

  const commonFixedAssets = [
    ["1400", "Wertschriften (Obligationen)"],
    ["1480", "Beteiligungen"],
    ["1510", "Mobiliar und Einrichtungen"],
    ["1500", "Maschinen und Apparate"],
    ["1530", "Fahrzeuge"],
    ["1600", "Geschäftsliegenschaften"]
  ];

  if (industry === "Handel") {
    return [
      {
        title: "Umlaufvermögen",
        accounts: [
          ...commonCurrentAssets,
          ["1200", "Handelswaren"]
        ]
      },
      {
        title: "Anlagevermögen",
        accounts: [...commonFixedAssets]
      }
    ];
  }

  if (industry === "Produktion") {
    return [
      {
        title: "Umlaufvermögen",
        accounts: [
          ...commonCurrentAssets,
          ["1210", "Rohstoffe"]
        ]
      },
      {
        title: "Anlagevermögen",
        accounts: [...commonFixedAssets]
      }
    ];
  }

  if (industry === "Dienstleistung") {
    return [
      {
        title: "Umlaufvermögen",
        accounts: [...commonCurrentAssets]
      },
      {
        title: "Anlagevermögen",
        accounts: [
          ...commonFixedAssets,
          ["1520", "Büromaschinen"],
          ["1700", "Patente, Lizenzen"]
        ]
      }
    ];
  }

  return [
    {
      title: "Umlaufvermögen",
      accounts: [...commonCurrentAssets]
    },
    {
      title: "Anlagevermögen",
      accounts: [...commonFixedAssets]
    }
  ];
}

/* =========================
   PASSIVEN JE NACH RECHTSFORM
========================= */
function getLiabilityGroups(legal) {
  const baseShort = {
    title: "Kurzfristiges Fremdkapital",
    accounts: [
      ["2000", "Verbindlichkeiten aus Lieferungen und Leistungen"],
      ["2270", "Verbindlichkeiten Sozialversicherungen"],
      ["2100", "Bankverbindlichkeiten"],
      ["2200", "Geschuldete MWST"],
      ["2300", "Passive Rechnungsabgrenzungen"]
    ]
  };

  const baseLong = {
    title: "Langfristiges Fremdkapital",
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
        title: "Eigenkapital Einzelunternehmen",
        accounts: [
          ["2800", "Eigenkapital"],
          ["2850", "Privat"],
          ["2891", "Jahresgewinn oder Jahresverlust"]
        ]
      }
    ];
  }

   if (legal === "GmbH") {
     return [
       {
         title: "Kurzfristiges Fremdkapital",
         accounts: [
           ["2000", "Verbindlichkeiten aus Lieferungen und Leistungen"],
           ["2270", "Verbindlichkeiten Sozialversicherungen"],
           ["2100", "Bankverbindlichkeiten"],
           ["2200", "Geschuldete MWST"],
           ["2300", "Passive Rechnungsabgrenzungen"],
           ["2261", "Beschlossene Ausschüttungen"] // ✅ hierhin verschieben
         ]
       },
       baseLong,
       {
         title: "Eigenkapital GmbH",
         accounts: [
           ["2800", "Stammkapital"],
           ["2950", "Gesetzliche Gewinnreserve"],
           ["2960", "Freiwillige Gewinnreserven"],
           ["2970", "Gewinnvortrag / Verlustvortrag"],
           ["2979", "Jahresgewinn oder Jahresverlust"]
         ]
       }
     ];
   }
   
   if (legal === "AG") {
     return [
       {
         title: "Kurzfristiges Fremdkapital",
         accounts: [
           ["2000", "Verbindlichkeiten aus Lieferungen und Leistungen"],
           ["2270", "Verbindlichkeiten Sozialversicherungen"],
           ["2100", "Bankverbindlichkeiten"],
           ["2200", "Geschuldete MWST"],
           ["2300", "Passive Rechnungsabgrenzungen"],
           ["2261", "Beschlossene Ausschüttungen"] // ✅ korrekt hier
         ]
       },
       baseLong,
       {
         title: "Eigenkapital Aktiengesellschaft",
         accounts: [
           ["2800", "Aktienkapital"],
           ["2950", "Gesetzliche Gewinnreserve"],
           ["2960", "Freiwillige Gewinnreserven"],
           ["2970", "Gewinnvortrag / Verlustvortrag"],
           ["2979", "Jahresgewinn oder Jahresverlust"]
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

function saveJournal(companyId, year, rows) {
  localStorage.setItem(journalKey(companyId, year), JSON.stringify(rows));
}

const ACCOUNT_TYPES = {
  "1000": "asset", "1020": "asset", "1060": "asset", "1100": "asset", "1170": "asset", "1200": "asset", "1210": "asset", "1300": "asset",
  "1400": "asset", "1480": "asset", "1500": "asset", "1510": "asset", "1520": "asset", "1530": "asset", "1600": "asset", "1700": "asset",

  "2000": "liability", "2100": "liability", "2200": "liability", "2261": "liability", "2270": "liability", "2300": "liability",
  "2450": "liability", "2451": "liability", "2600": "liability",

  "2800": "equity", "2850": "equity", "2950": "equity", "2960": "equity", "2970": "equity", "2979": "equity", "2891": "equity",

  "3000": "revenue", "3200": "revenue", "3400": "revenue", "3805": "revenue", "6950": "revenue", "7500": "revenue", "8510": "revenue",

  "4000": "expense", "4200": "expense", "5000": "expense", "5700": "expense", "5800": "expense",
  "6000": "expense", "6100": "expense", "6200": "expense", "6300": "expense", "6400": "expense",
  "6500": "expense", "6600": "expense", "6700": "expense", "6800": "expense", "6900": "expense",
  "7510": "expense", "8500": "expense"
};

function applyBooking(balance, account, amount, isDebit) {
  const type = ACCOUNT_TYPES[account] || "asset";

  if (type === "asset" || type === "expense") {
    balance[account] = (balance[account] || 0) + (isDebit ? amount : -amount);
  } else {
    balance[account] = (balance[account] || 0) + (isDebit ? -amount : amount);
  }
}

/* =========================
   SALDO BERECHNEN
========================= */
function computeBalancesFromJournal(rows) {
  const bal = {};

  for (const r of rows) {
    if (r.type === "split") {
      for (const d of r.debits || []) {
        const acc = String(d.accountNo || "");
        const amt = Number(d.amount || 0);
        if (!acc || !(amt > 0)) continue;
        applyBooking(bal, acc, amt, true);
      }

      for (const c of r.credits || []) {
        const acc = String(c.accountNo || "");
        const amt = Number(c.amount || 0);
        if (!acc || !(amt > 0)) continue;
        applyBooking(bal, acc, amt, false);
      }

      continue;
    }

    const debit = String(r.debit || "");
    const credit = String(r.credit || "");
    const amt = Number(r.amount || 0);

    if (debit && amt > 0) applyBooking(bal, debit, amt, true);
    if (credit && amt > 0) applyBooking(bal, credit, amt, false);
  }

  return bal;
}

/* =========================
   JAHRESABSCHLUSS
========================= */
function closeYear(companyId, year) {
  const currentRows = loadJournal(companyId, year);
  const saldo = computeBalancesFromJournal(currentRows);
  const nextYear = String(Number(year) + 1);

  const years = getYears(companyId);
  if (!years.includes(nextYear)) {
    years.push(nextYear);
    years.sort();
    saveYears(companyId, years);
  }

  const nextRows = loadJournal(companyId, nextYear);
  const alreadyClosed = nextRows.some(r => r && r.system === `abschluss_${year}`);

  if (alreadyClosed) {
    alert(`Jahresabschluss für ${year} wurde schon gemacht.`);
    return;
  }

  const carryRows = [];

  Object.keys(saldo).forEach((acc) => {
    const type = ACCOUNT_TYPES[acc];
    const amount = Number(saldo[acc] || 0);

    if (!amount) return;
    if (!(type === "asset" || type === "liability" || type === "equity")) return;

    if (type === "asset") {
      if (amount > 0) {
        carryRows.push({
          debit: acc,
          credit: "2800",
          amount: Math.abs(amount),
          fact: `Vortrag ${year} → ${nextYear}`,
          year: nextYear,
          date: new Date().toISOString(),
          system: `abschluss_${year}`
        });
      }
    } else {
      carryRows.push({
        debit: "1020",
        credit: acc,
        amount: Math.abs(amount),
        fact: `Vortrag ${year} → ${nextYear}`,
        year: nextYear,
        date: new Date().toISOString(),
        system: `abschluss_${year}`
      });
    }
  });

  const cleanedNextRows = nextRows.filter(r => r.system !== `abschluss_${year}`);
  saveJournal(companyId, nextYear, [...cleanedNextRows, ...carryRows]);

  currentYear = nextYear;
  renderYearTabs(companyId);
  renderBalance(companyId, currentYear);

  alert(`Jahresabschluss von ${year} nach ${nextYear} erstellt.`);
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
      <button class="addYearBtn" id="closeYearBtn" type="button">Jahresabschluss</button>
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

    const closeBtn = e.target.closest("#closeYearBtn");
    if (closeBtn) {
      if (!confirm(`Jahr ${currentYear} abschliessen und Bilanzwerte ins nächste Jahr übernehmen?`)) {
        return;
      }
      closeYear(companyId, currentYear);
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
      <input
        class="balanceInput input-readonly"
        type="number"
        value="${value}"
        readonly
      >
    </div>
  `;
}

function renderGroup(group, saldo) {
  const rowsHtml = group.accounts.map(([no, name]) => {
    const type = ACCOUNT_TYPES[no] || "asset";
    const raw = Number(saldo[no] || 0);

    let value = raw;
    if (type === "liability" || type === "equity") {
      value = Math.abs(raw);
    } else {
      value = Math.max(raw, 0);
    }

    return renderAccountRow(no, name, value);
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

  const assetGroups = getAssetGroups(company.industry);
  const liabilityGroups = getLiabilityGroups(company.legal);

  const assetHtml = assetGroups.map(group => renderGroup(group, saldo)).join("");
  const liabilityHtml = liabilityGroups.map(group => renderGroup(group, saldo)).join("");

  const totalAssets = assetGroups.flatMap(g => g.accounts).reduce((sum, [no]) => {
    const raw = Number(saldo[no] || 0);
    return sum + Math.max(raw, 0);
  }, 0);

  const totalLiabilities = liabilityGroups.flatMap(g => g.accounts).reduce((sum, [no]) => {
    const raw = Number(saldo[no] || 0);
    return sum + Math.abs(raw);
  }, 0);

  root.innerHTML = `
    <div class="balanceHeaderBlue">
      <div class="balanceTitle">Bilanz ${year}</div>
      <div class="balanceSub">Beträge werden aus Buchungen berechnet</div>
    </div>

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
  renderBalance(company.id, currentYear);
});
