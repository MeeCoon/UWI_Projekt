// js/login.js
// Angepasstes Login für die UWI Unternehmenssimulation (Schul-Demo)
//
// Anforderungen:
// - Es gibt genau drei Konten (mit zugehörigem Passwort).
// - Benutzername muss exakt einem dieser drei entsprechen.
// - Passwortfeld muss ausgefüllt sein; Passwortprüfung erfolgt im Hintergrund.
// - Nach erfolgreichem Login wird der Benutzername im LocalStorage gespeichert
//   (Schlüssel: 'uwi_user') und es erfolgt Weiterleitung zu overview.html.
// - Jede Benutzers hat eigene Firmen: gespeichert unter 'uwi_companies_<username>'.
//
// Sicherheitshinweis:
// - Dies ist nur eine Demo. Die Anmeldeinformationen sind im Client-Code hinterlegt.
//   Für echtes Sicherheitsverhalten ist ein serverseitiges Backend mit sicherer
//   Passwortverwaltung erforderlich.

(function () {
  // LocalStorage Schlüssel
  const USER_KEY = 'uwi_user';
  const COMPANIES_PREFIX = 'uwi_companies_';

  // Vordefinierte Konten (werden nur im Hintergrund in diesem JS verwaltet).
  // Achtung: Diese Werte befinden sich im JavaScript-Code des Clients (nur Demo).
  // Format: username: password
  const CREDENTIALS = {
    'erblin.tolaj': 'wms_uwi_erblin',
    'melvin.haueter': 'wms_uwi_melvin',
    'michel.glaubauf': 'wms_uwi_glaubauf'
  };

  // Hilfsfunktion: Fehlermeldung im Formular anzeigen
  function showError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg || '';
  }

  // Falls bereits angemeldet: direkt weiterleiten zur Übersicht
  const existing = localStorage.getItem(USER_KEY);
  if (existing) {
    // bereits angemeldet → Übersicht
    window.location.href = 'overview.html';
    return;
  }

  // Formular-Handler
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      showError('');

      const username = (usernameInput.value || '').trim();
      // Passwort nicht trimmen, nur prüfen ob ausgefüllt
      const password = passwordInput.value || '';

      // Validierung: Felder ausgefüllt?
      if (!username) {
        showError('Bitte Benutzernamen eingeben.');
        usernameInput.focus();
        return;
      }
      if (!password) {
        showError('Bitte Passwort eingeben.');
        passwordInput.focus();
        return;
      }

      // Prüfung: Benutzername exakt in CREDENTIALS vorhanden?
      if (!Object.prototype.hasOwnProperty.call(CREDENTIALS, username)) {
        // Benutzername nicht erlaubt
        showError('Ungültiger Benutzername. Dieses Konto ist nicht erlaubt.');
        return;
      }

      // Passwortprüfung: bei der Demo prüfen wir nur, ob das eingegebene Passwort
      // mit dem in CREDENTIALS hinterlegten übereinstimmt.
      // (Alternativ hätte man nur geprüft, ob Passwort ausgefüllt ist;
      // hier prüfen wir das explizit, wie vom Nutzer gewünscht.)
      const expected = CREDENTIALS[username];
      if (password !== expected) {
        showError('Ungültiges Passwort.');
        return;
      }

      // Anmeldung erfolgreich:
      // 1) Benutzername im LocalStorage speichern
      localStorage.setItem(USER_KEY, username);

      // 2) Sicherstellen, dass die Firmenliste für diesen Benutzer existiert.
      const key = COMPANIES_PREFIX + username;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }

      // 3) Weiterleitung zur Übersicht
      window.location.href = 'overview.html';
    });
  });
})();
