import type { RevealPayload } from "@/lib/stats";

type StatsPanelProps = {
  reveal: RevealPayload;
};

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const wholeNumberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function StatsPanel({ reveal }: StatsPanelProps) {
  const stats = reveal.stats;
  return (
    <section className="stats-panel" aria-live="polite">
      <div className="stats-panel__hero">
        <p className="eyebrow">reveal</p>
        <h2>Truth versus the crowd</h2>
        <dl className="stats-spotlight" aria-label="True count and crowd wisdom comparison">
          <div className="stats-spotlight__truth">
            <dt>True count</dt>
            <dd>{numberFormatter.format(reveal.trueCount)}</dd>
            <small>inside the jar</small>
          </div>
          <div className="stats-spotlight__crowd stats-spotlight__crowd--primary">
            <dt>Crowd median</dt>
            <dd>{wholeNumberFormatter.format(stats.median)}</dd>
            <small>{numberFormatter.format(stats.crowdMedianPercentageError)}% error</small>
          </div>
          <div className="stats-spotlight__crowd">
            <dt>Crowd mean</dt>
            <dd>{wholeNumberFormatter.format(stats.mean)}</dd>
            <small>{numberFormatter.format(stats.crowdMeanPercentageError)}% error</small>
          </div>
        </dl>
        <p>
          Your guess was {numberFormatter.format(reveal.userGuess)}, off by {numberFormatter.format(reveal.userAbsoluteError)} balls
          ({numberFormatter.format(reveal.userPercentageError)}%).
        </p>
      </div>

      <dl className="stats-grid">
        <div>
          <dt>Guesses</dt>
          <dd>{numberFormatter.format(stats.count)}</dd>
          <small>anonymous entries</small>
        </div>
        <div>
          <dt>Your error</dt>
          <dd>{numberFormatter.format(reveal.userAbsoluteError)}</dd>
          <small>{numberFormatter.format(reveal.userPercentageError)}% from truth</small>
        </div>
        <div>
          <dt>Range</dt>
          <dd>{numberFormatter.format(stats.min)}–{numberFormatter.format(stats.max)}</dd>
          <small>lowest to highest</small>
        </div>
        <div>
          <dt>Std. deviation</dt>
          <dd>{numberFormatter.format(stats.standardDeviation)}</dd>
          <small>spread around the mean</small>
        </div>
        <div>
          <dt>IQR</dt>
          <dd>{numberFormatter.format(stats.interquartileRange)}</dd>
          <small>middle-half spread</small>
        </div>
      </dl>
    </section>
  );
}
