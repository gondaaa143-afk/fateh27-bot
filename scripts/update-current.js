const fs=require("fs");
const axios=require("axios");
const {XMLParser}=require("fast-xml-parser");

async function run(){

const parser=new XMLParser();

const feeds=[
"https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
"https://www.thehindu.com/news/national/feeder/default.rss"
];

let articles=[];

for(const feed of feeds){

try{

const xml=(await axios.get(feed)).data;
const json=parser.parse(xml);

const items=json.rss.channel.item||[];

for(const item of items.slice(0,3)){

articles.push({
id:articles.length+1,
title:item.title,
gs:"GS2",
source:feed.includes("pib")?"PIB":"The Hindu",
summary:item.description?.replace(/<[^>]+>/g,"").slice(0,180)||"",
prelims:["Current Affairs","UPSC","National"],
mains:"Use in answer writing."
});

}

}catch{}

}

fs.writeFileSync(
"data/current-affairs.json",
JSON.stringify({
date:new Date().toISOString().slice(0,10),
brief:"Today's UPSC Intelligence Brief",
articles
},null,2)
);

}

run();
