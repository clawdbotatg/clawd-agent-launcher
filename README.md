# 🐾 CLAWD Agent Launcher

The infrastructure layer for AI agents on Base. Every API call burns CLAWD.

**LLM Gateway** · **CLI** · **x402 SDK** · **Dashboard**

---

## What Is This?

CLAWD Agent Launcher is an OpenAI-compatible LLM Gateway where every API call burns CLAWD tokens. It's the "CLAWD as ETH for AI agents" thesis made concrete — agents pay for compute by burning CLAWD.

### Components

| Package | Description |
|---------|-------------|
| `packages/api` | LLM Gateway — OpenAI-compatible `/v1/chat/completions` endpoint |
| `packages/cli` | `@clawd/cli` — Command-line interface for chat, key management |
| `packages/x402-sdk` | `@clawd/x402-sdk` — TypeScript SDK for programmatic access |
| `packages/frontend` | Dashboard — API key management, usage stats, documentation |

### Supported Models (Phase 1)

| Model | Provider | Status |
|-------|----------|--------|
| `gemini-2.0-flash` | Google Gemini | ✅ Active |
| `claude-sonnet-4-5` | Anthropic | ⏳ Phase 2 |
| `gpt-4o` | OpenAI | ⏳ Phase 2 |

### Burn Rates

| Token Type | CLAWD Burned |
|------------|--------------|
| Input token | 1 CLAWD |
| Output token | 3 CLAWD |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/clawdbotatg/clawd-agent-launcher.git
cd clawd-agent-launcher
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
GEMINI_API_KEY=your-gemini-api-key
GATEWAY_SECRET=your-random-secret
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Getting API Keys

