export default async function handler(req,res){

if(req.method!=="POST")
return res.status(405).json({error:"Method not allowed"});

const API_KEY=process.env.GEMINI_API_KEY;

const {page,state,query}=req.body;

const prompt=`
You are FATEH27 Officer AI.

Current Page: ${page}
State: ${state||"None"}

User Command:
${query}

Rules:
- Speak like an IAS mentor.
- Maximum 120 words.
- Give UPSC-focused briefing.
- Mention GS Paper if relevant.
- End with one revision task.
`;

const r=await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
contents:[{parts:[{text:prompt}]}]
})
}
);

const data=await r.json();

const text=data.candidates?.[0]?.content?.parts?.[0]?.text||
"Officer briefing unavailable.";

res.status(200).json({text});

}
