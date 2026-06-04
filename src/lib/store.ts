import { createRegeneratedPuzzle, createWeeklyPuzzle, type Puzzle } from "@/lib/puzzle";

export type Guess = {
  puzzleId: string;
  guessId: string;
  guess: number;
  createdAt: string;
};

export type ParliamentStore = {
  getCurrentPuzzle(now?: Date): Promise<Puzzle>;
  putPuzzle(puzzle: Puzzle, activate: boolean): Promise<Puzzle>;
  recordGuess(puzzleId: string, guess: number, createdAt?: Date): Promise<Guess>;
  listGuesses(puzzleId: string): Promise<Guess[]>;
  regeneratePuzzle(now?: Date): Promise<Puzzle>;
};

export function createBootstrapPuzzle(now?: Date): Puzzle {
  return createWeeklyPuzzle(now);
}

export function createFreshPuzzle(now?: Date): Puzzle {
  return createRegeneratedPuzzle(now);
}
