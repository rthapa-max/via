export type PlayerStatsRow = {
  id: string;
  name: string;
  favoriteTeam: string | null;
  points: number;
  predictions: number;
  correct: number;
  wrong: number;
  draws: number;
};

export type TournamentTotals = {
  players: number;
  predictions: number;
  correct: number;
  wrong: number;
  draws: number;
  points: number;
};

export type YourStats = {
  rank: number;
  totalPlayers: number;
  points: number;
  predictions: number;
  correct: number;
  wrong: number;
  draws: number;
  exactRate: number;
  correctOrBetterRate: number;
} | null;

export type FunAwardResult = { name: string; display: string } | null;

export type FunAwards = {
  oracle: FunAwardResult;
  woodenSpoon: FunAwardResult;
  fenceSitter: FunAwardResult;
  soClose: FunAwardResult;
  chaosAgent: FunAwardResult;
  completionist: FunAwardResult;
  goalRush: FunAwardResult;
  lockdownDefender: FunAwardResult;
  facts: {
    avgPredictedGoalsPerMatch: number;
    drawPredictionRate: number;
    mostPopularScoreline: { scoreline: string; count: number } | null;
  };
};

export type StatsPayload = {
  totals: TournamentTotals;
  players: PlayerStatsRow[];
  you: YourStats;
  fun: FunAwards;
};

export type StatsResponse = ({ ok: true } & StatsPayload) | { ok: false; message: string };
