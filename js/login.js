// js/login.js
// Login-Seite (index.html)
// - Speichert beim Login den Benutzernamen im LocalStorage (keine echte Authentifizierung)
// - Leitet weiter zur overview.html
// - Wenn bereits angemeldet, wird automatisch zur Übersicht weitergeleitet

// LocalStorage-Schlüssel
const USER_KEY = 'uwi_user';

// Hilfsfunktion: get stored user
function getStoredUser(){
  return localStorage.getItem(USER_KEY);
}

// Wenn bereits eingeloggt: weiterleiten
(function autoRedirectIfLoggedIn(){
  const user = getStoredUser();
  if(user){
    // bereits eingeloggt → Übersicht
    window.location.href = 'overview.html';
  }
})();

// Formularverarbeitung
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value; // wir speichern nur den Namen wie gewünscht
    if(!username){
      alert('Bitte Namen eingeben.');
      return;
    }
    // Speichern des Benutzernamens im LocalStorage
    localStorage.setItem(USER_KEY, username);

    // Option: initiale Arrays für Firmen anlegen, falls noch nicht vorhanden
    const companiesKey = `uwi_companies_${username}`;
    if(!localStorage.getItem(companiesKey)){
      localStorage.setItem(companiesKey, JSON.stringify([]));
    }

    // Weiterleitung
    window.location.href = 'overview.html';
  });
});
