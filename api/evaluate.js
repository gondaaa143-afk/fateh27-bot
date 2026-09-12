module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    score: "12/15",
    feedback: "Demo evaluation working."
  });
};
