import { NextResponse } from "next/server";
import { jsonError, readJsonObject, validateGuess } from "@/lib/api";
import { getStore } from "@/lib/get-store";
import { createRevealPayload } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await readJsonObject(request);
    const guess = validateGuess(body.guess);
    const store = getStore();
    const puzzle = await store.getCurrentPuzzle();
    const recorded = await store.recordGuess(puzzle.puzzleId, guess);
    const guesses = await store.listGuesses(puzzle.puzzleId);
    const payload = createRevealPayload(puzzle.trueCount, recorded.guess, guesses.map((entry) => entry.guess));
    return NextResponse.json({ guessId: recorded.guessId, puzzleId: puzzle.puzzleId, reveal: payload });
  } catch (error) {
    return jsonError(error);
  }
}
