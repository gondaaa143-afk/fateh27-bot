const replies = {
  assam: "Officer, Assam GS3 ke liye revise karo. Kaziranga, Brahmaputra Floods aur Bodo Accord important hain.",
  ladakh: "Officer, Ladakh me LAC, Galwan, Siachen aur Border Infrastructure revise karo.",
  gujarat: "Officer, Gujarat me Kandla Port, GIFT City aur White Desert revise karo.",
  rajasthan: "Officer, Rajasthan me Desertification, Aravalli aur Indira Gandhi Canal revise karo."
};

function officerCommand() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    alert("Mic support nahi mila.");
    return;
  }

  const rec = new Recognition();
  rec.lang = "hi-IN";
  rec.interimResults = false;

  const btn = document.getElementById("officerBtn");

  rec.onstart = () => btn.innerHTML = "🎙";

  rec.onresult = (e) => {
  const q = e.results[0][0].transcript.toLowerCase();

  let text = "Officer, command receive hua.";

  if (q.includes("assam")) text = replies.assam;
  else if (q.includes("ladakh")) text = replies.ladakh;
  else if (q.includes("gujarat")) text = replies.gujarat;
  else if (q.includes("rajasthan")) text = replies.rajasthan;

  // Debug: pehle screen par dikhao
  alert("Command: " + q + "\n\n" + text);

  // Phir bolne ki koshish
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  msg.rate = 1;
  speechSynthesis.speak(msg);

  btn.innerHTML = "🎤";
};

  rec.onerror = () => btn.innerHTML = "🎤";
  rec.onend = () => btn.innerHTML = "🎤";

  rec.start();
}
