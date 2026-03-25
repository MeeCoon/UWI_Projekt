// js/bookings.js
console.log("✅ bookings.js geladen");

const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const COMPANIES_PREFIX = "uwi_companies_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = DEFAULT_YEARS[0];

// Kontonamen → Kontonummern
const ACCOUNT_MAP = {
  "Bank": "1020",
  "Kasse": "1000",
  "Debitoren": "1100",
  "Mobiliar": "1500",
  "Verbindlichkeiten": "2000",
  "Eigenkapital": "2800",
  "Umsatz": "3400"
};

function loadCompanies(u) {
  try {
    return JSON.parse(localStorage.getItem(companiesKey(u)) || "[]");
  } catch {
    return [];
  }
}

function getYears(companyId) {
  try {
    const arr = JSON.parse(localStorage.getItem(yearsKey(companyId)) || "null");
    if (Array.isArray(arr) && arr.length) return arr.map(String);
  } catch {}
  return [...DEFAULT_YEARS];
}

function saveYears(companyId, years) {
  localStorage.setItem(yearsKey(companyId), JSON.stringify(years.map(String)));
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

function loadTable(companyId) {
  const tableBody = document.getElementById("bookingTableBody");
  if (!tableBody) return;

  const rows = loadJournal(companyId, currentYear);
  tableBody.innerHTML = "";

  rows.forEach((r, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${r.fact || ""}</td>
      <td>${r.sollName || ""}</td>
      <td>${r.habenName || ""}</td>
      <td>${r.amount || 0}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderYearTabs(companyId) {
  const el = document.getElementById("yearTabs");
  if (!el) return;

  const years = getYears(companyId);
  if (!years.includes(currentYear)) currentYear = years[0];

  el.innerHTML =
    years.map(y => `
      <button type="button" class="yearBtn ${y === currentYear ? "active" : ""}" data-year="${y}">
        ${y}
      </button>
    `).join("") +
    `
      <button type="button" class="addYearBtn" id="addYearBtn">+ Jahr hinzufügen</button>
      <button type="button" class="addYearBtn" id="deleteYearBtn">🗑 Jahr löschen</button>
    `;

  el.onclick = (e) => {
    const yearBtn = e.target.closest(".yearBtn");
    if (yearBtn) {
      currentYear = yearBtn.dataset.year;
      renderYearTabs(companyId);
      loadTable(companyId);
      return;
    }

    const addBtn = e.target.closest("#addYearBtn");
    if (addBtn) {
      const y = prompt("Jahr eingeben (z.B. 2027):")?.trim();
      if (!y) return;

      if (!/^\d{4}$/.test(y) || +y < 2000 || +y > 2100) {
        alert("Ungültiges Jahr (2000–2100).");
        return;
      }

      const next = getYears(companyId);
      if (next.includes(y)) {
        alert("Dieses Jahr gibt es schon.");
        return;
      }

      next.push(y);
      next.sort();
      saveYears(companyId, next);

      currentYear = y;
      renderYearTabs(companyId);
      loadTable(companyId);
      return;
    }

    const deleteBtn = e.target.closest("#deleteYearBtn");
    if (deleteBtn) {
      const yearsNow = getYears(companyId);

      if (yearsNow.length <= 1) {
        alert("Mindestens ein Jahr muss bleiben.");
        return;
      }

      if (!confirm(`Jahr ${currentYear} wirklich löschen?`)) {
        return;
      }

      const next = yearsNow.filter(y => y !== currentYear);
      saveYears(companyId, next);

      // Buchungen dieses Jahres löschen
      localStorage.removeItem(journalKey(companyId, currentYear));

      currentYear = next[0];
      renderYearTabs(companyId);
      loadTable(companyId);
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("generateCaseBtn")?.addEventListener("click", () => {
    const user = localStorage.getItem(USER_KEY);
    const companyId = localStorage.getItem(currentCompanyKey(user));
    const company = loadCompanies(user).find(c => c.id === companyId);
    if (!company) return;

    const fact = generateBookingCase(company.name, currentYear);
    document.getElementById("fact").value = fact;
  });

  document.getElementById("backBtn")?.addEventListener("click", () => {
    window.location.href = "company.html";
  });

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    const u = localStorage.getItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    if (u) localStorage.removeItem(currentCompanyKey(u));
    window.location.href = "index.html";
  });

  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay) {
    userDisplay.textContent = `Angemeldet: ${user}`;
  }

  const companyId = localStorage.getItem(currentCompanyKey(user));
  if (!companyId) {
    window.location.href = "overview.html";
    return;
  }

  const company = loadCompanies(user).find(c => c.id === companyId);
  if (!company) {
    window.location.href = "overview.html";
    return;
  }

  currentYear = getYears(companyId)[0];
  renderYearTabs(companyId);
  loadTable(companyId);

  document.getElementById("addBookingBtn")?.addEventListener("click", () => {
    const fact = document.getElementById("fact")?.value?.trim() || "";
    const sollName = document.getElementById("soll")?.value || "";
    const habenName = document.getElementById("haben")?.value || "";
    const amount = Number(document.getElementById("betrag")?.value || 0);

    if (!fact || !sollName || !habenName || !(amount > 0)) {
      alert("Bitte alles korrekt ausfüllen!");
      return;
    }

    const debit = ACCOUNT_MAP[sollName];
    const credit = ACCOUNT_MAP[habenName];

    if (!debit || !credit) {
      alert("Konto-Mapping fehlt! Bitte ACCOUNT_MAP ergänzen.");
      return;
    }

    const entry = {
      fact,
      sollName,
      habenName,
      debit,
      credit,
      amount,
      year: currentYear,
      date: new Date().toISOString()
    };

    const rows = loadJournal(companyId, currentYear);
    rows.push(entry);
    saveJournal(companyId, currentYear, rows);

    document.getElementById("fact").value = "";
    document.getElementById("betrag").value = "";
    document.getElementById("soll").value = "";
    document.getElementById("haben").value = "";

    loadTable(companyId);
    alert(`Gebucht in ${currentYear} ✅`);
  });
});
