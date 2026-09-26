import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
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
Link: ${item.link}
`;
    }
  } catch (e) {
    console.log("Feed Error:", e.message);
  }
}

// ---------- PROMPT ----------
const prompt = `
Tum FATEH27 ke UPSC mentor ho.

Raw News:
${rawNews}

Is news ko UPSC perspective se classify karo.

Har GS section me ye format follow karna.

# Topic

## Kya hua?

## Prelims Point

## Mains Linkage

## PYQ Connection

## Active Recall

Sab Hindi me.

Output ONLY valid JSON.

{
 "gs1":"markdown",
 "gs2":"markdown",
 "gs3":"markdown",
 "gs4":"markdown"
}
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

const responseText = await generate();

const data = JSON.parse(responseText);

// ---------- SAVE FILES ----------
fs.mkdirSync("data", { recursive: true });

fs.writeFileSync("data/gs1.md", data.gs1);
fs.writeFileSync("data/gs2.md", data.gs2);
fs.writeFileSync("data/gs3.md", data.gs3);
fs.writeFileSync("data/gs4.md", data.gs4);

fs.writeFileSync(
  "data/current.md",
  `# 📚 FATEH27 Daily Current Affairs

Updated: ${new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata"
  })}

---

📘 GS1 → /gs1

🏛 GS2 → /gs2

⚙ GS3 → /gs3

🤝 GS4 → /gs4
`
);

console.log("Current Affairs generated successfully.");
