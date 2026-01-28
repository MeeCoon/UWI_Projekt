// js/company.js
// Firmenansicht – kompatibel mit overview.js (user-spezifische Speicherung)
// + dynamische, klickbare Year-Tabs: neue Jahre können hinzugefügt werden und zeigen Inhalte an.

// Konfiguration Keys
const USER_KEY = 'uwi_user';
const COMPANIES_PREFIX = 'uwi_companies_';
const SELECTED_COMPANY_PREFIX = 'uwi_currentCompany_';

/* ------------------ Helper ------------------ */
function getCurrentUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}
function companiesKey(user) { return COMPANIES_PREFIX + user; }
function selectedCompanyKey(user) { return SELECTED_COMPANY_PREFIX + user; }
function loadCompaniesForUser(user) {
  try {
    return JSON.parse(localStorage.getItem(companiesKey(user))) || [];
  } catch {
    return [];
  }
}

/* ------------------ Year Tabs & Content ------------------ */
// Render year buttons inside a container (.yearTabs element).
// Creates click handlers so the button activates and its year content is shown.
function renderYearTabs(container) {
  if (!container) return;
  // clear existing
  container.innerHTML = '';

  // Default years (can be changed later by stored logic)
  const defaultYears = [2024, 2025, 2026];

  // create year buttons
  defaultYears.forEach((year, idx) => {
    const btn = document.createElement('button');
    btn.className = 'yearBtn';
    btn.type = 'button';
    btn.textContent = String(year);
    btn.dataset.year = String(year);

    // click handler
    btn.addEventListener('click', () => {
      onYearButtonClick(container, String(year));
    });

    container.appendChild(btn);
  });

  // "+ Jahr hinzufügen" button
  const addBtn = document.createElement('button');
  addBtn.className = 'addYearBtn';
  addBtn.type = 'button';
  addBtn.textContent = '+ Jahr hinzufügen';

  addBtn.addEventListener('click', () => {
    const input = prompt('Jahr eingeben (z.B. 2027):');
    if (input === null) return; // user canceled
    const year = Number(String(input).trim());
    if (!/^\d{4}$/.test(String(input).trim()) || isNaN(year) || year < 2000 || year > 2100) {
      alert('Bitte eine gültige 4-stellige Jahreszahl (2000–2100) eingeben.');
      return;
    }

    // check if already exists
    const exists = Array.from(container.querySelectorAll('.yearBtn')).some(b => b.textContent === String(year));
    if (exists) {
      alert('Dieses Jahr ist bereits vorhanden.');
      return;
    }

    // create new button and insert before addBtn
    const newBtn = document.createElement('button');
    newBtn.className = 'yearBtn';
    newBtn.type = 'button';
    newBtn.textContent = String(year);
    newBtn.dataset.year = String(year);
    newBtn.addEventListener('click', () => { onYearButtonClick(container, String(year)); });

    // Insert before addBtn
    container.insertBefore(newBtn, addBtn);

    // Activate newly added year (simulate click)
    newBtn.click();
  });

  container.appendChild(addBtn);

  // Activate the first year by default
  const firstBtn = container.querySelector('.yearBtn');
  if (firstBtn) firstBtn.click();
}

// Handler when a year button is clicked
function onYearButtonClick(container, year) {
  if (!container) return;

  // 1) Update active class on buttons within this container
  container.querySelectorAll('.yearBtn').forEach(b => {
    if (b.dataset.year === String(year)) b.classList.add('active');
    else b.classList.remove('active');
  });

  // 2) Find the tab/section that owns this yearTabs container
  // Assumes structure: container is inside a section with class .tabSection
  const section = container.closest('.tabSection');
  if (!section) {
    // fallback: try parentElement
    console.warn('yearTabs container not inside .tabSection');
    return;
  }

  // 3) Ensure there is a .yearContents root inside this section to hold year-specific content
  let contentsRoot = section.querySelector('.yearContents');
  if (!contentsRoot) {
    contentsRoot = document.createElement('div');
    contentsRoot.className = 'yearContents';
    section.appendChild(contentsRoot);
  }

  // 4) Hide all other yearContent in this section
  contentsRoot.querySelectorAll('.yearContent').forEach(c => c.classList.add('hidden'));

  // 5) Find or create the content element for this year
  let content = contentsRoot.querySelector(`.yearContent[data-year="${year}"]`);
  if (!content) {
    content = document.createElement('div');
    content.className = 'yearContent contentBox';
    content.dataset.year = String(year);

    // Determine base title depending on section id
    const secId = section.id || '';
    const titleMap = {
      'tab-bilanz': 'Bilanz',
      'tab-erfolg': 'Erfolgsrechnung',
      'tab-buchungen': 'Buchungssätze',
      'tab-wirtschaft': 'Wirtschaft',
      'tab-recht': 'Recht'
    };
    const baseTitle = titleMap[secId] || secId || 'Inhalt';

    const h = document.createElement('h3');
    h.textContent = `${baseTitle} ${year}`;
    content.appendChild(h);

    // If this is the Bilanz section, insert a specific placeholder structure
    if (secId === 'tab-bilanz') {
      const p = document.createElement('p');
      p.textContent = `Hier kommt die Bilanz für ${year}. (Platzhalter-Inhalt)`;
      content.appendChild(p);
      // Optionally more detailed bilanz placeholders could be added here
    } else {
      const p = document.createElement('p');
      p.textContent = `Platzhalter-Inhalt für ${baseTitle} ${year}.`;
      content.appendChild(p);
    }

    contentsRoot.appendChild(content);
  }

  // 6) Show this content
  content.classList.remove('hidden');
}

