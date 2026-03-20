# clawd-agent-launcher — Plan

## 📋 Labs Post

**Idea:** Create an Agent/Token Launcher with $CLAWD as fuel  
**Posted by:** `0x68b8dd3d7d5cedb72b40c4cf3152a175990d4599`  
**Submitted:** 2026-03-14  
**CV Burned:** 1,000,000  
**Total Conviction:** 1,000,000 CV  
**Status:** Pending  
**Labs URL:** https://larv.ai/labs/5

### Original Description

> Create an Agent/Token Launcher with $CLAWD as fuel with skills like:
>
> **Agent API** — Build on top of the Clawd agent. Enable Agent API on your key to get started.
>
> **LLM Gateway** — OpenAI and Anthropic compatible router with Gemini, Claude, and GPT models.
>
> **CLI** — Agent prompts, transaction signing and execution, LLM Gateway setup, and more.
>
> **x402 SDK** — Easy integration with automatic payment handling and TypeScript support.

### Community Synthesis

> Agent API, LLM Gateway (OpenAI/Anthropic-compatible with Gemini/Claude/GPT), CLI tooling, x402 SDK. Community says: **build in-house, ship core to 3-5 builders first, measure 90 days, then expand.** This is the "CLAWD as ETH for AI agents" thesis finally becoming real.

---

## 🎯 What Is This?

**The infrastructure layer for AI agents on Base.** Every AI agent needs: compute (LLM calls), payment (x402 metered payments), and execution (tx signing). CLAWD becomes the fuel — every API call, every transaction, every payment burns or stakes CLAWD.

This is the "CLAWD as ETH for AI agents" thesis made concrete. Not a governance token — a **utility protocol** other agents build on.

---

## 🏗️ Architecture

### Stack
- **LLM Gateway:** FastAPI or Next.js API routes — OpenAI + Anthropic compatible
- **Model routing:** Gemini, Claude, GPT — abstracted behind single `/v1/chat/completions` endpoint
- **CLI:** TypeScript/Node.js — agent prompts, tx signing, key management
- **Payments:** x402 SDK — metered HTTP payments per request
- **Auth:** API keys stored in Postgres, linked to wallet addresses
- **Compute:** Vercel serverless (existing) + dedicated GPU nodes for heavier workloads

### Core Components

#### 1. LLM Gateway (`/api/v1/chat/completions`)
```
OpenAI-compatible endpoint
POST /api/v1/chat/completions
Body: { model, messages, ... }

→ Authenticate via API key (x402 token or CLAWD stake)
→ Route to cheapest available model (Gemini > Claude > GPT)
→ Log request in Postgres (anonymized)
→ Charge CLAWD or burn per token consumed
→ Return OpenAI-format response
```

**Models supported:**
- `gpt-4o` / `gpt-4o-mini` (OpenAI)
- `claude-sonnet-4-5` / `claude-haiku-4-5` (Anthropic)
- `gemini-2.5-pro` / `gemini-2.0-flash` (Google)

**Router logic:**
```
if prompt is simple (fast response OK, low cost priority):
  → Gemini 2.0 Flash (cheapest)
elif prompt needs reasoning (longer context, quality priority):
  → Claude Sonnet 4-5 (mid-tier, good reasoning)
elif prompt needs latest knowledge or code:
  → GPT-4o (most capable)
```

#### 2. Agent API (`/api/agent/*`)
```
POST /api/agent/deploy    → deploy new agent with config
GET  /api/agent/:id       → get agent status
POST /api/agent/:id/prompt → send prompt to agent
GET  /api/agent/:id/history → conversation history
DELETE /api/agent/:id     → terminate agent

Agent config: { model, tools[], memory, stake_amount }
Agents must maintain minimum CLAWD stake (slashed for bad behavior)
```

#### 3. CLI (`@clawd/cli`)
```
npm install -g @clawd/cli

clawd init --wallet ./wallet.json
clawd models list
clawd chat "explain this contract" --model claude-sonnet-4-5

clawd agent create --name my-agent --stake 1000
clawd agent prompt "do x" --agent my-agent
clawd agent stake --add 500

clawd pay --amount 1000  # pay CLAWD for API credits
```

#### 4. x402 SDK Integration
```
npm install @clawd/x402-sdk

const { ClawdGateway } = require('@clawd/x402-sdk');
const gateway = new ClawdGateway({ apiKey: 'your-key' });

// Automatic payment handling
const response = await gateway.chat.completions({
  model: 'claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'hi' }]
});
```

#### 5. Staking + Slash Mechanism
```
Agents must stake CLAWD to access the gateway.
Stake tiers:
  - 1,000 CLAWD:    1,000 req/day, rate limited
  - 10,000 CLAWD:   unlimited, priority queue
  - 100,000 CLAWD:  unlimited + revenue share (10% of gateway fees)

Slashed if:
  - Agent spams / abuses gateway
  - Agent promotes scams / illegal content
  - Agent violates terms of service
```

---

## 📋 Build Steps

### Phase 1 — LLM Gateway MVP (WEEK 1-2)
- Deploy `/api/v1/chat/completions` route
- Route to Gemini 2.0 Flash only (cheapest, fastest to integrate)
- API key auth in Postgres
- Basic burn mechanism: `burn CLAWD per token` on each request
- Test: call gateway from CLI against live models

### Phase 2 — Model Expansion (WEEK 3-4)
- Add Claude Sonnet 4-5 and GPT-4o routes
- Smart router: cheapest-first with fallback
- Rate limiting per API key
- Dashboard: view usage per key

### Phase 3 — Agent API (WEEK 5-6)
- `/api/agent/*` endpoints
- Agent config + stake management
- Slash mechanism
- Agent registry (public list of registered agents)

### Phase 4 — CLI + x402 SDK (WEEK 7-8)
- Publish `@clawd/cli` npm package
- Publish `@clawd/x402-sdk` npm package
- TypeScript, full OpenAI SDK compatibility shim
- README + quickstart guide

### Phase 5 — Revenue Share (WEEK 9+)
- Implement stake-tier revenue share (10% of gateway fees → stakers)
- Boot in closed beta: invite 3-5 builders only
- Measure 90 days, expand access based on usage data

---

## 💰 Revenue Model

- **Burn on use:** Every LLM token consumed burns CLAWD (deflation)
- **Stake tiers:** Higher stake = more access + revenue share (aligns agents with protocol success)
- **x402 payments:** Direct CLAWD payments per request, burned on receipt
- **No mark-up on model costs** — compete on utility, not price

---

## 🔗 Dependencies

- OpenAI API key (existing or new)
- Anthropic API key (existing - CLAWD's Haiku key)
- Google Gemini API key (new)
- x402 SDK + infrastructure
- Vercel serverless (existing)
- Existing CLAWD token contract on Base
- Postgres (existing)

---

## 🚫 Risks

- **API key costs:** Gateway burns CLAWD but must pay model providers in USD. Need to price CLAWD/token carefully so burn rate > cost rate.
- **Spam/abuse:** Without effective rate limiting and slash mechanism, gateway gets abused.
- **Model availability:** OpenAI/Anthropic could change API pricing unexpectedly. Need fallback routing.
- **x402 dependency:** x402 must be live and stable for payments.
- **Complexity creep:** Don't build everything at once. Ship gateway only, measure 90 days.

---

## ✅ Success Metrics

- Gateway handles 1,000+ requests/day within 60 days of launch
- 5+ external agents registered in closed beta
- CLAWD burned via gateway > $500/mo equivalent within 90 days
- Average response latency < 3s for routed requests
- Zero slash incidents from registered agents in first 90 days
