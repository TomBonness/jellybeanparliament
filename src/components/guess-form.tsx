"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { JarScene } from "@/components/jar-scene";
import { StatsPanel } from "@/components/stats-panel";
import type { PublicPuzzle } from "@/lib/puzzle";
import type { RevealPayload } from "@/lib/stats";

type GuessFormProps = {
  puzzle: PublicPuzzle;
};

type GuessResponse = {
  guessId?: string;
  puzzleId?: string;
  reveal?: RevealPayload;
  error?: string;
};

export function GuessForm({ puzzle }: GuessFormProps) {
  const inputId = useId();
  const [guess, setGuess] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<RevealPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(`jellybean-parliament:${puzzle.puzzleId}`);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as GuessResponse;
      if (parsed.reveal) {
        setReveal(parsed.reveal);
        setGuess(String(parsed.reveal.userGuess));
      }
    } catch {
      window.localStorage.removeItem(`jellybean-parliament:${puzzle.puzzleId}`);
    }
  }, [puzzle.puzzleId]);

  async function submitGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const numericGuess = Number(guess);
    if (!Number.isInteger(numericGuess) || numericGuess <= 0) {
      setError("Enter one positive whole-number guess.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/puzzle/current/guess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guess: numericGuess }),
      });
      const result = await response.json() as GuessResponse;
      if (!response.ok || !result.reveal) {
        setError(result.error ?? "Could not submit that guess.");
        return;
      }
      setReveal(result.reveal);
      window.localStorage.setItem(`jellybean-parliament:${puzzle.puzzleId}`, JSON.stringify(result));
    } catch {
      setError("Network error while submitting your guess.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="experience" aria-labelledby="jar-title">
      <div className="experience__canvas">
        <JarScene seed={puzzle.seed} palette={puzzle.palette} />
      </div>
      <div className="experience__panel">
        <p className="eyebrow">{puzzle.puzzleId} / active jar</p>
        <h1 id="jar-title">Jellybean Parliament</h1>
        <p className="lede">
          Inspect the jar, make one anonymous guess, then compare your estimate with the crowd median and average.
        </p>
        <form className="guess-form" onSubmit={submitGuess}>
          <label htmlFor={inputId}>How many balls are inside?</label>
          <div className="guess-form__row">
            <input
              id={inputId}
              name="guess"
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              step="1"
              value={guess}
              disabled={Boolean(reveal) || isSubmitting}
              onChange={(event) => setGuess(event.target.value)}
              placeholder="e.g. 512"
              required
            />
            <button type="submit" disabled={Boolean(reveal) || isSubmitting}>{isSubmitting ? "Submitting" : "Submit"}</button>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {reveal ? <p className="form-note">Your browser has recorded this puzzle as guessed.</p> : null}
        </form>
        {reveal ? <StatsPanel reveal={reveal} /> : <p className="sealed-note">The count and crowd statistics unlock after a valid guess.</p>}
      </div>
    </section>
  );
}
