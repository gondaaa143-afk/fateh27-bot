import fs from "fs";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Current affairs yahin se uthayega
const text = fs.readFileSync("data/current.md", "utf8");

const parts = [];
for (let i = 0; i < text.length; i += 3500) {
  parts.push(text.slice(i, i + 3500));
}

for (let i = 0; i < parts.length; i++) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: `📚 FATEH27 Current Affairs (${i + 1}/${parts.length})\n\n${parts[i]}`
    })
  });
}
