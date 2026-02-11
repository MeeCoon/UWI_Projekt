// ===============================
// booking-ki-test.js  (VOLLVERSION)
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("kiGenerateBtn");
  const tableBody = document.getElementById("bookingTableBody");
  const factField = document.getElementById("fact");
  const activeTaskId = document.getElementById("activeTaskId");
  const addBookingBtn = document.getElementById("addBookingBtn");

  // -----------------------------
  // Hilfsfunktion: aktuelles Jahr
  // -----------------------------
  function getSelectedYear() {
    const active = document.querySelector(".yearTabs .active");
    if (active) return active.textContent.trim();
    return new Date().getFullYear().toString();
  }

  // -----------------------------
  // Speicher-Key pro Jahr
  // -----------------------------
  function storageKey(year) {
    return "uwi-ki-tasks-" + year;
  }

  // -----------------------------
  // Beispiel-Generator (Test-KI)
  // -----------------------------
  function generateTestTasks(year) {

    const bases = [
      "Kauf Mobiliar gegen Bank",
      "Kauf Fahrzeug gegen Bank",
      "Kauf Maschine gegen Bank",
      "Bezug Waren auf Rechnung",
      "Bezahlung Lieferant via Bank",
      "Aufnahme Darlehen auf Bank",
      "Tilgung Darlehen über Bank",
      "Barverkauf über Kasse",
      "Einlage Eigentümer auf Bank",
      "Kauf Wertschriften gegen Bank",
      "Bezug Büromaterial gegen Bank",
      "Bezahlung Miete via Bank",
      "Erhalt Darlehen auf Bank",
      "Kauf Geschäftsfahrzeug gegen Bank",
      "Rückzahlung Hypothek über Bank"
    ];

    const tasks = [];

    for (let i = 1; i <= 50; i++) {
      const base = bases[Math.floor(Math.random() * bases.length)];
      const amount = (Math.floor(Math.random() * 90) + 10) * 100; // 1'000 - 9'000

      tasks.push({
        id: year + "-" + i,
        fact: base + " " + amount.toLocaleString("de-CH") + " CHF",
        status: "open"
      });
    }

    localStorage.setItem(storageKey(year), JSON.stringify(tasks));
    return tasks;
  }

  // -----------------------------
  // Laden aus Speicher
  // -----------------------------
  function loadTasks(year) {
    const raw = localStorage.getItem(storageKey(year));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  // -----------------------------
  // Tabelle rendern
  // -----------------------------
  function renderTable(tasks) {
    tableBody.innerHTML = "";

    tasks.forEach((t, index) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const statusIcon = t.status === "done" ? "✅ erledigt" : "⏳ offen";

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

  // -----------------------------
  // Beim Laden: Tasks holen
  // -----------------------------
  function initForYear() {
    const year = getSelectedYear();
    let tasks = loadTasks(year);

    if (!tasks) {
      tasks = generateTestTasks(year);
    }

    renderTable(tasks);
  }

  initForYear();

  // -----------------------------
  // Button: KI neu generieren
  // -----------------------------
  generateBtn.addEventListener("click", () => {
    const year = getSelectedYear();
    const tasks = generateTestTasks(year);
    renderTable(tasks);
  });

  // -----------------------------
  // Wenn Jahr gewechselt wird
  // -----------------------------
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("year-tab")) {
      setTimeout(initForYear, 100);
    }
  });

  // -----------------------------
  // Beim Buchen: Aufgabe abschliessen
  // -----------------------------
  addBookingBtn.addEventListener("click", () => {

    const year = getSelectedYear();
    const id = activeTaskId.value;

    if (!id) {
      alert("Wähle zuerst oben eine Aufgabe aus.");
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
