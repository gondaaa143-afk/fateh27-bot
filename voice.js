let voiceStates = {};

// -------- Load State Data --------
async function loadVoiceData() {
  try {
    const res = await fetch("./data/states.json");
    voiceStates = await res.json();
  } catch (e) {
    console.log("Voice data load failed", e);
  }
}
loadVoiceData();

// -------- Gemini Officer Voice --------
async function speak(text){
  const btn=document.getElementById("officerBtn");
  if(btn) btn.innerHTML="🎙️";

  try{
    const res=await fetch("https://fateh27-bot-production.up.railway.app/tts",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({text})
    });

    if(!res.ok) throw new Error(await res.text());

    const blob=await res.blob();
    const url=URL.createObjectURL(blob);

    const audio=document.createElement("audio");
    audio.src=url;
    audio.autoplay=true;
    audio.playsInline=true;
    audio.style.display="none";

    document.body.appendChild(audio);
    await audio.play();

    audio.onended=()=>{
      URL.revokeObjectURL(url);
      audio.remove();
      if(btn) btn.innerHTML="🎤";
    };

  }catch(e){
    console.log(e);
    if(btn) btn.innerHTML="🎤";
    alert("Officer Voice server se connect nahi hua.");
  }
}
  } catch (e) {
    console.log(e);
    alert("Officer Voice Error: " + e.message);
  } finally {
    if (btn) btn.innerHTML = "🎤";
  }
}

// -------- State Aliases --------
const aliases = {
  "असम":"Assam","assam":"Assam",
  "उत्तर प्रदेश":"Uttar Pradesh","up":"Uttar Pradesh",
  "राजस्थान":"Rajasthan","rajasthan":"Rajasthan",
  "बिहार":"Bihar","bihar":"Bihar",
  "गुजरात":"Gujarat","gujarat":"Gujarat",
  "दिल्ली":"Delhi","delhi":"Delhi",
  "लद्दाख":"Ladakh","ladakh":"Ladakh",
  "सिक्किम":"Sikkim","sikkim":"Sikkim",
  "मध्य प्रदेश":"Madhya Pradesh","mp":"Madhya Pradesh",
  "महाराष्ट्र":"Maharashtra","maharashtra":"Maharashtra",
  "कर्नाटक":"Karnataka","karnataka":"Karnataka",
  "तमिलनाडु":"Tamil Nadu","tamil":"Tamil Nadu"
};

// -------- Detect State --------
function detectState(text) {
  text = text.toLowerCase();

  for (const k in aliases) {
    if (text.includes(k.toLowerCase())) return aliases[k];
  }

  return null;
}

// -------- Officer Command --------
function officerCommand() {

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SR) {
    alert("Is device me Speech Recognition support nahi hai.");
    return;
  }

  const btn = document.getElementById("officerBtn");
  if (btn) btn.innerHTML = "🎙";

  const rec = new SR();
  rec.lang = "hi-IN";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = async (e) => {

    const spoken = e.results[0][0].transcript;
    const state = detectState(spoken);

    if (!state) {
      alert("State pehchana nahi gaya: " + spoken);
      if (btn) btn.innerHTML = "🎤";
      return;
    }

    if (typeof showState === "function") {
      showState(state);
    }

    let reply = "";

    if (state === "Assam") {
      reply =
        "Officer, Assam GS3 revise karo. Kaziranga National Park, Brahmaputra floods, Bodo Accord aur tea industry UPSC ke liye important hain.";
    } else if (voiceStates[state]) {

      const s = voiceStates[state];

      reply =
        `Officer, ${state}. ` +
        `Capital ${s.capital}. ` +
        `Hot Topics: ${s.topics.slice(0,4).join(", ")}. ` +
        `PYQ: ${s.pyq}. ` +
        `Current Focus: ${s.current}`;

    } else {

      reply = `Officer, ${state} ka data database me abhi nahi hai.`;
    }

    const info = document.getElementById("info");
    if (info) {
      info.innerHTML = `
      <div class="card">
        <h3>🎤 Officer Voice</h3>
        <p><b>Command:</b> ${spoken}</p>
        <p>${reply}</p>
      </div>`;
    }

  await speak(reply);

setTimeout(() => {
  alert(`Command: ${spoken}\n\n${reply}`);
}, 300);
  };

  rec.onerror = (e) => {
    if (btn) btn.innerHTML = "🎤";

    if (e.error === "not-allowed") {
      alert("Mic permission Allow karo.");
    } else if (e.error === "no-speech") {
      alert("Aawaz sunai nahi di. Dobara bolo.");
    } else {
      alert("Voice Error: " + e.error);
    }
  };

  rec.onend = () => {
    if (btn) btn.innerHTML = "🎤";
  };

  rec.start();
}
