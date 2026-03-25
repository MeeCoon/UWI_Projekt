const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const journalKey = (cid, year) => `uwi_journal_${cid}_${year}`;
const yearsKey = (cid) => `uwi_years_${cid}`;

const DEFAULT_YEARS = ["2024","2025","2026"];
let currentYear = DEFAULT_YEARS[0];

// ===== KMU KONTENPLAN =====
const KONTENPLAN = [
  // Umlaufsvermögen
  {no:"1000", name:"Kasse"},
  {no:"1020", name:"Bankguthaben"},
  {no:"1060", name:"Wertschriften (Aktien)"},
  {no:"1100", name:"Forderungen aus Lieferungen und Leistungen"},
  {no:"1170", name:"Vorsteuer MWST"},
  {no:"1200", name:"Handelswaren"},
  {no:"1210", name:"Rohstoffe"},
  {no:"1300", name:"Aktive Rechnungsabgrenzung"},
  // Anlagevermögen
  {no:"1400", name:"Wertschriften (Obligationen)"},
  {no:"1480", name:"Beteiligungen"},
  {no:"1500", name:"Maschinen & Apparate"},
  {no:"1510", name:"Mobiliar"},
  {no:"1530", name:"Fahrzeuge"},
  {no:"1600", name:"Geschäftsliegenschaften"},
  {no:"1520", name:"Büromaschinen"},
  {no:"1700", name:"Patente, Lizenzen"},
  // Kurzfristiges Fremdkapital
  {no:"2000", name:"Verbindlichkeiten aus Lieferungen und Leistungen"},
  {no:"2100", name:"Bankverbindlichkeiten"},
  {no:"2200", name:"Geschuldete MWST"},
  {no:"2300", name:"Passive Rechnungsabgrenzung"},
  // Langfristiges Fremdkapital
  {no:"2450", name:"Darlehen"},
  {no:"2451", name:"Hypotheken"},
  {no:"2600", name:"Rückstellungen"},
  // Eigenkapital
  {no:"2800", name:"Eigenkapital"},
  {no:"2979", name:"Jahresgewinn / Jahresverlust"},
  {no:"2850", name:"Privat"},
  {no:"2800", name:"Aktienkapital"},
  {no:"2950", name:"Reserven"},
  {no:"2970", name:"Gewinnvortrag"},
  // Aufwand
  {no:"4000", name:"Materialaufwand"},
  {no:"4200", name:"Handelswarenaufwand"},
  {no:"5000", name:"Lohnaufwand"},
  {no:"5700", name:"Sozialversicherungsaufwand"},
  {no:"5800", name:"Übriger Personalaufwand"},
  {no:"6000", name:"Raumaufwand"},
  {no:"6100", name:"Unterhalt, Reparaturen, Ersatz"},
  {no:"6200", name:"Fahrzeugaufwand"},
  {no:"6300", name:"Versicherungsaufwand"},
  {no:"6400", name:"Energie- und Entsorgungsaufwand"},
  {no:"6500", name:"Verwaltungsaufwand"},
  {no:"6600", name:"Werbeaufwand"},
  {no:"6700", name:"Sonstiger Betriebsaufwand"},
  {no:"6800", name:"Abschreibungen"},
  {no:"6900", name:"Finanzaufwand"},
  {no:"7510", name:"Aufwand betriebliche Liegenschaft"},
  {no:"8500", name:"Ausserordentlicher Aufwand"},
  // Erlös
  {no:"3000", name:"Produktionserlöse"},
  {no:"3200", name:"Handelserlöse"},
  {no:"3400", name:"Dienstleistungserlöse"},
  {no:"3805", name:"Verluste aus Forderungen"},
  {no:"6950", name:"Finanzertrag"},
  {no:"7500", name:"Ertrag betriebliche Liegenschaft"},
  {no:"8510", name:"Ausserordentlicher Ertrag"}
];

