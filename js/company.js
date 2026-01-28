const USER_KEY = 'uwi_user';

function getCurrentUserOrRedirect() {
  const user = localStorage.getItem(USER_KEY);
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

/* --------- Year Tabs Logic --------- */
function renderYearTabs(container) {
  container.innerHTML = '';

  const years = [2025];

  years.forEach(y => {
    const btn = document.createElement('button');
    btn.className = 'yearBtn active';
    btn.textContent = y;
    container.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'addYearBtn';
  addBtn.textContent = '+ Jahr hinzufügen';

  addBtn.onclick = () => {
    const input = prompt('Jahr eingeben (2026–2100)');
    const year = Number(input);
    if (!year || year < 2026 || year > 2100) {
      alert('Ungültiges Jahr');
      return;
    }

    const exists = [...container.querySelectorAll('.yearBtn')]
      .some(b => Number(b.textContent) === year);
    if (exists) return;

    const btn = document.createElement('button');
    btn.className = 'yearBtn';
    btn.textContent = year;
    container.insertBefore(btn, addBtn);
  };

  container.appendChild(addBtn);
}

/* --------- Tabs --------- */
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUserOrRedirect();
  if (!user) return;

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.add('hidden'));

      btn.classList.add('active');
      const tab = btn.dataset.tab;
      const content = document.getElementById(tab);
      content.classList.remove('hidden');

      const yearTabs = content.querySelector('.yearTabs');
      if (yearTabs) renderYearTabs(yearTabs);
    });
  });
});
