// js/company.js
// Tab- & Jahres-Logik (ohne Blockade durch fehlenden User)

/* --------- Year Tabs Logic --------- */
function renderYearTabs(container) {
  container.innerHTML = '';

  // Startjahr
  const years = [2025];

  years.forEach(year => {
    const btn = document.createElement('button');
    btn.className = 'yearBtn active';
    btn.textContent = year;
    container.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'addYearBtn';
  addBtn.textContent = '+ Jahr hinzufügen';

  addBtn.addEventListener('click', () => {
    const input = prompt('Jahr eingeben (2026–2100)');
    const year = Number(input);

    if (!year || year < 2026 || year > 2100) {
      alert('Bitte ein gültiges Jahr zwischen 2026 und 2100 eingeben.');
      return;
    }

    const exists = [...container.querySelectorAll('.yearBtn')]
      .some(b => Number(b.textContent) === year);
    if (exists) return;

    const btn = document.createElement('button');
    btn.className = 'yearBtn';
    btn.textContent = year;

    container.insertBefore(btn, addBtn);
  });

  container.appendChild(addBtn);
}

/* --------- Tabs --------- */
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {

      // Active-Status
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Inhalte umschalten
      tabContents.forEach(c => c.classList.add('hidden'));
      const tab = btn.dataset.tab;
      const content = document.getElementById(tab);
      if (!content) return;

      content.classList.remove('hidden');

      // Jahres-Tabs nur für bestimmte Reiter
      const yearTabs = content.querySelector('.yearTabs');
      if (yearTabs) {
        renderYearTabs(yearTabs);
      }
    });
  });
});
