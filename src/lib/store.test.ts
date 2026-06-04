import { describe, expect, it } from "vitest";
import { MemoryParliamentStore } from "@/lib/memory-store";
import { createPuzzleFromSeed } from "@/lib/puzzle";

describe("memory parliament store", () => {
  it("bootstraps the current weekly puzzle", async () => {
    const store = new MemoryParliamentStore();
    const puzzle = await store.getCurrentPuzzle(new Date("2026-06-04T12:00:00Z"));
    expect(puzzle.puzzleId).toBe("2026-W23");
    expect(puzzle.status).toBe("active");
  });

  it("records and lists guesses by puzzle", async () => {
    const store = new MemoryParliamentStore();
    const puzzle = await store.getCurrentPuzzle(new Date("2026-06-04T12:00:00Z"));
    const guess = await store.recordGuess(puzzle.puzzleId, 512, new Date("2026-06-04T12:05:00Z"));
    const guesses = await store.listGuesses(puzzle.puzzleId);
    expect(guess.guessId).toBeTypeOf("string");
    expect(guesses).toEqual([guess]);
  });

  it("activates a new puzzle without deleting old guesses", async () => {
    const store = new MemoryParliamentStore();
    const first = await store.getCurrentPuzzle(new Date("2026-06-04T12:00:00Z"));
    await store.recordGuess(first.puzzleId, 512);
    const next = createPuzzleFromSeed("2026-W24", "next-seed", "active");
    await store.putPuzzle(next, true);

    const active = await store.getCurrentPuzzle(new Date("2026-06-11T12:00:00Z"));
    expect(active.puzzleId).toBe("2026-W24");
    await expect(store.listGuesses(first.puzzleId)).resolves.toHaveLength(1);
  });

  it("regenerates and activates a puzzle", async () => {
    const store = new MemoryParliamentStore();
    const puzzle = await store.regeneratePuzzle(new Date("2026-06-04T12:00:00Z"));
    expect(puzzle.puzzleId).toMatch(/^2026-W23-/);
    await expect(store.getCurrentPuzzle()).resolves.toEqual(puzzle);
  });
});
