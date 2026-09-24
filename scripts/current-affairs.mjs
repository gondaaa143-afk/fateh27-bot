import fs from "fs";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const parser = new Parser();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const feeds = [
  "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/national/feeder/default.rss",
  "https://www.thehindu.com/news/international/feeder/default.rss"
];

let rawNews = "";

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);

    for (const item of rss.items.slice(0, 5)) {
      rawNews += `
Title: ${item.title}
Summary: ${item.contentSnippet || ""}
`;
    }
  } catch (e) {
    console.log("Feed error:", feed);
  }
}

const prompt = `
तुम UPSC 2027 के लिए FATEH27 Current Affairs Editor हो।

इन खबरों को PIB + The Hindu के आधार पर प्रोसेस करो।

OUTPUT सिर्फ हिंदी में दो।

FORMAT बिल्कुल ऐसा हो:

# DAILY CURRENT AFFAIRS
Updated: ${new Date().toLocaleDateString("en-IN", {
  timeZone: "Asia/Kolkata"
})}

━━━━━━━━━━━━━━

# GS1
(समाज, इतिहास, संस्कृति, भूगोल)

हर खबर में:

📰 क्या हुआ?
📍 Prelims Point
🧠 Active Recall (2 प्रश्न)
✍️ Mains Linkage
🔗 PYQ

━━━━━━━━━━━━━━

# GS2
(शासन, संविधान, IR)

उसी format में।

━━━━━━━━━━━━━━

# GS3
(अर्थव्यवस्था, पर्यावरण, विज्ञान, सुरक्षा)

उसी format में।

━━━━━━━━━━━━━━

# GS4
(Ethics)

यदि खबर लागू होती हो तभी जोड़ो।

━━━━━━━━━━━━━━

अंत में:

## ONE PAGE REVISION
- 10 Keywords
- 5 Prelims MCQs (Answer सहित)

Raw News:

${rawNews}
`;

const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: prompt
});

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/current.md", response.text);

console.log("Current Affairs generated.");
