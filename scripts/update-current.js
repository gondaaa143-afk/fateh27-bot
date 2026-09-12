const fs = require("fs");

const API_KEY = process.env.GEMINI_API_KEY;

async function run() {
  const today = new Date().toISOString().slice(0,10);

  const prompt = `Today's date is ${today}.
Return ONLY valid JSON with today's top 5 UPSC current affairs.
Format:
{
  "date":"${today}",
  "brief":"Today's UPSC Intelligence Brief",
  "articles":[
    {
      "id":1,
      "title":"",
      "gs":"GS1/GS2/GS3/GS4",
      "source":"The Hindu/PIB",
      "summary":"",
      "prelims":["","",""],
      "mains":""
    }
  ]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  if (!res.ok) throw new Error(await res.text());

  const out = await res.json();
  let txt = out.candidates[0].content.parts[0].text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  fs.writeFileSync("data/current-affairs.json", txt);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
