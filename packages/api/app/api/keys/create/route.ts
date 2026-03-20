import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

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

function saveApiKeys(data: ApiKeysData): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(API_KEYS_FILE, JSON.stringify(data, null, 2));
}

function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export async function POST(req: NextRequest) {
  try {
    // Verify gateway secret for key creation
    const gatewaySecret = process.env.GATEWAY_SECRET;
    if (gatewaySecret) {
      const auth = req.headers.get("x-gateway-secret");
      if (auth !== gatewaySecret) {
        return NextResponse.json(
          { error: "Unauthorized. Provide x-gateway-secret header." },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const { address } = body as { address?: string };

    if (!address || !isValidEthAddress(address)) {
      return NextResponse.json(
        {
          error: "Invalid or missing 'address'. Must be a valid Ethereum address (0x...).",
        },
        { status: 400 }
      );
    }

    // Generate API key
    const apiKey = `clawd-${uuidv4().replace(/-/g, "")}`;

    const keys = loadApiKeys();
    keys[apiKey] = {
      address: address.toLowerCase(),
      burnedAmount: "0",
      totalTokensUsed: 0,
      createdAt: new Date().toISOString(),
    };
    saveApiKeys(keys);

    return NextResponse.json({
      apiKey,
      address: address.toLowerCase(),
      message: "API key created. Use this key in the Authorization header: Bearer <apiKey>",
    });
  } catch (error) {
    console.error("Key creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
