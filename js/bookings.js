document.addEventListener("DOMContentLoaded", () => {

const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;

// ---------- Hilfen ----------
function currentUser() {
  return localStorage.getItem(USER_KEY);
}

function currentCompanyId() {
  const u = currentUser();
  if (!u) return null;
  return localStorage.getItem(`${CURRENT_COMPANY_PREFIX}${u}`);
}

// wir buchen IMMER ins aktuelle Bilanz-Jahr
function currentYear() {
  return localStorage.getItem("uwi_currentBalanceYear") || "2024";
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

// ---------- UI ----------
const tableBody = document.getElementById("bookingTableBody");
const addBtn = document.getElementById("addRowBtn");

// Neue Zeile hinzufügen
addBtn.addEventListener("click", () => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text" placeholder="z.B. Verkauf Ware" class="fact"></td>
    <td><input type="number" placeholder="z.B. 1000" class="soll"></td>
    <td><input type="number" placeholder="z.B. 3200" class="haben"></td>
    <td><input type="number" placeholder="Betrag" class="betrag"></td>
    <td>
      <button class="btn saveBtn">Buchen</button>
      <button class="btn ghost deleteBtn">Löschen</button>
    </td>
  `;

  tableBody.appendChild(row);

  // Löschen
  row.querySelector(".deleteBtn").addEventListener("click", () => {
    row.remove();
  });

  // Buchen
  row.querySelector(".saveBtn").addEventListener("click", () => {

    const fact = row.querySelector(".fact").value.trim();
    const soll = row.querySelector(".soll").value.trim();
    const haben = row.querySelector(".haben").value.trim();
    const betrag = Number(row.querySelector(".betrag").value);

    if (!soll || !haben || !(betrag > 0)) {
      alert("Bitte gültige Konten und Betrag eingeben!");
      return;
    }

    const companyId = currentCompanyId();
    if (!companyId) {
      alert("Keine Firma ausgewählt!");
      return;
    }

    const year = currentYear();

    const journal = loadJournal(companyId, year);

    const booking = {
      fact,
      debit: soll,   // wichtig für Bilanz
      credit: haben, // wichtig für Bilanz
      amount: betrag,
      date: new Date().toISOString()
    };

    journal.push(booking);
    saveJournal(companyId, year, journal);

    alert(`Gebucht in Jahr ${year}!\nÖffne die Bilanz → sie ist jetzt aktualisiert.`);

    // Felder leeren statt löschen (praktischer)
    row.querySelector(".fact").value = "";
    row.querySelector(".soll").value = "";
    row.querySelector(".haben").value = "";
    row.querySelector(".betrag").value = "";
  });
});

// Zur Firma zurück
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "company.html";
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  const u = currentUser();
  if (u) {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(`${CURRENT_COMPANY_PREFIX}${u}`);
  }
  window.location.href = "index.html";
});
});
