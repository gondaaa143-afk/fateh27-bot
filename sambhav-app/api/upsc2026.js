export default async function handler(req, res) {
  try {
    const url = 'https://quizcherry.com/previous-year-papers/en/upsc-prelims-2026-gs-set-a/';
    const r = await fetch(url, { headers: { 'user-agent': 'SAMBHAV UPSC/1.0' } });
    if (!r.ok) throw new Error('Source returned ' + r.status);
    const html = await r.text();
    const blocks = html.split(/Question\s+(\d+)\s+of\s+100/i);
    const data = [];
    for (let i = 1; i < blocks.length; i += 2) {
      const raw = blocks[i + 1] || '';
      const text = raw.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,'\n').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim();
      const lines = text.split('\n').map(x=>x.trim()).filter(Boolean);
      const reveal = lines.findIndex(x=>/^Reveal answer$/i.test(x));
      const pre = reveal >= 0 ? lines.slice(0,reveal) : lines;
      const answerLine = lines.find(x=>/^Correct answer Option [ABCD]$/i.test(x));
      const answer = answerLine ? answerLine.slice(-1).toLowerCase().charCodeAt(0)-97 : null;
      if (answer == null) continue;
      const opts = [];
      for (const line of pre) {
        const m = line.match(/^([ABCD])\s+(.+)$/i);
        if (m && opts.length < 4) opts.push(m[2].trim());
      }
      const firstOpt = pre.findIndex(x=>/^[ABCD]\s+/.test(x));
      const q = firstOpt > 0 ? pre.slice(0, firstOpt).filter(x=>!/^\d+\s*$/.test(x)).join(' ').trim() : '';
      if (opts.length === 4 && q) data.push({ y:'2026', s:'General Studies', t:'UPSC Prelims 2026', q, o:opts, a:answer, e:'UPSC Prelims 2026 GS Paper-I — Series A. Correct answer as per the provisional answer key.' });
    }
    const unique = [];
    const seen = new Set();
    for (const x of data) { if (!seen.has(x.q)) { seen.add(x.q); unique.push(x); } }
    res.status(200).json({ year:2026, series:'A', count:unique.length, questions:unique });
  } catch (e) {
    res.status(502).json({ error:'Unable to load the 2026 PYQ source', detail:String(e) });
  }
}