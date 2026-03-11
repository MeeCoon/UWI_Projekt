// js/bilanz.js

const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}_balance`;

const DEFAULT_YEARS = ["2024","2025","2026"];

let currentYear = "2024";



/* =========================
   AKTIVEN (immer gleich)
========================= */

const ASSETS = [

["1000","Kasse"],
["1020","Bankguthaben"],
["1060","Wertschriften"],
["1100","Forderungen"],
["1170","Vorsteuer MWST"],
["1200","Handelswaren"],
["1210","Rohstoffe"],
["1300","Aktive Rechnungsabgrenzung"],

["1400","Wertschriften"],
["1480","Beteiligungen"],
["1500","Maschinen & Apparate"],
["1510","Mobiliar"],
["1520","Büromaschinen"],
["1530","Fahrzeuge"],
["1600","Geschäftsliegenschaften"],
["1700","Immaterielle Werte"]

];



/* =========================
   PASSIVEN JE RECHTSFORM
========================= */

function getLiabilityAccounts(legal){

if(legal === "Einzelunternehmen"){

return [

["2000","Verbindlichkeiten"],
["2100","Bankverbindlichkeiten"],
["2200","Geschuldete MWST"],
["2300","Passive Rechnungsabgrenzung"],
["2600","Rückstellungen"],

["2800","Eigenkapital"],
["2850","Privat"],
["2891","Jahresgewinn / Jahresverlust"]

];

}



if(legal === "GmbH"){

return [

["2000","Verbindlichkeiten"],
["2100","Bankverbindlichkeiten"],
["2200","Geschuldete MWST"],
["2300","Passive Rechnungsabgrenzung"],
["2600","Rückstellungen"],

["2800","Stammkapital"],
["2970","Gewinnvortrag"]

];

}



if(legal === "AG"){

return [

["2000","Verbindlichkeiten"],
["2100","Bankverbindlichkeiten"],
["2200","Geschuldete MWST"],
["2300","Passive Rechnungsabgrenzung"],
["2600","Rückstellungen"],

["2800","Aktienkapital"],
["2950","Gesetzliche Reserven"],
["2970","Gewinnvortrag"]

];

}



return [];

}



/* =========================
   HELPER
========================= */

function getUserOrRedirect(){

const u = localStorage.getItem(USER_KEY);

if(!u){

window.location.href = "index.html";

return null;

}

return u;

}



function loadCompanies(u){

try{

return JSON.parse(localStorage.getItem(companiesKey(u)) || "[]");

}

catch{

return [];

}

}



function getSelectedCompany(u){

const id = localStorage.getItem(currentCompanyKey(u));

if(!id) return null;

return loadCompanies(u).find(c => c.id === id) || null;

}



function getYears(companyId){

try{

const raw = localStorage.getItem(yearsKey(companyId));

const arr = raw ? JSON.parse(raw) : null;

if(Array.isArray(arr) && arr.length)

return arr.map(String);

}

catch{}

return [...DEFAULT_YEARS];

}



function saveYears(companyId,years){

localStorage.setItem(

yearsKey(companyId),

JSON.stringify(years)

);

}



function fmtCHF(n){

const num = Math.round(Number(n || 0));

const s = String(num)

.replace(/\B(?=(\d{3})+(?!\d))/g,"'");

return `${s} CHF`;

}



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



/* =========================
   SALDO BERECHNEN
========================= */

function computeBalancesFromJournal(rows){

const bal = {};

for(const r of rows){

const debit = String(r.debit || "").trim();

const credit = String(r.credit || "").trim();

const amt = Number(r.amount || 0);

if(!debit || !credit || !(amt > 0)) continue;

bal[debit] = (bal[debit] || 0) + amt;

bal[credit] = (bal[credit] || 0) - amt;

}

return bal;

}



/* =========================
   JAHR TABS
========================= */

function renderYearTabs(companyId){

const el = document.getElementById("yearTabs");

const years = getYears(companyId);



if(!years.includes(currentYear))

currentYear = years[0];



el.innerHTML =

years.map(y=>`

<button class="yearBtn ${y===currentYear?"active":""}" data-year="${y}">

${y}

</button>

`).join("")

+

`<button class="addYearBtn" id="addYearBtn">+ Jahr</button>`;



el.onclick = (e)=>{

const b = e.target.closest(".yearBtn");

if(!b) return;



currentYear = b.dataset.year;



renderYearTabs(companyId);

renderBalance(companyId,currentYear);

};



document.getElementById("addYearBtn").onclick = ()=>{

const y = prompt("Jahr eingeben (z.B. 2027)");

if(!y) return;



if(!/^\d{4}$/.test(y))

return alert("Ungültiges Jahr");



const list = getYears(companyId);



if(list.includes(y))

return alert("Jahr existiert bereits");



list.push(y);

list.sort();



saveYears(companyId,list);



currentYear = y;



renderYearTabs(companyId);

renderBalance(companyId,currentYear);

};

}



/* =========================
   BILANZ RENDER
========================= */

function renderBalance(companyId,year){

const root = document.getElementById("balanceRoot");

if(!root) return;



const rows = loadJournal(companyId,year);

const saldo = computeBalancesFromJournal(rows);



const user = localStorage.getItem(USER_KEY);

const company = getSelectedCompany(user);



if(!company) return;



const LIAB_EQUITY = getLiabilityAccounts(company.legal);



const assetRows = ASSETS.map(([no,name])=>{

const s = Number(saldo[no] || 0);

const shown = Math.max(s,0);

return row(`${no} ${name}`,fmtCHF(shown));

}).join("");



const liabRows = LIAB_EQUITY.map(([no,name])=>{

const s = Number(saldo[no] || 0);

const shown = Math.max(-s,0);

return row(`${no} ${name}`,fmtCHF(shown));

}).join("");



root.innerHTML = `

<div class="balanceSheet">

<div class="balanceCol">

<div class="balanceColTitle">Aktiven</div>

${assetRows}

</div>



<div class="balanceDivider"></div>



<div class="balanceCol">

<div class="balanceColTitle">Passiven</div>

${liabRows}

</div>



</div>

`;



function row(label,value){

return `

<div class="balanceRow">

<span>${label}</span>

<span style="font-weight:600;">${value}</span>

</div>

`;

}

}



/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded",()=>{

const user = getUserOrRedirect();

if(!user) return;



document.getElementById("userDisplay").textContent =

`Angemeldet: ${user}`;



document.getElementById("backBtn").onclick =

()=> window.location.href = "company.html";



document.getElementById("logoutBtn").onclick = ()=>{

localStorage.removeItem(USER_KEY);

localStorage.removeItem(currentCompanyKey(user));

window.location.href = "index.html";

};



const company = getSelectedCompany(user);



if(!company){

window.location.href = "overview.html";

return;

}



const years = getYears(company.id);



currentYear = years[0];



renderYearTabs(company.id);

renderBalance(company.id,currentYear);

});
