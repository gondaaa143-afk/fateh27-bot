let voiceStates = {};

async function loadVoiceData() {
  try {
    const res = await fetch("./data/states.json");
    voiceStates = await res.json();
  } catch (e) {
    console.log("Voice data load failed");
  }
}
loadVoiceData();

async function speak(text){
  try{
    const res = await fetch("https://fateh27-bot-production.up.railway.app/tts",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({text})
    });

    if(!res.ok){
      throw new Error("TTS failed");
    }

    const blob = await res.blob();
    const audio = new Audio(URL.createObjectURL(blob));
    await audio.play();

  }catch(e){
    console.log(e);
    alert("Officer Voice server se connect nahi hua.");
  }
}

const aliases = {
  "असम":"Assam","assam":"Assam",
  "उत्तर प्रदेश":"Uttar Pradesh","up":"Uttar Pradesh",
  "राजस्थान":"Rajasthan","rajasthan":"Rajasthan",
  "बिहार":"Bihar","bihar":"Bihar",
  "गुजरात":"Gujarat","gujarat":"Gujarat",
  "लद्दाख":"Ladakh","ladakh":"Ladakh",
  "दिल्ली":"Delhi","delhi":"Delhi",
  "सिक्किम":"Sikkim","sikkim":"Sikkim"
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
    alert("Is device me Voice Recognition support nahi hai.");
    return;
  }

  const btn=document.getElementById("officerBtn");
  if(btn) btn.innerHTML="🎙️";

  const rec=new SR();
  rec.lang="hi-IN";
  rec.interimResults=false;
  rec.maxAlternatives=1;

  rec.onresult=(e)=>{

  const spoken=e.results[0][0].transcript;
  const state=detectState(spoken);

  if(!state){
    alert(`Command: ${spoken}\n\nState pehchana nahi gaya.`);
    if(btn) btn.innerHTML="🎤";
    return;
  }

  if(typeof showState==="function"){
    showState(state);
  }

  let reply="";

  if(state==="Assam"){
    reply="Officer, Assam GS3 revise karo. Kaziranga, Brahmaputra Floods, Bodo Accord, Muga Silk aur Tea Economy important hain.";
  }else if(voiceStates[state]){
    const s=voiceStates[state];
    reply=`Officer, ${state}. Hot Topics: ${s.topics.slice(0,3).join(", ")}. PYQ: ${s.pyq}. Current Focus: ${s.current}.`;
  }else{
    reply=`Officer, ${state} ka data abhi database me nahi hai.`;
  }

  const info=document.getElementById("info");

  if(info){
    info.innerHTML=`
      <div class="card">
        <h3>🎙 Officer Voice</h3>
        <p><b>Command:</b> ${spoken}</p>
        <p>${reply}</p>
      </div>`;
  }

  speak(reply);

  if(btn) btn.innerHTML="🎤";
};

  rec.onerror=(e)=>{
    if(btn) btn.innerHTML="🎤";

    if(e.error==="not-allowed"){
      alert("Mic permission Allow karo.");
    }else if(e.error==="no-speech"){
      alert("Awaaz sunai nahi di. Dobara bolo.");
    }else{
      alert("Voice Error: "+e.error);
    }
  };

  rec.onend=()=>{
    if(btn) btn.innerHTML="🎤";
  };

  rec.start();
}
