// js/company.js
// Tabs + dynamische Jahres-Management (pro Firma + pro Sektion)
// - Speichert Jahr-Listen pro Firma & Section in LocalStorage:
//   key = uwi_years_${companyId}_${section}
// - Default-Jahre: [2024,2025,2026]
// - Erlaubt Hinzufügen neuer Jahre über Prompt (validiert)
// - Generiert Year-Tabs und Year-Content-Container (falls noch nicht vorhanden)
// - Nutzt Klassen: .active (aktiv), .hidden (display:none)
//
// Erwartete HTML-Struktur:
// - .yearTabs[data-section="..."]  <-- wird befüllt mit .yearBtn (und + Add-Button)
// - .yearContents[data-section="..."] <-- enthält .yearContent[data-year="..."]
//
// Außerdem implementiert: showMainTab(tabName) und showYear(section, year)
// Initialzustand: Bilanz geöffnet, Jahr 2024 aktiv

(function(){
  const CLASS_HIDDEN = 'hidden';
  const CLASS_ACTIVE = 'active';

  // LocalStorage helpers
  function getSelectedCompanyId(){
    // Versuche verschiedene Schlüssel (Kompatibilität)
    return localStorage.getItem('uwi_selected_company') 
        || localStorage.getItem('uwi_currentCompany') 
        || localStorage.getItem('uwi_current_user') 
        || 'GLOBAL'; // fallback key if none (will separate years per 'GLOBAL')
  }

  function yearsStorageKey(companyId, section){
    return `uwi_years_${companyId}_${section}`;
  }

  // Liefert Array von Jahren (strings), falls nicht vorhanden default ['2024','2025','2026']
  window.getYears = function(companyId, section){
    if(!companyId) companyId = getSelectedCompanyId();
    const key = yearsStorageKey(companyId, section);
    const raw = localStorage.getItem(key);
    if(!raw) return ['2024','2025','2026'];
    try{
      const arr = JSON.parse(raw);
      if(Array.isArray(arr) && arr.length) return arr.map(String);
      return ['2024','2025','2026'];
    }catch(e){
      console.warn('Invalid years data for', key, e);
      return ['2024','2025','2026'];
    }
  };

  // Speichert Jahre-Array (strings)
  window.saveYears = function(companyId, section, years){
    if(!companyId) companyId = getSelectedCompanyId();
    const key = yearsStorageKey(companyId, section);
    localStorage.setItem(key, JSON.stringify(years.map(String)));
  };

  // Render Year tabs for a given section
  window.renderYearTabs = function(section){
    const companyId = getSelectedCompanyId();
    const container = document.querySelector(`.yearTabs[data-section="${section}"]`);
    if(!container) return;
    // clear
    container.innerHTML = '';

    // load years
    const years = getYears(companyId, section);

    // create a button for each year
    years.forEach(y=>{
      const btn = document.createElement('button');
      btn.className = `yearBtn tabBtn`;
      btn.dataset.year = String(y);
      btn.dataset.section = section;
      btn.textContent = String(y);
      btn.addEventListener('click', ()=> {
        showYear(section, String(y));
      });
      container.appendChild(btn);
    });

    // Add "+ Jahr hinzufügen" button
    const addBtn = document.createElement('button');
    addBtn.className = 'addYearBtn tabBtn';
    addBtn.type = 'button';
    addBtn.textContent = '+ Jahr hinzufügen';
    addBtn.addEventListener('click', ()=> onAddYearClicked(section));
    container.appendChild(addBtn);

    // set active style on first year (or keep previously active if any)
    // If no active year button exists (e.g., after initial render), activate first.
    const anyActive = container.querySelector('.yearBtn.active');
    if(!anyActive){
      const first = container.querySelector('.yearBtn');
      if(first) first.classList.add(CLASS_ACTIVE);
    }

    // ensure corresponding yearContents exist and show current active
    const activeBtn = container.querySelector('.yearBtn.active') || container.querySelector('.yearBtn');
    if(activeBtn) showYear(section, activeBtn.dataset.year);
  };

  // Show content for a specific year in a section
  window.showYear = function(section, year){
    // 1) update active class in yearTabs
    const container = document.querySelector(`.yearTabs[data-section="${section}"]`);
    if(container){
      const buttons = container.querySelectorAll('.yearBtn');
      buttons.forEach(b => {
        if(b.dataset.year === String(year)) b.classList.add(CLASS_ACTIVE);
        else b.classList.remove(CLASS_ACTIVE);
      });
    }

    // 2) ensure yearContent exists (create if missing)
    const contentsRoot = document.querySelector(`.yearContents[data-section="${section}"]`);
    if(!contentsRoot) return;
    // hide all existing yearContent for this section
    contentsRoot.querySelectorAll('.yearContent').forEach(c => c.classList.add(CLASS_HIDDEN));

    // find existing content
    let content = contentsRoot.querySelector(`.yearContent[data-year="${year}"]`);
    if(!content){
      // create content block
      content = document.createElement('div');
      content.className = 'card contentCard yearContent';
      content.dataset.section = section;
      content.dataset.year = String(year);
      // basic heading and placeholder text
      const h = document.createElement('h2');
      // Friendly title depending on section
      const titleMap = {
        bilanz: 'Bilanz',
        erfolg: 'Erfolgsrechnung',
        buchungen: 'Buchungssätze',
        wirtschaft: 'Wirtschaft',
        recht: 'Recht'
      };
      const base = titleMap[section] || section;
      h.textContent = `${base} ${year}`;
      content.appendChild(h);
      const p = document.createElement('p');
      p.className = 'small muted';
      p.textContent = `Inhalt für ${base} ${year} (Platzhalter).`;
      content.appendChild(p);
      contentsRoot.appendChild(content);
    }

    // show the chosen content
    content.classList.remove(CLASS_HIDDEN);

    // hide others ensured above
  };

  // Handler for adding a new year
  function onAddYearClicked(section){
    const companyId = getSelectedCompanyId();
    const input = prompt('Jahr eingeben (z.B. 2027):');
    if(input === null) return; // cancelled
    const year = String(input).trim();
    // Validate: 4 digits, numeric, between 2000 and 2100
    if(!/^\d{4}$/.test(year)){
      alert('Ungültiges Jahr. Bitte 4-stellige Jahreszahl eingeben (z.B. 2027).');
      return;
    }
    const num = Number(year);
    if(num < 2000 || num > 2100){
      alert('Bitte Jahr zwischen 2000 und 2100 eingeben.');
      return;
    }
    // check not existing
    const years = getYears(companyId, section);
    if(years.includes(year)){
      alert('Dieses Jahr ist bereits vorhanden.');
      return;
    }
    // add and persist
    years.push(year);
    // optional: keep years sorted ascending
    years.sort((a,b)=>Number(a)-Number(b));
    saveYears(companyId, section, years);
    // re-render tabs for this section
    renderYearTabs(section);
    // set newly added year active
    showYear(section, year);
  }

  // showMainTab: show only the main section and render its year tabs (and contents)
  window.showMainTab = function(tabName){
    // hide / show main sections
    document.querySelectorAll('.tabSection').forEach(sec => {
      if(sec.id === `tab-${tabName}`) sec.classList.remove(CLASS_HIDDEN);
      else sec.classList.add(CLASS_HIDDEN);
    });
    // main tab active styling
    document.querySelectorAll('.mainTab').forEach(b=>{
      if(b.dataset.tab === tabName) b.classList.add(CLASS_ACTIVE);
      else b.classList.remove(CLASS_ACTIVE);
    });
    // ensure the year tabs for this section are rendered
    renderYearTabs(tabName);
    // ensure a year is active (prefer 2024 if present)
    const years = getYears(getSelectedCompanyId(), tabName);
    const prefer = years.includes('2024') ? '2024' : years[0];
    if(prefer) showYear(tabName, prefer);
  };

  // initialize: wire events and render initial UI
  document.addEventListener('DOMContentLoaded', () => {
    // wire main tab buttons
    document.querySelectorAll('.mainTab').forEach(btn => {
      btn.addEventListener('click', ()=>{
        const tab = btn.dataset.tab;
        showMainTab(tab);
      });
    });

    // render yearTabs for all sections that exist on page
    document.querySelectorAll('.yearTabs[data-section]').forEach(el => {
      const section = el.dataset.section;
      renderYearTabs(section);
    });

    // Render initial main tab: Bilanz
    // If a main tab button exists with data-tab="bilanz", simulate click
    const initialTabBtn = document.querySelector('.mainTab[data-tab="bilanz"]') || document.querySelector('.mainTab');
    if(initialTabBtn){
      const tab = initialTabBtn.dataset.tab;
      showMainTab(tab);
    }
  });

})();
