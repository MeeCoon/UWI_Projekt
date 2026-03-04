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
   Kontenplan
========================= */

const ASSETS = [

["1000","Kasse"],
["1020","Bankguthaben"],
["1060","Wertschriften"],
["1100","Forderungen"],
["1170","Vorsteuer MWST"],
["1200","Handelswaren"],
["1210","Rohstoffe"],
["1300","Aktive Rechnungsabgrenzungen"],
["1500","Maschinen & Apparate"],
["1510","Mobiliar"],
["1530","Fahrzeuge"],
["1600","Geschäftsliegenschaften"],
["1700","Immaterielle Werte"]

];

const LIAB_EQUITY = [

["2000","Verbindlichkeiten"],
["2030","Erhaltene Anzahlungen"],
["2100","Bankverbindlichkeiten"],
["2200","Geschuldete MWST"],
["2300","Passive Rechnungsabgrenzungen"],
["2450","Darlehen"],
["2600","Rückstellungen"],
["2800","Eigenkapital"],
["2950","Gesetzliche Reserven"],
["2970","Gewinnvortrag"],
["2891","Jahresgewinn/-verlust"]

];


/* =========================
   Helper Funktionen
========================= */

function getUserOrRedirect(){

const u = localStorage.getItem(USER_KEY);

if(!u){
window.location.href="index.html";
return null;
}

return u;

}

function loadCompanies(u){

try{
return JSON.parse(localStorage.getItem(companiesKey(u))||"[]");
}
catch{
return [];
}

}

function getSelectedCompany(u){

const id = localStorage.getItem(currentCompanyKey(u));

if(!id) return null;

return loadCompanies(u).find(c=>c.id===id)||null;

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

const num = Math.round(Number(n||0));

const s = String(num)
.replace(/\B(?=(\d{3})+(?!\d))/g,"'");

return `${s} CHF`;

}

function loadJournal(companyId,year){

try{
return JSON.parse(localStorage.getItem(journalKey(companyId,year))||"[]");
}
catch{
return [];
}

}


/* =========================
   Saldo berechnen
========================= */

function computeBalancesFromJournal(rows){

const bal = {};

for(const r of rows){

const debit = String(r.debit||"").trim();
const credit = String(r.credit||"").trim();
const amt = Number(r.amount||0);

if(!debit || !credit || !(amt>0))
continue;

bal[debit]=(bal[debit]||0)+amt;
bal[credit]=(bal[credit]||0)-amt;

}

return bal;

}


/* =========================
   Jahr Tabs
========================= */

function renderYearTabs(companyId){

const el = document.getElementById("yearTabs");

const years = getYears(companyId);

if(!years.includes(currentYear))
currentYear = years[0];

el.innerHTML =

years.map(y=>`
<button
class="yearBtn ${y===currentYear?"active":""}"
data-year="${y}">
${y}
</button>
`).join("")

+

`<button class="addYearBtn" id="addYearBtn">+ Jahr</button>`;


el.onclick=(e)=>{

const b=e.target.closest(".yearBtn");

if(!b) return;

currentYear=b.dataset.year;

renderYearTabs(companyId);
renderBalance(companyId,currentYear);

};


document.getElementById("addYearBtn").onclick=()=>{

const y = prompt("Jahr eingeben (z.B. 2027)");

if(!y) return;

if(!/^\d{4}$/.test(y))
return alert("Ungültiges Jahr");

const list=getYears(companyId);

if(list.includes(y))
return alert("Jahr existiert bereits");

list.push(y);
list.sort();

saveYears(companyId,list);

currentYear=y;

renderYearTabs(companyId);
renderBalance(companyId,currentYear);

};

}


/* =========================
   Bilanz anzeigen
========================= */

function renderBalance(companyId,year){

const root=document.getElementById("balanceRoot");

const rows = loadJournal(companyId,year);

const saldo = computeBalancesFromJournal(rows);


const assetRows = ASSETS.map(([no,name])=>{

const s = Number(saldo[no]||0);
const shown = Math.max(s,0);

return row(`${no} ${name}`,fmtCHF(shown));

}).join("");


const liabRows = LIAB_EQUITY.map(([no,name])=>{

const s = Number(saldo[no]||0);
const shown = Math.max(-s,0);

return row(`${no} ${name}`,fmtCHF(shown));

}).join("");


const totalAssets = ASSETS.reduce((sum,[no])=>
sum + Math.max(Number(saldo[no]||0),0)
,0);


const totalLiabEq = LIAB_EQUITY.reduce((sum,[no])=>
sum + Math.max(-Number(saldo[no]||0),0)
,0);


root.innerHTML = `

<div class="balanceHeaderBlue">

<div class="balanceTitle">
Bilanz ${year}
</div>

<div class="balanceSub">
Automatisch aus Buchungen berechnet
</div>

</div>


<div class="balanceSheet">

<div class="balanceCol">

<div class="balanceColTitle">
Aktiven
</div>

${assetRows}

<div class="balanceTotal">

<span>Total Aktiven</span>
<span>${fmtCHF(totalAssets)}</span>

</div>

</div>


<div class="balanceDivider"></div>


<div class="balanceCol">

<div class="balanceColTitle">
Passiven
</div>

${liabRows}

<div class="balanceTotal">

<span>Total Passiven</span>
<span>${fmtCHF(totalLiabEq)}</span>

</div>

</div>

</div>


<div class="muted small" style="margin-top:10px;">
Buchungen im Jahr: <b>${rows.length}</b>
</div>

`;

function row(label,value){

return `
<div class="balanceRow">
<span>${label}</span>
<span style="font-weight:600;">
${value}
</span>
</div>
`;

}

}


/* =========================
   Start
========================= */

document.addEventListener("DOMContentLoaded",()=>{

const user = getUserOrRedirect();

if(!user) return;

document.getElementById("userDisplay").textContent=`Angemeldet: ${user}`;

document.getElementById("backBtn").onclick=
()=>window.location.href="company.html";

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem(USER_KEY);
localStorage.removeItem(currentCompanyKey(user));

window.location.href="index.html";

};


const company = getSelectedCompany(user);

if(!company){
window.location.href="overview.html";
return;
}

document.getElementById("companyInfo").textContent=
`Firma: ${company.name}`;


const years = getYears(company.id);

currentYear = years[0];

renderYearTabs(company.id);

renderBalance(company.id,currentYear);

});
