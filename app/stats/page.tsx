import Link from "next/link";
import { TopBar } from "@/app/components/TopBar";
import { RequireAuth } from "@/app/components/RequireAuth";
import { StatsFull } from "@/app/components/StatsFull";

export default function StatsPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-secondary-25 font-sans text-primary-text">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="mb-6 sm:mb-8">
            <Link href="/" className="text-xs font-medium text-primary-600 hover:underline">
              ← Back to home
            </Link>
            <h1 className="mt-2 font-semibold text-2xl tracking-tight sm:text-3xl">Tournament stats</h1>
            <p className="mt-1 text-sm text-secondary-text sm:text-base">
              Everything happening across World Cup 2026 matches and predictions.
            </p>
          </div>

          <StatsFull />
        </main>
      </div>
    </RequireAuth>
  );
}
