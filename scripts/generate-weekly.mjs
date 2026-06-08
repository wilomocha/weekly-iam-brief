/**
 * Weekly content generator — runs in GitHub Actions, never in the browser.
 * Writes public/feed.json and public/comics.json.
 *
 * Required env:
 *   AI_API_KEY   — API key for the chosen provider
 *
 * Optional env:
 *   AI_PROVIDER  — anthropic (default) | openai | xai | openai-compatible
 *   AI_MODEL     — override the default model for the chosen provider
 *   AI_BASE_URL  — base URL override (useful for openai-compatible providers)
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COMICS_PATH = join(ROOT, 'public', 'comics.json')
const FEED_PATH   = join(ROOT, 'public', 'feed.json')

const AI_KEY      = process.env.AI_API_KEY
const AI_PROVIDER = (process.env.AI_PROVIDER || 'anthropic').toLowerCase()
const AI_MODEL    = process.env.AI_MODEL || ''
const AI_BASE_URL = process.env.AI_BASE_URL || ''

if (!AI_KEY) { console.error('AI_API_KEY not set'); process.exit(1) }

// ── Provider adapters ─────────────────────────────────────────────────────────
//
// Each adapter exports:
//   complete(prompt, { webSearch }) → string  (the model's text response)
//
// "webSearch: true" means the adapter should use the provider's built-in web
// search capability when available. Providers without native search fall back
// to knowledge-cutoff data and note it in the prompt.

// ── Anthropic ─────────────────────────────────────────────────────────────────
const ANTHROPIC_DEFAULTS = {
  baseUrl: 'https://api.anthropic.com/v1',
  model: 'claude-sonnet-4-5',
}

async function completeAnthropic(prompt, { webSearch }) {
  const { baseUrl, model } = ANTHROPIC_DEFAULTS
  const resolvedModel = AI_MODEL || model

  const body = {
    model: resolvedModel,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  }
  if (webSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }]
  }

  const res = await fetch(`${baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`)
  }
  const data = await res.json()
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
}

// ── OpenAI (Responses API — supports native web_search_preview) ──────────────
const OPENAI_DEFAULTS = {
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
}

async function completeOpenAI(prompt, { webSearch }) {
  const baseUrl = AI_BASE_URL || OPENAI_DEFAULTS.baseUrl
  const resolvedModel = AI_MODEL || OPENAI_DEFAULTS.model

  // Use the Responses API when web search is needed (supports web_search_preview tool).
  // Fall back to Chat Completions for non-search requests.
  if (webSearch) {
    const body = {
      model: resolvedModel,
      tools: [{ type: 'web_search_preview' }],
      input: prompt,
    }
    const res = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_KEY}` },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`OpenAI Responses ${res.status}: ${t.slice(0, 300)}`)
    }
    const data = await res.json()
    // Responses API: output is an array of items; grab text content blocks
    const text = (data.output || [])
      .flatMap(item => (item.content || []))
      .filter(b => b.type === 'output_text')
      .map(b => b.text)
      .join('\n')
    if (!text) throw new Error('OpenAI Responses API returned no text output')
    return text
  }

  // Chat Completions for comic generation (no web search needed)
  const body = {
    model: resolvedModel,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  }
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenAI Chat ${res.status}: ${t.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── xAI / Grok (OpenAI-compatible + search_parameters for live search) ────────
const XAI_DEFAULTS = {
  baseUrl: 'https://api.x.ai/v1',
  model: 'grok-3',
}

async function completeXAI(prompt, { webSearch }) {
  const baseUrl = AI_BASE_URL || XAI_DEFAULTS.baseUrl
  const resolvedModel = AI_MODEL || XAI_DEFAULTS.model

  const body = {
    model: resolvedModel,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  }
  // Grok live search is enabled via search_parameters in the request body
  if (webSearch) {
    body.search_parameters = { mode: 'auto' }
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`xAI ${res.status}: ${t.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Generic OpenAI-compatible (e.g. Mistral, Together, local Ollama) ──────────
// No built-in web search; uses Chat Completions only.
async function completeOpenAICompatible(prompt) {
  if (!AI_BASE_URL) throw new Error('AI_BASE_URL must be set for openai-compatible provider')
  const resolvedModel = AI_MODEL
  if (!resolvedModel) throw new Error('AI_MODEL must be set for openai-compatible provider')

  const body = {
    model: resolvedModel,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  }
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`OpenAI-compatible ${res.status}: ${t.slice(0, 300)}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── Provider dispatch ─────────────────────────────────────────────────────────
const PROVIDERS_WITH_SEARCH = new Set(['anthropic', 'openai', 'xai'])

async function complete(prompt, { webSearch = false } = {}) {
  const hasSearch = PROVIDERS_WITH_SEARCH.has(AI_PROVIDER) && webSearch
  const searchNote = webSearch && !hasSearch
    ? '\n(Note: live web search not available for this provider — use your most recent training data.)'
    : ''

  switch (AI_PROVIDER) {
    case 'anthropic':         return completeAnthropic(prompt + searchNote, { webSearch })
    case 'openai':            return completeOpenAI(prompt + searchNote, { webSearch })
    case 'xai':               return completeXAI(prompt + searchNote, { webSearch })
    case 'openai-compatible': return completeOpenAICompatible(prompt + searchNote)
    default: throw new Error(`Unknown AI_PROVIDER "${AI_PROVIDER}". Valid: anthropic, openai, xai, openai-compatible`)
  }
}

console.log(`Provider: ${AI_PROVIDER}  Model: ${AI_MODEL || '(default)'}`)

// ── Feed ──────────────────────────────────────────────────────────────────────
const SEV_ORDER = { high: 0, medium: 1, low: 2 }

function sortItems(items) {
  return items.slice().sort((a, b) => {
    if (a.actionable !== b.actionable) return a.actionable ? -1 : 1
    return (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)
  })
}

function parseItems(text) {
  const m = text.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      const p = JSON.parse(m[0])
      if (Array.isArray(p.items)) return p.items
    } catch {}
  }
  // salvage individual item objects
  const items = []
  const re = /\{[^{}]*"title"[^{}]*\}/g
  let hit
  while ((hit = re.exec(text)) !== null) {
    try { const o = JSON.parse(hit[0]); if (o.title) items.push(o) } catch {}
  }
  return items
}

async function generateFeed() {
  console.log('Generating news feed…')
  const today = new Date().toISOString().slice(0, 10)
  const focus = 'Identity & Access Management (IAM) security: CVEs, vendor advisories (Okta, Microsoft Entra/Azure AD, Ping), credential/identity breaches, CISA guidance'

  const prompt = `Today is ${today}. You are a security operations analyst writing a weekly brief for an engineer who is the SOLE owner of their company's identity/access systems. Search for (or recall from your most recent knowledge) the most RECENT items (~past 3 weeks) about: ${focus}. Mix: new CVEs/vulnerabilities, vendor advisories/product changes, identity/credential breaches, and authoritative guidance (CISA/NCSC/NIST). Prioritize things this engineer must ACT on. Reply with ONLY compact JSON of the exact shape {"items":[{...}]} (fields: title, summary <=18 words, category vulnerability|breach|vendor|guidance|trend, severity high|medium|low, actionable true|false, action <=10 words or empty, source publisher, url https://…, date YYYY-MM-DD), AT MOST 5 items, highest severity / most actionable first. Keep every string short so the JSON is complete.`

  const text = await complete(prompt, { webSearch: true })
  const items = parseItems(text)
  if (!items.length) throw new Error(`No items parsed. Raw:\n${text.slice(0, 400)}`)
  return { items: sortItems(items), generatedAt: new Date().toISOString() }
}

// ── Comic ─────────────────────────────────────────────────────────────────────
const VALID_POSES = new Set(['neutral', 'panic', 'shrug', 'point-left', 'point-right'])
const VALID_MOODS = new Set(['neutral', 'happy', 'worried'])
const VALID_POS   = new Set(['left', 'right', 'center'])

function validateComic(c) {
  if (!c || typeof c.title !== 'string' || !c.title.trim()) throw new Error('missing title')
  if (!Array.isArray(c.panels) || c.panels.length !== 4) throw new Error('need exactly 4 panels')
  for (const panel of c.panels) {
    if (!Array.isArray(panel.fig) || panel.fig.length < 1) throw new Error('panel needs fig array')
    for (const f of panel.fig) {
      if (!VALID_POS.has(f.p))    throw new Error(`bad position: ${f.p}`)
      if (!VALID_POSES.has(f.pose)) throw new Error(`bad pose: ${f.pose}`)
      if (!VALID_MOODS.has(f.mood)) throw new Error(`bad mood: ${f.mood}`)
      if (typeof f.line !== 'string' || !f.line.trim()) throw new Error('fig needs line text')
    }
  }
}

function parseComic(text) {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('no JSON object found in response')
  return JSON.parse(m[0])
}

async function generateComic(existingComics) {
  console.log(`Generating comic (${existingComics.length} existing)…`)

  const existingPremises = existingComics
    .map((c, i) => `${i + 1}. ${c.title} — ${c.premise || c.title}`)
    .join('\n')

  const schema = `{
  "title": "short strip title",
  "premise": "one-sentence premise description",
  "panels": [
    {
      "cap": "optional caption string or null",
      "fig": [
        {
          "p": "left|right|center",
          "line": "speech bubble text (keep under 40 chars)",
          "pose": "neutral|panic|shrug|point-left|point-right",
          "mood": "neutral|happy|worried"
        }
      ]
    }
  ]
}`

  const prompt = `You are writing a 4-panel stick-figure comic strip for a weekly IAM (Identity & Access Management) operations dashboard. The audience is a software engineer who is the sole owner of their company's IAM/SSO/secrets systems — dry workplace humour about the absurdities of being the only person who understands access control.

EXISTING STRIPS (do NOT repeat any of these themes or premises):
${existingPremises}

Write ONE new original strip. Rules:
- Exactly 4 panels.
- Each panel has an optional caption string (or null) and a "fig" array of 1–3 figures.
- Keep every "line" under 40 characters so it fits in a speech bubble.
- Use dry, deadpan humour. No slapstick. Short punchy lines.
- The punchline lands in panel 4.
- Pick a fresh angle not covered by the existing strips above.

Reply with ONLY valid JSON matching this exact schema (no markdown fences, no commentary):
${schema}

Valid values — p: "left","right","center" · pose: "neutral","panic","shrug","point-left","point-right" · mood: "neutral","happy","worried"`

  const text = await complete(prompt, { webSearch: false })
  const comic = parseComic(text)
  validateComic(comic)
  return comic
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const existingComics = JSON.parse(readFileSync(COMICS_PATH, 'utf8'))
  console.log(`Loaded ${existingComics.length} existing comics.`)

  const [feedResult, comicResult] = await Promise.allSettled([
    generateFeed(),
    generateComic(existingComics),
  ])

  if (feedResult.status === 'fulfilled') {
    writeFileSync(FEED_PATH, JSON.stringify(feedResult.value, null, 2) + '\n')
    console.log(`✓ Feed written (${feedResult.value.items.length} items)`)
  } else {
    console.error('✗ Feed failed:', feedResult.reason.message)
    process.exitCode = 1
  }

  if (comicResult.status === 'fulfilled') {
    const comic = comicResult.value
    writeFileSync(COMICS_PATH, JSON.stringify([...existingComics, comic], null, 2) + '\n')
    console.log(`✓ Comic appended: "${comic.title}" (total: ${existingComics.length + 1})`)
  } else {
    console.error('✗ Comic failed:', comicResult.reason.message)
    process.exitCode = 1
  }
}

main().catch(e => { console.error(e); process.exit(1) })
