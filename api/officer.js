let listening=false;

async function officerCommand(){

const Recognition=
window.SpeechRecognition||
window.webkitSpeechRecognition;

if(!Recognition){
alert("Voice input not supported.");
return;
}

const rec=new Recognition();

rec.lang="en-IN";
rec.interimResults=false;

rec.start();

rec.onstart=()=>{
listening=true;
document.getElementById("officerBtn").innerHTML="🎙 Listening...";
};

rec.onresult=async(e)=>{

const query=e.results[0][0].transcript;

document.getElementById("officerBtn").innerHTML="🧠 Thinking...";

const state=document.getElementById("sheetContent")
?.querySelector("h2")?.innerText||"";

const res=await fetch("./api/officer",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
page:document.title,
state,
query
})
});

const data=await res.json();

const msg=new SpeechSynthesisUtterance(data.text);
msg.lang="en-IN";
msg.rate=1;
speechSynthesis.speak(msg);

alert(data.text);

document.getElementById("officerBtn").innerHTML="🎙 Officer";

};

rec.onerror=()=>{
document.getElementById("officerBtn").innerHTML="🎙 Officer";
};

}
