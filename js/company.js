// js/company.js
const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (user) => `${COMPANIES_PREFIX}${user}`;
const currentCompanyKey = (user) => `${CURRENT_COMPANY_PREFIX}${user}`;

function getUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

function loadCompanies(user) {
  try {
    return JSON.parse(localStorage.getItem(companiesKey(user)) || "[]");
  } catch {
    return [];
  }
}

function getSelectedCompany(user) {
  const companyId = localStorage.getItem(currentCompanyKey(user));
  if (!companyId) return null;
  const companies = loadCompanies(user);
  return companies.find((c) => c.id === companyId) || null;
}

function fmtCHF(n) {
  const num = Number(n || 0);
  const s = Math.round(num).toString();
  const withApos = s.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${withApos} CHF`;
}

/* ---------- Years (pro Firma + Section) ---------- */
function yearsKey(companyId, section) {
  return `uwi_years_${companyId}_${section}`;
}
function getYears(companyId, section) {
  const raw = localStorage.getItem(yearsKey(companyId, section));
  try {
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) return arr.map(String);
  } catch {}
  return ["2024", "2025", "2026"];
}
function saveYears(companyId, section, years) {
  localStorage.setItem(yearsKey(companyId, section), JSON.stringify(years));
}

function showTab(tab) {
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"));
  document.getElementById(tab)?.classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.add("active");

  // render years for this tab
  renderYears(tab);
}

/* Render Year buttons inside the visible tab */
function renderYears(section) {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return;
  const company = getSelectedCompany(user);
  if (!company) return;

  const container = document.querySelector(`#${section} .yearTabs`);
  if (!container) return;

  const years = getYears(company.id, section);
  const current = container.dataset.currentYear || years[0];
  container.dataset.currentYear = current;

  container.innerHTML = `
    ${years.map(y => `<button type="button" class="yearBtn ${y===current?"active":""}" data-year="${y}">${y}</button>`).join("")}
    <button type="button" class="addYearBtn" data-action="add-year">+ Jahr hinzufügen</button>
  `;

  // hook content render per section
  if (section === "balance") renderBalance(current, company.id);
  if (section === "income") renderIncome(current, company.id);
}

/* Click handling via delegation (wichtig für neue Buttons!) */
document.addEventListener("click", (e) => {
  const tabBtn = e.target.closest(".tab-btn");
  if (tabBtn) {
    showTab(tabBtn.dataset.tab);
    return;
  }

  const yearBtn = e.target.closest(".yearBtn");
  if (yearBtn) {
    const section = document.querySelector(".tab-btn.active")?.dataset.tab || "balance";
    const container = document.querySelector(`#${section} .yearTabs`);
    if (!container) return;
    container.dataset.currentYear = yearBtn.dataset.year;
    renderYears(section);
    return;
  }

  const addBtn = e.target.closest(".addYearBtn");
  if (addBtn) {
    const section = document.querySelector(".tab-btn.active")?.dataset.tab || "balance";
    const user = localStorage.getItem(USER_KEY);
    if (!user) return;
    const company = getSelectedCompany(user);
    if (!company) return;

    const input = prompt("Jahr eingeben (z.B. 2027):");
    if (!input) return;
    const year = input.trim();

    const valid = /^\d{4}$/.test(year) && Number(year) >= 2000 && Number(year) <= 2100;
    if (!valid) return alert("Bitte ein gültiges Jahr (2000–2100) eingeben.");

    const years = getYears(company.id, section);
    if (years.includes(year)) return alert("Dieses Jahr gibt es schon.");

    years.push(year);
    years.sort();
    saveYears(company.id, section, years);

    const container = document.querySelector(`#${section} .yearTabs`);
    if (container) container.dataset.currentYear = year;
    renderYears(section);
  }
});

/* ---------- Minimal Demo: Bilanz/Income Inhalt ---------- */
/* Du kannst das später erweitern (Inputs, speichern etc.). */
function renderBalance(year, companyId) {
  const area = document.getElementById("balanceArea");
  if (!area) return;
  area.innerHTML = `
    <h3>Bilanz ${year}</h3>
    <div class="muted small">Hier kommt deine Bilanz-UI rein (Startwerte 0).</div>
  `;
}

function renderIncome(year, companyId) {
  const area = document.getElementById("incomeArea");
  if (!area) return;
  area.innerHTML = `
    <h3>Erfolgsrechnung ${year}</h3>
    <div class="muted small">Hier kommt deine Erfolgsrechnung-UI rein (Startwerte 0).</div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  document.getElementById("backBtn")?.addEventListener("click", () => {
    window.location.href = "overview.html";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  });

  const company = getSelectedCompany(user);
  if (!company) {
    alert("Keine Firma ausgewählt.");
    window.location.href = "overview.html";
    return;
  }

  document.getElementById("companyTitle").textContent = company.name || "Firma";
  const legal = company.legalForm || company.legal || "–";
  const industry = company.industry || "–";
  const capital = (company.startCapital ?? company.capital ?? 0);
  const emp = (company.employees ?? company.size ?? 0);
  document.getElementById("companyMeta").textContent =
    `${legal} · ${industry} · Startkapital: ${fmtCHF(capital)} · Mitarbeitende: ${emp}`;

  // Start tab
  showTab("balance");
});
