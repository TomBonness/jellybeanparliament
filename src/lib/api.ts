import { NextResponse } from "next/server";

export const MAX_GUESS = 1_000_000;

export function jsonError(error: unknown, fallbackStatus = 500): NextResponse {
  if (error instanceof Error) {
    const status = typeof (error as Error & { status?: unknown }).status === "number"
      ? (error as Error & { status: number }).status
      : fallbackStatus;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ error: "Unexpected server error." }, { status: fallbackStatus });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const json = await request.json();
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw Object.assign(new Error("Request body must be a JSON object."), { status: 400 });
  }
  return json as Record<string, unknown>;
}

export function validateGuess(value: unknown): number {
  if (typeof value !== "number") {
    throw Object.assign(new Error("Guess must be a number."), { status: 400 });
  }
  if (!Number.isInteger(value)) {
    throw Object.assign(new Error("Guess must be a whole number."), { status: 400 });
  }
  if (!Number.isSafeInteger(value)) {
    throw Object.assign(new Error("Guess must be a safe integer."), { status: 400 });
  }
  if (value <= 0) {
    throw Object.assign(new Error("Guess must be greater than zero."), { status: 400 });
  }
  if (value > MAX_GUESS) {
    throw Object.assign(new Error(`Guess must be ${MAX_GUESS.toLocaleString()} or less.`), { status: 400 });
  }
  return value;
}

export function requireAdminSecret(value: unknown): void {
  const configuredSecret = process.env.ADMIN_SECRET;
  if (!configuredSecret) {
    throw Object.assign(new Error("ADMIN_SECRET is not configured."), { status: 503 });
  }
  if (typeof value !== "string" || value.length === 0 || value !== configuredSecret) {
    throw Object.assign(new Error("Admin secret is invalid."), { status: 401 });
  }
}
