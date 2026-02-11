const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const COMPANIES_PREFIX = "uwi_companies_";
const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}`;
const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = DEFAULT_YEARS[0];

// ⚠️ Profi-Tipp: value = Kontonummer (nicht Name), dann ist alles viel stabiler
// Du kannst die Liste erweitern:
const ACCOUNTS = [
  { no: "1000", name: "Kasse" },
  { no: "1020", name: "Bank" },
  { no: "1100", name: "Debitoren" },
  { no: "1500", name: "Mobiliar" },
  { no: "1530", name: "Fahrzeuge" },
  { no: "2000", name: "Verbindlichkeiten" },
  { no: "2450", name: "Darlehen" },
  { no: "2800", name: "Eigenkapital" },
  { no: "3400", name: "Dienstleistungserlöse" },
];

function loadCompanies(u) {
  try { return JSON.parse(localStorage.getItem(companiesKey(u)) || "[]"); }
  catch { return []; }
}

function getYears(companyId) {
  try {
    const arr = JSON.parse(localStorage.getItem(yearsKey(companyId)) || "null");
    if (Array.isArray(arr) && arr.length) return arr.map(String);
  } catch {}
  return [...DEFAULT_YEARS];
}

function saveYears(companyId, years) {
  localStorage.setItem(yearsKey(companyId), JSON.stringify(years.map(String)));
}

function loadJournal(companyId, year) {
  try { return JSON.parse(localStorage.getItem(journalKey(companyId, year)) || "[]"); }
  catch { return []; }
}

function saveJournal(companyId, year, rows) {
  localStorage.setItem(journalKey(companyId, year), JSON.stringify(rows));
}

function fmt(n) {
  const num = Math.round(Number(n || 0));
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function buildAccountOptions() {
  return [
    `<option value="">— Konto wählen —</option>`,
    ...ACCOUNTS.map(a => `<option value="${a.no}">${a.no} ${a.name}</option>`)
  ].join("");
}

function renderYearTabs(companyId) {
  const el = document.getElementById("yearTabs");
  if (!el) return;

  const years = getYears(companyId);
  if (!years.includes(currentYear)) currentYear = years[0];

  el.innerHTML =
    years.map(y => `<button type="button" class="yearBtn ${y===currentYear?"active":""}" data-year="${y}">${y}</button>`).join("") +
    `<button type="button" class="addYearBtn" id="addYearBtn">+ Jahr hinzufügen</button>`;

  el.onclick = (e) => {
    const b = e.target.closest(".yearBtn");
    if (!b) return;
    currentYear = b.dataset.year;
    renderYearTabs(companyId);
    renderTable(companyId);
  };

  document.getElementById("addYearBtn").onclick = () => {
    const input = prompt("Jahr eingeben (z.B. 2027):");
    if (!input) return;
    const y = input.trim();
    if (!/^\d{4}$/.test(y) || +y < 2000 || +y > 2100) return alert("Ungültiges Jahr (2000–2100).");

    const next = getYears(companyId);
    if (next.includes(y)) return alert("Dieses Jahr gibt es schon.");

    next.push(y); next.sort();
    saveYears(companyId, next);

    currentYear = y;
    renderYearTabs(companyId);
    renderTable(companyId);
  };
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

function entryToDisplay(entry) {
  // Für Tabelle: kurz zusammenfassen
  const fact = entry.fact || "";
  const deb = (entry.debits || []).map(x => `${x.accountNo} ${x.accountName} (${fmt(x.amount)})`).join(", ");
  const cre = (entry.credits || []).map(x => `${x.accountNo} ${x.accountName} (${fmt(x.amount)})`).join(", ");
  const total = Number(entry.total || 0);
  return { fact, deb, cre, total };
}

function renderTable(companyId) {
  const tbody = document.getElementById("bookingTableBody");
  if (!tbody) return;

  const rows = loadJournal(companyId, currentYear);
  tbody.innerHTML = "";

  rows.forEach(entry => {
    const d = entryToDisplay(entry);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(d.fact)}</td>
      <td>${escapeHtml(d.deb)}</td>
      <td>${escapeHtml(d.cre)}</td>
      <td>${escapeHtml(String(d.total))}</td>
    `;
    tbody.appendChild(tr);
  });
}

