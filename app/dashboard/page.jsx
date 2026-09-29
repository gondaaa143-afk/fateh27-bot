"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [premium, setPremium] = useState(false);
  const [profile, setProfile] = useState({ xp: 0, streak: 0, solved: 0 });

  useEffect(() => {
    let cancelled = false;
    async function syncUser() {
      const telegram = window.Telegram?.WebApp;
      telegram?.ready();
      telegram?.expand();
      const initData = telegram?.initData;
      const telegramUser = telegram?.initDataUnsafe?.user;

      let progress = {};
      try { progress = JSON.parse(localStorage.getItem("FATEH27_PROGRESS") || "{}"); } catch {}
      setProfile({
        xp: Number(progress.xp || 0),
        streak: Number(progress.streak || 0),
        solved: Number(progress.solved || 0)
      });

      if (!initData || !telegramUser) {
        if (!cancelled) setUser({ name: "Officer" });
        return;
      }

      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: { "content-type": "application/json", "x-telegram-init-data": initData },
          body: JSON.stringify({
            profile: { plan: "free", progress, lastActivity: new Date().toISOString() },
            activity: { type: "dashboard_open", module: "dashboard" }
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || data?.error || "User sync failed");
        if (data?.user?.progress) {
          localStorage.setItem("FATEH27_PROGRESS", JSON.stringify(data.user.progress));
          setProfile({
            xp: Number(data.user.progress.xp || 0),
            streak: Number(data.user.progress.streak || 0),
            solved: Number(data.user.progress.solved || 0)
          });
        }
        if (!cancelled) setUser(data.user);
      } catch (error) {
        console.error("FATEH27 user sync:", error);
        if (!cancelled) setUser({ name: telegramUser.first_name || "Officer" });
      }

      try {
        const accessResponse = await fetch("/api/access", { headers: { "x-telegram-init-data": initData } });
        const accessData = await accessResponse.json();
        if (!cancelled) setPremium(Boolean(accessData?.premium));
      } catch (error) {
        console.error("FATEH27 access check:", error);
      }
    }
    syncUser();
    return () => { cancelled = true; };
  }, []);

  const name = user?.name || (typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name : null) || "Officer";
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
            <div className="f27-badge">{premium ? "PREMIUM • LIVE" : "BETA v1.0 • LIVE"}</div>
          </div>

          <div className="f27-profile">
            <div className="f27-avatar">{name[0] || "F"}</div>
            <div>
              <div className="f27-name">{name}</div>
              <div className="f27-id">F27-ACCESS</div>
              <div className="f27-clock">UPSC Command Center</div>
            </div>
          </div>

          <div className="f27-idcard">
            <div className="f27-kicker">OFFICER ACCESS CARD</div>
            <div className="f27-cardname">{name}</div>
            <div className="f27-clearance">{premium ? "Clearance: PREMIUM" : "Clearance: ALPHA"}</div>
          </div>

          <button className="f27-action" onClick={() => router.push("/ai-secretary.html")}>✦ Open AI Secretary →</button>

          <div className="f27-membership">
            <div className="f27-membership-row">
              <div>
                <div className="f27-membership-title">MEMBERSHIP</div>
                <div className="f27-membership-name">{premium ? "Premium Active" : "Free Plan"}</div>
                <div className="f27-membership-copy">{premium ? "Premium access is enabled." : "Unlock premium study content and features."}</div>
              </div>
              <button className="f27-membership-btn" onClick={() => router.push("/premium")}>{premium ? "Manage" : "Get Premium"}</button>
            </div>
          </div>

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
            <div className="f27-card f27-stat-card"><div className="f27-stat-label">XP</div><div className="f27-stat">{profile.xp}</div><div className="f27-stat-sub">Current XP</div></div>
            <div className="f27-card f27-stat-card"><div className="f27-stat-label">STREAK</div><div className="f27-stat">{profile.streak}</div><div className="f27-stat-sub">Day streak</div></div>
            <div className="f27-card f27-stat-card"><div className="f27-stat-label">SOLVED</div><div className="f27-stat">{profile.solved}</div><div className="f27-stat-sub">Questions</div></div>
            <div className="f27-card f27-stat-card"><div className="f27-stat-label">PLAN</div><div className="f27-stat" style={{fontSize:"18px"}}>{premium ? "Premium" : "Free"}</div><div className="f27-stat-sub">Account status</div></div>
          </div>
        </section>
      </div>

      <nav className="f27-bottom">
        <button className="f27-nav active" onClick={() => router.push("/dashboard")}><span>🏠</span>Home</button>
        <button className="f27-nav" onClick={() => router.push("/current-affairs.html")}><span>📰</span>CA</button>
        <button className="f27-nav" onClick={() => router.push("/gs1")}><span>📘</span>GS</button>
        <button className="f27-nav" onClick={() => router.push("/ai-secretary.html")}><span>🤖</span>AI</button>
      </nav>
    </main>
  );
}
