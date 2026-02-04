/* ------------------ Konfiguration Keys ------------------ */
const USER_KEY = 'uwi_user';
const SELECTED_COMPANY_KEY = 'uwi_selected_company'; // JSON-objekt
const YEARS_KEY_PREFIX = 'uwi_years_';               // uwi_years_<companyId>_<sectionId>
const INCOME_KEY_PREFIX = 'uwi_income_';             // uwi_income_<companyId>_<year>

/* ------------------ Hilfsfunktionen ------------------ */
function getCurrentUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

// return selected company object or redirect to overview
function getSelectedCompanyOrRedirect() {
  const raw = localStorage.getItem(SELECTED_COMPANY_KEY);
  if (!raw) {
    window.location.href = 'overview.html';
    return null;
  }
  try {
    const obj = JSON.parse(raw);
    // In case older code saved only an id string, try to handle
    if (typeof obj === 'string') {
      // we only have id; try to find company object from user's companies
      const user = localStorage.getItem(USER_KEY);
      if (!user) { window.location.href = 'index.html'; return null; }
      const companiesRaw = localStorage.getItem(`uwi_companies_${user}`);
      if (!companiesRaw) { window.location.href = 'overview.html'; return null; }
      const arr = JSON.parse(companiesRaw);
      const found = arr.find(c => String(c.id) === obj);
      if (!found) { window.location.href = 'overview.html'; return null; }
      return found;
    }
    return obj;
  } catch (e) {
    console.error('Fehler beim Parsen von uwi_selected_company:', e);
    window.location.href = 'overview.html';
    return null;
  }
}

// Helper: format number as CHF (de-CH thousands with apostrophe, no decimals)
function fmtCHF(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(num) + ' CHF';
}

// Year storage key for a company and section
function yearsStorageKey(companyId, sectionId) {
  return `${YEARS_KEY_PREFIX}${companyId}_${sectionId}`;
}

// Income storage key for company+year
function incomeStorageKey(companyId, year) {
  return `${INCOME_KEY_PREFIX}${companyId}_${year}`;
}

/* ------------------ Year Tabs & Content ------------------ */

// Load years persisted for company+section or return defaults
function loadYearsFor(companyId, sectionId) {
  const key = yearsStorageKey(companyId, sectionId);
  const raw = localStorage.getItem(key);
  if (!raw) return ['2024','2025','2026'];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length) return arr.map(String);
    return ['2024','2025','2026'];
  } catch { return ['2024','2025','2026']; }
}

function saveYearsFor(companyId, sectionId, yearsArray) {
  const key = yearsStorageKey(companyId, sectionId);
  localStorage.setItem(key, JSON.stringify(yearsArray.map(String)));
}

// Renders year buttons for the given .yearTabs container. SectionId must be string (e.g. "tab-bilanz")
function renderYearTabs(container, companyId, sectionId) {
  if (!container) return;
  container.innerHTML = '';

  const years = loadYearsFor(companyId, sectionId);

  years.forEach(y => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'yearBtn';
    btn.dataset.year = String(y);
    btn.textContent = String(y);
    btn.addEventListener('click', () => {
      activateYear(container, companyId, sectionId, String(y));
    });
    container.appendChild(btn);
  });

  // add button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'addYearBtn';
  addBtn.textContent = '+ Jahr hinzufügen';
  addBtn.addEventListener('click', () => {
    const input = prompt('Jahr eingeben (z.B. 2027):');
    if (input === null) return;
    const yearStr = String(input).trim();
    if (!/^\d{4}$/.test(yearStr)) { alert('Bitte eine gültige 4-stellige Jahreszahl eingeben.'); return; }
    const yearNum = Number(yearStr);
    if (yearNum < 2000 || yearNum > 2100) { alert('Bitte Jahr zwischen 2000 und 2100.'); return; }

    const existing = Array.from(container.querySelectorAll('.yearBtn')).some(b => b.dataset.year === yearStr);
    if (existing) { alert('Dieses Jahr existiert bereits.'); return; }

    // persist
    years.push(yearStr);
    years.sort((a,b)=>Number(a)-Number(b));
    saveYearsFor(companyId, sectionId, years);

    // create new button and click it
    const newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.className = 'yearBtn';
    newBtn.dataset.year = yearStr;
    newBtn.textContent = yearStr;
    newBtn.addEventListener('click', () => activateYear(container, companyId, sectionId, yearStr));

    // insert before addBtn (which is not yet appended)
    container.appendChild(newBtn);
    // re-add addBtn at end
    container.appendChild(addBtn);

    // activate
    newBtn.click();
  });

  container.appendChild(addBtn);

  // activate first year by default
  const first = container.querySelector('.yearBtn');
  if (first) first.click();
}

