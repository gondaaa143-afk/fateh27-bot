"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const modules = [
    { title: "GS1", icon: "📘", route: "/gs1" },
    { title: "GS2", icon: "📗", route: "/gs2" },
    { title: "GS3", icon: "📙", route: "/gs3" },
    { title: "GS4", icon: "📕", route: "/gs4" },
    { title: "Current", icon: "📰", route: "/current" },
    { title: "PYQ", icon: "🎯", route: "/pyq" },
    { title: "AI", icon: "🤖", route: "/ai" },
    { title: "Map", icon: "🗺️", route: "/command-map" },
  ];

  return (
    <main className="min-h-screen bg-[#F4F4F4] text-[#111111] pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-500 text-sm">Welcome Back</p>
            <h1 className="text-3xl font-black">FATEH27</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-white border border-black/10 shadow flex items-center justify-center">
            🔍
          </div>
        </div>

        <div className="rounded-[34px] bg-black text-white p-6 shadow-xl">
          <p className="text-white/60 text-sm">Today's Mission</p>
          <h2 className="text-3xl font-bold mt-2">Continue GS Revision</h2>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs text-white/60">Streak</p>
              <h3 className="text-2xl font-bold">1</h3>
            </div>
            <div className="bg-white/10 rounded-2xl p-4">
              <p className="text-xs text-white/60">XP</p>
              <h3 className="text-2xl font-bold">0</h3>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black mt-8 mb-4">Quick Access</h2>

        <div className="grid grid-cols-2 gap-4">
          {modules.map((m) => (
            <button
              key={m.title}
              onClick={() => router.push(m.route)}
              className="bg-white/80 backdrop-blur-xl border border-black/10 rounded-[28px] p-5 shadow text-left active:scale-95 transition"
            >
              <div className="text-3xl mb-5">{m.icon}</div>
              <p className="font-bold">{m.title}</p>
              <p className="text-xs text-gray-500 mt-1">Open Module</p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
