// js/wirtschaft.js
const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

let selectedBox = null;
let currentQuiz = null;
let quizScore = 0;
let quizAnswered = false;

const QUIZ_QUESTIONS = [
  {
    question: "Was passiert meistens, wenn die Nachfrage steigt und das Angebot gleich bleibt?",
    answers: ["Der Preis sinkt", "Der Preis steigt", "Nichts passiert", "Die Produktion stoppt"],
    correct: 1
  },
  {
    question: "Was ist Inflation?",
    answers: ["Sinkende Löhne", "Steigende Preise", "Weniger Firmen", "Mehr Aktien"],
    correct: 1
  },
  {
    question: "Was bedeutet BIP?",
    answers: ["Bankinterner Preis", "Bruttoinlandprodukt", "Bilanzierter Investitionsplan", "Betriebliche Inventarplanung"],
    correct: 1
  },
  {
    question: "Welche Rechtsform braucht mindestens 20'000 CHF Kapital?",
    answers: ["Einzelunternehmen", "GmbH", "Kollektivgesellschaft", "Verein"],
    correct: 1
  },
  {
    question: "Wer steht in einem Organigramm meistens ganz oben?",
    answers: ["Lager", "Marketing", "Geschäftsführung", "Verkauf"],
    correct: 2
  },
  {
    question: "Was ist ein typischer Aufwand?",
    answers: ["Miete", "Umsatz", "Aktienkapital", "Darlehen"],
    correct: 0
  },
  {
    question: "Was ist ein typischer Ertrag?",
    answers: ["Lohnaufwand", "Versicherungsaufwand", "Warenertrag", "Abschreibung"],
    correct: 2
  },
  {
    question: "Was ist Fremdkapital?",
    answers: ["Schulden", "Gewinn", "Umsatz", "Vorräte"],
    correct: 0
  },
  {
    question: "Was gehört in der Bilanz zu den Aktiven?",
    answers: ["Bank", "Darlehen", "Eigenkapital", "Umsatz"],
    correct: 0
  },
  {
    question: "Was gehört in der Bilanz zu den Passiven?",
    answers: ["Kasse", "Maschinen", "Verbindlichkeiten", "Waren"],
    correct: 2
  },
  {
    question: "Was ist ein Beispiel für Umlaufvermögen?",
    answers: ["Bankguthaben", "Aktienkapital", "Darlehen", "Lohnaufwand"],
    correct: 0
  },
  {
    question: "Was ist ein Beispiel für Anlagevermögen?",
    answers: ["Kasse", "Maschinen", "Debitoren", "Warenertrag"],
    correct: 1
  },
  {
    question: "Was passiert bei einem Gewinn normalerweise?",
    answers: ["Eigenkapital steigt", "Eigenkapital sinkt", "Bank verschwindet", "Umsatz wird null"],
    correct: 0
  },
  {
    question: "Welche Phase gehört zum Konjunkturzyklus?",
    answers: ["Rezession", "Inventur", "Fusion", "Import"],
    correct: 0
  },
  {
    question: "Was ist ein typischer Personalaufwand?",
    answers: ["Löhne", "Warenertrag", "Aktienkapital", "Bank"],
    correct: 0
  }
];

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

function ensureQuizUI() {
  const card = document.querySelector("main .card");
  if (!card) return;
  if (document.getElementById("quizWrap")) return;

  const quizWrap = document.createElement("div");
  quizWrap.id = "quizWrap";
  quizWrap.style.display = "none";
  quizWrap.innerHTML = `
    <div class="balanceHeaderBlue" style="margin-top:28px;">
      <div class="balanceTitle">Wirtschaft Quiz</div>
      <div class="balanceSub">Locker üben mit kurzen Fragen</div>
    </div>
    <div class="quizCard">
      <div id="quizScore" class="quizScore">Punkte: 0</div>
      <div id="quizQuestion" class="quizQuestion">Frage wird geladen...</div>
      <div id="quizAnswers" class="quizAnswers"></div>
      <div id="quizResult" class="quizResult"></div>
      <div class="form-actions" style="margin-top:14px;">
        <button id="checkQuizBtn" class="btn primary" type="button">Antwort prüfen</button>
        <button id="nextQuizBtn" class="btn" type="button">Nächste Frage</button>
      </div>
    </div>
  `;

  card.appendChild(quizWrap);

  document.getElementById("checkQuizBtn")?.addEventListener("click", checkQuizAnswer);
  document.getElementById("nextQuizBtn")?.addEventListener("click", nextQuizQuestion);
}

function nextQuizQuestion() {
  currentQuiz = QUIZ_QUESTIONS[Math.floor(Math.random() * QUIZ_QUESTIONS.length)];
  quizAnswered = false;

  const q = document.getElementById("quizQuestion");
  const a = document.getElementById("quizAnswers");
  const r = document.getElementById("quizResult");
  const s = document.getElementById("quizScore");

  if (!q || !a || !r || !s) return;

  q.textContent = currentQuiz.question;
  r.textContent = "";
  r.className = "quizResult";
  s.textContent = `Punkte: ${quizScore}`;

  a.innerHTML = currentQuiz.answers.map((answer, index) => `
    <label class="quizAnswer">
      <input type="radio" name="quizAnswer" value="${index}">
      <span>${escapeHtml(answer)}</span>
    </label>
  `).join("");
}

function checkQuizAnswer() {
  if (!currentQuiz || quizAnswered) return;

  const checked = document.querySelector('input[name="quizAnswer"]:checked');
  const result = document.getElementById("quizResult");
  const score = document.getElementById("quizScore");

  if (!checked) {
    result.textContent = "Bitte zuerst eine Antwort auswählen.";
    result.className = "quizResult";
    return;
  }

  const value = Number(checked.value);
  quizAnswered = true;

  if (value === currentQuiz.correct) {
    quizScore += 1;
    result.textContent = "Richtig ✅";
    result.className = "quizResult quizRight";
  } else {
    result.textContent = `Falsch ❌ Richtige Antwort: ${currentQuiz.answers[currentQuiz.correct]}`;
    result.className = "quizResult quizWrong";
  }

  if (score) {
    score.textContent = `Punkte: ${quizScore}`;
  }
}

function setupQuizToggle() {
  const toggleBtn = document.getElementById("toggleQuizBtn");
  if (!toggleBtn) return;

  toggleBtn.onclick = () => {
    const quizWrap = document.getElementById("quizWrap");
    if (!quizWrap) return;

    if (quizWrap.style.display === "none") {
      quizWrap.style.display = "block";
      toggleBtn.textContent = "❌ Quiz schliessen";
      nextQuizQuestion();
    } else {
      quizWrap.style.display = "none";
      toggleBtn.textContent = "🧠 Quiz starten";
    }
  };
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
  window.location.href = "overview.html";
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
  ensureQuizUI();
  setupQuizToggle();
});
