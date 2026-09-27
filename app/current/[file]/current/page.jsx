"use client";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  const quickLaunch = [
    { title: "Command Map", icon: "🗺️", path: "/command-map" },
    { title: "PYQ Intelligence", icon: "🎯", path: "/pyq" },
    { title: "GS1", icon: "📘", path: "/gs1" },
    { title: "GS2", icon: "🏛️", path: "/gs2" },
    { title: "GS3", icon: "⚙️", path: "/gs3" },
    { title: "GS4", icon: "🤝", path: "/gs4" },
    { title: "AI Answer Evaluation", icon: "🤖", path: "/ai" },
    { title: "Current Affairs", icon: "📰", path: "/current" },
  ];

  return (
    <main className="min-h-screen bg-[#071B34] text-white pb-24">

      <div className="px-5 pt-6">

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="h-11 w-11 rounded-xl bg-[#0B1F3A] border border-slate-600 active:scale-95 transition"
          >
            ←
          </button>

          <h1 className="text-2xl font-bold">FATEH27</h1>

          <button className="h-11 w-11 rounded-xl bg-[#0B1F3A] border border-slate-600">
            ⚙️
          </button>
        </div>

        <div className="rounded-[28px] bg-gradient-to-br from-[#0B1F3A] via-[#102A4C] to-[#071B34] border border-[#1ED760]/30 p-5 shadow-2xl mb-6">

          <h2 className="text-3xl font-bold mb-1">
            UPSC Command Center
          </h2>

          <p className="text-slate-300">
            Study • Revision • PYQ • Current Affairs
          </p>

        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">

          <div className="bg-[#0B1F3A] rounded-2xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-bold">13</p>
            <p className="text-xs text-slate-400 mt-1">Tests</p>
          </div>

          <div className="bg-[#0B1F3A] rounded-2xl p-4 text-center border border-slate-700">
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-slate-400 mt-1">Attempted</p>
          </div>

          <div className="bg-[#0B1F3A] rounded-2xl p-4 text-center border border-slate-700">
            <p className="text-lg font-bold text-emerald-400">
              Active
            </p>
            <p className="text-xs text-slate-400 mt-1">Access</p>
          </div>

        </div>

        <div className="bg-[#0B1F3A] rounded-[24px] border border-slate-700 p-5 mb-6">

          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">Current Status</span>
            <span className="text-emerald-400 font-semibold">Excellent</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">Today's Target</span>
            <span>4 Answers</span>
          </div>

          <div className="flex justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">Weak Subject</span>
            <span>GS3</span>
          </div>

          <div className="flex justify-between py-2">
            <span className="text-slate-400">Last Activity</span>
            <span>GS1 Completed</span>
          </div>

          <div className="mt-4 rounded-2xl bg-[#0E2D25] border border-emerald-700 px-4 py-3 text-emerald-200">
            Aaj ka mission complete. Revision mode activate karo.
          </div>

        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Quick Launch</h2>

          <span className="text-emerald-400 text-sm">
            8 Modules
          </span>
        </div>

        <div className="space-y-4">

          {quickLaunch.map((item) => (
            <button
              key={item.title}
              onClick={() => router.push(item.path)}
              className="w-full h-16 rounded-[22px] bg-gradient-to-r from-emerald-500 via-green-500 to-green-600 shadow-lg active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 text-lg font-semibold"
            >
              <span className="text-2xl">{item.icon}</span>
              {item.title}
            </button>
          ))}

        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0B1F3A]/95 backdrop-blur-xl border-t border-slate-700">

        <div className="grid grid-cols-4 py-3">

          <button className="flex flex-col items-center text-emerald-400">
            <span className="text-2xl">🏠</span>
            <span className="text-xs mt-1">Home</span>
          </button>

          <button className="flex flex-col items-center text-slate-400">
            <span className="text-2xl">📰</span>
            <span className="text-xs mt-1">CA</span>
          </button>

          <button className="flex flex-col items-center text-slate-400">
            <span className="text-2xl">📘</span>
            <span className="text-xs mt-1">GS</span>
          </button>

          <button className="flex flex-col items-center text-slate-400">
            <span className="text-2xl">🤖</span>
            <span className="text-xs mt-1">AI</span>
          </button>

        </div>

      </div>

    </main>
  );
}
