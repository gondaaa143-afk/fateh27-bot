
import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const parser = new Parser();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const feeds = [
  "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/national/feeder/default.rss",
  "https://www.thehindu.com/business/feeder/default.rss",
  "https://www.thehindu.com/sci-tech/feeder/default.rss",
  "https://www.thehindu.com/news/international/feeder/default.rss"
];

let news = [];

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);
    news.push(...rss.items.slice(0, 4));
  } catch (e) {}
}

const prompt = `
Tum FATEH27 UPSC Editor ho.

Neeche di gayi news ko Hindi me UPSC Current Affairs banao.

FORMAT STRICTLY:

# 📚 FATEH27 Daily Current Affairs

Date: ${new Date().toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}

---

## GS-1

(sirf GS1 wali news)

Format:

### News Title

क्या हुआ? (3-4 line)

Background

Prelims Facts (3)

Mains Linkage

PYQ Connection

Active Recall (1 Question)

---

## GS-2

Same format

---

## GS-3

Same format

---

## GS-4

Same format

---

## Reports & Index

---

## International Relations

---

## War Room Revision

- 5 One-liners
- 3 PYQs
- 1 Mains Question
- 30-second Active Recall

NEWS:

${news.map(n=>`Title:${n.title}
Snippet:${n.contentSnippet||""}`).join("\n\n")}
`;

const res = await ai.models.generateContent({
  "models/gemini-3.6-flash"
  contents:prompt
});

fs.mkdirSync("data",{recursive:true});
fs.writeFileSync("data/current.md",res.text,"utf8");

console.log("AI Current Affairs generated.");
