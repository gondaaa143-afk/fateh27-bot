const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.GEMINI_API_KEY;

async function run() {
  const today = new Date().toISOString().slice(0, 10);

  const prompt = `
Today's date is ${today}.

Generate today's TOP 5 UPSC Current Affairs in VALID JSON ONLY.

Return exactly in this format:

{
  "date":"${today}",
  "brief":"Today's UPSC Intelligence Brief",
  "articles":[
    {
      "id":1,
      "title":"...",
      "gs":"GS2",
      "source":"AI",
      "summary":"One-line summary.",
      "prelims":["Point 1","Point 2","Point 3"],
      "mains":"Use in UPSC answer writing."
    }
  ]
}
`;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const response = await axios.post(url, {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  });

  const text =
    response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!text) throw new Error("Gemini response empty");

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const json = JSON.parse(cleaned);

  fs.writeFileSync(
    "data/current-affairs.json",
    JSON.stringify(json, null, 2)
  );

  console.log("Current affairs updated.");
}

run().catch(err => {
  console.error(err.response?.data || err);
  process.exit(1);
});
