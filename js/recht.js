const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const BALANCE_PREFIX = "uwi_balance_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const balanceKey = (u) => `${BALANCE_PREFIX}${u}`;

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

function getBalance(user) {
  return JSON.parse(localStorage.getItem(balanceKey(user)) || "{}");
}

function addMessage(text, type) {
  const box = document.getElementById("answerBox");
  const msg = document.createElement("div");

  msg.style.margin = "10px 0";
  msg.style.padding = "12px";
  msg.style.borderRadius = "12px";
  msg.style.maxWidth = "80%";
  msg.style.whiteSpace = "pre-wrap";

  if (type === "user") {
    msg.style.background = "#dbeafe";
    msg.style.alignSelf = "flex-end";
    msg.style.marginLeft = "auto";
  } else {
    msg.style.background = "#f1f5f9";
    msg.style.alignSelf = "flex-start";
    msg.style.marginRight = "auto";
  }

  msg.innerText = text;
  box.appendChild(msg);

  box.scrollTo({
    top: box.scrollHeight,
    behavior: "smooth"
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  const company = getCompany(user);
  const balance = getBalance(user);

  console.log("🔍 Debug Info:");
  console.log("Company:", company);
  console.log("Balance:", balance);
  console.log("API URL:", API_URL);

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

  if (!company) {
    addMessage("⚠️ Keine Firma ausgewählt. Bitte wähle eine Firma aus.", "ki");
    return;
  }

  addMessage("Hallo! Ich kann jetzt auch deine Bilanz berücksichtigen.", "ki");

  document.getElementById("askBtn").onclick = async () => {
    const input = document.getElementById("rechtQuestion");
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    const loading = document.createElement("div");
    loading.innerText = "⏳ KI denkt...";
    loading.style.margin = "10px 0";
    loading.style.color = "#666";
    box.appendChild(loading);

    try {
      const payload = {
        question,
        company,
        balance,
        history: chatHistory
      };

      console.log("📤 Sende Payload:", payload);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      console.log("📥 Response Status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ API Fehler:", errorText);
        throw new Error(`API returned ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      console.log("✅ API Antwort:", data);

      loading.remove();

      if (data.answer) {
        addMessage(data.answer, "ki");
        chatHistory.push({ role: "user", content: question });
        chatHistory.push({ role: "assistant", content: data.answer });
      } else {
        addMessage("⚠️ Keine Antwort von der KI erhalten.", "ki");
      }

    } catch (err) {
      loading.remove();
      console.error("🔴 Fehler:", err);
      addMessage(`❌ Fehler: ${err.message}\n\nBitte überprüfe die Browser-Konsole (F12) für Details.`, "ki");
    }
  };

  document.getElementById("rechtQuestion").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("askBtn").click();
    }
  });
});
