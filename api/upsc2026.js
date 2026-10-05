export default async function handler(req,res){
 try{
  const r=await fetch('https://www.wrapexams.com/upsc/prelims/gs/2026/');
  if(!r.ok) throw new Error('source '+r.status);
  const html=await r.text();
  const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\\s+/g,' ').trim();
  const links=[...html.matchAll(/href=["']([^"']*\\/upsc\\/prelims\\/gs\\/2026\\/[^"']+)["'][^>]*>/gi)].map(m=>m[1]);
  const unique=[...new Set(links)].filter(x=>/\\/q\\d+\\/?/.test(x));
  const urls=unique.slice(0,100).map(x=>x.startsWith('http')?x:'https://www.wrapexams.com'+x);
  const out=[];
  for(const url of urls){
   const rr=await fetch(url); if(!rr.ok) continue; const h=await rr.text();
   const title=(h.match(/<h1[^>]*>([\\s\\S]*?)<\\/h1>/i)||[])[1];
   const text=clean(h);
   const qn=Number((url.match(/q(\\d+)/i)||[])[1]);
   const body=(text.match(/Q\\d+[^A-Za-z]+([\\s\\S]*?)Attempt Solution/i)||[])[1]||clean(title||'');
   const om=text.match(/A\\s+([^B]+?)\\s+B\\s+([^C]+?)\\s+C\\s+([^D]+?)\\s+D\\s+([^C]+?)(?:Correct answer|Explanation)/i);
   out.push({id:`upsc-2026-gs1-q${String(qn).padStart(3,'0')}`,y:'2026',s:'UPSC GS-I',t:'2026 Prelims',q:body,o:om?[om[1].trim(),om[2].trim(),om[3].trim(),om[4].trim()]:['A','B','C','D']});
  }
  out.sort((a,b)=>Number(a.id.slice(-3))-Number(b.id.slice(-3)));
  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).json({count:out.length,source:'WRAP Exams — UPSC Prelims 2026 GS Paper I Set A',data:out});
 }catch(e){res.status(502).json({error:'Unable to load 2026 PYQs',detail:String(e.message||e)})}
}
