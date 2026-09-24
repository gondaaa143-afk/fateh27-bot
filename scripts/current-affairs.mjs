import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const feeds = [
  "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/national/feeder/default.rss"
];

let rawNews = "";

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);
    for (const item of rss.items.slice(0, 8)) {
      rawNews += `- ${item.title}\n${item.contentSnippet || ""}\n\n`;
    }
  } catch {}
}

const prompt = `
तुम UPSC हिन्दी में Daily Current Affairs बनाओ।

Raw News:
${rawNews}

इन नियमों का पालन करो:

- GS1, GS2, GS3, GS4 अलग-अलग बनाओ।
- हर खबर में:
  - क्या हुआ
  - क्यों महत्वपूर्ण
  - Prelims Point
  - Mains Linkage
  - PYQ Linkage
  - Active Recall
- भाषा पूरी हिन्दी।
- साफ Markdown।
- Output केवल JSON.

{
  "gs1":"...",
  "gs2":"...",
  "gs3":"...",
  "gs4":"..."
}
`;

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: prompt
});

const json = JSON.parse(response.text);

fs.mkdirSync("data",{recursive:true});

fs.writeFileSync("data/gs1.md",json.gs1);
fs.writeFileSync("data/gs2.md",json.gs2);
fs.writeFileSync("data/gs3.md",json.gs3);
fs.writeFileSync("data/gs4.md",json.gs4);

const index = `# 📚 FATEH27 Daily Current Affairs

Updated: ${new Date().toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}

━━━━━━━━━━━━━━━━━━

## GS Papers

- 📘 GS1
- 🏛 GS2
- ⚙ GS3
- 🤝 GS4
`;

fs.writeFileSync("data/current.md",index);

console.log("Current Affairs Generated.");
