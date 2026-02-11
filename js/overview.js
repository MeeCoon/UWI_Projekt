// js/overview.js
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

function saveCompanies(user, companies) {
  localStorage.setItem(companiesKey(user), JSON.stringify(companies));
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCompanies(user) {
  const list = document.getElementById("companiesList");
  if (!list) return;

  const companies = loadCompanies(user);
  list.innerHTML = "";

  if (!companies.length) {
    list.innerHTML = `<div class="muted">Noch keine Firmen erstellt.</div>`;
    return;
  }

  companies.forEach((c) => {
    const legal = c.legalForm || c.legal || "–";
    const industry = c.industry || "–";
    const employees = c.employees ?? c.size ?? "–";

    const row = document.createElement("div");
    row.className = "listItem";
    row.innerHTML = `
      <div class="listMain">
        <div class="listTitle">${escapeHtml(c.name || "Ohne Name")}</div>
        <div class="muted small">
          ${escapeHtml(legal)} · ${escapeHtml(industry)} · Mitarbeitende: ${escapeHtml(String(employees))}
        </div>
      </div>
      <div class="listActions">
        <button class="btn" type="button" data-open="${escapeHtml(c.id)}">Öffnen</button>
        <button class="btn" type="button" data-del="${escapeHtml(c.id)}" title="Firma löschen">Löschen</button>
      </div>
    `;
    list.appendChild(row);
  });

  // ✅ Event-Delegation für Öffnen + Löschen
  list.onclick = (e) => {
    const openBtn = e.target.closest("[data-open]");
    const delBtn = e.target.closest("[data-del]");

    if (openBtn) {
      const id = openBtn.getAttribute("data-open");
      localStorage.setItem(currentCompanyKey(user), id);
      window.location.assign("company.html");
      return;
    }

    if (delBtn) {
      const id = delBtn.getAttribute("data-del");
      const companiesNow = loadCompanies(user);
      const company = companiesNow.find((x) => x.id === id);

      if (!company) return;

      if (!confirm(`"${company.name}" wirklich löschen?`)) return;

      const next = companiesNow.filter((x) => x.id !== id);
      saveCompanies(user, next);

      // falls gelöschte Firma ausgewählt war → selection löschen
      const cur = localStorage.getItem(currentCompanyKey(user));
      if (cur === id) localStorage.removeItem(currentCompanyKey(user));

      renderCompanies(user);
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  });

  document.getElementById("createBtn")?.addEventListener("click", () => {
    window.location.href = "create.html";
  });

  renderCompanies(user);
});
