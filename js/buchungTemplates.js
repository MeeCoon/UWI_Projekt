const BOOKING_TEMPLATES = [

{
text:(f,b,d)=>`Die ${f} kauft Büromaterial für CHF ${b} bar am ${d}.`,
debit:"6500",
credit:"1000",
min:50,
max:600
},

{
text:(f,b,d)=>`Die ${f} bezahlt Büromaterial per Banküberweisung CHF ${b} am ${d}.`,
debit:"6500",
credit:"1020",
min:50,
max:800
},

{
text:(f,b,d)=>`Die ${f} verkauft Waren auf Rechnung für CHF ${b} am ${d}.`,
debit:"1100",
credit:"3200",
min:500,
max:8000
},

{
text:(f,b,d)=>`Ein Kunde bezahlt eine offene Rechnung per Bank CHF ${b} am ${d}.`,
debit:"1020",
credit:"1100",
min:300,
max:6000
},

{
text:(f,b,d)=>`Die ${f} bezahlt eine Lieferantenrechnung per Bank CHF ${b} am ${d}.`,
debit:"2000",
credit:"1020",
min:300,
max:6000
},

{
text:(f,b,d)=>`Die ${f} kauft Handelswaren auf Rechnung für CHF ${b} am ${d}.`,
debit:"4200",
credit:"2000",
min:1000,
max:10000
},

{
text:(f,b,d)=>`Die ${f} bezahlt Löhne per Bank CHF ${b} am ${d}.`,
debit:"5000",
credit:"1020",
min:2000,
max:12000
},

{
text:(f,b,d)=>`Die ${f} bezahlt die Miete per Bank CHF ${b} am ${d}.`,
debit:"6000",
credit:"1020",
min:800,
max:4000
},

{
text:(f,b,d)=>`Die ${f} kauft ein Fahrzeug per Bank CHF ${b} am ${d}.`,
debit:"1530",
credit:"1020",
min:8000,
max:60000
},

{
text:(f,b,d)=>`Die ${f} nimmt ein Bankdarlehen über CHF ${b} auf.`,
debit:"1020",
credit:"2450",
min:10000,
max:200000
},

{
text:(f,b,d)=>`Die ${f} tätigt eine Abschreibung auf Maschinen von CHF ${b}.`,
debit:"6800",
credit:"1500",
min:1000,
max:10000
},

{
text:(f,b,d)=>`Der Eigentümer legt CHF ${b} auf das Bankkonto der Firma ein.`,
debit:"1020",
credit:"2800",
min:1000,
max:50000
}

];
