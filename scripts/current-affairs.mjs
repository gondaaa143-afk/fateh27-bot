
import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const parser = new Parser();

const feeds = [
  "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/feeder/default.rss"
];

let rawNews = "";

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);
    for (const item of rss.items.slice(0, 8)) {
      rawNews += `Title: ${item.title}\nSummary: ${item.contentSnippet || ""}\n\n`;
    }
  } catch (e) {
    console.log("Feed error:", e.message);
  }
}

const prompt = `
Tum UPSC Hindi mentor ho.

Raw News:
${rawNews}

Is news ko classify karo.

Har GS section me ye format follow karo:

# Topic

## Kya hua?
## Prelims Point
## Mains Linkage
## PYQ Connection
## Active Recall

Output ONLY valid JSON.

{
  "gs1":"markdown",
  "gs2":"markdown",
  "gs3":"markdown",
  "gs4":"markdown"
}
`;

const models = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash"
];

let responseText = null;

for (const model of models) {
  console.log("Trying", model);

  for (let retry = 1; retry <= 5; retry++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt
      });

      responseText = res.text;
      console.log("Success:", model);
      break;
    } catch (e) {
      const code = e?.status || e?.error?.code;

      if (code === 503) {
        console.log(`Busy (${retry}/5). Waiting...`);
        await new Promise(r => setTimeout(r, retry * 10000));
        continue;
      }

      console.log(`Failed ${model}:`, code);
      break;
    }
  }

  if (responseText) break;
}

if (!responseText) {
  throw new Error("Gemini unavailable after retries.");
}

const data = JSON.parse(responseText);

fs.mkdirSync("data", { recursive: true });

fs.writeFileSync("data/gs1.md", data.gs1);
fs.writeFileSync("data/gs2.md", data.gs2);
fs.writeFileSync("data/gs3.md", data.gs3);
fs.writeFileSync("data/gs4.md", data.gs4);

fs.writeFileSync(
  "data/current.md",
  `# 📚 FATEH27 Daily Current Affairs

Updated: ${new Date().toLocaleDateString("en-IN")}

- GS1 → /gs1
- GS2 → /gs2
- GS3 → /gs3
- GS4 → /gs4`
);

console.log("Current Affairs generated successfully.");
