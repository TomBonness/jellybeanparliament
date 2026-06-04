export type PuzzleStatus = "active" | "archived";

export type Puzzle = {
  puzzleId: string;
  seed: string;
  trueCount: number;
  itemKind: "jellybeans" | "marbles";
  palette: readonly string[];
  opensAt: string;
  closesAt: string;
  status: PuzzleStatus;
};

export type PublicPuzzle = Omit<Puzzle, "trueCount" | "status"> & {
  status: "active";
};

export type BallRenderData = {
  x: number;
  y: number;
  z: number;
  scale: number;
  color: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ISO_WEEK_ONE_MONTH = 0;
const ISO_WEEK_ONE_DAY = 4;
const DEFAULT_PALETTE = ["#e63946", "#f1c40f", "#1d4ed8", "#111111", "#f8f5ec"] as const;

export function getIsoWeekPuzzleId(date = new Date()): string {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + ISO_WEEK_ONE_DAY - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), ISO_WEEK_ONE_MONTH, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${week.toString().padStart(2, "0")}`;
}

export function getWeekWindow(puzzleId: string): { opensAt: string; closesAt: string } {
  const match = /^(\d{4})-W(\d{2})$/.exec(puzzleId);
  if (!match) {
    throw new Error("Puzzle id must be an ISO week like 2026-W23.");
  }
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) {
    throw new Error("Puzzle week must be between 1 and 53.");
  }

  const janFourth = new Date(Date.UTC(year, 0, 4));
  const janFourthDay = janFourth.getUTCDay() || 7;
  const weekOneMonday = new Date(janFourth.getTime() - (janFourthDay - 1) * 86400000);
  const opens = new Date(weekOneMonday.getTime() + (week - 1) * WEEK_MS);
  const closes = new Date(opens.getTime() + WEEK_MS);
  return { opensAt: opens.toISOString(), closesAt: closes.toISOString() };
}

export function createPuzzleSeed(puzzleId: string): string {
  return `jellybean-parliament:${puzzleId}`;
}

export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

export function deriveTrueCount(seed: string): number {
  const random = createRandom(`${seed}:count`);
  return 360 + Math.floor(random() * 521);
}

export function createWeeklyPuzzle(date = new Date()): Puzzle {
  const puzzleId = getIsoWeekPuzzleId(date);
  return createPuzzleFromSeed(puzzleId, createPuzzleSeed(puzzleId), "active");
}

export function createPuzzleFromSeed(
  puzzleId: string,
  seed: string,
  status: PuzzleStatus,
  palette: readonly string[] = DEFAULT_PALETTE,
): Puzzle {
  const { opensAt, closesAt } = getWeekWindow(puzzleId);
  return {
    puzzleId,
    seed,
    trueCount: deriveTrueCount(seed),
    itemKind: "jellybeans",
    palette: [...palette],
    opensAt,
    closesAt,
    status,
  };
}

export function toPublicPuzzle(puzzle: Puzzle): PublicPuzzle {
  return {
    puzzleId: puzzle.puzzleId,
    seed: puzzle.seed,
    itemKind: puzzle.itemKind,
    palette: puzzle.palette,
    opensAt: puzzle.opensAt,
    closesAt: puzzle.closesAt,
    status: "active",
  };
}

export function createBallRenderData(seed: string, palette: readonly string[]): BallRenderData[] {
  const count = deriveTrueCount(seed);
  const random = createRandom(`${seed}:layout`);
  const balls: BallRenderData[] = new Array(count);
  const jarRadius = 1.62;
  const fillHeight = 3.25;
  const bottom = -1.55;

  for (let index = 0; index < count; index += 1) {
    const yProgress = index / Math.max(1, count - 1);
    const y = bottom + yProgress * fillHeight + (random() - 0.5) * 0.12;
    const neckTaper = y > 1.0 ? 1 - (y - 1.0) * 0.16 : 1;
    const radiusLimit = Math.max(0.78, jarRadius * neckTaper);
    const radius = Math.sqrt(random()) * radiusLimit;
    const theta = random() * Math.PI * 2;
    balls[index] = {
      x: Math.cos(theta) * radius,
      y,
      z: Math.sin(theta) * radius,
      scale: 0.105 + random() * 0.035,
      color: palette[Math.floor(random() * palette.length)] ?? DEFAULT_PALETTE[0],
    };
  }

  return balls;
}

export function createGeneratedPuzzleId(now = new Date()): string {
  const compact = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${getIsoWeekPuzzleId(now)}-${compact}`;
}

export function createRegeneratedPuzzle(now = new Date()): Puzzle {
  const puzzleId = createGeneratedPuzzleId(now);
  const randomSeed = `${createPuzzleSeed(puzzleId)}:${crypto.randomUUID()}`;
  const window = getWeekWindow(getIsoWeekPuzzleId(now));
  return {
    puzzleId,
    seed: randomSeed,
    trueCount: deriveTrueCount(randomSeed),
    itemKind: "jellybeans",
    palette: [...DEFAULT_PALETTE],
    opensAt: window.opensAt,
    closesAt: window.closesAt,
    status: "active",
  };
}
