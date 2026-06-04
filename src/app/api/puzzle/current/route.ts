import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getStore } from "@/lib/get-store";
import { toPublicPuzzle } from "@/lib/puzzle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const puzzle = await getStore().getCurrentPuzzle();
    return NextResponse.json({ puzzle: toPublicPuzzle(puzzle) });
  } catch (error) {
    return jsonError(error);
  }
}
