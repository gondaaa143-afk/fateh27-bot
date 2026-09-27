"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const quickLaunch = [
    { title: "Current Affairs", icon: "📰", route: "/current" },
    { title: "GS Hub", icon: "📚", route: "/dashboard" },
    { title: "Mock Tests", icon: "📝", route: "/mock" },
    { title: "AI Evaluation", icon: "🤖", route: "/ai" },
  ];

  return (
    <main
      className="min-h-screen pb-24"
      style={{
        background: "#D8D4E2",
        color: "#1B1B1E",
      }}
    >
      <div className="max-w-md mx-auto px-5 pt-8">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#6F687C] flex items-center justify-center text-white text-xl">
              👤
            </div>

            <button className="h-9 w-9 rounded-full bg-[#B8B2C6] flex items-center justify-center">
              +
            </button>
          </div>

          <button className="h-12 w-12 rounded-full bg-[#C8C3D4] flex items-center justify-center text-xl">
            🔍
          </button>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-5xl font-black leading-none">
            Choose Your
          </h1>

          <h1 className="text-5xl font-black leading-none">
            Mission <span className="text-[#7C748B]">(85)</span>
          </h1>
        </div>

        {/* Hero Card */}
        <div className="rounded-[28px] overflow-hidden bg-[#9B94A9] shadow-xl mb-6">

          <div className="relative">
            <AsyncImage query="Indian polity books on desk minimal study aesthetic" aspectRatio="5:4"/>

            <div className="absolute top-4 left-4 bg-black text-white text-xs px-3 py-2 rounded-full">
              24 Classes
            </div>
          </div>

          <div className="p-5">
            <h2 className="text-3xl font-black leading-tight">
              Indian Polity
            </h2>

            <p className="text-[#3A3545] mt-1">
              Laxmikanth Series
            </p>
          </div>
        </div>

        {/* Continue */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold">
            Continue Learning
          </h3>

          <button className="text-[#6F687C] text-sm">
            See All
          </button>
        </div>

        <div className="rounded-[24px] bg-[#C6C1D1] p-4 shadow-lg mb-7">
          <div className="flex gap-4">
            <AsyncImage query="student studying at desk minimal aesthetic" aspectRatio="1:1" maxWidth=120/>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bold text-lg">
                  Indian Polity
                </p>

                <p className="text-sm text-[#55505E]">
                  by FATEH27
                </p>
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                className="bg-black text-white rounded-full py-2"
              >
                Resume →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Launch */}
        <div className="mb-5">
          <h3 className="text-2xl font-black mb-4">
            Quick Launch
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {quickLaunch.map((item) => (
              <button
                key={item.title}
                onClick={() => router.push(item.route)}
                className="rounded-[22px] bg-[#C6C1D1] p-5 text-left shadow-lg active:scale-95 transition"
              >
                <div className="text-2xl mb-4">
                  {item.icon}
                </div>

                <div className="font-bold">
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#E6E2EE]/95 backdrop-blur-md border-t border-[#BFB8CC]">
        <div className="max-w-md mx-auto grid grid-cols-5 py-3">

          <button className="flex flex-col items-center text-black">
            <span>🏠</span>
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => router.push("/current")}
            className="flex flex-col items-center text-[#6F687C]"
          >
            <span>📰</span>
            <span className="text-xs">Current</span>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex flex-col items-center text-[#6F687C]"
          >
            <span>📚</span>
            <span className="text-xs">GS</span>
          </button>

          <button
            onClick={() => router.push("/mock")}
            className="flex flex-col items-center text-[#6F687C]"
          >
            <span>📝</span>
            <span className="text-xs">Mock</span>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="flex flex-col items-center text-[#6F687C]"
          >
            <span>👤</span>
            <span className="text-xs">Profile</span>
          </button>

        </div>
      </nav>
    </main>
  );
                }
