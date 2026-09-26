
import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { apiVersion: "v1" }
});

const parser = new Parser();

const feeds = [
  "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/feeder/default.rss"
];

// ---------- RAW NEWS ----------
let rawNews = "";

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);

    rawNews += `\n===== ${rss.title} =====\n`;

    for (const item of rss.items.slice(0, 10)) {
      rawNews += `
Title: ${item.title}
Summary: ${item.contentSnippet || ""}
`;
    }
  } catch (e) {
    console.log("Feed Error:", e.message);
  }
}

// ---------- PROMPT ----------
const prompt = `
Tum FATEH27 ke UPSC mentor ho.

Neeche di gayi raw news ko Hindi me UPSC Current Affairs me convert karo.

Raw News:
${rawNews}

FINAL FORMAT EXACTLY AISA HO:

# 📚 FATEH27 Daily Current Affairs
Updated: (Aaj ki date)

━━━━━━━━━━━━━━━━━━━━

# GS1

Har topic ke liye:
- क्या हुआ?
- Prelims Point
- PYQ Linkage
- Active Recall

━━━━━━━━━━━━━━━━━━━━

# GS2

Har topic ke liye:
- क्या हुआ?
- Prelims Point
- Mains Linkage
- PYQ Linkage
- Active Recall

━━━━━━━━━━━━━━━━━━━━

# GS3

Har topic ke liye:
- क्या हुआ?
- Prelims Point
- Mains Linkage
- PYQ Linkage
- Active Recall

━━━━━━━━━━━━━━━━━━━━

# GS4

Har topic ke liye:
- Ethical Angle
- Case Study Link
- Active Recall

Sirf markdown return karna.
Koi JSON nahi.
`;

// ---------- GEMINI ----------
const models = [
  "gemini-2.5-flash",
  "gemini-2.5-pro"
];

async function generate() {
  for (const model of models) {
    console.log("Trying:", model);

    for (let retry = 1; retry <= 5; retry++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: prompt
        });

        return res.text;
      } catch (e) {
        const code = e?.status || e?.error?.code;

        console.log(`Attempt ${retry} Failed (${code})`);

        if (code === 503) {
          await new Promise(r => setTimeout(r, retry * 10000));
          continue;
        }

        break;
      }
    }
  }

  throw new Error("All Gemini models failed.");
}

const markdown = await generate();

// ---------- SAVE ----------
fs.mkdirSync("data", { recursive: true });

fs.writeFileSync("data/current.md", markdown);

console.log("Current Affairs generated successfully.");
