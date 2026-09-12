module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({
        score: "0/15",
        feedback: "Image missing."
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: [{
          role: "user",
          content: [
            {
              type: "input_text",
              text: "You are a UPSC Mains examiner. Read the handwritten answer and give marks out of 15 with strengths, weaknesses, missing points and a better conclusion."
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        score: "0/15",
        feedback: JSON.stringify(data)
      });
    }

    res.status(200).json({
      score: "AI/15",
      feedback: data.output_text || "Evaluation completed."
    });

  } catch (err) {
    res.status(500).json({
      score: "0/15",
      feedback: err.message
    });
  }
};
