import fs from "fs";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const text = fs.readFileSync("current.txt", "utf8");

for (let i = 0; i < text.length; i += 3500) {
  const part = text.slice(i, i + 3500);

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: part,
        parse_mode: "HTML",
      }),
    }
  );

  const data = await res.json();
  if (!data.ok) throw new Error(JSON.stringify(data));
}
