module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        score: "0/15",
        feedback: "Image missing."
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "You are a UPSC Mains examiner. Read this handwritten answer. Give marks out of 15, strengths, weaknesses, missing points and a model conclusion."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: image.split(",")[1]
                }
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        score: "0/15",
        feedback: JSON.stringify(data)
      });
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response";

    return res.status(200).json({
      score: "AI/15",
      feedback: text
    });

  } catch (err) {
    return res.status(500).json({
      score: "0/15",
      feedback: err.message
    });
  }
};
