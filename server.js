import express from "express";
import cors from "cors";

const app = express();
app.use(express.static("."));
app.use(cors());
app.use(express.json());
app.get("/data/current.md", (req, res) => {
  res.sendFile(process.cwd() + "/data/current.md");
});
app.get("/", (req, res) => {
  res.send("FATEH27 Officer Voice Live");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/api/current", (req, res) => {
  res.sendFile(process.cwd() + "/data/current.md");
});
});
app.post("/tts", async (req, res) => {
  try {
    const text = req.body?.text || "Officer briefing.";

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `IAS Officer ki tarah Hindi me bolo: ${text}`
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["AUDIO"]
          }
        })
      }
    );

    const data = await r.json();

    if (!r.ok) {
      console.log(data);
      return res.status(r.status).json(data);
    }

    const audio = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audio) {
      console.log(data);
      return res.status(500).send("Audio generate nahi hua");
    }

    res.setHeader("Content-Type", "audio/wav");
    res.send(Buffer.from(audio, "base64"));

  } catch (e) {
    console.log(e);
    res.status(500).send(e.message);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Officer Voice Running on", PORT);
});
