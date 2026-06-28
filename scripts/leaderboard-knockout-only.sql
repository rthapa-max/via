-- Leaderboard counts knockout fixture points only.
-- Run in Supabase SQL editor if prediction_points already exists.

drop view if exists public.leaderboard;
drop view if exists public.prediction_points;

create view public.prediction_points as
select
  p.user_id,
  p.fixture_id,
  p.winner as predicted_winner,
  p.home_score as predicted_home_score,
  p.away_score as predicted_away_score,
  f.status as fixture_status,
  f.result_home_score,
  f.result_away_score,
  f.stage as fixture_stage,
  case
    when f.status <> 'finished' then null
    else
      (
        case
          when f.result_home_score = p.home_score and f.result_away_score = p.away_score then 3
          when (
            (f.result_home_score > f.result_away_score and p.winner = 'home') or
            (f.result_home_score < f.result_away_score and p.winner = 'away') or
            (f.result_home_score = f.result_away_score and p.winner = 'draw')
          ) then 2
          else 1
        end
      )
      + case
          when coalesce(lower(trim(f.stage)), 'first stage') <> 'first stage'
            and p.home_score = p.away_score
            and f.result_home_score = f.result_away_score
            and f.result_went_to_extra_time
            and p.et_winner is not null
            and f.result_et_winner is not null
            and p.et_winner = f.result_et_winner
          then 1
          else 0
        end
      + case
          when coalesce(lower(trim(f.stage)), 'first stage') <> 'first stage'
            and p.home_score = p.away_score
            and f.result_home_score = f.result_away_score
            and f.result_pen_winner is not null
            and p.pen_winner is not null
            and p.pen_winner = f.result_pen_winner
          then 1
          else 0
        end
  end as points
from public.predictions p
join public.fixtures f on f.id = p.fixture_id;

create or replace view public.leaderboard as
select
  u.email,
  u.username,
  u.favorite_team,
  count(pp.fixture_id) as predicted,
  count(*) filter (where pp.fixture_status = 'finished' and pp.points = 3) as correct,
  count(*) filter (where pp.fixture_status = 'finished' and pp.points = 1) as incorrect,
  count(*) filter (where pp.fixture_status = 'finished' and pp.predicted_winner = 'draw') as draw,
  coalesce(sum(pp.points), 0) as points
from public.app_users u
left join public.prediction_points pp on pp.user_id = u.id
  and coalesce(lower(trim(pp.fixture_stage)), 'first stage') <> 'first stage'
group by u.email, u.username, u.favorite_team
order by points desc, correct desc, predicted desc, coalesce(u.username, u.email) asc;
