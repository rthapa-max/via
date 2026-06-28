export type MatchOutcome = "home" | "away" | "draw";
export type SidePick = "home" | "away";

export function outcomeFromScore(home: number, away: number): MatchOutcome {
  if (home === away) return "draw";
  return home > away ? "home" : "away";
}

/** 90-minute points — used for all fixtures. */
export function predictionPoints(
  predictedHome: number,
  predictedAway: number,
  predictedWinner: MatchOutcome,
  resultHome: number,
  resultAway: number,
): number {
  if (resultHome === predictedHome && resultAway === predictedAway) return 3;

  const resultWinner = outcomeFromScore(resultHome, resultAway);
  if (resultWinner === predictedWinner) return 2;

  return 1;
}

export type KnockoutPredictionInput = {
  homeScore: number;
  awayScore: number;
  winner: MatchOutcome;
  etWinner?: SidePick | null;
  penWinner?: SidePick | null;
};

export type KnockoutResultInput = {
  resultHome: number;
  resultAway: number;
  wentToExtraTime?: boolean;
  resultEtWinner?: SidePick | null;
  resultPenWinner?: SidePick | null;
};

/** Knockout scoring: 90-minute rules plus optional ET/pen bonuses when a draw was predicted at 90. */
export function knockoutPredictionPoints(
  prediction: KnockoutPredictionInput,
  result: KnockoutResultInput,
): number {
  let points = predictionPoints(
    prediction.homeScore,
    prediction.awayScore,
    prediction.winner,
    result.resultHome,
    result.resultAway,
  );

  const predictedDraw90 = prediction.homeScore === prediction.awayScore;
  const actualDraw90 = result.resultHome === result.resultAway;
  if (!predictedDraw90 || !actualDraw90) return points;

  if (
    result.wentToExtraTime &&
    prediction.etWinner &&
    result.resultEtWinner &&
    prediction.etWinner === result.resultEtWinner
  ) {
    points += 1;
  }

  if (
    prediction.penWinner &&
    result.resultPenWinner &&
    prediction.penWinner === result.resultPenWinner
  ) {
    points += 1;
  }

  return points;
}

export function predictionPointsLabel(points: number) {
  if (points >= 5) return "Exact + ET + pens";
  if (points === 4) return "Exact + bonus";
  if (points === 3) return "Exact score";
  if (points === 2) return "Correct winner";
  if (points === 1) return "Participated";
  return "No prediction";
}

export function predictionPointsClass(points: number) {
  if (points >= 4) return "rounded-md bg-yellow-300 px-1.5 py-0.5 font-semibold text-brown-500";
  if (points === 3) return "rounded-md bg-yellow-300 px-1.5 py-0.5 font-semibold text-brown-500";
  if (points === 2) return "rounded-md bg-primary-100 px-1.5 py-0.5 font-semibold text-primary-700";
  if (points === 1) return "rounded-md bg-secondary-50 px-1.5 py-0.5 font-semibold text-gray-700";
  return "font-semibold text-secondary-text";
}
