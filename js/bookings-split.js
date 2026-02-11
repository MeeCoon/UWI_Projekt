const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}`;

const DEFAULT_YEARS = ["2024", "2025", "2026"];
let currentYear = DEFAULT_YEARS[0];

// ===== ZENTRALER KONTENPLAN (für Dropdown) =====
const KONTENPLAN = [
  // Bilanz Aktiven
  { no:"1000", name:"Kasse"},
  { no:"1020", name:"Bankguthaben"},
  { no:"1060", name:"Wertschriften"},
  { no:"1100", name:"Forderungen"},
  { no:"1170", name:"Vorsteuer MWST"},
  { no:"1200", name:"Handelswaren"},
  { no:"1210", name:"Rohstoffe"},
  { no:"1300", name:"Aktive RA"},
  { no:"1400", name:"Wertschriften (AV)"},
  { no:"1480", name:"Beteiligungen"},
  { no:"1500", name:"Maschinen & Apparate"},
  { no:"1510", name:"Mobiliar"},
  { no:"1520", name:"Büromaschinen"},
  { no:"1530", name:"Fahrzeuge"},
  { no:"1600", name:"Geschäftsliegenschaften"},
  { no:"1700", name:"Immaterielle Werte"},

  // Bilanz Passiven
  { no:"2000", name:"Verbindlichkeiten"},
  { no:"2030", name:"Erhaltene Anzahlungen"},
  { no:"2100", name:"Bankverbindlichkeiten"},
  { no:"2200", name:"Geschuldete MWST"},
  { no:"2300", name:"Passive RA"},
  { no:"2450", name:"Darlehen"},
  { no:"2451", name:"Hypotheken"},
  { no:"2600", name:"Rückstellungen"},
  { no:"2800", name:"Eigenkapital"},
  { no:"2950", name:"Gesetzliche Reserven"},
  { no:"2970", name:"Gewinnvortrag"},

  // Erfolgsrechnung Ertrag
  { no:"3000", name:"Produktionserlöse"},
  { no:"3200", name:"Handelserlöse"},
  { no:"3400", name:"Dienstleistungserlöse"},
  { no:"3600", name:"Übrige Erlöse"},
  { no:"7000", name:"Ertrag Nebenbetrieb"},
  { no:"8100", name:"Betriebsfremder Ertrag"},
  { no:"8510", name:"Ausserordentlicher Ertrag"},

  // Erfolgsrechnung Aufwand
  { no:"4000", name:"Materialaufwand"},
  { no:"4200", name:"Handelswarenaufwand"},
  { no:"4400", name:"Aufwand DL"},
  { no:"5000", name:"Lohnaufwand"},
  { no:"5700", name:"Sozialversicherungen"},
  { no:"5800", name:"Übriger Personalaufwand"},
  { no:"6000", name:"Raumaufwand"},
  { no:"6100", name:"URE"},
  { no:"6200", name:"Fahrzeugaufwand"},
  { no:"6300", name:"Versicherungen"},
  { no:"6500", name:"Verwaltungsaufwand"},
  { no:"6800", name:"Abschreibungen"},
  { no:"6900", name:"Finanzaufwand"},
  { no:"8000", name:"Betriebsfremder Aufwand"},
  { no:"8500", name:"Ausserordentlicher Aufwand"}
];

function fmt(n){
  return String(Math.round(Number(n||0))).replace(/\B(?=(\d{3})+(?!\d))/g,"'");
}

function buildAccountOptions(){
  return [
    `<option value="">— Konto wählen —</option>`,
    ...KONTENPLAN.map(a=>`<option value="${a.no}">${a.no} ${a.name}</option>`)
  ].join("");
}

function loadJournal(cid,year){
  return JSON.parse(localStorage.getItem(journalKey(cid,year))||"[]");
}
function saveJournal(cid,year,rows){
  localStorage.setItem(journalKey(cid,year),JSON.stringify(rows));
}

function getLines(side){
  const root = document.getElementById(side==="debit"?"debitLines":"creditLines");
  return Array.from(root.querySelectorAll("div[data-side]"))
    .map(line=>{
      const sel=line.querySelector("select");
      const inp=line.querySelector("input");
      return {
        accountNo:(sel.value||"").trim(),
        accountName:(sel.selectedOptions[0]?.textContent||"").replace(/^\d+\s*/,""),
        amount:Number(inp.value||0)
      };
    })
    .filter(x=>x.accountNo && x.amount>0);
}

function sum(arr){ return arr.reduce((a,b)=>a+Number(b.amount||0),0); }

function updateSums(){
  const d=sum(getLines("debit"));
  const c=sum(getLines("credit"));

  document.getElementById("sumDebit").textContent = `${fmt(d)} CHF`;
  document.getElementById("sumCredit").textContent = `${fmt(c)} CHF`;

  const ok = d>0 && d===c;
  document.getElementById("balancedState").textContent =
    ok?"ausgeglichen":"nicht ausgeglichen";

  document.getElementById("addBookingBtn").disabled = !ok;
}

function createLine(side){
  const w=document.createElement("div");
  w.dataset.side=side;
  w.style.display="flex"; w.style.gap="8px";

  const s=document.createElement("select");
  s.className="balanceInput"; s.innerHTML=buildAccountOptions();

  const i=document.createElement("input");
  i.type="number"; i.min="0"; i.placeholder="Betrag"; i.className="balanceInput";

  const b=document.createElement("button");
  b.textContent="✕"; b.type="button"; b.className="btn";
  b.onclick=()=>{w.remove();updateSums();};

  s.onchange=updateSums; i.oninput=updateSums;
  w.append(s,i,b);
  return w;
}

document.addEventListener("DOMContentLoaded",()=>{
  const cid = localStorage.getItem(CURRENT_COMPANY_PREFIX+localStorage.getItem(USER_KEY));
  currentYear = DEFAULT_YEARS[0];

  document.getElementById("debitLines").append(createLine("debit"));
  document.getElementById("creditLines").append(createLine("credit"));

  document.getElementById("addDebitLineBtn").onclick =
    ()=>{document.getElementById("debitLines").append(createLine("debit"));updateSums();};

  document.getElementById("addCreditLineBtn").onclick =
    ()=>{document.getElementById("creditLines").append(createLine("credit"));updateSums();};

  document.getElementById("addBookingBtn").onclick = ()=>{
    const fact=document.getElementById("fact").value.trim();
    const debits=getLines("debit");
    const credits=getLines("credit");

    if(!fact) return alert("Buchungstatsache fehlt.");
    if(sum(debits)!==sum(credits)) return alert("Soll ≠ Haben");

    const entry={
      type:"split",
      fact,
      year:currentYear,
      debits, credits,
      total:sum(debits),
      date:new Date().toISOString()
    };

    const list=loadJournal(cid,currentYear);
    list.unshift(entry);
    saveJournal(cid,currentYear,list);

    document.getElementById("fact").value="";
    document.getElementById("debitLines").innerHTML="";
    document.getElementById("creditLines").innerHTML="";
    document.getElementById("debitLines").append(createLine("debit"));
    document.getElementById("creditLines").append(createLine("credit"));
    updateSums();
    alert(`Gebucht in ${currentYear}`);
  };
});
