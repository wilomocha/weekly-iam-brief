# Ops Console — Weekly IAM Dashboard

A weekly operations dashboard for an engineer who is the sole owner of their company's identity/access systems. Provides a live IAM security news feed and a rotating stick-figure comic strip, both AI-generated.

## How it works

A GitHub Actions cron job runs **every Monday at 07:00 UTC**. It calls your chosen AI provider to fetch the latest IAM security news and generate a brand-new comic strip, then commits `public/feed.json` and `public/comics.json` to `main`. That commit triggers the deploy workflow, which builds and pushes to Cloudflare Workers. The browser just loads static JSON — your AI key is never exposed to the browser or the Worker.

## Features

- **Weekly IAM feed** — CVEs, vendor advisories (Okta, Entra/Azure AD, Ping), credential/identity breaches, CISA/NCSC/NIST guidance, refreshed every Monday
- **Split view** — "Action required" items (highlighted, amber border) shown first, then "Latest in your area"
- **Comic of the week** — starts with 12 seed strips; a new AI-generated strip is added each week, all premises tracked so they never repeat; shuffle + Save as JPG

## Tech stack

Vite + React 18, plain JavaScript. No CSS framework. Cloudflare Workers serves the SPA as pure static assets. The AI API is only ever called from GitHub Actions — never from the browser or the Worker.

## Supported AI providers

| `AI_PROVIDER` | Default model | Web search |
|--------------|--------------|-----------|
| `anthropic` (default) | `claude-sonnet-4-5` | Built-in (`web_search` tool) |
| `openai` | `gpt-4o` | Built-in (Responses API `web_search_preview`) |
| `xai` | `grok-3` | Built-in (`search_parameters`) |
| `openai-compatible` | set via `AI_MODEL` | None (uses training data) |

For `openai-compatible` (Mistral, Together AI, local Ollama, etc.) you must also set `AI_BASE_URL` and `AI_MODEL`.

## Setup

### Prerequisites

- Node 20+
- A Cloudflare account with Workers enabled
- An API key from your chosen AI provider

### Local development

```bash
npm install
npm run dev   # http://localhost:5173
```

The app loads `public/feed.json` and `public/comics.json` directly — no server needed for the frontend. The JSON files are already seeded, so the dashboard shows content immediately.

To run the content generator locally:

```bash
# Anthropic (default)
export AI_API_KEY=sk-ant-...
node scripts/generate-weekly.mjs

# OpenAI
export AI_API_KEY=sk-...
export AI_PROVIDER=openai
node scripts/generate-weekly.mjs

# xAI / Grok
export AI_API_KEY=xai-...
export AI_PROVIDER=xai
node scripts/generate-weekly.mjs

# OpenAI-compatible (e.g. Mistral)
export AI_API_KEY=...
export AI_PROVIDER=openai-compatible
export AI_BASE_URL=https://api.mistral.ai/v1
export AI_MODEL=mistral-large-latest
node scripts/generate-weekly.mjs
```

For full end-to-end testing with Wrangler:

```bash
npm run build
npx wrangler dev --port 8787
```

### Production build

```bash
npm ci
npm run build   # outputs to dist/
```

## Deployment (GitHub Actions → Cloudflare Workers)

Two workflows work together:

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `weekly.yml` | Every Monday 07:00 UTC + manual | Calls AI provider, updates `public/feed.json` and `public/comics.json`, commits and pushes to `main` |
| `deploy.yml` | Every push to `main` + manual | Runs `npm ci && npm run build`, deploys to Cloudflare Workers |

The weekly job's push to `main` automatically triggers the deploy.

### Required GitHub Actions secrets and variables

Go to your repository → **Settings → Secrets and variables → Actions**.

**Secrets** (encrypted):

| Secret | Used by | Value |
|--------|---------|-------|
| `AI_API_KEY` | `weekly.yml` | Your API key for the chosen provider |
| `CLOUDFLARE_API_TOKEN` | `deploy.yml` | Cloudflare token with **Workers Scripts: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy.yml` | Cloudflare → Workers & Pages overview → right sidebar |

```bash
gh secret set AI_API_KEY
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

**Variables** (plain text, visible in logs — do not put keys here):

| Variable | Default | Value |
|----------|---------|-------|
| `AI_PROVIDER` | `anthropic` | `anthropic` \| `openai` \| `xai` \| `openai-compatible` |
| `AI_MODEL` | provider default | e.g. `gpt-4o-mini`, `grok-3-mini`, `claude-haiku-4-5` |
| `AI_BASE_URL` | provider default | Required only for `openai-compatible` |

```bash
gh variable set AI_PROVIDER   # e.g. openai
gh variable set AI_MODEL      # optional
gh variable set AI_BASE_URL   # only for openai-compatible
```

## Cost & usage notes

- **Two AI API requests per week** — one for the news feed (with web search where supported), one for the comic. Web search is a billed add-on on Anthropic and OpenAI; check your provider's usage dashboard.
- Previously generated comics accumulate in `public/comics.json`. Each new strip's title and premise are fed back to the model so it always picks a genuinely new angle.
- The Cloudflare Worker only serves static files — no compute cost beyond the free tier.

## Disclaimer

Feed items, severity ratings, and "actionable" flags are AI-generated — they are a triage aid, not verified security intelligence. **Always click through to the source before acting on anything flagged as high-severity.** The model may hallucinate sources or misclassify severity.
