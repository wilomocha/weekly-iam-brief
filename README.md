# Ops Console — Weekly IAM Dashboard

A weekly operations dashboard for an engineer who is the sole owner of their company's identity/access systems. Provides a live IAM security news feed (powered by the Anthropic API with web search) and a rotating stick-figure comic strip.

## How it works

A GitHub Actions cron job runs **every Monday at 07:00 UTC**. It calls the Anthropic API (with web search) to fetch the latest IAM security news and generate a brand-new comic strip, then commits `public/feed.json` and `public/comics.json` to `main`. That commit triggers the deploy workflow, which builds and pushes to Cloudflare Workers. The browser just loads static JSON — the Anthropic key is never exposed to the browser.

## Features

- **Weekly IAM feed** — CVEs, vendor advisories (Okta, Entra/Azure AD, Ping), credential/identity breaches, CISA/NCSC/NIST guidance, refreshed every Monday
- **Split view** — "Action required" items (highlighted, amber border) shown first, then "Latest in your area"
- **Comic of the week** — starts with 12 seed strips; a new AI-generated strip is added each week, premises tracked so they never repeat; shuffle + Save as JPG

## Tech stack

Vite + React 18, plain JavaScript. No CSS framework. Cloudflare Workers serves the SPA as pure static assets. The Anthropic API is only ever called from GitHub Actions — never from the browser or the Worker.

## Setup

### Prerequisites

- Node 20+
- A Cloudflare account with Workers enabled
- An Anthropic API key with **web search enabled** for your organisation (console.anthropic.com → Settings → Enable web search)

### Local development

```bash
npm install
npm run dev   # http://localhost:5173
```

The app loads `public/feed.json` and `public/comics.json` directly — no server needed for the frontend. The JSON files are already seeded in the repo, so the dashboard will show the seed data immediately.

To run the content generator locally (requires your Anthropic key):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
node scripts/generate-weekly.mjs
```

This updates `public/feed.json` and appends a new strip to `public/comics.json`. Run `npm run dev` afterwards to see the result.

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
| `weekly.yml` | Every Monday 07:00 UTC + manual | Calls Anthropic API, updates `public/feed.json` and `public/comics.json`, commits and pushes to `main` |
| `deploy.yml` | Every push to `main` + manual | Runs `npm ci && npm run build`, deploys to Cloudflare Workers |

The weekly job's push to `main` automatically triggers the deploy, so the live site is always up to date within minutes of the Monday update.

### Required GitHub Actions secrets

Set these in your repository → Settings → Secrets and variables → Actions:

| Secret | Used by | Where to get it |
|--------|---------|----------------|
| `ANTHROPIC_API_KEY` | `weekly.yml` | [console.anthropic.com](https://console.anthropic.com) — confirm web search is enabled for your org |
| `CLOUDFLARE_API_TOKEN` | `deploy.yml` | Cloudflare → My Profile → API Tokens → token with **Workers Scripts: Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | `deploy.yml` | Cloudflare → Workers & Pages overview → right sidebar |

```bash
gh secret set ANTHROPIC_API_KEY
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

## Cost & usage notes

- **One Anthropic API call per week** — two requests per run (news feed + comic generation), both with web search enabled. Web search is a billed add-on; check your Anthropic usage dashboard.
- Previously generated comics accumulate in `public/comics.json`. Each new strip's premises are fed back to the model so it picks a genuinely new angle every week.
- The Cloudflare Worker only serves static files — no compute cost beyond the free tier in normal usage.

## Disclaimer

The feed items, severity ratings, and "actionable" flags are produced by an AI model — they are a triage aid, not verified security intelligence. **Always click through to the source before acting on anything flagged as high-severity.** The model may hallucinate sources or misclassify severity.