function createLine(side) {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.gap = "8px";
  wrap.style.alignItems = "center";
  wrap.style.marginBottom = "8px";

  const sel = document.createElement("select");
  sel.className = "balanceInput";
  sel.style.textAlign = "left";
  sel.style.width = "100%";
  sel.innerHTML = buildAccountOptions();

  const amt = document.createElement("input");
  amt.className = "balanceInput";
  amt.type = "number";
  amt.min = "0";
  amt.step = "1";
  amt.placeholder = "Betrag";
  amt.style.width = "140px";

  const del = document.createElement("button");
  del.type = "button";
  del.className = "btn";
  del.textContent = "✕";
  del.title = "Zeile entfernen";

  del.addEventListener("click", () => {
    wrap.remove();
    updateSums();
  });

  sel.addEventListener("change", updateSums);
  amt.addEventListener("input", updateSums);

  wrap.dataset.side = side;
  wrap.appendChild(sel);
  wrap.appendChild(amt);
  wrap.appendChild(del);
  return wrap;
}

function getLines(side) {
  const root = side === "debit" ? document.getElementById("debitLines") : document.getElementById("creditLines");
  const lines = Array.from(root.querySelectorAll("div[data-side]"));
  return lines.map(line => {
    const sel = line.querySelector("select");
    const inp = line.querySelector("input[type=number]");
    const no = (sel?.value || "").trim();
    const optText = sel?.selectedOptions?.[0]?.textContent || "";
    const name = optText.replace(/^\d+\s*/, "").trim(); // "1020 Bank" -> "Bank"
    const amount = Number(inp?.value || 0);
    return { accountNo: no, accountName: name, amount };
  }).filter(x => x.accountNo && x.amount > 0);
}

function sum(lines) {
  return lines.reduce((a,b) => a + Number(b.amount||0), 0);
}

function updateSums() {
  const debits = getLines("debit");
  const credits = getLines("credit");
  const sD = sum(debits);
  const sC = sum(credits);

  document.getElementById("sumDebit").textContent = `${fmt(sD)} CHF`;
  document.getElementById("sumCredit").textContent = `${fmt(sC)} CHF`;

  const ok = sD > 0 && sD === sC;
  document.getElementById("balancedState").textContent = ok ? "ausgeglichen ✅" : "nicht ausgeglichen ❌";

  const btn = document.getElementById("addBookingBtn");
  if (btn) btn.disabled = !ok;
}

document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return (window.location.href = "index.html");

  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  const companyId = localStorage.getItem(currentCompanyKey(user));
  if (!companyId) return (window.location.href = "overview.html");

  const companies = loadCompanies(user);
  const company = companies.find(c => c.id === companyId);
  if (!company) return (window.location.href = "overview.html");

  // Buttons
  document.getElementById("backBtn")?.addEventListener("click", () => window.location.href = "company.html");
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    const u = localStorage.getItem(USER_KEY);
    localStorage.removeItem(USER_KEY);
    if (u) localStorage.removeItem(currentCompanyKey(u));
    window.location.href = "index.html";
  });

  // Jahre
  currentYear = getYears(companyId)[0];
  renderYearTabs(companyId);

  // Start: 1 Soll + 1 Haben Zeile
  const debitRoot = document.getElementById("debitLines");
  const creditRoot = document.getElementById("creditLines");
  debitRoot.appendChild(createLine("debit"));
  creditRoot.appendChild(createLine("credit"));

  document.getElementById("addDebitLineBtn")?.addEventListener("click", () => {
    debitRoot.appendChild(createLine("debit"));
    updateSums();
  });
  document.getElementById("addCreditLineBtn")?.addEventListener("click", () => {
    creditRoot.appendChild(createLine("credit"));
    updateSums();
  });

  // Tabelle laden
  renderTable(companyId);
  updateSums();

  // Buchen (Splitt!)
  document.getElementById("addBookingBtn")?.addEventListener("click", () => {
    const fact = document.getElementById("fact")?.value?.trim() || "";
    const debits = getLines("debit");
    const credits = getLines("credit");
    const totalD = sum(debits);
    const totalC = sum(credits);

    if (!fact) return alert("Bitte Buchungstatsache eingeben.");
    if (!(totalD > 0) || totalD !== totalC) return alert("Soll und Haben müssen gleich sein!");

    const entry = {
      type: "split",
      fact,
      year: currentYear,
      debits,
      credits,
      total: totalD,
      date: new Date().toISOString()
    };

    const list = loadJournal(companyId, currentYear);
    list.unshift(entry);
    saveJournal(companyId, currentYear, list);

    // reset
    document.getElementById("fact").value = "";
    debitRoot.innerHTML = "";
    creditRoot.innerHTML = "";
    debitRoot.appendChild(createLine("debit"));
    creditRoot.appendChild(createLine("credit"));
    updateSums();

    renderTable(companyId);
    alert(`Gebucht in ${currentYear} ✅ (Bilanz/ER kann es automatisch übernehmen)`);
  });
});
