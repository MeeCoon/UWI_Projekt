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
    "Die {firma} verbucht Verluste aus Forderungen von {betrag} CHF.",
    "Die {firma} kassiert einen Abschreibungsbetrag auf Debitoren von {betrag} CHF.",
    "Die {firma} korrigiert eine Umsatzsteuerüberzahlung von {betrag} CHF.",
    "Die {firma} schreibt uneinbringliche Forderungen endgültig ab für {betrag} CHF.",
    "Die {firma} macht eine aktive Rechnungsabgrenzung für Aufwand von {betrag} CHF.",
    "Die {firma} löst eine passive Rechnungsabgrenzung für Ertrag über {betrag} CHF auf.",
    "Die {firma} bucht periodengerechten Aufwand (Rechnungsabgrenzung) von {betrag} CHF.",
    "Die {firma} bucht periodengerechten Ertrag (Rechnungsabgrenzung) von {betrag} CHF.",
    "Die {firma} bucht direkte Abschreibung auf Mobiliar von {betrag} CHF.",
    "Die {firma} bucht indirekte Abschreibung auf Fahrzeuge von {betrag} CHF.",
    "Die {firma} korrigiert indirekte Abschreibung auf Maschinen um {betrag} CHF.",
    "Die {firma} bezahlt Spesen für Mitarbeitende von {betrag} CHF per Bank.",
    "Die {firma} schreibt Familienzulagen als Personalaufwand von {betrag} CHF ab.",
    "Die {firma} zahlt Weihnachtsgratifikation von {betrag} CHF an Personal.",
    "Die {firma} überweist Sozialversicherungsbeiträge von {betrag} CHF per Bank.",
    "Die {firma} bucht Überstundenvergütungen von {betrag} CHF als Aufwand.",
    "Der Einzelunternehmer entnimmt Waren für private Nutzung im Wert von {betrag} CHF.",
    "Der Einzelunternehmer entnimmt Geld aus der Kasse zur privaten Nutzung von {betrag} CHF.",
    "Der Einzelunternehmer tätigt eine Privateinlage von {betrag} CHF auf das Bankkonto.",
    "Die {firma} schreibt Dividenden an Aktionäre von {betrag} CHF aus.",
    "Die {firma} überweist Dividenden an Aktionäre von {betrag} CHF per Bank.",
    "Die {firma} zahlt gesetzliche Reserven an Gewinnvortrag von {betrag} CHF.",
    "Die {firma} bucht Agio aus Aktienkapitalerhöhung von {betrag} CHF.",
    "Die {firma} schreibt Rückstellungen für Pensionsverpflichtungen von {betrag} CHF ab.",
    "Die {firma} realisiert einen Kursgewinn aus Wertschriften von {betrag} CHF.",
    "Die {firma} realisiert einen Kursverlust aus Wertschriften von {betrag} CHF.",
    "Die {firma} bucht Verrechnungssteuer auf Erträge von {betrag} CHF.",
    "Die {firma} erhält Dividenden aus Wertschriften von {betrag} CHF per Bank.",
    "Die {firma} verkauft Wertschriften und verbucht Depotgebühren von {betrag} CHF.",
    "Die {firma} kauft ein Gebäude für {betrag} CHF gegen Bank.",
    "Die {firma} verkauft eine Liegenschaft für {betrag} CHF und erhält Bankgutschrift.",
    "Die {firma} bezahlt Unterhaltskosten für Liegenschaft von {betrag} CHF per Bank.",
    "Die {firma} erneuert eine Liegenschaft (Bauteile) für {betrag} CHF per Bank.",
    "Die {firma} schreibt Abschreibungen auf Liegenschaft von {betrag} CHF.",
    "Die {firma} erhält Mietzinseinnahmen von {betrag} CHF auf Bank.",
    "Die {firma} bezahlt Mietzinsen für Geschäftsräume von {betrag} CHF per Bank.",
    "Die {firma} verbucht Handänderungssteuer auf Immobilienkauf von {betrag} CHF.",
    "Die {firma} bucht Werbeaufwand von {betrag} CHF.",
    "Die {firma} bucht Reisekosten als Aufwand von {betrag} CHF.",
    "Die {firma} erhält Beratungserlöse von {betrag} CHF per Bank.",
    "Die {firma} schreibt Bildungsaufwand von {betrag} CHF als Aufwand.",
    "Die {firma} erhält Mietzins von {betrag} CHF per Bank.",
    "Die {firma} bezahlt Lizenzkosten von {betrag} CHF per Bank.",
    "Die {firma} schreibt Energiekosten von {betrag} CHF ab.",
    "Die {firma} bezahlt Telekommunikationskosten von {betrag} CHF per Bank.",
    "Die {firma} hebt Bargeld von der Bank im Betrag von {betrag} CHF ab.",
    "Die {firma} zahlt Bargeld in die Kasse ein über {betrag} CHF.",
    "Die {firma} tätigt Bankspesen von {betrag} CHF.",
    "Die {firma} schreibt Kassenfehlbetrag von {betrag} CHF ab.",
    "Die {firma} bucht Bankgutschrift aus Zinszahlung von {betrag} CHF.",
    "Die {firma} gewährt einem Kunden Skonto von {betrag} CHF auf Rechnung.",
    "Die {firma} erhält Gutschrift vom Lieferanten über {betrag} CHF.",
    "Die {firma} schreibt verzugszinsen von Debitoren von {betrag} CHF ab.",
    "Die {firma} bucht Lieferantenskonto von {betrag} CHF als Aufwand."
  ];

  /* =========================
     BRANCHEN-TEMPLATES
  ========================= */
  const industryTemplates = {
    Handel: [
      "Die {firma} verkauft Handelswaren gegen Rechnung für {betrag} CHF.",
      "Die {firma} kauft Handelswaren auf Rechnung für {betrag} CHF.",
      "Die {firma} erhält Zahlung für Warenverkäufe über {betrag} CHF per Bank.",
      "Die {firma} gewährt Kunden Rabatt von {betrag} CHF auf Warenverkauf."
    ],

    Produktion: [
      "Die {firma} kauft Rohstoffe für {betrag} CHF auf Rechnung.",
      "Die {firma} produziert und verkauft eigene Produkte für {betrag} CHF.",
      "Die {firma} bezahlt Produktionslöhne von {betrag} CHF per Bank.",
      "Die {firma} verbraucht Material im Wert von {betrag} CHF."
    ],

    Dienstleistung: [
      "Die {firma} erbringt eine Dienstleistung und stellt {betrag} CHF in Rechnung.",
      "Die {firma} erhält Zahlung für Dienstleistungen über {betrag} CHF.",
      "Die {firma} kauft Software für {betrag} CHF zur Leistungserbringung.",
      "Die {firma} bezahlt Büromiete von {betrag} CHF per Bank."
    ]
  };

  /* =========================
     GENERATOR
  ========================= */
  function generateTasks(year) {
    const tasks = [];

    const industry = company.industry;

    for (let i = 1; i <= 100; i++) {

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
