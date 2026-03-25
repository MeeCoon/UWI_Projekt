// js/wirtschaft.js
const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

function getUserOrRedirect() {
  const u = localStorage.getItem(USER_KEY);
  if (!u) {
    window.location.href = "index.html";
    return null;
  }
  return u;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseInput(raw) {
  const lines = raw
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  if (!lines.length) return null;

  const topParts = lines[0].split("|").map(x => x.trim());

  const ceo = {
    name: topParts[0] || "Unbekannt",
    role: topParts[1] || "Geschäftsführung"
  };

  const departments = lines.slice(1).map(line => {
    const parts = line.split("|").map(x => x.trim());

    const deptName = parts[0] || "Abteilung";
    const lead = parts[1] || "Leitung";
    const employees = (parts[2] || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);

    return {
      deptName,
      lead,
      employees
    };
  });

  return { ceo, departments };
}

function renderOrgChart() {
  const root = document.getElementById("orgChart");
  if (!root) return;

  const raw = document.getElementById("inputData")?.value || "";
  const data = parseInput(raw);

  if (!data) {
    root.innerHTML = `<div class="orgEmpty">Keine Daten vorhanden.</div>`;
    return;
  }

  const deptHtml = data.departments.map(dep => {
    const employeesHtml = dep.employees.map(name => `
      <div class="orgMiniCard" contenteditable="true">${escapeHtml(name)}</div>
    `).join("");

    return `
      <div class="orgDept">
        <div class="orgDeptTopLine"></div>

        <div class="orgCard orgDeptCard">
          <div class="orgName" contenteditable="true">${escapeHtml(dep.deptName)}</div>
          <div class="orgRole" contenteditable="true">${escapeHtml(dep.lead)}</div>
        </div>

        ${dep.employees.length ? `
          <div class="orgDeptVertical"></div>
          <div class="orgMiniGrid">
            ${employeesHtml}
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  root.innerHTML = `
    <div class="orgTree">
      <div class="orgTop">
        <div class="orgCard orgCardTop">
          <div class="orgName" contenteditable="true">${escapeHtml(data.ceo.role)}</div>
          <div class="orgRole" contenteditable="true">${escapeHtml(data.ceo.name)}</div>
        </div>
      </div>

      ${data.departments.length ? `
        <div class="orgConnectorVertical"></div>
        <div class="orgConnectorHorizontal"></div>
        <div class="orgDeptRow">
          ${deptHtml}
        </div>
      ` : ""}
    </div>
  `;
}

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
      window.location.href = "company.html";
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

  const generateBtn = document.getElementById("generateBtn");
  if (generateBtn) {
    generateBtn.addEventListener("click", renderOrgChart);
  }

  renderOrgChart();
});
