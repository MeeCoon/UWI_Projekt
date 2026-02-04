// js/erfolgsrechnung-live.js
function fmtCHF(n) {
  const num = Math.round(Number(n || 0));
  const s = String(num).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${s} CHF`;
}

function sumInputsInside(el) {
  if (!el) return 0;
  let sum = 0;
  el.querySelectorAll('input.balanceInput[type="number"]').forEach(inp => {
    sum += Number(inp.value || 0);
  });
  return sum;
}

function recalc() {
  const colAufwand = document.getElementById("colAufwand");
  const colErtrag = document.getElementById("colErtrag");

  const totalA = sumInputsInside(colAufwand);
  const totalE = sumInputsInside(colErtrag);
  const result = totalE - totalA;

  const outA = document.getElementById("totalAufwand");
  const outE = document.getElementById("totalErtrag");
  const outR = document.getElementById("jahresErgebnis");

  if (outA) outA.textContent = fmtCHF(totalA);
  if (outE) outE.textContent = fmtCHF(totalE);
  if (outR) outR.textContent = fmtCHF(result);
}

document.addEventListener("DOMContentLoaded", () => {
  // live rechnen bei jeder Eingabe
  document.addEventListener("input", (e) => {
    if (e.target.matches('input.balanceInput[type="number"]')) recalc();
  });

  // Start
  recalc();
});
