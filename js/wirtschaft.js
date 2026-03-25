// js/wirtschaft.js
const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

let selectedBox = null;

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

    const title = parts[0] || "Bereich";
    const lead = parts[1] || "Leitung";
    const employees = (parts[2] || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);

    return { title, lead, employees };
  });

  return { ceo, departments };
}

function clearSelection() {
  document.querySelectorAll(".orgSelected").forEach(el => {
    el.classList.remove("orgSelected");
  });
  selectedBox = null;
}

function attachBoxEvents() {
  document.querySelectorAll(".orgEditable").forEach(box => {
    box.addEventListener("click", (e) => {
      e.stopPropagation();
      clearSelection();
      box.classList.add("orgSelected");
      selectedBox = box;
    });
  });

  document.addEventListener("click", () => {
    clearSelection();
  });
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

  const departmentsHtml = data.departments.map((dep, deptIndex) => {
    const employeesHtml = dep.employees.map((name, empIndex) => `
      <div 
        class="orgMiniCard orgEditable"
        data-type="employee"
        data-dept-index="${deptIndex}"
        data-emp-index="${empIndex}"
      >
        <div class="orgMiniText" contenteditable="true">${escapeHtml(name)}</div>
      </div>
    `).join("");

    return `
      <div class="orgDeptColumn">
        <div class="orgDeptTopLine"></div>

        <div 
          class="orgCard orgDeptCard orgEditable"
          data-type="department"
          data-dept-index="${deptIndex}"
        >
          <div class="orgName" contenteditable="true">${escapeHtml(dep.title)}</div>
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
    <div class="orgDiagramTitle">ORGANIGRAMM</div>

    <div class="orgTree">
      <div class="orgTop">
        <div class="orgCard orgCardTop orgEditable" data-type="ceo">
          <div class="orgName" contenteditable="true">${escapeHtml(data.ceo.role)}</div>
          <div class="orgRole" contenteditable="true">${escapeHtml(data.ceo.name)}</div>
        </div>
      </div>

      ${data.departments.length ? `
        <div class="orgConnectorVertical"></div>
        <div class="orgConnectorHorizontal"></div>
        <div class="orgDeptRow">
          ${departmentsHtml}
        </div>
      ` : ""}
    </div>
  `;

  attachBoxEvents();
}

function addDepartment() {
  const row = document.querySelector(".orgDeptRow");
  if (!row) {
    alert("Erstelle zuerst das Organigramm.");
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "orgDeptColumn";
  wrapper.innerHTML = `
    <div class="orgDeptTopLine"></div>

    <div class="orgCard orgDeptCard orgEditable" data-type="department">
      <div class="orgName" contenteditable="true">Neuer Bereich</div>
      <div class="orgRole" contenteditable="true">Neue Leitung</div>
    </div>

    <div class="orgDeptVertical"></div>
    <div class="orgMiniGrid">
      <div class="orgMiniCard orgEditable" data-type="employee">
        <div class="orgMiniText" contenteditable="true">Neuer Mitarbeiter</div>
      </div>
    </div>
  `;

  row.appendChild(wrapper);
  attachBoxEvents();
}

function addEmployee() {
  if (!selectedBox) {
    alert("Bitte zuerst eine Abteilungs- oder Mitarbeiter-Box auswählen.");
    return;
  }

  let deptColumn = null;

  if (selectedBox.classList.contains("orgDeptCard")) {
    deptColumn = selectedBox.closest(".orgDeptColumn");
  } else if (selectedBox.classList.contains("orgMiniCard")) {
    deptColumn = selectedBox.closest(".orgDeptColumn");
  }

  if (!deptColumn) {
    alert("Bitte eine Abteilung oder einen Mitarbeiter auswählen.");
    return;
  }

  let miniGrid = deptColumn.querySelector(".orgMiniGrid");
  let deptVertical = deptColumn.querySelector(".orgDeptVertical");

  if (!miniGrid) {
    deptVertical = document.createElement("div");
    deptVertical.className = "orgDeptVertical";

    miniGrid = document.createElement("div");
    miniGrid.className = "orgMiniGrid";

    deptColumn.appendChild(deptVertical);
    deptColumn.appendChild(miniGrid);
  }

  const newCard = document.createElement("div");
  newCard.className = "orgMiniCard orgEditable";
  newCard.setAttribute("data-type", "employee");
  newCard.innerHTML = `<div class="orgMiniText" contenteditable="true">Neuer Mitarbeiter</div>`;

  miniGrid.appendChild(newCard);
  attachBoxEvents();
}

function deleteSelectedBox() {
  if (!selectedBox) {
    alert("Bitte zuerst eine Box auswählen.");
    return;
  }

  if (selectedBox.dataset.type === "ceo") {
    alert("Die Geschäftsführung oben soll nicht gelöscht werden.");
    return;
  }

  if (selectedBox.classList.contains("orgDeptCard")) {
    const deptColumn = selectedBox.closest(".orgDeptColumn");
    if (deptColumn) deptColumn.remove();
    clearSelection();
    return;
  }

  if (selectedBox.classList.contains("orgMiniCard")) {
    const miniGrid = selectedBox.closest(".orgMiniGrid");
    selectedBox.remove();

    if (miniGrid && !miniGrid.querySelector(".orgMiniCard")) {
      const deptColumn = miniGrid.closest(".orgDeptColumn");
      miniGrid.remove();
      const line = deptColumn?.querySelector(".orgDeptVertical");
      if (line) line.remove();
    }

    clearSelection();
  }
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
  document.getElementById("addDeptBtn")?.addEventListener("click", addDepartment);
  document.getElementById("addEmployeeBtn")?.addEventListener("click", addEmployee);
  document.getElementById("deleteSelectedBtn")?.addEventListener("click", deleteSelectedBox);

  renderOrgChart();
});
