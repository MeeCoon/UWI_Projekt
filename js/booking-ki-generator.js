// ====================================
// js/booking-ki-generator.js
// Buchungstatsachen + Konten + Rechtsform
// ====================================

document.addEventListener("DOMContentLoaded", () => {
  const USER_KEY = "uwi_user";
  const COMPANIES_PREFIX = "uwi_companies_";
  const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

  const generateBtn = document.getElementById("generateCasesBtn");
  const tableBody = document.getElementById("bookingTableBody");
  const factField = document.getElementById("fact");
  const activeTaskId = document.getElementById("activeTaskId");
  const addBookingBtn = document.getElementById("addBookingBtn");

  const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
  const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
  const tasksKey = (companyId, year) => `uwi_ki_tasks_${companyId}_${year}`;
  const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;

  function getSelectedYear() {
    const active = document.querySelector(".yearBtn.active");
    if (active) return active.textContent.trim();
    return new Date().getFullYear().toString();
  }

  function getUser() {
    return localStorage.getItem(USER_KEY);
  }

  function loadCompanies(user) {
    try {
      return JSON.parse(localStorage.getItem(companiesKey(user)) || "[]");
    } catch {
      return [];
    }
  }

  function getSelectedCompany() {
    const user = getUser();
    if (!user) return null;
    const id = localStorage.getItem(currentCompanyKey(user));
    if (!id) return null;
    return loadCompanies(user).find(c => c.id === id) || null;
  }

  function loadTasks(companyId, year) {
    try {
      return JSON.parse(localStorage.getItem(tasksKey(companyId, year)) || "[]");
    } catch {
      return [];
    }
  }

  function saveTasks(companyId, year, tasks) {
    localStorage.setItem(tasksKey(companyId, year), JSON.stringify(tasks));
  }

  function loadJournal(companyId, year) {
    try {
      return JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]");
    } catch {
      return [];
    }
  }

  function saveJournal(companyId, year, rows) {
    localStorage.setItem(journalKey(companyId, year), JSON.stringify(rows));
  }

  function randomAmount() {
    return (Math.floor(Math.random() * 90) + 10) * 100;
  }

  function fmtAmount(n) {
    return Number(n).toLocaleString("de-CH");
  }

  function getTemplatesForLegal(legal) {
    const base = [
      {
        fact: "Die Firma kauft Handelswaren für {betrag} CHF auf Rechnung.",
        debit: "1200",
        credit: "2000"
      },
      {
        fact: "Die Firma bezahlt eine Lieferantenrechnung über {betrag} CHF per Bank.",
        debit: "2000",
        credit: "1020"
      },
      {
        fact: "Die Firma verkauft Waren auf Rechnung für {betrag} CHF.",
        debit: "1100",
        credit: "3200"
      },
      {
        fact: "Ein Kunde bezahlt eine offene Rechnung von {betrag} CHF per Bank.",
        debit: "1020",
        credit: "1100"
      },
      {
        fact: "Die Firma kauft Maschinen für {betrag} CHF gegen Bank.",
        debit: "1500",
        credit: "1020"
      },
      {
        fact: "Die Firma kauft Mobiliar für {betrag} CHF gegen Bank.",
        debit: "1510",
        credit: "1020"
      },
      {
        fact: "Die Firma kauft ein Fahrzeug für {betrag} CHF und bezahlt per Bank.",
        debit: "1530",
        credit: "1020"
      },
      {
        fact: "Die Firma bezahlt die Miete von {betrag} CHF per Bank.",
        debit: "6000",
        credit: "1020"
      },
      {
        fact: "Die Firma bezahlt Versicherungen von {betrag} CHF per Bank.",
        debit: "6300",
        credit: "1020"
      },
      {
        fact: "Die Firma bezahlt Werbeaufwand von {betrag} CHF per Bank.",
        debit: "6600",
        credit: "1020"
      },
      {
        fact: "Die Firma bezahlt Löhne von {betrag} CHF per Bank.",
        debit: "5000",
        credit: "1020"
      },
      {
        fact: "Die Firma kauft Wertschriften für {betrag} CHF gegen Bank.",
        debit: "1060",
        credit: "1020"
      },
      {
        fact: "Die Firma erhält Zinsen auf dem Bankkonto von {betrag} CHF.",
        debit: "1020",
        credit: "6950"
      },
      {
        fact: "Die Firma tätigt eine Abschreibung auf Maschinen von {betrag} CHF.",
        debit: "6800",
        credit: "1500"
      },
      {
        fact: "Die Firma verbucht Verluste aus Forderungen von {betrag} CHF.",
        debit: "3805",
        credit: "1100"
      },
      {
        fact: "Die Firma macht eine aktive Rechnungsabgrenzung für Aufwand von {betrag} CHF.",
        debit: "1300",
        credit: "6000"
      },
      {
        fact: "Die Firma bucht periodengerechten Ertrag von {betrag} CHF ab.",
        debit: "3200",
        credit: "2300"
      },
      {
        fact: "Die Firma nimmt ein Darlehen über {betrag} CHF auf.",
        debit: "1020",
        credit: "2450"
      },
      {
        fact: "Die Firma zahlt ein Darlehen über {betrag} CHF per Bank zurück.",
        debit: "2450",
        credit: "1020"
      }
    ];

    if (legal === "Einzelunternehmen") {
      return [
        ...base,
        {
          fact: "Der Eigentümer legt {betrag} CHF auf das Bankkonto der Firma ein.",
          debit: "1020",
          credit: "2800"
        },
        {
          fact: "Der Einzelunternehmer entnimmt Geld aus der Kasse zur privaten Nutzung von {betrag} CHF.",
          debit: "2850",
          credit: "1000"
        },
        {
          fact: "Der Einzelunternehmer entnimmt Waren für private Nutzung im Wert von {betrag} CHF.",
          debit: "2850",
          credit: "1200"
        },
        {
          fact: "Der Einzelunternehmer tätigt eine Privateinlage von {betrag} CHF auf das Bankkonto.",
          debit: "1020",
          credit: "2850"
        }
      ];
    }

    if (legal === "GmbH") {
      return [
        ...base,
        {
          fact: "Die Gesellschafter zahlen Stammkapital von {betrag} CHF auf das Bankkonto ein.",
          debit: "1020",
          credit: "2800"
        },
        {
          fact: "Die GmbH übernimmt Gewinnvortrag von {betrag} CHF.",
          debit: "9000",
          credit: "2970"
        }
      ];
    }

    if (legal === "AG") {
      return [
        ...base,
        {
          fact: "Die Aktionäre zahlen Aktienkapital von {betrag} CHF auf das Bankkonto ein.",
          debit: "1020",
          credit: "2800"
        },
        {
          fact: "Die AG bildet gesetzliche Reserven von {betrag} CHF.",
          debit: "2970",
          credit: "2950"
        },
        {
          fact: "Die AG übernimmt Gewinnvortrag von {betrag} CHF.",
          debit: "9000",
          credit: "2970"
        }
      ];
    }

    return base;
  }

  function generateTasks(company, year) {
    const templates = getTemplatesForLegal(company.legal);
    const tasks = [];

    for (let i = 1; i <= 25; i++) {
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const amount = randomAmount();

      tasks.push({
        id: `${year}-${i}`,
        fact: tpl.fact.replace("{betrag}", fmtAmount(amount)),
        debit: tpl.debit,
        credit: tpl.credit,
        amount,
        status: "open"
      });
    }

    saveTasks(company.id, year, tasks);
    return tasks;
  }

  function renderTable(tasks) {
    if (!tableBody) return;

    tableBody.innerHTML = "";

    tasks.forEach((t, index) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";

      const statusIcon = t.status === "done" ? "✅ erledigt" : "⏳ offen";

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${t.fact}</td>
        <td>${t.debit}</td>
        <td>${t.credit}</td>
        <td>${statusIcon}</td>
      `;

      tr.addEventListener("click", () => {
        if (activeTaskId) activeTaskId.value = t.id;
        if (factField) factField.value = t.fact;
      });

      tableBody.appendChild(tr);
    });
  }

  function initForYear() {
    const company = getSelectedCompany();
    if (!company) return;

    const year = getSelectedYear();
    const tasks = loadTasks(company.id, year);
    renderTable(tasks);
  }

  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const company = getSelectedCompany();
      if (!company) {
        alert("Keine Firma ausgewählt.");
        return;
      }

      const year = getSelectedYear();
      const tasks = generateTasks(company, year);
      renderTable(tasks);
    });
  }

  if (addBookingBtn) {
    addBookingBtn.addEventListener("click", () => {
      const company = getSelectedCompany();
      if (!company) {
        alert("Keine Firma ausgewählt.");
        return;
      }

      const year = getSelectedYear();
      const id = activeTaskId ? activeTaskId.value : "";

      if (!id) {
        alert("Wähle zuerst eine Buchungstatsache.");
        return;
      }

      const tasks = loadTasks(company.id, year);
      const task = tasks.find(t => t.id === id);

      if (!task) {
        alert("Aufgabe nicht gefunden.");
        return;
      }

      const journal = loadJournal(company.id, year);

      journal.push({
        id: `b_${Date.now()}`,
        fact: task.fact,
        debit: task.debit,
        credit: task.credit,
        amount: Number(task.amount),
        createdAt: new Date().toISOString()
      });

      saveJournal(company.id, year, journal);

      task.status = "done";
      saveTasks(company.id, year, tasks);
      renderTable(tasks);

      alert("Buchung gespeichert.");
    });
  }

  initForYear();
});
