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

  if (f.includes("hallo") || f.includes("hi")) {
    return "Hallo 😊 Ich bin deine Recht- und Finanz-KI. Frag mich zu Bilanz, GmbH, AG, Haftung oder Verbesserungen.";
  }

  if (f.includes("wie geht")) {
    return "Mir geht’s gut 😄 Ich bin bereit, dein Unternehmen zu analysieren.";
  }

  if (f.includes("danke")) {
    return "Gerne 😊";
  }

  if (f.includes("bilanz") || f.includes("finanz") || f.includes("analyse")) {
    const aktiven = balance.assets || balance.aktiven || {};
    const passiven = balance.liabilities || balance.passiven || {};

    const a = sum(aktiven);
    const p = sum(passiven);

    if (a === 0 && p === 0) {
      return "⚠️ Ich finde noch keine Bilanzdaten. Bitte zuerst in der Bilanz Werte eingeben und speichern.";
    }

    return `📊 Finanzanalyse

Aktiven total: ${a} CHF
Passiven total: ${p} CHF

${a === p ? "✅ Die Bilanz ist ausgeglichen." : `⚠️ Die Bilanz ist nicht ausgeglichen. Differenz: ${a - p} CHF.`}

💡 Empfehlungen:
- Schulden reduzieren
- Eigenkapital erhöhen
- Kosten kontrollieren
- Einnahmen steigern
- Liquidität sichern`;
  }

  if (f.includes("gmbh")) {
    return "Eine GmbH ist eine Gesellschaft mit beschränkter Haftung. Vorteil: weniger private Haftung. Nachteil: mehr Regeln und Kapital nötig.";
  }

  if (f.includes("ag")) {
    return "Eine AG ist eine Aktiengesellschaft. Sie passt eher für grössere Unternehmen und kann Kapital durch Aktien sammeln.";
  }

  if (f.includes("einzel")) {
    return "Ein Einzelunternehmen ist einfach und günstig, aber riskanter, weil man privat haftet.";
  }

  if (f.includes("rechtsform")) {
    return "Vergleich: Einzelunternehmen = einfach, aber riskant. GmbH = sicherer und beliebt. AG = eher für grosse Firmen. Empfehlung: Für euer Projekt ist GmbH oft die beste Wahl.";
  }

  if (f.includes("haftung")) {
    return "Haftung bedeutet, wer für Schulden bezahlen muss. Bei Einzelunternehmen privat, bei GmbH/AG meistens nur die Firma.";
  }

  if (f.includes("verbesser") || f.includes("besser") || f.includes("empfehlung")) {
    return `💡 Unternehmens-Tipps

1. Kosten senken
2. Umsatz erhöhen
3. Schulden reduzieren
4. Eigenkapital stärken
5. Werbung verbessern
6. Kundenservice verbessern
7. passende Rechtsform wählen`;
  }

  return "Gute Frage! Wichtig sind Rechtsform, Haftung, Kapital, Schulden und Bilanz.";
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUserOrRedirect();
  if (!user) return;

  const company = getCompany(user);
  const balance = getBalance(user);

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

  addMessage("Hallo! Ich kann deine Bilanz berücksichtigen und Fragen zu Rechtsformen beantworten.", "ki");

  document.getElementById("askBtn").onclick = () => {
    const input = document.getElementById("rechtQuestion");
    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    const loading = document.createElement("div");
    loading.innerText = "KI denkt...";
    loading.style.padding = "12px";
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
