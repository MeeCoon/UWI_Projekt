const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const API_URL = "https://cautious-memory-jj657wwvpw4p2qvjx-3000.app.github.dev/api/recht-ki";

let chatHistory = [];

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

function addMessage(text, type) {
  const box = document.getElementById("answerBox");

  const msg = document.createElement("div");
  msg.style.margin = "10px 0";
  msg.style.padding = "12px";
  msg.style.borderRadius = "12px";
  msg.style.maxWidth = "80%";

  if (type === "user") {
    msg.style.background = "#dbeafe";
    msg.style.alignSelf = "flex-end";
  } else {
    msg.style.background = "#f1f5f9";
  }

  msg.innerText = text;
  box.appendChild(msg);
box.scrollTo({
  top: box.scrollHeight,
  behavior: "smooth"
});

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

  const box = document.getElementById("answerBox");
  box.innerHTML = "";
  box.style.display = "flex";
  box.style.flexDirection = "column";

  document.getElementById("askBtn").onclick = async () => {
    const input = document.getElementById("rechtQuestion");
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    const loading = document.createElement("div");
    loading.innerText = "KI denkt...";
    box.appendChild(loading);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          company,
          history: chatHistory
        })
      });

      const data = await res.json();
      loading.remove();

      addMessage(data.answer, "ki");

      // Verlauf speichern
      chatHistory.push({ role: "user", content: question });
      chatHistory.push({ role: "assistant", content: data.answer });

    } catch (err) {
      loading.remove();
      addMessage("Fehler bei Verbindung.", "ki");
    }
  };
});
