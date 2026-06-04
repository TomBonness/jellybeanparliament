export type CrowdStats = {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  interquartileRange: number;
  crowdMedianAbsoluteError: number;
  crowdMedianPercentageError: number;
  crowdMeanAbsoluteError: number;
  crowdMeanPercentageError: number;
};

export type RevealPayload = {
  trueCount: number;
  userGuess: number;
  userAbsoluteError: number;
  userPercentageError: number;
  stats: CrowdStats;
};

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function medianSorted(values: readonly number[]): number {
  const midpoint = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    return values[midpoint] ?? 0;
  }
  return ((values[midpoint - 1] ?? 0) + (values[midpoint] ?? 0)) / 2;
}

function percentileSorted(values: readonly number[], percentile: number): number {
  if (values.length === 0) {
    return 0;
  }
  const index = (values.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  const lowerValue = values[lower] ?? 0;
  const upperValue = values[upper] ?? lowerValue;
  return lowerValue + (upperValue - lowerValue) * weight;
}

export function percentageError(estimate: number, trueCount: number): number {
  return round((Math.abs(estimate - trueCount) / trueCount) * 100);
}

export function computeCrowdStats(guesses: readonly number[], trueCount: number): CrowdStats {
  if (guesses.length === 0) {
    throw new Error("At least one guess is required to compute crowd statistics.");
  }
  if (!Number.isSafeInteger(trueCount) || trueCount <= 0) {
    throw new Error("True count must be a positive safe integer.");
  }

  const sorted = [...guesses].sort((left, right) => left - right);
  const total = guesses.reduce((sum, guess) => sum + guess, 0);
  const mean = total / guesses.length;
  const median = medianSorted(sorted);
  const variance = guesses.reduce((sum, guess) => {
    const delta = guess - mean;
    return sum + delta * delta;
  }, 0) / guesses.length;
  const standardDeviation = Math.sqrt(variance);
  const q1 = percentileSorted(sorted, 0.25);
  const q3 = percentileSorted(sorted, 0.75);

  return {
    count: guesses.length,
    mean: round(mean),
    median: round(median),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    standardDeviation: round(standardDeviation),
    interquartileRange: round(q3 - q1),
    crowdMedianAbsoluteError: round(Math.abs(median - trueCount)),
    crowdMedianPercentageError: percentageError(median, trueCount),
    crowdMeanAbsoluteError: round(Math.abs(mean - trueCount)),
    crowdMeanPercentageError: percentageError(mean, trueCount),
  };
}

export function createRevealPayload(trueCount: number, userGuess: number, guesses: readonly number[]): RevealPayload {
  return {
    trueCount,
    userGuess,
    userAbsoluteError: Math.abs(userGuess - trueCount),
    userPercentageError: percentageError(userGuess, trueCount),
    stats: computeCrowdStats(guesses, trueCount),
  };
}
