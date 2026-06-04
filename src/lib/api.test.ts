import { describe, expect, it, vi } from "vitest";
import { readJsonObject, requireAdminSecret, validateGuess } from "@/lib/api";
import { POST } from "@/app/api/puzzle/current/guess/route";

describe("api helpers", () => {
  it("validates whole positive safe guesses", () => {
    expect(validateGuess(42)).toBe(42);
    expect(() => validateGuess("42")).toThrow("Guess must be a number.");
    expect(() => validateGuess(4.2)).toThrow("Guess must be a whole number.");
    expect(() => validateGuess(0)).toThrow("Guess must be greater than zero.");
    expect(() => validateGuess(1_000_001)).toThrow("Guess must be 1,000,000 or less.");
  });

  it("reads only JSON objects", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify({ guess: 42 }),
    });
    await expect(readJsonObject(request)).resolves.toEqual({ guess: 42 });

    const arrayRequest = new Request("http://localhost/api", {
      method: "POST",
      body: JSON.stringify([42]),
    });
    await expect(readJsonObject(arrayRequest)).rejects.toThrow("Request body must be a JSON object.");
  });

  it("requires the configured admin secret", () => {
    vi.stubEnv("ADMIN_SECRET", "correct-horse-battery-staple");
    expect(() => requireAdminSecret("correct-horse-battery-staple")).not.toThrow();
    expect(() => requireAdminSecret("wrong")).toThrow("Admin secret is invalid.");
    vi.unstubAllEnvs();
  });
});

describe("guess route", () => {
  it("rejects invalid guesses", async () => {
    const response = await POST(new Request("http://localhost/api/puzzle/current/guess", {
      method: "POST",
      body: JSON.stringify({ guess: -1 }),
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Guess must be greater than zero." });
  });

  it("records valid guesses and returns the reveal payload", async () => {
    const response = await POST(new Request("http://localhost/api/puzzle/current/guess", {
      method: "POST",
      body: JSON.stringify({ guess: 500 }),
    }));
    const body = await response.json() as { reveal?: { trueCount: number; stats: { count: number } }; guessId?: string };
    expect(response.status).toBe(200);
    expect(body.guessId).toBeTypeOf("string");
    expect(body.reveal?.trueCount).toBeGreaterThan(0);
    expect(body.reveal?.stats.count).toBeGreaterThanOrEqual(1);
  });
});