- **Google Gemini:** Go to [Google AI Studio](https://aistudio.google.com/apikey) → Create API key → Copy it
- **Anthropic (Phase 2):** Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create
- **OpenAI (Phase 2):** Go to [platform.openai.com](https://platform.openai.com/api-keys) → Create new secret key

### 3. Start the Gateway

```bash
# Install API dependencies
cd packages/api && npm install && cd ../..

# Start the LLM Gateway (port 3001)
npm run dev:api
```

### 4. Create an API Key

```bash
curl -X POST http://localhost:3001/api/keys/create \
  -H "Content-Type: application/json" \
  -H "x-gateway-secret: your-gateway-secret" \
  -d '{"address": "0xYourWalletAddress"}'
```

### 5. Make Your First Request

```bash
curl -X POST http://localhost:3001/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer clawd-your-api-key" \
  -d '{
    "model": "gemini-2.0-flash",
    "messages": [{"role": "user", "content": "What is CLAWD?"}]
  }'
```

---

## Using the CLI

### Install

```bash
cd packages/cli
npm install
npm run build
npm link  # Makes 'clawd' available globally
```

### Usage

```bash
# Initialize with your gateway and API key
clawd init --gateway http://localhost:3001 --api-key clawd-your-key

# Chat with a model
clawd chat "What is Ethereum?" --model gemini-2.0-flash

# Chat with a system prompt
clawd chat "Explain DeFi" --system "You are a crypto expert" --model gemini-2.0-flash

# Create a new API key
clawd key create --address 0xYourAddress --secret your-gateway-secret

# Check key status
clawd key status

# List available models
clawd models
```

---

## Using the SDK

### Install

```bash
npm install @clawd/x402-sdk
```

### Usage

```typescript
import { ClawdGateway } from '@clawd/x402-sdk';

const gateway = new ClawdGateway({
  apiKey: 'clawd-your-key',
  baseUrl: 'http://localhost:3001', // or your deployed URL
});

// Chat completions (OpenAI-compatible)
const response = await gateway.chat.completions({
  model: 'gemini-2.0-flash',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' },
  ],
});

console.log(response.choices[0].message.content);
console.log('CLAWD burned:', response.clawd.burned);
console.log('Total burned:', response.clawd.total_burned);

// List models
const models = await gateway.models.list();
console.log(models.data);

// Check API key status
const status = await gateway.keys.status();
console.log(status);
```

---

## Frontend Dashboard

### Run Locally

```bash
cd packages/frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Pages

- `/` — Landing page
- `/dashboard/` — Create API keys, check usage stats
- `/docs/` — API documentation

---

## Deploy to Vercel

### API (Gateway)

```bash
cd packages/api
npx vercel --yes

# Set environment variables
npx vercel env add GEMINI_API_KEY
npx vercel env add GATEWAY_SECRET
```

### Frontend

```bash
cd packages/frontend
npx vercel --yes

# Set environment variable
npx vercel env add NEXT_PUBLIC_API_URL  # Set to your API Vercel URL
```

### Vercel Configuration

For each package, set:
- **Root Directory:** `packages/api` or `packages/frontend`
- **Install Command:** `cd ../.. && npm install`

---

## Architecture

```
Client (CLI / SDK / curl)
    │
    ▼
LLM Gateway (packages/api)
    │  POST /api/v1/chat/completions
    │  Auth: Bearer <apiKey>
    │
    ├─ Validate API key (data/api-keys.json)
    ├─ Route to model provider (Gemini API)
    ├─ Calculate CLAWD burn
    ├─ Log burn to JSON
    │
    ▼
Response (OpenAI-format + CLAWD burn info)
```

### CLAWD Burn Mechanism

1. Client sends chat completion request
2. Gateway authenticates API key
3. Gateway routes to Gemini API
4. On response, gateway calculates: `burn = input_tokens × 1 + output_tokens × 3`
5. Burn is logged against the API key in `data/api-keys.json`
6. Response includes burn info in the `clawd` field

**Phase 2+:** Actual onchain CLAWD burns via `transfer(address(0), amount)` from a burner wallet.

### CLAWD Token

- **Address:** `0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07`
- **Chain:** Base (8453)
- **Burn Target:** `0x0000000000000000000000000000000000000000`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `GATEWAY_SECRET` | ✅ | Secret for key creation endpoint |
| `BASE_RPC_URL` | Phase 2 | Base mainnet RPC (for onchain burns) |
| `BURNER_PRIVATE_KEY` | Phase 2 | Wallet key for CLAWD burns |
| `NEXT_PUBLIC_API_URL` | Frontend | Gateway URL for the dashboard |

---

## Project Structure

```
clawd-agent-launcher/
├── packages/
│   ├── api/                    # LLM Gateway (Next.js API routes)
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── v1/chat/completions/route.ts  # Chat completions
│   │   │   │   └── keys/
│   │   │   │       ├── create/route.ts            # Create API key
│   │   │   │       └── status/route.ts            # Key status
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── cli/                    # @clawd/cli
│   │   ├── src/index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── x402-sdk/               # @clawd/x402-sdk
│   │   ├── src/index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/               # Dashboard
│       ├── app/
│       │   ├── page.tsx         # Landing page
│       │   ├── dashboard/page.tsx  # Key management
│       │   ├── docs/page.tsx    # API documentation
│       │   └── layout.tsx
│       ├── styles/globals.css
│       ├── package.json
│       └── tsconfig.json
├── data/
│   └── api-keys.json           # API key storage (JSON)
├── .env.example                # Environment template
├── .gitignore
├── SPEC.md                     # Technical specification
├── plan.md                     # Original plan
├── package.json                # Monorepo root
└── README.md                   # This file
```

---

## Roadmap

| Phase | What | Status |
|-------|------|--------|
| **1** | Gemini Flash gateway + JSON storage + CLI + SDK | ✅ MVP |
| **2** | Claude + GPT routes, rate limiting, dashboard polish | Planned |
| **3** | Agent API, slash mechanism, agent registry | Planned |
| **4** | Postgres migration, production hardening | Planned |
| **5** | Stake tiers, revenue share (10% to stakers) | Planned |

---

## License

MIT
