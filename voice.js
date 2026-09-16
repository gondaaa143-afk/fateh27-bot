let voiceStates = {};

async function loadVoiceData() {
  try {
    const res = await fetch("./data/states.json");
    voiceStates = await res.json();
  } catch (e) {
    console.log("Voice data load failed", e);
  }
}
loadVoiceData();

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "hi-IN";
  msg.rate = 0.95;
  msg.pitch = 1;

  const voices = speechSynthesis.getVoices();
  const hi = voices.find(v => v.lang.startsWith("hi"));
  if (hi) msg.voice = hi;

  setTimeout(() => speechSynthesis.speak(msg), 300);
}

const aliases = {
  "असम":"Assam","assam":"Assam",
  "उत्तर प्रदेश":"Uttar Pradesh","up":"Uttar Pradesh",
  "राजस्थान":"Rajasthan","rajasthan":"Rajasthan",
  "गुजरात":"Gujarat","gujarat":"Gujarat",
  "बिहार":"Bihar","bihar":"Bihar",
  "झारखंड":"Jharkhand","jharkhand":"Jharkhand",
  "लद्दाख":"Ladakh","ladakh":"Ladakh",
  "दिल्ली":"Delhi","delhi":"Delhi",
  "सिक्किम":"Sikkim","sikkim":"Sikkim",
  "तमिलनाडु":"Tamil Nadu","tamil":"Tamil Nadu",
  "केरल":"Kerala","kerala":"Kerala",
  "कर्नाटक":"Karnataka","karnataka":"Karnataka",
  "महाराष्ट्र":"Maharashtra","maharashtra":"Maharashtra",
  "पंजाब":"Punjab","punjab":"Punjab",
  "हरियाणा":"Haryana","haryana":"Haryana",
  "ओडिशा":"Odisha","odisha":"Odisha"
};

function detectState(text){
  text=text.toLowerCase();
  for(const k in aliases){
    if(text.includes(k.toLowerCase())) return aliases[k];
  }
  return null;
}

function officerCommand(){

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  if(!SR){
    alert("Voice Recognition support nahi hai.");
    return;
  }

  const btn=document.getElementById("officerBtn");
  btn.innerHTML="🎙";

  const rec=new SR();
  rec.lang="hi-IN";
  rec.interimResults=false;
  rec.maxAlternatives=1;

  speechSynthesis.getVoices();

  rec.onstart=()=>{
    btn.innerHTML="🎙";
  };

  rec.onresult=(e)=>{

    const spoken=e.results[0][0].transcript;
    const state=detectState(spoken);

    if(!state){
      const msg="Officer. State ka naam dobara boliye.";
      alert(msg);
      speak(msg);
      btn.innerHTML="🎤";
      return;
    }

    let reply="";

    if(state==="Assam"){

      reply=`Officer Briefing.

Assam.

North East ka gateway.

Rajdhani Dispur.

Sabse bada shahar Guwahati.

Brahmaputra aur Barak mukhya nadiyan.

Kaziranga UNESCO World Heritage Site.

Manas bhi UNESCO site.

One Horned Rhino.

Tea production me Bharat ka sabse bada yogdan.

Muga Silk ke liye famous.

UPSC Focus.

Kaziranga.

Brahmaputra Floods.

Bodo Accord.

Tea Economy.`;

    }else{

      const s=voiceStates[state];

      if(s){

        reply=`Officer Briefing.

${state}.

Hot Topics.

${s.topics.slice(0,4).join(", ")}.

PYQ.

${s.pyq}.

Current Focus.

${s.current}.`;

      }else{

        reply=`Officer. ${state} ka data database me nahi mila.`;

      }
    }

    if(typeof showState==="function"){
      showState(state);
    }

    const info=document.getElementById("info");
    if(info){
      info.innerHTML += `
      <div class="card">
        <h3>🎙 Officer Voice</h3>
        <p>${reply.replace(/\n/g,"<br>")}</p>
      </div>`;
    }

    alert(reply);
    speak(reply);

    btn.innerHTML="🎤";
  };

  rec.onerror=(e)=>{

    btn.innerHTML="🎤";

    if(e.error==="not-allowed"){
      alert("Mic permission Allow karo.");
      return;
    }

    if(e.error==="no-speech"){
      const msg="Officer. Awaaz sunai nahi di. Dobara boliye.";
      alert(msg);
      speak(msg);
      return;
    }

    console.log("Speech Error:", e.error);
  };

  rec.onend=()=>{
    btn.innerHTML="🎤";
  };

  rec.start();
}
