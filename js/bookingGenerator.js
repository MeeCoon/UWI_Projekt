// ================================
// UWI KI BUCHUNGSGENERATOR
// ================================

const MWST = 0.081;

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function randomDateInYear(year) {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);
  return new Date(start.getTime() + Math.random() * (end - start));
}

function randomCompanyName() {
  const names = [
    "Helvetia AG",
    "Alpen Technik GmbH",
    "Nova Handels AG",
    "Basel Solutions GmbH",
    "Zürich Consulting AG",
    "Berg & Tal GmbH",
    "Swiss Media AG",
    "Limmat Trading GmbH"
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function pushEntry(list, entry) {
  list.push(entry);
}

function createSplitEntry(date, text, debits, credits) {
  const total = debits.reduce((a,b)=>a+b.amount,0);
  return {
    type: "split",
    date: date.toISOString(),
    fact: text,
    debits,
    credits,
    total
  };
}

// ===========================================
// THEMENBASIERTE GENERATOREN
// ===========================================

function generateSaleWithSkonto(year, companyForm) {

  const list = [];
  const firma = randomCompanyName();
  const netto = randomBetween(2000, 15000);
  const rabatt = 0.10;
  const skonto = 0.02;

  const invoiceDate = randomDateInYear(year);
  const paymentDate = addDays(invoiceDate, 10);

  const rabattBetrag = netto * rabatt;
  const nettoNachRabatt = netto - rabattBetrag;
  const mwstBetrag = nettoNachRabatt * MWST;
  const brutto = nettoNachRabatt + mwstBetrag;
  const skontoBetrag = brutto * skonto;
  const zahlung = brutto - skontoBetrag;

  // Rechnung
  pushEntry(list, createSplitEntry(
    invoiceDate,
    `Am ${invoiceDate.toLocaleDateString()} stellt ${firma} eine Rechnung über CHF ${Math.round(brutto)} (inkl. MWST) mit 10% Rabatt.`,
    [
      { accountNo:"1100", accountName:"Forderungen", amount:Math.round(brutto) }
    ],
    [
      { accountNo:"3000", accountName:"Produktionserlöse", amount:Math.round(nettoNachRabatt) },
      { accountNo:"2200", accountName:"Geschuldete MWST", amount:Math.round(mwstBetrag) }
    ]
  ));

  // Zahlung mit Skonto
  pushEntry(list, createSplitEntry(
    paymentDate,
    `Am ${paymentDate.toLocaleDateString()} erfolgt die Zahlung nach 2% Skonto per Bank.`,
    [
      { accountNo:"1020", accountName:"Bankguthaben", amount:Math.round(zahlung) },
      { accountNo:"3900", accountName:"Debitorenverluste", amount:Math.round(skontoBetrag) }
    ],
    [
      { accountNo:"1100", accountName:"Forderungen", amount:Math.round(brutto) }
    ]
  ));

  return list;
}

function generatePurchase(year) {

  const list = [];
  const netto = randomBetween(1000,10000);
  const date = randomDateInYear(year);
  const mwstBetrag = netto * MWST;
  const brutto = netto + mwstBetrag;

  pushEntry(list, createSplitEntry(
    date,
    `Wareneinkauf für CHF ${Math.round(brutto)} auf Rechnung.`,
    [
      { accountNo:"4000", accountName:"Materialaufwand", amount:Math.round(netto) },
      { accountNo:"1170", accountName:"Vorsteuer MWST", amount:Math.round(mwstBetrag) }
    ],
    [
      { accountNo:"2000", accountName:"Verbindlichkeiten", amount:Math.round(brutto) }
    ]
  ));

  return list;
}

function generateAbschreibung(year) {

  const list = [];
  const betrag = randomBetween(2000,10000);
  const date = randomDateInYear(year);

  pushEntry(list, createSplitEntry(
    date,
    `Abschreibung auf Maschinen über CHF ${betrag}.`,
    [
      { accountNo:"6800", accountName:"Abschreibungen", amount:betrag }
    ],
    [
      { accountNo:"1500", accountName:"Maschinen & Apparate", amount:betrag }
    ]
  ));

  return list;
}

function generateLohn(year) {

  const list = [];
  const brutto = randomBetween(5000,15000);
  const date = randomDateInYear(year);

  pushEntry(list, createSplitEntry(
    date,
    `Lohnzahlung über CHF ${brutto} per Bank.`,
    [
      { accountNo:"5000", accountName:"Lohnaufwand", amount:brutto }
    ],
    [
      { accountNo:"1020", accountName:"Bankguthaben", amount:brutto }
    ]
  ));

  return list;
}

function generateDividend(year, companyForm) {

  if(companyForm !== "AG") return [];

  const list = [];
  const betrag = randomBetween(10000,50000);
  const date = randomDateInYear(year);

  pushEntry(list, createSplitEntry(
    date,
    `Dividendenzahlung an Aktionäre über CHF ${betrag}.`,
    [
      { accountNo:"2970", accountName:"Gewinnvortrag", amount:betrag }
    ],
    [
      { accountNo:"1020", accountName:"Bankguthaben", amount:betrag }
    ]
  ));

  return list;
}

// ===========================================
// HAUPTGENERATOR
// ===========================================

function generate100Cases(companyId, year, companyForm) {

  let all = [];

  for(let i=0;i<100;i++){

    const pick = Math.floor(Math.random()*5);

    if(pick===0) all.push(...generateSaleWithSkonto(year, companyForm));
    if(pick===1) all.push(...generatePurchase(year));
    if(pick===2) all.push(...generateAbschreibung(year));
    if(pick===3) all.push(...generateLohn(year));
    if(pick===4) all.push(...generateDividend(year, companyForm));
  }

  // Chronologisch sortieren
  all.sort((a,b)=> new Date(a.date) - new Date(b.date));

  // Bestehende Buchungen NICHT löschen (Variante b)
  const existing = loadJournal(companyId, year);
  const combined = [...existing, ...all];

  saveJournal(companyId, year, combined);

  return combined.length;
}
