import { saveCompany } from "./firebase.js";

const USER_KEY = "uwi_user";
const CURRENT_COMPANY_PREFIX = "uwi_currentCompany_";

const currentCompanyKey = (u) => `${CURRENT_COMPANY_PREFIX}${u}`;

document.addEventListener("DOMContentLoaded", () => {

const user = localStorage.getItem(USER_KEY);

if(!user){

window.location.href="index.html";
return;

}

document.getElementById("userDisplay").textContent = `Angemeldet: ${user}`;


document.getElementById("backOverviewBtn").onclick = () => {
window.location.href="overview.html";
};

document.getElementById("logoutBtn").onclick = () => {

localStorage.removeItem(USER_KEY);
localStorage.removeItem(currentCompanyKey(user));

window.location.href="index.html";

};


const form = document.getElementById("createForm");

form.addEventListener("submit", async (e) => {

e.preventDefault();

const name = document.getElementById("name").value.trim();
const legal = document.getElementById("legal").value;
const capital = Number(document.getElementById("capital").value || 0);
const industry = document.getElementById("industry").value;
const purpose = document.getElementById("purpose").value;
const size = Number(document.getElementById("size").value || 1);

if(!name){
alert("Firmenname fehlt");
return;
}

const company = {

name,
legal,
capital,
industry,
purpose,
size,
createdAt:new Date().toISOString()

};

await saveCompany(company);

alert("Firma gespeichert");

window.location.href="overview.html";

});

});
