document.addEventListener("DOMContentLoaded", () => {

const tableBody = document.getElementById("bookingTableBody");
const addBtn = document.getElementById("addRowBtn");

// Neue Zeile hinzufügen
addBtn.addEventListener("click", () => {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text" placeholder="z.B. Verkauf Ware"></td>
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

  // Buchen = mit Bilanz verbinden
  row.querySelector(".saveBtn").addEventListener("click", () => {

    const soll = row.querySelector(".soll").value;
    const haben = row.querySelector(".haben").value;
    const betrag = row.querySelector(".betrag").value;

    if (!soll || !haben || !betrag) {
      alert("Bitte alle Felder ausfüllen!");
      return;
    }

    // Speichern im LocalStorage (später für KI nutzbar)
    const booking = {
      soll: soll,
      haben: haben,
      betrag: betrag,
      datum: new Date().toISOString()
    };

    localStorage.setItem("lastBooking", JSON.stringify(booking));

    alert("Gebucht! Bilanz kann nun aktualisiert werden.");
  });
});

// Zur Firma zurück
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "company.html";
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});
});
