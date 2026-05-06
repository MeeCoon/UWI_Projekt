// js/bilanz.js
const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = "2024";

/* =========================
   AKTIVEN
========================= */
function getAssetGroups(industry) {
  const commonCurrentAssets = [
    ["1000", "Kasse"],
    ["1020", "Bankguthaben"],
    ["1170", "Vorsteuer MWST"],
    ["1176", "Guthaben Verrechnungssteuer"],
    ["1300", "Aktive Rechnungsabgrenzung"],
    ["1060", "Wertschriften (Aktien)"],
    ["1100", "Forderungen LL"]
  ];

  const commonFixedAssets = [
    ["1400", "Wertschriften (Obligationen)"],
    ["1480", "Beteiligungen"],
    ["1510", "Mobiliar"],
    ["1500", "Maschinen"],
    ["1530", "Fahrzeuge"],
    ["1600", "Liegenschaften"]
  ];

  return [
    { title: "Umlaufvermögen", accounts: [...commonCurrentAssets] },
    { title: "Anlagevermögen", accounts: [...commonFixedAssets] }
  ];
}

/* =========================
   PASSIVEN
========================= */
function getLiabilityGroups(legal) {
  return [
    {
      title: "Fremdkapital",
      accounts: [
        ["2000", "Verbindlichkeiten"],
        ["2100", "Bank"],
        ["2300", "Passive RA"]
      ]
    },
    {
      title: "Eigenkapital",
      accounts: [
        ["2800", "Kapital"],
        ["2970", "Gewinnvortrag"],
        ["2979", "Jahresgewinn"]
      ]
    }
  ];
}

/* =========================
   HELPER
========================= */
function loadJournal(companyId, year) {
  return JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]");
}

function saveJournal(companyId, year, rows) {
  localStorage.setItem(journalKey(companyId, year), JSON.stringify(rows));
}

const ACCOUNT_TYPES = {
  "1000": "asset","1020": "asset","1100": "asset","1300": "asset",
  "1400": "asset","1500": "asset","1510": "asset","1530": "asset","1600": "asset",

  "2000": "liability","2100": "liability","2300": "liability",

  "2800": "equity","2970": "equity","2979": "equity","2891": "equity",

  "3000": "revenue","3200": "revenue",
  "4000": "expense","5000": "expense"
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
   SALDO
========================= */
function computeBalancesFromJournal(rows) {
  const bal = {};

  for (const r of rows) {
    const debit = r.debit;
    const credit = r.credit;
    const amt = Number(r.amount || 0);

    if (debit) applyBooking(bal, debit, amt, true);
    if (credit) applyBooking(bal, credit, amt, false);
  }

  return bal;
}

/* =========================
   JAHRESABSCHLUSS FIX
========================= */
function closeYear(companyId, year) {
  const rows = loadJournal(companyId, year);
  const saldo = computeBalancesFromJournal(rows);

  let expense = 0;
  let revenue = 0;

  Object.keys(saldo).forEach(acc => {
    if (ACCOUNT_TYPES[acc] === "expense") expense += saldo[acc];
    if (ACCOUNT_TYPES[acc] === "revenue") revenue += saldo[acc];
  });

  const profit = revenue - expense;
  const nextYear = String(Number(year) + 1);
  const nextRows = loadJournal(companyId, nextYear);

  if (nextRows.some(r => r.system === `abschluss_${year}`)) {
    alert("Schon abgeschlossen");
    return;
  }

  const carryRows = [];

  /* === GEWINN BUCHEN === */
  if (profit !== 0) {
    carryRows.push({
      debit: profit < 0 ? "2979" : "3000",
      credit: profit > 0 ? "2979" : "4000",
      amount: Math.abs(profit),
      system: `abschluss_${year}`
    });
  }

  /* === BILANZ VORTRAG === */
  Object.keys(saldo).forEach(acc => {
    const type = ACCOUNT_TYPES[acc];
    if (!["asset","liability","equity"].includes(type)) return;

    const amount = saldo[acc];
    if (!amount) return;

    carryRows.push({
      debit: type === "asset" ? acc : "1020",
      credit: type === "asset" ? "1020" : acc,
      amount: Math.abs(amount),
      system: `abschluss_${year}`
    });
  });

  saveJournal(companyId, nextYear, [...nextRows, ...carryRows]);

  currentYear = nextYear;
  renderBalance(companyId, nextYear);
}

/* =========================
   BILANZ
========================= */
function renderBalance(companyId, year) {
  const root = document.getElementById("balanceRoot");

  const rows = loadJournal(companyId, year);
  const saldo = computeBalancesFromJournal(rows);

  /* === GEWINN DIREKT IN BILANZ === */
  let expense = 0;
  let revenue = 0;

  Object.keys(saldo).forEach(acc => {
    if (ACCOUNT_TYPES[acc] === "expense") expense += saldo[acc];
    if (ACCOUNT_TYPES[acc] === "revenue") revenue += saldo[acc];
  });

  const profit = revenue - expense;

  saldo["2979"] = profit;
  saldo["2891"] = profit;

  root.innerHTML = `
    <h2>Bilanz ${year}</h2>
    <pre>${JSON.stringify(saldo, null, 2)}</pre>
  `;
}

/* =========================
   START
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const companyId = "demo";
  renderBalance(companyId, currentYear);
});
