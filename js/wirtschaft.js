const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

let currentTask = null;

function loadCompanies(u) {
  try {
    return JSON.parse(localStorage.getItem(companiesKey(u)) || "[]");
  } catch {
    return [];
  }
}

function getSelectedCompany(u) {
  const id = localStorage.getItem(currentCompanyKey(u));
  if (!id) return null;
  return loadCompanies(u).find(c => c.id === id) || null;
}

function getUserOrRedirect() {
  const u = localStorage.getItem(USER_KEY);
  if (!u) {
    window.location.href = "index.html";
    return null;
  }
  return u;
}

function normalizeIndustry(industryRaw) {
  const industry = String(industryRaw || "").trim().toLowerCase();

  if (industry.includes("handel")) return "Handel";
  if (industry.includes("produktion")) return "Produktion";
  if (industry.includes("dienst")) return "Dienstleistung";

  return "Allgemein";
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getTasks(topic, industry) {
  const branchenTasks = {
    Handel: [
      {
        q: "Erkläre, warum ein Handelsunternehmen besonders stark von Angebot und Nachfrage abhängig ist.",
        a: "Ein Handelsunternehmen kauft und verkauft Waren. Wenn die Nachfrage steigt, kann es meist mehr verkaufen. Wenn das Angebot knapp ist, steigen oft die Einkaufspreise."
      },
      {
        q: "Nenne ein wirtschaftliches Risiko für ein Handelsunternehmen.",
        a: "Ein typisches Risiko ist, dass Waren nicht verkauft werden und im Lager liegen bleiben."
      }
    ],
    Produktion: [
      {
        q: "Warum sind Rohstoffe für ein Produktionsunternehmen wirtschaftlich besonders wichtig?",
        a: "Ohne Rohstoffe kann das Unternehmen nicht produzieren. Steigende Rohstoffpreise erhöhen die Kosten direkt."
      },
      {
        q: "Wie wirkt sich eine Preissteigerung bei Energie auf ein Produktionsunternehmen aus?",
        a: "Die Produktionskosten steigen, wodurch der Gewinn sinken oder der Verkaufspreis erhöht werden muss."
      }
    ],
    Dienstleistung: [
      {
        q: "Warum spielen Mitarbeitende bei einem Dienstleistungsunternehmen eine besonders wichtige Rolle?",
        a: "Die Leistung wird meist direkt von Menschen erbracht. Darum sind Wissen, Qualität und Arbeitszeit zentral."
      },
      {
        q: "Nenne einen wichtigen Kostenfaktor bei einem Dienstleistungsunternehmen.",
        a: "Ein wichtiger Kostenfaktor ist der Lohnaufwand."
      }
    ],
    Allgemein: [
      {
        q: "Was ist der Unterschied zwischen einem Produktionsunternehmen und einem Dienstleistungsunternehmen?",
        a: "Ein Produktionsunternehmen stellt Güter her, ein Dienstleistungsunternehmen erbringt Leistungen."
      }
    ]
  };

  const standardTasks = {
    angebot: [
      {
        q: "Was passiert normalerweise mit dem Preis, wenn die Nachfrage steigt und das Angebot gleich bleibt?",
        a: "Der Preis steigt normalerweise."
      },
      {
        q: "Was passiert normalerweise mit dem Preis, wenn das Angebot steigt und die Nachfrage gleich bleibt?",
        a: "Der Preis sinkt normalerweise."
      }
    ],
    inflation: [
      {
        q: "Was bedeutet Inflation?",
        a: "Inflation bedeutet, dass das allgemeine Preisniveau steigt."
      },
      {
        q: "Was ist eine Folge von Inflation für Konsumenten?",
        a: "Die Kaufkraft sinkt."
      }
    ],
    konjunktur: [
      {
        q: "Nenne die vier Phasen des Konjunkturzyklus.",
        a: "Aufschwung, Boom, Abschwung und Rezession."
      },
      {
        q: "Wie verhalten sich Unternehmen oft in einer Rezession?",
        a: "Sie investieren vorsichtiger und stellen weniger neue Mitarbeitende ein."
      }
    ],
    bip: [
      {
        q: "Was misst das BIP?",
        a: "Das BIP misst den Wert aller produzierten Waren und Dienstleistungen eines Landes in einer bestimmten Zeit."
      },
      {
        q: "Warum zeigt das BIP nicht alles über den Wohlstand eines Landes?",
        a: "Weil Lebensqualität, Verteilung und Umwelt nicht direkt darin enthalten sind."
      }
    ]
  };

  if (topic === "branche") {
    return branchenTasks[industry] || branchenTasks.Allgemein;
  }

  return standardTasks[topic] || standardTasks.angebot;
}

function generateTask() {
  const user = localStorage.getItem(USER_KEY);
  const company = getSelectedCompany(user);
  const industry = normalizeIndustry(company?.industry);

  const topic = document.getElementById("topic").value;
  const difficulty = document.getElementById("difficulty").value;

  const tasks = getTasks(topic, industry);
  const base = pickRandom(tasks);

  let prefix = "";
  if (difficulty === "leicht") prefix = "Leicht: ";
  if (difficulty === "mittel") prefix = "Mittel: ";
  if (difficulty === "schwer") prefix = "Schwer: ";

  currentTask = {
    question: `${prefix}${base.q}`,
    answer: base.a
  };

  document.getElementById("questionBox").textContent = currentTask.question;
  document.getElementById("answerBox").textContent = "Noch ausgeblendet.";
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

  document.getElementById("generateBtn").onclick = generateTask;
  document.getElementById("nextBtn").onclick = generateTask;

  document.getElementById("showAnswerBtn").onclick = () => {
    const answerBox = document.getElementById("answerBox");
    answerBox.textContent = currentTask ? currentTask.answer : "Erstelle zuerst eine Aufgabe.";
  };
});
