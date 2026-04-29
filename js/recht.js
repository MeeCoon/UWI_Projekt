const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const quizQuestions = [
  "Welche Rechtsform passt zu einer kleinen Firma?",
  "Was bedeutet Haftung bei einer GmbH?",
  "Was ist der Unterschied zwischen GmbH und AG?",
  "Welche Rechtsform braucht 100'000 CHF?",
  "Was muss man bei einer Firmengründung beachten?"
];

function getUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  return user;
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

  document.getElementById("askBtn").onclick = async () => {
    const question = document.getElementById("rechtQuestion").value.trim();
    const answerBox = document.getElementById("answerBox");

    if (!question) {
      answerBox.textContent = "Bitte zuerst eine Frage eingeben.";
      return;
    }

    answerBox.textContent = "KI denkt...";

    try {
      const res = await fetch(fetch("https://cautious-memory-jj657wwvpw4p2qvjx-3000.app.github.dev/api/recht-ki", {, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          company: "UWI Firma"
        })
      });

      const data = await res.json();
      answerBox.textContent = data.answer || "Keine Antwort erhalten.";
    } catch (err) {
      answerBox.textContent = "Fehler: Server läuft nicht oder Verbindung klappt nicht.";
    }
  };

  document.getElementById("quizBtn").onclick = () => {
    const random = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    document.getElementById("rechtQuestion").value = random;
    document.getElementById("answerBox").textContent = "Klicke auf „KI fragen“.";
  };
});
