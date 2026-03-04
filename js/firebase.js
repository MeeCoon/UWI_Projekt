// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const firebaseConfig = {

  apiKey: "XXXX",
  authDomain: "XXXX.firebaseapp.com",
  projectId: "XXXX",
  storageBucket: "XXXX.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"

};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


/* ======================
   FIRMA SPEICHERN
====================== */

export async function saveCompany(company){

  await addDoc(
    collection(db,"companies"),
    company
  );

}


/* ======================
   FIRMEN LADEN
====================== */

export async function loadCompanies(){

  const snapshot = await getDocs(
    collection(db,"companies")
  );

  const list = [];

  snapshot.forEach(docItem=>{

    list.push({
      id: docItem.id,
      ...docItem.data()
    });

  });

  return list;

}


/* ======================
   FIRMA LÖSCHEN
====================== */

export async function deleteCompany(id){

  await deleteDoc(
    doc(db,"companies",id)
  );

}
