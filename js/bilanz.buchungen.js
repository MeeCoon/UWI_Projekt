document.addEventListener("DOMContentLoaded", () => {

const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;


// ============================
// USER
// ============================

const user = localStorage.getItem(USER_KEY);

if(!user){
window.location.href = "index.html";
return;
}

document.getElementById("userDisplay").textContent =
`Angemeldet: ${user}`;

document.getElementById("backBtn").onclick = () => {
window.location.href = "company.html";
};

document.getElementById("logoutBtn").onclick = () => {
localStorage.removeItem(USER_KEY);
window.location.href = "index.html";
};


// ============================
// FIRMA
// ============================

const companyId =
localStorage.getItem(currentCompanyKey(user));

if(!companyId) return;


// ============================
// JAHR
// ============================

function getYear(){
const active = document.querySelector(".yearBtn.active");
if(active) return active.textContent.trim();
return new Date().getFullYear().toString();
}


// ============================
// JOURNAL LADEN
// ============================

function loadJournal(companyId,year){

try{
return JSON.parse(
localStorage.getItem(journalKey(companyId,year)) || "[]"
);
}
catch{
return [];
}

}


// ============================
// SALDO BERECHNEN
// ============================

function computeBalances(rows){

const saldo = {};

rows.forEach(r => {

const debit = String(r.debit || "").trim();
const credit = String(r.credit || "").trim();
const amount = Number(r.amount || 0);

if(!debit || !credit || !amount) return;

saldo[debit] = (saldo[debit] || 0) + amount;
saldo[credit] = (saldo[credit] || 0) - amount;

});

return saldo;

}


// ============================
// BILANZ UPDATE
// ============================

function updateBalance(){

const year = getYear();

const rows = loadJournal(companyId,year);

const saldo = computeBalances(rows);

document.querySelectorAll(".balanceRow").forEach(row => {

const text = row.querySelector("span").textContent;

const konto = text.split(" ")[0];

const input = row.querySelector("input");

if(!input) return;

const value = saldo[konto] || 0;

input.value = value;

});

updateTotals();

}


// ============================
// TOTAL
// ============================

function updateTotals(){

let aktiven = 0;
let passiven = 0;

const aktivenInputs =
document.querySelectorAll(".balanceCol:first-child input");

const passivenInputs =
document.querySelectorAll(".balanceCol:last-child input");

aktivenInputs.forEach(i=>{
aktiven += Number(i.value || 0);
});

passivenInputs.forEach(i=>{
passiven += Number(i.value || 0);
});

document.getElementById("totalAktiven").textContent =
aktiven.toLocaleString("de-CH")+" CHF";

document.getElementById("totalPassiven").textContent =
passiven.toLocaleString("de-CH")+" CHF";

}


// ============================
// START
// ============================

updateBalance();

});
