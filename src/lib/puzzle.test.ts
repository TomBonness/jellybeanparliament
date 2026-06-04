import { describe, expect, it } from "vitest";
import {
  createBallRenderData,
  createPuzzleFromSeed,
  createRegeneratedPuzzle,
  createWeeklyPuzzle,
  deriveTrueCount,
  getIsoWeekPuzzleId,
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

  it("creates admin-regenerated puzzles inside the current weekly window", () => {
    const puzzle = createRegeneratedPuzzle(new Date("2026-06-04T12:00:00Z"));
    expect(puzzle.puzzleId).toMatch(/^2026-W23-/);
    expect(puzzle.status).toBe("active");
    expect(puzzle.opensAt).toBe("2026-06-01T00:00:00.000Z");
    expect(puzzle.closesAt).toBe("2026-06-08T00:00:00.000Z");
  });
});
