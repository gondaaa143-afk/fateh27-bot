import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const parser = new Parser();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1"
});

const feeds = [
  "https://pib.gov.in/rss/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/national/feeder/default.rss",
  "https://www.thehindu.com/news/international/feeder/default.rss",
  "https://www.thehindu.com/business/feeder/default.rss",
  "https://www.thehindu.com/sci-tech/feeder/default.rss"
];

let rawNews = "";

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);
    for (const item of rss.items.slice(0, 8)) {
      rawNews += `• ${item.title}\n${item.contentSnippet || ""}\n\n`;
    }
  } catch {}
}

const prompt = `
तुम UPSC Current Affairs Editor हो.

Raw News:
${rawNews}

इसे केवल JSON में बदलो।

{
  "gs1":"Markdown",
  "gs2":"Markdown",
  "gs3":"Markdown",
  "gs4":"Markdown"
}

हर GS में:
- समाचार शीर्षक
- क्या हुआ
- UPSC Prelims Point
- Mains Linkage
- PYQ Hint
- Active Recall
- 2 Keywords
`;

const res = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt
});

const text = res.text.trim();
const data = JSON.parse(text);

fs.mkdirSync("data", { recursive: true });

fs.writeFileSync("data/gs1.md", data.gs1);
fs.writeFileSync("data/gs2.md", data.gs2);
fs.writeFileSync("data/gs3.md", data.gs3);
fs.writeFileSync("data/gs4.md", data.gs4);

fs.writeFileSync(
  "data/current.md",
  `# 📚 FATEH27 Daily Current Affairs

Updated: ${new Date().toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}

## GS1
/open gs1

## GS2
/open gs2

## GS3
/open gs3

## GS4
/open gs4`
);

console.log("Current Affairs generated.");
