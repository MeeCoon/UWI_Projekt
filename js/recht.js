const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const API_URL = "https://cautious-memory-jj657wwvpw4p2qvjx-3000.app.github.dev/api/recht-ki";

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

function addMessage(text, who) {
  const answerBox = document.getElementById("answerBox");
  const div = document.createElement("div");
  div.style.margin = "10px 0";
  div.style.padding = "10px";
  div.style.borderRadius = "10px";
  div.style.background = who === "user" ? "#e8f0ff" : "#f3f3f3";
  div.innerText = text;
  answerBox.appendChild(div);
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

  document.getElementById("askBtn").onclick = async () => {
    const input = document.getElementById("rechtQuestion");
    const question = input.value.trim();

    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    const loading = document.createElement("div");
    loading.innerText = "KI denkt...";
    document.getElementById("answerBox").appendChild(loading);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          company: company || "UWI Firma"
        })
      });

      const data = await res.json();
      loading.remove();
      addMessage(data.answer || "Keine Antwort erhalten.", "ki");

    } catch (err) {
      loading.remove();
      addMessage("Fehler: Server läuft nicht oder Verbindung klappt nicht.", "ki");
      console.error(err);
    }
  };

  document.getElementById("quizBtn").onclick = () => {
    const random = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    document.getElementById("rechtQuestion").value = random;
  };
});
