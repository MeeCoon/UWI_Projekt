const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const COMPANIES_PREFIX = "uwi_companies_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;

// --- Kontonamen → Kontonummern (für deine Bilanz!) ---
const ACCOUNT_MAP = {
  "Bank": "1020",
  "Kasse": "1000",
  "Debitoren": "1100",
  "Mobiliar": "1500",
  "Verbindlichkeiten": "2000",
  "Eigenkapital": "2800",
  "Umsatz": "3400"
};

function loadCompanies(u){
  try { return JSON.parse(localStorage.getItem(companiesKey(u)) || "[]"); }
  catch { return []; }
}

document.addEventListener("DOMContentLoaded", () => {

  const user = localStorage.getItem(USER_KEY);
  if (!user) { window.location.href = "index.html"; return; }
  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  const companyId = localStorage.getItem(currentCompanyKey(user));
  if (!companyId) { window.location.href = "overview.html"; return; }

  const companies = loadCompanies(user);
  const company = companies.find(c => c.id === companyId);
  if (!company) { window.location.href = "overview.html"; return; }

  const year = "2024"; // erstes Jahr

  const tableBody = document.getElementById("bookingTableBody");

  function loadTable(){
    const rows = JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]");
    tableBody.innerHTML = "";

    rows.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.fact}</td>
        <td>${r.sollName}</td>
        <td>${r.habenName}</td>
        <td>${r.amount}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  loadTable();

  document.getElementById("addBookingBtn").addEventListener("click", () => {
    const fact = document.getElementById("fact").value.trim();
    const sollName = document.getElementById("soll").value;
    const habenName = document.getElementById("haben").value;
    const amount = Number(document.getElementById("betrag").value);

    if (!fact || !sollName || !habenName || !(amount > 0)) {
      alert("Bitte alles korrekt ausfüllen!");
      return;
    }

    const sollNum = ACCOUNT_MAP[sollName];
    const habenNum = ACCOUNT_MAP[habenName];

    const entry = {
      fact,
      sollName,
      habenName,
      debit: sollNum,
      credit: habenNum,
      amount,
      date: new Date().toISOString()
    };

    const key = journalKey(companyId, year);
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.push(entry);
    localStorage.setItem(key, JSON.stringify(list));

    // Felder leeren
    document.getElementById("fact").value = "";
    document.getElementById("betrag").value = "";
    document.getElementById("soll").value = "";
    document.getElementById("haben").value = "";

    loadTable();
    alert("Gebucht! → Bilanz aktualisiert sich automatisch.");
  });

  document.getElementById("backBtn").onclick =
    () => window.location.href = "company.html";

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  };
});
