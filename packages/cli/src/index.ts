#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const CONFIG_FILE = join(
  process.env.HOME || process.env.USERPROFILE || ".",
  ".clawd",
  "config.json"
);

interface ClawdConfig {
  apiKey?: string;
  gatewayUrl: string;
}

function loadConfig(): ClawdConfig {
  if (existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    } catch {
      // Ignore parse errors
    }
  }
  return { gatewayUrl: "http://localhost:3001" };
}

function saveConfig(config: ClawdConfig): void {
  const dir = join(
    process.env.HOME || process.env.USERPROFILE || ".",
    ".clawd"
  );
  if (!existsSync(dir)) {
    const { mkdirSync } = require("fs");
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// ---- Gateway Client ----

async function gatewayFetch(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    apiKey?: string;
    gatewaySecret?: string;
  } = {}
): Promise<unknown> {
  const config = loadConfig();
  const url = `${config.gatewayUrl}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.apiKey || config.apiKey) {
    headers["Authorization"] = `Bearer ${options.apiKey || config.apiKey}`;
  }

  if (options.gatewaySecret) {
    headers["x-gateway-secret"] = options.gatewaySecret;
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      (data as { error?: string | { message?: string } }).error || "Unknown error";
    throw new Error(
      typeof errorMsg === "string" ? errorMsg : (errorMsg as { message?: string }).message || "Unknown error"
    );
  }

  return data;
}

// ---- CLI ----

const program = new Command();

program
  .name("clawd")
  .description("CLI for the CLAWD LLM Gateway")
  .version("0.1.0");

// ---- init ----
program
  .command("init")
  .description("Initialize CLAWD CLI configuration")
  .option("--gateway <url>", "Gateway URL", "http://localhost:3001")
  .option("--api-key <key>", "API key for the gateway")
  .action((opts: { gateway: string; apiKey?: string }) => {
    const config: ClawdConfig = {
      gatewayUrl: opts.gateway,
      apiKey: opts.apiKey,
    };
    saveConfig(config);
    console.log("✅ CLAWD CLI initialized");
    console.log(`   Gateway: ${config.gatewayUrl}`);
    if (config.apiKey) {
      console.log(`   API Key: ${config.apiKey.slice(0, 12)}...`);
    }
    console.log(`   Config:  ${CONFIG_FILE}`);
  });

// ---- key ----
const keyCmd = program
  .command("key")
  .description("Manage API keys");

keyCmd
  .command("create")
  .description("Create a new API key")
  .requiredOption("--address <address>", "Ethereum wallet address to link")
  .option("--secret <secret>", "Gateway secret for authorization")
  .action(async (opts: { address: string; secret?: string }) => {
    try {
      const data = (await gatewayFetch("/api/keys/create", {
        method: "POST",
        body: { address: opts.address },
        gatewaySecret: opts.secret,
      })) as { apiKey: string; address: string };

      console.log("✅ API key created");
      console.log(`   Key:     ${data.apiKey}`);
      console.log(`   Address: ${data.address}`);
      console.log("");
      console.log("Save this key! Set it with: clawd init --api-key <key>");
    } catch (err) {
      console.error(
        "❌ Error:",
        err instanceof Error ? err.message : String(err)
      );
      process.exit(1);
    }
  });

keyCmd
  .command("status")
  .description("Check API key usage and burn stats")
  .option("--key <key>", "API key to check (uses configured key if not provided)")
  .action(async (opts: { key?: string }) => {
    try {
      const config = loadConfig();
      const key = opts.key || config.apiKey;

      if (!key) {
        console.error("❌ No API key provided. Use --key or run `clawd init --api-key <key>`");
        process.exit(1);
      }

      const data = (await gatewayFetch(`/api/keys/status?key=${key}`)) as {
        apiKey: string;
        address: string;
        burnedAmount: string;
        totalTokensUsed: number;
        createdAt: string;
      };

      console.log("🔑 API Key Status");
      console.log(`   Key:           ${data.apiKey}`);
      console.log(`   Address:       ${data.address}`);
      console.log(`   CLAWD Burned:  ${data.burnedAmount}`);
      console.log(`   Tokens Used:   ${data.totalTokensUsed}`);
      console.log(`   Created:       ${data.createdAt}`);
    } catch (err) {
      console.error(
        "❌ Error:",
        err instanceof Error ? err.message : String(err)
      );
      process.exit(1);
    }
  });

// ---- chat ----
program
  .command("chat")
  .description("Send a chat message to the LLM Gateway")
  .argument("<prompt>", "The message to send")
  .option("--model <model>", "Model to use", "gemini-2.0-flash")
  .option("--system <system>", "System prompt")
  .option("--temperature <temp>", "Temperature (0-2)", parseFloat)
  .option("--max-tokens <max>", "Max output tokens", parseInt)
  .action(
    async (
      prompt: string,
      opts: {
        model: string;
        system?: string;
        temperature?: number;
        maxTokens?: number;
      }
    ) => {
      try {
        const config = loadConfig();
        if (!config.apiKey) {
          console.error(
            "❌ No API key configured. Run `clawd init --api-key <key>` first."
          );
          process.exit(1);
        }

        interface ChatMessage {
          role: string;
          content: string;
        }
        const messages: ChatMessage[] = [];
        if (opts.system) {
          messages.push({ role: "system", content: opts.system });
        }
        messages.push({ role: "user", content: prompt });

        const body: Record<string, unknown> = {
          model: opts.model,
          messages,
          stream: false,
        };

        if (opts.temperature !== undefined) {
          body.temperature = opts.temperature;
        }
        if (opts.maxTokens !== undefined) {
          body.max_tokens = opts.maxTokens;
        }

        const data = (await gatewayFetch("/api/v1/chat/completions", {
          method: "POST",
          body,
        })) as {
          choices: { message: { content: string } }[];
          usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
          clawd: { burned: number; total_burned: string };
        };

        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(content);
        }

        console.log("");
        console.log(
          `📊 Tokens: ${data.usage.prompt_tokens} in / ${data.usage.completion_tokens} out`
        );
        console.log(`🔥 CLAWD burned: ${data.clawd.burned}`);
      } catch (err) {
        console.error(
          "❌ Error:",
          err instanceof Error ? err.message : String(err)
        );
        process.exit(1);
      }
    }
  );

// ---- models ----
program
  .command("models")
  .description("List available models")
  .action(async () => {
    try {
      const data = (await gatewayFetch("/api/v1/chat/completions")) as {
        data: { id: string; status: string; burn_rate?: { input: number; output: number } }[];
      };

      console.log("📋 Available Models\n");
      for (const model of data.data) {
        const status =
          model.status === "active" ? "✅" : "⏳";
        console.log(
          `${status} ${model.id} [${model.status}]`
        );
        if (model.burn_rate) {
          console.log(
            `   Burn rate: ${model.burn_rate.input} CLAWD/input token, ${model.burn_rate.output} CLAWD/output token`
          );
        }
      }
    } catch (err) {
      console.error(
        "❌ Error:",
        err instanceof Error ? err.message : String(err)
      );
      process.exit(1);
    }
  });

program.parse();
