import fs from "fs";
import Parser from "rss-parser";

const parser = new Parser();

const feeds = [
  "https://pib.gov.in/PressReleaseRSS.aspx?MinCode=31",
  "https://www.thehindu.com/news/national/feeder/default.rss"
];

let text = `# Daily Current Affairs\n\nUpdated: ${new Date().toISOString().slice(0,10)}\n\n---\n\n`;

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);
    text += `## ${rss.title}\n\n`;

    for (const item of rss.items.slice(0,5)) {
      text += `### ${item.title}\n`;
      text += `${item.contentSnippet || item.content || ""}\n\n`;
      text += `🔗 ${item.link}\n\n---\n\n`;
    }
  } catch (e) {
    console.log("Feed failed:", feed);
  }
}

fs.writeFileSync("data/current.md", text);
console.log("Current Affairs generated.");
