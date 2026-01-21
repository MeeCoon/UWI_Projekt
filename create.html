// js/create.js
// Neue Firma erstellen (create.html)
// - Formular einlesen
// - Firma als Objekt in LocalStorage für den aktuellen Benutzer speichern
// - Danach Weiterleitung zurück zur Übersicht (overview.html)

// LocalStorage keys
const USER_KEY = 'uwi_user';
const COMPANY_KEY_PREFIX = 'uwi_companies_';

function getCurrentUser(){
  return localStorage.getItem(USER_KEY);
}
function requireLogin(){
  const user = getCurrentUser();
  if(!user){
    window.location.href = 'index.html';
    return null;
  }
  return user;
}
function companiesKey(user){ return COMPANY_KEY_PREFIX + user; }
function loadCompanies(user){
  const raw = localStorage.getItem(companiesKey(user));
  try{
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Fehler beim Laden der Firmen:', e);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const user = requireLogin();
  if(!user) return;

  // Anzeige Benutzername
  const userDisplay = document.getElementById('userDisplay');
  if(userDisplay) userDisplay.textContent = `Angemeldet: ${user}`;

  // Logout & Cancel
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(USER_KEY);
    window.location.href = 'index.html';
  });
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = 'overview.html';
  });

  const form = document.getElementById('createForm');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();

    // Eingabewerte sammeln
    const name = document.getElementById('name').value.trim();
    const legal = document.getElementById('legal').value;
    const capital = parseFloat(document.getElementById('capital').value) || 0;
    const industry = document.getElementById('industry').value.trim();
    const purpose = document.getElementById('purpose').value.trim();
    const size = parseInt(document.getElementById('size').value) || 0;

    // Einfache Validierung
    if(!name){
      alert('Bitte einen Firmennamen eingeben.');
      return;
    }

    // Firma-Objekt erzeugen
    const company = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      name,
      legal,
      capital,
      industry,
      purpose,
      size,
      createdAt: new Date().toISOString()
    };

    // Speichern im LocalStorage unter dem Benutzer
    const companies = loadCompanies(user);
    companies.push(company);
    localStorage.setItem(companiesKey(user), JSON.stringify(companies));

    // Zurück zur Übersicht
    window.location.href = 'overview.html';
  });
});
