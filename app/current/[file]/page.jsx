"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const buttons = [
    { title: "Current Affairs", icon: "📰", path: "/current" },
    { title: "Mock Tests", icon: "📝", path: "/mock" },
    { title: "GS", icon: "📘", path: "/gs" },
    { title: "Command Map", icon: "🗺️", path: "/command-map" },
    { title: "PYQ Intelligence", icon: "🎯", path: "/pyq" },
    { title: "AI Evaluation", icon: "🤖", path: "/ai" },
  ];

  return (
    <main className="min-h-screen bg-[#071B34] text-white p-5">

      <div className="mb-8">
        <h1 className="text-4xl font-bold">FATEH27</h1>
        <p className="text-slate-300 mt-2">
          UPSC / UPPSC Command Center
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">

        <div className="bg-[#0B1F3A] rounded-2xl p-3 text-center shadow-lg border border-slate-700">
          <p className="text-2xl font-bold">13</p>
          <p className="text-xs text-slate-400">Tests</p>
        </div>

        <div className="bg-[#0B1F3A] rounded-2xl p-3 text-center shadow-lg border border-slate-700">
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-slate-400">Attempted</p>
        </div>

        <div className="bg-[#0B1F3A] rounded-2xl p-3 text-center shadow-lg border border-slate-700">
          <p className="text-lg font-bold text-emerald-400">Active</p>
          <p className="text-xs text-slate-400">Access</p>
        </div>

      </div>

      <div className="space-y-4">

        {buttons.map((btn) => (
          <button
            key={btn.title}
            onClick={() => router.push(btn.path)}
            className="w-full h-14 rounded-[18px] bg-gradient-to-r from-emerald-500 to-green-600 text-white text-lg font-semibold shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span className="text-xl">{btn.icon}</span>
            {btn.title}
          </button>
        ))}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1F3A] border-t border-slate-700">
        <div className="grid grid-cols-4 py-3 text-center text-sm">

          <button onClick={() => router.push("/")}>🏠<br/>Home</button>
          <button onClick={() => router.push("/current")}>📰<br/>CA</button>
          <button onClick={() => router.push("/gs")}>📘<br/>GS</button>
          <button onClick={() => router.push("/ai")}>🤖<br/>AI</button>

        </div>
      </div>

      <div className="h-20"></div>

    </main>
  );
}
