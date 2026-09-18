import fs from "fs";

const text = fs.readFileSync("current.txt", "utf8");
const BOT = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const LIMIT = 3800;

async function send(msg) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT,
        text: msg,
        disable_web_page_preview: true
      })
    }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(JSON.stringify(data));
}

const parts = [];
for (let i = 0; i < text.length; i += LIMIT) {
  parts.push(text.slice(i, i + LIMIT));
}

await send(`📚 FATEH27 Daily Current Affairs\n📅 ${new Date().toLocaleDateString("en-IN")}\n\nTotal Parts: ${parts.length}`);

for (let i = 0; i < parts.length; i++) {
  await send(`📖 Part ${i + 1}/${parts.length}\n\n${parts[i]}`);
}

console.log("Done");
