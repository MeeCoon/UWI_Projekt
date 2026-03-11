// ====================================
// booking-ki-generator.js
// Generiert viele Buchungstatsachen
// ====================================

document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("kiGenerateBtn");
  const tableBody = document.getElementById("bookingTableBody");
  const factField = document.getElementById("fact");
  const activeTaskId = document.getElementById("activeTaskId");
  const addBookingBtn = document.getElementById("addBookingBtn");

  // -------------------------
  // Aktuelles Jahr
  // -------------------------
  function getSelectedYear() {
    const active = document.querySelector(".yearBtn.active");
    if (active) return active.textContent.trim();
    return new Date().getFullYear().toString();
  }

  // -------------------------
  // Storage-Key
  // -------------------------
  function storageKey(year) {
    return "uwi-ki-tasks-" + year;
  }

  // -------------------------
  // Firmenliste
  // -------------------------
  const companyNames = [
    "Nova AG",
    "Helvetia GmbH",
    "Alpenblick AG",
    "Sonnenberg GmbH",
    "BergTech AG",
    "Seeland GmbH",
    "ProTrade AG",
    "Meyer & Co",
    "Urban Systems AG"
  ];

  // -------------------------
  // Buchungsvorlagen
  // -------------------------
  const templates = [

    "Die {firma} kauft Mobiliar für {betrag} CHF gegen Bank.",
    "Die {firma} kauft ein Fahrzeug für {betrag} CHF und bezahlt per Bank.",
    "Die {firma} kauft Maschinen für {betrag} CHF gegen Bank.",
    "Die {firma} kauft Handelswaren für {betrag} CHF auf Rechnung.",
    "Die {firma} bezahlt eine Lieferantenrechnung über {betrag} CHF per Bank.",
    "Die {firma} verkauft Waren bar für {betrag} CHF.",
    "Die {firma} verkauft Waren auf Rechnung für {betrag} CHF.",
    "Ein Kunde bezahlt eine offene Rechnung von {betrag} CHF per Bank.",
    "Die {firma} bezahlt Büromaterial von {betrag} CHF per Bank.",
    "Die {firma} bezahlt die Miete von {betrag} CHF per Bank.",
    "Die {firma} bezahlt Löhne von {betrag} CHF per Bank.",
    "Der Eigentümer legt {betrag} CHF auf das Bankkonto der {firma} ein.",
    "Die {firma} nimmt ein Bankdarlehen über {betrag} CHF auf.",
    "Die {firma} zahlt ein Darlehen über {betrag} CHF per Bank zurück.",
    "Die {firma} kauft Wertschriften für {betrag} CHF gegen Bank.",
    "Die {firma} erhält Zinsen auf dem Bankkonto von {betrag} CHF.",
    "Die {firma} bezahlt Versicherungen von {betrag} CHF per Bank.",
    "Die {firma} kauft Computer für {betrag} CHF bar.",
    "Die {firma} verkauft ein altes Fahrzeug für {betrag} CHF und erhält eine Bankgutschrift.",
    "Die {firma} tätigt eine Abschreibung auf Maschinen von {betrag} CHF."
  ];

  // -------------------------
  // Zufallsbetrag
  // -------------------------
  function randomAmount() {
    return (Math.floor(Math.random() * 90) + 10) * 100;
  }

  // -------------------------
  // Zufallsfirma
  // -------------------------
  function randomCompany() {
    return companyNames[Math.floor(Math.random() * companyNames.length)];
  }

  // -------------------------
  // Generator
  // -------------------------
  function generateTasks(year) {

    const tasks = [];

    for (let i = 1; i <= 100; i++) {

      const template =
        templates[Math.floor(Math.random() * templates.length)];

      const amount = randomAmount();
      const company = randomCompany();

      const fact = template
        .replace("{firma}", company)
        .replace("{betrag}", amount.toLocaleString("de-CH"));

      tasks.push({
        id: year + "-" + i,
        fact: fact,
        status: "open"
      });
    }

    localStorage.setItem(storageKey(year), JSON.stringify(tasks));
    return tasks;
  }

  // -------------------------
  // Laden
  // -------------------------
  function loadTasks(year) {
    const raw = localStorage.getItem(storageKey(year));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // -------------------------
  // Tabelle anzeigen
  // -------------------------
  function renderTable(tasks) {

    tableBody.innerHTML = "";

    tasks.forEach((t, index) => {

      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const statusIcon =
        t.status === "done" ? "✅ erledigt" : "⏳ offen";

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${t.fact}</td>
        <td>${statusIcon}</td>
      `;

      tr.addEventListener("click", () => {
        activeTaskId.value = t.id;
        factField.value = t.fact;
      });

      tableBody.appendChild(tr);
    });
  }

  // -------------------------
  // Initial laden
  // -------------------------
  function initForYear() {

    const year = getSelectedYear();
    let tasks = loadTasks(year);

    if (!tasks) {
      tasks = generateTasks(year);
    }

    renderTable(tasks);
  }

  initForYear();

  // -------------------------
  // Neu generieren
  // -------------------------
  generateBtn.addEventListener("click", () => {

    const year = getSelectedYear();
    const tasks = generateTasks(year);

    renderTable(tasks);

  });

  // -------------------------
  // Jahr wechseln
  // -------------------------
  document.addEventListener("click", (e) => {

    if (e.target.classList.contains("yearBtn")) {
      setTimeout(initForYear, 100);
    }

  });

  // -------------------------
  // Beim Buchen: Aufgabe erledigt
  // -------------------------
  addBookingBtn.addEventListener("click", () => {

    const year = getSelectedYear();
    const id = activeTaskId.value;

    if (!id) {
      alert("Wähle zuerst eine Buchungstatsache.");
      return;
    }

    let tasks = loadTasks(year);
    if (!tasks) return;

    const task = tasks.find(t => t.id === id);

    if (task) {
      task.status = "done";
      localStorage.setItem(storageKey(year), JSON.stringify(tasks));
      renderTable(tasks);
    }

  });

});
