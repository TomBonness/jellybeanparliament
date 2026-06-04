import { createBootstrapPuzzle, createFreshPuzzle, type Guess, type ParliamentStore } from "@/lib/store";
import type { Puzzle } from "@/lib/puzzle";

export class MemoryParliamentStore implements ParliamentStore {
  private readonly puzzles = new Map<string, Puzzle>();
  private readonly guesses = new Map<string, Guess[]>();

  async getCurrentPuzzle(now = new Date()): Promise<Puzzle> {
    const active = [...this.puzzles.values()]
      .filter((puzzle) => puzzle.status === "active")
      .sort((left, right) => right.opensAt.localeCompare(left.opensAt))[0];
    if (active) {
      return active;
    }

    const puzzle = createBootstrapPuzzle(now);
    this.puzzles.set(puzzle.puzzleId, puzzle);
    return puzzle;
  }

  async putPuzzle(puzzle: Puzzle, activate: boolean): Promise<Puzzle> {
    if (activate) {
      for (const current of this.puzzles.values()) {
        if (current.status === "active") {
          this.puzzles.set(current.puzzleId, { ...current, status: "archived" });
        }
      }
    }
    const stored = activate ? { ...puzzle, status: "active" as const } : puzzle;
    this.puzzles.set(stored.puzzleId, stored);
    return stored;
  }

  async recordGuess(puzzleId: string, guess: number, createdAt = new Date()): Promise<Guess> {
    const storedGuesses = this.guesses.get(puzzleId) ?? [];
    const record = {
      puzzleId,
      guessId: crypto.randomUUID(),
      guess,
      createdAt: createdAt.toISOString(),
    };
    storedGuesses.push(record);
    this.guesses.set(puzzleId, storedGuesses);
    return record;
  }

  async listGuesses(puzzleId: string): Promise<Guess[]> {
    return [...(this.guesses.get(puzzleId) ?? [])];
  }

  async regeneratePuzzle(now = new Date()): Promise<Puzzle> {
    return this.putPuzzle(createFreshPuzzle(now), true);
  }
}

const memoryStore = new MemoryParliamentStore();

export function getMemoryStore(): MemoryParliamentStore {
  return memoryStore;
}
