import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// ---- Types ----

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ApiKeyRecord {
  address: string;
  burnedAmount: string; // CLAWD burned (human readable)
  totalTokensUsed: number;
  createdAt: string;
}

interface ApiKeysData {
  [apiKey: string]: ApiKeyRecord;
}

// ---- Helpers ----

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

function extractApiKey(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// CLAWD burn calculation
// Phase 1: 1 input token = 1 CLAWD, 1 output token = 3 CLAWD
function calculateBurn(inputTokens: number, outputTokens: number): number {
  return inputTokens * 1 + outputTokens * 3;
}

// ---- Gemini API ----

interface GeminiContent {
  parts: { text: string }[];
  role: string;
}

interface GeminiResponse {
  candidates: {
    content: { parts: { text: string }[]; role: string };
    finishReason: string;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

async function routeToGemini(
  messages: ChatMessage[],
  temperature?: number,
  maxTokens?: number
): Promise<{
  content: string;
  inputTokens: number;
  outputTokens: number;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Convert OpenAI messages to Gemini format
  const systemInstruction = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const contents: GeminiContent[] = chatMessages.map((m) => ({
    parts: [{ text: m.content }],
    role: m.role === "assistant" ? "model" : "user",
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxTokens ?? 2048,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction.content }],
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;

  const content =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const inputTokens = data.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = data.usageMetadata?.candidatesTokenCount ?? 0;

  return { content, inputTokens, outputTokens };
}

// ---- Supported Models ----

const SUPPORTED_MODELS: Record<string, string> = {
  "gemini-2.0-flash": "gemini",
};

const PHASE2_MODELS: Record<string, string> = {
  "claude-sonnet-4-5": "anthropic",
  "gpt-4o": "openai",
};

// ---- Route Handler ----

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return NextResponse.json(
        {
          error: {
            message: "Missing or invalid Authorization header. Use: Bearer <api_key>",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        },
        { status: 401 }
      );
    }

    const keys = loadApiKeys();
    if (!keys[apiKey]) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid API key",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = (await req.json()) as ChatCompletionRequest;

    if (!body.model || !body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          error: {
            message: "Missing required fields: model, messages",
            type: "invalid_request_error",
            code: "invalid_request",
          },
        },
        { status: 400 }
      );
    }

    if (body.stream) {
      return NextResponse.json(
        {
          error: {
            message: "Streaming not supported in Phase 1. Set stream: false.",
            type: "invalid_request_error",
            code: "unsupported_parameter",
          },
        },
        { status: 400 }
      );
    }

    // 3. Route model
    const model = body.model;

    if (PHASE2_MODELS[model]) {
      return NextResponse.json(
        {
          error: {
            message: `Model "${model}" is planned for Phase 2. Currently supported: ${Object.keys(SUPPORTED_MODELS).join(", ")}`,
            type: "invalid_request_error",
            code: "model_not_available",
          },
        },
        { status: 400 }
      );
    }

    if (!SUPPORTED_MODELS[model]) {
      return NextResponse.json(
        {
          error: {
            message: `Model "${model}" is not supported. Available models: ${Object.keys(SUPPORTED_MODELS).join(", ")}`,
            type: "invalid_request_error",
            code: "model_not_found",
          },
        },
        { status: 400 }
      );
    }

    // 4. Call model
    const result = await routeToGemini(
      body.messages,
      body.temperature,
      body.max_tokens
    );

    // 5. Log CLAWD burn
    const clawdBurned = calculateBurn(result.inputTokens, result.outputTokens);
    const keyRecord = keys[apiKey];
    const prevBurned = parseFloat(keyRecord.burnedAmount) || 0;
    keyRecord.burnedAmount = (prevBurned + clawdBurned).toString();
    keyRecord.totalTokensUsed =
      (keyRecord.totalTokensUsed || 0) +
      result.inputTokens +
      result.outputTokens;
    saveApiKeys(keys);

    // 6. Return OpenAI-format response
    const responseId = `chatcmpl-clawd-${Date.now()}`;
    return NextResponse.json({
      id: responseId,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: result.content,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: result.inputTokens,
        completion_tokens: result.outputTokens,
        total_tokens: result.inputTokens + result.outputTokens,
      },
      clawd: {
        burned: clawdBurned,
        total_burned: keyRecord.burnedAmount,
      },
    });
  } catch (error) {
    console.error("Gateway error:", error);
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Internal server error",
          type: "server_error",
          code: "internal_error",
        },
      },
      { status: 500 }
    );
  }
}

// GET — list supported models
export async function GET() {
  return NextResponse.json({
    object: "list",
    data: [
      {
        id: "gemini-2.0-flash",
        object: "model",
        created: 1700000000,
        owned_by: "clawd-gateway",
        status: "active",
        burn_rate: { input: 1, output: 3, unit: "CLAWD/token" },
      },
      {
        id: "claude-sonnet-4-5",
        object: "model",
        created: 1700000000,
        owned_by: "clawd-gateway",
        status: "coming_phase_2",
      },
      {
        id: "gpt-4o",
        object: "model",
        created: 1700000000,
        owned_by: "clawd-gateway",
        status: "coming_phase_2",
      },
    ],
  });
}
