const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const BALANCE_PREFIX = "uwi_balance_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const balanceKey = (u) => `${BALANCE_PREFIX}${u}`;

let chatHistory = [];
let modelLoaded = false;

// Knowledge Base für Schweizer Recht & Bilanzwesen
const KNOWLEDGE_BASE = {
  haftung: {
    einzelunternehmen: "Bei einem Einzelunternehmen haftet der Inhaber mit seinem gesamten Privatvermögen. Es gibt keine Haftungsbeschränkung.",
    gmbh: "Bei einer GmbH haftet der Gesellschafter nur mit der Kapitaleinlage (begrenzte Haftung). Das Privatvermögen ist geschützt.",
    ag: "Bei einer Aktiengesellschaft haftet der Aktionär nur mit der Kapitaleinlage. Das Privatvermögen bleibt geschützt.",
    kollektiv: "Bei einer Kollektivgesellschaft (KG) haften alle Gesellschafter solidarisch mit ihrem gesamten Vermögen."
  },
  gründung: {
    einzelunternehmen: "Ein Einzelunternehmen wird gegründet, indem eine Person geschäftstätig wird. Anmeldung beim Handelsregister erforderlich, wenn bestimmte Kriterien erfüllt sind.",
    gmbh: "Eine GmbH benötigt mindestens 1 Gründer, Stammkapital von CHF 20'000 (mindestens CHF 1'000 eingezahlt), Gründungsvertrag und Anmeldung beim Handelsregister.",
    ag: "Eine AG benötigt mindestens 1 Gründer, Aktienkapital von mindestens CHF 100'000, Statuten und Anmeldung beim Handelsregister."
  },
  bilanz: {
    aktiven: "Aktiven sind das Vermögen eines Unternehmens (Umlaufvermögen wie Kasse/Bankguthaben und Anlagevermögen wie Maschinen/Immobilien).",
    passiven: "Passiven sind Schulden und Eigenkapital (Fremdkapital und Eigenkapital).",
    bilanzsumme: "Die Bilanzsumme der Aktiven muss der Bilanzsumme der Passiven entsprechen (Bilanzgleichung: Aktiva = Passiva = Eigenkapital + Fremdkapital).",
    eigenkapital: "Das Eigenkapital ist der Anteil am Unternehmen, der den Eigentümern/Gesellschaftern gehört."
  },
  erfolgsrechnung: {
    uebersicht: "Die Erfolgsrechnung zeigt die Gewinn- und Verlustrechnung eines Unternehmens über eine Periode.",
    gewinn: "Gewinn = Ertrag - Aufwand. Ein positives Ergebnis ist ein Gewinn.",
    verlust: "Verlust = Aufwand - Ertrag. Ein negatives Ergebnis ist ein Verlust.",
    margen: "Die Gewinnmarge zeigt, wie viel Prozent des Umsatzes als Gewinn übrigbleibt."
  }
};

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
  msg.style.lineHeight = "1.5";

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

// Intelligente Antwort basierend auf Knowledge Base
function generateAnswer(question, company, balance) {
  const q = question.toLowerCase();
  
  // Suche nach Schlüsselwörtern in der Frage
  for (const [category, answers] of Object.entries(KNOWLEDGE_BASE)) {
    for (const [key, answer] of Object.entries(answers)) {
      if (q.includes(key) || q.includes(category)) {
        let response = answer;
        
        // Personalisierung mit Firmendaten
        if (company) {
          response += `\n\nBei deiner Firma (${company.name}, ${company.legal}):`;
          
          if (company.legal === "Einzelunternehmen") {
            response += "\n- Du haftest mit deinem gesamten Privatvermögen.";
          } else if (company.legal === "GmbH") {
            response += "\n- Die Haftung ist auf das Stammkapital begrenzt.";
          } else if (company.legal === "AG") {
            response += "\n- Die Haftung ist auf das Aktienkapital begrenzt.";
          }
          
          if (Object.keys(balance).length > 0) {
            const totalAssets = Object.values(balance).reduce((a, b) => a + Number(b), 0);
            response += `\n- Aktuelle Bilanzsumme: CHF ${totalAssets.toLocaleString('de-CH')}`;
          }
        }
        
        return response;
      }
    }
  }
  
  // Fallback-Antwort
  return `Das ist eine interessante Frage! In der Schweiz regelt das Obligationenrecht (OR) die Rechtsformen und Haftungsfragen.\n\nBitte stelle eine spezifischere Frage zu:\n- Haftung (Einzelunternehmen, GmbH, AG)\n- Gründung von Unternehmen\n- Bilanz und Eigenkapital\n- Erfolgsrechnung und Gewinn/Verlust`;
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

  if (!company) {
    addMessage("⚠️ Keine Firma ausgewählt. Bitte wähle eine Firma aus.", "ki");
    return;
  }

  addMessage("✅ KI ist bereit! Stelle eine Frage zu Recht, Haftung oder deiner Bilanz.", "ki");

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
      // Generiere Antwort basierend auf Knowledge Base
      const answer = generateAnswer(question, company, balance);
      
      loading.remove();
      addMessage(answer, "ki");

      chatHistory.push({ role: "user", content: question });
      chatHistory.push({ role: "assistant", content: answer });

    } catch (err) {
      loading.remove();
      console.error("❌ Fehler:", err);
      addMessage(`❌ Fehler: ${err.message}`, "ki");
    }
  };

  document.getElementById("rechtQuestion").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("askBtn").click();
    }
  });
});
