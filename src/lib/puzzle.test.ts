import { describe, expect, it } from "vitest";
import {
  BALL_MIN_CENTER_DISTANCE,
  BALL_RENDER_SCALE,
  JAR_PACK_BOTTOM_Y,
  JAR_PACK_TOP_Y,
  createBallRenderData,
  createPuzzleFromSeed,
  createRegeneratedPuzzle,
  createWeeklyPuzzle,
  deriveTrueCount,
  getIsoWeekPuzzleId,
  getJarProfileRadius,
  getWeekWindow,
  toPublicPuzzle,
} from "@/lib/puzzle";

describe("puzzle generation", () => {
  it("uses ISO week ids and windows", () => {
    expect(getIsoWeekPuzzleId(new Date("2026-06-04T12:00:00Z"))).toBe("2026-W23");
    expect(getWeekWindow("2026-W23")).toEqual({
      opensAt: "2026-06-01T00:00:00.000Z",
      closesAt: "2026-06-08T00:00:00.000Z",
    });
  });

  it("creates deterministic counts from seeds", () => {
    const seed = "jellybean-parliament:2026-W23";
    expect(deriveTrueCount(seed)).toBe(deriveTrueCount(seed));
    expect(deriveTrueCount(seed)).toBeGreaterThanOrEqual(360);
    expect(deriveTrueCount(seed)).toBeLessThanOrEqual(880);
  });

  it("keeps the public puzzle payload free of the reveal count", () => {
    const puzzle = createWeeklyPuzzle(new Date("2026-06-04T12:00:00Z"));
    const publicPuzzle = toPublicPuzzle(puzzle);
    expect("trueCount" in publicPuzzle).toBe(false);
    expect(publicPuzzle.puzzleId).toBe("2026-W23");
  });

  it("creates a render ball for each seed-derived item", () => {
    const puzzle = createPuzzleFromSeed("2026-W23", "render-seed", "active");
    const balls = createBallRenderData(puzzle.seed, puzzle.palette);
    expect(balls).toHaveLength(puzzle.trueCount);
    expect(balls[0]?.color).toMatch(/^#/);
  });

  it("packs same-size render balls without visual overlap", () => {
    const balls = createBallRenderData("packed-render-seed", ["#111111", "#f8f5ec"]);
    const epsilon = 1e-9;

    for (const ball of balls) {
      expect(ball.scale).toBe(BALL_RENDER_SCALE);
    }

    const occupiedCells = new Map<string, Array<(typeof balls)[number]>>();
    const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

    for (const ball of balls) {
      const cellX = Math.floor(ball.x / BALL_MIN_CENTER_DISTANCE);
      const cellY = Math.floor(ball.y / BALL_MIN_CENTER_DISTANCE);
      const cellZ = Math.floor(ball.z / BALL_MIN_CENTER_DISTANCE);

      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetZ = -1; offsetZ <= 1; offsetZ += 1) {
            const neighbors = occupiedCells.get(cellKey(cellX + offsetX, cellY + offsetY, cellZ + offsetZ)) ?? [];
            for (const neighbor of neighbors) {
              const distance = Math.hypot(ball.x - neighbor.x, ball.y - neighbor.y, ball.z - neighbor.z);
              expect(distance).toBeGreaterThanOrEqual(BALL_MIN_CENTER_DISTANCE - epsilon);
            }
          }
        }
      }

      const key = cellKey(cellX, cellY, cellZ);
      const cell = occupiedCells.get(key);
      if (cell) {
        cell.push(ball);
      } else {
        occupiedCells.set(key, [ball]);
      }
    }
  });

  it("keeps packed ball centers inside the jar profile", () => {
    const balls = createBallRenderData("bounded-render-seed", ["#111111", "#f8f5ec"]);

    for (const ball of balls) {
      expect(ball.y).toBeGreaterThanOrEqual(JAR_PACK_BOTTOM_Y + ball.scale);
      expect(ball.y).toBeLessThanOrEqual(JAR_PACK_TOP_Y - ball.scale);
      expect(Math.hypot(ball.x, ball.z) + ball.scale).toBeLessThanOrEqual(getJarProfileRadius(ball.y));
    }
  });

  it("creates admin-regenerated puzzles inside the current weekly window", () => {
    const puzzle = createRegeneratedPuzzle(new Date("2026-06-04T12:00:00Z"));
    expect(puzzle.puzzleId).toMatch(/^2026-W23-/);
    expect(puzzle.status).toBe("active");
    expect(puzzle.opensAt).toBe("2026-06-01T00:00:00.000Z");
    expect(puzzle.closesAt).toBe("2026-06-08T00:00:00.000Z");
  });
});
