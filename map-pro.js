let intelligence = {};

async function loadIntelligence() {
  try {
    const res = await fetch("./data/intelligence.json?v=" + Date.now());
    intelligence = await res.json();
    highlightToday();
  } catch (e) {
    console.log("Intelligence load failed");
  }
}

function highlightToday() {
  if (!intelligence.highlights) return;

  intelligence.highlights.forEach(item => {
    document.querySelectorAll(".hotspot").forEach(h => {
      const click = h.getAttribute("onclick") || "";
      if (click.includes(item.state)) {
        h.style.background = "#FFD700";
        h.style.boxShadow = "0 0 18px #FFD700";
      }
    });
  });
}

const oldShowState = window.showState;

window.showState = function(name) {

  oldShowState(name);

  const news = intelligence.highlights?.find(x => x.state === name);
  if (!news) return;

  const sheet = document.getElementById("sheetContent");
  if (!sheet) return;

  sheet.innerHTML += `
    <div class="card">
      <h3>🚨 Live Intelligence</h3>
      <p><b>${news.type}</b></p>
      <p>${news.title}</p>
      <span class="badge">${news.priority} Priority</span>
    </div>
  `;
};

loadIntelligence();
