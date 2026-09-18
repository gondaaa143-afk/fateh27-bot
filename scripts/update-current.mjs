import fs from "fs";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY missing");
}

const prompt = `
Aaj ke UPSC Current Affairs Hindi me banao.

Format:
# Daily Current Affairs

Updated: ${new Date().toISOString().split("T")[0]}

Har topic me:
- Heading
- Kya hua
- UPSC Prelims point
- UPSC Mains point
- PYQ Link Story
`;

const res = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
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

const data = await res.json();

if (!data.candidates?.length) {
  console.log(JSON.stringify(data, null, 2));
  throw new Error("Generation failed");
}

const text = data.candidates[0].content.parts[0].text;

fs.mkdirSync("./data", { recursive: true });
fs.writeFileSync("./data/current.md", text);

console.log("Current Affairs Updated Successfully");
