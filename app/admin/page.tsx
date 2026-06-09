import { TopBar } from "@/app/components/TopBar";
import { AdminResults } from "@/app/components/admin/AdminResults";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-950 dark:bg-black dark:text-zinc-50">
      <TopBar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium tracking-tight sm:text-2xl">Admin</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Enter real match results.</p>
        </div>
        <AdminResults />
      </main>
    </div>
  );
}

