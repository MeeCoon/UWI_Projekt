// js/company.js
// Implementiert 2-Ebenen-Tabs für company.html:
// - Ebene 1: Haupt-Tabs (Bilanz, Erfolgsrechnung, Buchungssätze, Wirtschaft, Recht)
// - Ebene 2: Jahres-Tabs (2024, 2025, 2026) pro Bereich
//
// Funktionen:
// - showMainTab(tabName) : zeigt die gewählte Hauptsektion, blendet andere aus.
// - showYear(section, year) : zeigt den Inhalt für das gewählten Jahr innerhalb einer Sektion.
//
// Klassen:
// - .active : auf aktiven Buttons
// - .hidden : display:none für ausgeblendete Bereiche
//
// Initialzustand: Bilanz geöffnet, Jahr 2024 aktiv.

(function () {
  // CSS-Klassen
  const CLASS_HIDDEN = 'hidden';
  const CLASS_ACTIVE = 'active';

  // Haupt-Tab Umschalter
  window.showMainTab = function(tabName){
    // Alle sektionen verstecken/anzeigen
    const sections = document.querySelectorAll('.tabSection');
    sections.forEach(sec => {
      if (sec.id === `tab-${tabName}`) {
        sec.classList.remove(CLASS_HIDDEN);
      } else {
        sec.classList.add(CLASS_HIDDEN);
      }
    });

    // Buttons: markiere aktiv
    const mainButtons = document.querySelectorAll('.mainTab');
    mainButtons.forEach(btn => {
      if (btn.dataset.tab === tabName) btn.classList.add(CLASS_ACTIVE);
      else btn.classList.remove(CLASS_ACTIVE);
    });

    // Beim Umschalten auf einen Haupttab: sicherstellen, dass das Standardjahr (2024) angezeigt wird,
    // es sei denn in dieser Sektion ist bereits ein aktiv gesetztes Jahr-Button.
    const yearBtns = document.querySelectorAll(`.yearBtn[data-section="${tabName}"]`);
    const hasActive = Array.from(yearBtns).some(b => b.classList.contains(CLASS_ACTIVE));
    if (!hasActive && yearBtns.length) {
      // setze 2024 aktiv wenn vorhanden, sonst erste
      const prefer = Array.from(yearBtns).find(b => b.dataset.year === '2024') || yearBtns[0];
      if (prefer) {
        showYear(tabName, prefer.dataset.year);
      }
    }
  };

  // Jahres-Umschalter innerhalb einer Sektion
  window.showYear = function(section, year){
    // Buttons: set active state for year buttons of this section
    const yearButtons = document.querySelectorAll(`.yearBtn[data-section="${section}"]`);
    yearButtons.forEach(btn => {
      if (btn.dataset.year === String(year)) btn.classList.add(CLASS_ACTIVE);
      else btn.classList.remove(CLASS_ACTIVE);
    });

    // Inhalte: show only matching .yearContent[data-section=...][data-year=...]
    const contents = document.querySelectorAll(`.yearContent[data-section="${section}"]`);
    contents.forEach(c => {
      if (c.dataset.year === String(year)) c.classList.remove(CLASS_HIDDEN);
      else c.classList.add(CLASS_HIDDEN);
    });
  };

  // Event wiring on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // Main tab buttons
    document.querySelectorAll('.mainTab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        showMainTab(tab);
        // also show default year 2024 for this tab
        showYear(tab, '2024');
      });
    });

    // Year buttons
    document.querySelectorAll('.yearBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        const year = btn.dataset.year;
        showYear(section, year);
      });
    });

    // Initial state: Bilanz + 2024
    showMainTab('bilanz');
    showYear('bilanz', '2024');
  });
})();