// Activates a year: sets active class, ensures yearContent exists and shows it
function activateYear(container, companyId, sectionId, year) {
  if (!container) return;
  // toggle active classes
  container.querySelectorAll('.yearBtn').forEach(b => b.classList.toggle('active', b.dataset.year === String(year)));

  // find containing section element (closest ancestor with class tabSection or id starting with 'tab-')
  const sectionEl = container.closest('.tabSection') || container.closest('section') || container.closest('.card');
  if (!sectionEl) return;

  // find or create yearContents root
  let contentsRoot = sectionEl.querySelector('.yearContents');
  if (!contentsRoot) {
    contentsRoot = document.createElement('div');
    contentsRoot.className = 'yearContents';
    sectionEl.appendChild(contentsRoot);
  }

  // hide other contents
  contentsRoot.querySelectorAll('.yearContent').forEach(c => c.classList.add('hidden'));

  // find or create content for this year
  let content = contentsRoot.querySelector(`.yearContent[data-year="${year}"]`);
  if (!content) {
    content = document.createElement('div');
    content.className = 'yearContent contentBox';
    content.dataset.year = String(year);

    // Determine which section this is (use sectionEl.id if present)
    const sid = sectionEl.id || sectionId || '';
    const titleMap = {
      'tab-bilanz': 'Bilanz',
      'tab-erfolg': 'Erfolgsrechnung',
      'tab-buchungen': 'Buchungssätze',
      'tab-wirtschaft': 'Wirtschaft',
      'tab-recht': 'Recht'
    };
    const base = titleMap[sid] || sid || sectionId || 'Inhalt';

    const h = document.createElement('h3');
    h.textContent = `${base} ${year}`;
    content.appendChild(h);

    // If Bilanz, add bilanz placeholder
    if (sid === 'tab-bilanz' || sectionId === 'tab-bilanz') {
      const p = document.createElement('p');
      p.textContent = `Hier kommt die Bilanz für ${year}. (Platzhalter)`;
      content.appendChild(p);
    }
    // If Erfolgsrechnung, build small income editor and load persisted data
    else if (sid === 'tab-erfolg' || sectionId === 'tab-erfolg') {
      buildIncomeEditor(content, companyId, year);
    } else {
      const p = document.createElement('p');
      p.textContent = `Platzhalter-Inhalt für ${base} ${year}.`;
      content.appendChild(p);
    }

    contentsRoot.appendChild(content);
  }

  content.classList.remove('hidden');
}

/* ------------------ Erfolgsrechnung: Speicher / UI ------------------ */
function incomeKey(companyId, year) {
  return `${INCOME_KEY_PREFIX}${companyId}_${year}`;
}
function defaultIncomeData() {
  return {
    warenaufwand:0, personalaufwand:0, raumaufwand:0, marketingaufwand:0, verwaltungsaufwand:0,
    abschreibungen:0, zinsaufwand:0,
    warenertrag:0, dienstleistungsertrag:0, uebriger_ertrag:0, zinsertrag:0
  };
}
function loadIncome(companyId, year) {
  const raw = localStorage.getItem(incomeKey(companyId, year));
  if (!raw) return defaultIncomeData();
  try { return { ...defaultIncomeData(), ...JSON.parse(raw) }; } catch { return defaultIncomeData(); }
}
function saveIncome(companyId, year, data) {
  localStorage.setItem(incomeKey(companyId, year), JSON.stringify(data));
}

