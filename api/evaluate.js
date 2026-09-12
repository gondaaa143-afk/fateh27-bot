module.exports = async (req, res) => {
  return res.status(200).json({
    score: "12/15",
    feedback: "API Working ✅"
  });
};
