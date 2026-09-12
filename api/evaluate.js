module.exports = async (req, res) => {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { image } = req.body;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are a UPSC Mains examiner.

Read the handwritten answer and return ONLY JSON:

{
 "marks":"8/15",
 "strengths":["","",""],
 "weaknesses":["","",""],
 "missing":["","",""],
 "modelConclusion":"..."
}`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: image.split(",")[1]
                }
              }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await r.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);

    res.status(200).json(result);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
