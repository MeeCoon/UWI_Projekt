// js/login.js
// Login-Seite (index.html)
// - Prüft Benutzername & Passwort
// - Speichert beim Login den Benutzernamen im LocalStorage
// - Leitet weiter zur overview.html
// - Wenn bereits angemeldet, wird automatisch weitergeleitet

// Login-Daten (Demo!)
const VALID_USERNAME = "test";
const VALID_PASSWORD = "test123";

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

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Login-Prüfung
    if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
      alert('Benutzername oder Passwort falsch!');
      return;
    }

    // Speichern des Benutzernamens im LocalStorage
    localStorage.setItem(USER_KEY, username);

    // Option: initiale Arrays für Firmen anlegen
    const companiesKey = `uwi_companies_${username}`;
    if (!localStorage.getItem(companiesKey)) {
      localStorage.setItem(companiesKey, JSON.stringify([]));
    }

    // Weiterleitung
    window.location.href = 'overview.html';
  });
});
