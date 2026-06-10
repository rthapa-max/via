-- Track when the "predictions closed" email was sent (1 hour before kickoff).
alter table public.fixtures
  add column if not exists prediction_close_notified_at timestamptz;
