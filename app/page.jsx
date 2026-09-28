import HeroCard from "@/components/HeroCard";
import GlassCard from "@/components/GlassCard";
import BottomNav from "@/components/BottomNav";

export default function Home(){

  return(
    <main className="min-h-screen px-6 pt-8 pb-28">

      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-[#666]">Welcome back</p>

          <h1 className="text-4xl font-bold">
            FATEH27
          </h1>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#D9D9D9]"/>
      </div>

      <HeroCard/>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">
          Quick Access
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <GlassCard>
            <h3 className="font-semibold">Current Affairs</h3>
            <p className="text-sm text-[#666]">Daily updates</p>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold">GS Hub</h3>
            <p className="text-sm text-[#666]">GS1–GS4</p>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold">Mock Tests</h3>
            <p className="text-sm text-[#666]">Practice</p>
          </GlassCard>

          <GlassCard>
            <h3 className="font-semibold">AI Review</h3>
            <p className="text-sm text-[#666]">Evaluate answers</p>
          </GlassCard>

        </div>
      </div>

      <BottomNav/>

    </main>
  );
}
