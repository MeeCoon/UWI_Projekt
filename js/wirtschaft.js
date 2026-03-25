const USER_KEY = "uwi_user";

const TASKS = {
  "angebot-nachfrage": [
    {
      q: "Erkläre den Unterschied zwischen Angebot und Nachfrage.",
      a: "Angebot ist die Menge eines Gutes, die Unternehmen verkaufen wollen. Nachfrage ist die Menge, die Konsumenten kaufen wollen."
    },
    {
      q: "Was passiert normalerweise mit dem Preis, wenn die Nachfrage steigt und das Angebot gleich bleibt?",
      a: "Der Preis steigt normalerweise, weil mehr Personen das gleiche Gut wollen."
    }
  ],
  inflation: [
    {
      q: "Was bedeutet Inflation?",
      a: "Inflation bedeutet, dass das allgemeine Preisniveau über eine gewisse Zeit steigt."
    },
    {
      q: "Nenne eine Folge von Inflation für Haushalte.",
      a: "Die Kaufkraft sinkt, weil man mit demselben Geld weniger kaufen kann."
    }
  ],
  bip: [
    {
      q: "Was misst das BIP?",
      a: "Das BIP misst den Gesamtwert aller in einem Land produzierten Waren und Dienstleistungen in einer bestimmten Zeit."
    },
    {
      q: "Steigt das BIP immer, wenn es der Bevölkerung besser geht?",
      a: "Nicht unbedingt. Das BIP zeigt wirtschaftliche Leistung, aber nicht direkt Lebensqualität oder Verteilung."
    }
  ],
  arbeitslosigkeit: [
    {
      q: "Was versteht man unter Arbeitslosigkeit?",
      a: "Arbeitslosigkeit bedeutet, dass Personen arbeiten möchten, aber keine Stelle finden."
    },
    {
      q: "Nenne eine Auswirkung hoher Arbeitslosigkeit auf die Wirtschaft.",
      a: "Der Konsum sinkt oft, weil weniger Menschen Einkommen haben."
    }
  ],
  konjunktur: [
    {
      q: "Welche vier Phasen hat der Konjunkturzyklus?",
      a: "Aufschwung, Boom, Abschwung und Rezession."
    },
    {
      q: "Wie verhalten sich Unternehmen in einer Rezession oft?",
      a: "Sie investieren vorsichtiger und stellen weniger neue Mitarbeitende ein."
    }
  ]
};

let currentTask = null;

function getUserOrRedirect() {
  const u = localStorage.getItem(USER_KEY);
  if (!u) {
    window.location.href = "index.html";
    return null;
  }
  return u;
}

function pickRandomTask(topic) {
  const list = TASKS[topic] || [];
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function generateTask() {
  const topic = document.getElementById("topic").value;
  const difficulty = document.getElementById("difficulty").value;

  const base = pickRandomTask(topic);
  if (!base) return;

  let prefix = "";
  if (difficulty === "leicht") prefix = "Leicht: ";
  if (difficulty === "mittel") prefix = "Mittel: ";
  if (difficulty === "schwer") prefix = "Schwer: ";

  currentTask = {
    question: prefix + base.q,
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
