# Ops Console — Weekly IAM Dashboard

A weekly operations dashboard for an engineer who is the sole owner of their company's identity/access systems. Provides a live IAM security news feed (powered by the Anthropic API with web search) and a rotating stick-figure comic strip.

## Features

- **Live IAM feed** — CVEs, vendor advisories (Okta, Entra/Azure AD, Ping), credential/identity breaches, CISA/NCSC/NIST guidance
- **Split view** — "Action required" items (highlighted, amber border) shown first, then "Latest in your area"
- **Comic of the week** — 12 strips, weekly rotation, shuffle + Save as JPG
- Feed and UI state persisted in `localStorage`

## Tech stack

Vite + React 18, plain JavaScript. No CSS framework. Cloudflare Workers (serves the SPA and `/api/news`). All Anthropic calls happen server-side — the API key is never exposed to the browser.

## Setup

### Prerequisites

- Node 20+
- A Cloudflare account with Workers enabled
- An Anthropic API key with **web search enabled** for your organisation (console.anthropic.com → Settings → Enable web search)

### Local development

```bash
npm install
```

Create a `.env.local` file (never commit this):

```
# .env.local  — local dev only, never committed
ANTHROPIC_API_KEY=sk-ant-...
```

Run the Vite dev server alongside a local Wrangler dev session:

```bash
# Terminal 1 — Vite (frontend hot-reload)
npm run dev

# Terminal 2 — Wrangler (Worker + /api/news)
npx wrangler dev --port 8787
```

Open the Vite URL (e.g. http://localhost:5173). For full end-to-end testing use the Wrangler URL (http://localhost:8787) after running `npm run build` first:

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

The workflow in `.github/workflows/deploy.yml` runs on every push to `main` (and manually via workflow_dispatch). It:

1. Installs dependencies
2. Runs `npm run build`
3. Deploys to Cloudflare Workers via `wrangler deploy`
4. Uploads `ANTHROPIC_API_KEY` as a Worker secret at deploy time

### Required GitHub Actions secrets

Set these in your repository → Settings → Secrets and variables → Actions:

| Secret | Where to get it |
|--------|----------------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) — confirm web search is enabled for your org |
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens — create a token with **Workers Scripts: Edit** permission |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar on the Workers & Pages overview page |

You can set them with the GitHub CLI (values are never stored in the repo):

```bash
gh secret set ANTHROPIC_API_KEY
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

## Cost & usage notes

- **Each feed refresh is one Anthropic API request** with web search enabled. Web search is a billed add-on — check your Anthropic usage dashboard.
- The Worker is stateless. Caching happens entirely in the browser's `localStorage`.

## Disclaimer

The feed items, severity ratings, and "actionable" flags are produced by an AI model — they are a triage aid, not verified security intelligence. **Always click through to the source before acting on anything flagged as high-severity.** The model may hallucinate sources or misclassify severity.