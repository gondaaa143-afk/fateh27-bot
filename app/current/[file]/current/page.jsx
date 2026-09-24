"use client";

import { useRouter } from "next/navigation";

export default function CurrentPage() {
  const router = useRouter();

  const papers = [
    { name: "GS1", file: "gs1.md", icon: "📘" },
    { name: "GS2", file: "gs2.md", icon: "🏛" },
    { name: "GS3", file: "gs3.md", icon: "⚙️" },
    { name: "GS4", file: "gs4.md", icon: "🤝" },
  ];

  return (
    <main className="min-h-screen bg-[#071b4d] text-white p-5">
      <button
        onClick={() => router.back()}
        className="mb-5 rounded-lg bg-green-500 px-4 py-2 font-semibold"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-2">📚 Current Affairs</h1>
      <p className="text-gray-300 mb-6">
        PIB + The Hindu + International (UPSC)
      </p>

      <div className="grid grid-cols-2 gap-4">
        {papers.map((p) => (
          <button
            key={p.file}
            onClick={() => router.push(`/current/${p.file}`)}
            className="rounded-full bg-green-500 py-3 font-bold"
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>
    </main>
  );
}
