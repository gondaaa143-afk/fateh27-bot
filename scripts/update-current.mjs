import fs from "fs";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

let text = "";

for (let i = 0; i < 5; i++) {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    text = res.text;

    if (text) break;
  } catch (e) {
    console.log(`Retry ${i + 1}/5`);
    await new Promise(r => setTimeout(r, (i + 1) * 15000));
  }
}

if (!text) {
  throw new Error("Gemini busy after 5 retries.");
}

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/current.md", text);

console.log("Current Affairs Updated Successfully");
