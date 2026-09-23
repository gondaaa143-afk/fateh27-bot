import fs from "fs";
import Parser from "rss-parser";

const parser = new Parser();

const feeds = [
  "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
  "https://www.thehindu.com/news/national/feeder/default.rss"
];

let text = `# Daily Current Affairs

Updated: ${new Date().toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata"
})}

---

`;

for (const feed of feeds) {
  try {
    const rss = await parser.parseURL(feed);

    text += `## ${rss.title}\n\n`;

    for (const item of rss.items.slice(0, 5)) {
      text += `### ${item.title}\n\n`;
      text += `${item.contentSnippet || "No summary available."}\n\n`;
      text += `🔗 ${item.link}\n\n---\n\n`;
    }
  } catch (err) {
    text += `## Feed Error\n${feed}\n\n---\n\n`;
    console.log(err);
  }
}

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/current.md", text, "utf8");

console.log("Current Affairs generated.");
