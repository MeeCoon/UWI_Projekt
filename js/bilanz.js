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
   AKTIVEN JE NACH BRANCHE
========================= */
function getAssetGroups(industry) {
  const commonCurrentAssets = [
    ["1000", "Kasse"],
    ["1020", "Bankguthaben"],
    ["1170", "Vorsteuer MWST"],
    ["1176", "Guthaben Verrechnungssteuer"],
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
      { title: "Umlaufvermögen", accounts: [...commonCurrentAssets, ["1200", "Handelswaren"]] },
      { title: "Anlagevermögen", accounts: [...commonFixedAssets] }
    ];
  }

  if (industry === "Produktion") {
    return [
      { title: "Umlaufvermögen", accounts: [...commonCurrentAssets, ["1210", "Rohstoffe"]] },
      { title: "Anlagevermögen", accounts: [...commonFixedAssets] }
    ];
  }

  if (industry === "Dienstleistung") {
    return [
      { title: "Umlaufvermögen", accounts: [...commonCurrentAssets] },
      {
        title: "Anlagevermögen",
        accounts: [...commonFixedAssets, ["1520", "Büromaschinen"], ["1700", "Patente, Lizenzen"]]
      }
    ];
  }

  return [
    { title: "Umlaufvermögen", accounts: [...commonCurrentAssets] },
    { title: "Anlagevermögen", accounts: [...commonFixedAssets] }
  ];
}

/* =========================
   PASSIVEN
========================= */
function getLiabilityGroups(legal) {
  const baseShort = {
    title: "Kurzfristiges Fremdkapital",
    accounts: [
      ["2000", "Verbindlichkeiten aus Lieferungen und Leistungen"],
      ["2100", "Bankverbindlichkeiten"],
      ["2200", "Geschuldete MWST"],
      ["2206", "Geschuldete Verrechnungssteuer"],
      ["2270", "Verbindlichkeiten Sozialversicherungen"],
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
        title: "Eigenkapital",
        accounts: [
          ["2800", "Eigenkapital"],
          ["2850", "Privat"],
          ["2891", "Jahresgewinn/-verlust"]
        ]
      }
    ];
  }

  if (legal === "GmbH" || legal === "AG") {
    return [
      baseShort,
      baseLong,
      {
        title: "Eigenkapital",
        accounts: [
          ["2800", "Kapital"],
          ["2950", "Gesetzliche Reserve"],
          ["2960", "Freiwillige Reserve"],
          ["2970", "Gewinnvortrag"],
          ["2979", "Jahresgewinn/-verlust"]
        ]
      }
    ];
  }

  return [baseShort, baseLong];
}

/* =========================
   HELPER
========================= */
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
  "1000":"asset","1020":"asset","1100":"asset",
  "2000":"liability","2100":"liability",
  "2800":"equity","2970":"equity","2979":"equity","2891":"equity",
  "3000":"revenue","4000":"expense"
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
  const saldo = computeBalancesFromJournal(loadJournal(companyId, year));
  const nextYear = String(Number(year) + 1);

  let nextRows = loadJournal(companyId, nextYear);

  const carryRows = [];

  Object.keys(saldo).forEach(acc => {
    const type = ACCOUNT_TYPES[acc];
    const amount = Number(saldo[acc] || 0);

    if (!amount) return;
    if (!["asset","liability","equity"].includes(type)) return;

    if (amount > 0) {
      carryRows.push({
        debit: type === "asset" ? acc : "1020",
        credit: type === "asset" ? "1020" : acc,
        amount: Math.abs(amount)
      });
    } else {
      carryRows.push({
        debit: type === "asset" ? "1020" : acc,
        credit: type === "asset" ? acc : "1020",
        amount: Math.abs(amount)
      });
    }
  });

  saveJournal(companyId, nextYear, [...nextRows, ...carryRows]);
}

/* =========================
   BILANZ
========================= */
function renderBalance(companyId, year) {
  const saldo = computeBalancesFromJournal(loadJournal(companyId, year));

  let expense = 0, revenue = 0;

  Object.keys(saldo).forEach(acc => {
    const type = ACCOUNT_TYPES[acc];
    const val = saldo[acc] || 0;
    if (type === "expense") expense += val;
    if (type === "revenue") revenue += val;
  });

  const profit = revenue - expense;

  // NUR ANZEIGE (kein echtes Buchen!)
  saldo["2979"] = profit;
  saldo["2891"] = profit;

  console.log("Bilanz:", saldo);
}
