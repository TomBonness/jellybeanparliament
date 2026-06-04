"use client";

import { FormEvent, useState } from "react";
import type { PublicPuzzle } from "@/lib/puzzle";

type AdminPanelProps = {
  puzzle: PublicPuzzle;
  trueCount: number;
  secret: string;
};

type RegenerateResponse = {
  puzzle?: PublicPuzzle;
  trueCount?: number;
  error?: string;
};

export function AdminPanel({ puzzle, trueCount, secret }: AdminPanelProps) {
  const [currentPuzzle, setCurrentPuzzle] = useState(puzzle);
  const [currentCount, setCurrentCount] = useState(trueCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function regenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/puzzles/regenerate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const result = await response.json() as RegenerateResponse;
      if (!response.ok || !result.puzzle || typeof result.trueCount !== "number") {
        setMessage(result.error ?? "Could not regenerate puzzle.");
        return;
      }
      setCurrentPuzzle(result.puzzle);
      setCurrentCount(result.trueCount);
      setMessage("New active puzzle generated.");
    } catch {
      setMessage("Network error while regenerating puzzle.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="admin-card">
      <div>
        <p className="eyebrow">admin</p>
        <h1>Jellybean Parliament Control</h1>
      </div>
      <dl className="admin-meta">
        <div>
          <dt>Puzzle</dt>
          <dd>{currentPuzzle.puzzleId}</dd>
        </div>
        <div>
          <dt>Seed</dt>
          <dd>{currentPuzzle.seed}</dd>
        </div>
        <div>
          <dt>True count</dt>
          <dd>{currentCount}</dd>
        </div>
        <div>
          <dt>Window</dt>
          <dd>{currentPuzzle.opensAt} — {currentPuzzle.closesAt}</dd>
        </div>
      </dl>
      <form onSubmit={regenerate} className="admin-actions">
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Generating" : "Regenerate active jar"}</button>
        {message ? <p role="status">{message}</p> : null}
      </form>
    </section>
  );
}
