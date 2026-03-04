const USER_KEY = "uwi_user";
const COMPANIES_PREFIX = "uwi_companies_";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const companiesKey = (u) => `${COMPANIES_PREFIX}${u}`;
const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;
const journalKey = (companyId, year) => `uwi_journal_${companyId}_${year}`;
const yearsKey = (companyId) => `uwi_years_${companyId}`;

const DEFAULT_YEARS = ["2024","2025","2026"];
let currentYear = DEFAULT_YEARS[0];


// ===== KMU KONTENPLAN =====
const KONTENPLAN = [
{no:"1000",name:"Kasse"},
{no:"1020",name:"Bank"},
{no:"1100",name:"Forderungen"},
{no:"1500",name:"Maschinen"},
{no:"1510",name:"Mobiliar"},
{no:"1530",name:"Fahrzeuge"},
{no:"2000",name:"Verbindlichkeiten"},
{no:"2450",name:"Darlehen"},
{no:"2800",name:"Eigenkapital"},
{no:"3000",name:"Produktionserlös"},
{no:"3400",name:"Dienstleistungserlös"},
{no:"4000",name:"Materialaufwand"},
{no:"5000",name:"Lohnaufwand"},
{no:"6000",name:"Raumaufwand"},
{no:"6500",name:"Verwaltungsaufwand"},
{no:"6800",name:"Abschreibungen"}
];

function buildAccountOptions(){
  return [
    `<option value="">— Konto wählen —</option>`,
    ...KONTENPLAN.map(a=>`<option value="${a.no}">${a.no} ${a.name}</option>`)
  ].join("");
}

function loadJournal(cid,year){
  return JSON.parse(localStorage.getItem(journalKey(cid,year)) || "[]");
}

function saveJournal(cid,year,data){
  localStorage.setItem(journalKey(cid,year),JSON.stringify(data));
}

function getYears(companyId){
  try{
    const arr = JSON.parse(localStorage.getItem(yearsKey(companyId)) || "null");
    if(Array.isArray(arr) && arr.length) return arr;
  }catch{}
  return [...DEFAULT_YEARS];
}

function saveYears(companyId,years){
  localStorage.setItem(yearsKey(companyId),JSON.stringify(years));
}

function renderYearTabs(companyId){

  const el = document.getElementById("yearTabs");
  if(!el) return;

  const years = getYears(companyId);

  if(!years.includes(currentYear))
    currentYear = years[0];

  el.innerHTML =
    years.map(y =>
      `<button class="yearBtn ${y===currentYear?"active":""}" data-year="${y}">${y}</button>`
    ).join("")
    +
    `<button class="addYearBtn" id="addYearBtn">+ Jahr</button>`;

  el.onclick = (e)=>{
    const btn = e.target.closest(".yearBtn");
    if(!btn) return;

    currentYear = btn.dataset.year;
    renderYearTabs(companyId);
  };

  document.getElementById("addYearBtn").onclick = ()=>{
    const y = prompt("Neues Jahr eingeben (z.B. 2027)");

    if(!y) return;

    if(!/^\d{4}$/.test(y))
      return alert("Ungültiges Jahr");

    const list = getYears(companyId);

    if(list.includes(y))
      return alert("Jahr existiert schon");

    list.push(y);
    list.sort();

    saveYears(companyId,list);

    currentYear = y;

    renderYearTabs(companyId);
  };
}


function createLine(side){

  const row = document.createElement("div");
  row.dataset.side = side;
  row.style.display = "flex";
  row.style.gap = "8px";

  const select = document.createElement("select");
  select.innerHTML = buildAccountOptions();

  const amount = document.createElement("input");
  amount.type="number";
  amount.placeholder="Betrag";

  const remove = document.createElement("button");
  remove.textContent="✕";
  remove.className="btn";

  remove.onclick = () => row.remove();

  row.append(select,amount,remove);

  return row;
}

function getLines(side){

  const root = document.getElementById(
    side==="debit" ? "debitLines" : "creditLines"
  );

  return Array.from(root.querySelectorAll("div[data-side]"))
  .map(line=>{
    const sel=line.querySelector("select");
    const inp=line.querySelector("input");

    return{
      accountNo:sel.value,
      amount:Number(inp.value||0)
    };
  })
  .filter(x=>x.accountNo && x.amount>0);
}

function sum(arr){
  return arr.reduce((a,b)=>a+b.amount,0);
}


document.addEventListener("DOMContentLoaded",()=>{

  const user = localStorage.getItem(USER_KEY);

  if(!user){
    location.href="index.html";
    return;
  }

  const companyId = localStorage.getItem(currentCompanyKey(user));

  renderYearTabs(companyId);

  document.getElementById("debitLines")
    .append(createLine("debit"));

  document.getElementById("creditLines")
    .append(createLine("credit"));


  document.getElementById("addDebitLineBtn").onclick = ()=>{
    document.getElementById("debitLines")
      .append(createLine("debit"));
  };

  document.getElementById("addCreditLineBtn").onclick = ()=>{
    document.getElementById("creditLines")
      .append(createLine("credit"));
  };


  document.getElementById("addBookingBtn").onclick = ()=>{

    const fact = document.getElementById("fact").value.trim();

    const debits = getLines("debit");
    const credits = getLines("credit");

    if(!fact)
      return alert("Buchungstatsache fehlt");

    if(sum(debits) !== sum(credits))
      return alert("Soll und Haben stimmen nicht überein");

    const entry = {
      type:"split",
      fact,
      debits,
      credits,
      year:currentYear,
      total:sum(debits),
      date:new Date().toISOString()
    };

    const list = loadJournal(companyId,currentYear);

    list.unshift(entry);

    saveJournal(companyId,currentYear,list);

    alert(`Gebucht in ${currentYear}`);

    document.getElementById("fact").value="";
  };


  document.getElementById("backBtn").onclick = ()=>{
    location.href="company.html";
  };

  document.getElementById("logoutBtn").onclick = ()=>{

    const u = localStorage.getItem(USER_KEY);

    localStorage.removeItem(USER_KEY);

    if(u)
      localStorage.removeItem(currentCompanyKey(u));

    location.href="index.html";
  };

});
