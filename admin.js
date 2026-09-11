import { db } from "./firebaseConfig.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

Telegram.WebApp.ready();
Telegram.WebApp.expand();

const ADMIN_ID = 5496422260;
const user = Telegram.WebApp.initDataUnsafe?.user;

if (!user || user.id !== ADMIN_ID) {
  document.body.innerHTML = "<h2 style='color:white;text-align:center;margin-top:80px'>❌ Access Denied</h2>";
  throw new Error("Not Admin");
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const summary = document.getElementById("summary").value.trim();

  if (!title || !summary) {
    Telegram.WebApp.showAlert("Title aur Summary dono bharo.");
    return;
  }

  await addDoc(collection(db, "currentAffairs"), {
    title,
    summary,
    date: new Date().toLocaleDateString("en-GB"),
    source: "Admin",
    createdAt: Date.now()
  });

  Telegram.WebApp.showAlert("✅ Current Affairs Saved!");
});
