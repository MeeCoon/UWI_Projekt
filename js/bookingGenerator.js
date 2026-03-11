function random(min,max){
return Math.floor(Math.random()*(max-min+1))+min;
}

function randomDate(year){

const start=new Date(year,0,1);
const end=new Date(year,11,31);

const d=new Date(
start.getTime()+Math.random()*(end.getTime()-start.getTime())
);

return d.toLocaleDateString("de-CH");
}

function generateCases(companyName,year,count=100){

const cases=[];

for(let i=0;i<count;i++){

const t=BOOKING_TEMPLATES[
Math.floor(Math.random()*BOOKING_TEMPLATES.length)
];

const amount=random(t.min,t.max);
const date=randomDate(year);

cases.push({
fact:t.text(companyName,amount,date),
solution:{
debit:t.debit,
credit:t.credit,
amount:amount
}
});

}

return cases;
}
