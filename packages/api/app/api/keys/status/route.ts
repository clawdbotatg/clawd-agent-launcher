import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

interface ApiKeyRecord {
  address: string;
  burnedAmount: string;
  totalTokensUsed: number;
  createdAt: string;
}

interface ApiKeysData {
  [apiKey: string]: ApiKeyRecord;
}

const DATA_DIR = join(process.cwd(), "..", "..", "data");
const API_KEYS_FILE = join(DATA_DIR, "api-keys.json");

function loadApiKeys(): ApiKeysData {
  if (!existsSync(API_KEYS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(API_KEYS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Missing 'key' query parameter" },
      { status: 400 }
    );
  }

  const keys = loadApiKeys();
  const record = keys[key];

  if (!record) {
    return NextResponse.json(
      { error: "API key not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    apiKey: key.slice(0, 12) + "..." + key.slice(-4),
    address: record.address,
    burnedAmount: record.burnedAmount,
    totalTokensUsed: record.totalTokensUsed,
    createdAt: record.createdAt,
    burnRate: {
      input: "1 CLAWD/token",
      output: "3 CLAWD/token",
    },
  });
}
