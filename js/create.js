// js/create.js
const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}_balance`;

const DEFAULT_YEAR = "2024";

function loadCompanies(user) {
  try {
    return JSON.parse(localStorage.getItem(companiesKey(user)) || "[]");
  } catch {
    return [];
  }
}

function saveCompanies(user, companies) {
  localStorage.setItem(companiesKey(user), JSON.stringify(companies));
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

function ensureYears(companyId) {
  try {
    const raw = localStorage.getItem(yearsKey(companyId));
    const arr = raw ? JSON.parse(raw) : null;

    if (Array.isArray(arr) && arr.length) return;
  } catch {}

  localStorage.setItem(yearsKey(companyId), JSON.stringify(["2024", "2025", "2026"]));
}

function minCapital(legal) {
  if (legal === "AG") return 100000;
  if (legal === "GmbH") return 20000;
  return 0;
}

function getEquityLabel(legal) {
  if (legal === "AG") return "Aktienkapital";
  if (legal === "GmbH") return "Stammkapital";
  return "Eigenkapital";
}

function createStartCapitalBooking(company) {
  const capital = Number(company.capital || 0);

  if (!(capital > 0)) return;

  const year = DEFAULT_YEAR;
  const rows = loadJournal(company.id, year);

  const alreadyExists = rows.some(r => r && r.isStartCapital === true);
  if (alreadyExists) return;

  const entry = {
    id: `start_${company.id}`,
    fact: `Startkapital für ${company.name}`,
    sollName: "Bank",
    habenName: getEquityLabel(company.legal),
    debit: "1020",
    credit: "2800",
    amount: capital,
    year,
    date: new Date().toISOString(),
    isStartCapital: true
  };

  rows.push(entry);
  saveJournal(company.id, year, rows);
}

document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  document.getElementById("backOverviewBtn").onclick = () => {
    window.location.href = "overview.html";
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  };

  const cancelBtn = document.getElementById("cancelBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      window.location.href = "overview.html";
    };
  }

  const form = document.getElementById("createForm");
  const legalEl = document.getElementById("legal");
  const capitalEl = document.getElementById("capital");
  const hint = document.getElementById("capitalHint");

  function updateCapitalRule() {
    const legal = legalEl.value;
    const min = minCapital(legal);

    if (legal === "AG") {
      hint.textContent = "AG benötigt mindestens 100'000 CHF Startkapital";
    } else if (legal === "GmbH") {
      hint.textContent = "GmbH benötigt mindestens 20'000 CHF Startkapital";
    } else {
      hint.textContent = "Einzelunternehmen hat kein Mindestkapital";
    }

    capitalEl.min = min;

    if (Number(capitalEl.value) < min) {
      capitalEl.value = min;
    }
  }

  legalEl.addEventListener("change", updateCapitalRule);
  updateCapitalRule();

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const legal = legalEl.value;
    const capital = Number(capitalEl.value || 0);
    const industry = document.getElementById("industry").value;
    const purpose = document.getElementById("purpose").value;
    const size = Number(document.getElementById("size").value || 1);

    if (!name) {
      alert("Firmenname fehlt");
      return;
    }

    const min = minCapital(legal);
    if (capital < min) {
      alert(`Startkapital zu klein. Minimum für ${legal}: ${min} CHF`);
      return;
    }

    const companies = loadCompanies(user);

    const company = {
      id: `c_${Date.now()}`,
      name,
      legal,
      capital,
      industry,
      purpose,
      size,
      createdAt: new Date().toISOString()
    };

    companies.unshift(company);
    saveCompanies(user, companies);

    localStorage.setItem(currentCompanyKey(user), company.id);

    ensureYears(company.id);
    createStartCapitalBooking(company);

    alert("Firma erstellt");
    window.location.href = "overview.html";
  });
});
