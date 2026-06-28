import { TopBar } from "@/app/components/TopBar";
import { AdminDeleteUser } from "@/app/components/admin/AdminDeleteUser";
import { AdminPasswordReset } from "@/app/components/admin/AdminPasswordReset";
import { AdminPointsExport } from "@/app/components/admin/AdminPointsExport";
import { AdminResults } from "@/app/components/admin/AdminResults";
import { RequireAuth } from "@/app/components/RequireAuth";

export default function AdminPage() {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-secondary-25 font-sans text-primary-text">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-semibold text-xl tracking-tight sm:text-2xl">Admin</h1>
              <p className="mt-1 text-sm text-secondary-text">
                Manage match results and user accounts.
              </p>
            </div>
            <div className="flex flex-wrap items-start justify-end gap-2">
              <AdminPointsExport />
              <AdminPasswordReset />
              <AdminDeleteUser />
            </div>
          </div>

          <AdminResults />
        </main>
      </div>
    </RequireAuth>
  );
}
