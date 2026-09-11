export default function handler(req, res) {
  res.status(200).json({
    title: "Mission Mausam",
    source: "PIB",
    date: "11 Sept 2026",
    summary: "Mission Mausam aims to improve weather forecasting and climate resilience."
  });
}