// =======================
// ACCOUNT OPTIONS
// =======================
function buildAccountOptions() {
  return [
    `<option value="">— Konto wählen —</option>`,
    ...KONTENPLAN.map(a =>
      `<option value="${a.no}">${a.no} ${a.name}</option>`
    )
  ].join("");
}

// =======================
// STORAGE
// =======================
function loadJournal(cid, year) {
  return JSON.parse(localStorage.getItem(journalKey(cid, year)) || "[]");
}

function saveJournal(cid, year, data) {
  localStorage.setItem(journalKey(cid, year), JSON.stringify(data));
}

function getYears(cid) {
  try {
    const y = JSON.parse(localStorage.getItem(yearsKey(cid)));
    if (Array.isArray(y) && y.length) return y;
  } catch {}
  return [...DEFAULT_YEARS];
}

function saveYears(cid, years) {
  localStorage.setItem(yearsKey(cid), JSON.stringify(years));
}

// =======================
// YEAR TABS
// =======================
function renderYearTabs(cid) {
  const el = document.getElementById("yearTabs");
  if (!el) return;

  const years = getYears(cid);
  if (!years.includes(currentYear)) currentYear = years[0];

  el.innerHTML =
    years.map(y =>
      `<button class="yearBtn ${y===currentYear?"active":""}" data-year="${y}">${y}</button>`
    ).join("") +
    `<button id="addYearBtn" class="addYearBtn">+ Jahr hinzufügen</button>`;

  el.onclick = e => {
    const btn = e.target.closest(".yearBtn");
    if (!btn) return;

    currentYear = btn.dataset.year;
    renderYearTabs(cid);
    renderJournal(cid);
  };

  document.getElementById("addYearBtn").onclick = () => {
    const y = prompt("Neues Jahr (z.B. 2027)");
    if (!y) return;
    if (!/^\d{4}$/.test(y)) return alert("Ungültiges Jahr");

    const list = getYears(cid);
    if (list.includes(y)) return alert("Jahr existiert");

    list.push(y);
    list.sort();
    saveYears(cid, list);

    currentYear = y;
    renderYearTabs(cid);
    renderJournal(cid);
  };
}

// =======================
// SPLIT LINES
// =======================
function createLine(side) {
  const row = document.createElement("div");
  row.dataset.side = side;

  row.style.display = "flex";
  row.style.gap = "8px";
  row.style.flexWrap = "wrap";
  row.style.width = "100%";

  const select = document.createElement("select");
  select.innerHTML = buildAccountOptions();
  select.style.flex = "2 1 200px";
  select.style.minWidth = "0";

  const amount = document.createElement("input");
  amount.type = "number";
  amount.placeholder = "Betrag";
  amount.style.flex = "1 1 100px";
  amount.style.minWidth = "0";

  const remove = document.createElement("button");
  remove.textContent = "✕";
  remove.className = "btn";
  remove.style.flex = "0 0 auto";
  remove.onclick = () => row.remove();

  row.append(select, amount, remove);
  return row;
}

function getLines(side) {
  const root = document.getElementById(
    side==="debit" ? "debitLines" : "creditLines"
  );

  return Array.from(root.querySelectorAll("div[data-side]"))
    .map(line => {
      const sel = line.querySelector("select");
      const inp = line.querySelector("input");

      return {
        accountNo: sel.value,
        amount: Number(inp.value || 0)
      };
    })
    .filter(x => x.accountNo && x.amount > 0);
}

function sum(arr) {
  return arr.reduce((a, b) => a + b.amount, 0);
}

