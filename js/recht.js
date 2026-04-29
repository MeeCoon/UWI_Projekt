const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const answers = {
  haftung: "Haftung bedeutet, wer für Schulden eines Unternehmens verantwortlich ist. Bei einer GmbH oder AG haftet grundsätzlich das Gesellschaftsvermögen. Beim Einzelunternehmen haftet die Person meistens persönlich.",
  gmbh: "Eine GmbH ist eine Gesellschaft mit beschränkter Haftung. Sie braucht mindestens 20'000 CHF Stammkapital.",
  ag: "Eine AG ist eine Aktiengesellschaft. Sie braucht mindestens 100'000 CHF Aktienkapital.",
  einzelunternehmen: "Ein Einzelunternehmen gehört einer Person. Es ist einfach zu gründen, aber die Inhaberin oder der Inhaber haftet grundsätzlich persönlich.",
  rechtsform: "Die Rechtsform bestimmt, wie ein Unternehmen rechtlich aufgebaut ist. Beispiele sind Einzelunternehmen, GmbH und AG.",
  gründung: "Bei der Gründung entsteht ein Unternehmen offiziell. Je nach Rechtsform braucht es Kapital, Dokumente und teilweise einen Handelsregistereintrag."
};

const quizQuestions = [
  "Welche Rechtsform braucht mindestens 20'000 CHF Kapital?",
  "Was bedeutet Haftung?",
  "Was ist der Unterschied zwischen GmbH und AG?",
  "Welche Rechtsform ist für eine Einzelperson am einfachsten?",
  "Warum ist die Rechtsform für ein Unternehmen wichtig?"
];

function getUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

function generateAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes("haft")) return answers.haftung;
  if (q.includes("gmbh")) return answers.gmbh;
  if (q.includes("ag") || q.includes("aktien")) return answers.ag;
  if (q.includes("einzel")) return answers.einzelunternehmen;
  if (q.includes("rechtsform")) return answers.rechtsform;
  if (q.includes("gründ") || q.includes("gruend")) return answers.gründung;

  return "Dazu kann ich dir allgemein sagen: Im Recht geht es darum, welche Rechte und Pflichten ein Unternehmen hat. Stelle die Frage am besten mit einem Begriff wie GmbH, AG, Haftung oder Rechtsform.";
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  document.getElementById("backBtn").onclick = () => {
    window.location.href = "overview.html";
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  };

  document.getElementById("askBtn").onclick = () => {
    const question = document.getElementById("rechtQuestion").value.trim();
    const answerBox = document.getElementById("answerBox");

    if (!question) {
      answerBox.textContent = "Bitte zuerst eine Frage eingeben.";
      return;
    }

    answerBox.textContent = generateAnswer(question);
  };

  document.getElementById("quizBtn").onclick = () => {
    const random = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    document.getElementById("rechtQuestion").value = random;
    document.getElementById("answerBox").textContent = "Klicke auf „KI fragen“, um die Lösung zu sehen.";
  };
});
