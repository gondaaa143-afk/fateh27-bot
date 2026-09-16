import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/tts", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `IAS Officer ki tarah Hindi me bolo: ${text}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"]
          }
        })
      }
    );

    const data = await response.json();
    const audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audio) return res.status(500).send("Audio nahi bana");

    res.setHeader("Content-Type", "audio/wav");
    res.send(Buffer.from(audio, "base64"));
  } catch (e) {
    console.error(e);
    res.status(500).send("Server Error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Officer Voice Ready");
});
