const fs = require("fs");

const API_KEY = process.env.GEMINI_API_KEY;

async function run() {
  const today = new Date().toISOString().slice(0,10);

  const prompt = `Return ONLY valid JSON with today's top 5 UPSC current affairs.`;

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

  const data = await res.json();

  console.log(JSON.stringify(data, null, 2)); // log dekhne ke liye

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini response empty");

  text = text.replace(/```json|```/g, "").trim();

  fs.writeFileSync("data/current-affairs.json", text);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