// =======================
// JOURNAL RENDER
// =======================
function renderJournal(cid) {
  const rows = loadJournal(cid, currentYear)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const body = document.getElementById("journalBody");
  if (!body) return;
  body.innerHTML = "";

  rows.forEach((r, i) => {
    const debit = r.debits.map(d => d.accountNo).join(",");
    const credit = r.credits.map(c => c.accountNo).join(",");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(r.date).toLocaleDateString()}</td>
      <td>${r.fact}</td>
      <td>${debit}</td>
      <td>${credit}</td>
      <td>${r.total} CHF</td>
      <td>
        <button class="btn deleteBooking" data-i="${i}">🗑</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

// =======================
// DELETE BOOKING
// =======================
document.addEventListener("click", e => {
  if (!e.target.classList.contains("deleteBooking")) return;

  const index = e.target.dataset.i;
  const user = localStorage.getItem(USER_KEY);
  const cid = localStorage.getItem(`${CURRENT_COMPANY_PREFIX}${user}`);

  const list = loadJournal(cid, currentYear);
  list.splice(index, 1);
  saveJournal(cid, currentYear, list);
  renderJournal(cid);
});

// =======================
// GENERATE 100 CASES
// =======================
function generate100Cases(companyId, year, companyType) {
  const journal = loadJournal(companyId, year) || [];

  // Alte automatisch generierte Einträge für dieses Jahr entfernen
  const filteredJournal = journal.filter(j => !j.generatedByKI);

  const newEntries = [];
  for (let i = 0; i < 100; i++) {
    const amount = Math.floor(Math.random() * 1000 + 100);
    const debits = [{accountNo:"1000", amount}];
    const credits = [{accountNo:"3000", amount}];

    newEntries.push({
      type: "split",
      fact: `KI Buchung ${i+1}`,
      debits,
      credits,
      total: amount,
      date: new Date().toISOString(),
      year,
      generatedByKI: true
    });
  }

  saveJournal(companyId, year, [...filteredJournal, ...newEntries]);
  return newEntries.length;
}

document.getElementById("generateCasesBtn")?.addEventListener("click", () => {
  const user = localStorage.getItem(USER_KEY);
  const companyId = localStorage.getItem(`${CURRENT_COMPANY_PREFIX}${user}`);

  const companies = JSON.parse(
    localStorage.getItem(`uwi_companies_${user}`) || "[]"
  );
  const company = companies.find(c => c.id === companyId);
  if(!company) return alert("Firma nicht gefunden.");

  const count = generate100Cases(companyId, currentYear, company.type);
  renderJournal(companyId);
  alert(count + " Buchungen im Journal gespeichert.");
});

// =======================
// INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem(USER_KEY);
  if (!user) { location.href = "index.html"; return; }

  const cid = localStorage.getItem(`${CURRENT_COMPANY_PREFIX}${user}`);
  if (!cid) return;

  renderYearTabs(cid);

  document.getElementById("debitLines").append(createLine("debit"));
  document.getElementById("creditLines").append(createLine("credit"));

  document.getElementById("addDebitLineBtn").onclick = () => {
    document.getElementById("debitLines").append(createLine("debit"));
  };

  document.getElementById("addCreditLineBtn").onclick = () => {
    document.getElementById("creditLines").append(createLine("credit"));
  };

  document.getElementById("addBookingBtn").onclick = () => {
    const fact = document.getElementById("fact").value.trim();
    const debits = getLines("debit");
    const credits = getLines("credit");

    if (!fact) return alert("Buchungstatsache fehlt");
    if (sum(debits) !== sum(credits)) return alert("Soll ≠ Haben");

    const entry = {
      type: "split",
      fact,
      debits,
      credits,
      year: currentYear,
      total: sum(debits),
      date: new Date().toISOString()
    };

    const list = loadJournal(cid, currentYear);
    list.push(entry);
    saveJournal(cid, currentYear, list);

    document.getElementById("fact").value = "";
    document.getElementById("debitLines").innerHTML = "";
    document.getElementById("creditLines").innerHTML = "";
    document.getElementById("debitLines").append(createLine("debit"));
    document.getElementById("creditLines").append(createLine("credit"));

    renderJournal(cid);
    alert(`Gebucht in ${currentYear}`);
  };

  document.getElementById("backBtn").onclick = () => {
    location.href = "company.html";
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(USER_KEY);
    location.href = "index.html";
  };

  renderJournal(cid);
});
