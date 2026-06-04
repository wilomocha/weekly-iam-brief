/**
 * Weekly content generator — runs in GitHub Actions, never in the browser.
 * Writes public/feed.json and public/comics.json, which are committed and
 * deployed as static assets.
 *
 * Requires env var: ANTHROPIC_API_KEY
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const COMICS_PATH = join(ROOT, 'public', 'comics.json')
const FEED_PATH = join(ROOT, 'public', 'feed.json')

const API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5'

const KEY = process.env.ANTHROPIC_API_KEY
if (!KEY) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1) }

async function callAnthropic(payload) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 300)}`)
  }
  return res.json()
}

function extractText(data) {
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n')
}

// ── Feed ─────────────────────────────────────────────────────────────────────

const FOCUS = 'Identity & Access Management (IAM) security: CVEs, vendor advisories (Okta, Microsoft Entra/Azure AD, Ping), credential/identity breaches, CISA guidance'
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
  // salvage individual objects
  const items = []
  const re = /\{[^{}]*"title"[^{}]*\}/g
  let hit
  while ((hit = re.exec(text)) !== null) {
    try { const o = JSON.parse(hit[0]); if (o.title) items.push(o) } catch {}
  }
  return items
}

async function generateFeed() {
  console.log('Fetching news feed via Anthropic web search…')
  const today = new Date().toISOString().slice(0, 10)
  const prompt = `Today is ${today}. You are a security operations analyst writing a weekly brief for an engineer who is the SOLE owner of their company's identity/access systems. Use web search (run a few different queries) for the most RECENT items (~past 3 weeks) about: ${FOCUS}. Mix: new CVEs/vulnerabilities, vendor advisories/product changes, identity/credential breaches, and authoritative guidance (CISA/NCSC/NIST). Prioritize things this engineer must ACT on. After searching, reply with ONLY compact JSON of the exact shape {"items":[{...}]} (fields: title, summary <=18 words, category vulnerability|breach|vendor|guidance|trend, severity high|medium|low, actionable true|false, action <=10 words or empty, source publisher, url https://…, date YYYY-MM-DD), AT MOST 5 items, highest severity / most actionable first. Keep every string short so the JSON is complete.`

  const data = await callAnthropic({
    model: MODEL,
    max_tokens: 1024,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: prompt }],
  })

  const text = extractText(data)
  const items = parseItems(text)
  if (!items.length) throw new Error(`No items parsed. Raw:\n${text.slice(0, 400)}`)

  return { items: sortItems(items), generatedAt: new Date().toISOString() }
}

// ── Comic ────────────────────────────────────────────────────────────────────

const VALID_POSES = ['neutral', 'panic', 'shrug', 'point-left', 'point-right']
const VALID_MOODS = ['neutral', 'happy', 'worried']
const VALID_POS = ['left', 'right', 'center']

function validateComic(c) {
  if (!c || typeof c.title !== 'string' || !c.title.trim()) throw new Error('missing title')
  if (!Array.isArray(c.panels) || c.panels.length !== 4) throw new Error('need exactly 4 panels')
  for (const panel of c.panels) {
    if (!Array.isArray(panel.fig) || panel.fig.length < 1) throw new Error('panel needs fig array')
    for (const f of panel.fig) {
      if (!VALID_POS.includes(f.p)) throw new Error(`bad position: ${f.p}`)
      if (!VALID_POSES.includes(f.pose)) throw new Error(`bad pose: ${f.pose}`)
      if (!VALID_MOODS.includes(f.mood)) throw new Error(`bad mood: ${f.mood}`)
      if (typeof f.line !== 'string' || !f.line.trim()) throw new Error('fig needs line text')
    }
  }
}

function parseComic(text) {
  // Try to extract a JSON object from the response
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('no JSON object found in response')
  return JSON.parse(m[0])
}

async function generateComic(existingComics) {
  console.log(`Generating new comic (${existingComics.length} existing)…`)

  const existingTitles = existingComics.map(c => `"${c.title}"`).join(', ')
  const existingPremises = existingComics.map((c, i) => `${i + 1}. ${c.title} — ${c.premise || c.title}`).join('\n')

  const schemaDesc = `{
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
${schemaDesc}

Valid values:
- p (position): "left", "right", "center"
- pose: "neutral", "panic", "shrug", "point-left", "point-right"
- mood: "neutral", "happy", "worried"`

  const data = await callAnthropic({
    model: MODEL,
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = extractText(data)
  const comic = parseComic(text)
  validateComic(comic)
  return comic
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Load existing data
  const existingComics = JSON.parse(readFileSync(COMICS_PATH, 'utf8'))
  console.log(`Loaded ${existingComics.length} existing comics.`)

  // Run both jobs; if comic fails we still want to save the feed
  const [feedResult, comicResult] = await Promise.allSettled([
    generateFeed(),
    generateComic(existingComics),
  ])

  if (feedResult.status === 'fulfilled') {
    writeFileSync(FEED_PATH, JSON.stringify(feedResult.value, null, 2) + '\n')
    console.log(`✓ Feed written (${feedResult.value.items.length} items)`)
  } else {
    console.error('✗ Feed generation failed:', feedResult.reason.message)
    process.exitCode = 1
  }

  if (comicResult.status === 'fulfilled') {
    const newComic = comicResult.value
    const updated = [...existingComics, newComic]
    writeFileSync(COMICS_PATH, JSON.stringify(updated, null, 2) + '\n')
    console.log(`✓ Comic appended: "${newComic.title}" (total: ${updated.length})`)
  } else {
    console.error('✗ Comic generation failed:', comicResult.reason.message)
    process.exitCode = 1
  }
}

main().catch(e => { console.error(e); process.exit(1) })
