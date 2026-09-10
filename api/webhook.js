export default async function handler(req, res) {
  if (!req.body?.message) return res.status(200).send("OK");

  const chatId = req.body.message.chat.id;
  const text = req.body.message.text || "";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }]
      })
    }
  );

  const data = await response.json();
  const reply =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "Reply nahi mila.";

  await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: reply })
    }
  );

  res.status(200).send("Done");
}
