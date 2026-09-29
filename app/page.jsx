"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: "Officer", id: "F27-0001", xp: 0, streak: 0, solved: 0, gs1: 0, gs2: 0, gs3: 0, gs4: 0 });

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();

    const telegramUser = tg?.initDataUnsafe?.user;
    let progress = {};
    try { progress = JSON.parse(localStorage.getItem("FATEH27_PROGRESS") || "{}"); } catch {}

    const name = telegramUser?.first_name || "Officer";
    const id = localStorage.getItem("officerId") || `F27-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem("officerId", id);

    setProfile({
      name, id,
      xp: Number(progress.xp || 0),
      streak: Number(progress.streak || 0),
      solved: Number(progress.solved || 0),
      gs1: Number(progress.gs1 || 0),
      gs2: Number(progress.gs2 || 0),
      gs3: Number(progress.gs3 || 0),
      gs4: Number(progress.gs4 || 0)
    });
  }, []);

  const modules = [
    ["🧭", "Commander Map", "India • World • UPSC Mapping", "/command-map"],
    ["🎯", "PYQ Intelligence", "UPSC Previous Year Questions", "/pyq"],
    ["📘", "GS1", "History • Culture • Geography", "/gs1"],
    ["📗", "GS2", "Polity • Governance • IR", "/gs2"],
    ["📙", "GS3", "Economy • Environment • S&T", "/gs3"],
    ["📕", "GS4", "Ethics • Integrity • Aptitude", "/gs4"],
    ["🤖", "AI Answer Evaluation", "UPSC Mains Answer Analysis", "/answer.html"],
    ["📰", "Current Affairs", "UPSC Current Affairs Command Center", "/current-affairs.html"],
    ["↻", "Revision Engine", "Active Recall • Spaced Revision • Weak Topics", "/revision.html"]
  ];

  return (
    <main>
      <div className="f27-bg" />
      <div className="f27-grid" />

      <div className="f27-wrap">
        <section className="f27-panel">
          <div className="f27-top">
            <div className="f27-logo">FATEH27</div>
            <div className="f27-badge">BETA v1.0 • LIVE</div>
          </div>

          <div className="f27-profile">
            <div className="f27-avatar">{profile.name[0] || "F"}</div>
            <div>
              <div className="f27-name">{profile.name}</div>
              <div className="f27-id">{profile.id}</div>
              <div className="f27-clock">{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>

          <div className="f27-idcard">
            <div className="f27-kicker">OFFICER ACCESS CARD</div>
            <div className="f27-cardname">{profile.name}</div>
            <div className="f27-clearance">Clearance: ALPHA</div>
          </div>

          <button className="f27-action" onClick={() => router.push("/ai-secretary.html")}>
            ✦ Open AI Secretary →
          </button>

          <div className="f27-section">Quick Launch</div>

          <div className="f27-quick">
            {modules.map(([icon, title, sub, route]) => (
              <button className="f27-quick-btn" key={title} onClick={() => router.push(route)}>
                <div className="f27-quick-left">
                  <div className="f27-quick-icon">{icon}</div>
                  <div className="f27-quick-text">
                    <div className="f27-quick-title">{title}</div>
                    <div className="f27-quick-sub">{sub}</div>
                  </div>
                </div>
                <div className="f27-quick-arrow">›</div>
              </button>
            ))}
          </div>

          <div className="f27-section">Progress</div>
          <div className="f27-stats">
            <div className="f27-card f27-stat-card">
              <div className="f27-stat-label">XP</div>
              <div className="f27-stat">{profile.xp}</div>
              <div className="f27-stat-sub">Current XP</div>
            </div>
            <div className="f27-card f27-stat-card">
              <div className="f27-stat-label">STREAK</div>
              <div className="f27-stat">{profile.streak}</div>
              <div className="f27-stat-sub">Day streak</div>
            </div>
            <div className="f27-card f27-stat-card">
              <div className="f27-stat-label">SOLVED</div>
              <div className="f27-stat">{profile.solved}</div>
              <div className="f27-stat-sub">Questions</div>
            </div>
            <div className="f27-card f27-stat-card">
              <div className="f27-stat-label">RANK</div>
              <div className="f27-stat" style={{fontSize:"18px"}}>{profile.xp >= 1500 ? "Officer" : profile.xp >= 800 ? "Warrior" : profile.xp >= 300 ? "Aspirant" : "Recruit"}</div>
              <div className="f27-stat-sub">FATEH27 rank</div>
            </div>
          </div>
        </section>
      </div>

      <nav className="f27-bottom">
        <button className="f27-nav active" onClick={() => router.push("/")}><span>🏠</span>Home</button>
        <button className="f27-nav" onClick={() => router.push("/current-affairs.html")}><span>📰</span>CA</button>
        <button className="f27-nav" onClick={() => router.push("/gs1")}><span>📘</span>GS</button>
        <button className="f27-nav" onClick={() => router.push("/ai-secretary.html")}><span>🤖</span>AI</button>
      </nav>
    </main>
  );
}
