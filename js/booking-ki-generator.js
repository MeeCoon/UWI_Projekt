// ====================================
// booking-ki-generator.js
// KI-Buchungstatsachen für Tabelle
// ====================================

document.addEventListener("DOMContentLoaded", () => {

  const generateBtn = document.getElementById("generateCasesBtn");
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
  // Storage-Key für Jahr
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

  // — Basis & Handelsbetrieb
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
  "Die {firma} tätigt eine Abschreibung auf Maschinen von {betrag} CHF.",

  // — Forderungsverluste & Umsatzkorrekturen
  "Die {firma} verbucht Verluste aus Forderungen von {betrag} CHF.",
  "Die {firma} kassiert einen Abschreibungsbetrag auf Debitoren von {betrag} CHF.",
  "Die {firma} korrigiert eine Umsatzsteuerüberzahlung von {betrag} CHF.",
  "Die {firma} schreibt uneinbringliche Forderungen endgültig ab für {betrag} CHF.",

  // — Rechnungsabgrenzungen
  "Die {firma} macht eine aktive Rechnungsabgrenzung für Aufwand von {betrag} CHF.",
  "Die {firma} löst eine passive Rechnungsabgrenzung für Ertrag über {betrag} CHF auf.",
  "Die {firma} bucht periodengerechten Aufwand (Rechnungsabgrenzung) von {betrag} CHF.",
  "Die {firma} bucht periodengerechten Ertrag (Rechnungsabgrenzung) von {betrag} CHF.",

  // — Abschreibungen (direkt & indirekt)
  "Die {firma} bucht direkte Abschreibung auf Mobiliar von {betrag} CHF.",
  "Die {firma} bucht indirekte Abschreibung auf Fahrzeuge von {betrag} CHF.",
  "Die {firma} korrigiert indirekte Abschreibung auf Maschinen um {betrag} CHF.",

  // — Personalaufwand & Nebenkosten
  "Die {firma} bezahlt Spesen für Mitarbeitende von {betrag} CHF per Bank.",
  "Die {firma} schreibt Familienzulagen als Personalaufwand von {betrag} CHF ab.",
  "Die {firma} zahlt Weihnachtsgratifikation von {betrag} CHF an Personal.",
  "Die {firma} überweist Sozialversicherungsbeiträge von {betrag} CHF per Bank.",
  "Die {firma} bucht Überstundenvergütungen von {betrag} CHF als Aufwand.",

  // — Spezifisch Einzelunternehmen
  "Der Einzelunternehmer entnimmt Waren für private Nutzung im Wert von {betrag} CHF.",
  "Der Einzelunternehmer entnimmt Geld aus der Kasse zur privaten Nutzung von {betrag} CHF.",
  "Der Einzelunternehmer tätigt eine Privateinlage von {betrag} CHF auf das Bankkonto.",

  // — Spezifisch Aktiengesellschaft (AG)
  "Die {firma} schreibt Dividenden an Aktionäre von {betrag} CHF aus.",
  "Die {firma} überweist Dividenden an Aktionäre von {betrag} CHF per Bank.",
  "Die {firma} zahlt gesetzliche Reserven an Gewinnvortrag von {betrag} CHF.",
  "Die {firma} bucht Agio aus Aktienkapitalerhöhung von {betrag} CHF.",
  "Die {firma} schreibt Rückstellungen für Pensionsverpflichtungen von {betrag} CHF ab.",

  // — Wertschriften & Finanzen
  "Die {firma} realisiert einen Kursgewinn aus Wertschriften von {betrag} CHF.",
  "Die {firma} realisiert einen Kursverlust aus Wertschriften von {betrag} CHF.",
  "Die {firma} bucht Verrechnungssteuer auf Erträge von {betrag} CHF.",
  "Die {firma} erhält Dividenden aus Wertschriften von {betrag} CHF per Bank.",
  "Die {firma} verkauft Wertschriften und verbucht Depotgebühren von {betrag} CHF.",

  // — Liegenschaften & Immobilien
  "Die {firma} kauft ein Gebäude für {betrag} CHF gegen Bank.",
  "Die {firma} verkauft eine Liegenschaft für {betrag} CHF und erhält Bankgutschrift.",
  "Die {firma} bezahlt Unterhaltskosten für Liegenschaft von {betrag} CHF per Bank.",
  "Die {firma} erneuert eine Liegenschaft (Bauteile) für {betrag} CHF per Bank.",
  "Die {firma} schreibt Abschreibungen auf Liegenschaft von {betrag} CHF.",
  "Die {firma} erhält Mietzinseinnahmen von {betrag} CHF auf Bank.",
  "Die {firma} bezahlt Mietzinsen für Geschäftsräume von {betrag} CHF per Bank.",
  "Die {firma} verbucht Handänderungssteuer auf Immobilienkauf von {betrag} CHF.",

  // — Aufwand & Ertrag allgemein
  "Die {firma} bucht Werbeaufwand von {betrag} CHF.",
  "Die {firma} bucht Reisekosten als Aufwand von {betrag} CHF.",
  "Die {firma} erhält Beratungserlöse von {betrag} CHF per Bank.",
  "Die {firma} schreibt Bildungsaufwand von {betrag} CHF als Aufwand.",
  "Die {firma} erhält Mietzins von {betrag} CHF per Bank.",
  "Die {firma} bezahlt Lizenzkosten von {betrag} CHF per Bank.",
  "Die {firma} schreibt Energiekosten von {betrag} CHF ab.",
  "Die {firma} bezahlt Telekommunikationskosten von {betrag} CHF per Bank.",

  // — Bank & Kasse
  "Die {firma} hebt Bargeld von der Bank im Betrag von {betrag} CHF ab.",
  "Die {firma} zahlt Bargeld in die Kasse ein über {betrag} CHF.",
  "Die {firma} tätigt Bankspesen von {betrag} CHF.",
  "Die {firma} schreibt Kassenfehlbetrag von {betrag} CHF ab.",
  "Die {firma} bucht Bankgutschrift aus Zinszahlung von {betrag} CHF.",

  // — Debitoren & Kreditoren
  "Die {firma} gewährt einem Kunden Skonto von {betrag} CHF auf Rechnung.",
  "Die {firma} erhält Gutschrift vom Lieferanten über {betrag} CHF.",
  "Die {firma} schreibt verzugszinsen von Debitoren von {betrag} CHF ab.",
  "Die {firma} bucht Lieferantenskonto von {betrag} CHF als Aufwand."

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
  // Buchungstatsachen generieren
  // -------------------------
  function generateTasks(year) {
    const tasks = [];

    for (let i = 1; i <= 100; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
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

    // Optional: lokal speichern, falls Seite neu geladen wird
    localStorage.setItem(storageKey(year), JSON.stringify(tasks));
    return tasks;
  }

  // -------------------------
  // Tabelle rendern
  // -------------------------
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

  // -------------------------
  // Initial laden
  // -------------------------
  window.initKICasesForYear = function () {
    const year = getSelectedYear();
    let tasks = JSON.parse(localStorage.getItem(storageKey(year)) || "[]");

    renderTable(tasks);
  }

  window.initKICasesForYear();

  // -------------------------
  // Button: 100 Buchungstatsachen generieren
  // -------------------------
  generateBtn.addEventListener("click", () => {
    const year = getSelectedYear();
    const tasks = generateTasks(year); // erstellt 100 Fälle
    renderTable(tasks); // direkt in Tabelle anzeigen
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

    const tasks = JSON.parse(localStorage.getItem(storageKey(year)) || "[]");
    const task = tasks.find(t => t.id === id);

    if (task) {
      task.status = "done";
      localStorage.setItem(storageKey(year), JSON.stringify(tasks));
      renderTable(tasks);
    }
  });

});
