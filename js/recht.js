const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const API_URL = "https://cautious-memory-jj657wwvpw4p2qvjx-3000.app.github.dev/api/recht-ki";

let chatHistory = [];

const quizQuestions = [
  "Welche Rechtsform passt zu meiner Firma?",
  "Was bedeutet Haftung?",
  "Was ist besser: GmbH oder AG?",
  "Welche Pflichten hat eine Firma?",
  "Was muss man bei der Gründung beachten?"
];

function getUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = "index.html";
    return null;
  }
  return user;
}

function getCompany(user) {
  const id = localStorage.getItem(currentCompanyKey(user));
  const companies = JSON.parse(localStorage.getItem(companiesKey(user)) || "[]");
  return companies.find(c => c.id === id) || null;
}

function addMessage(text, sender) {
  const box = document.getElementById("answerBox");

  const msg = document.createElement("div");
  msg.style.margin = "10px 0";
  msg.style.padding = "12px";
  msg.style.borderRadius = "12px";
  msg.style.whiteSpace = "pre-wrap";
  msg.style.maxWidth = "85%";

  if (sender === "user") {
    msg.style.marginLeft = "auto";
    msg.style.background = "#dbeafe";
    msg.innerText = "Du:\n" + text;
  } else {
    msg.style.marginRight = "auto";
    msg.style.background = "#f3f4f6";
    msg.innerText = "KI:\n" + text;
  }

  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  const company = getCompany(user);

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  document.getElementById("backBtn").onclick = () => {
    window.location.href = "overview.html";
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  };

  document.getElementById("answerBox").innerHTML = "";
  addMessage("Hallo! Ich bin deine Recht-KI. Stelle mir eine Frage zu Rechtsform, Haftung oder Gründung.", "ki");

  document.getElementById("askBtn").onclick = async () => {
    const input = document.getElementById("rechtQuestion");
    const question = input.value.trim();

    if (!question) return;

    addMessage(question, "user");
    chatHistory.push({ role: "user", content: question });
    input.value = "";

    const loadingText = "KI denkt...";
    addMessage(loadingText, "ki");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          company: company || "UWI Firma",
          history: chatHistory
        })
      });

      const data = await res.json();

      const box = document.getElementById("answerBox");
      box.lastChild.remove();

      const answer = data.answer || "Keine Antwort erhalten.";
      addMessage(answer, "ki");
      chatHistory.push({ role: "assistant", content: answer });

    } catch (err) {
      const box = document.getElementById("answerBox");
      box.lastChild.remove();
      addMessage("Fehler: Server läuft nicht oder Verbindung klappt nicht.", "ki");
      console.error(err);
    }
  };

  document.getElementById("quizBtn").onclick = () => {
    const random = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    document.getElementById("rechtQuestion").value = random;
  };
});
