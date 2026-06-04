import { GuessForm } from "@/components/guess-form";
import { getStore } from "@/lib/get-store";
import { toPublicPuzzle } from "@/lib/puzzle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const puzzle = await getStore().getCurrentPuzzle();

  return (
    <main className="page-shell">
      <GuessForm puzzle={toPublicPuzzle(puzzle)} />
      <section className="method" aria-labelledby="method-title">
        <div>
          <p className="eyebrow">method</p>
          <h2 id="method-title">One jar, many imperfect observers.</h2>
        </div>
        <p>
          Individual guesses can be noisy. The median resists wild outliers, while the mean shows the classic average. Each week a new deterministic jar gives the parliament a fresh object to inspect, estimate, and learn from.
        </p>
      </section>
    </main>
  );
}
