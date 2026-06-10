-- Run in Supabase SQL editor to add usernames for login.

alter table public.app_users
  add column if not exists username text;

create unique index if not exists app_users_username_lower_idx
  on public.app_users (lower(username));

alter table public.app_users
  alter column email drop not null;

alter table public.app_users
  drop constraint if exists app_users_email_or_username;

alter table public.app_users
  add constraint app_users_email_or_username
  check (email is not null or username is not null);

-- Normalize any mixed-case usernames so lookups match the unique index on lower(username).
update public.app_users
set username = lower(username)
where username is not null and username <> lower(username);

-- Optional: backfill usernames from email local-part for existing users.
-- Review duplicates before running in production.
-- update public.app_users
-- set username = lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9_]', '_', 'g'))
-- where username is null;
