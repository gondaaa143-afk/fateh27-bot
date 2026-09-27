"use client";

import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const buttons = [
    { title: "🗺️ Command Map", route: "/command-map", color: "from-cyan-500 to-blue-600" },
    { title: "🎯 PYQ Intelligence", route: "/pyq", color: "from-purple-500 to-indigo-600" },
    { title: "📘 GS1", route: "/gs1", color: "from-blue-500 to-cyan-500" },
    { title: "📗 GS2", route: "/gs2", color: "from-green-500 to-emerald-600" },
    { title: "📙 GS3", route: "/gs3", color: "from-orange-500 to-amber-500" },
    { title: "📕 GS4", route: "/gs4", color: "from-red-500 to-rose-600" },
    { title: "🤖 AI Answer Evaluation", route: "/ai", color: "from-fuchsia-500 to-purple-600" },
    { title: "📰 Current Affairs Command Center", route: "/current", color: "from-emerald-500 to-green-600" },
  ];

  return (
    <main className="min-h-screen bg-[#03150f] text-white pb-24">

      <div className="px-5 pt-6">

        <div className="rounded-3xl bg-gradient-to-br from-[#06281b] via-[#083825] to-[#02110b] border border-green-400/20 p-6 shadow-[0_0_35px_rgba(34,197,94,0.15)]">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black">FATEH27</h1>
              <p className="text-green-300 text-sm">UPSC Command Dashboard</p>
            </div>

            <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(34,197,94,0.35)]">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-300">0</p>
                <p className="text-[10px] text-green-400">XP</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-gray-400">Streak</p>
              <h2 className="text-2xl font-bold text-green-300">1</h2>
            </div>

            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs text-gray-400">Solved</p>
              <h2 className="text-2xl font-bold text-green-300">0</h2>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-[#082117]/90 border border-green-400/15 p-5">
          <h2 className="text-xl font-bold mb-4">Current Status</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Status</span>
              <span className="text-green-300 font-semibold">Excellent</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Today's Target</span>
              <span className="font-semibold">4 Answers</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Weak Subject</span>
              <span className="font-semibold">GS3</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Last Activity</span>
              <span className="font-semibold">GS1 Completed</span>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-green-200">
            Aaj ka mission complete. Revision mode activate karo.
          </div>
        </div>

        <div className="mt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Quick Launch</h2>
            <span className="text-green-300 text-sm">8 Modules</span>
          </div>

          <div className="grid gap-4">
            {buttons.map((btn) => (
              <button
                key={btn.title}
                onClick={() => router.push(btn.route)}
                className={`bg-gradient-to-r ${btn.color} rounded-2xl px-5 py-5 shadow-lg active:scale-95 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{btn.title}</span>
                  <span className="text-xl">›</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#04120d]/95 backdrop-blur-xl border-t border-green-500/15 px-3 py-3">
        <div className="grid grid-cols-4 gap-2">

          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center gap-1 text-green-300"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => router.push("/current")}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-xl">📰</span>
            <span className="text-xs">CA</span>
          </button>

          <button
            onClick={() => router.push("/gs1")}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-xl">📘</span>
            <span className="text-xs">GS</span>
          </button>

          <button
            onClick={() => router.push("/ai")}
            className="flex flex-col items-center gap-1 text-gray-400"
          >
            <span className="text-xl">🤖</span>
            <span className="text-xs">AI</span>
          </button>

        </div>
      </nav>
    </main>
  );
}