/* ------------------ DOM Ready ------------------ */
document.addEventListener('DOMContentLoaded', () => {
  /* ---- User & Firma laden ---- */
  const user = getCurrentUserOrRedirect();
  if (!user) return;

  const companyId = localStorage.getItem(selectedCompanyKey(user));
  if (!companyId) {
    alert('Keine Firma ausgewählt. Zurück zur Übersicht.');
    window.location.href = 'overview.html';
    return;
  }

  const companies = loadCompaniesForUser(user);
  const company = companies.find(c => c.id === companyId);

  if (!company) {
    alert('Firma nicht gefunden. Zurück zur Übersicht.');
    window.location.href = 'overview.html';
    return;
  }

  /* ---- Firmenkopf ---- */
  const titleEl = document.getElementById('companyTitle');
  const metaEl = document.getElementById('companyMeta');

  if (titleEl) titleEl.textContent = company.name;
  if (metaEl) {
    // Try to use property names as in your stored company objects
    const legal = company.legal || company.legalForm || '';
    const industry = company.industry || '';
    const capital = (company.capital != null ? company.capital : company.startCapital) || 0;
    const size = company.size || company.employees || 0;

    // format capital with apostrophe thousands
    const formattedCapital = (function(n){
      try {
        return new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(Number(n));
      } catch { return String(n); }
    })(capital);

    metaEl.textContent =
      `${legal} · ${industry || '–'} · Startkapital: ${formattedCapital} CHF · Mitarbeitende: ${size}`;
  }

  /* ---- Header Buttons ---- */
  const backBtn = document.getElementById('backBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userDisplay = document.getElementById('userDisplay');

  if (userDisplay) {
    userDisplay.textContent = `Angemeldet: ${user}`;
  }
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'overview.html';
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(selectedCompanyKey(user));
      window.location.href = 'index.html';
    });
  }

  /* ---- Tabs ---- */
  // note: your HTML might use different classes; adjust selectors if needed
  const tabButtons = document.querySelectorAll('.tab-btn, .tabBtn, .mainTab'); // attempt to match common variants
  const tabContents = document.querySelectorAll('.tab-content, .tabSection');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Active-State for main tabs
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Hide all tab contents
      tabContents.forEach(c => c.classList.add('hidden'));

      // Determine target content: either data-tab or id
      const tab = btn.dataset.tab || btn.getAttribute('data-tab') || btn.getAttribute('data-target') || btn.id;
      // try id matching: if btn.dataset.tab === 'bilanz' we expect a section with id 'tab-bilanz' or 'bilanz'
      let content = document.getElementById(`tab-${tab}`) || document.getElementById(tab);
      if (!content) {
        // fallback: find first .tabSection that has a matching data-section
        content = document.querySelector(`.tabSection#tab-${tab}`) || document.querySelector(`.tabSection[data-section="${tab}"]`);
      }
      if (!content) {
        // try to find element by dataset (common variants)
        content = document.querySelector(`section[data-tab="${tab}"], section#${tab}`);
      }
      if (!content) {
        console.warn('Ziel-Content für Tab nicht gefunden:', tab);
        return;
      }
      content.classList.remove('hidden');

      // If the newly shown content has a .yearTabs container, render its years
      const yearTabs = content.querySelector('.yearTabs');
      if (yearTabs) {
        renderYearTabs(yearTabs);
      }
    });
  });

  // Trigger initial tab activation: find first main tab with active class or default to first tab button
  let initialTabBtn = Array.from(tabButtons).find(b => b.classList.contains('active'));
  if (!initialTabBtn && tabButtons.length) initialTabBtn = tabButtons[0];
  if (initialTabBtn) initialTabBtn.click();
});
// Key: pro Firma + pro Jahr
function incomeKey(companyId, year) {
  return `uwi_income_${companyId}_${year}`;
}

function defaultIncomeData() {
  return {
    // Aufwand
    warenaufwand: 0,
    personalaufwand: 0,
    raumaufwand: 0,
    marketingaufwand: 0,
    verwaltungsaufwand: 0,
    abschreibungen: 0,
    zinsaufwand: 0,

    // Ertrag
    warenertrag: 0,
    dienstleistungsertrag: 0,
    uebriger_ertrag: 0,
    zinsertrag: 0
  };
}

