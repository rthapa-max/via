import type { SupabaseClient } from "@supabase/supabase-js";

export type AppUserRow = {
  id: string;
  email: string | null;
  username: string | null;
  password_hash: string;
  is_admin: boolean | null;
  favorite_team: string | null;
};

export const APP_USER_SELECT =
  "id,email,username,password_hash,is_admin,favorite_team";

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

/** Unique index is on lower(username); compare case-insensitively. */
export async function findUserByUsername(
  supabase: SupabaseClient,
  username: string,
): Promise<AppUserRow | null> {
  const normalized = normalizeUsername(username);

  const { data: exact, error: exactErr } = await supabase
    .from("app_users")
    .select(APP_USER_SELECT)
    .eq("username", normalized)
    .maybeSingle();
  if (exactErr) throw exactErr;
  if (exact) return exact as AppUserRow;

  const { data: rows, error } = await supabase
    .from("app_users")
    .select(APP_USER_SELECT)
    .not("username", "is", null);
  if (error) throw error;

  return (
    (rows as AppUserRow[]).find(
      (row) => row.username?.toLowerCase() === normalized,
    ) ?? null
  );
}

export async function isUsernameTaken(
  supabase: SupabaseClient,
  username: string,
  exceptUserId?: string,
): Promise<boolean> {
  const user = await findUserByUsername(supabase, username);
  if (!user) return false;
  return exceptUserId ? user.id !== exceptUserId : true;
}

export function isUsernameConstraintError(message: string) {
  return message.includes("app_users_username_lower_idx");
}
