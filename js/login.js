// js/login.js
// Login-Seite (index.html)
// - Prüft Benutzername & Passwort für 3 Benutzer
// - Speichert beim Login den Benutzernamen im LocalStorage
// - Leitet weiter zur overview.html
// - Wenn bereits angemeldet, wird automatisch weitergeleitet

// Login-Daten (für 3 Benutzer)
const VALID_USERS = {
  "erblin.tolaj": "wms_uwi_erblin",
  "melvin.haueter": "wms_uwi_melvin",
  "michel.glaubauf": "wms_uwi_glaubauf"
};

// LocalStorage-Schlüssel
const USER_KEY = 'uwi_user';

// Hilfsfunktion: get stored user
function getStoredUser() {
  return localStorage.getItem(USER_KEY);
}

// Wenn bereits eingeloggt: weiterleiten
(function autoRedirectIfLoggedIn() {
  const user = getStoredUser();
  if (user) {
    window.location.href = 'overview.html';
  }
})();

// Formularverarbeitung
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError'); // Optional: Fehlermeldung im UI

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Fehler: Wenn Benutzername oder Passwort falsch sind
    if (!VALID_USERS[username] || VALID_USERS[username] !== password) {
      errorEl.textContent = 'Benutzername oder Passwort sind falsch!';
      errorEl.style.display = 'block';
      return;
    } else {
      errorEl.style.display = 'none'; // Fehleranzeige ausblenden, wenn korrekt

      // Speichern des Benutzernamens im LocalStorage
      localStorage.setItem(USER_KEY, username);

      // Option: initiale Arrays für Firmen anlegen, falls noch nicht vorhanden
      const companiesKey = `uwi_companies_${username}`;
      if (!localStorage.getItem(companiesKey)) {
        localStorage.setItem(companiesKey, JSON.stringify([]));
      }

      // Weiterleitung zur Übersicht
      window.location.href = 'overview.html';
    }
  });
});
