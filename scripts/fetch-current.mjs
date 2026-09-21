import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const feeds = [
  "https://pib.gov.in/rss.aspx?mincode=2",
  "https://www.thehindu.com/news/national/feeder/default.rss",
  "https://www.thehindu.com/business/feeder/default.rss",
  "https://www.thehindu.com/sci-tech/feeder/default.rss",
  "https://www.thehindu.com/news/international/feeder/default.rss"
];

let items = [];

for (const feed of feeds) {
  try {
    const data = await parser.parseURL(feed);
    items.push(...data.items.slice(0, 5));
  } catch {}
}

const text = items
  .map(i => `- ${i.title}\n${i.contentSnippet || ""}`)
  .join("\n\n");

const prompt = `
UPSC CSE Hindi Current Affairs banao.

Format:
# Daily Current Affairs
Date: ${new Date().toLocaleDateString("en-IN")}

Har topic me:
- GS Category
- Kya hua?
- Prelims Point
- Mains Point
- Keyword (English + Hindi)

News:
${text}
`;

const res = await ai.models.generateContent({
  model: "gemini-3.5-flash-lite",
  contents: prompt
});

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/current.md", res.text);

console.log("Current Affairs Updated");
