import fs from "fs";
import Parser from "rss-parser";

const parser = new Parser();
const API_KEY = process.env.GEMINI_API_KEY;

const feeds = [
  "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/feeder/default.rss"
];

let rawNews = "";

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);
    for (const item of rss.items.slice(0, 10)) {
      rawNews += `Title: ${item.title}\nSummary: ${item.contentSnippet || ""}\n\n`;
    }
  } catch {}
}

const prompt = `
Tum UPSC Hindi mentor ho.

Raw News:
${rawNews}

Hindi me Current Affairs banao.

Format:

# GS1
- Kya hua
- Prelims Point
- PYQ Linkage
- Active Recall

# GS2
- Kya hua
- Prelims Point
- Mains Linkage
- PYQ Linkage
- Active Recall

# GS3
- Kya hua
- Prelims Point
- Mains Linkage
- PYQ Linkage
- Active Recall

# GS4
- Ethical Angle
- Case Study
- Active Recall

Sirf Markdown return karo.
`;

async function generate() {
  for (let retry = 1; retry <= 5; retry++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          })
        }
      );

      if (res.status === 503) {
        await new Promise(r => setTimeout(r, retry * 10000));
        continue;
      }

      if (!res.ok) throw new Error(await res.text());

      const json = await res.json();
      return json.candidates[0].content.parts[0].text;

    } catch (e) {
      if (retry === 5) throw e;
      await new Promise(r => setTimeout(r, retry * 10000));
    }
  }
}

const markdown = await generate();

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/current.md", markdown);

console.log("Current Affairs generated.");
