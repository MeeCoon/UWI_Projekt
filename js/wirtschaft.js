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

function getDefaultOrgData() {
  return {
    ceo: {
      name: "Petra Müller",
      role: "Geschäftsführung"
    },
    departments: [
      {
        title: "Entwicklung",
        lead: "Fritz Teufel",
        employees: ["Vera Kluge", "Tina Schinkel", "Stefan Böhme"]
      },
      {
        title: "Software",
        lead: "Martin Kurz",
        employees: ["Egon Meyer", "Volker Sockel"]
      },
      {
        title: "Vertrieb",
        lead: "Mario Enge",
        employees: ["Manuel Ochs", "Holger Baum"]
      },
      {
        title: "Marketing",
        lead: "Michael Vries",
        employees: ["Fritz Glanz", "Uwe Jung"]
      }
    ]
  };
}

function clearSelection() {
  document.querySelectorAll(".orgSelected").forEach(el => {
    el.classList.remove("orgSelected");
  });
  selectedBox = null;
}

function attachBoxEvents() {
  document.querySelectorAll(".orgEditable").forEach(box => {
    box.onclick = (e) => {
      e.stopPropagation();
      clearSelection();
      box.classList.add("orgSelected");
      selectedBox = box;
    };
  });

  document.querySelectorAll('[contenteditable="true"]').forEach(editable => {
    editable.onclick = (e) => {
      e.stopPropagation();
      const box = editable.closest(".orgEditable");
      if (!box) return;

      clearSelection();
      box.classList.add("orgSelected");
      selectedBox = box;
    };
  });

  const root = document.getElementById("orgChart");
  if (root) {
    root.onclick = (e) => {
      if (e.target === root) {
        clearSelection();
      }
    };
  }
}

function renderOrgChart() {
  const root = document.getElementById("orgChart");
  if (!root) return;

  const data = getDefaultOrgData();

  const departmentsHtml = data.departments.map((dep) => {
    const employeesHtml = dep.employees.map(name => `
      <div class="orgMiniCard orgEditable" data-type="employee">
        <div class="orgMiniText" contenteditable="true">${escapeHtml(name)}</div>
      </div>
    `).join("");

    return `
      <div class="orgDeptColumn">
        <div class="orgDeptTopLine"></div>

        <div class="orgCard orgDeptCard orgEditable" data-type="department">
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
    alert("Organigramm konnte nicht geladen werden.");
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
    alert("Bitte zuerst eine Abteilung oder Mitarbeiter-Box auswählen.");
    return;
  }

  const deptColumn = selectedBox.closest(".orgDeptColumn");
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

  document.getElementById("addDeptBtn")?.addEventListener("click", addDepartment);
  document.getElementById("addEmployeeBtn")?.addEventListener("click", addEmployee);
  document.getElementById("deleteSelectedBtn")?.addEventListener("click", deleteSelectedBox);

  renderOrgChart();
});
