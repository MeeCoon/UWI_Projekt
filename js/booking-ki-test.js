// ==========================================================
// TEST-KI FÜR BUCHUNGSSÄTZE (SCHRITT 1)
// Generiert 50 realistische Buchungstatsachen pro Jahr
// OHNE feste Soll/Haben-Vorgabe (Lernaufgabe für Nutzer)
// NEUE REIHENFOLGE: Text → Soll → Haben → Betrag
// ==========================================================

const TEST_TEMPLATES = [
  {
    muster: "Anschaffung von {ANLAGE} per Banküberweisung",
    kategorien: ["Anlagevermögen"],
    varianten: ["Mobiliar", "Maschinen", "Fahrzeuge", "Büromaschinen"]
  },
  {
    muster: "Verkauf von Waren auf Ziel an Kunden",
    kategorien: ["Warenhandel"],
    varianten: ["Handelswaren", "Produkte", "Fertigwaren"]
  },
  {
    muster: "Löhne wurden per Bank ausbezahlt",
    kategorien: ["Personal"],
    varianten: ["Löhne", "Gehälter", "Mitarbeitervergütung"]
  },
  {
    muster: "Bankdarlehen neu aufgenommen",
    kategorien: ["Finanzierung"],
    varianten: ["Darlehen", "Kredit", "Bankfinanzierung"]
  },
  {
    muster: "Miete der Geschäftsräume per Bank bezahlt",
    kategorien: ["Aufwand"],
    varianten: ["Miete", "Raumkosten", "Gebäudekosten"]
  }
];

// Zufallszahl im Bereich
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Zufälliges Element wählen
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Betrag realistisch formatieren
function randomBetrag() {
  const basis = [500, 1200, 3500, 7800, 12000, 25000, 42000];
  return pick(basis) + rand(0, 999);
}

// Eine einzelne Aufgabe generieren
function generateOneTask() {
  const t = pick(TEST_TEMPLATES);
  const variante = pick(t.varianten);

  let text = t.muster.replace("{ANLAGE}", variante);

  return {
    text: text,
    betrag: randomBetrag()
  };
}

// 50 Aufgaben erzeugen
function generateTasksForYear(year) {
  const tasks = [];
  for (let i = 0; i < 50; i++) {
    tasks.push({
      jahr: year,
      ...generateOneTask()
    });
  }
  return tasks;
}

// =================== IN DEINE SEITE EINHÄNGEN ===================

document.addEventListener("DOMContentLoaded", () => {

  const yearTabs = document.getElementById("yearTabs");
  const tableBody = document.getElementById("bookingTableBody");
  const btn = document.getElementById("kiGenerateBtn");

  if (!yearTabs || !tableBody || !btn) {
    console.warn("KI-Test: Elemente nicht gefunden – Datei wird nicht aktiviert.");
    return;
  }

  btn.addEventListener("click", () => {

    // Aktives Jahr lesen
    const activeYearBtn = document.querySelector(".yearBtn.active");
    const year = activeYearBtn ? activeYearBtn.dataset.year : "2024";

    // Alte Zeilen löschen
    tableBody.innerHTML = "";

    // Neue 50 Aufgaben generieren
    const tasks = generateTasksForYear(year);

    tasks.forEach((t, index) => {

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${t.text}</td>
        <td>
          <input type="text" placeholder="Soll Konto (z.B. 1510)">
        </td>
        <td>
          <input type="text" placeholder="Haben Konto (z.B. 1020)">
        </td>
        <td>${t.betrag}</td>
      `;

      tableBody.appendChild(row);
    });

    alert("50 KI-Aufgaben für Jahr " + year + " wurden erstellt.");
  });

});
