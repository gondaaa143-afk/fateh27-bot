
import fs from "fs";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  throw new Error("TELEGRAM_BOT_TOKEN ya TELEGRAM_CHAT_ID missing");
}

const text = fs.readFileSync("data/current.md", "utf8");

const chunks = text.match(/[\s\S]{1,3500}/g) || [];

for (const chunk of chunks) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: chunk,
      parse_mode: "HTML",
    }),
  });

  const data = await res.json();
  console.log(`https://api.telegram.org/bot${TOKEN}/sendMessage`);

}
