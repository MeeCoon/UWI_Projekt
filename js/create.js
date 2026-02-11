document.addEventListener("DOMContentLoaded", () => {
  const legalEl   = document.getElementById("legal");
  const capitalEl = document.getElementById("capital");
  const hintEl    = document.getElementById("capitalHint");
  const formEl    = document.getElementById("createForm");

  function minCapital(form) {
    if (form === "AG") return 100000;
    if (form === "GmbH") return 20000;
    return 0; // Einzelunternehmen
  }

  function fmtCH(n){
    return Number(n).toLocaleString("de-CH");
  }

  function updateCapitalRule() {
    const form = legalEl.value;
    const min = minCapital(form);

    capitalEl.min = String(min);
    capitalEl.step = "1";

    if (form === "AG") hintEl.textContent = "AG: Mindest-Startkapital 100'000 CHF";
    else if (form === "GmbH") hintEl.textContent = "GmbH: Mindest-Startkapital 20'000 CHF";
    else hintEl.textContent = "Einzelunternehmen: Kein Mindest-Startkapital";

    const current = Number(capitalEl.value || 0);
    if (current < min) capitalEl.value = String(min);
  }

  legalEl.addEventListener("change", updateCapitalRule);
  updateCapitalRule();

  formEl.addEventListener("submit", (e) => {
    const form = legalEl.value;
    const min = minCapital(form);
    const cap = Number(capitalEl.value || 0);

    if (cap < min) {
      e.preventDefault();
      alert(`Startkapital zu klein. Minimum für ${form}: ${fmtCH(min)} CHF`);
      capitalEl.value = String(min);
      capitalEl.focus();
      return;
    }

    // ✅ hier NICHTS anderes kaputt machen: dein bestehendes Speichern in create.js
    // bleibt darunter/anschliessend wie du es schon hast.
  });
});
