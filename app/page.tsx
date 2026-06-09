import { TopBar } from "@/app/components/TopBar";
import { LeaderboardTable } from "@/app/components/LeaderboardTable";
import { ScoringGuide } from "@/app/components/ScoringGuide";
import { FixturesFromSupabase } from "@/app/components/FixturesFromSupabase";

export default async function Home() {
  return (
    <div className="min-h-screen bg-zinc-100/80 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">World Cup 2026</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
            Predict match scores, earn points, and track your rank on the leaderboard.
          </p>
        </div>

        <div className="space-y-6">
          <LeaderboardTable />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start">
            <section className="lg:col-span-8">
              <div className="mb-3">
                <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Fixtures</h2>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Enter scores when a match is open for predictions.
                </p>
              </div>
              <FixturesFromSupabase />
            </section>

            <div className="lg:col-span-4">
              <ScoringGuide />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
