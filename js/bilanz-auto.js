document.addEventListener("DOMContentLoaded", () => {

const inputs = document.querySelectorAll(".balanceInput");

function formatCHF(n){
  const num = Math.round(Number(n || 0));
  return num.toLocaleString("de-CH") + " CHF";
}

function calculateBalance(){

  let aktiven = 0;
  let passiven = 0;

  const aktivenInputs = document.querySelectorAll(".balanceCol:first-child .balanceInput");
  const passivenInputs = document.querySelectorAll(".balanceCol:last-child .balanceInput");

  aktivenInputs.forEach(i=>{
    aktiven += Number(i.value || 0);
  });

  passivenInputs.forEach(i=>{
    passiven += Number(i.value || 0);
  });

  document.getElementById("totalAktiven").textContent = formatCHF(aktiven);
  document.getElementById("totalPassiven").textContent = formatCHF(passiven);

}

inputs.forEach(input=>{
  input.addEventListener("input", calculateBalance);
});

calculateBalance();

});