function loadIncome(companyId, year) {
  const raw = localStorage.getItem(incomeKey(companyId, year));
  if (!raw) return defaultIncomeData();
  try {
    const obj = JSON.parse(raw);
    return { ...defaultIncomeData(), ...obj };
  } catch {
    return defaultIncomeData();
  }
}

function saveIncome(companyId, year, data) {
  localStorage.setItem(incomeKey(companyId, year), JSON.stringify(data));
}

function sumAufwand(d){
  return (d.warenaufwand||0)+(d.personalaufwand||0)+(d.raumaufwand||0)+(d.marketingaufwand||0)+
         (d.verwaltungsaufwand||0)+(d.abschreibungen||0)+(d.zinsaufwand||0);
}
function sumErtrag(d){
  return (d.warenertrag||0)+(d.dienstleistungsertrag||0)+(d.uebriger_ertrag||0)+(d.zinsertrag||0);
}

function renderIncome(year) {
  const company = getSelectedCompany();
  if (!company) return;

  const area = document.getElementById("incomeArea");
  if (!area) return;

  const d = loadIncome(company.id, year);

  area.innerHTML = `
    <div class="balanceHeaderBlue">
      <div class="balanceTitle">Erfolgsrechnung ${year}</div>
      <div class="balanceSub">alle Beträge in CHF (Start: 0)</div>
    </div>

    <div class="balanceSheet">
      <div class="balanceCol">
        <div class="balanceColTitle">Aufwand</div>

        ${row("Warenaufwand", "warenaufwand", d.warenaufwand)}
        ${row("Personalaufwand", "personalaufwand", d.personalaufwand)}
        ${row("Raumaufwand (Miete)", "raumaufwand", d.raumaufwand)}
        ${row("Marketingaufwand", "marketingaufwand", d.marketingaufwand)}
        ${row("Verwaltungsaufwand", "verwaltungsaufwand", d.verwaltungsaufwand)}
        ${row("Abschreibungen", "abschreibungen", d.abschreibungen)}
        ${row("Zinsaufwand", "zinsaufwand", d.zinsaufwand)}

        <div class="balanceTotal">
          <span>Total Aufwand</span>
          <span id="totalAufwand">${fmtCHF(sumAufwand(d))}</span>
        </div>
      </div>

      <div class="balanceDivider"></div>

      <div class="balanceCol">
        <div class="balanceColTitle">Ertrag</div>

        ${row("Warenertrag (Umsatz)", "warenertrag", d.warenertrag)}
        ${row("Dienstleistungsertrag", "dienstleistungsertrag", d.dienstleistungsertrag)}
        ${row("Übriger Ertrag", "uebriger_ertrag", d.uebriger_ertrag)}
        ${row("Zinsertrag", "zinsertrag", d.zinsertrag)}

        <div class="balanceTotal">
          <span>Total Ertrag</span>
          <span id="totalErtrag">${fmtCHF(sumErtrag(d))}</span>
        </div>
      </div>
    </div>

    <div class="balanceActions">
      <button type="button" class="btn" id="saveIncomeBtn" data-year="${year}">Speichern</button>
      <span class="muted small" id="saveIncomeInfo"></span>
      <span class="muted small" style="margin-left:auto;font-weight:700;">
        Ergebnis: <span id="resultIncome">${fmtCHF(sumErtrag(d) - sumAufwand(d))}</span>
      </span>
    </div>
  `;

  function row(label, key, val) {
    return `
      <div class="balanceRow">
        <span>${label}</span>
        <input class="incomeInput balanceInput" type="number" min="0" step="1" value="${Number(val||0)}" data-ikey="${key}" />
      </div>
    `;
  }

  // Live totals update
  area.querySelectorAll(".incomeInput").forEach(inp => {
    inp.addEventListener("input", () => {
      const data = collectIncomeFromUI(area);
      area.querySelector("#totalAufwand").textContent = fmtCHF(sumAufwand(data));
      area.querySelector("#totalErtrag").textContent = fmtCHF(sumErtrag(data));
      area.querySelector("#resultIncome").textContent = fmtCHF(sumErtrag(data) - sumAufwand(data));
    });
  });

  // Save
  area.querySelector("#saveIncomeBtn").addEventListener("click", () => {
    const data = collectIncomeFromUI(area);
    saveIncome(company.id, year, data);
    const info = area.querySelector("#saveIncomeInfo");
    if (info) info.textContent = `Gespeichert für ${year}.`;
  });
}

function collectIncomeFromUI(areaEl) {
  const data = defaultIncomeData();
  areaEl.querySelectorAll(".incomeInput").forEach(inp => {
    const k = inp.dataset.ikey;
    data[k] = Number(inp.value || 0);
  });
  return data;
}
