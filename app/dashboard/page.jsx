"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const buttons = [
    { title: "🗺️ Command Map", route: "/command-map" },
    { title: "🎯 PYQ Intelligence", route: "/pyq" },
    { title: "📘 GS1", route: "/gs1" },
    { title: "📗 GS2", route: "/gs2" },
    { title: "📙 GS3", route: "/gs3" },
    { title: "📕 GS4", route: "/gs4" },
    { title: "🤖 AI Answer Evaluation", route: "/ai" },
    { title: "📰 Current Affairs", route: "/current" },
  ];

  return (
    <main className="min-h-screen bg-[#03150f] text-white p-5">
      <h1 className="text-4xl font-black mb-2">FATEH27</h1>
      <p className="text-green-400 mb-8">PREMIUM UI TEST</p>

      <div className="grid gap-4">
        {buttons.map((b) => (
          <button
            key={b.title}
            onClick={() => router.push(b.route)}
            className="rounded-2xl border border-green-400/30 bg-gradient-to-r from-green-500 to-emerald-600 py-5 text-lg font-bold shadow-lg active:scale-95"
          >
            {b.title}
          </button>
        ))}
      </div>
    </main>
  );
}
