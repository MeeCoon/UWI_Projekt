import { saveCompany } from "./firebase.js";

const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

function minCapital(legal){
  if(legal === "AG") return 100000;
  if(legal === "GmbH") return 20000;
  return 0;
}

document.addEventListener("DOMContentLoaded", () => {

  const user = localStorage.getItem(USER_KEY);

  if(!user){
    window.location.href = "index.html";
    return;
  }

  document.getElementById("userDisplay").textContent =
    `Angemeldet: ${user}`;

  document.getElementById("backOverviewBtn").onclick = () => {
    window.location.href = "overview.html";
  };

  document.getElementById("logoutBtn").onclick = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(currentCompanyKey(user));
    window.location.href = "index.html";
  };

  const form = document.getElementById("createForm");

  const legalEl = document.getElementById("legal");
  const capitalEl = document.getElementById("capital");
  const hint = document.getElementById("capitalHint");

  // Kapitalregel anzeigen
  function updateCapitalRule(){

    const legal = legalEl.value;
    const min = minCapital(legal);

    if(legal === "AG"){
      hint.textContent = "AG benötigt mindestens 100'000 CHF Startkapital";
    }
    else if(legal === "GmbH"){
      hint.textContent = "GmbH benötigt mindestens 20'000 CHF Startkapital";
    }
    else{
      hint.textContent = "Einzelunternehmen hat kein Mindestkapital";
    }

    capitalEl.min = min;

    if(Number(capitalEl.value) < min){
      capitalEl.value = min;
    }
  }

  legalEl.addEventListener("change", updateCapitalRule);

  updateCapitalRule();

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const legal = legalEl.value;
    const capital = Number(capitalEl.value || 0);
    const industry = document.getElementById("industry").value;
    const purpose = document.getElementById("purpose").value;
    const size = Number(document.getElementById("size").value || 1);

    if(!name){
      alert("Firmenname fehlt");
      return;
    }

    const min = minCapital(legal);

    if(capital < min){
      alert(`Startkapital zu klein. Minimum für ${legal}: ${min} CHF`);
      return;
    }

    const company = {
      name,
      legal,
      capital,
      industry,
      purpose,
      size,
      createdAt: new Date().toISOString()
    };

    try{

      await saveCompany(company);

      alert("Firma gespeichert");

      window.location.href = "overview.html";

    }catch(err){

      console.error(err);
      alert("Fehler beim Speichern");

    }

  });

});
