// ====================================
// booking-ki-generator.js
// KI-Buchungstatsachen für Tabelle
// ====================================

document.addEventListener("DOMContentLoaded", () => {

  const USER_KEY = "uwi_user";
  const COMPANIES_PREFIX = "uwi_companies_";

  const generateBtn = document.getElementById("generateCasesBtn");
  const tableBody = document.getElementById("bookingTableBody");
  const factField = document.getElementById("fact");
  const activeTaskId = document.getElementById("activeTaskId");
  const addBookingBtn = document.getElementById("addBookingBtn");

  /* =========================
     USER + FIRMA LADEN
  ========================= */
  function getUser() {
    return localStorage.getItem(USER_KEY);
  }

  function loadCompanies(user) {
    try {
      return JSON.parse(localStorage.getItem(`${COMPANIES_PREFIX}${user}`) || "[]");
    } catch {
      return [];
    }
  }

  function getSelectedCompany() {
    const user = getUser();
    const companies = loadCompanies(user);
    const currentId = localStorage.getItem(`uwi_currentCompany_${user}`);
    return companies.find(c => c.id === currentId);
  }

  const company = getSelectedCompany();

  if (!company) {
    console.error("Keine Firma gefunden");
    return;
  }

  /* =========================
     JAHR
  ========================= */
  function getSelectedYear() {
    const active = document.querySelector(".yearBtn.active");
    if (active) return active.textContent.trim();
    return new Date().getFullYear().toString();
  }

  function storageKey(year) {
    return "uwi-ki-tasks-" + year;
  }

  /* =========================
     BASISDATEN
  ========================= */
  const companyNames = [
    "Nova AG","Helvetia GmbH","Alpenblick AG","Sonnenberg GmbH",
    "BergTech AG","Seeland GmbH","ProTrade AG","Meyer & Co","Urban Systems AG"
  ];

  function randomCompanyName() {
    return companyNames[Math.floor(Math.random() * companyNames.length)];
  }

  function randomAmount() {
    return (Math.floor(Math.random() * 90) + 10) * 100;
  }

  /* =========================
     GENERELLE TEMPLATES
  ========================= */
   const templates = [
    "Die Firma kauft Mobiliar für {betrag} CHF gegen Bank.",
    "Die Firma kauft ein Fahrzeug für {betrag} CHF und bezahlt per Bank.",
    "Die Firma kauft Maschinen für {betrag} CHF gegen Bank.",
    "Die Firma bezahlt eine Lieferantenrechnung über {betrag} CHF per Bank.",
    "Ein Kunde bezahlt eine offene Rechnung von {betrag} CHF per Bank.",
    "Die Firma bezahlt Büromaterial von {betrag} CHF per Bank.",
    "Die Firma bezahlt die Miete von {betrag} CHF per Bank.",
    "Die Firma bezahlt Löhne von {betrag} CHF per Bank.",
    "Der Eigentümer legt {betrag} CHF auf das Bankkonto der Firma ein.",
    "Die Firma nimmt ein Darlehen über {betrag} CHF auf.",
    "Die Firma zahlt ein Darlehen über {betrag} CHF per Bank zurück.",
    "Die Firma kauft Wertschriften (Aktien) für {betrag} CHF gegen Bank.",
    "Die Firma erhält Zinsen auf dem Bankkonto von {betrag} CHF.",
    "Die Firma bezahlt Versicherungen von {betrag} CHF per Bank.",
    "Die Firma verkauft ein altes Fahrzeug für {betrag} CHF und erhält eine Bankgutschrift.",
    "Die Firma tätigt eine direkte Abschreibung auf Maschinen von {betrag} CHF.",
    "Die Firma macht eine aktive Rechnungsabgrenzung für Aufwand von {betrag} CHF.",
    "Die Firma löst eine passive Rechnungsabgrenzung für Ertrag über {betrag} CHF auf.",
    "Die Firma bucht direkte Abschreibung auf Mobiliar von {betrag} CHF.",
    "Die Firma bezahlt Spesen für Mitarbeitende von {betrag} CHF per Bank.",
    "Die Firma zahlt den Nettolohn von {betrag} CHF per Bank an Mitarbeiter aus.",
    "Die Firma verbucht Arbeitnehmerbeiträge von {betrag} CHF.",
    "Familienzulagen werden ausbezahlt {betrag} CHF.",
    "Spesen von {betrag} CHF werden als Aufwand verbucht und per Bank bezahlt.",
    "Bezogene Waren werden zum Einstandspreis von {betrag} CHF mit dem Lohn verrechnet.",
    "Die Firma verbucht die Arbeitgeberbeiträge von {betrag} CHF.",
    "Die Firma zahlt {betrag} CHF an die Ausgleichskasse.",
    "Die Firma verbucht Rückstellungen für Garantiearbeiten von {betrag} CHF.",
    "Die Firma realisiert einen Kursgewinn aus Wertschriften von {betrag} CHF.",
    "Die Firma realisiert einen Kursverlust aus Wertschriften von {betrag} CHF.",
    "Die Firma erhält eine Dividendengutschrift von {betrag} CHF. Verrechnungssteuer ist auch zu verbuchen.",
    "Die Firma verkauft Wertschriften von {betrag} CHF.",
    "Die Firma kauft ein Gebäude für {betrag} CHF gegen Bank.",
    "Die Firma verkauft eine Liegenschaft für {betrag} CHF und erhält Bankgutschrift.",
    "Die Firma bezahlt Unterhaltskosten für Liegenschaft von {betrag} CHF per Bank.",
    "Die Firma erneuert eine Liegenschaft (Bauteile) für {betrag} CHF per Bank.",
    "Die Firma schreibt Abschreibungen auf Liegenschaft von {betrag} CHF.",
    "Die Firma erhält Mietzinseinnahmen von {betrag} CHF auf Bank.",
    "Die Firma bezahlt Mietzinsen für Geschäftsräume von {betrag} CHF per Bank.",
    "Die Firma bucht Werbeaufwand von {betrag} CHF.",
    "Die Firma hebt Bargeld von der Bank im Betrag von {betrag} CHF ab.",
    "Die Firma zahlt Bargeld in die Kasse ein über {betrag} CHF.",
    "Die Firma tätigt Bankspesen von {betrag} CHF."
  ];

  /* =========================
     BRANCHEN-TEMPLATES
  ========================= */
  const industryTemplates = {
    Handel: [
      "Die Firma verkauft Handelswaren gegen Rechnung für {betrag} CHF.",
      "Die Firma kauft Handelswaren auf Rechnung für {betrag} CHF.",
      "Die Firma erhält Zahlung für Warenverkäufe über {betrag} CHF per Bank.",
      "Die Firma gewährt Kunden Rabatt von {betrag} CHF auf Warenverkauf."
    ],

    Produktion: [
      "Die Firma kauft Rohstoffe für {betrag} CHF auf Rechnung.",
      "Die Firma produziert und verkauft eigene Produkte für {betrag} CHF.",
      "Die Firma bezahlt Produktionslöhne von {betrag} CHF per Bank.",
      "Die Firma verbraucht Material im Wert von {betrag} CHF."
    ],

    Dienstleistung: [
      "Die Firma erbringt eine Dienstleistung und stellt {betrag} CHF in Rechnung.",
      "Die Firma erhält Zahlung für Dienstleistungen über {betrag} CHF.",
      "Die Firma kauft Software für {betrag} CHF zur Leistungserbringung.",
      "Die Firma bezahlt Büromiete von {betrag} CHF per Bank."
    ]
  };

  /* =========================
     GENERATOR
  ========================= */
  function generateTasks(year) {
    const tasks = [];

    const industry = company.industry;

    for (let i = 1; i <= 20; i++) {

      let pool = [...templates];

      if (industryTemplates[industry]) {
        pool = pool.concat(industryTemplates[industry]);
      }

      const template = pool[Math.floor(Math.random() * pool.length)];
      const amount = randomAmount();
      const firm = randomCompanyName();

      const fact = template
        .replace("{firma}", firm)
        .replace("{betrag}", amount.toLocaleString("de-CH"));

      tasks.push({
        id: `${year}-${Date.now()}-${i}`,
        fact,
        status: "open",
        generated: true
      });
    }

    return tasks;
  }

  /* =========================
     TABLE RENDER
  ========================= */
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

  /* =========================
     INIT
  ========================= */
  window.initKICasesForYear = function () {
    const year = getSelectedYear();
    const tasks = JSON.parse(localStorage.getItem(storageKey(year)) || "[]");
    renderTable(tasks);
  };

  setTimeout(() => window.initKICasesForYear(), 0);

  /* =========================
     GENERIEREN BUTTON
  ========================= */
  generateBtn.addEventListener("click", () => {
    const year = getSelectedYear();

    let tasks = JSON.parse(localStorage.getItem(storageKey(year)) || "[]");

    // alte generierte entfernen
    tasks = tasks.filter(t => !t.generated);

    const newTasks = generateTasks(year);

    tasks.push(...newTasks);

    localStorage.setItem(storageKey(year), JSON.stringify(tasks));
    renderTable(tasks);
  });

  /* =========================
     BUCHUNG ERLEDIGEN
  ========================= */
  addBookingBtn.addEventListener("click", () => {
    const year = getSelectedYear();
    const id = activeTaskId.value;

    if (!id) {
      alert("Wähle zuerst eine Buchung.");
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

/* =========================
   YEAR CHANGE
========================= */
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("yearBtn")) {
    setTimeout(() => {
      window.initKICasesForYear();
    }, 0);
  }
});
