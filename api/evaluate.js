export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const score = Math.floor(Math.random() * 6) + 10;

    const feedback = `
<b>📝 AI Examiner Report</b><br><br>

🟢 Introduction: Good<br>
🟢 Structure: Proper<br>
🔴 Constitutional Articles add karo.<br>
🔴 Current Affairs examples add karo.<br>
🔴 Conclusion aur strong banao.<br><br>

<b>Final Verdict:</b> UPSC style answer hai, aur factual depth add karo.
`;

    return res.status(200).json({
      score: `${score}/15`,
      feedback
    });

  } catch (err) {
    return res.status(500).json({
      error: "Evaluation failed"
    });
  }
}
