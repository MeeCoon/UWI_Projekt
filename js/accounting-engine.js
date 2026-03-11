document.addEventListener("DOMContentLoaded", () => {

const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => COMPANIES_PREFIX + u;
const currentCompanyKey = (u) => CURRENT_COMPANY_PREFIX + u;


// =============================
// USER LADEN
// =============================

const user = localStorage.getItem(USER_KEY);

if(!user){
window.location.href = "index.html";
return;
}

document.getElementById("userDisplay").textContent =
"Angemeldet: " + user;


// =============================
// BUTTONS
// =============================

document.getElementById("backBtn").onclick = () => {
window.location.href = "company.html";
};

document.getElementById("logoutBtn").onclick = () => {
localStorage.removeItem(USER_KEY);
window.location.href = "index.html";
};


// =============================
// FIRMA LADEN
// =============================

const companies =
JSON.parse(localStorage.getItem(companiesKey(user)) || "[]");

const currentId =
localStorage.getItem(currentCompanyKey(user));

const company =
companies.find(c => c.id === currentId);

if(!company) return;

const legal = company.legal;


// =============================
// KONTEN JE RECHTSFORM
// =============================

function hideRow(text){

document.querySelectorAll(".balanceRow")
.forEach(row => {

if(row.textContent.includes(text)){
row.style.display = "none";
}

});

}


// Einzelunternehmen
if(legal === "Einzelunternehmen"){

hideRow("Aktienkapital");
hideRow("Gesetzliche Reserven");

}

// GmbH
if(legal === "GmbH"){

hideRow("Eigenkapital Einzelunternehmen");

}

// AG
if(legal === "AG"){

hideRow("Eigenkapital Einzelunternehmen");

}


// =============================
// BILANZ AUTOMATISCH RECHNEN
// =============================

const inputs = document.querySelectorAll(".balanceInput");

function formatCHF(n){

return Number(n)
.toLocaleString("de-CH") + " CHF";

}

function calculate(){

let aktiven = 0;
let passiven = 0;

const aktivenInputs =
document.querySelectorAll(".balanceCol:first-child .balanceInput");

const passivenInputs =
document.querySelectorAll(".balanceCol:last-child .balanceInput");

aktivenInputs.forEach(i => {
aktiven += Number(i.value || 0);
});

passivenInputs.forEach(i => {
passiven += Number(i.value || 0);
});

document.getElementById("totalAktiven")
.textContent = formatCHF(aktiven);

document.getElementById("totalPassiven")
.textContent = formatCHF(passiven);

}

inputs.forEach(i=>{
i.addEventListener("input",calculate);
});

calculate();

});
