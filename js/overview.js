import { loadCompanies, deleteCompany } from "./firebase.js";

const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

function getUserOrRedirect(){

const user = localStorage.getItem(USER_KEY);

if(!user){

window.location.href="index.html";
return null;

}

return user;

}


async function renderCompanies(user){

const list = document.getElementById("companiesList");

const companies = await loadCompanies();

list.innerHTML="";


if(!companies.length){

list.innerHTML=`<div class="muted">Noch keine Firmen erstellt.</div>`;
return;

}


companies.forEach(c=>{

const row=document.createElement("div");

row.className="listItem";

row.innerHTML=`

<div class="listMain">

<div class="listTitle">
${c.name}
</div>

<div class="muted small">
${c.legal} · Mitarbeitende: ${c.size}
</div>

</div>

<div class="listActions">

<button class="btn openBtn" data-id="${c.id}">
Öffnen
</button>

<button class="btn deleteBtn" data-id="${c.id}">
Löschen
</button>

</div>

`;

list.appendChild(row);

});


list.onclick = async (e)=>{

const openBtn = e.target.closest(".openBtn");
const deleteBtn = e.target.closest(".deleteBtn");

if(openBtn){

const id = openBtn.dataset.id;

localStorage.setItem(
currentCompanyKey(user),
id
);

window.location.href="company.html";

}


if(deleteBtn){

const id = deleteBtn.dataset.id;

if(!confirm("Firma löschen?"))
return;

await deleteCompany(id);

renderCompanies(user);

}

};

}


document.addEventListener("DOMContentLoaded", async ()=>{

const user = getUserOrRedirect();

if(!user) return;

document.getElementById("userDisplay").textContent=`Angemeldet: ${user}`;

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem(USER_KEY);

window.location.href="index.html";

};

document.getElementById("createBtn").onclick=()=>{

window.location.href="create.html";

};

renderCompanies(user);

});
