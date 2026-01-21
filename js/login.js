(function () {
  // LocalStorage Schlüssel
  const USER_KEY = 'uwi_user';
  const COMPANIES_PREFIX = 'uwi_companies_';

  // Vordefinierte Konten (werden nur im Hintergrund in diesem JS verwaltet).
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
        showError('Ungültiger Benutzername. Dieses Konto ist nicht erlaubt.');
        return;
      }

      // Passwortprüfung
      const expected = CREDENTIALS[username];
      if (password !== expected) {
        showError('Ungültiges Passwort.');
        return;
      }

      // Anmeldung erfolgreich:
      localStorage.setItem(USER_KEY, username);

      // Sicherstellen, dass die Firmenliste für diesen Benutzer existiert.
      const key = COMPANIES_PREFIX + username;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }

      // Weiterleitung zur Übersicht
      window.location.href = 'overview.html';
    });
  });
})();
