import fs from "fs";

const text = fs.readFileSync("data/current.md", "utf8");
const BOT = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

const LIMIT = 3800; // Telegram safe limit

async function send(msg) {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT,
        text: msg,
        parse_mode: "HTML",
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

await send(
  `📚 <b>FATEH27 Daily Current Affairs</b>\n📅 ${new Date().toLocaleDateString("en-IN")}\n\nTotal Parts: ${parts.length}`
);

for (let i = 0; i < parts.length; i++) {
  await send(`📖 <b>Part ${i + 1}/${parts.length}</b>\n\n${parts[i]}`);
}

console.log("Telegram post sent successfully.");
