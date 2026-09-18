import fs from "fs";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) throw new Error("GEMINI_API_KEY missing");

const prompt = `
Aaj ke UPSC Current Affairs Hindi me banao.

Format:
# Daily Current Affairs

Updated: ${new Date().toISOString().split("T")[0]}

Har topic me:
- Heading
- Kya hua
- Prelims point
- Mains point
- PYQ Link Story
`;

let res, data;

for (let i = 0; i < 3; i++) {
  res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  data = await res.json();

  if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) break;

  if (res.status === 503) {
    console.log(`Retry ${i + 1}/3...`);
    await new Promise(r => setTimeout(r, 5000));
    continue;
  }

  console.log(JSON.stringify(data, null, 2));
  throw new Error("Generation failed");
}

if (!res.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
  throw new Error("Gemini busy after 3 retries.");
}
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(
  "data/current.md",
  data.candidates[0].content.parts[0].text
);

console.log("Current Affairs Updated Successfully");
