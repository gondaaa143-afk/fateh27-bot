const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.GEMINI_API_KEY;

const today = new Date().toISOString().slice(0,10);

const fallback = {
  date: today,
  brief: "Today's UPSC Intelligence Brief",
  articles: [
    {
      id:1,
      title:"Mission Mausam",
      gs:"GS3",
      source:"PIB",
      summary:"Weather forecasting infrastructure strengthening.",
      prelims:["Early warning","Weather infrastructure","Climate resilience"],
      mains:"Use in disaster management answers."
    },
    {
      id:2,
      title:"Population Challenges",
      gs:"GS1",
      source:"AI",
      summary:"Demographic transition and ageing.",
      prelims:["Demographic dividend","Ageing","Migration"],
      mains:"Use in society answers."
    },
    {
      id:3,
      title:"Manufacturing Push",
      gs:"GS3",
      source:"AI",
      summary:"PLI and MSME competitiveness.",
      prelims:["PLI","MSME","Supply Chain"],
      mains:"Use in economy answers."
    }
  ]
};

async function run(){

try{

const prompt=`Today's date is ${today}.
Generate today's TOP 5 UPSC current affairs in VALID JSON only.
Format:
{
"date":"${today}",
"brief":"Today's UPSC Intelligence Brief",
"articles":[]
}`;

const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;

const res=await axios.post(url,{
contents:[{parts:[{text:prompt}]}]
});

const text=res.data.candidates?.[0]?.content?.parts?.[0]?.text||"";

const json=JSON.parse(
text.replace(/```json/g,"").replace(/```/g,"").trim()
);

fs.writeFileSync("data/current-affairs.json",JSON.stringify(json,null,2));

console.log("Gemini update success");

}catch(e){

console.log("Using fallback");

fs.writeFileSync(
"data/current-affairs.json",
JSON.stringify(fallback,null,2)
);

}

}

run();
