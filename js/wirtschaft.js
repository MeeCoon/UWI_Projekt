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

function parseInput(raw) {
  return raw
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/\s+/);
      const name = parts.shift() || "";
      const role = parts.join(" ") || "Mitarbeiter/in";
      return { name, role };
    })
    .filter(p => p.name);
}

function renderOrgChart() {
  const root = document.getElementById("orgChart");
  if (!root) return;

  const raw = document.getElementById("inputData")?.value || "";
  const people = parseInput(raw);

  if (!people.length) {
    root.innerHTML = `
      <div class="orgEmpty">
        Keine Daten vorhanden.
      </div>
    `;
    return;
  }

  const [boss, ...others] = people;

  const cards = others.map(person => `
    <div class="orgCard">
      <div class="orgName">${person.name}</div>
      <div class="orgRole">${person.role}</div>
    </div>
  `).join("");

  root.innerHTML = `
    <div class="orgTree">
      <div class="orgTop">
        <div class="orgCard orgCardTop">
          <div class="orgName">${boss.name}</div>
          <div class="orgRole">${boss.role}</div>
        </div>
      </div>

      ${others.length ? `
        <div class="orgConnectorVertical"></div>
        <div class="orgConnectorHorizontal"></div>
        <div class="orgGrid">
          ${cards}
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

  document.getElementById("generateBtn")?.addEventListener("click", renderOrgChart);

  renderOrgChart();
});
