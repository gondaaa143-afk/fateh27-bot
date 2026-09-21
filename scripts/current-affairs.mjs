import fs from "fs";
import Parser from "rss-parser";

const parser = new Parser();

const feeds = [
  "https://pib.gov.in/PressReleaseRSS.aspx?MinCode=31",
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

    text += `## ${rss.title}

`;

    for (const item of rss.items.slice(0, 5)) {
      text += `### ${item.title}

`;
      text += `${item.contentSnippet || item.content || "No summary available."}

`;
      text += `🔗 ${item.link}

---

`;
    }
  } catch (err) {
    console.log("Feed failed:", feed);
  }
}

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/current.md", text);

console.log("Current Affairs generated.");
