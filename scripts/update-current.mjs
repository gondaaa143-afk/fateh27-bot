import fs from "fs";

const today = new Date().toISOString().split("T")[0];

const prompt = `UPSC CSE Current Affairs (${today})

The Hindu + PIB ke basis par 8-10 important points do.

Format:
# Daily Current Affairs

Har news me:
- Heading
- 3-4 line explanation
- Prelims keyword
- Mains value addition`;

const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  }
);

const data = await res.json();

const text =
  data.candidates?.[0]?.content?.parts?.[0]?.text ||
  "# Daily Current Affairs\n\nGeneration failed.";

fs.writeFileSync("data/current.md", text);