function buildIncomeEditor(container, companyId, year) {
  const data = loadIncome(companyId, year);

  const html = document.createElement('div');
  html.className = 'incomeEditor';

  const rows = [
    ['Warenaufwand', 'warenaufwand'],
    ['Personalaufwand', 'personalaufwand'],
    ['Raumaufwand (Miete)', 'raumaufwand'],
    ['Marketingaufwand', 'marketingaufwand'],
    ['Verwaltungsaufwand', 'verwaltungsaufwand'],
    ['Abschreibungen', 'abschreibungen'],
    ['Zinsaufwand', 'zinsaufwand']
  ];
  const rowsErtrag = [
    ['Warenertrag (Umsatz)', 'warenertrag'],
    ['Dienstleistungsertrag', 'dienstleistungsertrag'],
    ['Übriger Betriebsertrag', 'uebriger_ertrag'],
    ['Zinsertrag', 'zinsertrag']
  ];

  const leftCol = document.createElement('div');
  leftCol.style.marginBottom = '10px';
  leftCol.innerHTML = `<strong>Aufwand</strong>`;
  rows.forEach(([label, key])=>{
    const div = document.createElement('div');
    div.className = 'incomeRow';
    div.style.display='flex'; div.style.justifyContent='space-between'; div.style.marginTop='6px';
    const lab = document.createElement('div'); lab.textContent = label;
    const inp = document.createElement('input');
    inp.type='number'; inp.min='0'; inp.step='1'; inp.value = Number(data[key]||0);
    inp.dataset.key = key;
    div.appendChild(lab); div.appendChild(inp);
    leftCol.appendChild(div);
  });

  const rightCol = document.createElement('div');
  rightCol.style.marginBottom='10px';
  rightCol.innerHTML = `<strong>Ertrag</strong>`;
  rowsErtrag.forEach(([label, key])=>{
    const div = document.createElement('div');
    div.className='incomeRow';
    div.style.display='flex'; div.style.justifyContent='space-between'; div.style.marginTop='6px';
    const lab = document.createElement('div'); lab.textContent = label;
    const inp = document.createElement('input'); inp.type='number'; inp.min='0'; inp.step='1'; inp.value = Number(data[key]||0);
    inp.dataset.key = key;
    div.appendChild(lab); div.appendChild(inp);
    rightCol.appendChild(div);
  });

  const totalsDiv = document.createElement('div');
  totalsDiv.style.display='flex'; totalsDiv.style.justifyContent='space-between'; totalsDiv.style.marginTop='12px';
  const totalAufwandSpan = document.createElement('div');
  const totalErtragSpan = document.createElement('div');
  totalAufwandSpan.textContent = 'Total Aufwand: ' + fmtCHF(calcTotalFromInputs(leftCol));
  totalErtragSpan.textContent = 'Total Ertrag: ' + fmtCHF(calcTotalFromInputs(rightCol));
  totalsDiv.appendChild(totalAufwandSpan); totalsDiv.appendChild(totalErtragSpan);

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btnPrimary';
  saveBtn.textContent = 'Speichern';
  saveBtn.style.marginTop = '10px';

  // live update totals when inputs change
  [leftCol, rightCol].forEach(col=>{
    col.addEventListener('input', ()=> {
      totalAufwandSpan.textContent = 'Total Aufwand: ' + fmtCHF(calcTotalFromInputs(leftCol));
      totalErtragSpan.textContent = 'Total Ertrag: ' + fmtCHF(calcTotalFromInputs(rightCol));
    });
  });

  saveBtn.addEventListener('click', ()=>{
    const newData = {...defaultIncomeData()};
    [...leftCol.querySelectorAll('input'), ...rightCol.querySelectorAll('input')].forEach(inp => {
      const key = inp.dataset.key;
      newData[key] = Number(inp.value || 0);
    });
    saveIncome(companyId, year, newData);
    alert('Erfolgsrechnung gespeichert.');
  });

  // append parts to container
  html.appendChild(leftCol);
  html.appendChild(rightCol);
  html.appendChild(totalsDiv);
  html.appendChild(saveBtn);
  container.appendChild(html);
}

