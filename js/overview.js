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

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
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
        <div class="muted small">${escapeHtml(legal)} · ${escapeHtml(industry)} · Mitarbeitende: ${escapeHtml(String(employees))}</div>
      </div>
      <div class="listActions">
        <button class="btn" type="button" data-open="${escapeHtml(c.id)}">Öffnen</button>
      </div>
    `;
    list.appendChild(row);
  });

  // ✅ Event-Delegation: funktioniert auch, wenn später neu gerendert wird
  list.onclick = (e) => {
    const btn = e.target.closest("[data-open]");
    if (!btn) return;

    const id = btn.getAttribute("data-open");
    localStorage.setItem(currentCompanyKey(user), id);

    // ✅ harte Navigation
    window.location.assign("company.html");
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
deleteBtn.addEventListener("click", () => {
  if (!confirm(`"${company.name}" wirklich löschen?`)) return;

  const next = companies.filter(c => c.id !== company.id);
  localStorage.setItem(companiesKey(user), JSON.stringify(next));

  // falls gelöschte Firma ausgewählt war → selection löschen
  const cur = localStorage.getItem(currentCompanyKey(user));
  if (cur === company.id) localStorage.removeItem(currentCompanyKey(user));

  render(); // neu anzeigen
});
