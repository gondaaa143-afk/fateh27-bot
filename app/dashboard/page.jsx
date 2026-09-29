"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState("syncing");

  useEffect(() => {
    let cancelled = false;
    async function syncUser() {
      try {
        const telegram = window.Telegram?.WebApp;
        telegram?.ready();
        telegram?.expand();
        const initData = telegram?.initData;
        const telegramUser = telegram?.initDataUnsafe?.user;

        if (!initData || !telegramUser) {
          if (!cancelled) setSyncStatus("telegram-required");
          return;
        }

        let progress = {};
        try {
          progress = JSON.parse(window.localStorage.getItem("FATEH27_PROGRESS") || "{}");
        } catch {}

        const response = await fetch("/api/user", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-telegram-init-data": initData
          },
          body: JSON.stringify({
            profile: {
              plan: "free",
              progress,
              lastActivity: new Date().toISOString()
            },
            activity: { type: "dashboard_open", module: "dashboard" }
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || data?.error || "User sync failed");

        if (!cancelled) {
          setUser(data.user);
          setSyncStatus("synced");
        }
      } catch (error) {
        console.error("FATEH27 user sync:", error);
        if (!cancelled) setSyncStatus("error");
      }
    }

    syncUser();
    return () => { cancelled = true; };
  }, []);

  const modules = [
    { title: "GS1", icon: "📘", route: "/gs1" },
    { title: "GS2", icon: "📗", route: "/gs2" },
    { title: "GS3", icon: "📙", route: "/gs3" },
    { title: "GS4", icon: "📕", route: "/gs4" },
    { title: "Current Affairs", icon: "📰", route: "/current" },
    { title: "PYQ", icon: "🎯", route: "/pyq" },
    { title: "AI Secretary", icon: "🤖", route: "/ai-secretary.html" },
    { title: "Command", icon: "🗺️", route: "/command-map" },
  ];

  const displayName =
    user?.name ||
    (typeof window !== "undefined" ? window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name : null) ||
    "Aspirant";

  return (
    <main className="min-h-screen bg-[#F4F4F4] pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[#666] text-sm">Welcome, {displayName}</p>
            <h1 className="text-3xl font-black text-[#111]">FATEH27</h1>
            <p className="text-[11px] text-[#777] mt-1">
              {syncStatus === "synced" ? "Profile synced" : syncStatus === "syncing" ? "Syncing profile..." : "Profile sync unavailable"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">🔍</div>
        </div>

        <div className="hero-card p-6">
          <p className="text-white/60 text-sm">Today's Mission</p>
          <h2 className="text-3xl font-bold mt-2">Continue GS Revision</h2>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 rounded-2xl p-4"><p className="text-white/60 text-xs">Streak</p><h3 className="text-2xl font-bold">1</h3></div>
            <div className="bg-white/10 rounded-2xl p-4"><p className="text-white/60 text-xs">XP</p><h3 className="text-2xl font-bold">0</h3></div>
          </div>
        </div>

        <div className="mt-7">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">Continue Learning</h2>
            <button className="text-[#666] text-sm">See All</button>
          </div>
          <div className="glass rounded-[28px] p-5">
            <p className="font-bold text-lg">Indian Polity</p>
            <p className="text-[#666] text-sm">Laxmikanth Series</p>
            <button className="mt-5 bg-black text-white rounded-[18px] w-full py-3">Resume →</button>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-black mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-4">
            {modules.map((m) => (
              <button key={m.title} onClick={() => router.push(m.route)} className="glass rounded-[28px] p-5 text-left active:scale-95 transition">
                <div className="text-3xl mb-5">{m.icon}</div>
                <p className="font-bold">{m.title}</p>
                <p className="text-xs text-[#666] mt-1">Open Module</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-md">
        <div className="bottom-pill rounded-full px-6 py-3">
          <div className="grid grid-cols-4 text-center">
            <button onClick={() => router.push("/dashboard")}>🏠</button>
            <button onClick={() => router.push("/current")}>📰</button>
            <button onClick={() => router.push("/gs1")}>📘</button>
            <button onClick={() => router.push("/ai-secretary.html")}>🤖</button>
          </div>
        </div>
      </div>
    </main>
  );
}