// helper to sum inputs inside a column element
function calcTotalFromInputs(colElement) {
  let sum = 0;
  colElement.querySelectorAll('input').forEach(inp => {
    sum += Number(inp.value || 0);
  });
  return sum;
}

/* ------------------ Main Init & Tabs ------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // Load selected company (object)
  const company = getSelectedCompanyOrRedirect();
  if (!company) return;

  // Fill company header (IDs in your HTML: companyTitle, companyMeta)
  const titleEl = document.getElementById('companyTitle') || document.getElementById('companyName') || document.querySelector('.companyHead h1');
  const metaEl = document.getElementById('companyMeta') || document.getElementById('companyMeta') || document.querySelector('.companyHead .meta');

  if (titleEl) titleEl.textContent = company.name || '';
  if (metaEl) {
    const legal = company.legal || company.legalForm || '';
    const industry = company.industry || '';
    const capital = company.startCapital || company.capital || 0;
    const employees = company.employees || company.size || 0;
    metaEl.textContent = `${legal} · ${industry || '–'} · Startkapital: ${new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(Number(capital))} CHF · Mitarbeitende: ${employees}`;
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', ()=> {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(SELECTED_COMPANY_KEY);
      window.location.href = 'index.html';
    });
  }

  // Back to overview link/button (id backBtn or anchor)
  const backBtn = document.getElementById('backBtn') || document.getElementById('backLink');
  if (backBtn) {
    backBtn.addEventListener('click', ()=> { window.location.href = 'overview.html'; });
  }

  // Main tabs: find .mainTab elements
  const mainTabs = Array.from(document.querySelectorAll('.mainTab, .tabBtn, .tab-btn'));
  const sections = Array.from(document.querySelectorAll('.tabSection, .tab-content, section[id^="tab-"]'));

  function showMainTab(tabName) {
    // hide all sections first
    sections.forEach(sec => sec.classList.add('hidden'));
    // remove active from tabs
    mainTabs.forEach(t => t.classList.remove('active'));

    // find requested section: id "tab-"+tabName or id === tabName
    let section = document.getElementById(`tab-${tabName}`);
    if (!section) section = document.getElementById(tabName);
    if (!section) {
      // try matching by data-section
      section = document.querySelector(`.tabSection[data-section="${tabName}"]`);
    }
    if (!section) {
      // fallback to first available
      section = sections[0];
    }

    // activate tab button
    const tabBtn = mainTabs.find(t => (t.dataset.tab || t.getAttribute('data-tab') || t.textContent.toLowerCase()).toString().includes(tabName));
    if (tabBtn) tabBtn.classList.add('active');

    section.classList.remove('hidden');

    // render yearTabs for this section if any
    const yearTabsContainer = section.querySelector('.yearTabs');
    if (yearTabsContainer) {
      // use section.id if available, else use 'tab-'+tabName
      const sectionId = section.id || `tab-${tabName}`;
      renderYearTabs(yearTabsContainer, company.id, sectionId);
    }
  }

  // wire main tab buttons
  mainTabs.forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const t = btn.dataset.tab || btn.getAttribute('data-tab') || btn.textContent.trim().toLowerCase();
      // prefer dataset tab exact value if present
      const tabName = btn.dataset.tab || btn.getAttribute('data-tab') || t;
      showMainTab(tabName);
    });
  });

  // initial show: try to show Bilanz first
  let initial = mainTabs.find(b => (b.dataset.tab === 'bilanz' || (b.textContent||'').toLowerCase().includes('bilanz')));
  if (!initial && mainTabs.length) initial = mainTabs[0];
  if (initial) {
    initial.click();
  } else {
    // fallback: render yearTabs for any existing section
    const anySection = sections[0];
    if (anySection) {
      const yearTabsContainer = anySection.querySelector('.yearTabs');
      if (yearTabsContainer) renderYearTabs(yearTabsContainer, company.id, anySection.id || 'section');
    }
  }
});
