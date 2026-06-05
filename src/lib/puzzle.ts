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
export const BALL_RENDER_SCALE = 0.135;
export const BALL_CENTER_GAP = 0.018;
export const BALL_MIN_CENTER_DISTANCE = BALL_RENDER_SCALE * 2 + BALL_CENTER_GAP;
export const JAR_PACK_BOTTOM_Y = -1.56;
export const JAR_PACK_TOP_Y = 1.78;

const JAR_BODY_INNER_RADIUS = 1.52;
const JAR_NECK_INNER_RADIUS = 1.08;
const JAR_SHOULDER_START_Y = 1.02;

export function getJarProfileRadius(y: number): number {
  if (y <= JAR_SHOULDER_START_Y) {
    return JAR_BODY_INNER_RADIUS;
  }

  const shoulderProgress = Math.min(1, (y - JAR_SHOULDER_START_Y) / (JAR_PACK_TOP_Y - JAR_SHOULDER_START_Y));
  return JAR_BODY_INNER_RADIUS + (JAR_NECK_INNER_RADIUS - JAR_BODY_INNER_RADIUS) * shoulderProgress;
}

function shuffleLayer<T>(items: T[], random: () => number): T[] {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex] as T, items[index] as T];
  }

  return items;
}


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
  const balls: BallRenderData[] = [];
  const rowSpacing = BALL_MIN_CENTER_DISTANCE * Math.sqrt(3) * 0.5;
  const layerSpacing = BALL_MIN_CENTER_DISTANCE;

  for (let layer = 0; balls.length < count; layer += 1) {
    const y = JAR_PACK_BOTTOM_Y + BALL_RENDER_SCALE + layer * layerSpacing;
    if (y > JAR_PACK_TOP_Y - BALL_RENDER_SCALE) {
      throw new Error(`Packed jar capacity exceeded for ${count} balls`);
    }

    const radiusLimit = getJarProfileRadius(y) - BALL_RENDER_SCALE;
    const layerRotation = random() * Math.PI * 2;
    const layerOffsetX = (random() - 0.5) * BALL_MIN_CENTER_DISTANCE;
    const layerOffsetZ = (random() - 0.5) * rowSpacing;
    const layerCandidates: Array<{ x: number; z: number }> = [];
    let rowIndex = 0;

    for (let z = -radiusLimit; z <= radiusLimit; z += rowSpacing) {
      const xOffset = ((rowIndex + layer) % 2) * BALL_MIN_CENTER_DISTANCE * 0.5;
      for (let x = -radiusLimit; x <= radiusLimit; x += BALL_MIN_CENTER_DISTANCE) {
        const shiftedX = x + xOffset + layerOffsetX;
        const shiftedZ = z + layerOffsetZ;
        const rotatedX = shiftedX * Math.cos(layerRotation) - shiftedZ * Math.sin(layerRotation);
        const rotatedZ = shiftedX * Math.sin(layerRotation) + shiftedZ * Math.cos(layerRotation);

        if (Math.hypot(rotatedX, rotatedZ) <= radiusLimit) {
          layerCandidates.push({ x: rotatedX, z: rotatedZ });
        }
      }
      rowIndex += 1;
    }

    for (const candidate of shuffleLayer(layerCandidates, random)) {
      if (balls.length >= count) {
        break;
      }

      balls.push({
        x: candidate.x,
        y,
        z: candidate.z,
        scale: BALL_RENDER_SCALE,
        color: palette[Math.floor(random() * palette.length)] ?? DEFAULT_PALETTE[0],
      });
    }
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
