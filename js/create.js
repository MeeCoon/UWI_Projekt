// Firebase import
import { saveCompany } from "./firebase.js";

const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

function loadCompanies(user){
  try{
    return JSON.parse(localStorage.getItem(companiesKey(user)) || "[]");
  }catch{
    return [];
  }
}

function saveCompanies(user,companies){
  localStorage.setItem(companiesKey(user),JSON.stringify(companies));
}

function minCapitalFor(legal){
  if(legal === "AG") return 100000;
  if(legal === "GmbH") return 20000;
  return 0;
}

function fmtCH(n){
  return Number(n || 0).toLocaleString("de-CH");
}

document.addEventListener("DOMContentLoaded",()=>{

  const user = localStorage.getItem(USER_KEY);
  if(!user){
    window.location.href="index.html";
    return;
  }

  // Header
  document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;

  document.getElementById("backOverviewBtn")?.addEventListener("click",()=>{
    window.location.href="overview.html";
  });

  document.getElementById("logoutBtn")?.addEventListener("click",()=>{
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href="index.html";
  });

  const form = document.getElementById("createForm");
  const cancelBtn = document.getElementById("cancelBtn");

  const nameEl = document.getElementById("name");
  const legalEl = document.getElementById("legal");
  const capitalEl = document.getElementById("capital");
  const industryEl = document.getElementById("industry");
  const purposeEl = document.getElementById("purpose");
  const sizeEl = document.getElementById("size");
  const hintEl = document.getElementById("capitalHint");

  cancelBtn?.addEventListener("click",()=>{
    window.location.href="overview.html";
  });

  function updateCapitalRule(){

    const legal = String(legalEl.value || "").trim();
    const min = minCapitalFor(legal);

    capitalEl.min = String(min);
    capitalEl.step = "1";

    if(legal === "AG"){
      hintEl.textContent="AG: Mindest-Startkapital 100'000 CHF";
    }
    else if(legal === "GmbH"){
      hintEl.textContent="GmbH: Mindest-Startkapital 20'000 CHF";
    }
    else{
      hintEl.textContent="Einzelunternehmen: Kein Mindest-Startkapital";
    }

    const cur = Number(capitalEl.value || 0);
    if(cur < min){
      capitalEl.value = String(min);
    }

  }

  legalEl.addEventListener("change",updateCapitalRule);
  updateCapitalRule();

  form.addEventListener("submit", async (e)=>{

    e.preventDefault();

    const name = (nameEl.value || "").trim();
    const legal = (legalEl.value || "").trim();
    const capital = Number(capitalEl.value || 0);
    const industry = (industryEl.value || "").trim();
    const purpose = (purposeEl.value || "").trim();
    const size = Number(sizeEl.value || 0);

    if(!name){
      alert("Bitte Firmenname eingeben.");
      return;
    }

    if(!(size >= 1)){
      alert("Grösse muss mindestens 1 sein.");
      return;
    }

    const min = minCapitalFor(legal);

    if(capital < min){
      alert(`Startkapital zu klein. Minimum für ${legal}: ${fmtCH(min)} CHF`);
      capitalEl.value = String(min);
      capitalEl.focus();
      return;
    }

    const companies = loadCompanies(user);

    const company = {
      id:`c_${Date.now()}`,
      name,
      legal,
      capital,
      industry,
      purpose,
      size,
      createdAt:new Date().toISOString()
    };

    // Local speichern
    companies.unshift(company);
    saveCompanies(user,companies);

    // Firebase speichern
    try{
      await saveCompany(company);
      console.log("Firma in Firebase gespeichert");
    }catch(err){
      console.error("Firebase Fehler:",err);
    }

    // aktuelle Firma merken
    localStorage.setItem(currentCompanyKey(user),company.id);

    // zurück zur Übersicht
    window.location.href="overview.html";

  });

});
