import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { Puzzle } from "@/lib/puzzle";
import { createBootstrapPuzzle } from "@/lib/store";
import type { Guess, ParliamentStore } from "@/lib/store";
import { createFreshPuzzle } from "@/lib/store";

type DynamoStoreConfig = {
  puzzlesTableName: string;
  guessesTableName: string;
};

function asPalette(value: unknown): readonly string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error("Puzzle palette is invalid.");
  }
  return value;
}

function asPuzzle(item: Record<string, unknown>): Puzzle {
  if (
    typeof item.puzzleId !== "string" ||
    typeof item.seed !== "string" ||
    typeof item.trueCount !== "number" ||
    typeof item.itemKind !== "string" ||
    typeof item.opensAt !== "string" ||
    typeof item.closesAt !== "string" ||
    typeof item.status !== "string"
  ) {
    throw new Error("Puzzle record is invalid.");
  }

  return {
    puzzleId: item.puzzleId,
    seed: item.seed,
    trueCount: item.trueCount,
    itemKind: item.itemKind === "marbles" ? "marbles" : "jellybeans",
    palette: asPalette(item.palette),
    opensAt: item.opensAt,
    closesAt: item.closesAt,
    status: item.status === "archived" ? "archived" : "active",
  };
}

function asGuess(item: Record<string, unknown>): Guess {
  if (
    typeof item.puzzleId !== "string" ||
    typeof item.guessId !== "string" ||
    typeof item.guess !== "number" ||
    typeof item.createdAt !== "string"
  ) {
    throw new Error("Guess record is invalid.");
  }

  return {
    puzzleId: item.puzzleId,
    guessId: item.guessId,
    guess: item.guess,
    createdAt: item.createdAt,
  };
}

export class DynamoParliamentStore implements ParliamentStore {
  private readonly client: DynamoDBDocumentClient;
  private readonly puzzlesTableName: string;
  private readonly guessesTableName: string;

  constructor(config: DynamoStoreConfig, client = DynamoDBDocumentClient.from(new DynamoDBClient({}))) {
    this.client = client;
    this.puzzlesTableName = config.puzzlesTableName;
    this.guessesTableName = config.guessesTableName;
  }

  async getCurrentPuzzle(now = new Date()): Promise<Puzzle> {
    const active = await this.getActivePuzzles();
    const current = active.sort((left, right) => right.opensAt.localeCompare(left.opensAt))[0];
    if (current) {
      return current;
    }

    const bootstrap = createBootstrapPuzzle(now);
    return this.putPuzzle(bootstrap, true);
  }

  async putPuzzle(puzzle: Puzzle, activate: boolean): Promise<Puzzle> {
    const stored = activate ? { ...puzzle, status: "active" as const } : puzzle;
    if (activate) {
      const active = await this.getActivePuzzles();
      await Promise.all(active
        .filter((current) => current.puzzleId !== stored.puzzleId)
        .map((current) => this.client.send(new UpdateCommand({
          TableName: this.puzzlesTableName,
          Key: { puzzleId: current.puzzleId },
          UpdateExpression: "SET #status = :archived",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":archived": "archived" },
        }))));
    }

    await this.client.send(new PutCommand({
      TableName: this.puzzlesTableName,
      Item: stored,
    }));
    return stored;
  }

  async recordGuess(puzzleId: string, guess: number, createdAt = new Date()): Promise<Guess> {
    const record = {
      puzzleId,
      guessId: crypto.randomUUID(),
      guess,
      createdAt: createdAt.toISOString(),
    };
    await this.client.send(new PutCommand({
      TableName: this.guessesTableName,
      Item: record,
    }));
    return record;
  }

  async listGuesses(puzzleId: string): Promise<Guess[]> {
    const response = await this.client.send(new QueryCommand({
      TableName: this.guessesTableName,
      KeyConditionExpression: "puzzleId = :puzzleId",
      ExpressionAttributeValues: { ":puzzleId": puzzleId },
    }));
    return (response.Items ?? []).map((item) => asGuess(item));
  }

  async regeneratePuzzle(now = new Date()): Promise<Puzzle> {
    return this.putPuzzle(createFreshPuzzle(now), true);
  }

  private async getActivePuzzles(): Promise<Puzzle[]> {
    const response = await this.client.send(new ScanCommand({
      TableName: this.puzzlesTableName,
      FilterExpression: "#status = :active",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":active": "active" },
    }));
    return (response.Items ?? []).map((item) => asPuzzle(item));
  }
}
