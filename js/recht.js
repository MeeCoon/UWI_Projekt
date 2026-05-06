const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const BALANCE_PREFIX = "uwi_balance_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const balanceKey = (u) => `${BALANCE_PREFIX}${u}`;

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

function sum(obj) {
  let total = 0;
  Object.values(obj || {}).forEach(v => {
    const n = Number(v);
    if (!isNaN(n)) total += n;
  });
  return total;
}

function addMessage(text, type) {
  const box = document.getElementById("answerBox");
  const msg = document.createElement("div");

  msg.style.margin = "10px 0";
  msg.style.padding = "12px";
  msg.style.borderRadius = "14px";
  msg.style.maxWidth = "80%";
  msg.style.whiteSpace = "pre-wrap";
  msg.style.background = type === "user" ? "#dbeafe" : "#f1f5f9";
  msg.style.alignSelf = type === "user" ? "flex-end" : "flex-start";

  msg.innerText = text;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

function fakeKI(question, company, balance) {
  const f = question.toLowerCase();

  // Smalltalk
  if (f.includes("hallo") || f.includes("hi")) {
    return "Hallo 😊 Ich bin deine Recht- und Finanz-KI. Frag mich alles zu Unternehmen!";
  }

  if (f.includes("wie geht")) {
    return "Mir geht’s gut 😄 Bereit dir zu helfen!";
  }

  if (f.includes("danke")) {
    return "Gerne 😊";
  }

  // Schulden & Verbesserung
  if (f.includes("schulden") || f.includes("reduzier") || f.includes("kosten")) {
    return `💡 Schulden reduzieren:

1. Kosten senken → unnötige Ausgaben streichen  
2. Einnahmen erhöhen → mehr Kunden gewinnen  
3. Schulden planen → Schritt für Schritt zurückzahlen  
4. Eigenkapital erhöhen → mehr eigenes Geld  
5. Budget kontrollieren  

👉 Weniger Schulden = weniger Risiko`;
  }

  if (f.includes("besser") || f.includes("verbesser") || f.includes("unternehmen")) {
    return `🚀 Unternehmen verbessern:

- Kosten kontrollieren  
- Umsatz steigern  
- Werbung verbessern  
- Kunden gewinnen  
- Schulden reduzieren  
- Eigenkapital erhöhen  

👉 Ziel: stabil + erfolgreich`;
  }

  // Bilanz Analyse
  if (f.includes("bilanz") || f.includes("analyse") || f.includes("finanz")) {
    const aktiven = balance.assets || balance.aktiven || {};
    const passiven = balance.liabilities || balance.passiven || {};

    const a = sum(aktiven);
    const p = sum(passiven);

    if (a === 0 && p === 0) {
      return "⚠️ Keine Bilanzdaten gefunden. Bitte zuerst Bilanz eingeben.";
    }

    return `📊 Finanzanalyse:

Aktiven: ${a} CHF  
Passiven: ${p} CHF  

${a === p ? "✅ Bilanz korrekt" : "⚠️ Bilanz nicht ausgeglichen"}

💡 Tipp:
- Schulden senken  
- Eigenkapital erhöhen  
- Kosten kontrollieren`;
  }

  // Rechtsformen
  if (f.includes("gmbh")) {
    return "GmbH = weniger Risiko, da keine private Haftung.";
  }

  if (f.includes("ag")) {
    return "AG = grosse Firma, Kapital durch Aktien.";
  }

  if (f.includes("einzel")) {
    return "Einzelunternehmen = einfach, aber riskant wegen privater Haftung.";
  }

  if (f.includes("rechtsform")) {
    return "Vergleich: Einzelunternehmen (einfach), GmbH (sicher), AG (gross).";
  }

  // Begriffe
  if (f.includes("haftung")) {
    return "Haftung bedeutet, wer für Schulden bezahlen muss.";
  }

  if (f.includes("eigenkapital")) {
    return "Eigenkapital = eigenes Geld → macht Unternehmen stabil.";
  }

  if (f.includes("risiko")) {
    return "Risiko = Möglichkeit, Geld zu verlieren.";
  }

  // Fallback
  return `Gute Frage 👍

Wichtige Themen:
- Rechtsform  
- Schulden  
- Kapital  
- Bilanz  

Frag z.B.: "Wie kann man Schulden reduzieren?"`;
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

  const box = document.getElementById("answerBox");
  box.innerHTML = "";
  box.style.display = "flex";
  box.style.flexDirection = "column";

  addMessage("Hallo! Ich kann deine Bilanz analysieren und Fragen beantworten 🤖", "ki");

  document.getElementById("askBtn").onclick = () => {
    const input = document.getElementById("rechtQuestion");
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    const loading = document.createElement("div");
    loading.innerText = "KI denkt...";
    loading.style.padding = "10px";
    box.appendChild(loading);

    setTimeout(() => {
      loading.remove();
      const answer = fakeKI(question, company, getBalance(user));
      addMessage(answer, "ki");
    }, 800);
  };

  document.getElementById("rechtQuestion").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("askBtn").click();
    }
  });
});
