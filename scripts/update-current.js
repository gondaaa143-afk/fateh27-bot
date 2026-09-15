const fs = require("fs");
const axios = require("axios");

const API_KEY = process.env.GEMINI_API_KEY;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGemini(prompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await axios.post(url, {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      });

      return response.data;

    } catch (e) {
      const status = e.response?.status;

      if ((status === 429 || status === 503) && attempt < 5) {
        const wait = attempt * 15000;
        console.log(`Attempt ${attempt} failed (${status}). Waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }

      throw e;
    }
  }
}

async function run() {

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `
Today's date is ${today}.

Generate today's TOP 5 UPSC Current Affairs.

Use real and recent events.

Return ONLY valid JSON.

{
  "date":"${today}",
  "brief":"Today's UPSC Intelligence Brief",
  "articles":[
    {
      "id":1,
      "title":"...",
      "gs":"GS2",
      "source":"The Hindu / PIB",
      "summary":"One-line summary.",
      "prelims":["Point 1","Point 2","Point 3"],
      "mains":"Use in UPSC answer writing."
    }
  ]
}
`;

  const data = await callGemini(prompt);

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!text) {
    throw new Error("Gemini returned empty response.");
  }

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const json = JSON.parse(cleaned);

  fs.mkdirSync("data", { recursive: true });

  fs.writeFileSync(
    "data/current-affairs.json",
    JSON.stringify(json, null, 2)
  );

  console.log("Current affairs updated successfully.");
}

run().catch(err => {
  console.error(err.response?.data || err.message || err);
  process.exit(1);
});
