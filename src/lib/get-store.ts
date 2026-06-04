import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DynamoParliamentStore } from "@/lib/dynamo-store";
import { getMemoryStore } from "@/lib/memory-store";
import type { ParliamentStore } from "@/lib/store";

type AmplifyOutputs = {
  custom?: Record<string, unknown>;
};

let cachedDynamoStore: DynamoParliamentStore | undefined;
let cachedOutputs: AmplifyOutputs | null | undefined;

function readAmplifyOutputs(): AmplifyOutputs | null {
  if (cachedOutputs !== undefined) {
    return cachedOutputs;
  }

  const outputPath = join(process.cwd(), "amplify_outputs.json");
  if (!existsSync(outputPath)) {
    cachedOutputs = null;
    return cachedOutputs;
  }

  cachedOutputs = JSON.parse(readFileSync(outputPath, "utf8")) as AmplifyOutputs;
  return cachedOutputs;
}

function readOutputString(key: string): string | undefined {
  const value = readAmplifyOutputs()?.custom?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function getStore(): ParliamentStore {
  const puzzlesTableName = process.env.JELLYBEAN_PUZZLES_TABLE_NAME
    ?? readOutputString("jellybeanPuzzlesTableName")
    ?? readOutputString("JELLYBEAN_PUZZLES_TABLE_NAME");
  const guessesTableName = process.env.JELLYBEAN_GUESSES_TABLE_NAME
    ?? readOutputString("jellybeanGuessesTableName")
    ?? readOutputString("JELLYBEAN_GUESSES_TABLE_NAME");
  if (puzzlesTableName && guessesTableName) {
    cachedDynamoStore ??= new DynamoParliamentStore({ puzzlesTableName, guessesTableName });
    return cachedDynamoStore;
  }

  return getMemoryStore();
}
