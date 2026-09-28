"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F4F4F4]">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-[#111111]">FATEH27</h1>
        <p className="text-[#666666] mt-2">Loading Dashboard...</p>

        <div className="mt-6 flex justify-center">
          <div className="w-10 h-10 border-4 border-[#111111] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </main>
  );
}
