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
   AKTIVEN
========================= */
function getAssetGroups(industry) {

  const current = [
    ["1000", "Kasse"],
    ["1020", "Bank"],
    ["1060", "Wertschriften (Aktien)"],
    ["1100", "Forderungen"],
    ["1170", "Vorsteuer MWST"],
    ["1300", "Aktive Rechnungsabgrenzung"]
  ];

  const fixed = [
    ["1400", "Wertschriften (Obligationen)"],
    ["1480", "Beteiligungen"],
    ["1500", "Maschinen"],
    ["1510", "Mobiliar"],
    ["1530", "Fahrzeuge"],
    ["1600", "Liegenschaften"]
  ];

  if (industry === "Handel") {
    return [
      {
        title: "Umlaufvermögen",
        accounts: [...current, ["1200", "Handelswaren"]]
      },
      {
        title: "Anlagevermögen",
        accounts: fixed
      }
    ];
  }

  if (industry === "Produktion") {
    return [
      {
        title: "Umlaufvermögen",
        accounts: [...current, ["1210", "Rohstoffe"]]
      },
      {
        title: "Anlagevermögen",
        accounts: fixed
      }
    ];
  }

  return [
    {
      title: "Umlaufvermögen",
      accounts: current
    },
    {
      title: "Anlagevermögen",
      accounts: fixed
    }
  ];
}

/* =========================
   PASSIVEN
========================= */
function getLiabilityGroups(legal) {

  const shortTerm = {
    title: "Kurzfristiges Fremdkapital",
    accounts: [
      ["2000", "Verbindlichkeiten"],
      ["2100", "Bankverbindlichkeiten"],
      ["2200", "Geschuldete MWST"],
      ["2300", "Passive Rechnungsabgrenzung"]
    ]
  };

  const longTerm = {
    title: "Langfristiges Fremdkapital",
    accounts: [
      ["2450", "Darlehen"],
      ["2451", "Hypotheken"],
      ["2600", "Rückstellungen"]
    ]
  };

  if (legal === "Einzelunternehmen") {
    return [
      shortTerm,
      longTerm,
      {
        title: "Eigenkapital",
        accounts: [
          ["2800", "Eigenkapital"],
          ["2850", "Privat"],
          ["2979", "Jahresgewinn / Verlust"]
        ]
      }
    ];
  }

  if (legal === "GmbH") {
    return [
      shortTerm,
      longTerm,
      {
        title: "Eigenkapital GmbH",
        accounts: [
          ["2800", "Stammkapital"],
          ["2950", "Reserven"],
          ["2970", "Gewinnvortrag"],
          ["2979", "Jahresgewinn / Verlust"]
        ]
      }
    ];
  }

  if (legal === "AG") {
    return [
      shortTerm,
      longTerm,
      {
        title: "Eigenkapital AG",
        accounts: [
          ["2800", "Aktienkapital"],
          ["2950", "Reserven"],
          ["2970", "Gewinnvortrag"],
          ["2979", "Jahresgewinn / Verlust"]
        ]
      }
    ];
  }

  return [shortTerm, longTerm];
}

/* =========================
   SALDO BERECHNUNG
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
   RENDER
========================= */
function renderGroup(group, saldo, isAsset) {
  return `
    <div class="balanceBlockTitle">${group.title}</div>
    ${group.accounts.map(([no, name]) => {
      const raw = Number(saldo[no] || 0);

      const value = isAsset
        ? Math.max(raw, 0)
        : Math.max(-raw, 0);

      return `
        <div class="balanceRow">
          <span>${no} ${name}</span>
          <input class="balanceInput" value="${value}" readonly>
        </div>
      `;
    }).join("")}
  `;
}

/* =========================
   BILANZ
========================= */
function renderBalance(companyId, year) {

  const root = document.getElementById("balanceRoot");
  if (!root) return;

  const rows = JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]");
  const saldo = computeBalancesFromJournal(rows);

  const user = localStorage.getItem(USER_KEY);
  const company = JSON.parse(localStorage.getItem(companiesKey(user)) || "[]")
    .find(c => c.id === companyId);

  if (!company) return;

  const assets = getAssetGroups(company.industry);
  const liabilities = getLiabilityGroups(company.legal);

  const totalA = assets.flatMap(g => g.accounts)
    .reduce((s, [no]) => s + Math.max(saldo[no] || 0, 0), 0);

  const totalP = liabilities.flatMap(g => g.accounts)
    .reduce((s, [no]) => s + Math.max(-(saldo[no] || 0), 0), 0);

  root.innerHTML = `
    <div class="balanceHeaderBlue">
      <div class="balanceTitle">Bilanz ${year}</div>
    </div>

    <div class="balanceSheet">

      <div class="balanceCol">
        <div class="balanceColTitle">Aktiven</div>
        ${assets.map(g => renderGroup(g, saldo, true)).join("")}
        <div class="balanceTotal">${totalA} CHF</div>
      </div>

      <div class="balanceCol">
        <div class="balanceColTitle">Passiven</div>
        ${liabilities.map(g => renderGroup(g, saldo, false)).join("")}
        <div class="balanceTotal">${totalP} CHF</div>
      </div>

    </div>
  `;
}

/* =========================
   START
========================= */
document.addEventListener("DOMContentLoaded", () => {

  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const companyId = localStorage.getItem(currentCompanyKey(user));
  if (!companyId) {
    window.location.href = "overview.html";
    return;
  }

  renderBalance(companyId, currentYear);
});
