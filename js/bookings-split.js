const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const COMPANIES_PREFIX = "uwi_companies_";

const journalKey = (cid, year) => `uwi_journal_${cid}_${year}`;
const yearsKey = (cid) => `uwi_years_${cid}`;

const DEFAULT_YEARS = ["2024","2025","2026"];
let currentYear = DEFAULT_YEARS[0];

/* =========================
   USER / FIRMA
========================= */
function getUser() {
  return localStorage.getItem(USER_KEY);
}

function loadCompanies(user) {
  return JSON.parse(localStorage.getItem(`${COMPANIES_PREFIX}${user}`) || "[]");
}

function getSelectedCompany() {
  const user = getUser();
  const companies = loadCompanies(user);
  const cid = localStorage.getItem(`${CURRENT_COMPANY_PREFIX}${user}`);
  return companies.find(c => c.id === cid);
}

/* =========================
   DYNAMISCHER KONTENPLAN
========================= */
function getDynamicKontenplan(company) {

  const list = [];

  // ===== AKTIVEN =====
  list.push(
    {no:"1000", name:"Kasse"},
    {no:"1020", name:"Bankguthaben"},
    {no:"1060", name:"Wertschriften (Aktien)"},
    {no:"1100", name:"Forderungen aus Lieferungen und Leistungen"},
    {no:"1170", name:"Vorsteuer MWST"},
    {no:"1300", name:"Aktive Rechnungsabgrenzung"}
  );

  if (company.industry === "Handel") {
    list.push({no:"1200", name:"Handelswaren"});
  }

  if (company.industry === "Produktion") {
    list.push({no:"1210", name:"Rohstoffe"});
  }

  list.push(
    {no:"1400", name:"Wertschriften (Obligationen)"},
    {no:"1480", name:"Beteiligungen"},
    {no:"1500", name:"Maschinen & Apparate"},
    {no:"1510", name:"Mobiliar"},
    {no:"1530", name:"Fahrzeuge"},
    {no:"1600", name:"Geschäftsliegenschaften"}
  );

  if (company.industry === "Dienstleistung") {
    list.push(
      {no:"1520", name:"Büromaschinen"},
      {no:"1700", name:"Patente, Lizenzen"}
    );
  }

  // ===== FK =====
  list.push(
    {no:"2000", name:"Verbindlichkeiten aus Lieferungen und Leistungen"},
    {no:"2100", name:"Bankverbindlichkeiten"},
    {no:"2200", name:"Geschuldete MWST"},
    {no:"2300", name:"Passive Rechnungsabgrenzung"},
    {no:"2450", name:"Darlehen"},
    {no:"2451", name:"Hypotheken"},
    {no:"2600", name:"Rückstellungen"}
  );

  // 👉 Nur AG / GmbH
  if (company.legal === "AG" || company.legal === "GmbH") {
    list.push({no:"2261", name:"Beschlossene Ausschüttungen"});
  }

  // ===== EK =====
  if (company.legal === "Einzelunternehmen") {
    list.push(
      {no:"2800", name:"Eigenkapital"},
      {no:"2850", name:"Privat"},
      {no:"2891", name:"Jahresgewinn / Jahresverlust"}
    );
  }

  if (company.legal === "GmbH") {
    list.push(
      {no:"2800", name:"Stammkapital"},
      {no:"2950", name:"Gesetzliche Gewinnreserve"},
      {no:"2960", name:"Freiwillige Gewinnreserven"},
      {no:"2970", name:"Gewinnvortrag"},
      {no:"2979", name:"Jahresgewinn / Jahresverlust"}
    );
  }

  if (company.legal === "AG") {
    list.push(
      {no:"2800", name:"Aktienkapital"},
      {no:"2950", name:"Gesetzliche Gewinnreserve"},
      {no:"2960", name:"Freiwillige Gewinnreserven"},
      {no:"2970", name:"Gewinnvortrag"},
      {no:"2979", name:"Jahresgewinn / Jahresverlust"}
    );
  }

  // ===== AUFWAND =====
  list.push(
    {no:"4000", name:"Materialaufwand"},
    {no:"4200", name:"Handelswarenaufwand"},
    {no:"5000", name:"Lohnaufwand"},
    {no:"5700", name:"Sozialversicherungsaufwand"},
    {no:"6000", name:"Raumaufwand"},
    {no:"6300", name:"Versicherungsaufwand"},
    {no:"6500", name:"Verwaltungsaufwand"},
    {no:"6600", name:"Werbeaufwand"},
    {no:"6800", name:"Abschreibungen"},
    {no:"6900", name:"Finanzaufwand"}
  );

  // ===== ERTRAG =====
  if (company.industry === "Handel") {
    list.push({no:"3200", name:"Handelserlöse"});
  }
  if (company.industry === "Produktion") {
    list.push({no:"3000", name:"Produktionserlöse"});
  }
  if (company.industry === "Dienstleistung") {
    list.push({no:"3400", name:"Dienstleistungserlöse"});
  }

  list.push({no:"6950", name:"Finanzertrag"});

  return list;
}

/* =======================
   ACCOUNT OPTIONS
======================= */
function buildAccountOptions(company) {
  const konten = getDynamicKontenplan(company);

  return [
    `<option value="">— Konto wählen —</option>`,
    ...konten.map(a =>
      `<option value="${a.no}">${a.no} ${a.name}</option>`
    )
  ].join("");
}

/* =======================
   SPLIT LINES
======================= */
function createLine(side, company) {
  const row = document.createElement("div");
  row.dataset.side = side;

  row.style.display = "flex";
  row.style.gap = "8px";
  row.style.flexWrap = "wrap";
  row.style.width = "100%";

  const select = document.createElement("select");
  select.innerHTML = buildAccountOptions(company);
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

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", () => {

  const user = getUser();
  if (!user) return;

  const company = getSelectedCompany();
  if (!company) return;

  const cid = company.id;

  document.getElementById("debitLines")
    .append(createLine("debit", company));

  document.getElementById("creditLines")
    .append(createLine("credit", company));

  document.getElementById("addDebitLineBtn").onclick = () => {
    document.getElementById("debitLines")
      .append(createLine("debit", company));
  };

  document.getElementById("addCreditLineBtn").onclick = () => {
    document.getElementById("creditLines")
      .append(createLine("credit", company));
  };

});
