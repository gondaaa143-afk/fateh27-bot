const GS_RULES = [
  { gs: "GS4", terms: ["ethic", "integrity", "probity", "transparency", "accountability", "corruption", "conflict of interest", "civil service", "ethics"] },
  { gs: "GS1", terms: ["history", "heritage", "culture", "society", "tribal", "population", "urbanisation", "geography", "migration"] },
  { gs: "GS3", terms: ["econom", "inflation", "gdp", "budget", "agriculture", "environment", "climate", "biodiversity", "energy", "security", "technology", "isro", "science", "disaster", "infrastructure", "bank", "rbi", "manufacturing", "employment"] },
  { gs: "GS2", terms: ["constitution", "parliament", "court", "governance", "policy", "scheme", "ministry", "diplomacy", "foreign", "bilateral", "united nations", "rights", "welfare", "mea", "pib", "judicial", "election"] }
];

const STATIC_LINKS = [
  { terms: ["inflation", "monetary", "rbi", "repo rate", "bank"], topic: "Inflation, monetary policy and banking" },
  { terms: ["climate", "biodiversity", "forest", "wildlife", "pollution", "environment"], topic: "Ecology, biodiversity and climate change" },
  { terms: ["constitution", "parliament", "court", "judicial", "rights"], topic: "Constitution, separation of powers and fundamental rights" },
  { terms: ["foreign", "bilateral", "diplomacy", "mea", "united nations", "trade agreement"], topic: "International Relations and India's foreign policy" },
  { terms: ["agriculture", "farmer", "food security", "crop"], topic: "Agriculture, food security and PDS" },
  { terms: ["energy", "renewable", "solar", "green hydrogen", "electricity"], topic: "Energy security and India's energy transition" },
  { terms: ["ai", "artificial intelligence", "isro", "space", "semiconductor", "technology"], topic: "Science & Technology: applications, risks and governance" },
  { terms: ["employment", "gdp", "budget", "tax", "fiscal", "manufacturing"], topic: "Growth, inclusive development and public finance" },
  { terms: ["disaster", "flood", "cyclone", "heatwave", "earthquake"], topic: "Disaster management and resilience" },
  { terms: ["ethic", "integrity", "transparency", "accountability", "corruption"], topic: "Ethics in governance, probity and accountability" }
];

function textOf(article = {}) {
  return [article.title, article.source, article.category, article.why, article.what, article.background, article.prelims, article.mains, article.syllabus].filter(Boolean).join(" ").toLowerCase();
}

function classify(article) {
  const text = textOf(article);
  const scores = GS_RULES.map(rule => ({
    gs: rule.gs,
    score: rule.terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  const best = scores[0];
  return best && best.score > 0 ? { gs: best.gs, confidence: best.score >= 3 ? "high" : "medium" } : { gs: "GS2", confidence: "low" };
}

function staticTopic(article) {
  const text = textOf(article);
  const match = STATIC_LINKS.find(item => item.terms.some(term => text.includes(term)));
  return match ? match.topic : "Review the article's explicit UPSC syllabus link; no confident static-topic match found.";
}

function keywords(article) {
  const text = textOf(article);
  const terms = [...new Set(STATIC_LINKS.flatMap(item => item.terms).filter(term => text.includes(term)))];
  return terms.slice(0, 8);
}

export function enrichArticle(article = {}, index = 0) {
  const classification = classify(article);
  return {
    id: String(article.id || article.slug || index),
    gs: classification.gs,
    classificationConfidence: classification.confidence,
    staticTopic: staticTopic(article),
    relatedKeywords: keywords(article),
    pyqStatus: article.pyq && /UPSC|\b(19|20)\d{2}\b/i.test(article.pyq) && !/theme connection only|not established|practice question/i.test(article.pyq)
      ? "source_label_required"
      : "theme_link_only",
    pyqUrl: "pyq.html",
    pyqLabel: "Explore related PYQs",
    note: "A topic match is not proof that a specific UPSC PYQ was asked. Verify the question and year in the PYQ bank."
  };
}

export default function autolinkHandler(req, res) {
  if (req.method !== "POST") {
    res.set("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const input = Array.isArray(req.body?.articles) ? req.body.articles.slice(0, 30) : null;
  if (!input) return res.status(400).json({ error: "Expected an articles array (maximum 30 items)." });
  return res.json({ items: input.map((article, index) => ({ ...article, ...enrichArticle(article, index) })) });
}
