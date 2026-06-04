import { NextResponse } from "next/server";
import { jsonError, readJsonObject, requireAdminSecret } from "@/lib/api";
import { getStore } from "@/lib/get-store";
import { toPublicPuzzle } from "@/lib/puzzle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await readJsonObject(request);
    requireAdminSecret(body.secret);
    const puzzle = await getStore().regeneratePuzzle();
    return NextResponse.json({ puzzle: toPublicPuzzle(puzzle), trueCount: puzzle.trueCount });
  } catch (error) {
    return jsonError(error);
  }
}
