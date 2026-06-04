import { describe, expect, it } from "vitest";
import { computeCrowdStats, createRevealPayload, percentageError } from "@/lib/stats";

describe("crowd statistics", () => {
  it("computes median, mean, spread, and crowd errors", () => {
    const stats = computeCrowdStats([95, 100, 105], 100);
    expect(stats).toEqual({
      count: 3,
      mean: 100,
      median: 100,
      min: 95,
      max: 105,
      standardDeviation: 4.08,
      interquartileRange: 5,
      crowdMedianAbsoluteError: 0,
      crowdMedianPercentageError: 0,
      crowdMeanAbsoluteError: 0,
      crowdMeanPercentageError: 0,
    });
  });

  it("uses median as the stable crowd result when an outlier appears", () => {
    const stats = computeCrowdStats([90, 100, 110, 1000], 100);
    expect(stats.median).toBe(105);
    expect(stats.mean).toBe(325);
    expect(stats.crowdMedianAbsoluteError).toBeLessThan(stats.crowdMeanAbsoluteError);
  });

  it("creates a reveal payload with user error", () => {
    const reveal = createRevealPayload(400, 360, [360, 400, 420]);
    expect(reveal.userAbsoluteError).toBe(40);
    expect(reveal.userPercentageError).toBe(10);
    expect(reveal.stats.count).toBe(3);
  });

  it("rejects empty statistics input", () => {
    expect(() => computeCrowdStats([], 100)).toThrow("At least one guess");
  });

  it("rounds percentage error to two decimals", () => {
    expect(percentageError(90, 123)).toBe(26.83);
  });
});
