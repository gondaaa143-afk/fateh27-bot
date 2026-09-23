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
    console.log("Feed Error:", feed);
  }
}

const prompt = `
तुम FATEH27 UPSC Editor हो।

इन खबरों को हिंदी में UPSC Current Affairs में बदलो।

सिर्फ VALID JSON लौटाना।

हर सेक्शन में यही format रहे:

📰 क्या हुआ? (3-4 लाइन)

📍 Prelims Point (3)

✍️ Mains Linkage

🔗 PYQ Connection

🧠 Active Recall (2 प्रश्न)

News:

${rawNews}

Output:

{
  "gs1":"...",
  "gs2":"...",
  "gs3":"...",
  "gs4":"..."
}
`;

const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  contents: prompt,
});

let text = response.text.trim();

// Agar Gemini ```json ... ``` de to hata do
text = text.replace(/```json/g, "").replace(/```/g, "").trim();

const data = JSON.parse(text);
fs.mkdirSync("data", { recursive: true });

fs.writeFileSync("data/gs1.md", data.gs1);
fs.writeFileSync("data/gs2.md", data.gs2);
fs.writeFileSync("data/gs3.md", data.gs3);
fs.writeFileSync("data/gs4.md", data.gs4);

fs.writeFileSync(
  "data/current.md",
  `# 📚 FATEH27 Daily Current Affairs

Updated: ${new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata"
  })}

━━━━━━━━━━━━━━

GS1 → /gs1

GS2 → /gs2

GS3 → /gs3

GS4 → /gs4`
);

console.log("Current Affairs generated.");
