# SPEC.md — clawd-agent-launcher

## Austin's Exact Words

> here is the next thing to build using ethskills.com https://github.com/clawdbotatg/clawd-agent-launcher

## Overview

**The "CLAWD as ETH for AI agents" thesis.** Infrastructure layer: LLM Gateway + Agent API + CLI + x402 SDK. CLAWD becomes the fuel — every API call burns CLAWD.

This MVP (Phase 1) ships:
- OpenAI-compatible LLM Gateway routing to Gemini 2.0 Flash
- API key management (JSON file persistence)
- CLAWD burn-per-request logging
- CLI (`@clawd/cli`) for chat and key management
- x402 SDK (`@clawd/x402-sdk`) TypeScript wrapper
- Frontend dashboard for key management and usage stats

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Dashboard                     │
│  Landing / Dashboard / Docs — Next.js standalone app     │
└─────────────────┬───────────────────────────────────────┘
                  │ fetch()
┌─────────────────▼───────────────────────────────────────┐
│                    LLM Gateway (API)                      │
│  POST /api/v1/chat/completions                           │
│  POST /api/keys/create                                    │
│  GET  /api/keys/status?key=...                            │
│                                                           │
│  Auth: Bearer <apiKey>                                    │
│  Model Router: gemini-2.0-flash → Google Gemini API       │
│  Burn: log CLAWD per token to data/api-keys.json          │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
  CLI         x402-SDK      Burn Logger
  @clawd/cli  @clawd/x402   data/api-keys.json
```

## Component Inventory

| Component | Path | Description |
|-----------|------|-------------|
| LLM Gateway | `packages/api/` | Next.js API routes, OpenAI-compatible |
| CLI | `packages/cli/` | TypeScript CLI, `@clawd/cli` |
| x402 SDK | `packages/x402-sdk/` | TypeScript SDK, `@clawd/x402-sdk` |
| Frontend | `packages/frontend/` | Next.js dashboard |
| Data | `data/` | JSON file persistence |

## Smart Contract Decision

**0 new contracts for MVP.** The CLAWD token already exists at `0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07` on Base. Burn mechanism uses `transfer(address(0), amount)` from a burner wallet. No trustless requirement for Phase 1 — this is a centralized gateway MVP to prove usage before decentralizing.

## Key Addresses

- **CLAWD Token:** `0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07` (Base, chain 8453)
- **Burn Address:** `0x0000000000000000000000000000000000000000`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GATEWAY_SECRET` | Secret for key creation endpoint | Yes |
| `BASE_RPC_URL` | Base mainnet RPC | Yes (for burn) |
| `BURNER_PRIVATE_KEY` | Wallet private key for CLAWD burns | Yes (for burn) |
| `NEXT_PUBLIC_API_URL` | Gateway URL for frontend | Yes |

## Burn Economics (Phase 1)

- 1 input token = 1 CLAWD burned (18 decimals, so 1e18 wei per token)
- 1 output token = 3 CLAWD burned
- Burn is logged to JSON, actual onchain burn is batched (not per-request for gas efficiency)

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 (MVP) | Gemini Flash + JSON persistence + CLI + SDK | ✅ Building |
| 2 | Claude + GPT routes, rate limiting | Planned |
| 3 | Agent API, slash mechanism | Planned |
| 4 | Postgres migration, production hardening | Planned |
| 5 | Stake tiers, revenue share | Planned |

## Security Checklist (per ethskills.com/security)

- [x] No secrets in git — all in `.env`, `.gitignore` covers `.env*`
- [x] API key auth on all endpoints
- [x] Input validation on all routes
- [x] No infinite approvals
- [x] Burn amount bounds-checked
- [x] Rate limiting planned for Phase 2
